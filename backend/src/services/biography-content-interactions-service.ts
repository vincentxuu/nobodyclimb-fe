import { D1Database } from '@cloudflare/workers-types';
import { ContentInteractionsRepository } from '../repositories/content-interactions-repository';
import { BiographyContentCrudRepository } from '../repositories/biography-content-crud-repository';
import { createNotification, NotificationType } from '../routes/notifications';

/**
 * 內容類型
 */
type ContentType = 'core_story' | 'one_liner' | 'story';

/**
 * 通知類型對應
 */
const NOTIFICATION_TYPE_MAP: Record<ContentType, { liked: NotificationType; commented: NotificationType }> = {
  core_story: {
    liked: 'core_story_liked',
    commented: 'core_story_commented',
  },
  one_liner: {
    liked: 'one_liner_liked',
    commented: 'one_liner_commented',
  },
  story: {
    liked: 'story_liked',
    commented: 'story_commented',
  },
};

/**
 * 通知訊息對應
 */
const NOTIFICATION_MESSAGE_MAP: Record<
  ContentType,
  { likedTitle: string; likedMessage: string; commentedTitle: string; commentedMessage: string }
> = {
  core_story: {
    likedTitle: '核心故事獲得按讚',
    likedMessage: '對你的核心故事按讚',
    commentedTitle: '核心故事有新留言',
    commentedMessage: '對你的核心故事留言',
  },
  one_liner: {
    likedTitle: '一句話獲得按讚',
    likedMessage: '對你的一句話按讚',
    commentedTitle: '一句話有新留言',
    commentedMessage: '對你的一句話留言',
  },
  story: {
    likedTitle: '故事獲得按讚',
    likedMessage: '對你的故事按讚',
    commentedTitle: '故事有新留言',
    commentedMessage: '對你的故事留言',
  },
};

/**
 * 按讚回應
 */
export interface LikeResponse {
  liked: boolean;
  like_count: number;
}

/**
 * 快速反應類型
 */
export type ReactionType = 'me_too' | 'plus_one' | 'well_said';

/**
 * 快速反應回應
 */
export interface ReactionResponse {
  reacted: boolean;
  reaction_counts: Record<ReactionType, number>;
}

/**
 * 快速反應顯示資訊
 * icon 欄位對應 lucide-react 的 icon 名稱
 */
export const REACTION_DISPLAY = {
  me_too: { label: '我也是', icon: 'HandMetal' },
  plus_one: { label: '+1', icon: 'ThumbsUp' },
  well_said: { label: '說得好', icon: 'MessageSquareHeart' },
} as const;

/**
 * 人物誌內容互動服務
 */
export class BiographyContentInteractionsService {
  private interactionsRepo: ContentInteractionsRepository;
  private contentRepo: BiographyContentCrudRepository;

  constructor(private db: D1Database) {
    this.interactionsRepo = new ContentInteractionsRepository(db);
    this.contentRepo = new BiographyContentCrudRepository(db);
  }

  // ═══════════════════════════════════════════
  // 按讚功能
  // ═══════════════════════════════════════════

  /**
   * 切換按讚狀態
   */
  async toggleLike(
    contentType: ContentType,
    contentId: string,
    userId: string
  ): Promise<LikeResponse> {
    // 取得內容及擁有者資訊
    const content = await this.getContentWithOwner(contentType, contentId);
    if (!content) {
      throw new Error('找不到此內容');
    }

    // 檢查是否已按讚
    const hasLiked = await this.interactionsRepo.hasLiked(contentType, contentId, userId);

    if (hasLiked) {
      // 取消按讚
      await this.interactionsRepo.removeLike(contentType, contentId, userId);
    } else {
      // 新增按讚
      await this.interactionsRepo.addLike(contentType, contentId, userId);

      // 發送通知（不通知自己）
      if (content.owner_id !== userId) {
        await this.sendLikeNotification(contentType, contentId, content.owner_id, userId);
      }
    }

    // 更新按讚數
    const likeCount = await this.interactionsRepo.getLikeCount(contentType, contentId);
    await this.interactionsRepo.updateLikeCount(contentType, contentId, likeCount);

    return {
      liked: !hasLiked,
      like_count: likeCount,
    };
  }

  /**
   * 批次加入按讚狀態
   */
  async addLikeStatusToContents<T extends { id: string }>(
    contentType: ContentType,
    contents: T[],
    userId: string | null
  ): Promise<Array<T & { is_liked?: boolean }>> {
    if (!userId || contents.length === 0) {
      return contents;
    }

    const contentIds = contents.map((c) => c.id);
    const likedIds = await this.interactionsRepo.batchCheckLikes(contentType, contentIds, userId);

    return contents.map((content) => ({
      ...content,
      is_liked: likedIds.has(content.id),
    }));
  }

  // ═══════════════════════════════════════════
  // 留言功能
  // ═══════════════════════════════════════════

  /**
   * 取得留言列表
   */
  async getComments(contentType: ContentType, contentId: string) {
    return this.interactionsRepo.getComments(contentType, contentId);
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
  ) {
    // 驗證內容存在
    const targetContent = await this.getContentWithOwner(contentType, contentId);
    if (!targetContent) {
      throw new Error('找不到此內容');
    }

    // 驗證留言內容
    if (!content?.trim()) {
      throw new Error('留言內容不能為空');
    }

    // 新增留言
    const commentId = await this.interactionsRepo.addComment(
      contentType,
      contentId,
      userId,
      content.trim(),
      parentId
    );

    // 更新留言數
    const commentCount = await this.interactionsRepo.getCommentCount(contentType, contentId);
    await this.interactionsRepo.updateCommentCount(contentType, contentId, commentCount);

    // 發送通知（不通知自己）
    if (targetContent.owner_id !== userId) {
      await this.sendCommentNotification(
        contentType,
        contentId,
        targetContent.owner_id,
        userId
      );
    }

    // 回傳新留言
    return this.interactionsRepo.getCommentWithUser(contentType, commentId);
  }

  /**
   * 刪除留言
   */
  async deleteComment(contentType: ContentType, commentId: string, userId: string) {
    // 取得留言資訊
    const comment = await this.interactionsRepo.getComment(contentType, commentId);
    if (!comment) {
      throw new Error('找不到此留言');
    }

    // 權限檢查
    if (comment.user_id !== userId) {
      throw new Error('無權限刪除此留言');
    }

    // 取得內容 ID（不同內容類型的欄位名稱不同）
    const contentId = this.getContentIdFromComment(contentType, comment);

    // 刪除留言
    await this.interactionsRepo.deleteComment(contentType, commentId);

    // 更新留言數
    const commentCount = await this.interactionsRepo.getCommentCount(contentType, contentId);
    await this.interactionsRepo.updateCommentCount(contentType, contentId, commentCount);
  }

  // ═══════════════════════════════════════════
  // 快速反應功能
  // ═══════════════════════════════════════════

  /**
   * 切換快速反應狀態
   */
  async toggleReaction(
    contentType: ContentType,
    contentId: string,
    reactionType: ReactionType,
    userId: string
  ): Promise<ReactionResponse> {
    // 驗證內容存在
    const content = await this.getContentWithOwner(contentType, contentId);
    if (!content) {
      throw new Error('找不到此內容');
    }

    // 檢查是否已反應
    const hasReacted = await this.hasReacted(contentType, contentId, reactionType, userId);

    if (hasReacted) {
      // 移除反應
      await this.removeReaction(contentType, contentId, reactionType, userId);
    } else {
      // 新增反應
      await this.addReaction(contentType, contentId, reactionType, userId);
    }

    // 取得更新後的反應計數
    const reactionCounts = await this.getReactionCounts(contentType, contentId);

    // 更新內容表的反應計數
    await this.updateReactionCounts(contentType, contentId, reactionCounts);

    return {
      reacted: !hasReacted,
      reaction_counts: reactionCounts,
    };
  }

  /**
   * 檢查是否已反應
   */
  private async hasReacted(
    contentType: ContentType,
    contentId: string,
    reactionType: ReactionType,
    userId: string
  ): Promise<boolean> {
    const result = await this.db
      .prepare(
        `SELECT 1 FROM content_reactions
         WHERE content_type = ? AND content_id = ? AND reaction_type = ? AND user_id = ?`
      )
      .bind(contentType, contentId, reactionType, userId)
      .first();

    return !!result;
  }

  /**
   * 新增反應
   */
  private async addReaction(
    contentType: ContentType,
    contentId: string,
    reactionType: ReactionType,
    userId: string
  ): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO content_reactions (content_type, content_id, reaction_type, user_id)
         VALUES (?, ?, ?, ?)`
      )
      .bind(contentType, contentId, reactionType, userId)
      .run();
  }

  /**
   * 移除反應
   */
  private async removeReaction(
    contentType: ContentType,
    contentId: string,
    reactionType: ReactionType,
    userId: string
  ): Promise<void> {
    await this.db
      .prepare(
        `DELETE FROM content_reactions
         WHERE content_type = ? AND content_id = ? AND reaction_type = ? AND user_id = ?`
      )
      .bind(contentType, contentId, reactionType, userId)
      .run();
  }

  /**
   * 取得反應計數
   */
  async getReactionCounts(
    contentType: ContentType,
    contentId: string
  ): Promise<Record<ReactionType, number>> {
    const result = await this.db
      .prepare(
        `SELECT reaction_type, COUNT(*) as count
         FROM content_reactions
         WHERE content_type = ? AND content_id = ?
         GROUP BY reaction_type`
      )
      .bind(contentType, contentId)
      .all();

    const counts: Record<ReactionType, number> = {
      me_too: 0,
      plus_one: 0,
      well_said: 0,
    };

    for (const row of (result.results || []) as Array<{ reaction_type: ReactionType; count: number }>) {
      counts[row.reaction_type] = row.count;
    }

    return counts;
  }

  /**
   * 取得用戶對內容的反應狀態
   */
  async getUserReactions(
    contentType: ContentType,
    contentId: string,
    userId: string
  ): Promise<ReactionType[]> {
    const result = await this.db
      .prepare(
        `SELECT reaction_type FROM content_reactions
         WHERE content_type = ? AND content_id = ? AND user_id = ?`
      )
      .bind(contentType, contentId, userId)
      .all();

    return (result.results || []).map((row: any) => row.reaction_type);
  }

  /**
   * 批次取得用戶對多個內容的反應狀態
   */
  async batchGetUserReactions(
    contentType: ContentType,
    contentIds: string[],
    userId: string
  ): Promise<Map<string, ReactionType[]>> {
    if (contentIds.length === 0) {
      return new Map();
    }

    const placeholders = contentIds.map(() => '?').join(',');
    const result = await this.db
      .prepare(
        `SELECT content_id, reaction_type FROM content_reactions
         WHERE content_type = ? AND content_id IN (${placeholders}) AND user_id = ?`
      )
      .bind(contentType, ...contentIds, userId)
      .all();

    const reactionsMap = new Map<string, ReactionType[]>();
    for (const row of (result.results || []) as Array<{ content_id: string; reaction_type: ReactionType }>) {
      const existing = reactionsMap.get(row.content_id) || [];
      existing.push(row.reaction_type);
      reactionsMap.set(row.content_id, existing);
    }

    return reactionsMap;
  }

  /**
   * 更新內容表的反應計數
   */
  private async updateReactionCounts(
    contentType: ContentType,
    contentId: string,
    counts: Record<ReactionType, number>
  ): Promise<void> {
    const tableName = this.getTableName(contentType);

    await this.db
      .prepare(
        `UPDATE ${tableName}
         SET reaction_me_too_count = ?,
             reaction_plus_one_count = ?,
             reaction_well_said_count = ?
         WHERE id = ?`
      )
      .bind(counts.me_too, counts.plus_one, counts.well_said, contentId)
      .run();
  }

  /**
   * 取得內容表名稱
   */
  private getTableName(contentType: ContentType): string {
    switch (contentType) {
      case 'core_story':
        return 'biography_core_stories';
      case 'one_liner':
        return 'biography_one_liners';
      case 'story':
        return 'biography_stories';
    }
  }

  // ═══════════════════════════════════════════
  // 私有輔助方法
  // ═══════════════════════════════════════════

  /**
   * 取得內容及擁有者資訊
   */
  private async getContentWithOwner(
    contentType: ContentType,
    contentId: string
  ): Promise<{ owner_id: string } | null> {
    switch (contentType) {
      case 'core_story':
        return this.contentRepo.getCoreStoryWithOwner(contentId);
      case 'one_liner':
        return this.contentRepo.getOneLinerWithOwner(contentId);
      case 'story':
        return this.contentRepo.getStoryWithOwner(contentId);
    }
  }

  /**
   * 發送按讚通知
   */
  private async sendLikeNotification(
    contentType: ContentType,
    contentId: string,
    ownerId: string,
    actorId: string
  ): Promise<void> {
    try {
      const notifType = NOTIFICATION_TYPE_MAP[contentType];
      const messages = NOTIFICATION_MESSAGE_MAP[contentType];

      await createNotification(this.db, {
        userId: ownerId,
        type: notifType.liked,
        actorId,
        targetId: contentId,
        title: messages.likedTitle,
        message: messages.likedMessage,
      });
    } catch (err) {
      console.error('Failed to create like notification:', err);
    }
  }

  /**
   * 發送留言通知
   */
  private async sendCommentNotification(
    contentType: ContentType,
    contentId: string,
    ownerId: string,
    actorId: string
  ): Promise<void> {
    try {
      const notifType = NOTIFICATION_TYPE_MAP[contentType];
      const messages = NOTIFICATION_MESSAGE_MAP[contentType];

      await createNotification(this.db, {
        userId: ownerId,
        type: notifType.commented,
        actorId,
        targetId: contentId,
        title: messages.commentedTitle,
        message: messages.commentedMessage,
      });
    } catch (err) {
      console.error('Failed to create comment notification:', err);
    }
  }

  /**
   * 從留言物件中取得內容 ID
   */
  private getContentIdFromComment(contentType: ContentType, comment: any): string {
    // 統一的 comments 表使用 entity_id 欄位
    return comment.entity_id;
  }
}
