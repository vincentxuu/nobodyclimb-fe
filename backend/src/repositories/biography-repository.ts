import { D1Database } from '@cloudflare/workers-types';
import { Biography } from '../types';

/**
 * Biography 基本資訊（從 basic_info_data JSON 解析）
 */
export interface BiographyBasicInfo {
  climbing_start_year?: string;
  frequent_locations?: string;
  favorite_route_type?: string;
  climbing_reason?: string;
  [key: string]: any;
}

/**
 * Biography 列表項目（用於列表顯示）
 */
export interface BiographyListItem {
  id: string;
  user_id: string | null;
  slug: string;
  name: string;
  avatar_url: string | null;
  basic_info_data: string | null;
  tags_data: string | null;
  one_liners_data: string | null;
  stories_data: string | null;
  visibility: 'private' | 'public' | 'unlisted' | 'anonymous' | 'community';
}

/**
 * 查詢選項
 */
export interface BiographyQueryOptions {
  page?: number;
  limit?: number;
  visibility?: string;
  userId?: string; // 當前用戶 ID（用於權限檢查）
  isFeatured?: boolean;
  searchTerm?: string;
}

/**
 * Biography Repository - 資料存取層
 *
 * 職責：
 * - 執行資料庫查詢
 * - 處理資料庫結果轉換
 * - 不包含業務邏輯
 */
export class BiographyRepository {
  constructor(private db: D1Database) {}

  /**
   * 根據用戶身份產生 visibility WHERE 子句
   */
  private getVisibilityWhereClause(userId: string | undefined, tableAlias: string = 'b'): string {
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

  /**
   * 查詢 biographies 列表
   */
  async findMany(options: BiographyQueryOptions): Promise<BiographyListItem[]> {
    const {
      page = 1,
      limit = 20,
      userId,
      isFeatured,
      searchTerm,
    } = options;

    const offset = (page - 1) * limit;
    const visibilityClause = this.getVisibilityWhereClause(userId, 'b');

    // 建構 WHERE 條件
    const conditions = [visibilityClause];

    if (isFeatured !== undefined) {
      conditions.push(`b.is_featured = ${isFeatured ? 1 : 0}`);
    }

    if (searchTerm) {
      conditions.push(`(
        b.name LIKE '%${searchTerm}%' OR
        b.bio LIKE '%${searchTerm}%' OR
        b.slug LIKE '%${searchTerm}%'
      )`);
    }

    const whereClause = conditions.join(' AND ');

    const query = `
      SELECT
        b.id,
        b.user_id,
        b.slug,
        b.name,
        COALESCE(b.avatar_url, u.avatar_url) as avatar_url,
        b.basic_info_data,
        b.tags_data,
        b.one_liners_data,
        b.stories_data,
        b.visibility
      FROM biographies b
      LEFT JOIN users u ON b.user_id = u.id
      WHERE ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const result = await this.db.prepare(query)
      .bind(limit, offset)
      .all<BiographyListItem>();

    return result.results || [];
  }

  /**
   * 計算符合條件的 biographies 總數
   */
  async count(options: BiographyQueryOptions): Promise<number> {
    const { userId, isFeatured, searchTerm } = options;

    const visibilityClause = this.getVisibilityWhereClause(userId, 'b');

    // 建構 WHERE 條件
    const conditions = [visibilityClause];

    if (isFeatured !== undefined) {
      conditions.push(`b.is_featured = ${isFeatured ? 1 : 0}`);
    }

    if (searchTerm) {
      conditions.push(`(
        b.name LIKE '%${searchTerm}%' OR
        b.bio LIKE '%${searchTerm}%' OR
        b.slug LIKE '%${searchTerm}%'
      )`);
    }

    const whereClause = conditions.join(' AND ');

    const query = `
      SELECT COUNT(*) as count
      FROM biographies b
      WHERE ${whereClause}
    `;

    const result = await this.db.prepare(query).first<{ count: number }>();
    return result?.count || 0;
  }

  /**
   * 根據 ID 查詢單筆 biography
   */
  async findById(id: string, userId?: string): Promise<Biography | null> {
    const visibilityClause = this.getVisibilityWhereClause(userId, 'b');

    const query = `
      SELECT
        b.*,
        COALESCE(b.avatar_url, u.avatar_url) as avatar_url,
        u.username,
        u.display_name
      FROM biographies b
      LEFT JOIN users u ON b.user_id = u.id
      WHERE b.id = ? AND ${visibilityClause}
    `;

    const result = await this.db.prepare(query)
      .bind(id)
      .first<Biography>();

    return result || null;
  }

  /**
   * 根據 slug 查詢單筆 biography
   */
  async findBySlug(slug: string, userId?: string): Promise<Biography | null> {
    const visibilityClause = this.getVisibilityWhereClause(userId, 'b');

    const query = `
      SELECT
        b.*,
        COALESCE(b.avatar_url, u.avatar_url) as avatar_url,
        u.username,
        u.display_name
      FROM biographies b
      LEFT JOIN users u ON b.user_id = u.id
      WHERE b.slug = ? AND ${visibilityClause}
    `;

    const result = await this.db.prepare(query)
      .bind(slug)
      .first<Biography>();

    return result || null;
  }

  /**
   * 查詢 featured biographies (首頁顯示)
   */
  async findFeatured(limit: number = 6): Promise<BiographyListItem[]> {
    const query = `
      SELECT
        b.id,
        b.user_id,
        b.slug,
        b.name,
        COALESCE(b.avatar_url, u.avatar_url) as avatar_url,
        b.basic_info_data,
        b.tags_data,
        b.one_liners_data,
        b.stories_data,
        b.visibility
      FROM biographies b
      LEFT JOIN users u ON b.user_id = u.id
      WHERE b.visibility = 'public'
        AND b.is_featured = 1
      ORDER BY b.published_at DESC
      LIMIT ?
    `;

    const result = await this.db.prepare(query)
      .bind(limit)
      .all<BiographyListItem>();

    return result.results || [];
  }

  /**
   * 根據用戶 ID 查詢 biography
   */
  async findByUserId(userId: string): Promise<Biography | null> {
    const query = `
      SELECT
        b.*,
        COALESCE(b.avatar_url, u.avatar_url) as avatar_url,
        u.username,
        u.display_name
      FROM biographies b
      LEFT JOIN users u ON b.user_id = u.id
      WHERE b.user_id = ?
    `;

    const result = await this.db.prepare(query)
      .bind(userId)
      .first<Biography>();

    return result || null;
  }

  /**
   * 創建新的 biography
   */
  async create(data: Partial<Biography> & { id: string; user_id: string; name: string; slug: string }): Promise<Biography> {
    const now = new Date().toISOString();
    const isPublic = data.visibility === 'public';

    const fields = [
      'id', 'user_id', 'name', 'slug', 'title', 'bio', 'avatar_url', 'cover_image',
      'achievements', 'social_links', 'is_featured', 'visibility',
      'tags_data', 'basic_info_data', 'youtube_channel_id', 'featured_video_id',
      'published_at', 'created_at', 'updated_at'
    ];

    const values = [
      data.id,
      data.user_id,
      data.name,
      data.slug,
      data.title ?? null,
      data.bio ?? null,
      data.avatar_url ?? null,
      data.cover_image ?? null,
      data.achievements ?? null,
      data.social_links ?? null,
      data.is_featured ?? 0,
      data.visibility ?? 'private',
      data.tags_data ?? null,
      data.basic_info_data ?? null,
      data.youtube_channel_id ?? null,
      data.featured_video_id ?? null,
      isPublic ? now : null,
      now,
      now,
    ];

    const placeholders = fields.map(() => '?').join(', ');

    await this.db.prepare(
      `INSERT INTO biographies (${fields.join(', ')}) VALUES (${placeholders})`
    ).bind(...values).run();

    const result = await this.db.prepare('SELECT * FROM biographies WHERE id = ?')
      .bind(data.id)
      .first<Biography>();

    if (!result) {
      throw new Error('Failed to create biography');
    }

    return result;
  }

  /**
   * 更新 biography
   */
  async update(id: string, data: Partial<Biography>): Promise<Biography> {
    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    // 可更新的欄位
    const updatableFields = [
      'name', 'title', 'bio', 'avatar_url', 'cover_image',
      'achievements', 'social_links', 'is_featured', 'visibility',
      'tags_data', 'basic_info_data', 'youtube_channel_id', 'featured_video_id',
    ];

    for (const field of updatableFields) {
      if (data[field as keyof Biography] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(data[field as keyof Biography] as string | number | null);
      }
    }

    // 處理 published_at (當第一次變成 public 時設定)
    if (data.visibility === 'public') {
      const current = await this.db.prepare(
        'SELECT published_at, visibility FROM biographies WHERE id = ?'
      ).bind(id).first<{ published_at: string | null; visibility: string | null }>();

      if (current && !current.published_at && current.visibility !== 'public') {
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
      `UPDATE biographies SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run();

    const result = await this.db.prepare('SELECT * FROM biographies WHERE id = ?')
      .bind(id)
      .first<Biography>();

    if (!result) {
      throw new Error('Failed to update biography');
    }

    return result;
  }

  /**
   * 解析 basic_info_data JSON 欄位
   */
  parseBasicInfo(basicInfoData: string | null): BiographyBasicInfo {
    if (!basicInfoData) {
      return {};
    }

    try {
      return JSON.parse(basicInfoData);
    } catch (error) {
      console.error('Failed to parse basic_info_data:', error);
      return {};
    }
  }
}
