import { Hono } from 'hono';
import { z } from 'zod';
import { describeRoute, validator } from 'hono-openapi';
import { Env, User } from '../types';
import { generateId } from '../utils/id';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

export const usersRoutes = new Hono<{ Bindings: Env }>();

// ═══════════════════════════════════════════════════════════════════════════════
// Validation Schemas
// ═══════════════════════════════════════════════════════════════════════════════

const adminListQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  role: z.enum(['user', 'admin', 'moderator']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

const updateStatusSchema = z.object({
  is_active: z.boolean(),
});

const updateRoleSchema = z.object({
  role: z.enum(['user', 'admin', 'moderator']),
});

// ═══════════════════════════════════════════════════════════════════════════════
// Admin 用戶管理 API
// ═══════════════════════════════════════════════════════════════════════════════

// GET /users/admin/list - 獲取用戶列表 (Admin only)
usersRoutes.get(
  '/admin/list',
  describeRoute({
    tags: ['Users'],
    summary: '獲取用戶列表',
    description: '獲取所有用戶的分頁列表，支援搜尋、角色篩選和狀態篩選。僅限管理員使用。',
    responses: {
      200: { description: '成功取得用戶列表' },
      401: { description: '未授權，需要登入' },
      403: { description: '權限不足，需要管理員權限' },
    },
  }),
  authMiddleware,
  adminMiddleware,
  validator('query', adminListQuerySchema),
  async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
  const search = c.req.query('search') || '';
  const role = c.req.query('role') || '';
  const status = c.req.query('status') || '';
  const offset = (page - 1) * limit;

  let whereClause = '1=1';
  const params: (string | number)[] = [];

  // 搜索條件
  if (search) {
    whereClause += ' AND (username LIKE ? OR email LIKE ? OR display_name LIKE ?)';
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  // 角色篩選
  if (role && ['user', 'admin', 'moderator'].includes(role)) {
    whereClause += ' AND role = ?';
    params.push(role);
  }

  // 狀態篩選
  if (status === 'active') {
    whereClause += ' AND is_active = 1';
  } else if (status === 'inactive') {
    whereClause += ' AND is_active = 0';
  }

  // 獲取總數
  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as total FROM users WHERE ${whereClause}`
  )
    .bind(...params)
    .first<{ total: number }>();

  const total = countResult?.total || 0;

  // 獲取用戶列表
  const users = await c.env.DB.prepare(
    `SELECT
      id, email, username, display_name, avatar_url, bio,
      role, is_active, email_verified, auth_provider,
      created_at, updated_at
    FROM users
    WHERE ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?`
  )
    .bind(...params, limit, offset)
    .all<Omit<User, 'password_hash' | 'google_id'>>();

  return c.json({
    success: true,
    data: users.results || [],
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  });
});

// GET /users/admin/stats - 獲取用戶統計 (Admin only)
usersRoutes.get(
  '/admin/stats',
  describeRoute({
    tags: ['Users'],
    summary: '獲取用戶統計',
    description: '獲取用戶相關統計數據，包括總數、活躍用戶數、各角色統計、本週/本月新增用戶數、認證方式統計等。僅限管理員使用。',
    responses: {
      200: { description: '成功取得用戶統計數據' },
      401: { description: '未授權，需要登入' },
      403: { description: '權限不足，需要管理員權限' },
    },
  }),
  authMiddleware,
  adminMiddleware,
  async (c) => {
  // 總用戶數
  const totalResult = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM users'
  ).first<{ count: number }>();

  // 活躍用戶數
  const activeResult = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM users WHERE is_active = 1'
  ).first<{ count: number }>();

  // 各角色統計
  const roleStats = await c.env.DB.prepare(
    `SELECT role, COUNT(*) as count FROM users GROUP BY role`
  ).all<{ role: string; count: number }>();

  // 本週新增用戶
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const newUsersResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM users WHERE created_at >= ?`
  )
    .bind(weekAgo.toISOString())
    .first<{ count: number }>();

  // 本月新增用戶
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const monthlyUsersResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM users WHERE created_at >= ?`
  )
    .bind(monthAgo.toISOString())
    .first<{ count: number }>();

  // 認證方式統計
  const authProviderStats = await c.env.DB.prepare(
    `SELECT auth_provider, COUNT(*) as count FROM users GROUP BY auth_provider`
  ).all<{ auth_provider: string; count: number }>();

  return c.json({
    success: true,
    data: {
      total: totalResult?.count || 0,
      active: activeResult?.count || 0,
      inactive: (totalResult?.count || 0) - (activeResult?.count || 0),
      newThisWeek: newUsersResult?.count || 0,
      newThisMonth: monthlyUsersResult?.count || 0,
      byRole: roleStats.results || [],
      byAuthProvider: authProviderStats.results || [],
    },
  });
});

// PUT /users/admin/:id/status - 更新用戶狀態 (Admin only)
usersRoutes.put(
  '/admin/:id/status',
  describeRoute({
    tags: ['Users'],
    summary: '更新用戶狀態',
    description: '啟用或停用指定用戶帳號。不能停用自己或其他管理員的帳號。僅限管理員使用。',
    responses: {
      200: { description: '成功更新用戶狀態' },
      400: { description: '請求無效，例如嘗試停用自己的帳號' },
      401: { description: '未授權，需要登入' },
      403: { description: '權限不足，需要管理員權限，或嘗試停用其他管理員' },
      404: { description: '用戶不存在' },
    },
  }),
  authMiddleware,
  adminMiddleware,
  validator('json', updateStatusSchema),
  async (c) => {
  const targetUserId = c.req.param('id');
  const currentUserId = c.get('userId');
  const { is_active } = c.req.valid('json');

  // 不能停用自己
  if (targetUserId === currentUserId) {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: '不能停用自己的帳號',
      },
      400
    );
  }

  // 檢查目標用戶是否存在
  const targetUser = await c.env.DB.prepare(
    'SELECT id, role FROM users WHERE id = ?'
  )
    .bind(targetUserId)
    .first<{ id: string; role: string }>();

  if (!targetUser) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: '用戶不存在',
      },
      404
    );
  }

  // 不能停用其他 admin
  if (targetUser.role === 'admin') {
    return c.json(
      {
        success: false,
        error: 'Forbidden',
        message: '不能停用其他管理員帳號',
      },
      403
    );
  }

  // 更新狀態
  await c.env.DB.prepare(
    "UPDATE users SET is_active = ?, updated_at = datetime('now') WHERE id = ?"
  )
    .bind(is_active ? 1 : 0, targetUserId)
    .run();

  return c.json({
    success: true,
    data: {
      id: targetUserId,
      is_active: is_active ? 1 : 0,
    },
    message: is_active ? '用戶已啟用' : '用戶已停用',
  });
});

// PUT /users/admin/:id/role - 更新用戶角色 (Admin only)
usersRoutes.put(
  '/admin/:id/role',
  describeRoute({
    tags: ['Users'],
    summary: '更新用戶角色',
    description: '更新指定用戶的角色（user、admin、moderator）。不能更改自己的角色。僅限管理員使用。',
    responses: {
      200: { description: '成功更新用戶角色' },
      400: { description: '請求無效，例如無效的角色或嘗試更改自己的角色' },
      401: { description: '未授權，需要登入' },
      403: { description: '權限不足，需要管理員權限' },
      404: { description: '用戶不存在' },
    },
  }),
  authMiddleware,
  adminMiddleware,
  validator('json', updateRoleSchema),
  async (c) => {
  const targetUserId = c.req.param('id');
  const currentUserId = c.get('userId');
  const { role } = c.req.valid('json');

  // 不能更改自己的角色
  if (targetUserId === currentUserId) {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: '不能更改自己的角色',
      },
      400
    );
  }

  // 檢查目標用戶是否存在
  const targetUser = await c.env.DB.prepare(
    'SELECT id, role FROM users WHERE id = ?'
  )
    .bind(targetUserId)
    .first<{ id: string; role: string }>();

  if (!targetUser) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: '用戶不存在',
      },
      404
    );
  }

  // 更新角色
  await c.env.DB.prepare(
    "UPDATE users SET role = ?, updated_at = datetime('now') WHERE id = ?"
  )
    .bind(role, targetUserId)
    .run();

  return c.json({
    success: true,
    data: {
      id: targetUserId,
      role,
    },
    message: `用戶角色已更新為 ${role}`,
  });
});

// GET /users/admin/:id - 獲取單一用戶詳細資訊 (Admin only)
usersRoutes.get(
  '/admin/:id',
  describeRoute({
    tags: ['Users'],
    summary: '獲取單一用戶詳細資訊',
    description: '獲取指定用戶的詳細資訊，包括基本資料、人物誌資訊和內容統計。僅限管理員使用。',
    responses: {
      200: { description: '成功取得用戶詳細資訊' },
      401: { description: '未授權，需要登入' },
      403: { description: '權限不足，需要管理員權限' },
      404: { description: '用戶不存在' },
    },
  }),
  authMiddleware,
  adminMiddleware,
  async (c) => {
  const userId = c.req.param('id');

  const user = await c.env.DB.prepare(
    `SELECT
      id, email, username, display_name, avatar_url, bio,
      role, is_active, email_verified, auth_provider,
      created_at, updated_at
    FROM users WHERE id = ?`
  )
    .bind(userId)
    .first<Omit<User, 'password_hash' | 'google_id'>>();

  if (!user) {
    return c.json(
      {
        success: false,
        error: 'Not Found',
        message: '用戶不存在',
      },
      404
    );
  }

  // 獲取用戶的人物誌資訊
  const biography = await c.env.DB.prepare(
    `SELECT id, name, slug, total_views, total_likes, follower_count
     FROM biographies WHERE user_id = ?`
  )
    .bind(userId)
    .first<{
      id: string;
      name: string;
      slug: string;
      total_views: number;
      total_likes: number;
      follower_count: number;
    }>();

  // 獲取用戶的內容統計
  const postCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM posts WHERE author_id = ?'
  )
    .bind(userId)
    .first<{ count: number }>();

  const photoCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM gallery_photos WHERE author_id = ?'
  )
    .bind(userId)
    .first<{ count: number }>();

  return c.json({
    success: true,
    data: {
      ...user,
      biography: biography || null,
      stats: {
        posts: postCount?.count || 0,
        photos: photoCount?.count || 0,
      },
    },
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 一般用戶 API
// ═══════════════════════════════════════════════════════════════════════════════

// POST /users/upload-avatar - Upload avatar image to R2 storage
usersRoutes.post(
  '/upload-avatar',
  describeRoute({
    tags: ['Users'],
    summary: '上傳用戶頭像',
    description: '上傳用戶頭像圖片到 R2 儲存空間。支援 JPEG、PNG、WebP 格式。會自動刪除舊的頭像並更新用戶資料。',
    responses: {
      200: { description: '成功上傳頭像，回傳頭像 URL' },
      400: { description: '請求無效，例如未提供檔案或檔案類型不支援' },
      401: { description: '未授權，需要登入' },
    },
  }),
  authMiddleware,
  async (c) => {
  const userId = c.get('userId');
  const formData = await c.req.formData();
  const file = formData.get('avatar') as File | null;

  if (!file) {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'No avatar file provided',
      },
      400
    );
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return c.json(
      {
        success: false,
        error: 'Bad Request',
        message: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.',
      },
      400
    );
  }

  // Get current user to check for existing avatar
  const currentUser = await c.env.DB.prepare(
    'SELECT avatar_url FROM users WHERE id = ?'
  )
    .bind(userId)
    .first<{ avatar_url: string | null }>();

  // Delete old avatar from R2 if it exists
  if (currentUser?.avatar_url) {
    try {
      const oldKey = new URL(currentUser.avatar_url).pathname.substring(1);
      await c.env.STORAGE.delete(oldKey);
    } catch (err) {
      console.error(`Failed to delete old avatar for user ${userId}: ${err}`);
    }
  }

  // Generate unique filename
const extMap = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const ext = extMap[file.type as keyof typeof extMap];
  const filename = `avatars/${generateId()}.${ext}`;

  // Upload to R2
  const arrayBuffer = await file.arrayBuffer();
  await c.env.STORAGE.put(filename, arrayBuffer, {
    httpMetadata: {
      contentType: file.type,
      cacheControl: 'public, max-age=31536000, immutable',
    },
  });

  // Construct URL using environment variable
  const url = `${c.env.R2_PUBLIC_URL}/${filename}`;

  // Update user's avatar_url in database
  await c.env.DB.prepare(
    "UPDATE users SET avatar_url = ?, updated_at = datetime('now') WHERE id = ?"
  )
    .bind(url, userId)
    .run();

  return c.json({
    success: true,
    data: { url },
  });
});
