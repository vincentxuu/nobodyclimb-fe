import type {
  Env,
  CrawlConfig,
  CrawlSource,
  CloudflareCrawlResponse,
  CloudflareCrawlPage,
} from '../types';
import { CrawlRepository } from '../repositories/crawl-repository';
import { generateId } from '../utils/id';

export class CrawlService {
  private repository: CrawlRepository;

  constructor(private env: Env) {
    this.repository = new CrawlRepository(env.DB);
  }

  // ============================================
  // 爬取來源管理
  // ============================================

  async listSources(status?: string, page = 1, limit = 20) {
    return this.repository.findAllSources(status, page, limit);
  }

  async getSource(id: string) {
    return this.repository.findSourceById(id);
  }

  async createSource(params: {
    name: string;
    url: string;
    description?: string;
    crawl_config?: CrawlConfig;
    schedule?: string;
    created_by?: string;
  }) {
    const id = generateId();
    await this.repository.createSource({
      id,
      name: params.name,
      url: params.url,
      description: params.description || null,
      crawl_config: params.crawl_config
        ? JSON.stringify(params.crawl_config)
        : null,
      schedule: params.schedule || null,
      status: 'active',
      created_by: params.created_by || null,
    });
    return this.repository.findSourceById(id);
  }

  async updateSource(
    id: string,
    updates: {
      name?: string;
      url?: string;
      description?: string;
      crawl_config?: CrawlConfig;
      schedule?: string;
      status?: 'active' | 'paused';
    }
  ) {
    const updateData: Record<string, unknown> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.url !== undefined) updateData.url = updates.url;
    if (updates.description !== undefined)
      updateData.description = updates.description;
    if (updates.crawl_config !== undefined)
      updateData.crawl_config = JSON.stringify(updates.crawl_config);
    if (updates.schedule !== undefined) updateData.schedule = updates.schedule;
    if (updates.status !== undefined) updateData.status = updates.status;

    await this.repository.updateSource(id, updateData);
    return this.repository.findSourceById(id);
  }

  async deleteSource(id: string) {
    await this.repository.deleteSource(id);
  }

  // ============================================
  // 執行爬取
  // ============================================

  async executeCrawl(sourceId: string): Promise<{
    pagesProcessed: number;
    newPages: number;
    updatedPages: number;
    errors: string[];
  }> {
    const source = await this.repository.findSourceById(sourceId);
    if (!source) {
      throw new Error('Crawl source not found');
    }

    const config: CrawlConfig = source.crawl_config
      ? JSON.parse(source.crawl_config)
      : {};

    const maxPages = config.maxPages || 10;
    const maxDepth = config.maxDepth || 2;

    try {
      // 呼叫 Cloudflare /crawl API
      const crawlResult = await this.callCrawlApi(source.url, {
        maxPages,
        maxDepth,
        waitTime: config.waitTime,
      });

      let newPages = 0;
      let updatedPages = 0;
      const errors: string[] = [];

      // 處理爬取結果
      for (const page of crawlResult) {
        try {
          const content = page.markdown || page.text || '';
          const contentHash = await this.hashContent(content);
          const wordCount = content.length;

          const result = await this.repository.upsertPage({
            id: generateId(),
            source_id: sourceId,
            url: page.url,
            title: page.title || null,
            content: content || null,
            content_hash: contentHash,
            metadata: JSON.stringify({
              links: page.links || [],
              images: page.images || [],
            }),
            word_count: wordCount,
          });

          if (result.isNew) {
            newPages++;
          } else {
            updatedPages++;
          }
        } catch (err) {
          errors.push(
            `Failed to process ${page.url}: ${err instanceof Error ? err.message : String(err)}`
          );
        }
      }

      // 更新爬取來源狀態
      await this.repository.updateSourceCrawlResult(
        sourceId,
        crawlResult.length
      );

      return {
        pagesProcessed: crawlResult.length,
        newPages,
        updatedPages,
        errors,
      };
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : String(err);
      await this.repository.updateSourceCrawlResult(
        sourceId,
        0,
        errorMsg
      );
      throw err;
    }
  }

  // ============================================
  // Cloudflare /crawl API 呼叫
  // ============================================

  private async callCrawlApi(
    url: string,
    options: {
      maxPages?: number;
      maxDepth?: number;
      waitTime?: number;
    }
  ): Promise<CloudflareCrawlPage[]> {
    const accountId = this.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = this.env.CLOUDFLARE_API_TOKEN;

    if (!accountId || !apiToken) {
      throw new Error(
        'CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN are required for crawl API'
      );
    }

    const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering/crawl`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        maxPages: options.maxPages || 10,
        maxDepth: options.maxDepth || 2,
        waitTime: options.waitTime || 5000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Cloudflare Crawl API error (${response.status}): ${errorText}`
      );
    }

    const data = (await response.json()) as CloudflareCrawlResponse;

    if (!data.success) {
      throw new Error('Cloudflare Crawl API returned unsuccessful response');
    }

    return data.result || [];
  }

  // ============================================
  // RAG 整合：將爬取內容向量化
  // ============================================

  async vectorizePages(sourceId: string): Promise<{
    vectorized: number;
    skipped: number;
    errors: string[];
  }> {
    const pages = await this.repository.getActivePagesBySourceId(sourceId);
    let vectorized = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const page of pages) {
      // 已有 embedding 且內容未變更則跳過
      if (page.embedding_id) {
        skipped++;
        continue;
      }

      if (!page.content || page.content.trim().length === 0) {
        skipped++;
        continue;
      }

      try {
        // 截斷過長內容（embedding 模型有 token 限制）
        const text = this.truncateForEmbedding(page.content, 8000);
        const embeddingText = `${page.title || ''}\n${text}`;

        // 使用 Workers AI 產生 embedding
        const embeddingResult = (await this.env.AI.run(
          '@cf/baai/bge-base-en-v1.5',
          { text: [embeddingText] },
          this.env.AI_GATEWAY_SLUG
            ? { gateway: { id: this.env.AI_GATEWAY_SLUG } }
            : undefined
        )) as { data: number[][] };

        if (!embeddingResult.data || embeddingResult.data.length === 0) {
          errors.push(`No embedding generated for page: ${page.url}`);
          continue;
        }

        const embeddingId = `crawl-${page.id}`;

        // 寫入 Vectorize
        await this.env.VECTOR_INDEX.upsert([
          {
            id: embeddingId,
            values: embeddingResult.data[0],
            metadata: {
              type: 'crawl',
              source_id: sourceId,
              page_id: page.id,
              url: page.url,
              title: page.title || '',
            },
          },
        ]);

        // 更新 page 的 embedding_id
        await this.repository.updatePageEmbeddingId(page.id, embeddingId);
        vectorized++;
      } catch (err) {
        errors.push(
          `Failed to vectorize ${page.url}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    return { vectorized, skipped, errors };
  }

  // ============================================
  // 頁面查詢
  // ============================================

  async getPages(sourceId: string, page = 1, limit = 20) {
    return this.repository.findPagesBySourceId(sourceId, page, limit);
  }

  async getPage(id: string) {
    return this.repository.findPageById(id);
  }

  async searchPages(query: string, sourceId?: string, limit = 20) {
    return this.repository.searchPages(query, sourceId, limit);
  }

  // ============================================
  // 語意搜尋（RAG）
  // ============================================

  async semanticSearch(
    query: string,
    topK = 5,
    sourceId?: string
  ): Promise<
    Array<{
      page: CrawlSource | null;
      score: number;
      url: string;
      title: string;
      excerpt: string;
    }>
  > {
    // 產生查詢向量
    const embeddingResult = (await this.env.AI.run(
      '@cf/baai/bge-base-en-v1.5',
      { text: [query] },
      this.env.AI_GATEWAY_SLUG
        ? { gateway: { id: this.env.AI_GATEWAY_SLUG } }
        : undefined
    )) as { data: number[][] };

    if (!embeddingResult.data || embeddingResult.data.length === 0) {
      return [];
    }

    // 在 Vectorize 中搜尋
    const filter: Record<string, unknown> = { type: 'crawl' };
    if (sourceId) {
      filter.source_id = sourceId;
    }

    const matches = await this.env.VECTOR_INDEX.query(
      embeddingResult.data[0],
      {
        topK,
        filter,
        returnMetadata: 'all',
      }
    );

    // 取得完整頁面資料
    const results = [];
    for (const match of matches.matches) {
      const metadata = match.metadata as Record<string, string> | undefined;
      const pageId = metadata?.page_id;

      if (pageId) {
        const page = await this.repository.findPageById(pageId);
        results.push({
          page: null,
          score: match.score,
          url: metadata?.url || '',
          title: metadata?.title || '',
          excerpt: page?.content
            ? page.content.substring(0, 300) + '...'
            : '',
        });
      }
    }

    return results;
  }

  // ============================================
  // 工具函式
  // ============================================

  private async hashContent(content: string): Promise<string> {
    const data = new TextEncoder().encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  private truncateForEmbedding(text: string, maxChars: number): string {
    if (text.length <= maxChars) return text;
    return text.substring(0, maxChars);
  }
}
