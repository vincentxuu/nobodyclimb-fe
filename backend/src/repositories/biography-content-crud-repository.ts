import { D1Database } from '@cloudflare/workers-types';
import {
  BiographyCoreStory,
  BiographyOneLiner,
  BiographyStory,
  CoreStoryQuestion,
  OneLinerQuestion,
  StoryCategory,
  StoryQuestion,
} from '../types';

/**
 * 人物誌內容 CRUD 資料庫操作
 */
export class BiographyContentCrudRepository {
  constructor(private db: D1Database) {}

  // ═══════════════════════════════════════════
  // 問題資料查詢
  // ═══════════════════════════════════════════

  /**
   * 取得所有題目資料
   */
  async getAllQuestions(): Promise<{
    coreQuestions: CoreStoryQuestion[];
    oneLinerQuestions: OneLinerQuestion[];
    storyCategories: StoryCategory[];
    storyQuestions: StoryQuestion[];
  }> {
    const [coreQuestions, oneLinerQuestions, storyCategories, storyQuestions] = await Promise.all([
      this.db
        .prepare(
          `SELECT id, title, subtitle, placeholder, display_order
           FROM core_story_questions WHERE is_active = 1 ORDER BY display_order`
        )
        .all<CoreStoryQuestion>(),
      this.db
        .prepare(
          `SELECT id, question, format_hint, placeholder, display_order
           FROM one_liner_questions WHERE is_active = 1 ORDER BY display_order`
        )
        .all<OneLinerQuestion>(),
      this.db
        .prepare(
          `SELECT id, name, icon, description, display_order
           FROM story_categories WHERE is_active = 1 ORDER BY display_order`
        )
        .all<StoryCategory>(),
      this.db
        .prepare(
          `SELECT id, category_id, title, subtitle, placeholder, difficulty, display_order
           FROM story_questions WHERE is_active = 1 ORDER BY category_id, display_order`
        )
        .all<StoryQuestion>(),
    ]);

    return {
      coreQuestions: coreQuestions.results || [],
      oneLinerQuestions: oneLinerQuestions.results || [],
      storyCategories: storyCategories.results || [],
      storyQuestions: storyQuestions.results || [],
    };
  }

  // ═══════════════════════════════════════════
  // 核心故事 CRUD
  // ═══════════════════════════════════════════

  /**
   * 取得人物誌的核心故事列表
   */
  async getCoreStories(biographyId: string): Promise<any[]> {
    const result = await this.db
      .prepare(
        `SELECT cs.*, csq.title, csq.subtitle
         FROM biography_core_stories cs
         LEFT JOIN core_story_questions csq ON cs.question_id = csq.id
         WHERE cs.biography_id = ? AND cs.is_hidden = 0
         ORDER BY cs.display_order`
      )
      .bind(biographyId)
      .all();

    return result.results || [];
  }

  /**
   * 取得核心故事（含擁有者資訊）
   */
  async getCoreStoryWithOwner(storyId: string): Promise<any | null> {
    const result = await this.db
      .prepare(
        `SELECT cs.*, b.user_id as owner_id
         FROM biography_core_stories cs
         JOIN biographies b ON cs.biography_id = b.id
         WHERE cs.id = ?`
      )
      .bind(storyId)
      .first();

    return result;
  }

  /**
   * 新增或更新核心故事
   */
  async upsertCoreStory(
    biographyId: string,
    questionId: string,
    content: string
  ): Promise<void> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    await this.db
      .prepare(
        `INSERT INTO biography_core_stories (id, biography_id, question_id, content, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT (biography_id, question_id)
         DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at`
      )
      .bind(id, biographyId, questionId, content, now, now)
      .run();
  }

  // ═══════════════════════════════════════════
  // 一句話 CRUD
  // ═══════════════════════════════════════════

  /**
   * 取得人物誌的一句話列表
   */
  async getOneLiners(biographyId: string): Promise<any[]> {
    const result = await this.db
      .prepare(
        `SELECT ol.*, olq.question, olq.format_hint
         FROM biography_one_liners ol
         LEFT JOIN one_liner_questions olq ON ol.question_id = olq.id
         WHERE ol.biography_id = ? AND ol.is_hidden = 0
         ORDER BY ol.display_order`
      )
      .bind(biographyId)
      .all();

    return result.results || [];
  }

  /**
   * 取得一句話（含擁有者資訊）
   */
  async getOneLinerWithOwner(oneLinerId: string): Promise<any | null> {
    const result = await this.db
      .prepare(
        `SELECT ol.*, b.user_id as owner_id
         FROM biography_one_liners ol
         JOIN biographies b ON ol.biography_id = b.id
         WHERE ol.id = ?`
      )
      .bind(oneLinerId)
      .first();

    return result;
  }

  /**
   * 新增或更新一句話
   */
  async upsertOneLiner(
    biographyId: string,
    questionId: string,
    answer: string,
    questionText: string | null = null,
    source: string = 'system'
  ): Promise<void> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    await this.db
      .prepare(
        `INSERT INTO biography_one_liners (id, biography_id, question_id, question_text, answer, source, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (biography_id, question_id)
         DO UPDATE SET answer = excluded.answer, question_text = excluded.question_text, updated_at = excluded.updated_at`
      )
      .bind(id, biographyId, questionId, questionText, answer, source, now, now)
      .run();
  }

  /**
   * 刪除一句話
   */
  async deleteOneLiner(oneLinerId: string): Promise<void> {
    await this.db
      .prepare(`DELETE FROM biography_one_liners WHERE id = ?`)
      .bind(oneLinerId)
      .run();
  }

  // ═══════════════════════════════════════════
  // 小故事 CRUD
  // ═══════════════════════════════════════════

  /**
   * 取得人物誌的小故事列表
   */
  async getStories(biographyId: string, categoryId?: string): Promise<any[]> {
    let query = `
      SELECT s.*, sq.title, sq.subtitle, sq.difficulty, sc.name as category_name, sc.icon as category_icon
      FROM biography_stories s
      LEFT JOIN story_questions sq ON s.question_id = sq.id
      LEFT JOIN story_categories sc ON s.category_id = sc.id
      WHERE s.biography_id = ? AND s.is_hidden = 0
    `;
    const params: (string | number)[] = [biographyId];

    if (categoryId) {
      query += ' AND s.category_id = ?';
      params.push(categoryId);
    }

    query += ' ORDER BY s.category_id, s.display_order';

    const result = await this.db.prepare(query).bind(...params).all();

    return result.results || [];
  }

  /**
   * 取得小故事（含擁有者資訊）
   */
  async getStoryWithOwner(storyId: string): Promise<any | null> {
    const result = await this.db
      .prepare(
        `SELECT s.*, b.user_id as owner_id
         FROM biography_stories s
         JOIN biographies b ON s.biography_id = b.id
         WHERE s.id = ?`
      )
      .bind(storyId)
      .first();

    return result;
  }

  /**
   * 新增或更新小故事
   */
  async upsertStory(
    biographyId: string,
    questionId: string,
    content: string,
    categoryId: string | null = null,
    questionText: string | null = null,
    source: string = 'system'
  ): Promise<void> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const wordCount = content.length;

    await this.db
      .prepare(
        `INSERT INTO biography_stories (id, biography_id, question_id, question_text, category_id, content, source, character_count, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (biography_id, question_id)
         DO UPDATE SET content = excluded.content, question_text = excluded.question_text, category_id = excluded.category_id, character_count = excluded.character_count, updated_at = excluded.updated_at`
      )
      .bind(id, biographyId, questionId, questionText, categoryId, content, source, wordCount, now, now)
      .run();
  }

  /**
   * 刪除小故事
   */
  async deleteStory(storyId: string): Promise<void> {
    await this.db
      .prepare(`DELETE FROM biography_stories WHERE id = ?`)
      .bind(storyId)
      .run();
  }

  // ═══════════════════════════════════════════
  // 熱門內容查詢
  // ═══════════════════════════════════════════

  /**
   * 取得熱門核心故事
   */
  async getPopularCoreStories(limit: number = 10): Promise<any[]> {
    const result = await this.db
      .prepare(
        `SELECT cs.*, csq.title, csq.subtitle, b.name as author_name, b.avatar_url as author_avatar, b.slug as biography_slug
         FROM biography_core_stories cs
         JOIN core_story_questions csq ON cs.question_id = csq.id
         JOIN biographies b ON cs.biography_id = b.id
         WHERE cs.is_hidden = 0
         ORDER BY cs.like_count DESC
         LIMIT ?`
      )
      .bind(limit)
      .all();

    return result.results || [];
  }

  /**
   * 取得熱門一句話
   */
  async getPopularOneLiners(limit: number = 10): Promise<any[]> {
    const result = await this.db
      .prepare(
        `SELECT ol.*, olq.question, b.name as author_name, b.avatar_url as author_avatar, b.slug as biography_slug
         FROM biography_one_liners ol
         LEFT JOIN one_liner_questions olq ON ol.question_id = olq.id
         JOIN biographies b ON ol.biography_id = b.id
         WHERE ol.is_hidden = 0
         ORDER BY ol.like_count DESC
         LIMIT ?`
      )
      .bind(limit)
      .all();

    return result.results || [];
  }

  /**
   * 取得熱門小故事
   */
  async getPopularStories(limit: number = 10, categoryId?: string): Promise<any[]> {
    let query = `
      SELECT s.*, sq.title, sq.subtitle, sc.name as category_name, sc.icon as category_icon,
             b.name as author_name, b.avatar_url as author_avatar, b.slug as biography_slug
      FROM biography_stories s
      LEFT JOIN story_questions sq ON s.question_id = sq.id
      LEFT JOIN story_categories sc ON s.category_id = sc.id
      JOIN biographies b ON s.biography_id = b.id
      WHERE s.is_hidden = 0
    `;
    const params: (string | number)[] = [];

    if (categoryId) {
      query += ' AND s.category_id = ?';
      params.push(categoryId);
    }

    query += ' ORDER BY s.like_count DESC LIMIT ?';
    params.push(limit);

    const result = await this.db.prepare(query).bind(...params).all();

    return result.results || [];
  }

  // ═══════════════════════════════════════════
  // 人物誌權限檢查
  // ═══════════════════════════════════════════

  /**
   * 取得人物誌的擁有者 ID
   */
  async getBiographyOwnerId(biographyId: string): Promise<string | null> {
    const result = await this.db
      .prepare(`SELECT user_id FROM biographies WHERE id = ?`)
      .bind(biographyId)
      .first<{ user_id: string }>();

    return result?.user_id || null;
  }
}
