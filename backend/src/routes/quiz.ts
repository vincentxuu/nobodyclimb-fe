import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { z } from 'zod'
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth'
import { EvolutionService } from '../services/evolution'
import { Env } from '../types'
import { gradeToNumeric } from '../utils/grade'
import { generateId } from '../utils/id'

export const quizRoutes = new Hono<{ Bindings: Env }>()

const VALID_PERSONALITY_TYPES = ['PGB', 'PGS', 'PFB', 'PFS', 'TGB', 'TGS', 'TFB', 'TFS'] as const
type PersonalityTypeCode = (typeof VALID_PERSONALITY_TYPES)[number]

function isValidPersonalityType(type: string): type is PersonalityTypeCode {
  return VALID_PERSONALITY_TYPES.includes(type as PersonalityTypeCode)
}

const quizResultSchema = z.object({
  answers: z.array(z.number().int().min(1).max(5)).length(24),
  personality_type: z.string().refine(isValidPersonalityType, {
    message: 'Invalid personality_type. Must be one of: ' + VALID_PERSONALITY_TYPES.join(', '),
  }),
  power_pct: z.number().int().min(0).max(100),
  goal_pct: z.number().int().min(0).max(100),
  bold_pct: z.number().int().min(0).max(100),
  grit_index: z.number().int().min(0).max(100).nullable(),
  flow_index: z.number().int().min(0).max(100).nullable(),
})

quizRoutes.post(
  '/results',
  describeRoute({
    tags: ['Quiz'],
    summary: '儲存測驗結果',
    responses: { 201: { description: '成功儲存' }, 400: { description: '參數錯誤' } },
  }),
  optionalAuthMiddleware,
  async (c) => {
    const body = await c.req.json()
    const parsed = quizResultSchema.safeParse(body)
    if (!parsed.success)
      return c.json(
        { success: false, error: 'Bad Request', message: parsed.error.issues[0].message },
        400
      )
    const data = parsed.data
    const userId = c.get('userId') || null
    const id = generateId()
    await c.env.DB.prepare(
      `INSERT INTO quiz_results (id, user_id, personality_type, power_pct, goal_pct, bold_pct, grit_index, flow_index, answers, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
    )
      .bind(
        id,
        userId,
        data.personality_type,
        data.power_pct,
        data.goal_pct,
        data.bold_pct,
        data.grit_index,
        data.flow_index,
        JSON.stringify(data.answers)
      )
      .run()
    if (userId) {
      // 取得當前人格型態（用於演化紀錄）
      const currentUser = await c.env.DB.prepare('SELECT personality_type FROM users WHERE id = ?')
        .bind(userId)
        .first<{ personality_type: string | null }>()

      await c.env.DB.prepare(
        `UPDATE users SET personality_type = ?, personality_taken_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`
      )
        .bind(data.personality_type, userId)
        .run()

      // 如果已有演化紀錄，記錄本次測驗結果（trigger='quiz'，重置 consecutive_count）
      const hasEvolution = await c.env.DB.prepare(
        'SELECT COUNT(*) as cnt FROM personality_evolution WHERE user_id = ?'
      )
        .bind(userId)
        .first<{ cnt: number }>()

      if ((hasEvolution?.cnt ?? 0) > 0) {
        const evoId = generateId()
        await c.env.DB.prepare(
          `INSERT INTO personality_evolution (id, user_id, from_type, to_type, power_pct, goal_pct, bold_pct, style_spectrum, trigger, consecutive_count, calculated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 'quiz', 1, datetime('now'))`
        )
          .bind(
            evoId,
            userId,
            currentUser?.personality_type ?? null,
            data.personality_type,
            data.power_pct,
            data.goal_pct,
            data.bold_pct
          )
          .run()
      }
    }
    return c.json({ success: true, data: { id } }, 201)
  }
)

quizRoutes.get(
  '/results/me',
  describeRoute({
    tags: ['Quiz'],
    summary: '查詢個人測驗結果',
    responses: { 200: { description: '成功' }, 401: { description: '未授權' } },
  }),
  authMiddleware,
  async (c) => {
    const userId = c.get('userId')
    const results = await c.env.DB.prepare(
      'SELECT * FROM quiz_results WHERE user_id = ? ORDER BY created_at DESC'
    )
      .bind(userId)
      .all()
    const rows = results.results ?? []
    const latest = rows.length > 0 ? rows[0] : null
    return c.json({
      success: true,
      data: {
        latest: latest ? { ...latest, answers: JSON.parse(latest.answers as string) } : null,
        history: rows.map((r) => ({ ...r, answers: JSON.parse(r.answers as string) })),
      },
    })
  }
)

quizRoutes.get(
  '/results/user/:userId',
  describeRoute({
    tags: ['Quiz'],
    summary: '查詢特定用戶最新測驗結果',
    responses: { 200: { description: '成功' } },
  }),
  async (c) => {
    const userId = c.req.param('userId')
    const result = await c.env.DB.prepare(
      `SELECT id, user_id, personality_type, power_pct, goal_pct, bold_pct, grit_index, flow_index, version, created_at FROM quiz_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`
    )
      .bind(userId)
      .first()
    return c.json({ success: true, data: result || null })
  }
)

quizRoutes.get(
  '/stats',
  describeRoute({
    tags: ['Quiz'],
    summary: '全站測驗統計',
    responses: { 200: { description: '成功' } },
  }),
  async (c) => {
    const cacheKey = 'quiz:stats:v1'
    const cached = await c.env.CACHE?.get(cacheKey)
    if (cached) return c.json({ success: true, data: JSON.parse(cached) })
    const [totalRow, distributionRows, recentRow] = await Promise.all([
      c.env.DB.prepare('SELECT COUNT(*) as cnt FROM quiz_results').first<{ cnt: number }>(),
      c.env.DB.prepare(
        'SELECT personality_type, COUNT(*) as cnt FROM quiz_results GROUP BY personality_type'
      ).all<{ personality_type: string; cnt: number }>(),
      c.env.DB.prepare(
        "SELECT COUNT(*) as cnt FROM quiz_results WHERE created_at >= datetime('now', '-24 hours')"
      ).first<{ cnt: number }>(),
    ])
    const totalTests = totalRow?.cnt ?? 0
    const recentTests = recentRow?.cnt ?? 0
    const distribution: Record<string, number> = {}
    if (totalTests > 0) {
      for (const row of distributionRows.results ?? []) {
        distribution[row.personality_type] = Math.round((row.cnt / totalTests) * 100)
      }
    }
    const stats = { totalTests, distribution, recentTests }
    await c.env.CACHE?.put(cacheKey, JSON.stringify(stats), { expirationTtl: 3600 })
    return c.json({ success: true, data: stats })
  }
)

quizRoutes.get(
  '/ranking/:type',
  describeRoute({
    tags: ['Quiz'],
    summary: '同型態用戶排名',
    responses: { 200: { description: '成功' }, 400: { description: '無效型態' } },
  }),
  optionalAuthMiddleware,
  async (c) => {
    const type = c.req.param('type')
    if (!isValidPersonalityType(type))
      return c.json(
        { success: false, error: 'Bad Request', message: 'Invalid personality type' },
        400
      )
    const userId = c.get('userId') || null
    const ranking = await c.env.DB.prepare(
      `SELECT u.id as user_id, u.display_name, u.avatar_url, COUNT(a.id) as ascent_count, MAX(a.perceived_grade) as highest_grade FROM users u JOIN user_route_ascents a ON u.id = a.user_id WHERE u.personality_type = ? GROUP BY u.id ORDER BY ascent_count DESC, highest_grade DESC LIMIT 50`
    )
      .bind(type)
      .all()
    const rows = ranking.results ?? []
    const totalRow = await c.env.DB.prepare(
      `SELECT COUNT(DISTINCT u.id) as cnt FROM users u JOIN user_route_ascents a ON u.id = a.user_id WHERE u.personality_type = ?`
    )
      .bind(type)
      .first<{ cnt: number }>()
    let myRank: number | undefined
    if (userId) {
      const idx = rows.findIndex((r: any) => r.user_id === userId)
      if (idx >= 0) myRank = idx + 1
    }
    return c.json({
      success: true,
      data: {
        ranking: rows,
        total: totalRow?.cnt ?? 0,
        ...(myRank !== undefined ? { my_rank: myRank } : {}),
      },
    })
  }
)

// ============================================
// 人格演化 API
// ============================================

const evolutionService = new EvolutionService()

// 5.1 手動觸發演化計算
quizRoutes.post(
  '/evolution/calculate',
  describeRoute({
    tags: ['Quiz'],
    summary: '手動觸發人格演化計算',
    responses: {
      200: { description: '計算完成' },
      401: { description: '未授權' },
      429: { description: '今日已計算過' },
    },
  }),
  authMiddleware,
  async (c) => {
    const userId = c.get('userId')

    // 每日限一次
    const todayRecord = await c.env.DB.prepare(
      `SELECT COUNT(*) as cnt FROM personality_evolution
      WHERE user_id = ? AND calculated_at >= date('now')`
    )
      .bind(userId)
      .first<{ cnt: number }>()

    if ((todayRecord?.cnt ?? 0) > 0) {
      return c.json(
        { success: false, error: 'Too Many Requests', message: '今日已計算過，請明天再試' },
        429
      )
    }

    const result = await evolutionService.evolve(userId, c.env.DB)
    return c.json({ success: true, data: result })
  }
)

// 5.2 演化時間線
quizRoutes.get(
  '/evolution/timeline',
  describeRoute({
    tags: ['Quiz'],
    summary: '查詢人格演化時間線',
    responses: {
      200: { description: '成功' },
      401: { description: '未授權' },
    },
  }),
  authMiddleware,
  async (c) => {
    const userId = c.get('userId')

    const rows = await c.env.DB.prepare(
      `SELECT * FROM personality_evolution
      WHERE user_id = ? AND from_type IS NOT NULL AND from_type != to_type
      ORDER BY calculated_at DESC`
    )
      .bind(userId)
      .all()

    return c.json({ success: true, data: rows.results ?? [] })
  }
)

// 5.3 風格光譜
quizRoutes.get(
  '/evolution/style-spectrum',
  describeRoute({
    tags: ['Quiz'],
    summary: '查詢風格光譜',
    responses: {
      200: { description: '成功' },
      401: { description: '未授權' },
    },
  }),
  authMiddleware,
  async (c) => {
    const userId = c.get('userId')

    // 取得用戶光譜值
    const userRow = await c.env.DB.prepare('SELECT style_spectrum FROM users WHERE id = ?')
      .bind(userId)
      .first<{ style_spectrum: number | null }>()

    const spectrum = userRow?.style_spectrum ?? null
    const position = evolutionService.getSpectrumPosition(spectrum)

    // 查詢最高 onsight / redpoint 難度
    const [onsightMax, redpointMax] = await Promise.all([
      c.env.DB.prepare(
        `SELECT r.grade FROM user_route_ascents a
        JOIN routes r ON a.route_id = r.id
        WHERE a.user_id = ? AND a.ascent_type = 'onsight' AND r.grade IS NOT NULL
        ORDER BY r.grade DESC LIMIT 1`
      )
        .bind(userId)
        .first<{ grade: string }>(),
      c.env.DB.prepare(
        `SELECT r.grade FROM user_route_ascents a
        JOIN routes r ON a.route_id = r.id
        WHERE a.user_id = ? AND a.ascent_type = 'redpoint' AND r.grade IS NOT NULL
        ORDER BY r.grade DESC LIMIT 1`
      )
        .bind(userId)
        .first<{ grade: string }>(),
    ])

    return c.json({
      success: true,
      data: {
        spectrum,
        position,
        onsight_max_grade: onsightMax?.grade ?? null,
        onsight_max_numeric: onsightMax?.grade ? gradeToNumeric(onsightMax.grade) : null,
        redpoint_max_grade: redpointMax?.grade ?? null,
        redpoint_max_numeric: redpointMax?.grade ? gradeToNumeric(redpointMax.grade) : null,
      },
    })
  }
)

// 5.4 演化通知
quizRoutes.get(
  '/evolution/notification',
  describeRoute({
    tags: ['Quiz'],
    summary: '查詢未讀的人格演化通知',
    responses: {
      200: { description: '成功' },
      401: { description: '未授權' },
    },
  }),
  authMiddleware,
  async (c) => {
    const userId = c.get('userId')

    // 從 KV 取得上次已讀時間
    const readAt = await c.env.CACHE?.get(`evolution:notification:read:${userId}`)

    // 查詢最新的實際演化紀錄（有型態變更的）
    const latestEvolution = await c.env.DB.prepare(
      `SELECT * FROM personality_evolution
      WHERE user_id = ?
        AND trigger IN ('behavior', 'cron')
        AND from_type IS NOT NULL
        AND from_type != to_type
      ORDER BY calculated_at DESC LIMIT 1`
    )
      .bind(userId)
      .first()

    if (!latestEvolution) {
      return c.json({ success: true, data: { has_notification: false } })
    }

    const calculatedAt = latestEvolution.calculated_at as string
    const hasNotification = !readAt || calculatedAt > readAt

    return c.json({
      success: true,
      data: {
        has_notification: hasNotification,
        ...(hasNotification ? { evolution: latestEvolution } : {}),
      },
    })
  }
)

// 5.5 標記通知已讀
quizRoutes.post(
  '/evolution/notification/read',
  describeRoute({
    tags: ['Quiz'],
    summary: '標記演化通知為已讀',
    responses: {
      200: { description: '成功' },
      401: { description: '未授權' },
    },
  }),
  authMiddleware,
  async (c) => {
    const userId = c.get('userId')

    await c.env.CACHE?.put(
      `evolution:notification:read:${userId}`,
      new Date().toISOString(),
      { expirationTtl: 90 * 24 * 3600 } // 90 天過期
    )

    return c.json({ success: true })
  }
)
