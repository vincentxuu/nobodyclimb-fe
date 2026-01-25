import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { Env } from '../types';
import { generateId } from '../utils/id';
import { authMiddleware } from '../middleware/auth';

export const guestRoutes = new Hono<{ Bindings: Env }>();

// ============================================
// Validation Schemas
// ============================================

const createSessionSchema = z.object({
  session_id: z.string().uuid().optional(), // 客戶端可提供已有的 session ID
});

const trackActivitySchema = z.object({
  session_id: z.string().uuid(),
  page_views: z.number().int().min(0).optional(),
  time_spent_seconds: z.number().int().min(0).optional(),
  biography_views: z.number().int().min(0).optional(),
});

const createAnonymousBiographySchema = z.object({
  session_id: z.string().uuid(),
  // 核心故事（可選）
  core_stories: z.array(z.object({
    question_id: z.string(),
    content: z.string().min(1).max(5000),
  })).optional().default([]),
  // 一句話（可選）
  one_liners: z.array(z.object({
    question_id: z.string(),
    answer: z.string().min(1).max(500),
    question_text: z.string().optional(),
  })).optional().default([]),
  // 深度故事（可選）
  stories: z.array(z.object({
    question_id: z.string(),
    content: z.string().min(1).max(10000),
    question_text: z.string().optional(),
    category_id: z.string().optional(),
  })).optional().default([]),
  // 可選的聯絡 email
  contact_email: z.string().email().optional(),
}).refine(
  (data) => data.core_stories.length > 0 || data.one_liners.length > 0 || data.stories.length > 0,
  { message: '請至少填寫一個故事' }
);

const claimBiographySchema = z.object({
  keep_anonymous: z.boolean().optional().default(false),
});

// ============================================
// Helper Functions
// ============================================

// 生成匿名名稱（攀岩者 #XXXX）
function generateAnonymousName(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 排除容易混淆的字元
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `攀岩者 #${code}`;
}

// 檢查是否達到分享資格
async function checkEligibility(
  db: D1Database,
  session: { page_views: number; biography_views: number; time_spent_seconds: number }
): Promise<boolean> {
  // 取得設定
  const config = await db.prepare(
    'SELECT * FROM share_eligibility_config WHERE id = ?'
  ).bind('default').first<{
    min_page_views: number;
    min_biography_views: number;
    min_time_spent_minutes: number;
    require_all: number;
  }>();

  if (!config) {
    // 預設值
    return session.page_views >= 5 ||
           session.biography_views >= 3 ||
           session.time_spent_seconds >= 300;
  }

  const minTimeSeconds = config.min_time_spent_minutes * 60;

  if (config.require_all === 1) {
    // 需要全部滿足
    return session.page_views >= config.min_page_views &&
           session.biography_views >= config.min_biography_views &&
           session.time_spent_seconds >= minTimeSeconds;
  } else {
    // 滿足任一即可
    return session.page_views >= config.min_page_views ||
           session.biography_views >= config.min_biography_views ||
           session.time_spent_seconds >= minTimeSeconds;
  }
}

// ============================================
// Guest Session Routes
// ============================================

// POST /guest/session - 建立或取得 Guest Session
guestRoutes.post('/session', zValidator('json', createSessionSchema), async (c) => {
  const { session_id } = c.req.valid('json');

  // 如果提供了 session_id，嘗試取得現有 session
  if (session_id) {
    const existing = await c.env.DB.prepare(
      'SELECT * FROM guest_sessions WHERE id = ?'
    ).bind(session_id).first();

    if (existing) {
      // 更新最後造訪時間
      await c.env.DB.prepare(
        'UPDATE guest_sessions SET last_visit_at = datetime(\'now\'), updated_at = datetime(\'now\') WHERE id = ?'
      ).bind(session_id).run();

      return c.json({
        success: true,
        session: {
          id: existing.id,
          page_views: existing.page_views,
          time_spent_seconds: existing.time_spent_seconds,
          biography_views: existing.biography_views,
          is_eligible_to_share: existing.is_eligible_to_share === 1,
          is_claimed: existing.claimed_by_user_id !== null,
        },
      });
    }
  }

  // 建立新的 session
  const newId = session_id || crypto.randomUUID();

  await c.env.DB.prepare(`
    INSERT INTO guest_sessions (id, first_visit_at, last_visit_at)
    VALUES (?, datetime('now'), datetime('now'))
  `).bind(newId).run();

  return c.json({
    success: true,
    session: {
      id: newId,
      page_views: 0,
      time_spent_seconds: 0,
      biography_views: 0,
      is_eligible_to_share: false,
      is_claimed: false,
    },
  });
});

// GET /guest/session/:id - 取得 Session 狀態
guestRoutes.get('/session/:id', async (c) => {
  const sessionId = c.req.param('id');

  const session = await c.env.DB.prepare(
    'SELECT * FROM guest_sessions WHERE id = ?'
  ).bind(sessionId).first();

  if (!session) {
    return c.json({ success: false, error: 'Session not found' }, 404);
  }

  return c.json({
    success: true,
    session: {
      id: session.id,
      page_views: session.page_views,
      time_spent_seconds: session.time_spent_seconds,
      biography_views: session.biography_views,
      is_eligible_to_share: session.is_eligible_to_share === 1,
      is_claimed: session.claimed_by_user_id !== null,
    },
  });
});

// POST /guest/track - 追蹤瀏覽行為
guestRoutes.post('/track', zValidator('json', trackActivitySchema), async (c) => {
  const { session_id, page_views, time_spent_seconds, biography_views } = c.req.valid('json');

  // 取得現有 session
  const session = await c.env.DB.prepare(
    'SELECT * FROM guest_sessions WHERE id = ?'
  ).bind(session_id).first<{
    page_views: number;
    time_spent_seconds: number;
    biography_views: number;
    is_eligible_to_share: number;
  }>();

  if (!session) {
    return c.json({ success: false, error: 'Session not found' }, 404);
  }

  // 累加數值
  const newPageViews = session.page_views + (page_views || 0);
  const newTimeSpent = session.time_spent_seconds + (time_spent_seconds || 0);
  const newBioViews = session.biography_views + (biography_views || 0);

  // 檢查是否達到資格
  const wasEligible = session.is_eligible_to_share === 1;
  const isNowEligible = await checkEligibility(c.env.DB, {
    page_views: newPageViews,
    biography_views: newBioViews,
    time_spent_seconds: newTimeSpent,
  });

  // 更新 session
  await c.env.DB.prepare(`
    UPDATE guest_sessions
    SET page_views = ?,
        time_spent_seconds = ?,
        biography_views = ?,
        is_eligible_to_share = ?,
        eligible_at = CASE WHEN ? = 1 AND is_eligible_to_share = 0 THEN datetime('now') ELSE eligible_at END,
        last_visit_at = datetime('now'),
        updated_at = datetime('now')
    WHERE id = ?
  `).bind(
    newPageViews,
    newTimeSpent,
    newBioViews,
    isNowEligible ? 1 : 0,
    isNowEligible ? 1 : 0,
    session_id
  ).run();

  return c.json({
    success: true,
    session: {
      page_views: newPageViews,
      time_spent_seconds: newTimeSpent,
      biography_views: newBioViews,
      is_eligible_to_share: isNowEligible,
      just_became_eligible: !wasEligible && isNowEligible,
    },
  });
});

// ============================================
// Anonymous Content Routes
// ============================================

// POST /guest/anonymous/biography - 建立匿名人物誌
guestRoutes.post('/anonymous/biography', zValidator('json', createAnonymousBiographySchema), async (c) => {
  const { session_id, core_stories, one_liners, stories, contact_email } = c.req.valid('json');

  // 檢查 session 存在且有資格
  const session = await c.env.DB.prepare(
    'SELECT * FROM guest_sessions WHERE id = ?'
  ).bind(session_id).first<{
    is_eligible_to_share: number;
    claimed_by_user_id: string | null;
  }>();

  if (!session) {
    return c.json({ success: false, error: 'Session not found' }, 404);
  }

  if (session.is_eligible_to_share !== 1) {
    return c.json({ success: false, error: 'Not eligible to share yet' }, 403);
  }

  // 檢查是否已經有匿名人物誌
  const existingBio = await c.env.DB.prepare(
    'SELECT id FROM biographies WHERE guest_session_id = ?'
  ).bind(session_id).first();

  if (existingBio) {
    return c.json({
      success: false,
      error: 'Biography already exists for this session',
      biography_id: existingBio.id,
    }, 409);
  }

  // 建立匿名人物誌
  const biographyId = generateId();
  const anonymousName = generateAnonymousName();
  const slug = `anonymous-${biographyId.substring(0, 8)}`;

  await c.env.DB.prepare(`
    INSERT INTO biographies (
      id, name, slug, guest_session_id, is_anonymous, anonymous_name, visibility
    ) VALUES (?, ?, ?, ?, 1, ?, 'public')
  `).bind(biographyId, anonymousName, slug, session_id, anonymousName).run();

  // 插入核心故事
  for (const story of core_stories) {
    const storyId = generateId();
    await c.env.DB.prepare(`
      INSERT INTO biography_core_stories (id, biography_id, question_id, content)
      VALUES (?, ?, ?, ?)
    `).bind(storyId, biographyId, story.question_id, story.content).run();
  }

  // 插入一句話
  for (const oneLiner of one_liners) {
    const oneLinerId = generateId();
    await c.env.DB.prepare(`
      INSERT INTO biography_one_liners (id, biography_id, question_id, answer, question_text, source)
      VALUES (?, ?, ?, ?, ?, 'system')
    `).bind(oneLinerId, biographyId, oneLiner.question_id, oneLiner.answer, oneLiner.question_text || null).run();
  }

  // 插入深度故事
  for (const story of stories) {
    const storyId = generateId();
    await c.env.DB.prepare(`
      INSERT INTO biography_stories (id, biography_id, question_id, content, question_text, category_id, source)
      VALUES (?, ?, ?, ?, ?, ?, 'system')
    `).bind(storyId, biographyId, story.question_id, story.content, story.question_text || null, story.category_id || null).run();
  }

  // 如果有提供 email，更新 session
  if (contact_email) {
    await c.env.DB.prepare(
      'UPDATE guest_sessions SET contact_email = ? WHERE id = ?'
    ).bind(contact_email, session_id).run();
  }

  // 計算總故事數
  const totalStories = core_stories.length + one_liners.length + stories.length;

  return c.json({
    success: true,
    biography: {
      id: biographyId,
      slug,
      anonymous_name: anonymousName,
      total_stories: totalStories,
    },
  });
});

// GET /guest/anonymous/biography/:sessionId - 取得匿名人物誌
guestRoutes.get('/anonymous/biography/:sessionId', async (c) => {
  const sessionId = c.req.param('sessionId');

  const biography = await c.env.DB.prepare(`
    SELECT b.*,
           (SELECT json_group_array(json_object(
             'id', cs.id,
             'question_id', cs.question_id,
             'content', cs.content
           )) FROM biography_core_stories cs WHERE cs.biography_id = b.id) as core_stories
    FROM biographies b
    WHERE b.guest_session_id = ?
  `).bind(sessionId).first();

  if (!biography) {
    return c.json({ success: false, error: 'Biography not found' }, 404);
  }

  return c.json({
    success: true,
    biography: {
      id: biography.id,
      slug: biography.slug,
      anonymous_name: biography.anonymous_name,
      is_anonymous: biography.is_anonymous === 1,
      is_claimed: biography.user_id !== null,
      core_stories: JSON.parse(biography.core_stories as string || '[]'),
      created_at: biography.created_at,
    },
  });
});

// ============================================
// Claim Routes (需要登入)
// ============================================

// GET /guest/claim/check - 檢查是否有可認領的內容
guestRoutes.get('/claim/check', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const sessionId = c.req.query('session_id');
  const email = c.req.query('email');

  let query = `
    SELECT b.id, b.anonymous_name, b.created_at,
           (SELECT COUNT(*) FROM biography_core_stories WHERE biography_id = b.id) as story_count
    FROM biographies b
    WHERE b.user_id IS NULL AND b.guest_session_id IS NOT NULL
  `;
  const params: string[] = [];

  if (sessionId) {
    query += ' AND b.guest_session_id = ?';
    params.push(sessionId);
  } else if (email) {
    query += ' AND b.guest_session_id IN (SELECT id FROM guest_sessions WHERE contact_email = ?)';
    params.push(email);
  } else {
    // 沒有提供任何參數
    return c.json({ success: true, unclaimed: [] });
  }

  const result = await c.env.DB.prepare(query).bind(...params).all();

  return c.json({
    success: true,
    unclaimed: result.results.map((bio: any) => ({
      id: bio.id,
      anonymous_name: bio.anonymous_name,
      story_count: bio.story_count,
      created_at: bio.created_at,
    })),
  });
});

// POST /guest/claim/biography/:id - 認領人物誌
guestRoutes.post('/claim/biography/:id', authMiddleware, zValidator('json', claimBiographySchema), async (c) => {
  const biographyId = c.req.param('id');
  const userId = c.get('userId');
  const { keep_anonymous } = c.req.valid('json');

  // 取得要認領的人物誌
  const biography = await c.env.DB.prepare(
    'SELECT * FROM biographies WHERE id = ? AND user_id IS NULL'
  ).bind(biographyId).first<{
    id: string;
    guest_session_id: string;
    anonymous_name: string;
  }>();

  if (!biography) {
    return c.json({ success: false, error: '內容不存在或已被認領' }, 404);
  }

  // 檢查用戶是否已有人物誌
  const existingBio = await c.env.DB.prepare(
    'SELECT id, name FROM biographies WHERE user_id = ?'
  ).bind(userId).first();

  if (existingBio) {
    return c.json({
      success: false,
      error: '你已有人物誌',
      existing_biography_id: existingBio.id,
      options: ['merge', 'cancel'],
    }, 409);
  }

  // 執行認領
  await c.env.DB.prepare(`
    UPDATE biographies
    SET user_id = ?,
        is_anonymous = ?,
        claimed_at = datetime('now'),
        updated_at = datetime('now')
    WHERE id = ?
  `).bind(userId, keep_anonymous ? 1 : 0, biographyId).run();

  // 更新 guest_session
  await c.env.DB.prepare(`
    UPDATE guest_sessions
    SET claimed_by_user_id = ?,
        claimed_at = datetime('now'),
        updated_at = datetime('now')
    WHERE id = ?
  `).bind(userId, biography.guest_session_id).run();

  // 記錄認領歷史
  const claimId = generateId();
  await c.env.DB.prepare(`
    INSERT INTO content_claims (id, guest_session_id, user_id, biography_id, kept_anonymous)
    VALUES (?, ?, ?, ?, ?)
  `).bind(claimId, biography.guest_session_id, userId, biographyId, keep_anonymous ? 1 : 0).run();

  return c.json({
    success: true,
    biography_id: biographyId,
    is_anonymous: keep_anonymous,
  });
});

// POST /guest/claim/merge/:sourceId - 合併匿名內容到現有人物誌
guestRoutes.post('/claim/merge/:sourceId', authMiddleware, async (c) => {
  const sourceId = c.req.param('sourceId'); // 匿名人物誌 ID
  const userId = c.get('userId');

  // 取得匿名人物誌
  const sourceBio = await c.env.DB.prepare(
    'SELECT * FROM biographies WHERE id = ? AND user_id IS NULL'
  ).bind(sourceId).first<{
    id: string;
    guest_session_id: string;
  }>();

  if (!sourceBio) {
    return c.json({ success: false, error: '匿名內容不存在或已被認領' }, 404);
  }

  // 取得用戶的人物誌
  const targetBio = await c.env.DB.prepare(
    'SELECT id FROM biographies WHERE user_id = ?'
  ).bind(userId).first<{ id: string }>();

  if (!targetBio) {
    return c.json({ success: false, error: '你還沒有人物誌，請直接認領' }, 400);
  }

  // 將核心故事從匿名人物誌移動到用戶人物誌（只移動用戶沒有的題目）
  const mergedStories = await c.env.DB.prepare(`
    INSERT OR IGNORE INTO biography_core_stories (id, biography_id, question_id, content, created_at)
    SELECT ? || '-' || question_id, ?, question_id, content, created_at
    FROM biography_core_stories
    WHERE biography_id = ?
  `).bind(generateId(), targetBio.id, sourceId).run();

  // 刪除匿名人物誌
  await c.env.DB.prepare('DELETE FROM biographies WHERE id = ?').bind(sourceId).run();

  // 更新 guest_session
  await c.env.DB.prepare(`
    UPDATE guest_sessions
    SET claimed_by_user_id = ?,
        claimed_at = datetime('now')
    WHERE id = ?
  `).bind(userId, sourceBio.guest_session_id).run();

  // 記錄認領歷史
  const claimId = generateId();
  await c.env.DB.prepare(`
    INSERT INTO content_claims (id, guest_session_id, user_id, biography_id, kept_anonymous)
    VALUES (?, ?, ?, ?, 0)
  `).bind(claimId, sourceBio.guest_session_id, userId, targetBio.id).run();

  return c.json({
    success: true,
    merged_to_biography_id: targetBio.id,
    stories_merged: mergedStories.meta.changes,
  });
});
