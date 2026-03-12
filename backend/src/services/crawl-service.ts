import type {
  Env,
  CrawlConfig,
  CrawlSource,
  CloudflareCrawlJobResponse,
  CloudflareCrawlResultResponse,
  CloudflareCrawlPage,
} from '../types';
import { CrawlRepository } from '../repositories/crawl-repository';
import { generateId } from '../utils/id';

// 輪詢設定
const POLL_INTERVAL_MS = 3000;  // 3 秒
const MAX_POLL_ATTEMPTS = 100;  // 最多輪詢 100 次（約 5 分鐘）

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
  // 執行爬取（非同步 Job 流程）
  // ============================================

  /**
   * 執行完整爬取流程：
   * 1. POST 建立爬取 Job
   * 2. GET 輪詢直到完成
   * 3. 處理並儲存結果
   */
  async executeCrawl(sourceId: string): Promise<{
    jobId: string;
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

    try {
      // Step 1: 建立爬取 Job
      const jobId = await this.createCrawlJob(source.url, config);

      // Step 2: 輪詢等待結果
      const pages = await this.pollCrawlResults(jobId);

      // Step 3: 處理並儲存結果
      let newPages = 0;
      let updatedPages = 0;
      const errors: string[] = [];

      for (const page of pages) {
        if (page.status !== 'success' || !page.result) {
          if (page.error) {
            errors.push(`${page.url}: ${page.error}`);
          }
          continue;
        }

        try {
          const content = page.result;
          const contentHash = await this.hashContent(content);
          const wordCount = content.length;

          const result = await this.repository.upsertPage({
            id: generateId(),
            source_id: sourceId,
            url: page.url,
            title: null, // /crawl API 不回傳 title，由 content 中解析
            content,
            content_hash: contentHash,
            metadata: null,
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
      const successPages = pages.filter((p) => p.status === 'success').length;
      await this.repository.updateSourceCrawlResult(sourceId, successPages);

      return {
        jobId,
        pagesProcessed: successPages,
        newPages,
        updatedPages,
        errors,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      await this.repository.updateSourceCrawlResult(sourceId, 0, errorMsg);
      throw err;
    }
  }

  // ============================================
  // Cloudflare /crawl API 呼叫
  // ============================================

  /**
   * Step 1: POST 建立爬取 Job，回傳 Job ID
   */
  private async createCrawlJob(
    url: string,
    config: CrawlConfig
  ): Promise<string> {
    const accountId = this.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = this.env.CLOUDFLARE_API_TOKEN;

    if (!accountId || !apiToken) {
      throw new Error(
        'CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN are required for crawl API'
      );
    }

    const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering/crawl`;

    const body: Record<string, unknown> = {
      url,
      limit: config.limit || 10,
      depth: config.depth || 2,
      formats: config.formats || ['markdown'],
      render: config.render !== undefined ? config.render : false, // 預設 false（快速靜態抓取，不耗費 browser rendering 額度）
    };

    if (config.source) body.source = config.source;
    if (config.userAgent) body.userAgent = config.userAgent;
    if (config.rejectResourceTypes)
      body.rejectResourceTypes = config.rejectResourceTypes;

    if (config.includePatterns || config.excludePatterns) {
      body.options = {
        ...(config.includePatterns && {
          includePatterns: config.includePatterns,
        }),
        ...(config.excludePatterns && {
          excludePatterns: config.excludePatterns,
        }),
      };
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Cloudflare Crawl API error (${response.status}): ${errorText}`
      );
    }

    const data = (await response.json()) as CloudflareCrawlJobResponse;

    if (!data.success || !data.result?.id) {
      throw new Error('Cloudflare Crawl API did not return a job ID');
    }

    return data.result.id;
  }

  /**
   * Step 2: GET 輪詢爬取結果，支援 cursor 分頁
   */
  private async pollCrawlResults(
    jobId: string
  ): Promise<CloudflareCrawlPage[]> {
    const accountId = this.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = this.env.CLOUDFLARE_API_TOKEN;

    const baseUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering/crawl/${jobId}`;
    const allPages: CloudflareCrawlPage[] = [];

    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      // 等待後再輪詢
      await this.sleep(POLL_INTERVAL_MS);

      let cursor: string | undefined;
      let hasMore = true;

      // 用 cursor 分頁取得所有結果
      while (hasMore) {
        const url = cursor ? `${baseUrl}?cursor=${cursor}` : baseUrl;

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${apiToken}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Cloudflare Crawl API poll error (${response.status}): ${errorText}`
          );
        }

        const data =
          (await response.json()) as CloudflareCrawlResultResponse;

        if (!data.success) {
          throw new Error('Cloudflare Crawl API poll returned unsuccessful');
        }

        const { status, data: pages, cursor: nextCursor } = data.result;

        if (pages && pages.length > 0) {
          allPages.push(...pages);
        }

        // 檢查是否還有下一頁
        if (nextCursor) {
          cursor = nextCursor;
        } else {
          hasMore = false;
        }

        // 如果 job 已完成或取消，結束輪詢
        if (status !== 'running') {
          return allPages;
        }
      }
    }

    // 超過最大輪詢次數
    throw new Error(
      `Crawl job ${jobId} did not complete within ${MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS / 1000} seconds`
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
