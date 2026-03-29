import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth'
import { Env } from '../types'
import { generateId } from '../utils/id'

export const storyPromptsRoutes = new Hono<{ Bindings: Env }>()

// ═══════════════════════════════════════════════════════════
// 故事推題 API
// ═══════════════════════════════════════════════════════════

// 推題頻率設定
const PROMPT_CONFIG = {
  minHoursBetweenPrompts: 12, // 至少間隔12小時才推題
  maxPromptsPerWeek: 14, // 每週最多推14次
  cooldownAfterDismiss: 1, // 跳過後1天就可再推同一題
  maxDismissCount: 10, // 跳過超過10次才不再推
}

// 進階故事問題定義（模組級別，供所有 handler 共用）
// 對應 story_questions 表的 question_id
const ADVANCED_STORY_QUESTIONS = [
  { questionId: 'memorable_moment', category: 'growth' },
  { questionId: 'biggest_challenge', category: 'growth' },
  { questionId: 'breakthrough_story', category: 'growth' },
  { questionId: 'first_outdoor', category: 'growth' },
  { questionId: 'first_grade', category: 'growth' },
  { questionId: 'frustrating_climb', category: 'growth' },
  { questionId: 'fear_management', category: 'psychology' },
  { questionId: 'climbing_lesson', category: 'psychology' },
  { questionId: 'failure_perspective', category: 'psychology' },
  { questionId: 'flow_moment', category: 'psychology' },
  { questionId: 'life_balance', category: 'psychology' },
  { questionId: 'unexpected_gain', category: 'psychology' },
  { questionId: 'climbing_mentor', category: 'community' },
  { questionId: 'climbing_partner', category: 'community' },
  { questionId: 'funny_moment', category: 'community' },
  { questionId: 'favorite_spot', category: 'community' },
  { questionId: 'advice_to_group', category: 'community' },
  { questionId: 'climbing_space', category: 'community' },
  { questionId: 'injury_recovery', category: 'practical' },
  { questionId: 'memorable_route', category: 'practical' },
  { questionId: 'training_method', category: 'practical' },
  { questionId: 'effective_practice', category: 'practical' },
  { questionId: 'technique_tip', category: 'practical' },
  { questionId: 'gear_choice', category: 'practical' },
  { questionId: 'dream_climb', category: 'dreams' },
  { questionId: 'climbing_trip', category: 'dreams' },
  { questionId: 'bucket_list_story', category: 'dreams' },
  { questionId: 'climbing_goal', category: 'dreams' },
  { questionId: 'climbing_style', category: 'dreams' },
  { questionId: 'climbing_inspiration', category: 'dreams' },
  { questionId: 'life_outside_climbing', category: 'life' },
] as const

/** 根據問題 ID 取得分類 */
function getQuestionCategory(questionId: string): string {
  const questionInfo = ADVANCED_STORY_QUESTIONS.find((q) => q.questionId === questionId)
  return questionInfo?.category ?? 'unknown'
}

// ═══════════════════════════════════════════════════════════
// Validation Schemas
// ═══════════════════════════════════════════════════════════

const nextQuerySchema = z.object({
  strategy: z.enum(['random', 'easy_first', 'category_rotate']).optional(),
})

// GET /story-prompts/should-prompt - Check if user should be shown a prompt
storyPromptsRoutes.get(
  '/should-prompt',
  describeRoute({
    tags: ['StoryPrompts'],
    summary: '檢查是否應顯示故事推題',
    description:
      '根據用戶的推題歷史和頻率限制，判斷是否應該向用戶顯示故事推題。會檢查最後推題時間、每週推題次數等條件。',
    responses: {
      200: { description: '成功取得推題狀態' },
      401: { description: '未授權，需要登入' },
    },
  }),
  authMiddleware,
  async (c) => {
    const userId = c.get('userId')

    // Get user's biography
    const biography = await c.env.DB.prepare('SELECT id FROM biographies WHERE user_id = ?')
      .bind(userId)
      .first<{ id: string }>()

    if (!biography) {
      return c.json({
        success: true,
        data: { should_prompt: false, reason: 'no_biography', message: '尚未建立人物誌' },
      })
    }

    // Check last prompt time
    const lastPrompt = await c.env.DB.prepare(
      `SELECT prompted_at FROM story_prompts
     WHERE biography_id = ?
     ORDER BY prompted_at DESC LIMIT 1`
    )
      .bind(biography.id)
      .first<{ prompted_at: string }>()

    if (lastPrompt) {
      const hoursSinceLastPrompt = Math.floor(
        (Date.now() - new Date(lastPrompt.prompted_at).getTime()) / (1000 * 60 * 60)
      )
      if (hoursSinceLastPrompt < PROMPT_CONFIG.minHoursBetweenPrompts) {
        return c.json({
          success: true,
          data: { should_prompt: false, reason: 'too_soon' },
        })
      }
    }

    // Check prompts this week
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const weeklyPrompts = await c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM story_prompts
     WHERE biography_id = ? AND prompted_at > ?`
    )
      .bind(biography.id, oneWeekAgo.toISOString())
      .first<{ count: number }>()

    if ((weeklyPrompts?.count || 0) >= PROMPT_CONFIG.maxPromptsPerWeek) {
      return c.json({
        success: true,
        data: { should_prompt: false, reason: 'weekly_limit' },
      })
    }

    return c.json({
      success: true,
      data: {
        should_prompt: true,
        reason: 'eligible',
      },
    })
  }
)

// GET /story-prompts/next - Get the next recommended prompt
storyPromptsRoutes.get(
  '/next',
  describeRoute({
    tags: ['StoryPrompts'],
    summary: '取得下一個推薦的故事推題',
    description:
      '根據用戶的故事填寫進度和推題策略，返回下一個推薦的故事欄位。支援多種策略：random（隨機）、easy_first（簡單優先）、category_rotate（分類輪替）。',
    responses: {
      200: { description: '成功取得推薦的故事欄位' },
      401: { description: '未授權，需要登入' },
      404: { description: '找不到人物誌' },
    },
  }),
  authMiddleware,
  validator('query', nextQuerySchema),
  async (c) => {
    const userId = c.get('userId')
    const strategy = c.req.query('strategy') || 'random'

    // Get user's biography
    const biography = await c.env.DB.prepare('SELECT id FROM biographies WHERE user_id = ?')
      .bind(userId)
      .first<{ id: string }>()

    if (!biography) {
      return c.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Biography not found',
        },
        404
      )
    }

    // Get already answered questions from biography_stories table
    const answeredStories = await c.env.DB.prepare(
      `SELECT question_id FROM biography_stories
     WHERE biography_id = ? AND content IS NOT NULL AND content != ''`
    )
      .bind(biography.id)
      .all<{ question_id: string }>()

    const answeredQuestionIds = new Set((answeredStories.results || []).map((r) => r.question_id))

    // Find unanswered questions - check against answered question IDs
    const unansweredQuestions = ADVANCED_STORY_QUESTIONS.filter(
      (q) => !answeredQuestionIds.has(q.questionId)
    )

    if (unansweredQuestions.length === 0) {
      return c.json({
        success: true,
        data: null,
        message: 'All stories completed',
      })
    }

    // Get prompt history for cooldown filtering
    const cooldownDate = new Date()
    cooldownDate.setDate(cooldownDate.getDate() - PROMPT_CONFIG.cooldownAfterDismiss)

    const recentlyDismissed = await c.env.DB.prepare(
      `SELECT question_id FROM story_prompts
     WHERE biography_id = ?
     AND last_dismissed_at > ?
     AND dismissed_count > 0`
    )
      .bind(biography.id, cooldownDate.toISOString())
      .all<{ question_id: string }>()

    const dismissedQuestions = new Set((recentlyDismissed.results || []).map((r) => r.question_id))

    // Get permanently dismissed questions (>= maxDismissCount)
    const permanentlyDismissed = await c.env.DB.prepare(
      `SELECT question_id FROM story_prompts
     WHERE biography_id = ? AND dismissed_count >= ?`
    )
      .bind(biography.id, PROMPT_CONFIG.maxDismissCount)
      .all<{ question_id: string }>()

    const permanentDismissedQuestions = new Set(
      (permanentlyDismissed.results || []).map((r) => r.question_id)
    )

    // Filter available questions
    let availableQuestions = unansweredQuestions.filter(
      (q) => !dismissedQuestions.has(q.questionId) && !permanentDismissedQuestions.has(q.questionId)
    )

    // If all filtered out, use unanswered but not permanently dismissed
    if (availableQuestions.length === 0) {
      availableQuestions = unansweredQuestions.filter(
        (q) => !permanentDismissedQuestions.has(q.questionId)
      )
    }

    // Still empty? Use all unanswered
    if (availableQuestions.length === 0) {
      availableQuestions = unansweredQuestions
    }

    // Select based on strategy
    let selected: (typeof ADVANCED_STORY_QUESTIONS)[number]

    switch (strategy) {
      case 'easy_first': {
        const easyQuestionIds = [
          'funny_moment',
          'favorite_spot',
          'climbing_trip',
          'life_outside_climbing',
        ]
        const easy = availableQuestions.filter((q) => easyQuestionIds.includes(q.questionId))
        selected =
          easy.length > 0
            ? easy[Math.floor(Math.random() * easy.length)]
            : availableQuestions[Math.floor(Math.random() * availableQuestions.length)]
        break
      }
      case 'category_rotate': {
        const categoryOrder = ['growth', 'psychology', 'community', 'practical', 'dreams', 'life']
        for (const cat of categoryOrder) {
          const catQuestions = availableQuestions.filter((q) => q.category === cat)
          if (catQuestions.length > 0) {
            selected = catQuestions[Math.floor(Math.random() * catQuestions.length)]
            break
          }
        }
        selected =
          selected! || availableQuestions[Math.floor(Math.random() * availableQuestions.length)]
        break
      }
      default: // random
        selected = availableQuestions[Math.floor(Math.random() * availableQuestions.length)]
    }

    // Record prompt (atomic UPSERT to avoid race conditions)
    const promptId = generateId()
    await c.env.DB.prepare(
      `INSERT INTO story_prompts (id, user_id, biography_id, question_id, category, prompted_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(biography_id, question_id) DO UPDATE SET
       prompted_at = datetime('now')`
    )
      .bind(promptId, userId, biography.id, selected.questionId, selected.category)
      .run()

    return c.json({
      success: true,
      data: {
        questionId: selected.questionId,
        category: selected.category,
        remaining_count: availableQuestions.length,
      },
    })
  }
)

// POST /story-prompts/:questionId/dismiss - Record a dismissal
storyPromptsRoutes.post(
  '/:questionId/dismiss',
  describeRoute({
    tags: ['StoryPrompts'],
    summary: '跳過故事推題',
    description:
      '記錄用戶跳過某個故事推題。跳過次數會累計，超過設定次數後該題目將不再推送。跳過後需等待冷卻時間才會再次推送同一題目。',
    responses: {
      200: { description: '成功記錄跳過' },
      401: { description: '未授權，需要登入' },
      404: { description: '找不到人物誌' },
    },
  }),
  authMiddleware,
  async (c) => {
    const userId = c.get('userId')
    const questionId = c.req.param('questionId')

    const biography = await c.env.DB.prepare('SELECT id FROM biographies WHERE user_id = ?')
      .bind(userId)
      .first<{ id: string }>()

    if (!biography) {
      return c.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Biography not found',
        },
        404
      )
    }

    // Atomic UPSERT to avoid race conditions and use proper category
    const category = getQuestionCategory(questionId)
    const promptId = generateId()

    await c.env.DB.prepare(
      `INSERT INTO story_prompts (id, user_id, biography_id, question_id, category, dismissed_count, last_dismissed_at)
     VALUES (?, ?, ?, ?, ?, 1, datetime('now'))
     ON CONFLICT(biography_id, question_id) DO UPDATE SET
       dismissed_count = dismissed_count + 1,
       last_dismissed_at = datetime('now')`
    )
      .bind(promptId, userId, biography.id, questionId, category)
      .run()

    return c.json({
      success: true,
      message: 'Dismissal recorded',
    })
  }
)

// POST /story-prompts/:questionId/complete - Mark a story as completed
storyPromptsRoutes.post(
  '/:questionId/complete',
  describeRoute({
    tags: ['StoryPrompts'],
    summary: '標記故事推題為已完成',
    description: '當用戶完成某個故事欄位的填寫後，記錄完成狀態。已完成的欄位不會再被推送。',
    responses: {
      200: { description: '成功標記為已完成' },
      401: { description: '未授權，需要登入' },
      404: { description: '找不到人物誌' },
    },
  }),
  authMiddleware,
  async (c) => {
    const userId = c.get('userId')
    const questionId = c.req.param('questionId')

    const biography = await c.env.DB.prepare('SELECT id FROM biographies WHERE user_id = ?')
      .bind(userId)
      .first<{ id: string }>()

    if (!biography) {
      return c.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Biography not found',
        },
        404
      )
    }

    // Atomic UPSERT to avoid race conditions and use proper category
    const category = getQuestionCategory(questionId)
    const promptId = generateId()

    await c.env.DB.prepare(
      `INSERT INTO story_prompts (id, user_id, biography_id, question_id, category, completed_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(biography_id, question_id) DO UPDATE SET
       completed_at = datetime('now')`
    )
      .bind(promptId, userId, biography.id, questionId, category)
      .run()

    return c.json({
      success: true,
      message: 'Story completion recorded',
    })
  }
)

// GET /story-prompts/progress - Get user's story prompt progress
storyPromptsRoutes.get(
  '/progress',
  describeRoute({
    tags: ['StoryPrompts'],
    summary: '取得故事推題進度',
    description: '取得用戶的故事推題進度統計，包括各欄位的推題記錄、完成狀態、跳過次數等資訊。',
    responses: {
      200: { description: '成功取得進度資訊' },
      401: { description: '未授權，需要登入' },
    },
  }),
  authMiddleware,
  async (c) => {
    const userId = c.get('userId')

    const biography = await c.env.DB.prepare('SELECT id FROM biographies WHERE user_id = ?')
      .bind(userId)
      .first<{ id: string }>()

    if (!biography) {
      return c.json({
        success: true,
        data: null,
      })
    }

    const prompts = await c.env.DB.prepare(
      `SELECT question_id, category, prompted_at, completed_at, dismissed_count, last_dismissed_at
     FROM story_prompts WHERE biography_id = ?`
    )
      .bind(biography.id)
      .all()

    const stats = await c.env.DB.prepare(
      `SELECT
      COUNT(*) as total_prompted,
      SUM(CASE WHEN completed_at IS NOT NULL THEN 1 ELSE 0 END) as total_completed,
      SUM(CASE WHEN dismissed_count >= ? THEN 1 ELSE 0 END) as permanently_dismissed
     FROM story_prompts WHERE biography_id = ?`
    )
      .bind(PROMPT_CONFIG.maxDismissCount, biography.id)
      .first<{ total_prompted: number; total_completed: number; permanently_dismissed: number }>()

    return c.json({
      success: true,
      data: {
        prompts: prompts.results,
        stats: {
          total_prompted: stats?.total_prompted || 0,
          total_completed: stats?.total_completed || 0,
          permanently_dismissed: stats?.permanently_dismissed || 0,
        },
      },
    })
  }
)
