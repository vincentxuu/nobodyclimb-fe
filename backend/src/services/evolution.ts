import { D1Database } from '@cloudflare/workers-types'
import { Env } from '../types'
import { gradeToNumeric } from '../utils/grade'
import { generateId } from '../utils/id'

// ============================================
// 型別定義
// ============================================

interface AscentStats {
  totalCount: number
  completionRateByType: Record<string, number>
  avgAttemptsByType: Record<string, number>
  breakthroughType: string | null
  onsightRateByType: Record<string, number>
  projectRatio: number
  uniqueRouteRatio: number
  leadRatio: number
  breakthroughFrequency: number
  activeMonths: number
  onsightMaxGrade: number
  redpointMaxGrade: number
}

interface BehaviorSignals {
  power_signal: number
  goal_signal: number
  bold_signal: number
}

interface QuizBaseline {
  power_pct: number
  goal_pct: number
  bold_pct: number
}

interface BlendedScores {
  power_pct: number
  goal_pct: number
  bold_pct: number
}

interface SpectrumPosition {
  position: string
  nameZh: string
  name: string
  description: string
  growthDirection: string
}

interface EvolutionResult {
  changed: boolean
  reason?: string
  personality_type?: string
  power_pct?: number
  goal_pct?: number
  bold_pct?: number
  style_spectrum?: number | null
  consecutive_count?: number
  weeks_stable?: number
}

// ============================================
// EvolutionService
// ============================================

export class EvolutionService {
  /** 3.1 查詢用戶攀登統計 */
  async getAscentStats(userId: string, db: D1Database): Promise<AscentStats> {
    // 並行查詢所有需要的資料
    const [
      ascentsResult,
      routeTypesResult,
      onsightResult,
      projectResult,
      uniqueRouteResult,
      leadTopropeResult,
      breakthroughResult,
      activeMonthsResult,
      onsightMaxResult,
      redpointMaxResult,
    ] = await Promise.all([
      // 總記錄數
      db
        .prepare('SELECT COUNT(*) as cnt FROM user_route_ascents WHERE user_id = ?')
        .bind(userId)
        .first<{ cnt: number }>(),

      // 各路線類型的完成率與平均嘗試次數
      db
        .prepare(
          `SELECT r.route_type,
            COUNT(*) as total,
            SUM(CASE WHEN a.ascent_type NOT IN ('attempt') THEN 1 ELSE 0 END) as completed,
            AVG(a.attempts_count) as avg_attempts
          FROM user_route_ascents a
          JOIN routes r ON a.route_id = r.id
          WHERE a.user_id = ?
          GROUP BY r.route_type`
        )
        .bind(userId)
        .all<{
          route_type: string
          total: number
          completed: number
          avg_attempts: number
        }>(),

      // 各路線類型的 onsight 成功率
      db
        .prepare(
          `SELECT r.route_type,
            COUNT(*) as total,
            SUM(CASE WHEN a.ascent_type = 'onsight' THEN 1 ELSE 0 END) as onsight_count
          FROM user_route_ascents a
          JOIN routes r ON a.route_id = r.id
          WHERE a.user_id = ?
          GROUP BY r.route_type`
        )
        .bind(userId)
        .all<{ route_type: string; total: number; onsight_count: number }>(),

      // Project ratio: 同一 user+route 有 >3 筆紀錄的路線數 / 總 unique route 數
      db
        .prepare(
          `SELECT
            SUM(CASE WHEN cnt > 3 THEN 1 ELSE 0 END) as project_routes,
            COUNT(*) as unique_routes
          FROM (
            SELECT route_id, COUNT(*) as cnt
            FROM user_route_ascents
            WHERE user_id = ?
            GROUP BY route_id
          )`
        )
        .bind(userId)
        .first<{ project_routes: number; unique_routes: number }>(),

      // Unique route count / total ascent count
      db
        .prepare(
          `SELECT
            COUNT(DISTINCT route_id) as unique_routes,
            COUNT(*) as total_ascents
          FROM user_route_ascents WHERE user_id = ?`
        )
        .bind(userId)
        .first<{ unique_routes: number; total_ascents: number }>(),

      // Lead / (lead + toprope) ratio
      db
        .prepare(
          `SELECT
            SUM(CASE WHEN ascent_type = 'lead' THEN 1 ELSE 0 END) as lead_count,
            SUM(CASE WHEN ascent_type IN ('lead', 'toprope') THEN 1 ELSE 0 END) as lead_toprope_count
          FROM user_route_ascents WHERE user_id = ?`
        )
        .bind(userId)
        .first<{ lead_count: number; lead_toprope_count: number }>(),

      // Breakthrough frequency: 最近 90 天內達到最高難度的次數
      db
        .prepare(
          `SELECT COUNT(*) as cnt FROM user_route_ascents a
          JOIN routes r ON a.route_id = r.id
          WHERE a.user_id = ?
            AND a.ascent_date >= date('now', '-90 days')
            AND a.ascent_type NOT IN ('attempt')
            AND r.grade = (
              SELECT r2.grade FROM user_route_ascents a2
              JOIN routes r2 ON a2.route_id = r2.id
              WHERE a2.user_id = ? AND a2.ascent_type NOT IN ('attempt')
              ORDER BY r2.grade DESC LIMIT 1
            )`
        )
        .bind(userId, userId)
        .first<{ cnt: number }>(),

      // Active months: 有攀登紀錄的月份數
      db
        .prepare(
          `SELECT COUNT(DISTINCT strftime('%Y-%m', ascent_date)) as cnt
          FROM user_route_ascents WHERE user_id = ?`
        )
        .bind(userId)
        .first<{ cnt: number }>(),

      // Onsight 最高難度
      db
        .prepare(
          `SELECT r.grade FROM user_route_ascents a
          JOIN routes r ON a.route_id = r.id
          WHERE a.user_id = ? AND a.ascent_type = 'onsight' AND r.grade IS NOT NULL
          ORDER BY r.grade DESC LIMIT 1`
        )
        .bind(userId)
        .first<{ grade: string }>(),

      // Redpoint 最高難度
      db
        .prepare(
          `SELECT r.grade FROM user_route_ascents a
          JOIN routes r ON a.route_id = r.id
          WHERE a.user_id = ? AND a.ascent_type = 'redpoint' AND r.grade IS NOT NULL
          ORDER BY r.grade DESC LIMIT 1`
        )
        .bind(userId)
        .first<{ grade: string }>(),
    ])

    const totalCount = ascentsResult?.cnt ?? 0

    // 完成率
    const completionRateByType: Record<string, number> = {}
    const avgAttemptsByType: Record<string, number> = {}
    let maxGradeType: string | null = null
    let _maxGradeValue = 0

    for (const row of routeTypesResult.results ?? []) {
      completionRateByType[row.route_type] = row.total > 0 ? row.completed / row.total : 0
      avgAttemptsByType[row.route_type] = row.avg_attempts ?? 0
    }

    // Breakthrough point: 哪個 route_type 有最高完攀難度
    // 用各類型的最高完攀難度來判斷
    const typeMaxGrades = await db
      .prepare(
        `SELECT r.route_type, MAX(r.grade) as max_grade
        FROM user_route_ascents a
        JOIN routes r ON a.route_id = r.id
        WHERE a.user_id = ? AND a.ascent_type NOT IN ('attempt')
        GROUP BY r.route_type`
      )
      .bind(userId)
      .all<{ route_type: string; max_grade: string }>()

    for (const row of typeMaxGrades.results ?? []) {
      const numGrade = gradeToNumeric(row.max_grade)
      if (numGrade > _maxGradeValue) {
        _maxGradeValue = numGrade
        maxGradeType = row.route_type
      }
    }

    // Onsight rate
    const onsightRateByType: Record<string, number> = {}
    for (const row of onsightResult.results ?? []) {
      onsightRateByType[row.route_type] = row.total > 0 ? row.onsight_count / row.total : 0
    }

    // Project ratio
    const projectRoutes = projectResult?.project_routes ?? 0
    const uniqueRoutesForProject = projectResult?.unique_routes ?? 1
    const projectRatio = uniqueRoutesForProject > 0 ? projectRoutes / uniqueRoutesForProject : 0

    // Unique route ratio
    const uniqueRoutes = uniqueRouteResult?.unique_routes ?? 0
    const totalAscents = uniqueRouteResult?.total_ascents ?? 1
    const uniqueRouteRatio = totalAscents > 0 ? uniqueRoutes / totalAscents : 0

    // Lead ratio
    const leadCount = leadTopropeResult?.lead_count ?? 0
    const leadTopropeCount = leadTopropeResult?.lead_toprope_count ?? 0
    const leadRatio = leadTopropeCount > 0 ? leadCount / leadTopropeCount : 0

    // Breakthrough frequency
    const breakthroughFrequency = breakthroughResult?.cnt ?? 0

    // Active months
    const activeMonths = activeMonthsResult?.cnt ?? 0

    // Onsight / Redpoint max grades
    const onsightMaxGrade = onsightMaxResult?.grade ? gradeToNumeric(onsightMaxResult.grade) : 0
    const redpointMaxGrade = redpointMaxResult?.grade ? gradeToNumeric(redpointMaxResult.grade) : 0

    return {
      totalCount,
      completionRateByType,
      avgAttemptsByType,
      breakthroughType: maxGradeType,
      onsightRateByType,
      projectRatio,
      uniqueRouteRatio,
      leadRatio,
      breakthroughFrequency,
      activeMonths,
      onsightMaxGrade,
      redpointMaxGrade,
    }
  }

  /** 3.2 從攀登統計計算行為訊號 */
  calculateBehaviorSignals(stats: AscentStats): BehaviorSignals {
    // Power signal: boulder 完成率 vs sport/trad 完成率差異
    const boulderCompletion = stats.completionRateByType['boulder'] ?? 0
    const sportCompletion = stats.completionRateByType['sport'] ?? 0
    const tradCompletion = stats.completionRateByType['trad'] ?? 0
    const techniqueCompletion = (sportCompletion + tradCompletion) / 2 || 0

    // 完成率差異：boulder 完成率高 → power 傾向
    const completionDiff = boulderCompletion - techniqueCompletion

    // Breakthrough bonus: 突破點在 boulder → power
    const breakthroughBonus = stats.breakthroughType === 'boulder' ? 0.3 : 0

    // 嘗試次數模式：boulder 平均嘗試次數少 → power 傾向
    const boulderAttempts = stats.avgAttemptsByType['boulder'] ?? 0
    const sportAttempts = stats.avgAttemptsByType['sport'] ?? 0
    const attemptDiff =
      sportAttempts > 0 && boulderAttempts > 0
        ? Math.max(0, (sportAttempts - boulderAttempts) / sportAttempts)
        : 0

    const rawPower = (completionDiff + 1) / 2 + breakthroughBonus * 0.3 + attemptDiff * 0.2
    const power_signal = Math.max(0, Math.min(1, rawPower))

    // Goal signal: project ratio 高 → goal-oriented
    const goal_signal = Math.max(
      0,
      Math.min(1, stats.projectRatio * 0.6 + (1 - stats.uniqueRouteRatio) * 0.4)
    )

    // Bold signal: breakthrough frequency + lead ratio
    // 正規化 breakthrough frequency（以 activeMonths 為基準）
    const normalizedBreakthroughFreq =
      stats.activeMonths > 0
        ? Math.min(1, stats.breakthroughFrequency / Math.max(3, stats.activeMonths))
        : 0

    const bold_signal = Math.max(
      0,
      Math.min(1, normalizedBreakthroughFreq * 0.5 + stats.leadRatio * 0.5)
    )

    return { power_signal, goal_signal, bold_signal }
  }

  /** 3.3 查詢用戶最新測驗基線 */
  async getQuizBaseline(userId: string, db: D1Database): Promise<QuizBaseline | null> {
    const row = await db
      .prepare(
        'SELECT power_pct, goal_pct, bold_pct FROM quiz_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
      )
      .bind(userId)
      .first<{ power_pct: number; goal_pct: number; bold_pct: number }>()

    return row ?? null
  }

  /** 3.4 混合測驗與行為分數 */
  blendScores(
    quizPct: QuizBaseline | null,
    behaviorSignal: BehaviorSignals,
    recordCount: number
  ): BlendedScores {
    // 行為訊號轉換至 0-100
    const behaviorPct = {
      power_pct: behaviorSignal.power_signal * 100,
      goal_pct: behaviorSignal.goal_signal * 100,
      bold_pct: behaviorSignal.bold_signal * 100,
    }

    if (!quizPct) {
      // 沒有測驗資料，100% 使用行為資料
      return behaviorPct
    }

    // 根據紀錄數決定混合比例
    let quizWeight: number
    let behaviorWeight: number

    if (recordCount <= 50) {
      quizWeight = 0.7
      behaviorWeight = 0.3
    } else if (recordCount <= 100) {
      quizWeight = 0.5
      behaviorWeight = 0.5
    } else {
      quizWeight = 0.3
      behaviorWeight = 0.7
    }

    return {
      power_pct: quizPct.power_pct * quizWeight + behaviorPct.power_pct * behaviorWeight,
      goal_pct: quizPct.goal_pct * quizWeight + behaviorPct.goal_pct * behaviorWeight,
      bold_pct: quizPct.bold_pct * quizWeight + behaviorPct.bold_pct * behaviorWeight,
    }
  }

  /** 3.5 計算風格光譜 */
  calculateStyleSpectrum(onsightMax: number, redpointMax: number): number | null {
    if (!onsightMax || !redpointMax) return null
    return redpointMax - onsightMax
  }

  /** 3.6 取得光譜位置描述 */
  getSpectrumPosition(spectrum: number | null): SpectrumPosition | null {
    if (spectrum === null || spectrum === undefined) return null

    if (spectrum > 3) {
      return {
        position: 'deep_sender',
        nameZh: '深耕者',
        name: 'Deep Sender',
        description: '你偏好透過反覆嘗試來突破難度上限，對 project 的執著讓你能超越自己的極限。',
        growthDirection: '嘗試更多 onsight 挑戰，培養即時解讀路線的能力。',
      }
    }

    if (spectrum >= 0) {
      return {
        position: 'all_rounder',
        nameZh: '全能者',
        name: 'All-Rounder',
        description: '你的 onsight 與 redpoint 能力均衡發展，是少見的全方位攀岩者。',
        growthDirection: '選擇一個方向深入突破，讓你的特色更加鮮明。',
      }
    }

    return {
      position: 'flash_reader',
      nameZh: '即興者',
      name: 'Flash Reader',
      description: '你擅長即時解讀路線，onsight 能力突出，第一次就能讀懂岩壁的語言。',
      growthDirection: '挑戰更高難度的 project，培養長期攻略的耐心與策略。',
    }
  }

  /** 3.7 檢查穩定期（距離上次人格設定的週數） */
  async checkStabilityPeriod(userId: string, db: D1Database): Promise<number> {
    const row = await db
      .prepare('SELECT personality_taken_at FROM users WHERE id = ?')
      .bind(userId)
      .first<{ personality_taken_at: string | null }>()

    if (!row?.personality_taken_at) return Infinity

    const takenAt = new Date(row.personality_taken_at)
    const now = new Date()
    const diffMs = now.getTime() - takenAt.getTime()
    const weeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000))
    return weeks
  }

  /** 3.8 取得連續相同型態的次數 */
  async getConsecutiveCount(userId: string, targetType: string, db: D1Database): Promise<number> {
    const rows = await db
      .prepare(
        'SELECT to_type FROM personality_evolution WHERE user_id = ? ORDER BY calculated_at DESC'
      )
      .bind(userId)
      .all<{ to_type: string }>()

    let count = 0
    for (const row of rows.results ?? []) {
      if (row.to_type === targetType) {
        count++
      } else {
        break
      }
    }
    return count
  }

  /** 3.9 判斷是否應演化 */
  shouldEvolve(
    weeksSinceLast: number,
    consecutiveCount: number,
    newType: string,
    currentType: string | null
  ): boolean {
    if (currentType === newType) return false
    if (weeksSinceLast < 8) return false
    if (consecutiveCount < 3) return false
    return true
  }

  /** 3.10 由三軸分數決定人格型態 */
  determinePersonalityType(power_pct: number, goal_pct: number, bold_pct: number): string {
    const first = power_pct >= 50 ? 'P' : 'T'
    const second = goal_pct >= 50 ? 'G' : 'F'
    const third = bold_pct >= 50 ? 'B' : 'S'
    return `${first}${second}${third}`
  }

  /** 3.11 主要演化流程 */
  async evolve(userId: string, db: D1Database): Promise<EvolutionResult> {
    // 1. 檢查最低紀錄數
    const countRow = await db
      .prepare('SELECT COUNT(*) as cnt FROM user_route_ascents WHERE user_id = ?')
      .bind(userId)
      .first<{ cnt: number }>()

    if ((countRow?.cnt ?? 0) < 20) {
      return { changed: false, reason: 'insufficient_records' }
    }

    // 2. 取得攀登統計 → 計算行為訊號
    const stats = await this.getAscentStats(userId, db)
    const behaviorSignals = this.calculateBehaviorSignals(stats)

    // 3. 取得測驗基線
    const quizBaseline = await this.getQuizBaseline(userId, db)

    // 4. 混合分數
    const blended = this.blendScores(quizBaseline, behaviorSignals, stats.totalCount)

    // 5. 計算風格光譜
    const styleSpectrum = this.calculateStyleSpectrum(stats.onsightMaxGrade, stats.redpointMaxGrade)

    // 6. 決定人格型態
    const newType = this.determinePersonalityType(
      blended.power_pct,
      blended.goal_pct,
      blended.bold_pct
    )

    // 7. 取得當前人格型態
    const userRow = await db
      .prepare('SELECT personality_type, style_spectrum FROM users WHERE id = ?')
      .bind(userId)
      .first<{ personality_type: string | null; style_spectrum: number | null }>()

    const currentType = userRow?.personality_type ?? null

    // 8. 檢查穩定期與連續次數
    const weeksSinceLast = await this.checkStabilityPeriod(userId, db)
    const consecutiveCount = (await this.getConsecutiveCount(userId, newType, db)) + 1 // 加上本次

    // 9. 判斷是否演化
    const shouldChange = this.shouldEvolve(weeksSinceLast, consecutiveCount, newType, currentType)

    // 10. 永遠記錄演化計算結果
    const evolutionId = generateId()
    await db
      .prepare(
        `INSERT INTO personality_evolution (id, user_id, from_type, to_type, power_pct, goal_pct, bold_pct, style_spectrum, trigger, consecutive_count, calculated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
      )
      .bind(
        evolutionId,
        userId,
        currentType,
        newType,
        blended.power_pct,
        blended.goal_pct,
        blended.bold_pct,
        styleSpectrum,
        'behavior',
        consecutiveCount
      )
      .run()

    // 11. 如果應該演化 → 更新用戶
    if (shouldChange) {
      await db
        .prepare(
          `UPDATE users SET personality_type = ?, style_spectrum = ?, personality_taken_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`
        )
        .bind(newType, styleSpectrum, userId)
        .run()
    } else if (styleSpectrum !== null && styleSpectrum !== userRow?.style_spectrum) {
      // 12. 光譜有變但不演化 → 只更新光譜
      await db
        .prepare(`UPDATE users SET style_spectrum = ?, updated_at = datetime('now') WHERE id = ?`)
        .bind(styleSpectrum, userId)
        .run()
    }

    // 13. 回傳結果
    return {
      changed: shouldChange,
      personality_type: shouldChange ? newType : (currentType ?? undefined),
      power_pct: blended.power_pct,
      goal_pct: blended.goal_pct,
      bold_pct: blended.bold_pct,
      style_spectrum: styleSpectrum,
      consecutive_count: consecutiveCount,
      weeks_stable: weeksSinceLast === Infinity ? 0 : weeksSinceLast,
    }
  }
}

// ============================================
// Cron 批次處理
// ============================================

/** 批次處理人格演化（每週一執行） */
export async function processEvolutionBatch(env: Env): Promise<void> {
  const service = new EvolutionService()

  // 查詢符合條件的用戶
  const eligibleUsers = await env.DB.prepare(
    `SELECT u.id FROM users u
    WHERE u.personality_type IS NOT NULL
      AND u.last_active_at >= datetime('now', '-30 days')
      AND (SELECT COUNT(*) FROM user_route_ascents WHERE user_id = u.id) >= 20`
  ).all<{ id: string }>()

  const users = eligibleUsers.results ?? []
  let _success = 0
  let _failed = 0
  let _skipped = 0
  let _evolved = 0

  // 分批處理，每批 50 人
  const batchSize = 50
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize)

    for (const user of batch) {
      try {
        const result = await service.evolve(user.id, env.DB)

        // Cron 觸發的紀錄改標記為 'cron'
        // SQLite 不支援 UPDATE ... ORDER BY ... LIMIT，改用 subquery
        await env.DB.prepare(
          `UPDATE personality_evolution SET trigger = 'cron'
          WHERE id = (
            SELECT id FROM personality_evolution
            WHERE user_id = ?
            ORDER BY calculated_at DESC LIMIT 1
          )`
        )
          .bind(user.id)
          .run()

        if (result.changed) {
          _evolved++
        } else if (result.reason === 'insufficient_records') {
          _skipped++
        }
        _success++
      } catch (err) {
        console.error(`[evolution] 用戶 ${user.id} 演化失敗:`, err)
        _failed++
      }
    }
  }
}
