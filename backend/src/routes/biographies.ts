import { Hono } from 'hono';
import { Env, Biography } from '../types';
import { parsePagination, generateId, generateSlug } from '../utils/id';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { createNotification } from './notifications';
import { deleteR2Images } from '../utils/storage';
import { trackAndIncrementViewCount } from '../utils/viewTracker';
import { BiographyRepository } from '../repositories/biography-repository';
import { BiographyContentRepository } from '../repositories/biography-content-repository';
import { BiographyService } from '../services/biography-service';

// ═══════════════════════════════════════════════════════════
// Request Body Type - 包含前端傳入的 JSON 欄位用於同步到獨立表
// ═══════════════════════════════════════════════════════════

/**
 * Biography request body type
 * 包含 Biography 欄位以及用於同步到獨立表的 JSON 欄位
 */
type BiographyRequestBody = Partial<Biography> & {
  one_liners_data?: string | Record<string, { answer?: string; visibility?: string }>;
  stories_data?: string | Record<string, Record<string, { answer?: string; visibility?: string }>>;
  climbing_origin?: string | null;
  climbing_meaning?: string | null;
  advice_to_self?: string | null;
};

// ═══════════════════════════════════════════════════════════
// 共用常數 - 故事欄位定義
// ═══════════════════════════════════════════════════════════

/** 核心故事欄位 (3 題) */
const CORE_STORY_FIELDS = ['climbing_origin', 'climbing_meaning', 'advice_to_self'] as const;

/** 進階故事欄位 (31 題) */
const ADVANCED_STORY_FIELDS = [
  'memorable_moment', 'biggest_challenge', 'breakthrough_story', 'first_outdoor', 'first_grade', 'frustrating_climb',
  'fear_management', 'climbing_lesson', 'failure_perspective', 'flow_moment', 'life_balance', 'unexpected_gain',
  'climbing_mentor', 'climbing_partner', 'funny_moment', 'favorite_spot', 'advice_to_group', 'climbing_space',
  'injury_recovery', 'memorable_route', 'training_method', 'effective_practice', 'technique_tip', 'gear_choice',
  'dream_climb', 'climbing_trip', 'bucket_list_story', 'climbing_goal', 'climbing_style', 'climbing_inspiration',
  'life_outside_climbing',
] as const;

/** 所有故事欄位 */
const ALL_STORY_FIELDS = [...CORE_STORY_FIELDS, ...ADVANCED_STORY_FIELDS] as const;

/** BiographyV2 新欄位 */
const V2_FIELDS = [
  'visibility',
  'tags_data',
  'basic_info_data',
  'autosave_at',
] as const;

/** Visibility 等級 */
type VisibilityLevel = 'private' | 'anonymous' | 'community' | 'public';

export const biographiesRoutes = new Hono<{ Bindings: Env }>();

// ═══════════════════════════════════════════════════════════
// Visibility 工具函數
// ═══════════════════════════════════════════════════════════

/**
 * 根據用戶身份產生 SQL WHERE 子句
 * @param userId - 當前用戶 ID（未登入為 undefined）
 * @param tableAlias - 表格別名（如 'b'）
 * @returns SQL WHERE 子句片段（不含 WHERE 關鍵字）
 */
function getVisibilityWhereClause(userId: string | undefined, tableAlias: string = ''): string {
  const prefix = tableAlias ? `${tableAlias}.` : '';

  if (userId) {
    // 登入用戶：可看 public、community、anonymous，以及自己的 private
    return `(
      ${prefix}visibility = 'public' OR
      ${prefix}visibility = 'community' OR
      ${prefix}visibility = 'anonymous' OR
      (${prefix}visibility = 'private' AND ${prefix}user_id = '${userId}')
    )`;
  } else {
    // 未登入用戶：只能看 public 和 anonymous
    return `(
      ${prefix}visibility = 'public' OR
      ${prefix}visibility = 'anonymous'
    )`;
  }
}

// ═══════════════════════════════════════════════════════════
// KV 快取 - 用於前端 SSR metadata
// ═══════════════════════════════════════════════════════════

interface BiographyMetadata {
  id: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  title: string | null;
}

/**
 * 將人物誌 metadata 寫入 KV 快取
 * 前端 SSR 會讀取此快取以避免 Worker-to-Worker 522 超時
 */
async function cacheBiographyMetadata(
  cache: KVNamespace,
  biography: BiographyMetadata
): Promise<void> {
  const cacheKey = `bio-meta:${biography.id}`;
  const metadata = {
    id: biography.id,
    name: biography.name,
    avatar_url: biography.avatar_url,
    bio: biography.bio,
    title: biography.title,
  };

  try {
    await cache.put(cacheKey, JSON.stringify(metadata), {
      expirationTtl: 86400 * 7, // 7 天過期
    });
  } catch (error) {
    console.error(`Failed to cache biography metadata for ${biography.id}:`, error);
  }
}

/**
 * 清除人物誌相關快取（當人物誌更新時呼叫）
 * - biography:slug:{slug} - 詳細頁快取
 * - biographies:featured:* - 首頁精選快取
 */
async function invalidateBiographyCaches(
  cache: KVNamespace,
  slug: string | null
): Promise<void> {
  const keysToDelete: string[] = [];

  // Detail page cache
  if (slug) {
    keysToDelete.push(`biography:slug:${slug}`);
  }

  // Featured list caches (common limits: 3 for homepage, 6 for explore, 10 for admin)
  keysToDelete.push(...[3, 6, 10].map(limit => `biographies:featured:${limit}`));

  // 並行刪除所有快取 key
  await Promise.all(
    keysToDelete.map(key =>
      cache.delete(key).catch(error => {
        console.error(`Failed to invalidate cache ${key}:`, error);
      })
    )
  );
}

// GET /biographies - List all public biographies
biographiesRoutes.get('/', optionalAuthMiddleware, async (c) => {
  const userId = c.get('userId');
  const { page, limit } = parsePagination(
    c.req.query('page'),
    c.req.query('limit')
  );
  const featured = c.req.query('featured');
  const search = c.req.query('search');

  // 使用 Service 層處理業務邏輯
  const repository = new BiographyRepository(c.env.DB);
  const contentRepository = new BiographyContentRepository(c.env.DB);
  const service = new BiographyService(repository, contentRepository, c.env.DB);

  const response = await service.getList({
    page,
    limit,
    userId,
    isFeatured: featured === 'true' ? true : undefined,
    searchTerm: search || undefined,
  });

  return c.json({
    success: true,
    data: response.data,
    pagination: {
      page: response.pagination.page,
      limit: response.pagination.limit,
      total: response.pagination.total,
      total_pages: response.pagination.totalPages,
    },
  });
});

// GET /biographies/featured - Get featured biographies (only truly public)
// Optimized for homepage: returns only necessary fields with KV caching
biographiesRoutes.get('/featured', async (c) => {
  const limit = parseInt(c.req.query('limit') || '3', 10);

  // Check cache first (5 minute TTL)
  const cacheKey = `biographies:featured:${limit}`;
  try {
    const cached = await c.env.CACHE.get(cacheKey);
    if (cached) {
      return c.json({
        success: true,
        data: JSON.parse(cached),
      });
    }
  } catch (e) {
    console.error(`Cache read error for ${cacheKey}:`, e);
  }

  // 使用 Service 層處理業務邏輯
  const repository = new BiographyRepository(c.env.DB);
  const contentRepository = new BiographyContentRepository(c.env.DB);
  const service = new BiographyService(repository, contentRepository, c.env.DB);

  const results = await service.getFeatured(limit);

  // Cache the result for 5 minutes
  try {
    await c.env.CACHE.put(cacheKey, JSON.stringify(results), { expirationTtl: 300 });
  } catch (e) {
    console.error(`Cache write error for ${cacheKey}:`, e);
  }

  return c.json({
    success: true,
    data: results,
  });
});

// GET /biographies/me - Get current user's biography
biographiesRoutes.get('/me', authMiddleware, async (c) => {
  const userId = c.get('userId');

  // 使用 Service 層處理業務邏輯
  const repository = new BiographyRepository(c.env.DB);
  const contentRepository = new BiographyContentRepository(c.env.DB);
  const service = new BiographyService(repository, contentRepository, c.env.DB);

  const biography = await service.getMyBiography(userId);

  return c.json({
    success: true,
    data: biography,
  });
});

// GET /biographies/:id - Get biography by ID
biographiesRoutes.get('/:id', optionalAuthMiddleware, async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');

  // 使用 Service 層處理業務邏輯
  const repository = new BiographyRepository(c.env.DB);
  const contentRepository = new BiographyContentRepository(c.env.DB);
  const service = new BiographyService(repository, contentRepository, c.env.DB);

  const biography = await service.getById(id, userId);

  if (!biography) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Biography not found',
      },
      404
    );
  }

  return c.json({
    success: true,
    data: biography,
  });
});

// GET /biographies/slug/:slug - Get biography by slug
// Optimized with KV caching for public biographies (anonymous visitors)
biographiesRoutes.get('/slug/:slug', optionalAuthMiddleware, async (c) => {
  const slug = c.req.param('slug');
  const userId = c.get('userId');

  // For anonymous users, try cache first (public biographies only)
  if (!userId) {
    const cacheKey = `biography:slug:${slug}`;
    try {
      const cached = await c.env.CACHE.get(cacheKey);
      if (cached) {
        const cachedData = JSON.parse(cached);
        // Verify it's still public (cache might be stale)
        if (cachedData.visibility === 'public') {
          return c.json({
            success: true,
            data: cachedData,
          });
        }
      }
    } catch (e) {
      console.error(`Cache read error for ${cacheKey}:`, e);
    }
  }

  // 使用 Service 層處理業務邏輯
  const repository = new BiographyRepository(c.env.DB);
  const contentRepository = new BiographyContentRepository(c.env.DB);
  const service = new BiographyService(repository, contentRepository, c.env.DB);

  const biography = await service.getById(slug, userId);

  if (!biography) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Biography not found',
      },
      404
    );
  }

  // Cache public biographies for anonymous users (5 minute TTL)
  const isPublic = biography.visibility === 'public';
  if (!userId && isPublic) {
    const cacheKey = `biography:slug:${slug}`;
    try {
      await c.env.CACHE.put(cacheKey, JSON.stringify(biography), { expirationTtl: 300 });
    } catch (e) {
      console.error(`Cache write error for ${cacheKey}:`, e);
    }
  }

  return c.json({
    success: true,
    data: biography,
  });
});

// POST /biographies - Create new biography (or update if exists)
biographiesRoutes.post('/', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<BiographyRequestBody>();

  if (!body.name) {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'Name is required',
      },
      400
    );
  }

  // 使用 Service 層處理業務邏輯
  const repository = new BiographyRepository(c.env.DB);
  const contentRepository = new BiographyContentRepository(c.env.DB);
  const service = new BiographyService(repository, contentRepository, c.env.DB);

  try {
    const biography = await service.createOrUpdate(userId, body as typeof body & { name: string });

    // 同步更新 KV 快取並清除舊快取
    await cacheBiographyMetadata(c.env.CACHE, {
      id: biography.id,
      name: biography.name,
      avatar_url: biography.avatar_url || null,
      bio: biography.bio || null,
      title: biography.title || null,
    });

    // 清除詳細頁和首頁精選快取
    await invalidateBiographyCaches(c.env.CACHE, biography.slug);

    // 判斷是新建還是更新
    const isNewBiography = !await repository.findByUserId(userId);

    return c.json(
      {
        success: true,
        data: biography,
      },
      isNewBiography ? 201 : 200
    );
  } catch (error) {
    console.error('Error creating/updating biography:', error);

    if (error instanceof Error && error.message === 'User not found') {
      return c.json(
        {
          success: false,
          error: 'Not Found',
          message: 'User not found',
        },
        404
      );
    }

    return c.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to create/update biography',
      },
      500
    );
  }
});

// PUT /biographies/me - Update current user's biography (Upsert pattern)
// If biography doesn't exist, creates one automatically
biographiesRoutes.put('/me', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<BiographyRequestBody>();

  // 使用 Service 層處理業務邏輯
  const repository = new BiographyRepository(c.env.DB);
  const contentRepository = new BiographyContentRepository(c.env.DB);
  const service = new BiographyService(repository, contentRepository, c.env.DB);

  try {
    const biography = await service.upsertMyBiography(userId, body);

    // 同步更新 KV 快取並清除舊快取
    await cacheBiographyMetadata(c.env.CACHE, {
      id: biography.id,
      name: biography.name,
      avatar_url: biography.avatar_url || null,
      bio: biography.bio || null,
      title: biography.title || null,
    });

    // 清除詳細頁和首頁精選快取
    await invalidateBiographyCaches(c.env.CACHE, biography.slug);

    return c.json({
      success: true,
      data: biography,
    });
  } catch (error) {
    console.error('Error upserting biography:', error);

    if (error instanceof Error && error.message === 'User not found') {
      return c.json(
        {
          success: false,
          error: 'Not Found',
          message: 'User not found',
        },
        404
      );
    }

    return c.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to upsert biography',
      },
      500
    );
  }
});


// PUT /biographies/me/autosave - Autosave current user's biography
// Rate limited: minimum 2 seconds between saves
biographiesRoutes.put('/me/autosave', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<BiographyRequestBody>();

  const existing = await c.env.DB.prepare(
    'SELECT id, autosave_at FROM biographies WHERE user_id = ?'
  )
    .bind(userId)
    .first<{ id: string; autosave_at: string | null }>();

  if (!existing) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Biography not found. Create one first.',
      },
      404
    );
  }

  // Rate limiting: minimum 2 seconds between saves
  if (existing.autosave_at) {
    const lastSave = new Date(existing.autosave_at).getTime();
    const now = Date.now();
    const minInterval = 2000; // 2 seconds

    if (now - lastSave < minInterval) {
      return c.json({
        success: true,
        data: {
          autosave_at: existing.autosave_at,
          throttled: true,
        },
      });
    }
  }

  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  // Autosave only accepts V2 JSON fields to avoid accidental overwrites
  const autosaveFields = [
    'tags_data',
    'basic_info_data',
  ];

  for (const field of autosaveFields) {
    if (body[field as keyof Biography] !== undefined) {
      updates.push(`${field} = ?`);
      // Stringify if object, otherwise use as-is
      const value = body[field as keyof Biography];
      values.push(typeof value === 'object' ? JSON.stringify(value) : value as string);
    }
  }

  if (updates.length > 0) {
    updates.push("autosave_at = datetime('now')");
    values.push(existing.id);

    await c.env.DB.prepare(
      `UPDATE biographies SET ${updates.join(', ')} WHERE id = ?`
    )
      .bind(...values)
      .run();
  }

  // 同步 one_liners_data 到對應資料表 (autosave)
  // - 核心故事 (climbing_origin, climbing_meaning, advice_to_self) → biography_core_stories
  // - 其他一句話 → biography_one_liners
  if (body.one_liners_data !== undefined) {
    const oneLinersData = typeof body.one_liners_data === 'string'
      ? JSON.parse(body.one_liners_data as string)
      : body.one_liners_data;

    if (oneLinersData && typeof oneLinersData === 'object') {
      const now = new Date().toISOString();
      const coreQuestionIds = new Set(CORE_STORY_FIELDS);

      for (const [questionId, data] of Object.entries(oneLinersData)) {
        const itemData = data as { answer?: string; visibility?: string };
        const answer = itemData?.answer;

        if (answer !== undefined) {
          // 核心故事存到 biography_core_stories 表
          if (coreQuestionIds.has(questionId as typeof CORE_STORY_FIELDS[number])) {
            const existingCoreStory = await c.env.DB.prepare(
              'SELECT id FROM biography_core_stories WHERE biography_id = ? AND question_id = ?'
            )
              .bind(existing.id, questionId)
              .first<{ id: string }>();

            if (answer === null || answer.trim() === '') {
              if (existingCoreStory) {
                await c.env.DB.prepare('DELETE FROM biography_core_stories WHERE id = ?')
                  .bind(existingCoreStory.id)
                  .run();
              }
            } else if (existingCoreStory) {
              await c.env.DB.prepare(
                'UPDATE biography_core_stories SET content = ?, updated_at = ? WHERE id = ?'
              )
                .bind(answer.trim(), now, existingCoreStory.id)
                .run();
            } else {
              const storyId = generateId();
              await c.env.DB.prepare(
                `INSERT INTO biography_core_stories (id, biography_id, question_id, content, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?)`
              )
                .bind(storyId, existing.id, questionId, answer.trim(), now, now)
                .run();
            }
          } else {
            // 一般一句話存到 biography_one_liners 表
            const existingOneLiner = await c.env.DB.prepare(
              'SELECT id FROM biography_one_liners WHERE biography_id = ? AND question_id = ?'
            )
              .bind(existing.id, questionId)
              .first<{ id: string }>();

            if (answer === null || answer.trim() === '') {
              if (existingOneLiner) {
                await c.env.DB.prepare('DELETE FROM biography_one_liners WHERE id = ?')
                  .bind(existingOneLiner.id)
                  .run();
              }
            } else if (existingOneLiner) {
              await c.env.DB.prepare(
                'UPDATE biography_one_liners SET answer = ?, updated_at = ? WHERE id = ?'
              )
                .bind(answer.trim(), now, existingOneLiner.id)
                .run();
            } else {
              const oneLinerId = generateId();
              await c.env.DB.prepare(
                `INSERT INTO biography_one_liners (id, biography_id, question_id, answer, source, created_at, updated_at)
                 VALUES (?, ?, ?, ?, 'system', ?, ?)`
              )
                .bind(oneLinerId, existing.id, questionId, answer.trim(), now, now)
                .run();
            }
          }
        }
      }
    }
  }

  // 同步 stories_data 到 biography_stories 表 (autosave)
  if (body.stories_data !== undefined) {
    const storiesData = typeof body.stories_data === 'string'
      ? JSON.parse(body.stories_data as string)
      : body.stories_data;

    if (storiesData && typeof storiesData === 'object') {
      const now = new Date().toISOString();

      // stories_data 格式: { category: { question_id: { answer, visibility, updated_at } } }
      for (const [categoryId, questions] of Object.entries(storiesData)) {
        if (questions && typeof questions === 'object') {
          for (const [questionId, data] of Object.entries(questions as Record<string, unknown>)) {
            const itemData = data as { answer?: string; visibility?: string };
            const content = itemData?.answer;

            if (content !== undefined) {
              const existingStory = await c.env.DB.prepare(
                'SELECT id FROM biography_stories WHERE biography_id = ? AND question_id = ?'
              )
                .bind(existing.id, questionId)
                .first<{ id: string }>();

              if (content === null || content.trim() === '') {
                // 如果內容為空，刪除記錄
                if (existingStory) {
                  await c.env.DB.prepare('DELETE FROM biography_stories WHERE id = ?')
                    .bind(existingStory.id)
                    .run();
                }
              } else if (existingStory) {
                // 更新現有記錄
                const characterCount = content.trim().length;
                await c.env.DB.prepare(
                  'UPDATE biography_stories SET content = ?, category_id = ?, character_count = ?, updated_at = ? WHERE id = ?'
                )
                  .bind(content.trim(), categoryId === 'uncategorized' ? null : categoryId, characterCount, now, existingStory.id)
                  .run();
              } else {
                // 插入新記錄
                const storyId = generateId();
                const characterCount = content.trim().length;
                await c.env.DB.prepare(
                  `INSERT INTO biography_stories (id, biography_id, question_id, category_id, content, source, character_count, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, 'system', ?, ?, ?)`
                )
                  .bind(storyId, existing.id, questionId, categoryId === 'uncategorized' ? null : categoryId, content.trim(), characterCount, now, now)
                  .run();
              }
            }
          }
        }
      }
    }
  }

  return c.json({
    success: true,
    data: {
      autosave_at: new Date().toISOString(),
    },
  });
});

// DELETE /biographies/me - Delete current user's biography
biographiesRoutes.delete('/me', authMiddleware, async (c) => {
  const userId = c.get('userId');

  const existing = await c.env.DB.prepare(
    'SELECT id, slug, profile_image, cover_image FROM biographies WHERE user_id = ?'
  )
    .bind(userId)
    .first<{ id: string; slug: string; profile_image: string | null; cover_image: string | null }>();

  if (!existing) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Biography not found',
      },
      404
    );
  }

  // Delete images from R2
  await deleteR2Images(c.env.STORAGE, [existing.profile_image, existing.cover_image]);

  await c.env.DB.prepare('DELETE FROM biographies WHERE id = ?')
    .bind(existing.id)
    .run();

  // 清除快取
  await invalidateBiographyCaches(c.env.CACHE, existing.slug);

  return c.json({
    success: true,
    message: 'Biography deleted successfully',
  });
});

// GET /biographies/:id/adjacent - Get previous and next biographies
biographiesRoutes.get('/:id/adjacent', optionalAuthMiddleware, async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');

  const visibilityClause = getVisibilityWhereClause(userId);
  const current = await c.env.DB.prepare(
    `SELECT published_at, created_at FROM biographies WHERE id = ? AND ${visibilityClause}`
  )
    .bind(id)
    .first<{ published_at: string | null; created_at: string }>();

  if (!current) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Biography not found',
      },
      404
    );
  }

  const orderDate = current.published_at || current.created_at;

  // Adjacent navigation only shows truly public biographies
  const publicOnlyClause = "visibility = 'public'";

  // Get previous (newer) biography
  const previous = await c.env.DB.prepare(
    `SELECT id, slug, name, avatar_url FROM biographies
     WHERE ${publicOnlyClause} AND id != ?
     AND COALESCE(published_at, created_at) > ?
     ORDER BY COALESCE(published_at, created_at) ASC
     LIMIT 1`
  )
    .bind(id, orderDate)
    .first();

  // Get next (older) biography
  const next = await c.env.DB.prepare(
    `SELECT id, slug, name, avatar_url FROM biographies
     WHERE ${publicOnlyClause} AND id != ?
     AND COALESCE(published_at, created_at) < ?
     ORDER BY COALESCE(published_at, created_at) DESC
     LIMIT 1`
  )
    .bind(id, orderDate)
    .first();

  return c.json({
    success: true,
    data: {
      previous,
      next,
    },
  });
});

// GET /biographies/:id/stats - Get biography statistics
biographiesRoutes.get('/:id/stats', optionalAuthMiddleware, async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');

  const visibilityClause = getVisibilityWhereClause(userId);
  const biography = await c.env.DB.prepare(
    `SELECT id, user_id, total_likes, total_views, follower_count
    FROM biographies WHERE id = ? AND ${visibilityClause}`
  )
    .bind(id)
    .first<{ id: string; user_id: string | null; total_likes: number; total_views: number; follower_count: number }>();

  if (!biography) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Biography not found',
      },
      404
    );
  }

  // Count bucket list items
  const bucketListStats = await c.env.DB.prepare(
    `SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
    FROM bucket_list_items WHERE biography_id = ? AND is_public = 1`
  )
    .bind(id)
    .first<{ total: number; active: number; completed: number }>();

  // Count following
  const followingCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM follows WHERE follower_id = ?'
  )
    .bind(biography.user_id)
    .first<{ count: number }>();

  // Count story completion from separate tables
  const coreStoriesCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM biography_core_stories WHERE biography_id = ?'
  )
    .bind(id)
    .first<{ count: number }>();
  const coreCompleted = coreStoriesCount?.count || 0;

  const advancedStoriesCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM biography_stories WHERE biography_id = ?'
  )
    .bind(id)
    .first<{ count: number }>();
  const advancedCompleted = advancedStoriesCount?.count || 0;

  // Count climbing locations from normalized table
  const locationsCountResult = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM climbing_locations WHERE biography_id = ? AND is_public = 1'
  )
    .bind(id)
    .first<{ count: number }>();
  const locationsCount = locationsCountResult?.count || 0;

  return c.json({
    success: true,
    data: {
      total_likes: biography.total_likes || 0,
      total_views: biography.total_views || 0,
      follower_count: biography.follower_count || 0,
      following_count: followingCount?.count || 0,
      bucket_list: {
        total: bucketListStats?.total || 0,
        active: bucketListStats?.active || 0,
        completed: bucketListStats?.completed || 0,
      },
      stories: {
        total: coreCompleted + advancedCompleted,
        core_completed: coreCompleted,
        advanced_completed: advancedCompleted,
      },
      locations_count: locationsCount,
    },
  });
});

// PUT /biographies/:id/view - Record a view
biographiesRoutes.put('/:id/view', optionalAuthMiddleware, async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId'); // May be undefined if not authenticated

  const visibilityClause = getVisibilityWhereClause(userId);
  const biography = await c.env.DB.prepare(
    `SELECT id FROM biographies WHERE id = ? AND ${visibilityClause}`
  )
    .bind(id)
    .first<{ id: string }>();

  if (!biography) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Biography not found',
      },
      404
    );
  }

  // Track unique view and increment count (deduplicate by IP, 24-hour window)
  await trackAndIncrementViewCount(c.env.DB, c.env.CACHE, c.req.raw, 'biography', id);

  // Track individual user view for explorer badge (atomic UPSERT to avoid race conditions)
  // This always runs for authenticated users to track their viewing history
  if (userId) {
    const viewId = generateId();
    await c.env.DB.prepare(
      `INSERT INTO biography_views (id, user_id, biography_id, view_count, first_viewed_at, last_viewed_at)
       VALUES (?, ?, ?, 1, datetime('now'), datetime('now'))
       ON CONFLICT(user_id, biography_id) DO UPDATE SET
         view_count = view_count + 1,
         last_viewed_at = datetime('now')`
    )
      .bind(viewId, userId, id)
      .run();
  }

  return c.json({
    success: true,
    message: 'View recorded',
  });
});

// ═══════════════════════════════════════════════════════════
// 追蹤系統
// ═══════════════════════════════════════════════════════════

// POST /biographies/:id/follow - Follow a biography
biographiesRoutes.post('/:id/follow', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  // Only allow following public or community biographies (not anonymous or private)
  const followableClause = "(visibility = 'public' OR visibility = 'community')";
  const biography = await c.env.DB.prepare(
    `SELECT id, user_id FROM biographies WHERE id = ? AND ${followableClause}`
  )
    .bind(id)
    .first<{ id: string; user_id: string }>();

  if (!biography) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Biography not found or not followable',
      },
      404
    );
  }

  // Cannot follow yourself
  if (biography.user_id === userId) {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'Cannot follow yourself',
      },
      400
    );
  }

  // Check if already following
  const existing = await c.env.DB.prepare(
    'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?'
  )
    .bind(userId, biography.user_id)
    .first<{ id: string }>();

  if (existing) {
    return c.json(
      {
        success: false,
        error: 'Conflict',
        message: 'Already following',
      },
      409
    );
  }

  const followId = generateId();

  await c.env.DB.prepare(
    'INSERT INTO follows (id, follower_id, following_id) VALUES (?, ?, ?)'
  )
    .bind(followId, userId, biography.user_id)
    .run();

  // Update follower count
  await c.env.DB.prepare(
    'UPDATE biographies SET follower_count = COALESCE(follower_count, 0) + 1 WHERE id = ?'
  )
    .bind(id)
    .run();

  // Create notification for the followed user
  const follower = await c.env.DB.prepare(
    'SELECT display_name, username FROM users WHERE id = ?'
  )
    .bind(userId)
    .first<{ display_name: string | null; username: string }>();

  const followerName = follower?.display_name || follower?.username || '有人';

  await createNotification(c.env.DB, {
    userId: biography.user_id,
    type: 'new_follower',
    actorId: userId,
    targetId: id,
    title: '有人追蹤了你',
    message: `${followerName} 開始追蹤你了`,
  });

  return c.json({
    success: true,
    message: 'Followed successfully',
  });
});

// GET /biographies/:id/follow - Check follow status
biographiesRoutes.get('/:id/follow', optionalAuthMiddleware, async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');

  // Get biography's user_id and follower_count with visibility check
  const visibilityClause = getVisibilityWhereClause(userId);
  const biography = await c.env.DB.prepare(
    `SELECT user_id, follower_count FROM biographies WHERE id = ? AND ${visibilityClause}`
  )
    .bind(id)
    .first<{ user_id: string; follower_count: number }>();

  if (!biography) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Biography not found',
      },
      404
    );
  }

  let following = false;
  if (userId) {
    const existing = await c.env.DB.prepare(
      'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?'
    )
      .bind(userId, biography.user_id)
      .first<{ id: string }>();

    following = !!existing;
  }

  return c.json({
    success: true,
    data: {
      following,
      followers: biography.follower_count || 0,
    },
  });
});

// DELETE /biographies/:id/follow - Unfollow a biography
biographiesRoutes.delete('/:id/follow', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  // Get biography's user_id with visibility check
  const visibilityClause = getVisibilityWhereClause(userId);
  const biography = await c.env.DB.prepare(
    `SELECT user_id FROM biographies WHERE id = ? AND ${visibilityClause}`
  )
    .bind(id)
    .first<{ user_id: string }>();

  if (!biography) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Biography not found',
      },
      404
    );
  }

  // Check if following exists
  const existing = await c.env.DB.prepare(
    'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?'
  )
    .bind(userId, biography.user_id)
    .first<{ id: string }>();

  if (!existing) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Not following',
      },
      404
    );
  }

  await c.env.DB.prepare(
    'DELETE FROM follows WHERE follower_id = ? AND following_id = ?'
  )
    .bind(userId, biography.user_id)
    .run();

  // Update follower count
  await c.env.DB.prepare(
    'UPDATE biographies SET follower_count = CASE WHEN follower_count > 0 THEN follower_count - 1 ELSE 0 END WHERE id = ?'
  )
    .bind(id)
    .run();

  return c.json({
    success: true,
    message: 'Unfollowed successfully',
  });
});

// GET /biographies/:id/followers - Get followers of a biography
biographiesRoutes.get('/:id/followers', optionalAuthMiddleware, async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');
  const limit = parseInt(c.req.query('limit') || '20', 10);
  const offset = parseInt(c.req.query('offset') || '0', 10);

  // Get biography's user_id with visibility check
  const visibilityClause = getVisibilityWhereClause(userId);
  const biography = await c.env.DB.prepare(
    `SELECT user_id FROM biographies WHERE id = ? AND ${visibilityClause}`
  )
    .bind(id)
    .first<{ user_id: string }>();

  if (!biography) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Biography not found',
      },
      404
    );
  }

  // For follower biographies, only show public ones in the list
  const publicOnlyClause = "b.visibility = 'public'";
  const followers = await c.env.DB.prepare(
    `SELECT f.id, f.created_at, u.id as user_id, u.username, u.display_name, u.avatar_url,
            b.id as biography_id, b.name as biography_name, b.slug as biography_slug
     FROM follows f
     JOIN users u ON f.follower_id = u.id
     LEFT JOIN biographies b ON b.user_id = u.id AND ${publicOnlyClause}
     WHERE f.following_id = ?
     ORDER BY f.created_at DESC
     LIMIT ? OFFSET ?`
  )
    .bind(biography.user_id, limit, offset)
    .all();

  const countResult = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM follows WHERE following_id = ?'
  )
    .bind(biography.user_id)
    .first<{ count: number }>();

  return c.json({
    success: true,
    data: followers.results,
    pagination: {
      total: countResult?.count || 0,
      limit,
      offset,
    },
  });
});

// GET /biographies/:id/following - Get who the biography owner is following
biographiesRoutes.get('/:id/following', optionalAuthMiddleware, async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');
  const limit = parseInt(c.req.query('limit') || '20', 10);
  const offset = parseInt(c.req.query('offset') || '0', 10);

  // Get biography's user_id with visibility check
  const visibilityClause = getVisibilityWhereClause(userId);
  const biography = await c.env.DB.prepare(
    `SELECT user_id FROM biographies WHERE id = ? AND ${visibilityClause}`
  )
    .bind(id)
    .first<{ user_id: string }>();

  if (!biography) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Biography not found',
      },
      404
    );
  }

  // For followed biographies, only show public ones in the list
  const publicOnlyClause = "b.visibility = 'public'";
  const following = await c.env.DB.prepare(
    `SELECT f.id, f.created_at, u.id as user_id, u.username, u.display_name, u.avatar_url,
            b.id as biography_id, b.name as biography_name, b.slug as biography_slug, b.avatar_url as biography_avatar
     FROM follows f
     JOIN users u ON f.following_id = u.id
     LEFT JOIN biographies b ON b.user_id = u.id AND ${publicOnlyClause}
     WHERE f.follower_id = ?
     ORDER BY f.created_at DESC
     LIMIT ? OFFSET ?`
  )
    .bind(biography.user_id, limit, offset)
    .all();

  const countResult = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM follows WHERE follower_id = ?'
  )
    .bind(biography.user_id)
    .first<{ count: number }>();

  return c.json({
    success: true,
    data: following.results,
    pagination: {
      total: countResult?.count || 0,
      limit,
      offset,
    },
  });
});

// ═══════════════════════════════════════════════════════════
// 攀岩足跡探索 API
// ═══════════════════════════════════════════════════════════

interface LocationStat {
  location: string;
  country: string;
  visitor_count: number;
  visitors: Array<{
    biography_id: string;
    name: string;
    avatar_url: string | null;
    visit_year: string | null;
  }>;
}

// GET /biographies/explore/locations - Get all climbing locations with visitor stats
biographiesRoutes.get('/explore/locations', async (c) => {
  const country = c.req.query('country');
  const limit = parseInt(c.req.query('limit') || '20', 10);
  const offset = parseInt(c.req.query('offset') || '0', 10);

  // Use normalized climbing_locations table with efficient SQL aggregation
  // Explore only shows truly public biographies
  const publicOnlyClause = "b.visibility = 'public'";
  const countryFilter = country ? 'AND cl.country = ?' : '';

  // Get total count first
  const countQuery = `
    SELECT COUNT(DISTINCT cl.location || '|' || cl.country) as total
    FROM climbing_locations cl
    JOIN biographies b ON b.id = cl.biography_id AND ${publicOnlyClause}
    WHERE cl.is_public = 1 ${countryFilter}
  `;

  const countStmt = c.env.DB.prepare(countQuery);
  const countResult = await (country ? countStmt.bind(country) : countStmt).first<{ total: number }>();
  const total = countResult?.total || 0;

  // Get paginated locations with visitor counts
  const locationsQuery = `
    SELECT
      cl.location,
      cl.country,
      COUNT(DISTINCT cl.biography_id) as visitor_count
    FROM climbing_locations cl
    JOIN biographies b ON b.id = cl.biography_id AND ${publicOnlyClause}
    WHERE cl.is_public = 1 ${countryFilter}
    GROUP BY cl.location, cl.country
    ORDER BY visitor_count DESC, cl.location ASC
    LIMIT ? OFFSET ?
  `;

  type LocationQueryResult = {
    location: string;
    country: string;
    visitor_count: number;
  };

  const locationsStmt = c.env.DB.prepare(locationsQuery);
  const boundLocationsStmt = country
    ? locationsStmt.bind(country, limit, offset)
    : locationsStmt.bind(limit, offset);
  const locationsResult = await boundLocationsStmt.all<LocationQueryResult>();

  const locations = locationsResult.results || [];
  let paginatedLocations: LocationStat[] = [];

  // Fetch all visitors in a single query to avoid N+1 problem
  if (locations.length > 0) {
    const locationConditions = locations.map(() => '(cl.location = ? AND cl.country = ?)').join(' OR ');
    const visitorParams = locations.flatMap((loc) => [loc.location, loc.country]);

    const visitorsResult = await c.env.DB.prepare(
      `SELECT
        cl.biography_id,
        b.name,
        b.avatar_url,
        cl.visit_year,
        cl.location,
        cl.country
      FROM climbing_locations cl
      JOIN biographies b ON b.id = cl.biography_id AND ${publicOnlyClause}
      WHERE cl.is_public = 1 AND (${locationConditions})
      ORDER BY cl.visit_year DESC NULLS LAST`
    )
      .bind(...visitorParams)
      .all<{
        biography_id: string;
        name: string;
        avatar_url: string | null;
        visit_year: string | null;
        location: string;
        country: string;
      }>();

    // Group visitors by location
    const visitorsByLocation = new Map<string, LocationStat['visitors']>();
    for (const visitor of visitorsResult.results || []) {
      const key = `${visitor.location}|${visitor.country}`;
      if (!visitorsByLocation.has(key)) {
        visitorsByLocation.set(key, []);
      }
      visitorsByLocation.get(key)!.push({
        biography_id: visitor.biography_id,
        name: visitor.name,
        avatar_url: visitor.avatar_url,
        visit_year: visitor.visit_year,
      });
    }

    paginatedLocations = locations.map((loc) => ({
      location: loc.location,
      country: loc.country,
      visitor_count: loc.visitor_count,
      visitors: visitorsByLocation.get(`${loc.location}|${loc.country}`) || [],
    }));
  }

  return c.json({
    success: true,
    data: paginatedLocations,
    pagination: {
      total,
      limit,
      offset,
    },
  });
});

// GET /biographies/explore/locations/:name - Get location details with all visitors
biographiesRoutes.get('/explore/locations/:name', async (c) => {
  const locationName = decodeURIComponent(c.req.param('name'));

  // Use normalized climbing_locations table with efficient SQL query
  // Explore only shows truly public biographies
  const publicOnlyClause = "b.visibility = 'public'";
  const visitorsResult = await c.env.DB.prepare(
    `SELECT
      cl.biography_id,
      b.name as biography_name,
      b.slug as biography_slug,
      b.avatar_url,
      cl.country,
      cl.visit_year,
      cl.notes
    FROM climbing_locations cl
    JOIN biographies b ON b.id = cl.biography_id AND ${publicOnlyClause}
    WHERE cl.location = ? AND cl.is_public = 1
    ORDER BY cl.visit_year DESC NULLS LAST`
  )
    .bind(locationName)
    .all<{
      biography_id: string;
      biography_name: string;
      biography_slug: string;
      avatar_url: string | null;
      country: string;
      visit_year: string | null;
      notes: string | null;
    }>();

  const visitors = visitorsResult.results || [];

  if (visitors.length === 0) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Location not found or no visitors',
      },
      404
    );
  }

  // Get country from first result
  const locationCountry = visitors[0].country;

  return c.json({
    success: true,
    data: {
      location: locationName,
      country: locationCountry,
      visitor_count: visitors.length,
      visitors: visitors.map((v) => ({
        biography_id: v.biography_id,
        biography_name: v.biography_name,
        biography_slug: v.biography_slug,
        avatar_url: v.avatar_url,
        visit_year: v.visit_year,
        notes: v.notes,
      })),
    },
  });
});

// GET /biographies/explore/countries - Get list of countries with location counts
biographiesRoutes.get('/explore/countries', async (c) => {
  // Use normalized climbing_locations table with efficient SQL aggregation
  // Explore only shows truly public biographies
  const publicOnlyClause = "b.visibility = 'public'";
  const countriesResult = await c.env.DB.prepare(
    `SELECT
      cl.country,
      COUNT(DISTINCT cl.location) as location_count,
      COUNT(*) as visitor_count
    FROM climbing_locations cl
    JOIN biographies b ON b.id = cl.biography_id AND ${publicOnlyClause}
    WHERE cl.is_public = 1
    GROUP BY cl.country
    ORDER BY visitor_count DESC, cl.country ASC`
  ).all<{
    country: string;
    location_count: number;
    visitor_count: number;
  }>();

  return c.json({
    success: true,
    data: countriesResult.results || [],
  });
});

// ═══════════════════════════════════════════════════════════
// 徽章系統
// ═══════════════════════════════════════════════════════════

// 徽章定義
const BADGE_DEFINITIONS = {
  // 故事分享
  story_beginner: { requirement: 'complete_first_story', threshold: 1 },
  story_writer: { requirement: 'complete_5_stories', threshold: 5 },
  inspirator: { requirement: 'story_encouraged_10_times', threshold: 10 },
  trending: { requirement: 'story_50_likes', threshold: 50 },
  // 目標追蹤
  goal_setter: { requirement: 'create_first_goal', threshold: 1 },
  achiever: { requirement: 'complete_first_goal', threshold: 1 },
  consistent: { requirement: 'complete_3_goals', threshold: 3 },
  // 社群互動
  supportive: { requirement: 'give_50_likes', threshold: 50 },
  conversationalist: { requirement: 'post_20_comments', threshold: 20 },
  explorer: { requirement: 'read_20_biographies', threshold: 20 },
  // 攀岩足跡
  traveler: { requirement: 'add_5_locations', threshold: 5 },
  international: { requirement: 'add_3_international_locations', threshold: 3 },
};

// GET /biographies/:id/badges - Get user's badges and progress
biographiesRoutes.get('/:id/badges', optionalAuthMiddleware, async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');

  const visibilityClause = getVisibilityWhereClause(userId);
  const biography = await c.env.DB.prepare(
    `SELECT id, user_id, total_likes
    FROM biographies WHERE id = ? AND ${visibilityClause}`
  )
    .bind(id)
    .first<{ id: string; user_id: string | null; total_likes: number }>();

  if (!biography) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Biography not found',
      },
      404
    );
  }

  // Calculate story count from separate tables
  const coreStoriesCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM biography_core_stories WHERE biography_id = ?'
  )
    .bind(id)
    .first<{ count: number }>();

  const advancedStoriesCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM biography_stories WHERE biography_id = ?'
  )
    .bind(id)
    .first<{ count: number }>();

  const storyCount = (coreStoriesCount?.count || 0) + (advancedStoriesCount?.count || 0);

  // Get bucket list stats
  const bucketListStats = await c.env.DB.prepare(
    `SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
    FROM bucket_list_items WHERE biography_id = ?`
  )
    .bind(id)
    .first<{ total: number; completed: number }>();

  // Get likes given count
  const likesGiven = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM bucket_list_likes WHERE user_id = ?'
  )
    .bind(biography.user_id)
    .first<{ count: number }>();

  // Get comments count
  const commentsCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM bucket_list_comments WHERE user_id = ?'
  )
    .bind(biography.user_id)
    .first<{ count: number }>();

  // Count climbing locations from normalized table
  const locationsStats = await c.env.DB.prepare(
    `SELECT
      COUNT(*) as total,
      SUM(CASE WHEN LOWER(country) NOT IN ('台灣', '臺灣', 'taiwan', 'tw') THEN 1 ELSE 0 END) as international
    FROM climbing_locations WHERE biography_id = ?`
  )
    .bind(id)
    .first<{ total: number; international: number }>();
  const locationsCount = locationsStats?.total || 0;
  const internationalCount = locationsStats?.international || 0;

  // Get biographies viewed count (for explorer badge)
  const viewedCount = await c.env.DB.prepare(
    'SELECT COUNT(DISTINCT biography_id) as count FROM biography_views WHERE user_id = ?'
  )
    .bind(biography.user_id)
    .first<{ count: number }>();

  // Get unlocked badges from database
  const unlockedBadges = await c.env.DB.prepare(
    'SELECT * FROM user_badges WHERE user_id = ?'
  )
    .bind(biography.user_id)
    .all();

  const unlockedBadgeIds = new Set(
    (unlockedBadges.results || []).map((b: { badge_id?: string }) => b.badge_id)
  );

  // Create a Map for O(1) lookup of unlocked_at dates
  const unlockedBadgesMap = new Map(
    (unlockedBadges.results || []).map((b: { badge_id?: string; unlocked_at?: string }) => [b.badge_id, b.unlocked_at])
  );

  // Calculate progress for each badge
  const badgeProgress = Object.entries(BADGE_DEFINITIONS).map(([badgeId, def]) => {
    let currentValue = 0;

    switch (def.requirement) {
      case 'complete_first_story':
      case 'complete_5_stories':
        currentValue = storyCount;
        break;
      case 'story_encouraged_10_times':
      case 'story_50_likes':
        currentValue = biography.total_likes || 0;
        break;
      case 'create_first_goal':
        currentValue = bucketListStats?.total || 0;
        break;
      case 'complete_first_goal':
      case 'complete_3_goals':
        currentValue = bucketListStats?.completed || 0;
        break;
      case 'give_50_likes':
        currentValue = likesGiven?.count || 0;
        break;
      case 'post_20_comments':
        currentValue = commentsCount?.count || 0;
        break;
      case 'read_20_biographies':
        currentValue = viewedCount?.count || 0;
        break;
      case 'add_5_locations':
        currentValue = locationsCount;
        break;
      case 'add_3_international_locations':
        currentValue = internationalCount;
        break;
    }

    const progress = Math.min(100, Math.round((currentValue / def.threshold) * 100));
    const unlocked = unlockedBadgeIds.has(badgeId) || currentValue >= def.threshold;

    return {
      badge_id: badgeId,
      current_value: currentValue,
      target_value: def.threshold,
      progress,
      unlocked,
      unlocked_at: unlocked ? (unlockedBadgesMap.get(badgeId) || null) : null,
    };
  });

  return c.json({
    success: true,
    data: {
      unlocked: (unlockedBadges.results || []) as Array<{ id: string; user_id: string; badge_id: string; unlocked_at: string }>,
      progress: badgeProgress,
    },
  });
});

// ═══════════════════════════════════════════════════════════
// 社群統計
// ═══════════════════════════════════════════════════════════

// GET /biographies/community/stats - Get community statistics
biographiesRoutes.get('/community/stats', async (c) => {
  // Check cache first
  const cacheKey = 'community:stats';
  try {
    const cached = await c.env.CACHE.get(cacheKey);
    if (cached) {
      return c.json({
        success: true,
        data: JSON.parse(cached),
      });
    }
  } catch (e) {
    // Cache miss or error, continue to fetch from DB
    console.error(`Cache read error for ${cacheKey}:`, e);
  }

  // Community stats only count truly public biographies
  const publicOnlyClause = "visibility = 'public'";

  // Total biographies
  const totalBiographies = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM biographies WHERE ${publicOnlyClause}`
  ).first<{ count: number }>();

  // Total goals and completed goals
  const goalStats = await c.env.DB.prepare(
    `SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
    FROM bucket_list_items WHERE is_public = 1`
  ).first<{ total: number; completed: number }>();

  // Total stories (count from separate story tables)
  const coreStoriesCount = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM biography_core_stories bcs
     JOIN biographies b ON b.id = bcs.biography_id
     WHERE ${publicOnlyClause}`
  ).first<{ count: number }>();

  const advancedStoriesCount = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM biography_stories bs
     JOIN biographies b ON b.id = bs.biography_id
     WHERE ${publicOnlyClause}`
  ).first<{ count: number }>();

  const totalStoriesCount = (coreStoriesCount?.count || 0) + (advancedStoriesCount?.count || 0);

  // Active users this week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const activeUsers = await c.env.DB.prepare(
    'SELECT COUNT(DISTINCT user_id) as count FROM biographies WHERE updated_at > ?'
  )
    .bind(oneWeekAgo.toISOString())
    .first<{ count: number }>();

  // Trending categories (bucket list categories)
  const trendingCategories = await c.env.DB.prepare(
    `SELECT category, COUNT(*) as count
     FROM bucket_list_items
     WHERE is_public = 1 AND category IS NOT NULL
     GROUP BY category
     ORDER BY count DESC
     LIMIT 5`
  ).all();

  const statsData = {
    total_biographies: totalBiographies?.count || 0,
    total_goals: goalStats?.total || 0,
    completed_goals: goalStats?.completed || 0,
    total_stories: totalStoriesCount,
    active_users_this_week: activeUsers?.count || 0,
    trending_categories: (trendingCategories.results || []).map((cat: { category?: string; count?: number }) => ({
      category: cat.category,
      count: cat.count,
    })),
  };

  // Cache the result for 5 minutes
  try {
    await c.env.CACHE.put(cacheKey, JSON.stringify(statsData), { expirationTtl: 300 });
  } catch (e) {
    // Cache write failure is non-critical
    console.error(`Cache write error for ${cacheKey}:`, e);
  }

  return c.json({
    success: true,
    data: statsData,
  });
});

// GET /biographies/leaderboard/:type - Get leaderboard
biographiesRoutes.get('/leaderboard/:type', async (c) => {
  const type = c.req.param('type');
  const limit = parseInt(c.req.query('limit') || '10', 10);

  // Check cache first
  const cacheKey = `leaderboard:${type}:${limit}`;
  try {
    const cached = await c.env.CACHE.get(cacheKey);
    if (cached) {
      return c.json({
        success: true,
        data: JSON.parse(cached),
      });
    }
  } catch (e) {
    // Cache miss or error, continue to fetch from DB
    console.error(`Cache read error for ${cacheKey}:`, e);
  }

  // Leaderboard only shows truly public biographies
  const publicOnlyClause = "visibility = 'public'";

  let query = '';

  switch (type) {
    case 'goals_completed':
      query = `
        SELECT b.id as biography_id, b.name, b.avatar_url, COUNT(bl.id) as value
        FROM biographies b
        LEFT JOIN bucket_list_items bl ON bl.biography_id = b.id AND bl.status = 'completed'
        WHERE b.visibility = 'public'
        GROUP BY b.id
        ORDER BY value DESC
        LIMIT ?
      `;
      break;
    case 'followers':
      query = `
        SELECT id as biography_id, name, avatar_url, follower_count as value
        FROM biographies
        WHERE ${publicOnlyClause}
        ORDER BY follower_count DESC
        LIMIT ?
      `;
      break;
    case 'likes_received':
      query = `
        SELECT id as biography_id, name, avatar_url, total_likes as value
        FROM biographies
        WHERE ${publicOnlyClause}
        ORDER BY total_likes DESC
        LIMIT ?
      `;
      break;
    default:
      return c.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'Invalid leaderboard type',
        },
        400
      );
  }

  const results = await c.env.DB.prepare(query).bind(limit).all();

  const leaderboard = (results.results || []).map((item: {
    biography_id?: string;
    name?: string;
    avatar_url?: string | null;
    value?: number;
  }, index: number) => ({
    rank: index + 1,
    biography_id: item.biography_id,
    name: item.name,
    avatar_url: item.avatar_url,
    value: item.value || 0,
  }));

  // Cache the result for 5 minutes
  try {
    await c.env.CACHE.put(cacheKey, JSON.stringify(leaderboard), { expirationTtl: 300 });
  } catch (e) {
    // Cache write failure is non-critical
    console.error(`Cache write error for ${cacheKey}:`, e);
  }

  return c.json({
    success: true,
    data: leaderboard,
  });
});

// ═══════════════════════════════════════════════════════════
// 按讚功能 (Like/Unlike)
// ═══════════════════════════════════════════════════════════

// POST /biographies/:id/like - Toggle like for a biography
biographiesRoutes.post('/:id/like', authMiddleware, async (c) => {
  const biographyId = c.req.param('id');
  const userId = c.get('userId');

  // Check if biography exists and is visible to user
  const visibilityClause = getVisibilityWhereClause(userId);
  const biography = await c.env.DB.prepare(
    `SELECT id, user_id FROM biographies WHERE id = ? AND ${visibilityClause}`
  )
    .bind(biographyId)
    .first<{ id: string; user_id: string }>();

  if (!biography) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Biography not found',
      },
      404
    );
  }

  // Check if already liked
  const existingLike = await c.env.DB.prepare(
    'SELECT id FROM biography_likes WHERE user_id = ? AND biography_id = ?'
  )
    .bind(userId, biographyId)
    .first();

  let liked: boolean;

  if (existingLike) {
    // Unlike - remove the like
    await c.env.DB.prepare(
      'DELETE FROM biography_likes WHERE user_id = ? AND biography_id = ?'
    )
      .bind(userId, biographyId)
      .run();
    liked = false;
  } else {
    // Like - add a new like
    const id = generateId();
    await c.env.DB.prepare(
      'INSERT INTO biography_likes (id, user_id, biography_id) VALUES (?, ?, ?)'
    )
      .bind(id, userId, biographyId)
      .run();
    liked = true;

    // Send notification to biography owner (if not liking own biography)
    if (biography.user_id && biography.user_id !== userId) {
      try {
        await createNotification(c.env.DB, {
          userId: biography.user_id,
          type: 'goal_liked',
          actorId: userId,
          targetId: biographyId,
          title: '有人喜歡你的人物誌',
          message: '有人對你的人物誌按讚了！',
        });
      } catch (err) {
        console.error('Failed to create notification:', err);
      }
    }
  }

  // Get total like count
  const likeCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM biography_likes WHERE biography_id = ?'
  )
    .bind(biographyId)
    .first<{ count: number }>();

  // Update total_likes on biography
  await c.env.DB.prepare(
    'UPDATE biographies SET total_likes = ? WHERE id = ?'
  )
    .bind(likeCount?.count || 0, biographyId)
    .run();

  return c.json({
    success: true,
    data: {
      liked,
      likes: likeCount?.count || 0,
    },
  });
});

// GET /biographies/:id/like - Check if user has liked a biography
biographiesRoutes.get('/:id/like', optionalAuthMiddleware, async (c) => {
  const biographyId = c.req.param('id');
  const userId = c.get('userId');

  // Get total like count
  const likeCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM biography_likes WHERE biography_id = ?'
  )
    .bind(biographyId)
    .first<{ count: number }>();

  let liked = false;

  if (userId) {
    // Check if user has liked
    const existingLike = await c.env.DB.prepare(
      'SELECT id FROM biography_likes WHERE user_id = ? AND biography_id = ?'
    )
      .bind(userId, biographyId)
      .first();
    liked = !!existingLike;
  }

  return c.json({
    success: true,
    data: {
      liked,
      likes: likeCount?.count || 0,
    },
  });
});

// ═══════════════════════════════════════════════════════════
// Comments
// ═══════════════════════════════════════════════════════════

// GET /biographies/:id/comments - Get biography comments
biographiesRoutes.get('/:id/comments', optionalAuthMiddleware, async (c) => {
  const biographyId = c.req.param('id');
  const userId = c.get('userId');

  // First check if biography is visible
  const visibilityClause = getVisibilityWhereClause(userId);
  const biography = await c.env.DB.prepare(
    `SELECT id FROM biographies WHERE id = ? AND ${visibilityClause}`
  )
    .bind(biographyId)
    .first();

  if (!biography) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Biography not found',
      },
      404
    );
  }

  const comments = await c.env.DB.prepare(
    `SELECT
      c.id,
      c.entity_id as biography_id,
      c.user_id,
      u.username,
      u.display_name,
      u.avatar_url,
      c.content,
      c.created_at
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.entity_type = 'biography' AND c.entity_id = ?
    ORDER BY c.created_at DESC`
  )
    .bind(biographyId)
    .all();

  return c.json({
    success: true,
    data: comments.results || [],
  });
});

// POST /biographies/:id/comments - Add a comment to biography
biographiesRoutes.post('/:id/comments', authMiddleware, async (c) => {
  const biographyId = c.req.param('id');
  const userId = c.get('userId');
  const { content } = await c.req.json<{ content: string }>();

  if (!content || !content.trim()) {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'Comment content is required',
      },
      400
    );
  }

  // Check if biography exists and is visible to user
  const visibilityClause = getVisibilityWhereClause(userId);
  const biography = await c.env.DB.prepare(
    `SELECT id, user_id FROM biographies WHERE id = ? AND ${visibilityClause}`
  )
    .bind(biographyId)
    .first<{ id: string; user_id: string }>();

  if (!biography) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Biography not found',
      },
      404
    );
  }

  const commentId = generateId();
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    `INSERT INTO comments (id, user_id, entity_type, entity_id, content, created_at, updated_at)
     VALUES (?, ?, 'biography', ?, ?, ?, ?)`
  )
    .bind(commentId, userId, biographyId, content.trim(), now, now)
    .run();

  // Get user info for response
  const user = await c.env.DB.prepare(
    'SELECT username, display_name, avatar_url FROM users WHERE id = ?'
  )
    .bind(userId)
    .first<{ username: string; display_name: string | null; avatar_url: string | null }>();

  // Create notification for biography owner (if not commenting on own biography)
  if (biography.user_id && biography.user_id !== userId) {
    await createNotification(c.env.DB, {
      userId: biography.user_id,
      type: 'biography_commented',
      actorId: userId,
      targetId: biographyId,
      title: '新留言',
      message: `${user?.display_name || user?.username || '某位用戶'} 在你的人物誌留言了`,
    });
  }

  return c.json({
    success: true,
    data: {
      id: commentId,
      biography_id: biographyId,
      user_id: userId,
      username: user?.username || '',
      display_name: user?.display_name,
      avatar_url: user?.avatar_url,
      content: content.trim(),
      created_at: now,
    },
  });
});

// DELETE /biographies/comments/:id - Delete a comment
biographiesRoutes.delete('/comments/:id', authMiddleware, async (c) => {
  const commentId = c.req.param('id');
  const userId = c.get('userId');

  const comment = await c.env.DB.prepare(
    'SELECT id, user_id FROM comments WHERE id = ? AND entity_type = ?'
  )
    .bind(commentId, 'biography')
    .first<{ id: string; user_id: string }>();

  if (!comment) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Comment not found',
      },
      404
    );
  }

  if (comment.user_id !== userId) {
    return c.json(
      {
        success: false,
        error: 'Forbidden',
        message: 'You can only delete your own comments',
      },
      403
    );
  }

  await c.env.DB.prepare('DELETE FROM comments WHERE id = ?')
    .bind(commentId)
    .run();

  return c.json({
    success: true,
    data: {
      message: 'Comment deleted successfully',
    },
  });
});
