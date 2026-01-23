import { D1Database } from '@cloudflare/workers-types';

/**
 * 故事內容項目
 */
interface ContentItem {
  answer: string;
  visibility: 'public' | 'private' | 'community';
}

/**
 * One-liners 資料格式（前端期望）
 */
export interface OneLinersData {
  [questionId: string]: ContentItem;
}

/**
 * Stories 資料格式（前端期望）
 */
export interface StoriesData {
  [categoryId: string]: {
    [questionId: string]: ContentItem;
  };
}

/** 核心故事欄位 (3 題) */
const CORE_STORY_FIELDS = new Set(['climbing_origin', 'climbing_meaning', 'advice_to_self']);

/**
 * Biography Content Repository - 處理故事內容的資料存取
 *
 * 從獨立表中查詢並聚合成前端期望的 JSON 格式
 */
export class BiographyContentRepository {
  constructor(private db: D1Database) {}

  /**
   * 批次獲取多個 biographies 的 one_liners 資料
   * 包含 core stories 和 one-liners
   */
  async batchGetOneLiners(biographyIds: string[]): Promise<Map<string, OneLinersData>> {
    if (biographyIds.length === 0) {
      return new Map();
    }

    const placeholders = biographyIds.map(() => '?').join(',');

    // 查詢 core stories (climbing_origin, climbing_meaning, advice_to_self)
    const coreStoriesQuery = `
      SELECT
        biography_id,
        question_id,
        content as answer,
        CASE WHEN is_hidden = 1 THEN 'private' ELSE 'public' END as visibility
      FROM biography_core_stories
      WHERE biography_id IN (${placeholders})
        AND content IS NOT NULL
        AND TRIM(content) != ''
    `;

    // 查詢 one-liners
    const oneLinersQuery = `
      SELECT
        biography_id,
        question_id,
        answer,
        CASE WHEN is_hidden = 1 THEN 'private' ELSE 'public' END as visibility
      FROM biography_one_liners
      WHERE biography_id IN (${placeholders})
        AND answer IS NOT NULL
        AND TRIM(answer) != ''
    `;

    const [coreStoriesResult, oneLinersResult] = await Promise.all([
      this.db.prepare(coreStoriesQuery).bind(...biographyIds).all<{
        biography_id: string;
        question_id: string;
        answer: string;
        visibility: 'public' | 'private' | 'community';
      }>(),
      this.db.prepare(oneLinersQuery).bind(...biographyIds).all<{
        biography_id: string;
        question_id: string;
        answer: string;
        visibility: 'public' | 'private' | 'community';
      }>(),
    ]);

    // 聚合資料
    const result = new Map<string, OneLinersData>();

    // 合併 core stories
    for (const row of coreStoriesResult.results || []) {
      if (!result.has(row.biography_id)) {
        result.set(row.biography_id, {});
      }
      result.get(row.biography_id)![row.question_id] = {
        answer: row.answer,
        visibility: row.visibility,
      };
    }

    // 合併 one-liners
    for (const row of oneLinersResult.results || []) {
      if (!result.has(row.biography_id)) {
        result.set(row.biography_id, {});
      }
      result.get(row.biography_id)![row.question_id] = {
        answer: row.answer,
        visibility: row.visibility,
      };
    }

    return result;
  }

  /**
   * 批次獲取多個 biographies 的 stories 資料
   */
  async batchGetStories(biographyIds: string[]): Promise<Map<string, StoriesData>> {
    if (biographyIds.length === 0) {
      return new Map();
    }

    const placeholders = biographyIds.map(() => '?').join(',');

    const query = `
      SELECT
        biography_id,
        question_id,
        COALESCE(category_id, 'uncategorized') as category_id,
        content as answer,
        CASE WHEN is_hidden = 1 THEN 'private' ELSE 'public' END as visibility
      FROM biography_stories
      WHERE biography_id IN (${placeholders})
        AND content IS NOT NULL
        AND TRIM(content) != ''
    `;

    const storiesResult = await this.db.prepare(query).bind(...biographyIds).all<{
      biography_id: string;
      question_id: string;
      category_id: string;
      answer: string;
      visibility: 'public' | 'private' | 'community';
    }>();

    // 聚合資料
    const result = new Map<string, StoriesData>();

    for (const row of storiesResult.results || []) {
      if (!result.has(row.biography_id)) {
        result.set(row.biography_id, {});
      }

      const biographyStories = result.get(row.biography_id)!;
      if (!biographyStories[row.category_id]) {
        biographyStories[row.category_id] = {};
      }

      biographyStories[row.category_id][row.question_id] = {
        answer: row.answer,
        visibility: row.visibility,
      };
    }

    return result;
  }

  /**
   * 同步 one_liners 資料到資料庫
   * 包含 core stories 和 one-liners
   */
  async syncOneLiners(
    biographyId: string,
    oneLinersData: Record<string, { answer?: string; visibility?: string }>
  ): Promise<void> {
    const now = new Date().toISOString();

    for (const [questionId, data] of Object.entries(oneLinersData)) {
      const answer = data?.answer;

      if (answer === undefined) continue;

      const isCoreStory = CORE_STORY_FIELDS.has(questionId);

      if (isCoreStory) {
        // 處理 core stories
        const existing = await this.db.prepare(
          'SELECT id FROM biography_core_stories WHERE biography_id = ? AND question_id = ?'
        ).bind(biographyId, questionId).first<{ id: string }>();

        if (!answer || answer.trim() === '') {
          // 刪除空答案
          if (existing) {
            await this.db.prepare('DELETE FROM biography_core_stories WHERE id = ?')
              .bind(existing.id).run();
          }
        } else if (existing) {
          // 更新現有記錄
          await this.db.prepare(
            'UPDATE biography_core_stories SET content = ?, updated_at = ? WHERE id = ?'
          ).bind(answer.trim(), now, existing.id).run();
        } else {
          // 插入新記錄
          const id = this.generateId();
          await this.db.prepare(
            `INSERT INTO biography_core_stories (id, biography_id, question_id, content, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?)`
          ).bind(id, biographyId, questionId, answer.trim(), now, now).run();
        }
      } else {
        // 處理 one-liners
        const existing = await this.db.prepare(
          'SELECT id FROM biography_one_liners WHERE biography_id = ? AND question_id = ?'
        ).bind(biographyId, questionId).first<{ id: string }>();

        if (!answer || answer.trim() === '') {
          // 刪除空答案
          if (existing) {
            await this.db.prepare('DELETE FROM biography_one_liners WHERE id = ?')
              .bind(existing.id).run();
          }
        } else if (existing) {
          // 更新現有記錄
          await this.db.prepare(
            'UPDATE biography_one_liners SET answer = ?, updated_at = ? WHERE id = ?'
          ).bind(answer.trim(), now, existing.id).run();
        } else {
          // 插入新記錄
          const id = this.generateId();
          await this.db.prepare(
            `INSERT INTO biography_one_liners (id, biography_id, question_id, answer, source, created_at, updated_at)
             VALUES (?, ?, ?, ?, 'system', ?, ?)`
          ).bind(id, biographyId, questionId, answer.trim(), now, now).run();
        }
      }
    }
  }

  /**
   * 同步 stories 資料到資料庫
   */
  async syncStories(
    biographyId: string,
    storiesData: Record<string, Record<string, { answer?: string; visibility?: string }>>
  ): Promise<void> {
    const now = new Date().toISOString();

    for (const [categoryId, questions] of Object.entries(storiesData)) {
      if (!questions || typeof questions !== 'object') continue;

      for (const [questionId, data] of Object.entries(questions)) {
        const content = data?.answer;

        if (content === undefined) continue;

        const existing = await this.db.prepare(
          'SELECT id FROM biography_stories WHERE biography_id = ? AND question_id = ?'
        ).bind(biographyId, questionId).first<{ id: string }>();

        if (!content || content.trim() === '') {
          // 刪除空答案
          if (existing) {
            await this.db.prepare('DELETE FROM biography_stories WHERE id = ?')
              .bind(existing.id).run();
          }
        } else if (existing) {
          // 更新現有記錄
          const characterCount = content.trim().length;
          await this.db.prepare(
            'UPDATE biography_stories SET content = ?, category_id = ?, character_count = ?, updated_at = ? WHERE id = ?'
          ).bind(
            content.trim(),
            categoryId === 'uncategorized' ? null : categoryId,
            characterCount,
            now,
            existing.id
          ).run();
        } else {
          // 插入新記錄
          const id = this.generateId();
          const characterCount = content.trim().length;
          await this.db.prepare(
            `INSERT INTO biography_stories (id, biography_id, question_id, category_id, content, source, character_count, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, 'system', ?, ?, ?)`
          ).bind(
            id,
            biographyId,
            questionId,
            categoryId === 'uncategorized' ? null : categoryId,
            content.trim(),
            characterCount,
            now,
            now
          ).run();
        }
      }
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
}
