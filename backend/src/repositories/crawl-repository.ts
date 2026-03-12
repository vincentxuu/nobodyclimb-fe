import type { CrawlSource, CrawlPage } from '../types';

export class CrawlRepository {
  constructor(private db: D1Database) {}

  // ============================================
  // Crawl Sources
  // ============================================

  async findAllSources(
    status?: string,
    page = 1,
    limit = 20
  ): Promise<{ sources: CrawlSource[]; total: number }> {
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const bindings: unknown[] = [];

    if (status) {
      conditions.push('status = ?');
      bindings.push(status);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [result, countResult] = await Promise.all([
      this.db
        .prepare(
          `SELECT * FROM crawl_sources ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`
        )
        .bind(...bindings, limit, offset)
        .all<CrawlSource>(),
      this.db
        .prepare(
          `SELECT COUNT(*) as count FROM crawl_sources ${whereClause}`
        )
        .bind(...bindings)
        .first<{ count: number }>(),
    ]);

    return {
      sources: result.results || [],
      total: countResult?.count || 0,
    };
  }

  async findSourceById(id: string): Promise<CrawlSource | null> {
    return this.db
      .prepare('SELECT * FROM crawl_sources WHERE id = ?')
      .bind(id)
      .first<CrawlSource>();
  }

  async createSource(source: Omit<CrawlSource, 'created_at' | 'updated_at' | 'last_crawled_at' | 'last_page_count' | 'error_message'>): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO crawl_sources (id, name, url, description, crawl_config, schedule, status, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        source.id,
        source.name,
        source.url,
        source.description,
        source.crawl_config,
        source.schedule,
        source.status,
        source.created_by
      )
      .run();
  }

  async updateSource(
    id: string,
    updates: Partial<Pick<CrawlSource, 'name' | 'url' | 'description' | 'crawl_config' | 'schedule' | 'status'>>
  ): Promise<void> {
    const fields: string[] = [];
    const bindings: unknown[] = [];

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        bindings.push(value);
      }
    }

    if (fields.length === 0) return;

    fields.push("updated_at = datetime('now')");
    bindings.push(id);

    await this.db
      .prepare(
        `UPDATE crawl_sources SET ${fields.join(', ')} WHERE id = ?`
      )
      .bind(...bindings)
      .run();
  }

  async updateSourceCrawlResult(
    id: string,
    pageCount: number,
    error?: string
  ): Promise<void> {
    if (error) {
      await this.db
        .prepare(
          `UPDATE crawl_sources
           SET status = 'error', error_message = ?, updated_at = datetime('now')
           WHERE id = ?`
        )
        .bind(error, id)
        .run();
    } else {
      await this.db
        .prepare(
          `UPDATE crawl_sources
           SET last_crawled_at = datetime('now'),
               last_page_count = ?,
               status = 'active',
               error_message = NULL,
               updated_at = datetime('now')
           WHERE id = ?`
        )
        .bind(pageCount, id)
        .run();
    }
  }

  async deleteSource(id: string): Promise<void> {
    await this.db
      .prepare('DELETE FROM crawl_sources WHERE id = ?')
      .bind(id)
      .run();
  }

  // ============================================
  // Crawl Pages
  // ============================================

  async findPagesBySourceId(
    sourceId: string,
    page = 1,
    limit = 20
  ): Promise<{ pages: CrawlPage[]; total: number }> {
    const offset = (page - 1) * limit;

    const [result, countResult] = await Promise.all([
      this.db
        .prepare(
          `SELECT * FROM crawl_pages
           WHERE source_id = ? AND status = 'active'
           ORDER BY crawled_at DESC LIMIT ? OFFSET ?`
        )
        .bind(sourceId, limit, offset)
        .all<CrawlPage>(),
      this.db
        .prepare(
          `SELECT COUNT(*) as count FROM crawl_pages
           WHERE source_id = ? AND status = 'active'`
        )
        .bind(sourceId)
        .first<{ count: number }>(),
    ]);

    return {
      pages: result.results || [],
      total: countResult?.count || 0,
    };
  }

  async findPageById(id: string): Promise<CrawlPage | null> {
    return this.db
      .prepare('SELECT * FROM crawl_pages WHERE id = ?')
      .bind(id)
      .first<CrawlPage>();
  }

  async findPageByUrl(
    sourceId: string,
    url: string
  ): Promise<CrawlPage | null> {
    return this.db
      .prepare(
        'SELECT * FROM crawl_pages WHERE source_id = ? AND url = ? AND status = ?'
      )
      .bind(sourceId, url, 'active')
      .first<CrawlPage>();
  }

  async upsertPage(page: {
    id: string;
    source_id: string;
    url: string;
    title: string | null;
    content: string | null;
    content_hash: string;
    metadata: string | null;
    word_count: number;
  }): Promise<{ isNew: boolean }> {
    const existing = await this.findPageByUrl(page.source_id, page.url);

    if (existing) {
      // 內容沒變就跳過
      if (existing.content_hash === page.content_hash) {
        return { isNew: false };
      }

      await this.db
        .prepare(
          `UPDATE crawl_pages
           SET title = ?, content = ?, content_hash = ?, metadata = ?,
               word_count = ?, updated_at = datetime('now'), crawled_at = datetime('now')
           WHERE id = ?`
        )
        .bind(
          page.title,
          page.content,
          page.content_hash,
          page.metadata,
          page.word_count,
          existing.id
        )
        .run();
      return { isNew: false };
    }

    await this.db
      .prepare(
        `INSERT INTO crawl_pages (id, source_id, url, title, content, content_hash, metadata, word_count)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        page.id,
        page.source_id,
        page.url,
        page.title,
        page.content,
        page.content_hash,
        page.metadata,
        page.word_count
      )
      .run();
    return { isNew: true };
  }

  async updatePageEmbeddingId(
    pageId: string,
    embeddingId: string
  ): Promise<void> {
    await this.db
      .prepare(
        `UPDATE crawl_pages SET embedding_id = ?, updated_at = datetime('now') WHERE id = ?`
      )
      .bind(embeddingId, pageId)
      .run();
  }

  async getActivePagesBySourceId(sourceId: string): Promise<CrawlPage[]> {
    const result = await this.db
      .prepare(
        `SELECT * FROM crawl_pages WHERE source_id = ? AND status = 'active'`
      )
      .bind(sourceId)
      .all<CrawlPage>();
    return result.results || [];
  }

  async searchPages(
    query: string,
    sourceId?: string,
    limit = 20
  ): Promise<CrawlPage[]> {
    const conditions = ["status = 'active'", "(title LIKE ? OR content LIKE ?)"];
    const bindings: unknown[] = [`%${query}%`, `%${query}%`];

    if (sourceId) {
      conditions.push('source_id = ?');
      bindings.push(sourceId);
    }

    const result = await this.db
      .prepare(
        `SELECT * FROM crawl_pages
         WHERE ${conditions.join(' AND ')}
         ORDER BY crawled_at DESC LIMIT ?`
      )
      .bind(...bindings, limit)
      .all<CrawlPage>();
    return result.results || [];
  }
}
