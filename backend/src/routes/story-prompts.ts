import { Hono } from 'hono';
import { Env } from '../types';
import { generateId } from '../utils/id';
import { authMiddleware } from '../middleware/auth';

export const storyPromptsRoutes = new Hono<{ Bindings: Env }>();

// ═══════════════════════════════════════════════════════════
// 故事推題 API
// ═══════════════════════════════════════════════════════════

// 推題頻率設定
const PROMPT_CONFIG = {
  minDaysBetweenPrompts: 1,      // 最少間隔1天
  maxPromptsPerWeek: 3,          // 每週最多推3次
  cooldownAfterDismiss: 7,       // 跳過後7天內不再推同一題
  maxDismissCount: 5,            // 跳過超過5次不再推
};

// 進階故事欄位定義（模組級別，供所有 handler 共用）
const ADVANCED_STORY_FIELDS = [
  { field: 'memorable_moment', category: 'growth' },
  { field: 'biggest_challenge', category: 'growth' },
  { field: 'breakthrough_story', category: 'growth' },
  { field: 'first_outdoor', category: 'growth' },
  { field: 'first_grade', category: 'growth' },
  { field: 'frustrating_climb', category: 'growth' },
  { field: 'fear_management', category: 'psychology' },
  { field: 'climbing_lesson', category: 'psychology' },
  { field: 'failure_perspective', category: 'psychology' },
  { field: 'flow_moment', category: 'psychology' },
  { field: 'life_balance', category: 'psychology' },
  { field: 'unexpected_gain', category: 'psychology' },
  { field: 'climbing_mentor', category: 'community' },
  { field: 'climbing_partner', category: 'community' },
  { field: 'funny_moment', category: 'community' },
  { field: 'favorite_spot', category: 'community' },
  { field: 'advice_to_group', category: 'community' },
  { field: 'climbing_space', category: 'community' },
  { field: 'injury_recovery', category: 'practical' },
  { field: 'memorable_route', category: 'practical' },
  { field: 'training_method', category: 'practical' },
  { field: 'effective_practice', category: 'practical' },
  { field: 'technique_tip', category: 'practical' },
  { field: 'gear_choice', category: 'practical' },
  { field: 'dream_climb', category: 'dreams' },
  { field: 'climbing_trip', category: 'dreams' },
  { field: 'bucket_list_story', category: 'dreams' },
  { field: 'climbing_goal', category: 'dreams' },
  { field: 'climbing_style', category: 'dreams' },
  { field: 'climbing_inspiration', category: 'dreams' },
  { field: 'life_outside_climbing', category: 'life' },
] as const;

/** 根據欄位名稱取得分類 */
function getFieldCategory(field: string): string {
  const fieldInfo = ADVANCED_STORY_FIELDS.find(f => f.field === field);
  return fieldInfo?.category ?? 'unknown';
}

// GET /story-prompts/should-prompt - Check if user should be shown a prompt
storyPromptsRoutes.get('/should-prompt', authMiddleware, async (c) => {
  const userId = c.get('userId');

  // Get user's biography
  const biography = await c.env.DB.prepare(
    'SELECT id FROM biographies WHERE user_id = ?'
  )
    .bind(userId)
    .first<{ id: string }>();

  if (!biography) {
    return c.json({
      success: true,
      data: { should_prompt: false, reason: 'no_biography' },
    });
  }

  // Check last prompt time
  const lastPrompt = await c.env.DB.prepare(
    `SELECT prompted_at FROM story_prompts
     WHERE biography_id = ?
     ORDER BY prompted_at DESC LIMIT 1`
  )
    .bind(biography.id)
    .first<{ prompted_at: string }>();

  if (lastPrompt) {
    const daysSinceLastPrompt = Math.floor(
      (Date.now() - new Date(lastPrompt.prompted_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLastPrompt < PROMPT_CONFIG.minDaysBetweenPrompts) {
      return c.json({
        success: true,
        data: { should_prompt: false, reason: 'too_soon' },
      });
    }
  }

  // Check prompts this week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weeklyPrompts = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM story_prompts
     WHERE biography_id = ? AND prompted_at > ?`
  )
    .bind(biography.id, oneWeekAgo.toISOString())
    .first<{ count: number }>();

  if ((weeklyPrompts?.count || 0) >= PROMPT_CONFIG.maxPromptsPerWeek) {
    return c.json({
      success: true,
      data: { should_prompt: false, reason: 'weekly_limit' },
    });
  }

  // Random 50% chance to show prompt (avoid being too aggressive)
  const shouldShow = Math.random() > 0.5;

  return c.json({
    success: true,
    data: {
      should_prompt: shouldShow,
      reason: shouldShow ? 'eligible' : 'random_skip',
    },
  });
});

// GET /story-prompts/next - Get the next recommended prompt
storyPromptsRoutes.get('/next', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const strategy = c.req.query('strategy') || 'random';

  // Get user's biography with all story fields
  const biography = await c.env.DB.prepare(
    `SELECT id,
      memorable_moment, biggest_challenge, breakthrough_story, first_outdoor, first_grade, frustrating_climb,
      fear_management, climbing_lesson, failure_perspective, flow_moment, life_balance, unexpected_gain,
      climbing_mentor, climbing_partner, funny_moment, favorite_spot, advice_to_group, climbing_space,
      injury_recovery, memorable_route, training_method, effective_practice, technique_tip, gear_choice,
      dream_climb, climbing_trip, bucket_list_story, climbing_goal, climbing_style, climbing_inspiration,
      life_outside_climbing
    FROM biographies WHERE user_id = ?`
  )
    .bind(userId)
    .first();

  if (!biography) {
    return c.json({
      success: false,
      error: 'Not Found',
      message: 'Biography not found',
    }, 404);
  }

  // Find unfilled fields using module-level constant
  const unfilledFields = ADVANCED_STORY_FIELDS.filter(
    (f) => !biography[f.field as keyof typeof biography] ||
           String(biography[f.field as keyof typeof biography]).trim() === ''
  );

  if (unfilledFields.length === 0) {
    return c.json({
      success: true,
      data: null,
      message: 'All stories completed',
    });
  }

  // Get prompt history for cooldown filtering
  const cooldownDate = new Date();
  cooldownDate.setDate(cooldownDate.getDate() - PROMPT_CONFIG.cooldownAfterDismiss);

  const recentlyDismissed = await c.env.DB.prepare(
    `SELECT field_name FROM story_prompts
     WHERE biography_id = ?
     AND last_dismissed_at > ?
     AND dismissed_count > 0`
  )
    .bind(biography.id, cooldownDate.toISOString())
    .all<{ field_name: string }>();

  const dismissedFields = new Set((recentlyDismissed.results || []).map(r => r.field_name));

  // Get permanently dismissed fields (>5 dismissals)
  const permanentlyDismissed = await c.env.DB.prepare(
    `SELECT field_name FROM story_prompts
     WHERE biography_id = ? AND dismissed_count >= ?`
  )
    .bind(biography.id, PROMPT_CONFIG.maxDismissCount)
    .all<{ field_name: string }>();

  const permanentDismissedFields = new Set((permanentlyDismissed.results || []).map(r => r.field_name));

  // Filter available fields
  let availableFields = unfilledFields.filter(
    (f) => !dismissedFields.has(f.field) && !permanentDismissedFields.has(f.field)
  );

  // If all filtered out, use unfilled but not permanently dismissed
  if (availableFields.length === 0) {
    availableFields = unfilledFields.filter((f) => !permanentDismissedFields.has(f.field));
  }

  // Still empty? Use all unfilled
  if (availableFields.length === 0) {
    availableFields = unfilledFields;
  }

  // Select based on strategy
  let selected: typeof ADVANCED_STORY_FIELDS[number];

  switch (strategy) {
    case 'easy_first': {
      const easyFields = ['funny_moment', 'favorite_spot', 'climbing_trip', 'life_outside_climbing'];
      const easy = availableFields.filter((f) => easyFields.includes(f.field));
      selected = easy.length > 0
        ? easy[Math.floor(Math.random() * easy.length)]
        : availableFields[Math.floor(Math.random() * availableFields.length)];
      break;
    }
    case 'category_rotate': {
      const categoryOrder = ['growth', 'psychology', 'community', 'practical', 'dreams', 'life'];
      for (const cat of categoryOrder) {
        const catFields = availableFields.filter((f) => f.category === cat);
        if (catFields.length > 0) {
          selected = catFields[Math.floor(Math.random() * catFields.length)];
          break;
        }
      }
      selected = selected! || availableFields[Math.floor(Math.random() * availableFields.length)];
      break;
    }
    default: // random
      selected = availableFields[Math.floor(Math.random() * availableFields.length)];
  }

  // Record prompt (atomic UPSERT to avoid race conditions)
  const promptId = generateId();
  await c.env.DB.prepare(
    `INSERT INTO story_prompts (id, user_id, biography_id, field_name, category, prompted_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(biography_id, field_name) DO UPDATE SET
       prompted_at = datetime('now')`
  )
    .bind(promptId, userId, biography.id, selected.field, selected.category)
    .run();

  return c.json({
    success: true,
    data: {
      field: selected.field,
      category: selected.category,
      remaining_count: availableFields.length,
    },
  });
});

// POST /story-prompts/:field/dismiss - Record a dismissal
storyPromptsRoutes.post('/:field/dismiss', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const field = c.req.param('field');

  const biography = await c.env.DB.prepare(
    'SELECT id FROM biographies WHERE user_id = ?'
  )
    .bind(userId)
    .first<{ id: string }>();

  if (!biography) {
    return c.json({
      success: false,
      error: 'Not Found',
      message: 'Biography not found',
    }, 404);
  }

  // Atomic UPSERT to avoid race conditions and use proper category
  const category = getFieldCategory(field);
  const promptId = generateId();

  await c.env.DB.prepare(
    `INSERT INTO story_prompts (id, user_id, biography_id, field_name, category, dismissed_count, last_dismissed_at)
     VALUES (?, ?, ?, ?, ?, 1, datetime('now'))
     ON CONFLICT(biography_id, field_name) DO UPDATE SET
       dismissed_count = dismissed_count + 1,
       last_dismissed_at = datetime('now')`
  )
    .bind(promptId, userId, biography.id, field, category)
    .run();

  return c.json({
    success: true,
    message: 'Dismissal recorded',
  });
});

// POST /story-prompts/:field/complete - Mark a story as completed
storyPromptsRoutes.post('/:field/complete', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const field = c.req.param('field');

  const biography = await c.env.DB.prepare(
    'SELECT id FROM biographies WHERE user_id = ?'
  )
    .bind(userId)
    .first<{ id: string }>();

  if (!biography) {
    return c.json({
      success: false,
      error: 'Not Found',
      message: 'Biography not found',
    }, 404);
  }

  // Atomic UPSERT to avoid race conditions and use proper category
  const category = getFieldCategory(field);
  const promptId = generateId();

  await c.env.DB.prepare(
    `INSERT INTO story_prompts (id, user_id, biography_id, field_name, category, completed_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(biography_id, field_name) DO UPDATE SET
       completed_at = datetime('now')`
  )
    .bind(promptId, userId, biography.id, field, category)
    .run();

  return c.json({
    success: true,
    message: 'Story completion recorded',
  });
});

// GET /story-prompts/progress - Get user's story prompt progress
storyPromptsRoutes.get('/progress', authMiddleware, async (c) => {
  const userId = c.get('userId');

  const biography = await c.env.DB.prepare(
    'SELECT id FROM biographies WHERE user_id = ?'
  )
    .bind(userId)
    .first<{ id: string }>();

  if (!biography) {
    return c.json({
      success: true,
      data: null,
    });
  }

  const prompts = await c.env.DB.prepare(
    `SELECT field_name, category, prompted_at, completed_at, dismissed_count, last_dismissed_at
     FROM story_prompts WHERE biography_id = ?`
  )
    .bind(biography.id)
    .all();

  const stats = await c.env.DB.prepare(
    `SELECT
      COUNT(*) as total_prompted,
      SUM(CASE WHEN completed_at IS NOT NULL THEN 1 ELSE 0 END) as total_completed,
      SUM(CASE WHEN dismissed_count >= ? THEN 1 ELSE 0 END) as permanently_dismissed
     FROM story_prompts WHERE biography_id = ?`
  )
    .bind(PROMPT_CONFIG.maxDismissCount, biography.id)
    .first<{ total_prompted: number; total_completed: number; permanently_dismissed: number }>();

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
  });
});
