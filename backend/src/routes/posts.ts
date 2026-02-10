import { Hono } from 'hono';
import { z } from 'zod';
import { describeRoute, validator } from 'hono-openapi';
import { Env, Post } from '../types';
import { parsePagination, generateId } from '../utils/id';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { createNotification, createLikeNotificationWithAggregation } from './notifications';
import { PostRepository } from '../repositories/post-repository';
import { PostService } from '../services/post-service';

export const postsRoutes = new Hono<{ Bindings: Env }>();

/**
 * 初始化 Service
 */
function initService(c: any): PostService {
  const repository = new PostRepository(c.env.DB);
  return new PostService(repository, c.env.DB, c.env.CACHE, c.env.R2_PUBLIC_URL);
}

// ============================================
// Posts CRUD Routes
// ============================================

// GET /posts - List all posts
postsRoutes.get(
  '/',
  describeRoute({
    tags: ['Posts'],
    summary: '取得文章列表',
    description: '取得所有文章列表，支援分頁、狀態過濾、標籤過濾、分類過濾、精選文章過濾',
    responses: {
      200: { description: '成功取得文章列表' },
    },
  }),
  async (c) => {
    const { page, limit } = parsePagination(
      c.req.query('page'),
      c.req.query('limit')
    );
    const status = c.req.query('status') || 'published';
    const tag = c.req.query('tag');
    const category = c.req.query('category');
    const featured = c.req.query('featured') === 'true' ? true : undefined;

    const service = initService(c);
    const result = await service.getList({
      page,
      limit,
      status,
      tag,
      category,
      featured,
    });

    return c.json({
      success: true,
      ...result,
    });
  }
);

// GET /posts/me - Get current user's posts (all statuses)
postsRoutes.get(
  '/me',
  describeRoute({
    tags: ['Posts'],
    summary: '取得當前用戶的文章列表',
    description: '取得當前登入用戶的所有文章，包含所有狀態（草稿、已發布等）',
    responses: {
      200: { description: '成功取得用戶文章列表' },
      401: { description: '未認證' },
    },
  }),
  authMiddleware,
  async (c) => {
    const userId = c.get('userId');
    const { page, limit } = parsePagination(
      c.req.query('page'),
      c.req.query('limit')
    );
    const status = c.req.query('status');

    const service = initService(c);
    const result = await service.getMyPosts(userId, { page, limit, status });

    return c.json({
      success: true,
      ...result,
    });
  }
);

// GET /posts/featured - Get featured posts
postsRoutes.get(
  '/featured',
  describeRoute({
    tags: ['Posts'],
    summary: '取得精選文章',
    description: '取得精選文章列表，可指定回傳數量',
    responses: {
      200: { description: '成功取得精選文章列表' },
    },
  }),
  async (c) => {
    const limit = parseInt(c.req.query('limit') || '6', 10);

    const service = initService(c);
    const posts = await service.getFeatured(limit);

    return c.json({
      success: true,
      data: posts,
    });
  }
);

// GET /posts/tags - Get all tags
postsRoutes.get(
  '/tags',
  describeRoute({
    tags: ['Posts'],
    summary: '取得所有標籤',
    description: '取得文章的所有標籤列表',
    responses: {
      200: { description: '成功取得標籤列表' },
    },
  }),
  async (c) => {
    const service = initService(c);
    const tags = await service.getAllTags();

    return c.json({
      success: true,
      data: tags,
    });
  }
);

// GET /posts/popular - Get popular posts
postsRoutes.get(
  '/popular',
  describeRoute({
    tags: ['Posts'],
    summary: '取得熱門文章',
    description: '取得熱門文章列表，依瀏覽數排序',
    responses: {
      200: { description: '成功取得熱門文章列表' },
    },
  }),
  async (c) => {
    const limit = parseInt(c.req.query('limit') || '5', 10);

    const service = initService(c);
    const posts = await service.getPopular(limit);

    return c.json({
      success: true,
      data: posts,
    });
  }
);

// GET /posts/liked - Get current user's liked/bookmarked posts
postsRoutes.get(
  '/liked',
  describeRoute({
    tags: ['Posts'],
    summary: '取得用戶按讚的文章',
    description: '取得當前登入用戶按讚/收藏的文章列表',
    responses: {
      200: { description: '成功取得按讚文章列表' },
      401: { description: '未認證' },
    },
  }),
  authMiddleware,
  async (c) => {
    const userId = c.get('userId');
    const { page, limit } = parsePagination(
      c.req.query('page'),
      c.req.query('limit')
    );

    const service = initService(c);
    const result = await service.getLikedPosts(userId, { page, limit });

    return c.json({
      success: true,
      ...result,
    });
  }
);

// GET /posts/:id - Get post by ID
postsRoutes.get(
  '/:id',
  describeRoute({
    tags: ['Posts'],
    summary: '取得單一文章',
    description: '依 ID 取得文章詳細內容',
    responses: {
      200: { description: '成功取得文章' },
      404: { description: '文章不存在' },
    },
  }),
  async (c) => {
    const id = c.req.param('id');

    const service = initService(c);
    const post = await service.getById(id, c.req.raw);

    if (!post) {
      return c.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Post not found',
        },
        404
      );
    }

    return c.json({
      success: true,
      data: post,
    });
  }
);

// GET /posts/slug/:slug - Get post by slug
postsRoutes.get(
  '/slug/:slug',
  describeRoute({
    tags: ['Posts'],
    summary: '依 Slug 取得文章',
    description: '依 URL-friendly 的 slug 取得文章詳細內容',
    responses: {
      200: { description: '成功取得文章' },
      404: { description: '文章不存在' },
    },
  }),
  async (c) => {
    const slug = c.req.param('slug');

    const service = initService(c);
    const post = await service.getBySlug(slug, c.req.raw);

    if (!post) {
      return c.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Post not found',
        },
        404
      );
    }

    return c.json({
      success: true,
      data: post,
    });
  }
);

// POST /posts - Create new post
postsRoutes.post(
  '/',
  describeRoute({
    tags: ['Posts'],
    summary: '建立新文章',
    description: '建立新文章，需要認證。必填欄位：title、content',
    responses: {
      201: { description: '成功建立文章' },
      400: { description: '缺少必要欄位（title 或 content）' },
      401: { description: '未認證' },
    },
  }),
  authMiddleware,
  async (c) => {
    const userId = c.get('userId');
    const body = await c.req.json<
      Partial<Post> & { tags?: string[] }
    >();

    if (!body.title || !body.content) {
      return c.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'Title and content are required',
        },
        400
      );
    }

    const service = initService(c);
    const post = await service.create(userId, {
      title: body.title,
      content: body.content,
      slug: body.slug || undefined,
      excerpt: body.excerpt || undefined,
      cover_image: body.cover_image || undefined,
      category: body.category || undefined,
      status: body.status,
      is_featured: body.is_featured,
      tags: body.tags,
    });

    return c.json(
      {
        success: true,
        data: post,
      },
      201
    );
  }
);

// PUT /posts/:id - Update post
postsRoutes.put(
  '/:id',
  describeRoute({
    tags: ['Posts'],
    summary: '更新文章',
    description: '更新指定 ID 的文章，需要認證。只能編輯自己的文章（管理員除外）',
    responses: {
      200: { description: '成功更新文章' },
      401: { description: '未認證' },
      403: { description: '無權限編輯此文章' },
      404: { description: '文章不存在' },
    },
  }),
  authMiddleware,
  async (c) => {
    const id = c.req.param('id');
    const userId = c.get('userId');
    const user = c.get('user');
    const body = await c.req.json<Partial<Post> & { tags?: string[] }>();

    try {
      const service = initService(c);
      const post = await service.update(id, userId, user.role, body);

      return c.json({
        success: true,
        data: post,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';

      if (message === 'Post not found') {
        return c.json(
          {
            success: false,
            error: 'Not Found',
            message,
          },
          404
        );
      }

      if (message === 'You can only edit your own posts') {
        return c.json(
          {
            success: false,
            error: 'Forbidden',
            message,
          },
          403
        );
      }

      throw error;
    }
  }
);

// DELETE /posts/:id - Delete post
postsRoutes.delete(
  '/:id',
  describeRoute({
    tags: ['Posts'],
    summary: '刪除文章',
    description: '刪除指定 ID 的文章，需要認證。只能刪除自己的文章（管理員除外）',
    responses: {
      200: { description: '成功刪除文章' },
      401: { description: '未認證' },
      403: { description: '無權限刪除此文章' },
      404: { description: '文章不存在' },
    },
  }),
  authMiddleware,
  async (c) => {
    const id = c.req.param('id');
    const userId = c.get('userId');
    const user = c.get('user');

    try {
      const service = initService(c);
      await service.delete(id, userId, user.role, c.env.STORAGE);

      return c.json({
        success: true,
        message: 'Post deleted successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';

      if (message === 'Post not found') {
        return c.json(
          {
            success: false,
            error: 'Not Found',
            message,
          },
          404
        );
      }

      if (message === 'You can only delete your own posts') {
        return c.json(
          {
            success: false,
            error: 'Forbidden',
            message,
          },
          403
        );
      }

      throw error;
    }
  }
);

// ============================================
// Comments Routes
// ============================================

// GET /posts/:id/comments - Get comments for a post
postsRoutes.get(
  '/:id/comments',
  describeRoute({
    tags: ['Posts'],
    summary: '取得文章留言',
    description: '取得指定文章的所有留言，支援分頁',
    responses: {
      200: { description: '成功取得留言列表' },
    },
  }),
  async (c) => {
    const postId = c.req.param('id');
    const { page, limit, offset } = parsePagination(
      c.req.query('page'),
      c.req.query('limit')
    );

    const countResult = await c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM comments WHERE entity_type = 'post' AND entity_id = ?`
    )
      .bind(postId)
      .first<{ count: number }>();
    const total = countResult?.count || 0;

    const comments = await c.env.DB.prepare(
      `SELECT c.*, u.username, u.display_name, u.avatar_url
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.entity_type = 'post' AND c.entity_id = ?
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`
    )
      .bind(postId, limit, offset)
      .all();

    return c.json({
      success: true,
      data: comments.results,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  }
);

// POST /posts/:id/comments - Create a comment for a post
postsRoutes.post(
  '/:id/comments',
  describeRoute({
    tags: ['Posts'],
    summary: '新增留言',
    description: '對指定文章新增留言，需要認證。會發送通知給文章作者',
    responses: {
      201: { description: '成功新增留言' },
      400: { description: '留言內容為空' },
      401: { description: '未認證' },
      404: { description: '文章不存在' },
    },
  }),
  authMiddleware,
  async (c) => {
    const postId = c.req.param('id');
    const userId = c.get('userId');
    const user = c.get('user');
    const body = await c.req.json<{ content: string; parent_id?: string }>();

    if (!body.content || body.content.trim() === '') {
      return c.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'Comment content is required',
        },
        400
      );
    }

    // Check if post exists and get author info
    const post = await c.env.DB.prepare('SELECT id, author_id, title FROM posts WHERE id = ?')
      .bind(postId)
      .first<{ id: string; author_id: string; title: string }>();

    if (!post) {
      return c.json(
        {
          success: false,
          error: 'Not Found',
          message: 'Post not found',
        },
        404
      );
    }

    const id = generateId();

    await c.env.DB.prepare(
      `INSERT INTO comments (id, user_id, entity_type, entity_id, parent_id, content)
       VALUES (?, ?, 'post', ?, ?, ?)`
    )
      .bind(id, userId, postId, body.parent_id || null, body.content.trim())
      .run();

    // Get the created comment with user info
    const comment = await c.env.DB.prepare(
      `SELECT c.*, u.username, u.display_name, u.avatar_url
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`
    )
      .bind(id)
      .first();

    // 發送通知給貼文作者（不是自己的貼文）
    if (post.author_id !== userId) {
      const contentPreview = body.content.trim().slice(0, 50) + (body.content.length > 50 ? '...' : '');
      await createNotification(c.env.DB, {
        userId: post.author_id,
        type: 'post_commented',
        actorId: userId,
        targetId: postId,
        title: '你的文章有新留言',
        message: `${user?.display_name || user?.username || '有人'} 在你的文章「${post.title}」留言：${contentPreview}`,
      });
    }

    return c.json(
      {
        success: true,
        data: comment,
      },
      201
    );
  }
);

// DELETE /posts/:postId/comments/:commentId - Delete a comment
postsRoutes.delete(
  '/:postId/comments/:commentId',
  describeRoute({
    tags: ['Posts'],
    summary: '刪除留言',
    description: '刪除指定的留言，需要認證。只能刪除自己的留言（管理員除外）',
    responses: {
      200: { description: '成功刪除留言' },
      401: { description: '未認證' },
      403: { description: '無權限刪除此留言' },
      404: { description: '留言不存在' },
    },
  }),
  authMiddleware,
  async (c) => {
    const postId = c.req.param('postId');
    const commentId = c.req.param('commentId');
    const userId = c.get('userId');
    const user = c.get('user');

    // Check if comment exists and belongs to this post
    const comment = await c.env.DB.prepare(
      `SELECT id, user_id FROM comments
       WHERE id = ? AND entity_type = 'post' AND entity_id = ?`
    )
      .bind(commentId, postId)
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

    // Check if user is the comment author or admin
    if (comment.user_id !== userId && user.role !== 'admin') {
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
      message: 'Comment deleted successfully',
    });
  }
);

// ============================================
// 按讚/收藏共用輔助函數
// ============================================

type ActionTable = 'likes' | 'bookmarks';

/**
 * 切換按讚/收藏狀態的共用邏輯
 */
async function toggleAction(
  db: D1Database,
  table: ActionTable,
  entityType: string,
  entityId: string,
  userId: string
): Promise<{ toggled: boolean; count: number }> {
  const existing = await db
    .prepare(`SELECT id FROM ${table} WHERE user_id = ? AND entity_type = ? AND entity_id = ?`)
    .bind(userId, entityType, entityId)
    .first();

  let toggled: boolean;

  if (existing) {
    await db
      .prepare(`DELETE FROM ${table} WHERE user_id = ? AND entity_type = ? AND entity_id = ?`)
      .bind(userId, entityType, entityId)
      .run();
    toggled = false;
  } else {
    const id = generateId();
    await db
      .prepare(`INSERT INTO ${table} (id, user_id, entity_type, entity_id) VALUES (?, ?, ?, ?)`)
      .bind(id, userId, entityType, entityId)
      .run();
    toggled = true;
  }

  const countResult = await db
    .prepare(`SELECT COUNT(*) as count FROM ${table} WHERE entity_type = ? AND entity_id = ?`)
    .bind(entityType, entityId)
    .first<{ count: number }>();

  return { toggled, count: countResult?.count || 0 };
}

/**
 * 獲取按讚/收藏狀態的共用邏輯
 */
async function getActionStatus(
  db: D1Database,
  table: ActionTable,
  entityType: string,
  entityId: string,
  userId: string | null
): Promise<{ hasAction: boolean; count: number }> {
  const countResult = await db
    .prepare(`SELECT COUNT(*) as count FROM ${table} WHERE entity_type = ? AND entity_id = ?`)
    .bind(entityType, entityId)
    .first<{ count: number }>();

  let hasAction = false;
  if (userId) {
    const existing = await db
      .prepare(`SELECT id FROM ${table} WHERE user_id = ? AND entity_type = ? AND entity_id = ?`)
      .bind(userId, entityType, entityId)
      .first();
    hasAction = !!existing;
  }

  return { hasAction, count: countResult?.count || 0 };
}

// ============================================
// Likes & Bookmarks Routes
// ============================================

// POST /posts/:id/like - Toggle like for a post (按讚)
postsRoutes.post(
  '/:id/like',
  describeRoute({
    tags: ['Posts'],
    summary: '切換文章按讚狀態',
    description: '對指定文章按讚或取消按讚，需要認證。按讚時會發送通知給文章作者',
    responses: {
      200: { description: '成功切換按讚狀態' },
      401: { description: '未認證' },
      404: { description: '文章不存在' },
    },
  }),
  authMiddleware,
  async (c) => {
    const postId = c.req.param('id');
    const userId = c.get('userId');
    const user = c.get('user');

    const post = await c.env.DB.prepare('SELECT id, author_id, title FROM posts WHERE id = ?')
      .bind(postId)
      .first<{ id: string; author_id: string; title: string }>();

    if (!post) {
      return c.json({ success: false, error: 'Not Found', message: 'Post not found' }, 404);
    }

    const { toggled, count } = await toggleAction(c.env.DB, 'likes', 'post', postId, userId);

    // 發送通知給貼文作者（按讚時且不是自己的貼文）
    if (toggled && post.author_id !== userId) {
      await createLikeNotificationWithAggregation(c.env.DB, {
        userId: post.author_id,
        type: 'post_liked',
        actorId: userId,
        actorName: user?.display_name || user?.username || '有人',
        targetId: postId,
        targetTitle: post.title,
      });
    }

    return c.json({
      success: true,
      data: { liked: toggled, likes: count },
    });
  }
);

// GET /posts/:id/like - Check if user has liked a post (按讚狀態)
postsRoutes.get(
  '/:id/like',
  describeRoute({
    tags: ['Posts'],
    summary: '取得文章按讚狀態',
    description: '取得指定文章的按讚狀態和按讚數',
    responses: {
      200: { description: '成功取得按讚狀態' },
    },
  }),
  optionalAuthMiddleware,
  async (c) => {
    const postId = c.req.param('id');
    const userId = c.get('userId');

    const { hasAction, count } = await getActionStatus(c.env.DB, 'likes', 'post', postId, userId);

    return c.json({
      success: true,
      data: { liked: hasAction, likes: count },
    });
  }
);

// POST /posts/:id/bookmark - Toggle bookmark for a post (收藏)
postsRoutes.post(
  '/:id/bookmark',
  describeRoute({
    tags: ['Posts'],
    summary: '切換文章收藏狀態',
    description: '對指定文章收藏或取消收藏，需要認證',
    responses: {
      200: { description: '成功切換收藏狀態' },
      401: { description: '未認證' },
      404: { description: '文章不存在' },
    },
  }),
  authMiddleware,
  async (c) => {
    const postId = c.req.param('id');
    const userId = c.get('userId');

    const post = await c.env.DB.prepare('SELECT id FROM posts WHERE id = ?')
      .bind(postId)
      .first();

    if (!post) {
      return c.json({ success: false, error: 'Not Found', message: 'Post not found' }, 404);
    }

    const { toggled, count } = await toggleAction(c.env.DB, 'bookmarks', 'post', postId, userId);

    return c.json({
      success: true,
      data: { bookmarked: toggled, bookmarks: count },
    });
  }
);

// GET /posts/:id/bookmark - Check if user has bookmarked a post (收藏狀態)
postsRoutes.get(
  '/:id/bookmark',
  describeRoute({
    tags: ['Posts'],
    summary: '取得文章收藏狀態',
    description: '取得指定文章的收藏狀態和收藏數',
    responses: {
      200: { description: '成功取得收藏狀態' },
    },
  }),
  optionalAuthMiddleware,
  async (c) => {
    const postId = c.req.param('id');
    const userId = c.get('userId');

    const { hasAction, count } = await getActionStatus(c.env.DB, 'bookmarks', 'post', postId, userId);

    return c.json({
      success: true,
      data: { bookmarked: hasAction, bookmarks: count },
    });
  }
);
