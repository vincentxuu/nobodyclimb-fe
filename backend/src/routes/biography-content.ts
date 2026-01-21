import { Hono } from 'hono';
import { Bindings } from '../types';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { createNotification } from './notifications';

export const biographyContentRoutes = new Hono<{ Bindings: Bindings }>();

// ═══════════════════════════════════════════
// 公開 API：取得題目列表
// ═══════════════════════════════════════════

// GET /content/questions - 取得所有題目（公開）
biographyContentRoutes.get('/questions', async (c) => {
  const [coreQuestions, oneLinerQuestions, storyCategories, storyQuestions] = await Promise.all([
    c.env.DB.prepare(`
      SELECT id, title, subtitle, placeholder, display_order
      FROM core_story_questions WHERE is_active = 1 ORDER BY display_order
    `).all(),
    c.env.DB.prepare(`
      SELECT id, question, format_hint, placeholder, display_order
      FROM one_liner_questions WHERE is_active = 1 ORDER BY display_order
    `).all(),
    c.env.DB.prepare(`
      SELECT id, name, icon, description, display_order
      FROM story_categories WHERE is_active = 1 ORDER BY display_order
    `).all(),
    c.env.DB.prepare(`
      SELECT id, category_id, title, subtitle, placeholder, difficulty, display_order
      FROM story_questions WHERE is_active = 1 ORDER BY category_id, display_order
    `).all(),
  ]);

  return c.json({
    success: true,
    data: {
      core_stories: coreQuestions.results,
      one_liners: oneLinerQuestions.results,
      story_categories: storyCategories.results,
      stories: storyQuestions.results,
    },
  });
});

// ═══════════════════════════════════════════
// 核心故事 CRUD
// ═══════════════════════════════════════════

// GET /content/biographies/:biographyId/core-stories - 取得某人物誌的核心故事
biographyContentRoutes.get('/biographies/:biographyId/core-stories', optionalAuthMiddleware, async (c) => {
  const biographyId = c.req.param('biographyId');
  const userId = c.get('userId');

  const stories = await c.env.DB.prepare(`
    SELECT cs.*, csq.title, csq.subtitle
    FROM biography_core_stories cs
    LEFT JOIN core_story_questions csq ON cs.question_id = csq.id
    WHERE cs.biography_id = ? AND cs.is_hidden = 0
    ORDER BY cs.display_order
  `).bind(biographyId).all();

  // 如果使用者已登入，檢查是否已按讚
  if (userId && stories.results.length > 0) {
    const storyIds = stories.results.map((s: { id: string }) => s.id);
    const likes = await c.env.DB.prepare(`
      SELECT core_story_id FROM core_story_likes
      WHERE user_id = ? AND core_story_id IN (${storyIds.map(() => '?').join(',')})
    `).bind(userId, ...storyIds).all();

    const likedIds = new Set(likes.results.map((l: { core_story_id: string }) => l.core_story_id));
    stories.results = stories.results.map((s: { id: string }) => ({
      ...s,
      is_liked: likedIds.has(s.id),
    }));
  }

  return c.json({ success: true, data: stories.results });
});

// POST /content/biographies/:biographyId/core-stories - 新增/更新核心故事
biographyContentRoutes.post('/biographies/:biographyId/core-stories', authMiddleware, async (c) => {
  const biographyId = c.req.param('biographyId');
  const userId = c.get('userId');
  const body = await c.req.json();
  const { question_id, content } = body;

  if (!question_id || !content) {
    return c.json({ success: false, error: '問題 ID 和內容為必填' }, 400);
  }

  // 驗證是否為本人的 biography
  const biography = await c.env.DB.prepare(`
    SELECT user_id FROM biographies WHERE id = ?
  `).bind(biographyId).first();

  if (!biography || biography.user_id !== userId) {
    return c.json({ success: false, error: '無權限編輯此人物誌' }, 403);
  }

  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  // Upsert
  await c.env.DB.prepare(`
    INSERT INTO biography_core_stories (id, biography_id, question_id, content, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT (biography_id, question_id)
    DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at
  `).bind(id, biographyId, question_id, content, now, now).run();

  return c.json({ success: true, message: '核心故事已儲存' });
});

// POST /content/core-stories/:id/like - 按讚/取消按讚核心故事
biographyContentRoutes.post('/core-stories/:id/like', authMiddleware, async (c) => {
  const storyId = c.req.param('id');
  const userId = c.get('userId');

  // 取得故事資訊
  const story = await c.env.DB.prepare(`
    SELECT cs.*, b.user_id as owner_id
    FROM biography_core_stories cs
    JOIN biographies b ON cs.biography_id = b.id
    WHERE cs.id = ?
  `).bind(storyId).first();

  if (!story) {
    return c.json({ success: false, error: '找不到此故事' }, 404);
  }

  // 檢查是否已按讚
  const existingLike = await c.env.DB.prepare(`
    SELECT id FROM core_story_likes WHERE core_story_id = ? AND user_id = ?
  `).bind(storyId, userId).first();

  let liked: boolean;
  const now = new Date().toISOString();

  if (existingLike) {
    // 取消按讚
    await c.env.DB.prepare(`
      DELETE FROM core_story_likes WHERE core_story_id = ? AND user_id = ?
    `).bind(storyId, userId).run();
    liked = false;
  } else {
    // 按讚
    const likeId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO core_story_likes (id, core_story_id, user_id, created_at)
      VALUES (?, ?, ?, ?)
    `).bind(likeId, storyId, userId, now).run();
    liked = true;

    // 發送通知（不通知自己）
    if ((story as { owner_id: string }).owner_id !== userId) {
      try {
        await createNotification(c.env.DB, {
          user_id: (story as { owner_id: string }).owner_id,
          type: 'core_story_liked',
          actor_id: userId,
          target_id: storyId,
          message: '對你的核心故事按讚',
        });
      } catch (err) {
        console.error('Failed to create notification:', err);
      }
    }
  }

  // 更新按讚數
  const likeCount = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM core_story_likes WHERE core_story_id = ?
  `).bind(storyId).first();

  await c.env.DB.prepare(`
    UPDATE biography_core_stories SET like_count = ? WHERE id = ?
  `).bind((likeCount as { count: number })?.count || 0, storyId).run();

  return c.json({
    success: true,
    data: {
      liked,
      like_count: (likeCount as { count: number })?.count || 0,
    },
  });
});

// GET /content/core-stories/:id/comments - 取得核心故事留言
biographyContentRoutes.get('/core-stories/:id/comments', async (c) => {
  const storyId = c.req.param('id');

  const comments = await c.env.DB.prepare(`
    SELECT c.*, u.username, u.display_name, u.avatar_url
    FROM core_story_comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.core_story_id = ?
    ORDER BY c.created_at DESC
  `).bind(storyId).all();

  return c.json({ success: true, data: comments.results });
});

// POST /content/core-stories/:id/comments - 新增核心故事留言
biographyContentRoutes.post('/core-stories/:id/comments', authMiddleware, async (c) => {
  const storyId = c.req.param('id');
  const userId = c.get('userId');
  const body = await c.req.json();
  const { content, parent_id } = body;

  if (!content?.trim()) {
    return c.json({ success: false, error: '留言內容不能為空' }, 400);
  }

  // 取得故事資訊
  const story = await c.env.DB.prepare(`
    SELECT cs.*, b.user_id as owner_id
    FROM biography_core_stories cs
    JOIN biographies b ON cs.biography_id = b.id
    WHERE cs.id = ?
  `).bind(storyId).first();

  if (!story) {
    return c.json({ success: false, error: '找不到此故事' }, 404);
  }

  const now = new Date().toISOString();
  const commentId = crypto.randomUUID();

  await c.env.DB.prepare(`
    INSERT INTO core_story_comments (id, core_story_id, user_id, content, parent_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(commentId, storyId, userId, content.trim(), parent_id || null, now, now).run();

  // 更新留言數
  const commentCount = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM core_story_comments WHERE core_story_id = ?
  `).bind(storyId).first();

  await c.env.DB.prepare(`
    UPDATE biography_core_stories SET comment_count = ? WHERE id = ?
  `).bind((commentCount as { count: number })?.count || 0, storyId).run();

  // 發送通知
  if ((story as { owner_id: string }).owner_id !== userId) {
    try {
      await createNotification(c.env.DB, {
        user_id: (story as { owner_id: string }).owner_id,
        type: 'core_story_commented',
        actor_id: userId,
        target_id: storyId,
        message: '對你的核心故事留言',
      });
    } catch (err) {
      console.error('Failed to create notification:', err);
    }
  }

  // 回傳新留言
  const newComment = await c.env.DB.prepare(`
    SELECT c.*, u.username, u.display_name, u.avatar_url
    FROM core_story_comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.id = ?
  `).bind(commentId).first();

  return c.json({ success: true, data: newComment });
});

// DELETE /content/core-story-comments/:id - 刪除留言
biographyContentRoutes.delete('/core-story-comments/:id', authMiddleware, async (c) => {
  const commentId = c.req.param('id');
  const userId = c.get('userId');

  const comment = await c.env.DB.prepare(`
    SELECT * FROM core_story_comments WHERE id = ?
  `).bind(commentId).first();

  if (!comment) {
    return c.json({ success: false, error: '找不到此留言' }, 404);
  }

  if ((comment as { user_id: string }).user_id !== userId) {
    return c.json({ success: false, error: '無權限刪除此留言' }, 403);
  }

  await c.env.DB.prepare(`
    DELETE FROM core_story_comments WHERE id = ?
  `).bind(commentId).run();

  // 更新留言數
  const commentCount = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM core_story_comments WHERE core_story_id = ?
  `).bind((comment as { core_story_id: string }).core_story_id).first();

  await c.env.DB.prepare(`
    UPDATE biography_core_stories SET comment_count = ? WHERE id = ?
  `).bind((commentCount as { count: number })?.count || 0, (comment as { core_story_id: string }).core_story_id).run();

  return c.json({ success: true, message: '留言已刪除' });
});

// ═══════════════════════════════════════════
// 一句話系列 CRUD
// ═══════════════════════════════════════════

// GET /content/biographies/:biographyId/one-liners - 取得某人物誌的一句話
biographyContentRoutes.get('/biographies/:biographyId/one-liners', optionalAuthMiddleware, async (c) => {
  const biographyId = c.req.param('biographyId');
  const userId = c.get('userId');

  const oneLiners = await c.env.DB.prepare(`
    SELECT ol.*, olq.question, olq.format_hint
    FROM biography_one_liners ol
    LEFT JOIN one_liner_questions olq ON ol.question_id = olq.id
    WHERE ol.biography_id = ? AND ol.is_hidden = 0
    ORDER BY ol.display_order
  `).bind(biographyId).all();

  if (userId && oneLiners.results.length > 0) {
    const ids = oneLiners.results.map((o: { id: string }) => o.id);
    const likes = await c.env.DB.prepare(`
      SELECT one_liner_id FROM one_liner_likes
      WHERE user_id = ? AND one_liner_id IN (${ids.map(() => '?').join(',')})
    `).bind(userId, ...ids).all();

    const likedIds = new Set(likes.results.map((l: { one_liner_id: string }) => l.one_liner_id));
    oneLiners.results = oneLiners.results.map((o: { id: string }) => ({
      ...o,
      is_liked: likedIds.has(o.id),
    }));
  }

  return c.json({ success: true, data: oneLiners.results });
});

// POST /content/biographies/:biographyId/one-liners - 新增/更新一句話
biographyContentRoutes.post('/biographies/:biographyId/one-liners', authMiddleware, async (c) => {
  const biographyId = c.req.param('biographyId');
  const userId = c.get('userId');
  const body = await c.req.json();
  const { question_id, answer, question_text, source } = body;

  if (!question_id || !answer) {
    return c.json({ success: false, error: '問題 ID 和回答為必填' }, 400);
  }

  const biography = await c.env.DB.prepare(`
    SELECT user_id FROM biographies WHERE id = ?
  `).bind(biographyId).first();

  if (!biography || biography.user_id !== userId) {
    return c.json({ success: false, error: '無權限編輯此人物誌' }, 403);
  }

  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  await c.env.DB.prepare(`
    INSERT INTO biography_one_liners (id, biography_id, question_id, question_text, answer, source, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (biography_id, question_id)
    DO UPDATE SET answer = excluded.answer, question_text = excluded.question_text, updated_at = excluded.updated_at
  `).bind(id, biographyId, question_id, question_text || null, answer, source || 'system', now, now).run();

  return c.json({ success: true, message: '一句話已儲存' });
});

// DELETE /content/one-liners/:id - 刪除一句話
biographyContentRoutes.delete('/one-liners/:id', authMiddleware, async (c) => {
  const oneLinerId = c.req.param('id');
  const userId = c.get('userId');

  const oneLiner = await c.env.DB.prepare(`
    SELECT ol.*, b.user_id as owner_id
    FROM biography_one_liners ol
    JOIN biographies b ON ol.biography_id = b.id
    WHERE ol.id = ?
  `).bind(oneLinerId).first();

  if (!oneLiner) {
    return c.json({ success: false, error: '找不到此一句話' }, 404);
  }

  if ((oneLiner as { owner_id: string }).owner_id !== userId) {
    return c.json({ success: false, error: '無權限刪除' }, 403);
  }

  await c.env.DB.prepare(`
    DELETE FROM biography_one_liners WHERE id = ?
  `).bind(oneLinerId).run();

  return c.json({ success: true, message: '已刪除' });
});

// POST /content/one-liners/:id/like - 按讚一句話
biographyContentRoutes.post('/one-liners/:id/like', authMiddleware, async (c) => {
  const oneLinerId = c.req.param('id');
  const userId = c.get('userId');

  const oneLiner = await c.env.DB.prepare(`
    SELECT ol.*, b.user_id as owner_id
    FROM biography_one_liners ol
    JOIN biographies b ON ol.biography_id = b.id
    WHERE ol.id = ?
  `).bind(oneLinerId).first();

  if (!oneLiner) {
    return c.json({ success: false, error: '找不到此一句話' }, 404);
  }

  const existingLike = await c.env.DB.prepare(`
    SELECT id FROM one_liner_likes WHERE one_liner_id = ? AND user_id = ?
  `).bind(oneLinerId, userId).first();

  let liked: boolean;
  const now = new Date().toISOString();

  if (existingLike) {
    await c.env.DB.prepare(`
      DELETE FROM one_liner_likes WHERE one_liner_id = ? AND user_id = ?
    `).bind(oneLinerId, userId).run();
    liked = false;
  } else {
    const likeId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO one_liner_likes (id, one_liner_id, user_id, created_at)
      VALUES (?, ?, ?, ?)
    `).bind(likeId, oneLinerId, userId, now).run();
    liked = true;

    if ((oneLiner as { owner_id: string }).owner_id !== userId) {
      try {
        await createNotification(c.env.DB, {
          user_id: (oneLiner as { owner_id: string }).owner_id,
          type: 'one_liner_liked',
          actor_id: userId,
          target_id: oneLinerId,
          message: '對你的一句話按讚',
        });
      } catch (err) {
        console.error('Failed to create notification:', err);
      }
    }
  }

  const likeCount = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM one_liner_likes WHERE one_liner_id = ?
  `).bind(oneLinerId).first();

  await c.env.DB.prepare(`
    UPDATE biography_one_liners SET like_count = ? WHERE id = ?
  `).bind((likeCount as { count: number })?.count || 0, oneLinerId).run();

  return c.json({
    success: true,
    data: { liked, like_count: (likeCount as { count: number })?.count || 0 },
  });
});

// GET /content/one-liners/:id/comments - 取得一句話留言
biographyContentRoutes.get('/one-liners/:id/comments', async (c) => {
  const oneLinerId = c.req.param('id');

  const comments = await c.env.DB.prepare(`
    SELECT c.*, u.username, u.display_name, u.avatar_url
    FROM one_liner_comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.one_liner_id = ?
    ORDER BY c.created_at DESC
  `).bind(oneLinerId).all();

  return c.json({ success: true, data: comments.results });
});

// POST /content/one-liners/:id/comments - 新增一句話留言
biographyContentRoutes.post('/one-liners/:id/comments', authMiddleware, async (c) => {
  const oneLinerId = c.req.param('id');
  const userId = c.get('userId');
  const body = await c.req.json();
  const { content, parent_id } = body;

  if (!content?.trim()) {
    return c.json({ success: false, error: '留言內容不能為空' }, 400);
  }

  const oneLiner = await c.env.DB.prepare(`
    SELECT ol.*, b.user_id as owner_id
    FROM biography_one_liners ol
    JOIN biographies b ON ol.biography_id = b.id
    WHERE ol.id = ?
  `).bind(oneLinerId).first();

  if (!oneLiner) {
    return c.json({ success: false, error: '找不到此一句話' }, 404);
  }

  const now = new Date().toISOString();
  const commentId = crypto.randomUUID();

  await c.env.DB.prepare(`
    INSERT INTO one_liner_comments (id, one_liner_id, user_id, content, parent_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(commentId, oneLinerId, userId, content.trim(), parent_id || null, now, now).run();

  const commentCount = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM one_liner_comments WHERE one_liner_id = ?
  `).bind(oneLinerId).first();

  await c.env.DB.prepare(`
    UPDATE biography_one_liners SET comment_count = ? WHERE id = ?
  `).bind((commentCount as { count: number })?.count || 0, oneLinerId).run();

  if ((oneLiner as { owner_id: string }).owner_id !== userId) {
    try {
      await createNotification(c.env.DB, {
        user_id: (oneLiner as { owner_id: string }).owner_id,
        type: 'one_liner_commented',
        actor_id: userId,
        target_id: oneLinerId,
        message: '對你的一句話留言',
      });
    } catch (err) {
      console.error('Failed to create notification:', err);
    }
  }

  const newComment = await c.env.DB.prepare(`
    SELECT c.*, u.username, u.display_name, u.avatar_url
    FROM one_liner_comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.id = ?
  `).bind(commentId).first();

  return c.json({ success: true, data: newComment });
});

// ═══════════════════════════════════════════
// 小故事 CRUD
// ═══════════════════════════════════════════

// GET /content/biographies/:biographyId/stories - 取得某人物誌的小故事
biographyContentRoutes.get('/biographies/:biographyId/stories', optionalAuthMiddleware, async (c) => {
  const biographyId = c.req.param('biographyId');
  const userId = c.get('userId');
  const categoryId = c.req.query('category_id');

  let query = `
    SELECT s.*, sq.title, sq.subtitle, sq.difficulty, sc.name as category_name, sc.icon as category_icon
    FROM biography_stories s
    LEFT JOIN story_questions sq ON s.question_id = sq.id
    LEFT JOIN story_categories sc ON s.category_id = sc.id
    WHERE s.biography_id = ? AND s.is_hidden = 0
  `;
  const params: (string | number)[] = [biographyId];

  if (categoryId) {
    query += ' AND s.category_id = ?';
    params.push(categoryId);
  }

  query += ' ORDER BY s.category_id, s.display_order';

  const stories = await c.env.DB.prepare(query).bind(...params).all();

  if (userId && stories.results.length > 0) {
    const ids = stories.results.map((s: { id: string }) => s.id);
    const likes = await c.env.DB.prepare(`
      SELECT story_id FROM story_likes
      WHERE user_id = ? AND story_id IN (${ids.map(() => '?').join(',')})
    `).bind(userId, ...ids).all();

    const likedIds = new Set(likes.results.map((l: { story_id: string }) => l.story_id));
    stories.results = stories.results.map((s: { id: string }) => ({
      ...s,
      is_liked: likedIds.has(s.id),
    }));
  }

  return c.json({ success: true, data: stories.results });
});

// POST /content/biographies/:biographyId/stories - 新增/更新小故事
biographyContentRoutes.post('/biographies/:biographyId/stories', authMiddleware, async (c) => {
  const biographyId = c.req.param('biographyId');
  const userId = c.get('userId');
  const body = await c.req.json();
  const { question_id, content, category_id, question_text, source } = body;

  if (!question_id || !content) {
    return c.json({ success: false, error: '問題 ID 和內容為必填' }, 400);
  }

  const biography = await c.env.DB.prepare(`
    SELECT user_id FROM biographies WHERE id = ?
  `).bind(biographyId).first();

  if (!biography || biography.user_id !== userId) {
    return c.json({ success: false, error: '無權限編輯此人物誌' }, 403);
  }

  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const wordCount = content.length;

  await c.env.DB.prepare(`
    INSERT INTO biography_stories (id, biography_id, question_id, question_text, category_id, content, source, word_count, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (biography_id, question_id)
    DO UPDATE SET content = excluded.content, question_text = excluded.question_text, category_id = excluded.category_id, word_count = excluded.word_count, updated_at = excluded.updated_at
  `).bind(id, biographyId, question_id, question_text || null, category_id || null, content, source || 'system', wordCount, now, now).run();

  return c.json({ success: true, message: '故事已儲存' });
});

// DELETE /content/stories/:id - 刪除小故事
biographyContentRoutes.delete('/stories/:id', authMiddleware, async (c) => {
  const storyId = c.req.param('id');
  const userId = c.get('userId');

  const story = await c.env.DB.prepare(`
    SELECT s.*, b.user_id as owner_id
    FROM biography_stories s
    JOIN biographies b ON s.biography_id = b.id
    WHERE s.id = ?
  `).bind(storyId).first();

  if (!story) {
    return c.json({ success: false, error: '找不到此故事' }, 404);
  }

  if ((story as { owner_id: string }).owner_id !== userId) {
    return c.json({ success: false, error: '無權限刪除' }, 403);
  }

  await c.env.DB.prepare(`
    DELETE FROM biography_stories WHERE id = ?
  `).bind(storyId).run();

  return c.json({ success: true, message: '已刪除' });
});

// POST /content/stories/:id/like - 按讚小故事
biographyContentRoutes.post('/stories/:id/like', authMiddleware, async (c) => {
  const storyId = c.req.param('id');
  const userId = c.get('userId');

  const story = await c.env.DB.prepare(`
    SELECT s.*, b.user_id as owner_id
    FROM biography_stories s
    JOIN biographies b ON s.biography_id = b.id
    WHERE s.id = ?
  `).bind(storyId).first();

  if (!story) {
    return c.json({ success: false, error: '找不到此故事' }, 404);
  }

  const existingLike = await c.env.DB.prepare(`
    SELECT id FROM story_likes WHERE story_id = ? AND user_id = ?
  `).bind(storyId, userId).first();

  let liked: boolean;
  const now = new Date().toISOString();

  if (existingLike) {
    await c.env.DB.prepare(`
      DELETE FROM story_likes WHERE story_id = ? AND user_id = ?
    `).bind(storyId, userId).run();
    liked = false;
  } else {
    const likeId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO story_likes (id, story_id, user_id, created_at)
      VALUES (?, ?, ?, ?)
    `).bind(likeId, storyId, userId, now).run();
    liked = true;

    if ((story as { owner_id: string }).owner_id !== userId) {
      try {
        await createNotification(c.env.DB, {
          user_id: (story as { owner_id: string }).owner_id,
          type: 'story_liked',
          actor_id: userId,
          target_id: storyId,
          message: '對你的故事按讚',
        });
      } catch (err) {
        console.error('Failed to create notification:', err);
      }
    }
  }

  const likeCount = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM story_likes WHERE story_id = ?
  `).bind(storyId).first();

  await c.env.DB.prepare(`
    UPDATE biography_stories SET like_count = ? WHERE id = ?
  `).bind((likeCount as { count: number })?.count || 0, storyId).run();

  return c.json({
    success: true,
    data: { liked, like_count: (likeCount as { count: number })?.count || 0 },
  });
});

// GET /content/stories/:id/comments - 取得小故事留言
biographyContentRoutes.get('/stories/:id/comments', async (c) => {
  const storyId = c.req.param('id');

  const comments = await c.env.DB.prepare(`
    SELECT c.*, u.username, u.display_name, u.avatar_url
    FROM story_comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.story_id = ?
    ORDER BY c.created_at DESC
  `).bind(storyId).all();

  return c.json({ success: true, data: comments.results });
});

// POST /content/stories/:id/comments - 新增小故事留言
biographyContentRoutes.post('/stories/:id/comments', authMiddleware, async (c) => {
  const storyId = c.req.param('id');
  const userId = c.get('userId');
  const body = await c.req.json();
  const { content, parent_id } = body;

  if (!content?.trim()) {
    return c.json({ success: false, error: '留言內容不能為空' }, 400);
  }

  const story = await c.env.DB.prepare(`
    SELECT s.*, b.user_id as owner_id
    FROM biography_stories s
    JOIN biographies b ON s.biography_id = b.id
    WHERE s.id = ?
  `).bind(storyId).first();

  if (!story) {
    return c.json({ success: false, error: '找不到此故事' }, 404);
  }

  const now = new Date().toISOString();
  const commentId = crypto.randomUUID();

  await c.env.DB.prepare(`
    INSERT INTO story_comments (id, story_id, user_id, content, parent_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(commentId, storyId, userId, content.trim(), parent_id || null, now, now).run();

  const commentCount = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM story_comments WHERE story_id = ?
  `).bind(storyId).first();

  await c.env.DB.prepare(`
    UPDATE biography_stories SET comment_count = ? WHERE id = ?
  `).bind((commentCount as { count: number })?.count || 0, storyId).run();

  if ((story as { owner_id: string }).owner_id !== userId) {
    try {
      await createNotification(c.env.DB, {
        user_id: (story as { owner_id: string }).owner_id,
        type: 'story_commented',
        actor_id: userId,
        target_id: storyId,
        message: '對你的故事留言',
      });
    } catch (err) {
      console.error('Failed to create notification:', err);
    }
  }

  const newComment = await c.env.DB.prepare(`
    SELECT c.*, u.username, u.display_name, u.avatar_url
    FROM story_comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.id = ?
  `).bind(commentId).first();

  return c.json({ success: true, data: newComment });
});

// ═══════════════════════════════════════════
// 探索/熱門
// ═══════════════════════════════════════════

// GET /content/popular/core-stories - 熱門核心故事
biographyContentRoutes.get('/popular/core-stories', async (c) => {
  const limit = parseInt(c.req.query('limit') || '10');

  const stories = await c.env.DB.prepare(`
    SELECT cs.*, csq.title, csq.subtitle, b.name as author_name, b.avatar_url as author_avatar
    FROM biography_core_stories cs
    JOIN core_story_questions csq ON cs.question_id = csq.id
    JOIN biographies b ON cs.biography_id = b.id
    WHERE cs.is_hidden = 0
    ORDER BY cs.like_count DESC
    LIMIT ?
  `).bind(limit).all();

  return c.json({ success: true, data: stories.results });
});

// GET /content/popular/one-liners - 熱門一句話
biographyContentRoutes.get('/popular/one-liners', async (c) => {
  const limit = parseInt(c.req.query('limit') || '10');

  const oneLiners = await c.env.DB.prepare(`
    SELECT ol.*, olq.question, b.name as author_name, b.avatar_url as author_avatar
    FROM biography_one_liners ol
    LEFT JOIN one_liner_questions olq ON ol.question_id = olq.id
    JOIN biographies b ON ol.biography_id = b.id
    WHERE ol.is_hidden = 0
    ORDER BY ol.like_count DESC
    LIMIT ?
  `).bind(limit).all();

  return c.json({ success: true, data: oneLiners.results });
});

// GET /content/popular/stories - 熱門小故事
biographyContentRoutes.get('/popular/stories', async (c) => {
  const limit = parseInt(c.req.query('limit') || '10');
  const categoryId = c.req.query('category_id');

  let query = `
    SELECT s.*, sq.title, sq.subtitle, sc.name as category_name, sc.icon as category_icon,
           b.name as author_name, b.avatar_url as author_avatar
    FROM biography_stories s
    LEFT JOIN story_questions sq ON s.question_id = sq.id
    LEFT JOIN story_categories sc ON s.category_id = sc.id
    JOIN biographies b ON s.biography_id = b.id
    WHERE s.is_hidden = 0
  `;
  const params: (string | number)[] = [];

  if (categoryId) {
    query += ' AND s.category_id = ?';
    params.push(categoryId);
  }

  query += ' ORDER BY s.like_count DESC LIMIT ?';
  params.push(limit);

  const stories = await c.env.DB.prepare(query).bind(...params).all();

  return c.json({ success: true, data: stories.results });
});
