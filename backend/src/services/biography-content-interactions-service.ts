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
