import { getTrainingPlan } from '@nobodyclimb/constants'
import { Hono } from 'hono'
import { describeRoute } from 'hono-openapi'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth'
import { FeedbackRequestSchema, GenerateRequestSchema } from '../schemas/ai-training'
import { AITrainingService, RateLimitError } from '../services/ai-training'
import { Env } from '../types'
import { generateId } from '../utils/id'

export const trainingRoutes = new Hono<{ Bindings: Env }>()

const VALID_PERSONALITY_TYPES = ['PGB', 'PGS', 'PFB', 'PFS', 'TGB', 'TGS', 'TFB', 'TFS'] as const
type PersonalityTypeCode = (typeof VALID_PERSONALITY_TYPES)[number]

function isValidPersonalityType(type: string): type is PersonalityTypeCode {
  return VALID_PERSONALITY_TYPES.includes(type as PersonalityTypeCode)
}

const trainingProgressSchema = z.object({
  personality_type: z.string().refine(isValidPersonalityType, {
    message: 'Invalid personality_type. Must be one of: ' + VALID_PERSONALITY_TYPES.join(', '),
  }),
  week: z.number().int().min(1).max(4),
  day: z.number().int().min(1).max(3),
  completed: z.boolean(),
  notes: z.string().nullable().optional(),
})

trainingRoutes.get(
  '/plan/:type',
  describeRoute({
    tags: ['Training'],
    summary: '取得訓練計畫內容',
    description:
      '取得指定性格型態的 4 週 x 3 天訓練計畫。已登入用戶若有 AI 微調計畫，回傳中會包含 ai_available: true',
    responses: {
      200: { description: '成功取得訓練計畫' },
      400: { description: '無效的型態代碼' },
      404: { description: '訓練計畫尚未定義' },
    },
  }),
  async (c) => {
    const type = c.req.param('type')

    if (!isValidPersonalityType(type)) {
      return c.json(
        {
          success: false,
          error: 'Bad Request',
          message:
            'Invalid personality type. Must be one of: ' + VALID_PERSONALITY_TYPES.join(', '),
        },
        400
      )
    }

    const plan = getTrainingPlan(type)
    if (!plan) {
      return c.json(
        {
          success: false,
          error: 'Not Found',
          message: `Training plan for type ${type} is not yet available`,
        },
        404
      )
    }

    // 檢查已登入用戶是否有 AI 微調計畫
    let ai_available = false
    try {
      const authHeader = c.req.header('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7)
        const secret = new TextEncoder().encode(c.env.JWT_SECRET)
        const { payload } = await import('jose').then((jose) =>
          jose.jwtVerify(token, secret, { issuer: c.env.JWT_ISSUER })
        )
        const userId = payload.sub as string
        if (userId) {
          const aiPlan = await c.env.DB.prepare(
            'SELECT id FROM ai_training_plans WHERE user_id = ? AND personality_type = ? LIMIT 1'
          )
            .bind(userId, type)
            .first()
          ai_available = !!aiPlan
        }
      }
    } catch {
      // 未登入或 token 無效，ai_available 保持 false
    }

    return c.json({ success: true, data: plan, ai_available })
  }
)

trainingRoutes.post(
  '/progress',
  describeRoute({
    tags: ['Training'],
    summary: '記錄訓練進度',
    description: '以 upsert 方式記錄或更新訓練進度',
    responses: {
      200: { description: '成功記錄訓練進度' },
      400: { description: '請求參數錯誤' },
      401: { description: '未授權，需要登入' },
    },
  }),
  authMiddleware,
  async (c) => {
    const body = await c.req.json()
    const parsed = trainingProgressSchema.safeParse(body)

    if (!parsed.success) {
      return c.json(
        { success: false, error: 'Bad Request', message: parsed.error.issues[0].message },
        400
      )
    }

    const data = parsed.data
    const userId = c.get('userId')
    const id = generateId()

    await c.env.DB.prepare(
      `INSERT INTO training_progress (id, user_id, personality_type, week, day, completed, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, personality_type, week, day) DO UPDATE SET
         completed = excluded.completed,
         notes = excluded.notes`
    )
      .bind(
        id,
        userId,
        data.personality_type,
        data.week,
        data.day,
        data.completed ? 1 : 0,
        data.notes ?? null
      )
      .run()

    return c.json({ success: true, message: 'Training progress updated' })
  }
)

trainingRoutes.get(
  '/progress/me',
  describeRoute({
    tags: ['Training'],
    summary: '查詢個人訓練進度',
    description: '取得已登入用戶的訓練進度',
    responses: {
      200: { description: '成功取得訓練進度' },
      401: { description: '未授權，需要登入' },
    },
  }),
  authMiddleware,
  async (c) => {
    const userId = c.get('userId')
    const type = c.req.query('type')

    let sql = 'SELECT * FROM training_progress WHERE user_id = ?'
    const params: (string | number)[] = [userId]

    if (type) {
      if (!isValidPersonalityType(type)) {
        return c.json(
          {
            success: false,
            error: 'Bad Request',
            message:
              'Invalid personality type. Must be one of: ' + VALID_PERSONALITY_TYPES.join(', '),
          },
          400
        )
      }
      sql += ' AND personality_type = ?'
      params.push(type)
    }

    sql += ' ORDER BY personality_type, week, day'

    const results = await c.env.DB.prepare(sql)
      .bind(...params)
      .all()

    return c.json({ success: true, data: results.results ?? [] })
  }
)

// =============================================
// AI 訓練微調端點
// =============================================

trainingRoutes.post(
  '/ai/generate',
  describeRoute({
    tags: ['Training'],
    summary: 'AI 微調訓練計畫',
    description:
      '根據用戶攀登數據，以 AI 微調指定人格型態與週數的訓練計畫。攀登記錄 < 5 筆時回傳原始模板。支援 force=true 強制重新生成（每日上限 3 次）',
    responses: {
      200: { description: '成功生成 AI 微調計畫' },
      400: { description: '請求參數錯誤' },
      401: { description: '未授權，需要登入' },
      429: { description: '每日 force 生成次數已達上限' },
      500: { description: '內部錯誤' },
    },
  }),
  authMiddleware,
  async (c) => {
    const body = await c.req.json()
    const parsed = GenerateRequestSchema.safeParse(body)

    if (!parsed.success) {
      return c.json(
        { success: false, error: 'Bad Request', message: parsed.error.issues[0].message },
        400
      )
    }

    const { personality_type, week_number, force } = parsed.data
    const userId = c.get('userId')

    try {
      const service = new AITrainingService(c.env)
      const result = await service.generatePlan(userId, personality_type, week_number, force)

      return c.json({
        success: true,
        data: {
          plan: result.plan,
          source: result.source,
          difficulty_level: result.difficulty_level,
        },
      })
    } catch (err) {
      if (err instanceof RateLimitError) {
        return c.json({ success: false, error: 'Too Many Requests', message: err.message }, 429)
      }
      console.error('AI training generate error:', err)
      return c.json(
        {
          success: false,
          error: 'Internal Server Error',
          message: err instanceof Error ? err.message : '生成訓練計畫時發生錯誤',
        },
        500
      )
    }
  }
)

trainingRoutes.get(
  '/ai/plan',
  describeRoute({
    tags: ['Training'],
    summary: '查詢最新 AI 微調計畫',
    description:
      '取得已登入用戶最新的 AI 微調訓練計畫。可透過 query params 篩選 personality_type 和 week_number',
    responses: {
      200: { description: '成功取得 AI 計畫' },
      401: { description: '未授權，需要登入' },
    },
  }),
  authMiddleware,
  async (c) => {
    const userId = c.get('userId')
    const type = c.req.query('personality_type')
    const week = c.req.query('week_number')

    let sql = 'SELECT * FROM ai_training_plans WHERE user_id = ?'
    const params: (string | number)[] = [userId]

    if (type) {
      if (!isValidPersonalityType(type)) {
        return c.json(
          {
            success: false,
            error: 'Bad Request',
            message:
              'Invalid personality type. Must be one of: ' + VALID_PERSONALITY_TYPES.join(', '),
          },
          400
        )
      }
      sql += ' AND personality_type = ?'
      params.push(type)
    }

    if (week) {
      const weekNum = parseInt(week, 10)
      if (isNaN(weekNum) || weekNum < 1 || weekNum > 4) {
        return c.json(
          { success: false, error: 'Bad Request', message: 'week_number must be 1-4' },
          400
        )
      }
      sql += ' AND week_number = ?'
      params.push(weekNum)
    }

    sql += ' ORDER BY personality_type, week_number'

    const results = await c.env.DB.prepare(sql)
      .bind(...params)
      .all()

    const plans = (results.results ?? []).map((row: Record<string, unknown>) => ({
      ...row,
      plan_content:
        typeof row.plan_content === 'string' ? JSON.parse(row.plan_content) : row.plan_content,
    }))

    return c.json({ success: true, data: plans })
  }
)

trainingRoutes.post(
  '/ai/feedback',
  describeRoute({
    tags: ['Training'],
    summary: '提交 AI 訓練計畫回饋',
    description:
      '對 AI 生成的訓練計畫提交回饋（too_easy / just_right / too_hard），回饋會影響下次生成的難度等級',
    responses: {
      200: { description: '成功提交回饋' },
      400: { description: '請求參數錯誤' },
      401: { description: '未授權，需要登入' },
      403: { description: '該計畫不屬於此用戶' },
      404: { description: '找不到指定的訓練計畫' },
    },
  }),
  authMiddleware,
  async (c) => {
    const body = await c.req.json()
    const parsed = FeedbackRequestSchema.safeParse(body)

    if (!parsed.success) {
      return c.json(
        { success: false, error: 'Bad Request', message: parsed.error.issues[0].message },
        400
      )
    }

    const { plan_id, rating, comment } = parsed.data
    const userId = c.get('userId')

    // 驗證 plan_id 存在且屬於該用戶
    const plan = await c.env.DB.prepare('SELECT id, user_id FROM ai_training_plans WHERE id = ?')
      .bind(plan_id)
      .first<{ id: string; user_id: string }>()

    if (!plan) {
      return c.json({ success: false, error: 'Not Found', message: '找不到指定的訓練計畫' }, 404)
    }

    if (plan.user_id !== userId) {
      return c.json({ success: false, error: 'Forbidden', message: '該計畫不屬於此用戶' }, 403)
    }

    const id = generateId()
    await c.env.DB.prepare(
      `INSERT INTO ai_training_feedback (id, user_id, plan_id, rating, comment, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`
    )
      .bind(id, userId, plan_id, rating, comment ?? null)
      .run()

    return c.json({ success: true, message: '回饋已記錄' })
  }
)
