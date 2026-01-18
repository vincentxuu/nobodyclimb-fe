import { Hono } from 'hono';
import { Env, Biography } from '../types';
import { parsePagination, generateId, generateSlug } from '../utils/id';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { createNotification } from './notifications';
import { deleteR2Images } from '../utils/storage';
import { trackAndIncrementViewCount } from '../utils/viewTracker';

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
  'one_liners_data',
  'stories_data',
  'basic_info_data',
  'autosave_at',
] as const;

/** Visibility 等級 */
type VisibilityLevel = 'private' | 'anonymous' | 'community' | 'public';

/** 台灣地區名稱（用於判斷是否為國際地點） */
const LOCAL_COUNTRY_NAMES = ['台灣', '臺灣', 'taiwan'];

/** 判斷是否為國際地點 */
function isInternationalLocation(country: string | undefined): boolean {
  if (!country) return false;
  return !LOCAL_COUNTRY_NAMES.includes(country.trim().toLowerCase());
}

export const biographiesRoutes = new Hono<{ Bindings: Env }>();

// GET /biographies - List all public biographies
biographiesRoutes.get('/', async (c) => {
  const { page, limit, offset } = parsePagination(
    c.req.query('page'),
    c.req.query('limit')
  );
  const featured = c.req.query('featured');
  const search = c.req.query('search');

  // Support both old is_public and new visibility system
  let whereClause = "(is_public = 1 OR visibility = 'public')";
  const params: (string | number)[] = [];

  if (featured === 'true') {
    whereClause += ' AND is_featured = 1';
  }

  if (search) {
    const searchFields = [
      'name', 'frequent_locations', 'favorite_route_type',
      'climbing_origin', 'climbing_meaning', 'advice_to_self',
      'memorable_moment', 'biggest_challenge', 'breakthrough_story',
      'dream_climb', 'climbing_goal',
    ];
    const searchConditions = searchFields.map((field) => `${field} LIKE ?`).join(' OR ');
    whereClause += ` AND (${searchConditions})`;
    const searchPattern = `%${search}%`;
    searchFields.forEach(() => params.push(searchPattern));
  }

  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM biographies WHERE ${whereClause}`
  )
    .bind(...params)
    .first<{ count: number }>();
  const total = countResult?.count || 0;

  const biographies = await c.env.DB.prepare(
    `SELECT b.*, COALESCE(b.avatar_url, u.avatar_url) as avatar_url
     FROM biographies b
     LEFT JOIN users u ON b.user_id = u.id
     WHERE ${whereClause}
     ORDER BY CASE WHEN b.user_id IS NOT NULL THEN 0 ELSE 1 END, b.is_featured DESC, b.published_at DESC, b.created_at DESC
     LIMIT ? OFFSET ?`
  )
    .bind(...params, limit, offset)
    .all();

  return c.json({
    success: true,
    data: biographies.results,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  });
});

// GET /biographies/featured - Get featured biographies
biographiesRoutes.get('/featured', async (c) => {
  const limit = parseInt(c.req.query('limit') || '3', 10);

  const biographies = await c.env.DB.prepare(
    `SELECT b.*, COALESCE(b.avatar_url, u.avatar_url) as avatar_url
     FROM biographies b
     LEFT JOIN users u ON b.user_id = u.id
     WHERE b.is_public = 1 AND b.is_featured = 1
     ORDER BY CASE WHEN b.user_id IS NOT NULL THEN 0 ELSE 1 END, b.published_at DESC, b.created_at DESC
     LIMIT ?`
  )
    .bind(limit)
    .all();

  return c.json({
    success: true,
    data: biographies.results,
  });
});

// GET /biographies/me - Get current user's biography
biographiesRoutes.get('/me', authMiddleware, async (c) => {
  const userId = c.get('userId');

  const biography = await c.env.DB.prepare(
    'SELECT * FROM biographies WHERE user_id = ?'
  )
    .bind(userId)
    .first();

  if (!biography) {
    return c.json({
      success: true,
      data: null,
    });
  }

  return c.json({
    success: true,
    data: biography,
  });
});

// GET /biographies/:id - Get biography by ID
biographiesRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');

  const biography = await c.env.DB.prepare(
    'SELECT * FROM biographies WHERE id = ? AND is_public = 1'
  )
    .bind(id)
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

  return c.json({
    success: true,
    data: biography,
  });
});

// GET /biographies/slug/:slug - Get biography by slug
biographiesRoutes.get('/slug/:slug', async (c) => {
  const slug = c.req.param('slug');

  const biography = await c.env.DB.prepare(
    'SELECT * FROM biographies WHERE slug = ? AND is_public = 1'
  )
    .bind(slug)
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

  return c.json({
    success: true,
    data: biography,
  });
});

// POST /biographies - Create new biography (or update if exists)
biographiesRoutes.post('/', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<Partial<Biography>>();

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

  // Check if user already has a biography
  const existing = await c.env.DB.prepare(
    'SELECT id FROM biographies WHERE user_id = ?'
  )
    .bind(userId)
    .first<{ id: string }>();

  if (existing) {
    // Update existing biography
    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    // All biography fields including new advanced story fields and V2 fields
    const fields = [
      // Basic info
      'name', 'title', 'bio', 'avatar_url', 'cover_image',
      // Level 1: Basic climbing info
      'climbing_start_year', 'frequent_locations', 'favorite_route_type',
      // Level 2: Core stories
      'climbing_origin', 'climbing_meaning', 'advice_to_self',
      // Level 3A: Growth & Breakthrough
      'memorable_moment', 'biggest_challenge', 'breakthrough_story',
      'first_outdoor', 'first_grade', 'frustrating_climb',
      // Level 3B: Psychology & Philosophy
      'fear_management', 'climbing_lesson', 'failure_perspective',
      'flow_moment', 'life_balance', 'unexpected_gain',
      // Level 3C: Community & Connection
      'climbing_mentor', 'climbing_partner', 'funny_moment',
      'favorite_spot', 'advice_to_group', 'climbing_space',
      // Level 3D: Practical Sharing
      'injury_recovery', 'memorable_route', 'training_method',
      'effective_practice', 'technique_tip', 'gear_choice',
      // Level 3E: Dreams & Exploration
      'dream_climb', 'climbing_trip', 'bucket_list_story',
      'climbing_goal', 'climbing_style', 'climbing_inspiration',
      // Level 3F: Life Integration
      'life_outside_climbing',
      // Media & Social
      'gallery_images', 'social_links', 'youtube_channel_id', 'featured_video_id',
      // Status
      'achievements', 'is_featured', 'is_public',
      // V2 Fields
      ...V2_FIELDS.filter(f => f !== 'autosave_at'),
    ];

    for (const field of fields) {
      if (body[field as keyof Biography] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(body[field as keyof Biography] as string | number | null);
      }
    }

    // Update slug if name changed
    if (body.name) {
      const newSlug = generateSlug(body.name) + '-' + existing.id.substring(0, 8);
      updates.push('slug = ?');
      values.push(newSlug);
    }

    // Set published_at when going public for first time
    if (body.is_public === 1) {
      const currentBio = await c.env.DB.prepare(
        'SELECT published_at, is_public FROM biographies WHERE id = ?'
      )
        .bind(existing.id)
        .first<{ published_at: string | null; is_public: number }>();

      if (currentBio && !currentBio.published_at && Number(currentBio.is_public) !== 1) {
        updates.push('published_at = ?');
        values.push(new Date().toISOString());
      }
    }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      values.push(existing.id);

      await c.env.DB.prepare(
        `UPDATE biographies SET ${updates.join(', ')} WHERE id = ?`
      )
        .bind(...values)
        .run();
    }

    const biography = await c.env.DB.prepare(
      'SELECT * FROM biographies WHERE id = ?'
    )
      .bind(existing.id)
      .first();

    return c.json({
      success: true,
      data: biography,
    });
  }

  // Create new biography
  const id = generateId();
  const slug = generateSlug(body.name) + '-' + id.substring(0, 8);

  await c.env.DB.prepare(
    `INSERT INTO biographies (
      id, user_id, name, slug, title, bio, avatar_url, cover_image,
      climbing_start_year, frequent_locations, favorite_route_type,
      climbing_origin, climbing_meaning, advice_to_self,
      achievements, social_links, is_featured, is_public, published_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      userId,
      body.name,
      slug,
      body.title || null,
      body.bio || null,
      body.avatar_url || null,
      body.cover_image || null,
      body.climbing_start_year || null,
      body.frequent_locations || null,
      body.favorite_route_type || null,
      body.climbing_origin || null,
      body.climbing_meaning || null,
      body.advice_to_self || null,
      body.achievements || null,
      body.social_links || null,
      body.is_featured || 0,
      body.is_public || 0,
      body.is_public ? new Date().toISOString() : null
    )
    .run();

  const biography = await c.env.DB.prepare(
    'SELECT * FROM biographies WHERE id = ?'
  )
    .bind(id)
    .first();

  return c.json(
    {
      success: true,
      data: biography,
    },
    201
  );
});

// PUT /biographies/me - Update current user's biography
biographiesRoutes.put('/me', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<Partial<Biography>>();

  const existing = await c.env.DB.prepare(
    'SELECT id, published_at, is_public FROM biographies WHERE user_id = ?'
  )
    .bind(userId)
    .first<{ id: string; published_at: string | null; is_public: number }>();

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

  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  // All biography fields including new advanced story fields and V2 fields
  const fields = [
    // Basic info
    'name', 'title', 'bio', 'avatar_url', 'cover_image',
    // Level 1: Basic climbing info
    'climbing_start_year', 'frequent_locations', 'favorite_route_type',
    // Level 2: Core stories
    'climbing_origin', 'climbing_meaning', 'advice_to_self',
    // Level 3A: Growth & Breakthrough
    'memorable_moment', 'biggest_challenge', 'breakthrough_story',
    'first_outdoor', 'first_grade', 'frustrating_climb',
    // Level 3B: Psychology & Philosophy
    'fear_management', 'climbing_lesson', 'failure_perspective',
    'flow_moment', 'life_balance', 'unexpected_gain',
    // Level 3C: Community & Connection
    'climbing_mentor', 'climbing_partner', 'funny_moment',
    'favorite_spot', 'advice_to_group', 'climbing_space',
    // Level 3D: Practical Sharing
    'injury_recovery', 'memorable_route', 'training_method',
    'effective_practice', 'technique_tip', 'gear_choice',
    // Level 3E: Dreams & Exploration
    'dream_climb', 'climbing_trip', 'bucket_list_story',
    'climbing_goal', 'climbing_style', 'climbing_inspiration',
    // Level 3F: Life Integration
    'life_outside_climbing',
    // Media & Social
    'gallery_images', 'social_links', 'youtube_channel_id', 'featured_video_id',
    // Status
    'achievements', 'is_public',
    // V2 Fields
    'visibility', 'tags_data', 'one_liners_data', 'stories_data', 'basic_info_data',
  ];

  for (const field of fields) {
    if (body[field as keyof Biography] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(body[field as keyof Biography] as string | number | null);
    }
  }

  // Update slug if name changed
  if (body.name) {
    const newSlug = generateSlug(body.name) + '-' + existing.id.substring(0, 8);
    updates.push('slug = ?');
    values.push(newSlug);
  }

  // Handle visibility change - sync with is_public
  if (body.visibility) {
    const visibilityPublic = body.visibility === 'public' ? 1 : 0;
    if (body.is_public === undefined) {
      updates.push('is_public = ?');
      values.push(visibilityPublic);
    }
  }

  // Set published_at when going public for first time
  const goingPublic = body.is_public === 1 || body.visibility === 'public';
  if (goingPublic && !existing.published_at && Number(existing.is_public) !== 1) {
    updates.push('published_at = ?');
    values.push(new Date().toISOString());
  }

  if (updates.length > 0) {
    updates.push("updated_at = datetime('now')");
    values.push(existing.id);

    await c.env.DB.prepare(
      `UPDATE biographies SET ${updates.join(', ')} WHERE id = ?`
    )
      .bind(...values)
      .run();
  }

  const biography = await c.env.DB.prepare(
    'SELECT * FROM biographies WHERE id = ?'
  )
    .bind(existing.id)
    .first();

  return c.json({
    success: true,
    data: biography,
  });
});

// PUT /biographies/me/autosave - Autosave current user's biography
// Rate limited: minimum 2 seconds between saves
biographiesRoutes.put('/me/autosave', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<Partial<Biography>>();

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
    'one_liners_data',
    'stories_data',
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
    'SELECT id, profile_image, cover_image FROM biographies WHERE user_id = ?'
  )
    .bind(userId)
    .first<{ id: string; profile_image: string | null; cover_image: string | null }>();

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

  return c.json({
    success: true,
    message: 'Biography deleted successfully',
  });
});

// GET /biographies/:id/adjacent - Get previous and next biographies
biographiesRoutes.get('/:id/adjacent', async (c) => {
  const id = c.req.param('id');

  const current = await c.env.DB.prepare(
    'SELECT published_at, created_at FROM biographies WHERE id = ? AND is_public = 1'
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

  // Get previous (newer) biography
  const previous = await c.env.DB.prepare(
    `SELECT id, name, avatar_url FROM biographies
     WHERE is_public = 1 AND id != ?
     AND COALESCE(published_at, created_at) > ?
     ORDER BY COALESCE(published_at, created_at) ASC
     LIMIT 1`
  )
    .bind(id, orderDate)
    .first();

  // Get next (older) biography
  const next = await c.env.DB.prepare(
    `SELECT id, name, avatar_url FROM biographies
     WHERE is_public = 1 AND id != ?
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
biographiesRoutes.get('/:id/stats', async (c) => {
  const id = c.req.param('id');

  const biography = await c.env.DB.prepare(
    `SELECT id, user_id, total_likes, total_views, follower_count,
      climbing_origin, climbing_meaning, advice_to_self,
      memorable_moment, biggest_challenge, breakthrough_story, first_outdoor, first_grade, frustrating_climb,
      fear_management, climbing_lesson, failure_perspective, flow_moment, life_balance, unexpected_gain,
      climbing_mentor, climbing_partner, funny_moment, favorite_spot, advice_to_group, climbing_space,
      injury_recovery, memorable_route, training_method, effective_practice, technique_tip, gear_choice,
      dream_climb, climbing_trip, bucket_list_story, climbing_goal, climbing_style, climbing_inspiration,
      life_outside_climbing
    FROM biographies WHERE id = ? AND is_public = 1`
  )
    .bind(id)
    .first<Biography>();

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

  // Calculate story completion using shared constants
  const coreCompleted = CORE_STORY_FIELDS.filter(
    (field) => biography[field as keyof Biography] && String(biography[field as keyof Biography]).trim() !== ''
  ).length;
  const advancedCompleted = ADVANCED_STORY_FIELDS.filter(
    (field) => biography[field as keyof Biography] && String(biography[field as keyof Biography]).trim() !== ''
  ).length;

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

  const biography = await c.env.DB.prepare(
    'SELECT id FROM biographies WHERE id = ? AND is_public = 1'
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

  // Check if biography exists and is public
  const biography = await c.env.DB.prepare(
    'SELECT id, user_id FROM biographies WHERE id = ? AND is_public = 1'
  )
    .bind(id)
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

  // Get biography's user_id and follower_count
  const biography = await c.env.DB.prepare(
    'SELECT user_id, follower_count FROM biographies WHERE id = ?'
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

  // Get biography's user_id
  const biography = await c.env.DB.prepare(
    'SELECT user_id FROM biographies WHERE id = ?'
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
biographiesRoutes.get('/:id/followers', async (c) => {
  const id = c.req.param('id');
  const limit = parseInt(c.req.query('limit') || '20', 10);
  const offset = parseInt(c.req.query('offset') || '0', 10);

  // Get biography's user_id
  const biography = await c.env.DB.prepare(
    'SELECT user_id FROM biographies WHERE id = ? AND is_public = 1'
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

  const followers = await c.env.DB.prepare(
    `SELECT f.id, f.created_at, u.id as user_id, u.username, u.display_name, u.avatar_url,
            b.id as biography_id, b.name as biography_name, b.slug as biography_slug
     FROM follows f
     JOIN users u ON f.follower_id = u.id
     LEFT JOIN biographies b ON b.user_id = u.id AND b.is_public = 1
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
biographiesRoutes.get('/:id/following', async (c) => {
  const id = c.req.param('id');
  const limit = parseInt(c.req.query('limit') || '20', 10);
  const offset = parseInt(c.req.query('offset') || '0', 10);

  // Get biography's user_id
  const biography = await c.env.DB.prepare(
    'SELECT user_id FROM biographies WHERE id = ? AND is_public = 1'
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

  const following = await c.env.DB.prepare(
    `SELECT f.id, f.created_at, u.id as user_id, u.username, u.display_name, u.avatar_url,
            b.id as biography_id, b.name as biography_name, b.slug as biography_slug, b.avatar_url as biography_avatar
     FROM follows f
     JOIN users u ON f.following_id = u.id
     LEFT JOIN biographies b ON b.user_id = u.id AND b.is_public = 1
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
  const countryFilter = country ? 'AND cl.country = ?' : '';

  // Get total count first
  const countQuery = `
    SELECT COUNT(DISTINCT cl.location || '|' || cl.country) as total
    FROM climbing_locations cl
    JOIN biographies b ON b.id = cl.biography_id AND b.is_public = 1
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
    JOIN biographies b ON b.id = cl.biography_id AND b.is_public = 1
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
      JOIN biographies b ON b.id = cl.biography_id AND b.is_public = 1
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
    JOIN biographies b ON b.id = cl.biography_id AND b.is_public = 1
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
  const countriesResult = await c.env.DB.prepare(
    `SELECT
      cl.country,
      COUNT(DISTINCT cl.location) as location_count,
      COUNT(*) as visitor_count
    FROM climbing_locations cl
    JOIN biographies b ON b.id = cl.biography_id AND b.is_public = 1
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
biographiesRoutes.get('/:id/badges', async (c) => {
  const id = c.req.param('id');

  const biography = await c.env.DB.prepare(
    `SELECT id, user_id, total_likes,
      climbing_origin, climbing_meaning, advice_to_self,
      memorable_moment, biggest_challenge, breakthrough_story, first_outdoor, first_grade, frustrating_climb,
      fear_management, climbing_lesson, failure_perspective, flow_moment, life_balance, unexpected_gain,
      climbing_mentor, climbing_partner, funny_moment, favorite_spot, advice_to_group, climbing_space,
      injury_recovery, memorable_route, training_method, effective_practice, technique_tip, gear_choice,
      dream_climb, climbing_trip, bucket_list_story, climbing_goal, climbing_style, climbing_inspiration,
      life_outside_climbing
    FROM biographies WHERE id = ? AND is_public = 1`
  )
    .bind(id)
    .first<Biography>();

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

  // Calculate story count using shared constants
  const storyCount = ALL_STORY_FIELDS.filter(
    (field) => biography[field as keyof Biography] && String(biography[field as keyof Biography]).trim() !== ''
  ).length;

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

  // Total biographies
  const totalBiographies = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM biographies WHERE is_public = 1'
  ).first<{ count: number }>();

  // Total goals and completed goals
  const goalStats = await c.env.DB.prepare(
    `SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
    FROM bucket_list_items WHERE is_public = 1`
  ).first<{ total: number; completed: number }>();

  // Total stories (count biographies with at least one story field filled)
  // Generate WHERE clause dynamically from ALL_STORY_FIELDS
  const storyFieldConditions = ALL_STORY_FIELDS.map(field => `${field} IS NOT NULL`).join(' OR ');
  const storiesCount = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM biographies
     WHERE is_public = 1 AND (${storyFieldConditions})`
  ).first<{ count: number }>();

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
    total_stories: storiesCount?.count || 0,
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

  let query = '';

  switch (type) {
    case 'goals_completed':
      query = `
        SELECT b.id as biography_id, b.name, b.avatar_url, COUNT(bl.id) as value
        FROM biographies b
        LEFT JOIN bucket_list_items bl ON bl.biography_id = b.id AND bl.status = 'completed'
        WHERE b.is_public = 1
        GROUP BY b.id
        ORDER BY value DESC
        LIMIT ?
      `;
      break;
    case 'followers':
      query = `
        SELECT id as biography_id, name, avatar_url, follower_count as value
        FROM biographies
        WHERE is_public = 1
        ORDER BY follower_count DESC
        LIMIT ?
      `;
      break;
    case 'likes_received':
      query = `
        SELECT id as biography_id, name, avatar_url, total_likes as value
        FROM biographies
        WHERE is_public = 1
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

  // Check if biography exists
  const biography = await c.env.DB.prepare('SELECT id, user_id FROM biographies WHERE id = ?')
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
biographiesRoutes.get('/:id/comments', async (c) => {
  const biographyId = c.req.param('id');

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

  // Check if biography exists
  const biography = await c.env.DB.prepare(
    'SELECT id, user_id FROM biographies WHERE id = ?'
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
