import { D1Database } from '@cloudflare/workers-types';
import { Post } from '../types';

/**
 * Post 列表項目（用於列表顯示）
 */
export interface PostListItem extends Post {
  username: string;
  display_name: string | null;
  author_avatar: string | null;
}

/**
 * Post 查詢選項
 */
export interface PostQueryOptions {
  page?: number;
  limit?: number;
  status?: string;
  tag?: string;
  category?: string;
  featured?: boolean;
  authorId?: string;
}

/**
 * Post Repository - 資料存取層
 *
 * 職責：
 * - 執行資料庫查詢
 * - 處理資料庫結果轉換
 * - 不包含業務邏輯
 */
export class PostRepository {
  constructor(private db: D1Database) {}

  /**
   * 查詢 posts 列表（分頁）
   */
  async findMany(options: PostQueryOptions): Promise<PostListItem[]> {
    const {
      page = 1,
      limit = 20,
      status = 'published',
      tag,
      category,
      featured,
    } = options;

    const offset = (page - 1) * limit;
    const params: (string | number)[] = [status];

    let whereClause = 'p.status = ?';

    if (featured !== undefined) {
      whereClause += ' AND p.is_featured = ?';
      params.push(featured ? 1 : 0);
    }

    if (category) {
      whereClause += ' AND p.category = ?';
      params.push(category);
    }

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
    params.push(limit, offset);

    const result = await this.db.prepare(query)
      .bind(...params)
      .all<PostListItem>();

    return result.results || [];
  }

  /**
   * 計算符合條件的 posts 總數
   */
  async count(options: PostQueryOptions): Promise<number> {
    const {
      status = 'published',
      tag,
      category,
      featured,
      authorId,
    } = options;

    const params: (string | number)[] = [];
    let whereClause = '';

    if (authorId) {
      whereClause = 'p.author_id = ?';
      params.push(authorId);

      if (status) {
        whereClause += ' AND p.status = ?';
        params.push(status);
      }
    } else {
      whereClause = 'p.status = ?';
      params.push(status);

      if (featured !== undefined) {
        whereClause += ' AND p.is_featured = ?';
        params.push(featured ? 1 : 0);
      }

      if (category) {
        whereClause += ' AND p.category = ?';
        params.push(category);
      }
    }

    let query = `SELECT COUNT(*) as count FROM posts p WHERE ${whereClause}`;

    if (tag) {
      query = `
        SELECT COUNT(DISTINCT p.id) as count
        FROM posts p
        JOIN post_tags pt ON p.id = pt.post_id
        WHERE ${whereClause} AND pt.tag = ?
      `;
      params.push(tag);
    }

    const result = await this.db.prepare(query)
      .bind(...params)
      .first<{ count: number }>();

    return result?.count || 0;
  }

  /**
   * 根據 ID 查詢單筆 post
   */
  async findById(id: string): Promise<PostListItem | null> {
    const query = `
      SELECT p.*, u.username, u.display_name, u.avatar_url as author_avatar
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.id = ?
    `;

    const result = await this.db.prepare(query)
      .bind(id)
      .first<PostListItem>();

    return result || null;
  }

  /**
   * 根據 slug 查詢單筆 post
   */
  async findBySlug(slug: string): Promise<PostListItem | null> {
    const query = `
      SELECT p.*, u.username, u.display_name, u.avatar_url as author_avatar
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.slug = ?
    `;

    const result = await this.db.prepare(query)
      .bind(slug)
      .first<PostListItem>();

    return result || null;
  }

  /**
   * 查詢當前用戶的 posts
   */
  async findMyPosts(
    userId: string,
    options: { page?: number; limit?: number; status?: string }
  ): Promise<PostListItem[]> {
    const { page = 1, limit = 20, status } = options;
    const offset = (page - 1) * limit;

    let whereClause = 'p.author_id = ?';
    const params: (string | number)[] = [userId];

    if (status && ['draft', 'published', 'archived'].includes(status)) {
      whereClause += ' AND p.status = ?';
      params.push(status);
    }

    const query = `
      SELECT p.*, u.username, u.display_name, u.avatar_url as author_avatar
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const result = await this.db.prepare(query)
      .bind(...params, limit, offset)
      .all<PostListItem>();

    return result.results || [];
  }

  /**
   * 查詢 featured posts
   */
  async findFeatured(limit: number = 6): Promise<PostListItem[]> {
    const query = `
      SELECT p.*, u.username, u.display_name, u.avatar_url as author_avatar
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.status = 'published' AND p.is_featured = 1
      ORDER BY p.published_at DESC
      LIMIT ?
    `;

    const result = await this.db.prepare(query)
      .bind(limit)
      .all<PostListItem>();

    return result.results || [];
  }

  /**
   * 查詢熱門 posts（按觀看數排序）
   */
  async findPopular(limit: number = 5): Promise<PostListItem[]> {
    const query = `
      SELECT p.*, u.username, u.display_name, u.avatar_url as author_avatar
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.status = 'published'
      ORDER BY p.view_count DESC
      LIMIT ?
    `;

    const result = await this.db.prepare(query)
      .bind(limit)
      .all<PostListItem>();

    return result.results || [];
  }

  /**
   * 查詢用戶按讚的 posts
   */
  async findLiked(
    userId: string,
    options: { page?: number; limit?: number }
  ): Promise<PostListItem[]> {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const query = `
      SELECT p.*, u.username, u.display_name, u.avatar_url as author_avatar, l.created_at as liked_at
      FROM likes l
      JOIN posts p ON l.entity_id = p.id
      JOIN users u ON p.author_id = u.id
      WHERE l.user_id = ? AND l.entity_type = 'post' AND p.status = 'published'
      ORDER BY l.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const result = await this.db.prepare(query)
      .bind(userId, limit, offset)
      .all<PostListItem>();

    return result.results || [];
  }

  /**
   * 計算用戶按讚的 posts 總數
   */
  async countLiked(userId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM likes l
      JOIN posts p ON l.entity_id = p.id
      WHERE l.user_id = ? AND l.entity_type = 'post' AND p.status = 'published'
    `;

    const result = await this.db.prepare(query)
      .bind(userId)
      .first<{ count: number }>();

    return result?.count || 0;
  }

  /**
   * 創建新 post
   */
  async create(data: {
    id: string;
    author_id: string;
    title: string;
    slug: string;
    excerpt?: string | null;
    content: string;
    cover_image?: string | null;
    category?: string | null;
    status?: string;
    is_featured?: number;
  }): Promise<Post> {
    const publishedAt = data.status === 'published' ? new Date().toISOString() : null;

    await this.db.prepare(
      `INSERT INTO posts (
        id, author_id, title, slug, excerpt, content, cover_image, category, status, is_featured, published_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        data.id,
        data.author_id,
        data.title,
        data.slug,
        data.excerpt || null,
        data.content,
        data.cover_image || null,
        data.category || null,
        data.status || 'draft',
        data.is_featured || 0,
        publishedAt
      )
      .run();

    const result = await this.db.prepare('SELECT * FROM posts WHERE id = ?')
      .bind(data.id)
      .first<Post>();

    if (!result) {
      throw new Error('Failed to create post');
    }

    return result;
  }

  /**
   * 更新 post
   */
  async update(id: string, data: Partial<Post>): Promise<Post> {
    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    const updatableFields = [
      'title',
      'excerpt',
      'content',
      'cover_image',
      'category',
      'status',
      'is_featured',
    ];

    for (const field of updatableFields) {
      if (data[field as keyof Post] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(data[field as keyof Post] as string | number | null);
      }
    }

    // 處理 published_at（當第一次發布時設定）
    if (data.status === 'published') {
      const current = await this.db.prepare(
        'SELECT published_at FROM posts WHERE id = ?'
      )
        .bind(id)
        .first<{ published_at: string | null }>();

      if (current && !current.published_at) {
        updates.push('published_at = ?');
        values.push(new Date().toISOString());
      }
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    updates.push("updated_at = datetime('now')");
    values.push(id);

    await this.db.prepare(
      `UPDATE posts SET ${updates.join(', ')} WHERE id = ?`
    )
      .bind(...values)
      .run();

    const result = await this.db.prepare('SELECT * FROM posts WHERE id = ?')
      .bind(id)
      .first<Post>();

    if (!result) {
      throw new Error('Failed to update post');
    }

    return result;
  }

  /**
   * 刪除 post
   */
  async delete(id: string): Promise<void> {
    await this.db.prepare('DELETE FROM posts WHERE id = ?')
      .bind(id)
      .run();
  }

  /**
   * 獲取 post 的 tags
   */
  async getTags(postId: string): Promise<string[]> {
    const result = await this.db.prepare(
      'SELECT tag FROM post_tags WHERE post_id = ?'
    )
      .bind(postId)
      .all<{ tag: string }>();

    return result.results?.map((t) => t.tag) || [];
  }

  /**
   * 批次獲取多個 posts 的 tags
   */
  async batchGetTags(postIds: string[]): Promise<Map<string, string[]>> {
    if (postIds.length === 0) {
      return new Map();
    }

    const placeholders = postIds.map(() => '?').join(',');
    const result = await this.db.prepare(
      `SELECT post_id, tag FROM post_tags WHERE post_id IN (${placeholders})`
    )
      .bind(...postIds)
      .all<{ post_id: string; tag: string }>();

    const tagsMap = new Map<string, string[]>();
    for (const { post_id, tag } of result.results ?? []) {
      if (!tagsMap.has(post_id)) {
        tagsMap.set(post_id, []);
      }
      tagsMap.get(post_id)!.push(tag);
    }

    return tagsMap;
  }

  /**
   * 同步 post 的 tags
   */
  async syncTags(postId: string, tags: string[]): Promise<void> {
    // 刪除現有 tags
    await this.db.prepare('DELETE FROM post_tags WHERE post_id = ?')
      .bind(postId)
      .run();

    // 插入新 tags
    for (const tag of tags) {
      await this.db.prepare(
        'INSERT INTO post_tags (post_id, tag) VALUES (?, ?)'
      )
        .bind(postId, tag)
        .run();
    }
  }

  /**
   * 獲取所有 tags（帶計數）
   */
  async getAllTags(): Promise<Array<{ tag: string; count: number }>> {
    const result = await this.db.prepare(
      `SELECT tag, COUNT(*) as count
       FROM post_tags pt
       JOIN posts p ON pt.post_id = p.id
       WHERE p.status = 'published'
       GROUP BY tag
       ORDER BY count DESC`
    ).all<{ tag: string; count: number }>();

    return result.results || [];
  }

  /**
   * 更新 view_count
   */
  async updateViewCount(id: string, viewCount: number): Promise<void> {
    await this.db.prepare('UPDATE posts SET view_count = ? WHERE id = ?')
      .bind(viewCount, id)
      .run();
  }
}
