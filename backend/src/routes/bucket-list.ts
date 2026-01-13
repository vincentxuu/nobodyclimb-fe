import { Hono } from 'hono';
import { Env } from '../types';
import { generateId } from '../utils/id';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';

export const bucketListRoutes = new Hono<{ Bindings: Env }>();

// ═══════════════════════════════════════════════════════════
// 人生清單項目 CRUD
// ═══════════════════════════════════════════════════════════

// GET /bucket-list/:biographyId - Get all bucket list items for a biography
bucketListRoutes.get('/:biographyId', async (c) => {
  const biographyId = c.req.param('biographyId');
  const status = c.req.query('status'); // active, completed, archived
  const category = c.req.query('category');

  let whereClause = 'biography_id = ? AND is_public = 1';
  const params: (string | number)[] = [biographyId];

  if (status) {
    whereClause += ' AND status = ?';
    params.push(status);
  }

  if (category) {
    whereClause += ' AND category = ?';
    params.push(category);
  }

  const items = await c.env.DB.prepare(
    `SELECT * FROM bucket_list_items
     WHERE ${whereClause}
     ORDER BY sort_order ASC, created_at DESC`
  )
    .bind(...params)
    .all();

  return c.json({
    success: true,
    data: items.results,
  });
});

// POST /bucket-list - Create a new bucket list item
bucketListRoutes.post('/', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();

  // Get user's biography
  const biography = await c.env.DB.prepare(
    'SELECT id FROM biographies WHERE user_id = ?'
  )
    .bind(userId)
    .first<{ id: string }>();

  if (!biography) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'You need to create a biography first',
      },
      404
    );
  }

  if (!body.title) {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'Title is required',
      },
      400
    );
  }

  const id = generateId();

  await c.env.DB.prepare(
    `INSERT INTO bucket_list_items (
      id, biography_id, title, category, description,
      target_grade, target_location, target_date,
      status, enable_progress, progress_mode, progress, milestones,
      is_public, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      biography.id,
      body.title,
      body.category || 'other',
      body.description || null,
      body.target_grade || null,
      body.target_location || null,
      body.target_date || null,
      body.status || 'active',
      body.enable_progress ? 1 : 0,
      body.progress_mode || null,
      body.progress || 0,
      body.milestones ? JSON.stringify(body.milestones) : null,
      body.is_public !== false ? 1 : 0,
      body.sort_order || 0
    )
    .run();

  const item = await c.env.DB.prepare(
    'SELECT * FROM bucket_list_items WHERE id = ?'
  )
    .bind(id)
    .first();

  return c.json(
    {
      success: true,
      data: item,
    },
    201
  );
});

// PUT /bucket-list/:id - Update a bucket list item
bucketListRoutes.put('/:id', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const body = await c.req.json();

  // Verify ownership
  const item = await c.env.DB.prepare(
    `SELECT bli.id FROM bucket_list_items bli
     JOIN biographies b ON bli.biography_id = b.id
     WHERE bli.id = ? AND b.user_id = ?`
  )
    .bind(id, userId)
    .first<{ id: string }>();

  if (!item) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Bucket list item not found or not authorized',
      },
      404
    );
  }

  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  const fields = [
    'title', 'category', 'description', 'target_grade',
    'target_location', 'target_date', 'status',
    'enable_progress', 'progress_mode', 'progress',
    'is_public', 'sort_order',
  ];

  for (const field of fields) {
    if (body[field] !== undefined) {
      if (field === 'enable_progress' || field === 'is_public') {
        updates.push(`${field} = ?`);
        values.push(body[field] ? 1 : 0);
      } else {
        updates.push(`${field} = ?`);
        values.push(body[field]);
      }
    }
  }

  // Handle milestones (JSON)
  if (body.milestones !== undefined) {
    updates.push('milestones = ?');
    values.push(body.milestones ? JSON.stringify(body.milestones) : null);
  }

  if (updates.length > 0) {
    updates.push("updated_at = datetime('now')");
    values.push(id);

    await c.env.DB.prepare(
      `UPDATE bucket_list_items SET ${updates.join(', ')} WHERE id = ?`
    )
      .bind(...values)
      .run();
  }

  const updated = await c.env.DB.prepare(
    'SELECT * FROM bucket_list_items WHERE id = ?'
  )
    .bind(id)
    .first();

  return c.json({
    success: true,
    data: updated,
  });
});

// DELETE /bucket-list/:id - Delete a bucket list item
bucketListRoutes.delete('/:id', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  // Verify ownership
  const item = await c.env.DB.prepare(
    `SELECT bli.id FROM bucket_list_items bli
     JOIN biographies b ON bli.biography_id = b.id
     WHERE bli.id = ? AND b.user_id = ?`
  )
    .bind(id, userId)
    .first<{ id: string }>();

  if (!item) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Bucket list item not found or not authorized',
      },
      404
    );
  }

  await c.env.DB.prepare('DELETE FROM bucket_list_items WHERE id = ?')
    .bind(id)
    .run();

  return c.json({
    success: true,
    message: 'Bucket list item deleted successfully',
  });
});

// ═══════════════════════════════════════════════════════════
// 完成目標
// ═══════════════════════════════════════════════════════════

// PUT /bucket-list/:id/complete - Mark a bucket list item as completed
bucketListRoutes.put('/:id/complete', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const body = await c.req.json();

  // Verify ownership
  const item = await c.env.DB.prepare(
    `SELECT bli.id, bli.biography_id FROM bucket_list_items bli
     JOIN biographies b ON bli.biography_id = b.id
     WHERE bli.id = ? AND b.user_id = ?`
  )
    .bind(id, userId)
    .first<{ id: string; biography_id: string }>();

  if (!item) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Bucket list item not found or not authorized',
      },
      404
    );
  }

  const completionMedia = body.completion_media
    ? JSON.stringify(body.completion_media)
    : null;

  await c.env.DB.prepare(
    `UPDATE bucket_list_items SET
      status = 'completed',
      completed_at = datetime('now'),
      progress = 100,
      completion_story = ?,
      psychological_insights = ?,
      technical_insights = ?,
      completion_media = ?,
      updated_at = datetime('now')
    WHERE id = ?`
  )
    .bind(
      body.completion_story || null,
      body.psychological_insights || null,
      body.technical_insights || null,
      completionMedia,
      id
    )
    .run();

  const updated = await c.env.DB.prepare(
    'SELECT * FROM bucket_list_items WHERE id = ?'
  )
    .bind(id)
    .first();

  return c.json({
    success: true,
    data: updated,
  });
});

// PUT /bucket-list/:id/progress - Update progress
bucketListRoutes.put('/:id/progress', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const body = await c.req.json();

  // Verify ownership
  const item = await c.env.DB.prepare(
    `SELECT bli.id FROM bucket_list_items bli
     JOIN biographies b ON bli.biography_id = b.id
     WHERE bli.id = ? AND b.user_id = ?`
  )
    .bind(id, userId)
    .first<{ id: string }>();

  if (!item) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Bucket list item not found or not authorized',
      },
      404
    );
  }

  const progress = Math.max(0, Math.min(100, body.progress || 0));

  await c.env.DB.prepare(
    `UPDATE bucket_list_items SET
      progress = ?,
      updated_at = datetime('now')
    WHERE id = ?`
  )
    .bind(progress, id)
    .run();

  return c.json({
    success: true,
    message: 'Progress updated',
    data: { progress },
  });
});

// PUT /bucket-list/:id/milestone - Update milestone
bucketListRoutes.put('/:id/milestone', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const body = await c.req.json();

  // Verify ownership and get current milestones
  const item = await c.env.DB.prepare(
    `SELECT bli.id, bli.milestones FROM bucket_list_items bli
     JOIN biographies b ON bli.biography_id = b.id
     WHERE bli.id = ? AND b.user_id = ?`
  )
    .bind(id, userId)
    .first<{ id: string; milestones: string | null }>();

  if (!item) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Bucket list item not found or not authorized',
      },
      404
    );
  }

  const milestones = item.milestones ? JSON.parse(item.milestones) : [];
  const milestoneId = body.milestone_id;
  const completed = body.completed;
  const note = body.note;

  // Update the specific milestone
  const updatedMilestones = milestones.map((m: { id: string; completed: boolean; completed_at: string | null; note: string | null }) => {
    if (m.id === milestoneId) {
      return {
        ...m,
        completed: completed !== undefined ? completed : m.completed,
        completed_at: completed ? new Date().toISOString() : m.completed_at,
        note: note !== undefined ? note : m.note,
      };
    }
    return m;
  });

  // Calculate overall progress from milestones
  const completedMilestones = updatedMilestones.filter((m: { completed: boolean }) => m.completed).length;
  const progress = Math.round((completedMilestones / updatedMilestones.length) * 100);

  await c.env.DB.prepare(
    `UPDATE bucket_list_items SET
      milestones = ?,
      progress = ?,
      updated_at = datetime('now')
    WHERE id = ?`
  )
    .bind(JSON.stringify(updatedMilestones), progress, id)
    .run();

  return c.json({
    success: true,
    data: {
      milestones: updatedMilestones,
      progress,
    },
  });
});

// ═══════════════════════════════════════════════════════════
// 探索功能
// ═══════════════════════════════════════════════════════════

// GET /bucket-list/explore/trending - Get trending bucket list items
bucketListRoutes.get('/explore/trending', async (c) => {
  const limit = parseInt(c.req.query('limit') || '10', 10);

  const items = await c.env.DB.prepare(
    `SELECT bli.*, b.name as author_name, b.avatar_url as author_avatar, b.slug as author_slug
     FROM bucket_list_items bli
     JOIN biographies b ON bli.biography_id = b.id
     WHERE bli.is_public = 1 AND b.is_public = 1
     ORDER BY (bli.likes_count + bli.inspired_count * 2) DESC, bli.created_at DESC
     LIMIT ?`
  )
    .bind(limit)
    .all();

  return c.json({
    success: true,
    data: items.results,
  });
});

// GET /bucket-list/explore/recent-completed - Get recently completed items
bucketListRoutes.get('/explore/recent-completed', async (c) => {
  const limit = parseInt(c.req.query('limit') || '10', 10);

  const items = await c.env.DB.prepare(
    `SELECT bli.*, b.name as author_name, b.avatar_url as author_avatar, b.slug as author_slug
     FROM bucket_list_items bli
     JOIN biographies b ON bli.biography_id = b.id
     WHERE bli.status = 'completed' AND bli.is_public = 1 AND b.is_public = 1
     ORDER BY bli.completed_at DESC
     LIMIT ?`
  )
    .bind(limit)
    .all();

  return c.json({
    success: true,
    data: items.results,
  });
});

// GET /bucket-list/explore/by-category/:category - Get items by category
bucketListRoutes.get('/explore/by-category/:category', async (c) => {
  const category = c.req.param('category');
  const limit = parseInt(c.req.query('limit') || '20', 10);

  const items = await c.env.DB.prepare(
    `SELECT bli.*, b.name as author_name, b.avatar_url as author_avatar, b.slug as author_slug
     FROM bucket_list_items bli
     JOIN biographies b ON bli.biography_id = b.id
     WHERE bli.category = ? AND bli.is_public = 1 AND b.is_public = 1
     ORDER BY bli.likes_count DESC, bli.created_at DESC
     LIMIT ?`
  )
    .bind(category, limit)
    .all();

  return c.json({
    success: true,
    data: items.results,
  });
});

// GET /bucket-list/explore/by-location/:location - Get items by location
bucketListRoutes.get('/explore/by-location/:location', async (c) => {
  const location = c.req.param('location');
  const limit = parseInt(c.req.query('limit') || '20', 10);

  const items = await c.env.DB.prepare(
    `SELECT bli.*, b.name as author_name, b.avatar_url as author_avatar, b.slug as author_slug
     FROM bucket_list_items bli
     JOIN biographies b ON bli.biography_id = b.id
     WHERE bli.target_location LIKE ? AND bli.is_public = 1 AND b.is_public = 1
     ORDER BY bli.likes_count DESC, bli.created_at DESC
     LIMIT ?`
  )
    .bind(`%${location}%`, limit)
    .all();

  return c.json({
    success: true,
    data: items.results,
  });
});

// ═══════════════════════════════════════════════════════════
// 互動功能
// ═══════════════════════════════════════════════════════════

// POST /bucket-list/:id/like - Like a bucket list item
bucketListRoutes.post('/:id/like', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  // Check if item exists and is public
  const item = await c.env.DB.prepare(
    'SELECT id FROM bucket_list_items WHERE id = ? AND is_public = 1'
  )
    .bind(id)
    .first<{ id: string }>();

  if (!item) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Bucket list item not found',
      },
      404
    );
  }

  // Check if already liked
  const existing = await c.env.DB.prepare(
    'SELECT id FROM bucket_list_likes WHERE bucket_list_item_id = ? AND user_id = ?'
  )
    .bind(id, userId)
    .first<{ id: string }>();

  if (existing) {
    return c.json(
      {
        success: false,
        error: 'Conflict',
        message: 'Already liked',
      },
      409
    );
  }

  const likeId = generateId();

  await c.env.DB.prepare(
    'INSERT INTO bucket_list_likes (id, bucket_list_item_id, user_id) VALUES (?, ?, ?)'
  )
    .bind(likeId, id, userId)
    .run();

  // Update likes count
  await c.env.DB.prepare(
    'UPDATE bucket_list_items SET likes_count = likes_count + 1 WHERE id = ?'
  )
    .bind(id)
    .run();

  return c.json({
    success: true,
    message: 'Liked successfully',
  });
});

// DELETE /bucket-list/:id/like - Unlike a bucket list item
bucketListRoutes.delete('/:id/like', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  const existing = await c.env.DB.prepare(
    'SELECT id FROM bucket_list_likes WHERE bucket_list_item_id = ? AND user_id = ?'
  )
    .bind(id, userId)
    .first<{ id: string }>();

  if (!existing) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Like not found',
      },
      404
    );
  }

  await c.env.DB.prepare(
    'DELETE FROM bucket_list_likes WHERE bucket_list_item_id = ? AND user_id = ?'
  )
    .bind(id, userId)
    .run();

  // Update likes count
  await c.env.DB.prepare(
    'UPDATE bucket_list_items SET likes_count = MAX(0, likes_count - 1) WHERE id = ?'
  )
    .bind(id)
    .run();

  return c.json({
    success: true,
    message: 'Unliked successfully',
  });
});

// GET /bucket-list/:id/comments - Get comments for a bucket list item
bucketListRoutes.get('/:id/comments', async (c) => {
  const id = c.req.param('id');

  const comments = await c.env.DB.prepare(
    `SELECT blc.*, u.username, u.display_name, u.avatar_url
     FROM bucket_list_comments blc
     JOIN users u ON blc.user_id = u.id
     WHERE blc.bucket_list_item_id = ?
     ORDER BY blc.created_at DESC`
  )
    .bind(id)
    .all();

  return c.json({
    success: true,
    data: comments.results,
  });
});

// POST /bucket-list/:id/comments - Add a comment to a bucket list item
bucketListRoutes.post('/:id/comments', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const body = await c.req.json();

  if (!body.content || body.content.trim().length === 0) {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'Comment content is required',
      },
      400
    );
  }

  // Check if item exists and is public
  const item = await c.env.DB.prepare(
    'SELECT id FROM bucket_list_items WHERE id = ? AND is_public = 1'
  )
    .bind(id)
    .first<{ id: string }>();

  if (!item) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Bucket list item not found',
      },
      404
    );
  }

  const commentId = generateId();

  await c.env.DB.prepare(
    'INSERT INTO bucket_list_comments (id, bucket_list_item_id, user_id, content) VALUES (?, ?, ?, ?)'
  )
    .bind(commentId, id, userId, body.content.trim())
    .run();

  // Update comments count
  await c.env.DB.prepare(
    'UPDATE bucket_list_items SET comments_count = comments_count + 1 WHERE id = ?'
  )
    .bind(id)
    .run();

  // Get the comment with user info
  const comment = await c.env.DB.prepare(
    `SELECT blc.*, u.username, u.display_name, u.avatar_url
     FROM bucket_list_comments blc
     JOIN users u ON blc.user_id = u.id
     WHERE blc.id = ?`
  )
    .bind(commentId)
    .first();

  return c.json(
    {
      success: true,
      data: comment,
    },
    201
  );
});

// DELETE /bucket-list/comments/:id - Delete a comment
bucketListRoutes.delete('/comments/:id', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  // Check ownership
  const comment = await c.env.DB.prepare(
    'SELECT id, bucket_list_item_id FROM bucket_list_comments WHERE id = ? AND user_id = ?'
  )
    .bind(id, userId)
    .first<{ id: string; bucket_list_item_id: string }>();

  if (!comment) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Comment not found or not authorized',
      },
      404
    );
  }

  await c.env.DB.prepare('DELETE FROM bucket_list_comments WHERE id = ?')
    .bind(id)
    .run();

  // Update comments count
  await c.env.DB.prepare(
    'UPDATE bucket_list_items SET comments_count = MAX(0, comments_count - 1) WHERE id = ?'
  )
    .bind(comment.bucket_list_item_id)
    .run();

  return c.json({
    success: true,
    message: 'Comment deleted successfully',
  });
});

// POST /bucket-list/:id/reference - Add item to my list (reference)
bucketListRoutes.post('/:id/reference', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');

  // Get user's biography
  const biography = await c.env.DB.prepare(
    'SELECT id FROM biographies WHERE user_id = ?'
  )
    .bind(userId)
    .first<{ id: string }>();

  if (!biography) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'You need to create a biography first',
      },
      404
    );
  }

  // Get source item
  const sourceItem = await c.env.DB.prepare(
    `SELECT bli.*, b.id as source_biography_id FROM bucket_list_items bli
     JOIN biographies b ON bli.biography_id = b.id
     WHERE bli.id = ? AND bli.is_public = 1`
  )
    .bind(id)
    .first<{ id: string; title: string; category: string; description: string; target_grade: string; target_location: string; source_biography_id: string }>();

  if (!sourceItem) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: 'Bucket list item not found',
      },
      404
    );
  }

  // Check if already referenced
  const existingRef = await c.env.DB.prepare(
    'SELECT id FROM bucket_list_references WHERE source_item_id = ? AND target_biography_id = ?'
  )
    .bind(id, biography.id)
    .first<{ id: string }>();

  if (existingRef) {
    return c.json(
      {
        success: false,
        error: 'Conflict',
        message: 'Already referenced',
      },
      409
    );
  }

  // Create reference record
  const refId = generateId();
  await c.env.DB.prepare(
    'INSERT INTO bucket_list_references (id, source_item_id, target_biography_id) VALUES (?, ?, ?)'
  )
    .bind(refId, id, biography.id)
    .run();

  // Create new bucket list item for the user
  const newItemId = generateId();
  await c.env.DB.prepare(
    `INSERT INTO bucket_list_items (
      id, biography_id, title, category, description,
      target_grade, target_location, status, is_public
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 1)`
  )
    .bind(
      newItemId,
      biography.id,
      sourceItem.title,
      sourceItem.category,
      sourceItem.description,
      sourceItem.target_grade,
      sourceItem.target_location
    )
    .run();

  // Update inspired count on source item
  await c.env.DB.prepare(
    'UPDATE bucket_list_items SET inspired_count = inspired_count + 1 WHERE id = ?'
  )
    .bind(id)
    .run();

  const newItem = await c.env.DB.prepare(
    'SELECT * FROM bucket_list_items WHERE id = ?'
  )
    .bind(newItemId)
    .first();

  return c.json(
    {
      success: true,
      data: newItem,
      message: 'Added to your bucket list',
    },
    201
  );
});

// GET /bucket-list/:id/references - Get who referenced this item
bucketListRoutes.get('/:id/references', async (c) => {
  const id = c.req.param('id');

  const references = await c.env.DB.prepare(
    `SELECT blr.*, b.name as referencer_name, b.avatar_url as referencer_avatar, b.slug as referencer_slug
     FROM bucket_list_references blr
     JOIN biographies b ON blr.target_biography_id = b.id
     WHERE blr.source_item_id = ? AND b.is_public = 1
     ORDER BY blr.created_at DESC`
  )
    .bind(id)
    .all();

  return c.json({
    success: true,
    data: references.results,
  });
});
