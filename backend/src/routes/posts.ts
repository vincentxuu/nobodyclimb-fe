import { Hono } from 'hono';
import { Env, Post } from '../types';
import { parsePagination, generateId, generateSlug } from '../utils/id';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';

export const postsRoutes = new Hono<{ Bindings: Env }>();

// GET /posts - List all posts
postsRoutes.get('/', async (c) => {
  const { page, limit, offset } = parsePagination(
    c.req.query('page'),
    c.req.query('limit')
  );
  const status = c.req.query('status') || 'published';
  const tag = c.req.query('tag');
  const featured = c.req.query('featured');

  let whereClause = 'status = ?';
  const params: (string | number)[] = [status];

  if (featured === 'true') {
    whereClause += ' AND is_featured = 1';
  }

  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM posts WHERE ${whereClause}`
  )
    .bind(...params)
    .first<{ count: number }>();
  const total = countResult?.count || 0;

  let query = `
    SELECT p.*, u.username, u.display_name, u.avatar_url as author_avatar
    FROM posts p
    JOIN users u ON p.author_id = u.id
    WHERE ${whereClause}
  `;

  if (tag) {
    query = `
      SELECT p.*, u.username, u.display_name, u.avatar_url as author_avatar
      FROM posts p
      JOIN users u ON p.author_id = u.id
      JOIN post_tags pt ON p.id = pt.post_id
      WHERE ${whereClause} AND pt.tag = ?
    `;
    params.push(tag);
  }

  query += ' ORDER BY p.is_featured DESC, p.published_at DESC LIMIT ? OFFSET ?';

  const posts = await c.env.DB.prepare(query)
    .bind(...params, limit, offset)
    .all();

  return c.json({
    success: true,
    data: posts.results,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  });
});

// GET /posts/me - Get current user's posts (all statuses)
postsRoutes.get('/me', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const { page, limit, offset } = parsePagination(
    c.req.query('page'),
    c.req.query('limit')
  );
  const status = c.req.query('status'); // Optional: filter by specific status

  let whereClause = 'p.author_id = ?';
  const params: (string | number)[] = [userId];

  if (status && ['draft', 'published', 'archived'].includes(status)) {
    whereClause += ' AND p.status = ?';
    params.push(status);
  }

  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM posts p WHERE ${whereClause}`
  )
    .bind(...params)
    .first<{ count: number }>();
  const total = countResult?.count || 0;

  const posts = await c.env.DB.prepare(
    `SELECT p.*, u.username, u.display_name, u.avatar_url as author_avatar
     FROM posts p
     JOIN users u ON p.author_id = u.id
     WHERE ${whereClause}
     ORDER BY p.created_at DESC
     LIMIT ? OFFSET ?`
  )
    .bind(...params, limit, offset)
    .all();

  // Get tags for all posts in one query to avoid N+1 problem
  const postIds = posts.results.map((p) => p.id as string);
  const tagsMap = new Map<string, string[]>();
  if (postIds.length > 0) {
    const placeholders = postIds.map(() => '?').join(',');
    const tagsResult = await c.env.DB.prepare(
      `SELECT post_id, tag FROM post_tags WHERE post_id IN (${placeholders})`
    )
      .bind(...postIds)
      .all<{ post_id: string; tag: string }>();

    for (const { post_id, tag } of tagsResult.results ?? []) {
      if (!tagsMap.has(post_id)) {
        tagsMap.set(post_id, []);
      }
      tagsMap.get(post_id)!.push(tag);
    }
  }
  const postsWithTags = posts.results.map((post) => ({
    ...post,
    tags: tagsMap.get(post.id as string) || [],
  }));

  return c.json({
    success: true,
    data: postsWithTags,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  });
});

// GET /posts/featured - Get featured posts
postsRoutes.get('/featured', async (c) => {
  const limit = parseInt(c.req.query('limit') || '6', 10);

  const posts = await c.env.DB.prepare(
    `SELECT p.*, u.username, u.display_name, u.avatar_url as author_avatar
     FROM posts p
     JOIN users u ON p.author_id = u.id
     WHERE p.status = 'published' AND p.is_featured = 1
     ORDER BY p.published_at DESC
     LIMIT ?`
  )
    .bind(limit)
    .all();

  return c.json({
    success: true,
    data: posts.results,
  });
});

// GET /posts/tags - Get all tags
postsRoutes.get('/tags', async (c) => {
  const tags = await c.env.DB.prepare(
    `SELECT tag, COUNT(*) as count
     FROM post_tags pt
     JOIN posts p ON pt.post_id = p.id
     WHERE p.status = 'published'
     GROUP BY tag
     ORDER BY count DESC`
  ).all();

  return c.json({
    success: true,
    data: tags.results,
  });
});

// GET /posts/popular - Get popular posts
postsRoutes.get('/popular', async (c) => {
  const limit = parseInt(c.req.query('limit') || '5', 10);

  const posts = await c.env.DB.prepare(
    `SELECT p.*, u.username, u.display_name, u.avatar_url as author_avatar
     FROM posts p
     JOIN users u ON p.author_id = u.id
     WHERE p.status = 'published'
     ORDER BY p.view_count DESC
     LIMIT ?`
  )
    .bind(limit)
    .all();

  // Get tags for all posts
  const postIds = posts.results.map((p) => p.id as string);
  const tagsMap = new Map<string, string[]>();
  if (postIds.length > 0) {
    const placeholders = postIds.map(() => '?').join(',');
    const tagsResult = await c.env.DB.prepare(
      `SELECT post_id, tag FROM post_tags WHERE post_id IN (${placeholders})`
    )
      .bind(...postIds)
      .all<{ post_id: string; tag: string }>();

    for (const { post_id, tag } of tagsResult.results ?? []) {
      if (!tagsMap.has(post_id)) {
        tagsMap.set(post_id, []);
      }
      tagsMap.get(post_id)!.push(tag);
    }
  }

  const postsWithTags = posts.results.map((post) => ({
    ...post,
    tags: tagsMap.get(post.id as string) || [],
  }));

  return c.json({
    success: true,
    data: postsWithTags,
  });
});

// GET /posts/liked - Get current user's liked/bookmarked posts
postsRoutes.get('/liked', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const { page, limit, offset } = parsePagination(
    c.req.query('page'),
    c.req.query('limit')
  );

  // Get total count of liked posts
  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as count
     FROM likes l
     JOIN posts p ON l.entity_id = p.id
     WHERE l.user_id = ? AND l.entity_type = 'post' AND p.status = 'published'`
  )
    .bind(userId)
    .first<{ count: number }>();
  const total = countResult?.count || 0;

  // Get liked posts with pagination
  const posts = await c.env.DB.prepare(
    `SELECT p.*, u.username, u.display_name, u.avatar_url as author_avatar, l.created_at as liked_at
     FROM likes l
     JOIN posts p ON l.entity_id = p.id
     JOIN users u ON p.author_id = u.id
     WHERE l.user_id = ? AND l.entity_type = 'post' AND p.status = 'published'
     ORDER BY l.created_at DESC
     LIMIT ? OFFSET ?`
  )
    .bind(userId, limit, offset)
    .all();

  // Get tags for all posts in one query to avoid N+1 problem
  const postIds = posts.results.map((p) => p.id as string);
  const tagsMap = new Map<string, string[]>();
  if (postIds.length > 0) {
    const placeholders = postIds.map(() => '?').join(',');
    const tagsResult = await c.env.DB.prepare(
      `SELECT post_id, tag FROM post_tags WHERE post_id IN (${placeholders})`
    )
      .bind(...postIds)
      .all<{ post_id: string; tag: string }>();

    for (const { post_id, tag } of tagsResult.results ?? []) {
      if (!tagsMap.has(post_id)) {
        tagsMap.set(post_id, []);
      }
      tagsMap.get(post_id)!.push(tag);
    }
  }

  const postsWithTags = posts.results.map((post) => ({
    ...post,
    tags: tagsMap.get(post.id as string) || [],
  }));

  return c.json({
    success: true,
    data: postsWithTags,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  });
});

// GET /posts/:id - Get post by ID
postsRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');

  const post = await c.env.DB.prepare(
    `SELECT p.*, u.username, u.display_name, u.avatar_url as author_avatar
     FROM posts p
     JOIN users u ON p.author_id = u.id
     WHERE p.id = ?`
  )
    .bind(id)
    .first();

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

  // Get tags
  const tags = await c.env.DB.prepare(
    'SELECT tag FROM post_tags WHERE post_id = ?'
  )
    .bind(id)
    .all<{ tag: string }>();

  // Increment view count
  await c.env.DB.prepare(
    'UPDATE posts SET view_count = view_count + 1 WHERE id = ?'
  )
    .bind(id)
    .run();

  return c.json({
    success: true,
    data: {
      ...post,
      tags: tags.results.map((t) => t.tag),
    },
  });
});

// GET /posts/slug/:slug - Get post by slug
postsRoutes.get('/slug/:slug', async (c) => {
  const slug = c.req.param('slug');

  const post = await c.env.DB.prepare(
    `SELECT p.*, u.username, u.display_name, u.avatar_url as author_avatar
     FROM posts p
     JOIN users u ON p.author_id = u.id
     WHERE p.slug = ?`
  )
    .bind(slug)
    .first();

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

  const tags = await c.env.DB.prepare(
    'SELECT tag FROM post_tags WHERE post_id = ?'
  )
    .bind(post.id as string)
    .all<{ tag: string }>();

  await c.env.DB.prepare(
    'UPDATE posts SET view_count = view_count + 1 WHERE id = ?'
  )
    .bind(post.id as string)
    .run();

  return c.json({
    success: true,
    data: {
      ...post,
      tags: tags.results.map((t) => t.tag),
    },
  });
});

// POST /posts - Create new post
postsRoutes.post('/', authMiddleware, async (c) => {
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

  const id = generateId();
  const slug = body.slug || generateSlug(body.title);

  await c.env.DB.prepare(
    `INSERT INTO posts (
      id, author_id, title, slug, excerpt, content, cover_image, status, is_featured, published_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      userId,
      body.title,
      slug,
      body.excerpt || null,
      body.content,
      body.cover_image || null,
      body.status || 'draft',
      body.is_featured || 0,
      body.status === 'published' ? new Date().toISOString() : null
    )
    .run();

  // Add tags
  if (body.tags && body.tags.length > 0) {
    for (const tag of body.tags) {
      await c.env.DB.prepare(
        'INSERT INTO post_tags (post_id, tag) VALUES (?, ?)'
      )
        .bind(id, tag)
        .run();
    }
  }

  const post = await c.env.DB.prepare('SELECT * FROM posts WHERE id = ?')
    .bind(id)
    .first();

  return c.json(
    {
      success: true,
      data: {
        ...post,
        tags: body.tags || [],
      },
    },
    201
  );
});

// PUT /posts/:id - Update post
postsRoutes.put('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');
  const user = c.get('user');
  const body = await c.req.json<Partial<Post> & { tags?: string[] }>();

  const existing = await c.env.DB.prepare(
    'SELECT author_id FROM posts WHERE id = ?'
  )
    .bind(id)
    .first<{ author_id: string }>();

  if (!existing) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Post not found',
      },
      404
    );
  }

  // Check if user is author or admin
  if (existing.author_id !== userId && user.role !== 'admin') {
    return c.json(
      {
        success: false,
        error: 'Forbidden',
        message: 'You can only edit your own posts',
      },
      403
    );
  }

  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  const fields = [
    'title',
    'excerpt',
    'content',
    'cover_image',
    'status',
    'is_featured',
  ];

  for (const field of fields) {
    if (body[field as keyof Post] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(body[field as keyof Post] as string | number | null);
    }
  }

  // Handle published_at when publishing
  if (body.status === 'published') {
    const currentPost = await c.env.DB.prepare(
      'SELECT published_at FROM posts WHERE id = ?'
    )
      .bind(id)
      .first<{ published_at: string | null }>();

    if (!currentPost?.published_at) {
      updates.push('published_at = ?');
      values.push(new Date().toISOString());
    }
  }

  if (updates.length > 0) {
    updates.push("updated_at = datetime('now')");
    values.push(id);

    await c.env.DB.prepare(
      `UPDATE posts SET ${updates.join(', ')} WHERE id = ?`
    )
      .bind(...values)
      .run();
  }

  // Update tags
  if (body.tags !== undefined) {
    await c.env.DB.prepare('DELETE FROM post_tags WHERE post_id = ?')
      .bind(id)
      .run();

    for (const tag of body.tags) {
      await c.env.DB.prepare(
        'INSERT INTO post_tags (post_id, tag) VALUES (?, ?)'
      )
        .bind(id, tag)
        .run();
    }
  }

  const post = await c.env.DB.prepare('SELECT * FROM posts WHERE id = ?')
    .bind(id)
    .first();

  const tags = await c.env.DB.prepare(
    'SELECT tag FROM post_tags WHERE post_id = ?'
  )
    .bind(id)
    .all<{ tag: string }>();

  return c.json({
    success: true,
    data: {
      ...post,
      tags: tags.results.map((t) => t.tag),
    },
  });
});

// DELETE /posts/:id - Delete post
postsRoutes.delete('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');
  const user = c.get('user');

  const existing = await c.env.DB.prepare(
    'SELECT author_id FROM posts WHERE id = ?'
  )
    .bind(id)
    .first<{ author_id: string }>();

  if (!existing) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Post not found',
      },
      404
    );
  }

  if (existing.author_id !== userId && user.role !== 'admin') {
    return c.json(
      {
        success: false,
        error: 'Forbidden',
        message: 'You can only delete your own posts',
      },
      403
    );
  }

  await c.env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(id).run();

  return c.json({
    success: true,
    message: 'Post deleted successfully',
  });
});

// GET /posts/:id/comments - Get comments for a post
postsRoutes.get('/:id/comments', async (c) => {
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
});

// POST /posts/:id/comments - Create a comment for a post
postsRoutes.post('/:id/comments', authMiddleware, async (c) => {
  const postId = c.req.param('id');
  const userId = c.get('userId');
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

  // Check if post exists
  const post = await c.env.DB.prepare('SELECT id FROM posts WHERE id = ?')
    .bind(postId)
    .first();

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

  return c.json(
    {
      success: true,
      data: comment,
    },
    201
  );
});

// POST /posts/:id/like - Toggle like/favorite for a post
postsRoutes.post('/:id/like', authMiddleware, async (c) => {
  const postId = c.req.param('id');
  const userId = c.get('userId');

  // Check if post exists
  const post = await c.env.DB.prepare('SELECT id FROM posts WHERE id = ?')
    .bind(postId)
    .first();

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

  // Check if already liked
  const existingLike = await c.env.DB.prepare(
    `SELECT id FROM likes WHERE user_id = ? AND entity_type = 'post' AND entity_id = ?`
  )
    .bind(userId, postId)
    .first();

  let liked: boolean;

  if (existingLike) {
    // Unlike - remove the like
    await c.env.DB.prepare(
      `DELETE FROM likes WHERE user_id = ? AND entity_type = 'post' AND entity_id = ?`
    )
      .bind(userId, postId)
      .run();
    liked = false;
  } else {
    // Like - add a new like
    const id = generateId();
    await c.env.DB.prepare(
      `INSERT INTO likes (id, user_id, entity_type, entity_id) VALUES (?, ?, 'post', ?)`
    )
      .bind(id, userId, postId)
      .run();
    liked = true;
  }

  // Get total like count for this post
  const likeCount = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM likes WHERE entity_type = 'post' AND entity_id = ?`
  )
    .bind(postId)
    .first<{ count: number }>();

  return c.json({
    success: true,
    data: {
      liked,
      likes: likeCount?.count || 0,
    },
  });
});

// GET /posts/:id/like - Check if user has liked a post
postsRoutes.get('/:id/like', optionalAuthMiddleware, async (c) => {
  const postId = c.req.param('id');
  const userId = c.get('userId');

  // Get total like count
  const likeCount = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM likes WHERE entity_type = 'post' AND entity_id = ?`
  )
    .bind(postId)
    .first<{ count: number }>();

  let liked = false;

  if (userId) {
    // Check if user has liked
    const existingLike = await c.env.DB.prepare(
      `SELECT id FROM likes WHERE user_id = ? AND entity_type = 'post' AND entity_id = ?`
    )
      .bind(userId, postId)
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
