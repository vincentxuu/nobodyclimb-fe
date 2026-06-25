import { D1Database } from '@cloudflare/workers-types'
import { RankId, RankScoreBreakdown, UserRank, UserRankDetail } from '@nobodyclimb/types'

// 等級積分門檻（須與 climber_ranks 資料表一致）
const RANK_THRESHOLDS: {
  id: RankId
  min_score: number
  daily_ai_limit: number
  daily_token_limit: number
}[] = [
  { id: 'summit', min_score: 100, daily_ai_limit: 24, daily_token_limit: 60000 },
  { id: 'ridge', min_score: 70, daily_ai_limit: 12, daily_token_limit: 30000 },
  { id: 'wall', min_score: 20, daily_ai_limit: 6, daily_token_limit: 15000 },
  { id: 'foothill', min_score: 0, daily_ai_limit: 2, daily_token_limit: 5000 },
]

function scoreToRank(score: number): {
  id: RankId
  daily_ai_limit: number
  daily_token_limit: number
} {
  return RANK_THRESHOLDS.find((r) => score >= r.min_score) ?? RANK_THRESHOLDS[3]
}

/** 計算用戶的等級積分明細 */
export async function calculateUserScore(
  userId: string,
  db: D1Database
): Promise<RankScoreBreakdown> {
  // 取得 biography_id 與基本資料（basic_info_data 為 JSON 欄位，visibility 取代舊的 is_public）
  const bio = await db
    .prepare('SELECT id, basic_info_data, visibility FROM biographies WHERE user_id = ?')
    .bind(userId)
    .first<{ id: string; basic_info_data: string | null; visibility: string | null }>()

  if (!bio) {
    return {
      biography_fields: 0,
      biography_bucket_list: 0,
      biography_public: 0,
      core_stories: 0,
      one_liners: 0,
      stories: 0,
      route_ascents: 0,
      bucket_list_items: 0,
      bucket_list_completed: 0,
      quiz_completed: 0,
      training_completed: 0,
      total: 0,
    }
  }

  const bioId = bio.id
  const basicInfo = bio.basic_info_data
    ? (JSON.parse(bio.basic_info_data) as Record<string, unknown>)
    : {}

  // 並行查詢各積分來源
  const [
    coreStoriesRow,
    oneLinerRow,
    storiesRow,
    ascentsRow,
    bucketRow,
    bucketCompletedRow,
    quizRow,
    trainingRow,
  ] = await Promise.all([
    db
      .prepare('SELECT COUNT(*) as cnt FROM biography_core_stories WHERE biography_id = ?')
      .bind(bioId)
      .first<{ cnt: number }>(),
    db
      .prepare('SELECT COUNT(*) as cnt FROM biography_one_liners WHERE biography_id = ?')
      .bind(bioId)
      .first<{ cnt: number }>(),
    db
      .prepare('SELECT COUNT(*) as cnt FROM biography_stories WHERE biography_id = ?')
      .bind(bioId)
      .first<{ cnt: number }>(),
    db
      .prepare('SELECT COUNT(*) as cnt FROM user_route_ascents WHERE user_id = ?')
      .bind(userId)
      .first<{ cnt: number }>(),
    db
      .prepare('SELECT COUNT(*) as cnt FROM bucket_list_items WHERE biography_id = ?')
      .bind(bioId)
      .first<{ cnt: number }>(),
    db
      .prepare(
        "SELECT COUNT(*) as cnt FROM bucket_list_items WHERE biography_id = ? AND status = 'completed'"
      )
      .bind(bioId)
      .first<{ cnt: number }>(),
    db
      .prepare('SELECT COUNT(*) as cnt FROM quiz_results WHERE user_id = ?')
      .bind(userId)
      .first<{ cnt: number }>(),
    db
      .prepare(
        'SELECT COUNT(DISTINCT personality_type) as cnt FROM training_progress WHERE user_id = ? AND completed = 1 GROUP BY personality_type HAVING COUNT(*) = 12'
      )
      .bind(userId)
      .first<{ cnt: number }>(),
  ])

  // biography 文字欄位（從 basic_info_data JSON 取值，每填一欄 +3，上限 12）
  // climbing_meaning 已移至 core_stories 計分，不重複計算
  const filledFields = [
    basicInfo.climbing_start_year,
    basicInfo.frequent_locations,
    basicInfo.favorite_route_type,
    basicInfo.climbing_reason,
  ].filter(Boolean).length
  const biography_fields = Math.min(filledFields * 3, 12)

  // 人生清單有任何項目（+3）
  const biography_bucket_list = (bucketRow?.cnt ?? 0) > 0 ? 3 : 0

  // 公開 biography（visibility = 'public'）
  const biography_public = bio.visibility === 'public' ? 5 : 0

  // 核心故事（上限 24 = 3篇 × 8）
  const core_stories = Math.min((coreStoriesRow?.cnt ?? 0) * 8, 24)

  // one-liners（上限 20 = 10篇 × 2）
  const one_liners = Math.min((oneLinerRow?.cnt ?? 0) * 2, 20)

  // stories（上限 15 = 5篇 × 3）
  const stories = Math.min((storiesRow?.cnt ?? 0) * 3, 15)

  // 攀爬記錄（上限 20 = 20筆 × 1）
  const route_ascents = Math.min(ascentsRow?.cnt ?? 0, 20)

  // 人生清單（上限 10 = 10項 × 1）
  const bucket_list_items = Math.min(bucketRow?.cnt ?? 0, 10)

  // 人生清單已完成（上限 10 = 5項 × 2）
  const bucket_list_completed = Math.min((bucketCompletedRow?.cnt ?? 0) * 2, 10)

  // 完成人格測驗（+5）
  const quiz_completed = (quizRow?.cnt ?? 0) > 0 ? 5 : 0

  // 完成任一型態訓練計畫 12 天全勤（+15，僅計一個）
  const training_completed = (trainingRow?.cnt ?? 0) > 0 ? 15 : 0

  const total =
    biography_fields +
    biography_bucket_list +
    biography_public +
    core_stories +
    one_liners +
    stories +
    route_ascents +
    bucket_list_items +
    bucket_list_completed +
    quiz_completed +
    training_completed

  return {
    biography_fields,
    biography_bucket_list,
    biography_public,
    core_stories,
    one_liners,
    stories,
    route_ascents,
    bucket_list_items,
    bucket_list_completed,
    quiz_completed,
    training_completed,
    total,
  }
}

/** 查詢用戶等級記錄，不存在時回傳 null */
export async function getUserRank(userId: string, db: D1Database): Promise<UserRank | null> {
  return db.prepare('SELECT * FROM user_ranks WHERE user_id = ?').bind(userId).first<UserRank>()
}

/** 首次使用時初始化麓等級記錄（INSERT OR IGNORE） */
export async function initUserRank(userId: string, db: D1Database): Promise<void> {
  await db
    .prepare(`
      INSERT OR IGNORE INTO user_ranks (user_id, score, rank_id, daily_ai_used, daily_ai_limit, daily_token_used, daily_token_limit, last_reset_date)
      VALUES (?, 0, 'foothill', 0, 2, 0, 5000, date('now'))
    `)
    .bind(userId)
    .run()
}

/** 重算單一用戶積分與等級（有 rank_override_id 時跳過等級更新） */
export async function updateUserRank(userId: string, db: D1Database): Promise<UserRank> {
  const breakdown = await calculateUserScore(userId, db)
  const current = await getUserRank(userId, db)

  if (current?.rank_override_id) {
    // 有覆寫：只更新積分，不動等級與配額
    await db
      .prepare(
        `UPDATE user_ranks SET score = ?, last_score_calculated_at = datetime('now'), updated_at = datetime('now') WHERE user_id = ?`
      )
      .bind(breakdown.total, userId)
      .run()
  } else {
    const { id: rankId, daily_ai_limit, daily_token_limit } = scoreToRank(breakdown.total)
    await db
      .prepare(`
        INSERT INTO user_ranks (user_id, score, rank_id, daily_ai_used, daily_ai_limit, daily_token_used, daily_token_limit, last_reset_date, last_score_calculated_at)
        VALUES (?, ?, ?, 0, ?, 0, ?, date('now'), datetime('now'))
        ON CONFLICT(user_id) DO UPDATE SET
          score = excluded.score,
          rank_id = excluded.rank_id,
          daily_ai_limit = excluded.daily_ai_limit,
          daily_token_limit = excluded.daily_token_limit,
          last_score_calculated_at = excluded.last_score_calculated_at,
          updated_at = datetime('now')
      `)
      .bind(userId, breakdown.total, rankId, daily_ai_limit, daily_token_limit)
      .run()
  }

  return (await getUserRank(userId, db))!
}

/** Cron: 重置所有用戶當日 AI 使用量與 token 消耗 */
export async function resetDailyUsage(db: D1Database): Promise<void> {
  await db
    .prepare(
      `UPDATE user_ranks SET daily_ai_used = 0, daily_token_used = 0, last_reset_date = date('now'), updated_at = datetime('now')`
    )
    .run()
}

/** 原子扣除次數與 token 配額，兩個條件必須同時成立才成功（returns changes count） */
export async function deductQuotaAndToken(
  userId: string,
  estimatedTokens: number,
  db: D1Database
): Promise<number> {
  const result = await db
    .prepare(`
      UPDATE user_ranks
      SET daily_ai_used = daily_ai_used + 1,
          daily_token_used = daily_token_used + ?,
          updated_at = datetime('now')
      WHERE user_id = ?
        AND daily_ai_used < daily_ai_limit
        AND daily_token_used + ? <= daily_token_limit
    `)
    .bind(estimatedTokens, userId, estimatedTokens)
    .run()
  return result.meta.changes
}

/** 原子操作失敗時，查詢是次數耗盡還是 token 耗盡（需傳入本次預估 token 數判斷邊界） */
export async function getUserQuotaStatus(
  userId: string,
  estimatedTokens: number,
  db: D1Database
): Promise<{
  requestExceeded: boolean
  tokenExceeded: boolean
}> {
  const rank = await getUserRank(userId, db)
  if (!rank) return { requestExceeded: true, tokenExceeded: false }
  return {
    requestExceeded: rank.daily_ai_used >= rank.daily_ai_limit,
    // 檢查「當前已用 + 本次預估」是否超過上限，與 deductQuotaAndToken 的條件一致
    tokenExceeded: rank.daily_token_used + estimatedTokens > rank.daily_token_limit,
  }
}

/** LLM 完成後更新實際 token 消耗（用實際值覆蓋估算值的差額） */
export async function addTokenUsage(
  userId: string,
  actualTokens: number,
  estimatedTokens: number,
  db: D1Database
): Promise<void> {
  const diff = actualTokens - estimatedTokens
  if (diff === 0) return
  await db
    .prepare(`
      UPDATE user_ranks
      SET daily_token_used = MAX(0, daily_token_used + ?),
          updated_at = datetime('now')
      WHERE user_id = ?
    `)
    .bind(diff, userId)
    .run()
}

/** Cron: 批次重算所有活躍用戶等級（有 rank_override_id 的用戶只更新積分） */
export async function recalculateAllRanks(db: D1Database): Promise<void> {
  const users = await db.prepare('SELECT id FROM users WHERE is_active = 1').all<{ id: string }>()

  for (const user of users.results ?? []) {
    try {
      await updateUserRank(user.id, db)
    } catch (err) {
      console.error(`[rank] 重算用戶 ${user.id} 失敗:`, err)
    }
  }
}

/** 查詢用戶等級詳情（含積分明細），供管理員使用 */
export async function getUserRankDetail(
  userId: string,
  db: D1Database
): Promise<UserRankDetail | null> {
  const rank = await getUserRank(userId, db)
  if (!rank) return null

  const breakdown = await calculateUserScore(userId, db)
  const _rankInfo = RANK_THRESHOLDS.find((r) => r.id === rank.rank_id)

  return {
    ...rank,
    rank_display_name:
      { foothill: '麓', wall: '壁', ridge: '稜', summit: '巔' }[rank.rank_id] ?? rank.rank_id,
    score_breakdown: breakdown,
  }
}
