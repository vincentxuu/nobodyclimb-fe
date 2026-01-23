import { D1Database } from '@cloudflare/workers-types';
import {
  CoreStoryComment,
  OneLinerComment,
  StoryComment,
  CommentWithUser,
  ContentLike,
} from '../types';

/**
 * 內容互動類型
 */
type ContentType = 'core_story' | 'one_liner' | 'story';

/**
 * 通用的按讚和留言資料庫操作
 */
export class ContentInteractionsRepository {
  constructor(private db: D1Database) {}

  // ═══════════════════════════════════════════
  // 按讚相關操作
  // ═══════════════════════════════════════════

  /**
   * 檢查使用者是否已按讚
   */
  async hasLiked(contentType: ContentType, contentId: string, userId: string): Promise<boolean> {
    const table = this.getLikeTableName(contentType);
    const column = this.getContentIdColumn(contentType);

    const result = await this.db
      .prepare(`SELECT id FROM ${table} WHERE ${column} = ? AND user_id = ?`)
      .bind(contentId, userId)
      .first<{ id: string }>();

    return !!result;
  }

  /**
   * 批次檢查使用者按讚狀態
   */
  async batchCheckLikes(
    contentType: ContentType,
    contentIds: string[],
    userId: string
  ): Promise<Set<string>> {
    if (contentIds.length === 0) return new Set();

    const table = this.getLikeTableName(contentType);
    const column = this.getContentIdColumn(contentType);
    const placeholders = contentIds.map(() => '?').join(',');

    const result = await this.db
      .prepare(`SELECT ${column} as content_id FROM ${table} WHERE user_id = ? AND ${column} IN (${placeholders})`)
      .bind(userId, ...contentIds)
      .all<{ content_id: string }>();

    return new Set((result.results || []).map((r) => r.content_id));
  }

  /**
   * 新增按讚
   */
  async addLike(contentType: ContentType, contentId: string, userId: string): Promise<void> {
    const table = this.getLikeTableName(contentType);
    const column = this.getContentIdColumn(contentType);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db
      .prepare(`INSERT INTO ${table} (id, ${column}, user_id, created_at) VALUES (?, ?, ?, ?)`)
      .bind(id, contentId, userId, now)
      .run();
  }

  /**
   * 移除按讚
   */
  async removeLike(contentType: ContentType, contentId: string, userId: string): Promise<void> {
    const table = this.getLikeTableName(contentType);
    const column = this.getContentIdColumn(contentType);

    await this.db
      .prepare(`DELETE FROM ${table} WHERE ${column} = ? AND user_id = ?`)
      .bind(contentId, userId)
      .run();
  }

  /**
   * 取得按讚數
   */
  async getLikeCount(contentType: ContentType, contentId: string): Promise<number> {
    const table = this.getLikeTableName(contentType);
    const column = this.getContentIdColumn(contentType);

    const result = await this.db
      .prepare(`SELECT COUNT(*) as count FROM ${table} WHERE ${column} = ?`)
      .bind(contentId)
      .first<{ count: number }>();

    return result?.count || 0;
  }

  /**
   * 更新內容的按讚數
   */
  async updateLikeCount(contentType: ContentType, contentId: string, count: number): Promise<void> {
    const table = this.getContentTableName(contentType);

    await this.db
      .prepare(`UPDATE ${table} SET like_count = ? WHERE id = ?`)
      .bind(count, contentId)
      .run();
  }

  // ═══════════════════════════════════════════
  // 留言相關操作
  // ═══════════════════════════════════════════

  /**
   * 取得留言列表
   */
  async getComments(contentType: ContentType, contentId: string): Promise<CommentWithUser[]> {
    const table = this.getCommentTableName(contentType);
    const column = this.getContentIdColumn(contentType);

    const result = await this.db
      .prepare(
        `SELECT c.*, u.username, u.display_name, u.avatar_url
         FROM ${table} c
         JOIN users u ON c.user_id = u.id
         WHERE c.${column} = ?
         ORDER BY c.created_at DESC`
      )
      .bind(contentId)
      .all<CommentWithUser>();

    return result.results || [];
  }

  /**
   * 新增留言
   */
  async addComment(
    contentType: ContentType,
    contentId: string,
    userId: string,
    content: string,
    parentId: string | null = null
  ): Promise<string> {
    const table = this.getCommentTableName(contentType);
    const column = this.getContentIdColumn(contentType);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db
      .prepare(
        `INSERT INTO ${table} (id, ${column}, user_id, content, parent_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(id, contentId, userId, content, parentId, now, now)
      .run();

    return id;
  }

  /**
   * 取得留言（含使用者資訊）
   */
  async getCommentWithUser(
    contentType: ContentType,
    commentId: string
  ): Promise<CommentWithUser | null> {
    const table = this.getCommentTableName(contentType);

    const result = await this.db
      .prepare(
        `SELECT c.*, u.username, u.display_name, u.avatar_url
         FROM ${table} c
         JOIN users u ON c.user_id = u.id
         WHERE c.id = ?`
      )
      .bind(commentId)
      .first<CommentWithUser>();

    return result || null;
  }

  /**
   * 刪除留言
   */
  async deleteComment(contentType: ContentType, commentId: string): Promise<void> {
    const table = this.getCommentTableName(contentType);

    await this.db
      .prepare(`DELETE FROM ${table} WHERE id = ?`)
      .bind(commentId)
      .run();
  }

  /**
   * 取得留言資訊（用於權限檢查）
   */
  async getComment(contentType: ContentType, commentId: string): Promise<any | null> {
    const table = this.getCommentTableName(contentType);

    const result = await this.db
      .prepare(`SELECT * FROM ${table} WHERE id = ?`)
      .bind(commentId)
      .first();

    return result;
  }

  /**
   * 取得留言數
   */
  async getCommentCount(contentType: ContentType, contentId: string): Promise<number> {
    const table = this.getCommentTableName(contentType);
    const column = this.getContentIdColumn(contentType);

    const result = await this.db
      .prepare(`SELECT COUNT(*) as count FROM ${table} WHERE ${column} = ?`)
      .bind(contentId)
      .first<{ count: number }>();

    return result?.count || 0;
  }

  /**
   * 更新內容的留言數
   */
  async updateCommentCount(
    contentType: ContentType,
    contentId: string,
    count: number
  ): Promise<void> {
    const table = this.getContentTableName(contentType);

    await this.db
      .prepare(`UPDATE ${table} SET comment_count = ? WHERE id = ?`)
      .bind(count, contentId)
      .run();
  }

  // ═══════════════════════════════════════════
  // 輔助方法
  // ═══════════════════════════════════════════

  private getLikeTableName(contentType: ContentType): string {
    const tableMap: Record<ContentType, string> = {
      core_story: 'core_story_likes',
      one_liner: 'one_liner_likes',
      story: 'story_likes',
    };
    return tableMap[contentType];
  }

  private getCommentTableName(contentType: ContentType): string {
    const tableMap: Record<ContentType, string> = {
      core_story: 'core_story_comments',
      one_liner: 'one_liner_comments',
      story: 'story_comments',
    };
    return tableMap[contentType];
  }

  private getContentTableName(contentType: ContentType): string {
    const tableMap: Record<ContentType, string> = {
      core_story: 'biography_core_stories',
      one_liner: 'biography_one_liners',
      story: 'biography_stories',
    };
    return tableMap[contentType];
  }

  private getContentIdColumn(contentType: ContentType): string {
    const columnMap: Record<ContentType, string> = {
      core_story: 'core_story_id',
      one_liner: 'one_liner_id',
      story: 'story_id',
    };
    return columnMap[contentType];
  }
}
