import { D1Database } from '@cloudflare/workers-types';
import {
  BiographyRepository,
  BiographyQueryOptions,
  BiographyListItem,
} from '../repositories/biography-repository';
import { BiographyContentRepository } from '../repositories/biography-content-repository';
import { Biography } from '../types';

/**
 * Biography 列表回應格式
 * 保持與前端 Biography 型別一致，返回原始 JSON 字串
 */
export interface BiographyListResponse {
  id: string;
  user_id: string | null;
  slug: string;
  name: string;
  avatar_url: string | null;
  basic_info_data: string | null;
  tags_data: string | null;
  one_liners_data: string | null;
  stories_data: string | null;
  visibility: string;
}

/**
 * 分頁回應格式
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Biography Service - 業務邏輯層
 *
 * 職責：
 * - 處理業務邏輯
 * - 資料轉換與格式化
 * - 權限檢查
 * - 資料驗證
 */
export class BiographyService {
  constructor(
    private repository: BiographyRepository,
    private contentRepository: BiographyContentRepository,
    private db: D1Database
  ) {}

  /**
   * 取得 biographies 列表（分頁）
   */
  async getList(
    options: BiographyQueryOptions
  ): Promise<PaginatedResponse<BiographyListResponse>> {
    const { page = 1, limit = 20 } = options;

    // 並行查詢資料與總數
    const [items, total] = await Promise.all([
      this.repository.findMany(options),
      this.repository.count(options),
    ]);

    // 批次獲取故事內容
    const biographyIds = items.map((item) => item.id);
    const [oneLinersMap, storiesMap] = await Promise.all([
      this.contentRepository.batchGetOneLiners(biographyIds),
      this.contentRepository.batchGetStories(biographyIds),
    ]);

    // 轉換資料格式
    const data = items.map((item) => this.formatListItem(item, oneLinersMap, storiesMap));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 取得 featured biographies
   */
  async getFeatured(limit: number = 6): Promise<BiographyListResponse[]> {
    const items = await this.repository.findFeatured(limit);

    // 批次獲取故事內容
    const biographyIds = items.map((item) => item.id);
    const [oneLinersMap, storiesMap] = await Promise.all([
      this.contentRepository.batchGetOneLiners(biographyIds),
      this.contentRepository.batchGetStories(biographyIds),
    ]);

    return items.map((item) => this.formatListItem(item, oneLinersMap, storiesMap));
  }

  /**
   * 根據 ID 或 slug 取得單筆 biography
   */
  async getById(idOrSlug: string, userId?: string): Promise<Biography | null> {
    // 判斷是 ID 還是 slug（ID 是 UUID 格式，slug 是 kebab-case）
    const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    let biography: Biography | null;

    if (isId) {
      biography = await this.repository.findById(idOrSlug, userId);
    } else {
      biography = await this.repository.findBySlug(idOrSlug, userId);
    }

    if (!biography) {
      return null;
    }

    // 處理 anonymous visibility（隱藏個人資訊）
    if (biography.visibility === 'anonymous' && biography.user_id !== userId) {
      return this.maskAnonymousBiography(biography);
    }

    return biography;
  }

  /**
   * 格式化列表項目
   * 從獨立表聚合故事內容並轉換為 JSON 字串
   */
  private formatListItem(
    item: BiographyListItem,
    oneLinersMap: Map<string, any>,
    storiesMap: Map<string, any>
  ): BiographyListResponse {
    const oneLiners = oneLinersMap.get(item.id);
    const stories = storiesMap.get(item.id);

    return {
      id: item.id,
      user_id: item.user_id,
      slug: item.slug,
      name: item.name,
      avatar_url: item.avatar_url,
      basic_info_data: item.basic_info_data,
      tags_data: item.tags_data,
      one_liners_data: oneLiners ? JSON.stringify(oneLiners) : null,
      stories_data: stories ? JSON.stringify(stories) : null,
      visibility: item.visibility,
    };
  }

  /**
   * 隱藏 anonymous biography 的個人資訊
   */
  private maskAnonymousBiography(biography: Biography): Biography {
    return {
      ...biography,
      name: '匿名岩友',
      user_id: null,
      avatar_url: null,
      // 保留其他內容（bio、stories 等）
    };
  }

  /**
   * 檢查用戶是否有權限查看此 biography
   */
  canView(biography: Biography, userId?: string): boolean {
    const { visibility, user_id } = biography;

    // 自己的 biography 一定可以看
    if (userId && user_id === userId) {
      return true;
    }

    // 根據 visibility 判斷
    switch (visibility) {
      case 'public':
      case 'anonymous':
        return true; // 所有人都可以看

      case 'community':
        return !!userId; // 需要登入

      case 'private':
        return userId === user_id; // 只有自己可以看

      default:
        return false;
    }
  }

  /**
   * 檢查用戶是否有權限編輯此 biography
   */
  canEdit(biography: Biography, userId?: string): boolean {
    if (!userId) {
      return false;
    }

    // 只有作者本人可以編輯
    return biography.user_id === userId;
  }

  /**
   * 取得當前用戶的 biography
   */
  async getMyBiography(userId: string): Promise<Biography | null> {
    return await this.repository.findByUserId(userId);
  }

  /**
   * 創建或更新 biography (POST / 邏輯)
   * 如果用戶已有 biography 則更新,否則創建新的
   */
  async createOrUpdate(
    userId: string,
    data: {
      name: string;
      [key: string]: any;
      one_liners_data?: string | Record<string, { answer?: string; visibility?: string }>;
      stories_data?: string | Record<string, Record<string, { answer?: string; visibility?: string }>>;
    }
  ): Promise<Biography> {
    // 檢查是否已存在
    const existing = await this.repository.findByUserId(userId);

    if (existing) {
      // 更新現有 biography
      const updateData: Partial<Biography> = {};

      // 可更新的欄位
      const fields = [
        'name', 'title', 'bio', 'avatar_url', 'cover_image',
        'achievements', 'social_links', 'is_featured',
        'visibility', 'tags_data', 'basic_info_data',
        'youtube_channel_id', 'featured_video_id',
      ];

      for (const field of fields) {
        if (data[field] !== undefined) {
          updateData[field as keyof Biography] = data[field];
        }
      }

      const biography = await this.repository.update(existing.id, updateData);

      // 同步 one_liners_data
      if (data.one_liners_data !== undefined) {
        const oneLinersData = typeof data.one_liners_data === 'string'
          ? JSON.parse(data.one_liners_data)
          : data.one_liners_data;

        if (oneLinersData && typeof oneLinersData === 'object') {
          await this.contentRepository.syncOneLiners(existing.id, oneLinersData);
        }
      }

      // 同步 stories_data
      if (data.stories_data !== undefined) {
        const storiesData = typeof data.stories_data === 'string'
          ? JSON.parse(data.stories_data)
          : data.stories_data;

        if (storiesData && typeof storiesData === 'object') {
          await this.contentRepository.syncStories(existing.id, storiesData);
        }
      }

      return biography;
    }

    // 創建新 biography
    // 取得用戶資訊以設定 slug
    const user = await this.getUserInfo(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const id = this.generateId();
    const biography = await this.repository.create({
      id,
      user_id: userId,
      name: data.name,
      slug: user.username,
      title: data.title,
      bio: data.bio,
      avatar_url: data.avatar_url,
      cover_image: data.cover_image,
      achievements: data.achievements,
      social_links: data.social_links,
      is_featured: data.is_featured,
      visibility: data.visibility || 'private',
      tags_data: data.tags_data,
      basic_info_data: data.basic_info_data,
      youtube_channel_id: data.youtube_channel_id,
      featured_video_id: data.featured_video_id,
    });

    // 同步 one_liners_data
    if (data.one_liners_data !== undefined) {
      const oneLinersData = typeof data.one_liners_data === 'string'
        ? JSON.parse(data.one_liners_data)
        : data.one_liners_data;

      if (oneLinersData && typeof oneLinersData === 'object') {
        await this.contentRepository.syncOneLiners(id, oneLinersData);
      }
    }

    // 同步 stories_data
    if (data.stories_data !== undefined) {
      const storiesData = typeof data.stories_data === 'string'
        ? JSON.parse(data.stories_data)
        : data.stories_data;

      if (storiesData && typeof storiesData === 'object') {
        await this.contentRepository.syncStories(id, storiesData);
      }
    }

    return biography;
  }

  /**
   * Upsert 當前用戶的 biography (PUT /me 邏輯)
   * 如果不存在則自動創建
   */
  async upsertMyBiography(
    userId: string,
    data: {
      [key: string]: any;
      one_liners_data?: string | Record<string, { answer?: string; visibility?: string }>;
      stories_data?: string | Record<string, Record<string, { answer?: string; visibility?: string }>>;
    }
  ): Promise<Biography> {
    const existing = await this.repository.findByUserId(userId);

    if (existing) {
      // 更新現有 biography
      const updateData: Partial<Biography> = {};

      const fields = [
        'name', 'title', 'bio', 'avatar_url', 'cover_image',
        'achievements', 'social_links', 'visibility',
        'tags_data', 'basic_info_data',
      ];

      for (const field of fields) {
        if (data[field] !== undefined) {
          updateData[field as keyof Biography] = data[field];
        }
      }

      // 只在有欄位要更新時才呼叫 repository.update
      // (one_liners_data 和 stories_data 會在下方單獨處理)
      let biography = existing;
      if (Object.keys(updateData).length > 0) {
        biography = await this.repository.update(existing.id, updateData);
      }

      // 同步內容
      if (data.one_liners_data !== undefined) {
        const oneLinersData = typeof data.one_liners_data === 'string'
          ? JSON.parse(data.one_liners_data)
          : data.one_liners_data;

        if (oneLinersData && typeof oneLinersData === 'object') {
          await this.contentRepository.syncOneLiners(existing.id, oneLinersData);
        }
      }

      if (data.stories_data !== undefined) {
        const storiesData = typeof data.stories_data === 'string'
          ? JSON.parse(data.stories_data)
          : data.stories_data;

        if (storiesData && typeof storiesData === 'object') {
          await this.contentRepository.syncStories(existing.id, storiesData);
        }
      }

      return biography;
    }

    // 創建新 biography
    const user = await this.getUserInfo(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const defaultName = data.name || user.display_name || user.username || '攀岩者';
    const id = this.generateId();

    const biography = await this.repository.create({
      id,
      user_id: userId,
      name: defaultName,
      slug: user.username,
      title: data.title,
      bio: data.bio,
      avatar_url: data.avatar_url,
      cover_image: data.cover_image,
      visibility: data.visibility || 'public', // PUT /me 預設為 public
      tags_data: data.tags_data,
      basic_info_data: data.basic_info_data,
    });

    // 同步內容
    if (data.one_liners_data !== undefined) {
      const oneLinersData = typeof data.one_liners_data === 'string'
        ? JSON.parse(data.one_liners_data)
        : data.one_liners_data;

      if (oneLinersData && typeof oneLinersData === 'object') {
        await this.contentRepository.syncOneLiners(id, oneLinersData);
      }
    }

    if (data.stories_data !== undefined) {
      const storiesData = typeof data.stories_data === 'string'
        ? JSON.parse(data.stories_data)
        : data.stories_data;

      if (storiesData && typeof storiesData === 'object') {
        await this.contentRepository.syncStories(id, storiesData);
      }
    }

    return biography;
  }

  /**
   * 取得用戶資訊
   */
  private async getUserInfo(userId: string): Promise<{ username: string; display_name: string | null } | null> {
    const result = await this.db.prepare(
      'SELECT username, display_name FROM users WHERE id = ?'
    ).bind(userId).first<{ username: string; display_name: string | null }>();

    return result || null;
  }

  /**
   * 產生 ID (簡化版 UUID)
   */
  private generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
