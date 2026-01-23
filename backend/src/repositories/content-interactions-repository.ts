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
    const result = await this.db
      .prepare(`SELECT id FROM likes WHERE entity_type = ? AND entity_id = ? AND user_id = ?`)
      .bind(contentType, contentId, userId)
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

    const placeholders = contentIds.map(() => '?').join(',');

    const result = await this.db
      .prepare(`SELECT entity_id as content_id FROM likes WHERE entity_type = ? AND user_id = ? AND entity_id IN (${placeholders})`)
      .bind(contentType, userId, ...contentIds)
      .all<{ content_id: string }>();

    return new Set((result.results || []).map((r) => r.content_id));
  }

  /**
   * 新增按讚
   */
  async addLike(contentType: ContentType, contentId: string, userId: string): Promise<void> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db
      .prepare(`INSERT INTO likes (id, entity_type, entity_id, user_id, created_at) VALUES (?, ?, ?, ?, ?)`)
      .bind(id, contentType, contentId, userId, now)
      .run();
  }

  /**
   * 移除按讚
   */
  async removeLike(contentType: ContentType, contentId: string, userId: string): Promise<void> {
    await this.db
      .prepare(`DELETE FROM likes WHERE entity_type = ? AND entity_id = ? AND user_id = ?`)
      .bind(contentType, contentId, userId)
      .run();
  }

  /**
   * 取得按讚數
   */
  async getLikeCount(contentType: ContentType, contentId: string): Promise<number> {
    const result = await this.db
      .prepare(`SELECT COUNT(*) as count FROM likes WHERE entity_type = ? AND entity_id = ?`)
      .bind(contentType, contentId)
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
    const result = await this.db
      .prepare(
        `SELECT c.*, u.username, u.display_name, u.avatar_url
         FROM comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.entity_type = ? AND c.entity_id = ?
         ORDER BY c.created_at DESC`
      )
      .bind(contentType, contentId)
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
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db
      .prepare(
        `INSERT INTO comments (id, entity_type, entity_id, user_id, content, parent_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(id, contentType, contentId, userId, content, parentId, now, now)
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
    const result = await this.db
      .prepare(
        `SELECT c.*, u.username, u.display_name, u.avatar_url
         FROM comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.id = ? AND c.entity_type = ?`
      )
      .bind(commentId, contentType)
      .first<CommentWithUser>();

    return result || null;
  }

  /**
   * 刪除留言
   */
  async deleteComment(contentType: ContentType, commentId: string): Promise<void> {
    await this.db
      .prepare(`DELETE FROM comments WHERE id = ? AND entity_type = ?`)
      .bind(commentId, contentType)
      .run();
  }

  /**
   * 取得留言資訊（用於權限檢查）
   */
  async getComment(contentType: ContentType, commentId: string): Promise<any | null> {
    const result = await this.db
      .prepare(`SELECT * FROM comments WHERE id = ? AND entity_type = ?`)
      .bind(commentId, contentType)
      .first();

    return result;
  }

  /**
   * 取得留言數
   */
  async getCommentCount(contentType: ContentType, contentId: string): Promise<number> {
    const result = await this.db
      .prepare(`SELECT COUNT(*) as count FROM comments WHERE entity_type = ? AND entity_id = ?`)
      .bind(contentType, contentId)
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

  private getContentTableName(contentType: ContentType): string {
    const tableMap: Record<ContentType, string> = {
      core_story: 'biography_core_stories',
      one_liner: 'biography_one_liners',
      story: 'biography_stories',
    };
    return tableMap[contentType];
  }
}
