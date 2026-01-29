import { D1Database, KVNamespace, R2Bucket } from '@cloudflare/workers-types';
import { PostRepository, PostListItem, PostQueryOptions } from '../repositories/post-repository';
import { Post } from '../types';
import { trackAndUpdateViewCount } from '../utils/viewTracker';
import { deleteR2Images, extractR2ImagesFromContent } from '../utils/storage';
import { z } from 'zod';

/**
 * Post Metadata schema（用於 SEO，存入 KV 快取）
 */
const postMetadataSchema = z.object({
  id: z.string(),
  title: z.string(),
  excerpt: z.string().nullable(),
  cover_image: z.string().nullable(),
  display_name: z.string().nullable(),
  username: z.string().nullable(),
  published_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  tags: z.array(z.string()),
});

type PostMetadata = z.infer<typeof postMetadataSchema>;

/**
 * Post 列表回應格式
 */
export interface PostListResponse extends PostListItem {
  tags?: string[];
}

/**
 * Post 詳情回應格式
 */
export interface PostDetailResponse extends PostListItem {
  tags: string[];
  view_count: number;
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
    total_pages: number;
  };
}

/**
 * Post Service - 業務邏輯層
 *
 * 職責：
 * - 處理業務邏輯
 * - 資料轉換與格式化
 * - 權限檢查
 * - 快取管理
 * - 通知發送
 */
export class PostService {
  constructor(
    private repository: PostRepository,
    private db: D1Database,
    private cache: KVNamespace,
    private r2PublicUrl: string
  ) {}

  /**
   * 取得 posts 列表（分頁）
   */
  async getList(options: PostQueryOptions): Promise<PaginatedResponse<PostListResponse>> {
    const { page = 1, limit = 20 } = options;

    // 並行查詢資料與總數
    const [posts, total] = await Promise.all([
      this.repository.findMany(options),
      this.repository.count(options),
    ]);

    // 批次獲取 tags
    const postIds = posts.map((p) => p.id as string);
    const tagsMap = await this.repository.batchGetTags(postIds);

    const data = posts.map((post) => ({
      ...post,
      tags: tagsMap.get(post.id as string) || [],
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 取得當前用戶的 posts
   */
  async getMyPosts(
    userId: string,
    options: { page?: number; limit?: number; status?: string }
  ): Promise<PaginatedResponse<PostListResponse>> {
    const { page = 1, limit = 20 } = options;

    // 並行查詢資料與總數
    const [posts, total] = await Promise.all([
      this.repository.findMyPosts(userId, options),
      this.repository.count({ ...options, authorId: userId }),
    ]);

    // 批次獲取 tags
    const postIds = posts.map((p) => p.id as string);
    const tagsMap = await this.repository.batchGetTags(postIds);

    const data = posts.map((post) => ({
      ...post,
      tags: tagsMap.get(post.id as string) || [],
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 取得 featured posts
   */
  async getFeatured(limit: number = 6): Promise<PostListResponse[]> {
    return await this.repository.findFeatured(limit);
  }

  /**
   * 取得熱門 posts
   */
  async getPopular(limit: number = 5): Promise<PostListResponse[]> {
    const posts = await this.repository.findPopular(limit);

    // 批次獲取 tags
    const postIds = posts.map((p) => p.id as string);
    const tagsMap = await this.repository.batchGetTags(postIds);

    return posts.map((post) => ({
      ...post,
      tags: tagsMap.get(post.id as string) || [],
    }));
  }

  /**
   * 取得用戶按讚的 posts
   */
  async getLikedPosts(
    userId: string,
    options: { page?: number; limit?: number }
  ): Promise<PaginatedResponse<PostListResponse>> {
    const { page = 1, limit = 20 } = options;

    // 並行查詢資料與總數
    const [posts, total] = await Promise.all([
      this.repository.findLiked(userId, options),
      this.repository.countLiked(userId),
    ]);

    // 批次獲取 tags
    const postIds = posts.map((p) => p.id as string);
    const tagsMap = await this.repository.batchGetTags(postIds);

    const data = posts.map((post) => ({
      ...post,
      tags: tagsMap.get(post.id as string) || [],
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 取得所有 tags
   */
  async getAllTags(): Promise<Array<{ tag: string; count: number }>> {
    return await this.repository.getAllTags();
  }

  /**
   * 根據 ID 取得單筆 post
   */
  async getById(id: string, request?: Request): Promise<PostDetailResponse | null> {
    const post = await this.repository.findById(id);

    if (!post) {
      return null;
    }

    // 獲取 tags
    const tags = await this.repository.getTags(id);

    // 追蹤並更新觀看數（如果提供 request）
    let viewCount = post.view_count as number;
    if (request) {
      viewCount = await trackAndUpdateViewCount(
        this.db,
        this.cache,
        request,
        'post',
        id,
        post.view_count as number
      );
    }

    // 快取 metadata 到 KV 供前端 SSR 使用
    await this.cachePostMetadata(post, tags);

    return {
      ...post,
      view_count: viewCount,
      tags,
    };
  }

  /**
   * 根據 slug 取得單筆 post
   */
  async getBySlug(slug: string, request?: Request): Promise<PostDetailResponse | null> {
    const post = await this.repository.findBySlug(slug);

    if (!post) {
      return null;
    }

    // 獲取 tags
    const tags = await this.repository.getTags(post.id as string);

    // 追蹤並更新觀看數（如果提供 request）
    let viewCount = post.view_count as number;
    if (request) {
      viewCount = await trackAndUpdateViewCount(
        this.db,
        this.cache,
        request,
        'post',
        post.id as string,
        post.view_count as number
      );
    }

    // 快取 metadata 到 KV 供前端 SSR 使用
    await this.cachePostMetadata(post, tags);

    return {
      ...post,
      view_count: viewCount,
      tags,
    };
  }

  /**
   * 創建新 post
   */
  async create(
    userId: string,
    data: {
      title: string;
      content: string;
      slug?: string;
      excerpt?: string;
      cover_image?: string;
      category?: string;
      status?: string;
      is_featured?: number;
      tags?: string[];
    }
  ): Promise<PostDetailResponse> {
    const id = this.generateId();
    const slug = data.slug || this.generateSlug(data.title);

    // 創建 post
    const post = await this.repository.create({
      id,
      author_id: userId,
      title: data.title,
      slug,
      excerpt: data.excerpt,
      content: data.content,
      cover_image: data.cover_image,
      category: data.category,
      status: data.status,
      is_featured: data.is_featured,
    });

    // 同步 tags
    if (data.tags && data.tags.length > 0) {
      await this.repository.syncTags(id, data.tags);
    }

    // 獲取完整的 post 資料（包含作者資訊）
    const fullPost = await this.repository.findById(id);

    if (!fullPost) {
      throw new Error('Failed to retrieve created post');
    }

    return {
      ...fullPost,
      tags: data.tags || [],
      view_count: 0,
    };
  }

  /**
   * 更新 post
   */
  async update(
    id: string,
    userId: string,
    userRole: string,
    data: Partial<Post> & { tags?: string[] }
  ): Promise<PostDetailResponse> {
    // 檢查權限
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new Error('Post not found');
    }

    if (existing.author_id !== userId && userRole !== 'admin') {
      throw new Error('You can only edit your own posts');
    }

    // 更新 post
    if (this.hasUpdateableFields(data)) {
      await this.repository.update(id, data);
    }

    // 同步 tags
    if (data.tags !== undefined) {
      await this.repository.syncTags(id, data.tags);
    }

    // 獲取更新後的 post
    const updatedPost = await this.repository.findById(id);

    if (!updatedPost) {
      throw new Error('Failed to retrieve updated post');
    }

    const tags = await this.repository.getTags(id);

    return {
      ...updatedPost,
      tags,
      view_count: updatedPost.view_count as number,
    };
  }

  /**
   * 刪除 post
   */
  async delete(
    id: string,
    userId: string,
    userRole: string,
    storage: R2Bucket
  ): Promise<void> {
    // 檢查權限
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new Error('Post not found');
    }

    if (existing.author_id !== userId && userRole !== 'admin') {
      throw new Error('You can only delete your own posts');
    }

    // 刪除 R2 中的圖片
    const contentImages = extractR2ImagesFromContent(
      existing.content as string | null,
      this.r2PublicUrl
    );
    await deleteR2Images(storage, [existing.cover_image as string | null, ...contentImages]);

    // 刪除 post
    await this.repository.delete(id);
  }

  /**
   * 檢查是否有可更新的欄位
   */
  private hasUpdateableFields(data: Partial<Post>): boolean {
    const updatableFields = [
      'title',
      'excerpt',
      'content',
      'cover_image',
      'category',
      'status',
      'is_featured',
    ];

    return updatableFields.some((field) => data[field as keyof Post] !== undefined);
  }

  /**
   * 快取 Post metadata 到 KV
   */
  private async cachePostMetadata(
    post: PostListItem,
    tags: string[]
  ): Promise<void> {
    const rawMetadata = {
      id: post.id,
      title: post.title,
      excerpt: post.excerpt ?? null,
      cover_image: post.cover_image ?? null,
      display_name: post.display_name ?? null,
      username: post.username ?? null,
      published_at: post.published_at ?? null,
      updated_at: post.updated_at ?? null,
      tags,
    };

    const parsed = postMetadataSchema.safeParse(rawMetadata);
    if (!parsed.success) {
      console.error(`Invalid post metadata for ${post.id}:`, parsed.error.issues);
      return;
    }

    const cacheKey = `post-meta:${parsed.data.id}`;

    try {
      await this.cache.put(cacheKey, JSON.stringify(parsed.data), {
        expirationTtl: 86400 * 7, // 7 天過期
      });
    } catch (error) {
      console.error(`Failed to cache post metadata for ${parsed.data.id}:`, error);
    }
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

  /**
   * 產生 slug
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}
