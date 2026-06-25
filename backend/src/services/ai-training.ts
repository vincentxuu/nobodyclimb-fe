import type { ExerciseProtocol } from '@nobodyclimb/constants'
import {
  ANTI_STYLE_PROTOCOLS,
  EXERCISE_PROTOCOLS,
  getTrainingPlan,
  getTrainingSchoolMapping,
} from '@nobodyclimb/constants'
import type { PersonalityTypeCode } from '@nobodyclimb/types'
import type { AIWeekPlan } from '../schemas/ai-training'
import { AIWeekPlanSchema } from '../schemas/ai-training'
import type { Env } from '../types'
import { generateId } from '../utils/id'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AscentSummary {
  totalAscents: number
  maxGrade: string | null
  preferredType: string | null
  recentActivityCount: number
}

interface GeneratePlanResult {
  plan: AIWeekPlan
  source: 'ai' | 'template' | 'cache'
  difficulty_level: number
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class RateLimitError extends Error {
  constructor(message = '每日 AI 生成次數已達上限（3 次）') {
    super(message)
    this.name = 'RateLimitError'
  }
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class AITrainingService {
  private env: Env

  constructor(env: Env) {
    this.env = env
  }

  // -------------------------------------------------------------------------
  // Data access helpers
  // -------------------------------------------------------------------------

  async getAscentSummary(userId: string): Promise<AscentSummary> {
    const [totalResult, maxGradeResult, preferredTypeResult, recentResult] = await Promise.all([
      this.env.DB.prepare('SELECT COUNT(*) as total FROM user_route_ascents WHERE user_id = ?')
        .bind(userId)
        .first<{ total: number }>(),

      this.env.DB.prepare(
        `SELECT r.grade FROM user_route_ascents a
         JOIN routes r ON a.route_id = r.id
         WHERE a.user_id = ? AND r.grade IS NOT NULL
         ORDER BY r.grade DESC LIMIT 1`
      )
        .bind(userId)
        .first<{ grade: string }>(),

      this.env.DB.prepare(
        `SELECT r.route_type, COUNT(*) as cnt FROM user_route_ascents a
         JOIN routes r ON a.route_id = r.id
         WHERE a.user_id = ?
         GROUP BY r.route_type ORDER BY cnt DESC LIMIT 1`
      )
        .bind(userId)
        .first<{ route_type: string; cnt: number }>(),

      this.env.DB.prepare(
        `SELECT COUNT(*) as cnt FROM user_route_ascents
         WHERE user_id = ? AND ascent_date >= date('now', '-30 days')`
      )
        .bind(userId)
        .first<{ cnt: number }>(),
    ])

    return {
      totalAscents: totalResult?.total ?? 0,
      maxGrade: maxGradeResult?.grade ?? null,
      preferredType: preferredTypeResult?.route_type ?? null,
      recentActivityCount: recentResult?.cnt ?? 0,
    }
  }

  async getTrainingCompletion(userId: string, personalityType: string): Promise<number> {
    const result = await this.env.DB.prepare(
      `SELECT COUNT(*) as completed FROM training_progress
       WHERE user_id = ? AND personality_type = ? AND completed = 1`
    )
      .bind(userId, personalityType)
      .first<{ completed: number }>()

    const completedCount = result?.completed ?? 0
    return completedCount / 12 // 4 weeks x 3 days
  }

  async getLatestFeedback(
    userId: string,
    personalityType: string
  ): Promise<'too_easy' | 'just_right' | 'too_hard' | null> {
    const result = await this.env.DB.prepare(
      `SELECT f.rating FROM ai_training_feedback f
       JOIN ai_training_plans p ON f.plan_id = p.id
       WHERE f.user_id = ? AND p.personality_type = ?
       ORDER BY f.created_at DESC LIMIT 1`
    )
      .bind(userId, personalityType)
      .first<{ rating: 'too_easy' | 'just_right' | 'too_hard' }>()

    return result?.rating ?? null
  }

  // -------------------------------------------------------------------------
  // Difficulty calculation
  // -------------------------------------------------------------------------

  static calculateDifficultyLevel(
    ascentSummary: AscentSummary,
    completionRate: number,
    feedback: 'too_easy' | 'just_right' | 'too_hard' | null,
    currentLevel: number
  ): number {
    let level = currentLevel

    // Initial mapping from max grade
    if (currentLevel === 0) {
      const grade = ascentSummary.maxGrade
      if (!grade) {
        level = 1
      } else {
        const match = grade.match(/5\.(\d+)([a-d])?/)
        if (!match) {
          level = 1
        } else {
          const num = parseInt(match[1], 10)
          if (num < 10) {
            level = 1
          } else if (num === 10) {
            level = 2
          } else if (num === 11) {
            level = 3
          } else if (num === 12) {
            level = 4
          } else {
            level = 5
          }
        }
      }
    }

    // Adjustments based on completion and feedback
    if (completionRate >= 1.0 && feedback === 'too_easy') {
      level += 1
    }
    if (completionRate < 0.5 || feedback === 'too_hard') {
      level -= 1
    }

    // Clamp to [1, 5]
    return Math.max(1, Math.min(5, level))
  }

  // -------------------------------------------------------------------------
  // Template & exercise helpers
  // -------------------------------------------------------------------------

  getBaseTemplate(typeCode: PersonalityTypeCode, weekNumber: number) {
    const plan = getTrainingPlan(typeCode)
    return plan.weeks.find((w) => w.weekNumber === weekNumber) ?? null
  }

  getRelevantExercises(typeCode: PersonalityTypeCode): ExerciseProtocol[] {
    const mapping = getTrainingSchoolMapping(typeCode)
    const antiStyle = ANTI_STYLE_PROTOCOLS.find((p) => p.id === mapping.antiStyleProtocolId)
    if (!antiStyle) return []

    const exerciseIds = [...antiStyle.emphasisExerciseIds, ...antiStyle.maintenanceExerciseIds]
    return EXERCISE_PROTOCOLS.filter((e) => exerciseIds.includes(e.id))
  }

  // -------------------------------------------------------------------------
  // Prompt building
  // -------------------------------------------------------------------------

  buildPrompt(
    template: {
      theme: string
      days: Array<{
        title: string
        description: string
        duration: number
        exercises: Array<{ name: string; description: string }>
      }>
    },
    exercises: ExerciseProtocol[],
    ascentSummary: AscentSummary,
    completionRate: number,
    feedback: string | null,
    difficultyLevel: number
  ) {
    return [
      {
        role: 'system',
        content: `你是攀岩訓練調整助手。以下是基礎訓練計畫，根據用戶數據做微調，不要改變核心結構。
回應必須是純 JSON 格式，不要包含 markdown 或其他格式。`,
      },
      {
        role: 'user',
        content: `## 基礎計畫
週主題：${template.theme}
${JSON.stringify(template.days, null, 2)}

## 可用練習庫
${exercises.map((e) => `- ${e.nameZh}（${e.name}）：${e.sets[0]}-${e.sets[1]} 組，${e.reps}，休息 ${e.restSeconds[0]}-${e.restSeconds[1]} 秒`).join('\n')}

## 用戶數據
- 難度等級：${difficultyLevel}/5
- 總攀登記錄：${ascentSummary.totalAscents} 筆
- 最高難度：${ascentSummary.maxGrade || '未知'}
- 偏好類型：${ascentSummary.preferredType || '未知'}
- 近 30 天活躍度：${ascentSummary.recentActivityCount} 次
- 訓練完成率：${(completionRate * 100).toFixed(0)}%
- 最近回饋：${feedback || '無'}

## 可調範圍
✓ 調整組數和強度
✓ 替換等價練習（從可用練習庫中選擇）
✓ 調整難度描述
✓ 加個人化鼓勵

## 不可調範圍
✗ 不要改訓練階段順序
✗ 不要改核心練習類型（指力板、抱石等大類不變）
✗ 不要改休息日安排（第 3 天固定是恢復日）

## 輸出格式
回傳純 JSON，格式如下：
{"days":[{"title":"...","description":"...","duration":60,"exercises":[{"name":"...","sets":6,"reps":"...","notes":"..."}]}]}
days 陣列必須剛好 3 個元素。`,
      },
    ]
  }

  // -------------------------------------------------------------------------
  // Rate limiting
  // -------------------------------------------------------------------------

  private async checkForceRateLimit(userId: string): Promise<void> {
    const result = await this.env.DB.prepare(
      `SELECT COUNT(*) as cnt FROM ai_training_plans
       WHERE user_id = ? AND source = 'ai' AND generated_at >= date('now', 'start of day')`
    )
      .bind(userId)
      .first<{ cnt: number }>()

    if ((result?.cnt ?? 0) >= 3) {
      throw new RateLimitError()
    }
  }

  // -------------------------------------------------------------------------
  // Template → AI plan format conversion
  // -------------------------------------------------------------------------

  private templateToAIPlan(weekTemplate: {
    days: Array<{
      title: string
      description: string
      duration: number
      exercises: Array<{ name: string; description: string }>
    }>
  }): AIWeekPlan {
    return {
      days: weekTemplate.days.map((d) => ({
        title: d.title,
        description: d.description,
        duration: d.duration,
        exercises: d.exercises.map((e) => ({
          name: e.name,
          notes: e.description,
        })),
      })),
    }
  }

  // -------------------------------------------------------------------------
  // DB upsert
  // -------------------------------------------------------------------------

  private async upsertPlan(
    id: string,
    userId: string,
    personalityType: string,
    weekNumber: number,
    difficultyLevel: number,
    planContent: AIWeekPlan,
    source: 'ai' | 'template',
    modelId: string | null,
    promptTokens: number | null,
    completionTokens: number | null
  ): Promise<void> {
    await this.env.DB.prepare(
      `INSERT INTO ai_training_plans (id, user_id, personality_type, week_number, difficulty_level, plan_content, source, model_id, prompt_tokens, completion_tokens, generated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(user_id, personality_type, week_number) DO UPDATE SET
         difficulty_level = excluded.difficulty_level,
         plan_content = excluded.plan_content,
         source = excluded.source,
         model_id = excluded.model_id,
         prompt_tokens = excluded.prompt_tokens,
         completion_tokens = excluded.completion_tokens,
         generated_at = excluded.generated_at`
    )
      .bind(
        id,
        userId,
        personalityType,
        weekNumber,
        difficultyLevel,
        JSON.stringify(planContent),
        source,
        modelId,
        promptTokens,
        completionTokens
      )
      .run()
  }

  // -------------------------------------------------------------------------
  // Main generation method
  // -------------------------------------------------------------------------

  async generatePlan(
    userId: string,
    typeCode: PersonalityTypeCode,
    weekNumber: number,
    force: boolean
  ): Promise<GeneratePlanResult> {
    // 1. Check cache (skip if force)
    if (!force) {
      const cached = await this.env.DB.prepare(
        'SELECT * FROM ai_training_plans WHERE user_id = ? AND personality_type = ? AND week_number = ?'
      )
        .bind(userId, typeCode, weekNumber)
        .first<{
          plan_content: string
          source: 'ai' | 'template'
          difficulty_level: number
        }>()

      if (cached) {
        return {
          plan: JSON.parse(cached.plan_content) as AIWeekPlan,
          source: 'cache',
          difficulty_level: cached.difficulty_level,
        }
      }
    }

    // 2. Rate limit check for force regeneration
    if (force) {
      await this.checkForceRateLimit(userId)
    }

    // 3. Get ascent summary
    const ascentSummary = await this.getAscentSummary(userId)

    // 4. Fallback to raw template if insufficient data
    if (ascentSummary.totalAscents < 5) {
      const template = this.getBaseTemplate(typeCode, weekNumber)
      if (!template) {
        throw new Error(`找不到 ${typeCode} 第 ${weekNumber} 週的訓練計畫模板`)
      }
      const plan = this.templateToAIPlan(template)
      const id = generateId()
      await this.upsertPlan(id, userId, typeCode, weekNumber, 2, plan, 'template', null, null, null)
      return { plan, source: 'template', difficulty_level: 2 }
    }

    // 5. Collect user data
    const [completionRate, latestFeedback] = await Promise.all([
      this.getTrainingCompletion(userId, typeCode),
      this.getLatestFeedback(userId, typeCode),
    ])

    // 6. Get current difficulty level
    const existingPlan = await this.env.DB.prepare(
      'SELECT difficulty_level FROM ai_training_plans WHERE user_id = ? AND personality_type = ? ORDER BY generated_at DESC LIMIT 1'
    )
      .bind(userId, typeCode)
      .first<{ difficulty_level: number }>()

    const currentLevel = existingPlan?.difficulty_level ?? 0

    // 7. Calculate new difficulty
    const difficultyLevel = AITrainingService.calculateDifficultyLevel(
      ascentSummary,
      completionRate,
      latestFeedback,
      currentLevel
    )

    // 8. Get base template and exercises
    const template = this.getBaseTemplate(typeCode, weekNumber)
    if (!template) {
      throw new Error(`找不到 ${typeCode} 第 ${weekNumber} 週的訓練計畫模板`)
    }
    const exercises = this.getRelevantExercises(typeCode)

    // 9. Build prompt
    const messages = this.buildPrompt(
      template,
      exercises,
      ascentSummary,
      completionRate,
      latestFeedback,
      difficultyLevel
    )

    // 10. Call Workers AI
    try {
      const aiResponse = (await this.env.AI.run('@cf/google/gemma-3-12b-it', {
        messages,
        response_format: { type: 'json_object' },
      })) as { response: string }

      const parsed = JSON.parse(aiResponse.response)
      const validated = AIWeekPlanSchema.safeParse(parsed)

      if (validated.success) {
        const id = generateId()
        await this.upsertPlan(
          id,
          userId,
          typeCode,
          weekNumber,
          difficultyLevel,
          validated.data,
          'ai',
          '@cf/google/gemma-3-12b-it',
          null,
          null
        )
        return { plan: validated.data, source: 'ai', difficulty_level: difficultyLevel }
      }

      // 11. Validation failed → fallback to template
      console.error('AI 回應驗證失敗，使用模板', validated.error.issues)
    } catch (err) {
      // 12. AI call threw → fallback to template
      console.error('AI 呼叫失敗，使用模板', err)
    }

    // Fallback: use raw template
    const fallbackPlan = this.templateToAIPlan(template)
    const id = generateId()
    await this.upsertPlan(
      id,
      userId,
      typeCode,
      weekNumber,
      difficultyLevel,
      fallbackPlan,
      'template',
      null,
      null,
      null
    )
    return { plan: fallbackPlan, source: 'template', difficulty_level: difficultyLevel }
  }
}
