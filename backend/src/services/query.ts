import { Env, AIAskRequest, AIAskResponse, AISearchRequest, AISource, AIDocument, AIDocumentMetadata } from '../types';
import { EmbeddingService } from './embedding';
import { SYSTEM_PROMPT, QUERY_TEMPLATE } from '../utils/ai-prompts';

const CACHE_TTL = 3600; // 1 小時
const DEFAULT_TOP_K = 5;
const MIN_SCORE = 0.5;
const DEFAULT_LLM_MODEL = '@cf/meta/llama-3.1-8b-instruct';

interface LLMResponse {
  response: string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

interface SearchResult {
  id: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export class QueryService {
  private embeddingService: EmbeddingService;

  constructor(private env: Env) {
    this.embeddingService = new EmbeddingService(env);
  }

  // 從 query 中偵測岩場區域/岩場/地區，查 DB 回傳匹配資訊
  async extractLocationFilter(query: string): Promise<{ cragId?: string; areaId?: string; region?: string }> {
    // 1. 優先比對區域名稱（最精確，如「校門口」「鐘塔」）
    const areas = await this.env.DB.prepare(
      'SELECT id, name FROM areas WHERE name IS NOT NULL'
    ).all<{ id: string; name: string }>();
    for (const area of areas.results) {
      if (query.includes(area.name)) {
        return { areaId: area.id };
      }
    }

    // 2. 再比對岩場名稱（如「龍洞」「墾丁」）
    const crags = await this.env.DB.prepare(
      'SELECT id, name, region FROM crags WHERE name IS NOT NULL'
    ).all<{ id: string; name: string; region: string | null }>();
    for (const crag of crags.results) {
      if (query.includes(crag.name)) {
        return { cragId: crag.id };
      }
    }

    // 3. 最後比對地區名稱（如「花蓮」「北部」）
    const regions = [...new Set(crags.results.map((c) => c.region).filter(Boolean))] as string[];
    for (const region of regions) {
      if (query.includes(region)) {
        return { region };
      }
    }

    return {};
  }

  // 從 query 文字中偵測 YDS 難度，回傳 Vectorize grade_numeric 範圍
  extractGradeFilter(query: string): { $gte: number; $lte: number } | null {
    const match = query.match(/5\.(\d+)([a-d])?/i);
    if (!match) return null;
    const base = parseInt(match[1], 10) * 10;
    if (match[2]) {
      const suffix = 'abcd'.indexOf(match[2].toLowerCase());
      const numeric = base + suffix;
      return { $gte: numeric, $lte: numeric };
    }
    return { $gte: base, $lte: base + 3 };
  }

  // 完整 RAG 流程：embed → search → retrieve → generate
  async ask(request: AIAskRequest, userId?: string): Promise<AIAskResponse> {
    const { query, limit = DEFAULT_TOP_K, include_sources = true } = request;

    // 檢查快取
    const cacheKey = `ai:ask:${this.hashQuery(query)}`;
    const cached = await this.env.CACHE.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as AIAskResponse;
    }

    const startTime = Date.now();

    // 1. query 轉向量
    const queryVector = await this.embeddingService.embed(query);

    // 偵測 query 中的難度、區域、岩場、地區關鍵字，自動過濾向量搜尋結果
    const gradeFilter = this.extractGradeFilter(query);
    const { cragId, areaId, region } = await this.extractLocationFilter(query);
    const typeFilter = this.extractTypeFilter(query);

    const vectorFilter: Record<string, unknown> = {};
    if (gradeFilter) vectorFilter['grade_numeric'] = gradeFilter;
    if (areaId) {
      // 指定區域 → 一定是找路線（區域是岩場的子分區，必定對應路線）
      vectorFilter['area_id'] = { $eq: areaId };
      vectorFilter['type'] = { $eq: 'route' };
    } else if (cragId) {
      // 指定岩場 → 依 typeFilter 判斷意圖（可能問岩場資訊或路線）
      vectorFilter['crag_id'] = { $eq: cragId };
      if (typeFilter) vectorFilter['type'] = { $eq: typeFilter };
    } else if (region) {
      // 指定地區 → 依 typeFilter 判斷意圖
      vectorFilter['region'] = { $eq: region };
      if (typeFilter) vectorFilter['type'] = { $eq: typeFilter };
    } else {
      // 無位置過濾 → 用 typeFilter 判斷意圖，避免混入不相關文件類型
      if (typeFilter) vectorFilter['type'] = { $eq: typeFilter };
    }

    // 2. Vectorize 向量搜尋（依偵測到的條件加 metadata filter）
    const searchResults = await this.env.VECTOR_INDEX.query(queryVector, {
      topK: limit,
      returnMetadata: 'all',
      filter: Object.keys(vectorFilter).length > 0 ? vectorFilter : undefined,
    });

    // 過濾低分結果
    const relevantMatches = searchResults.matches.filter((m) => m.score >= MIN_SCORE);

    // 3. 從 D1 取得完整文字
    const documents = await this.getDocuments(relevantMatches.map((m) => m.id));

    // 4. 組合 sources
    const sources: AISource[] = relevantMatches
      .map((match) => {
        const doc = documents.get(match.id);
        if (!doc) return null;
        const meta = doc.metadata ? (JSON.parse(doc.metadata) as AIDocumentMetadata) : {};
        return {
          id: doc.source_id,
          type: doc.type,
          title: this.extractTitle(doc),
          excerpt: doc.text.slice(0, 120).replace(/\n/g, ' '),
          url: this.buildUrl(doc),
          score: match.score,
        } as AISource;
      })
      .filter((s): s is AISource => s !== null);

    // 5. LLM 生成回答
    const context = documents.size > 0
      ? Array.from(documents.values()).map((d) => d.text).join('\n\n---\n\n')
      : '目前沒有找到相關資料。';

    const prompt = QUERY_TEMPLATE
      .replace('{context}', context)
      .replace('{query}', query);

    const llmModelRow = await this.env.DB.prepare(
      `SELECT value FROM ai_config WHERE key = 'llm_model'`
    ).first<{ value: string }>();
    const llmModel = llmModelRow?.value ?? DEFAULT_LLM_MODEL;

    const gatewayOptions = this.env.AI_GATEWAY_SLUG
      ? { gateway: { id: this.env.AI_GATEWAY_SLUG } }
      : undefined;

    const llmResult = (await this.env.AI.run(
      llmModel as Parameters<typeof this.env.AI.run>[0],
      {
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
      },
      gatewayOptions
    )) as LLMResponse;

    const answer = llmResult.response ?? '抱歉，無法生成回答，請稍後再試。';
    const latencyMs = Date.now() - startTime;

    // Workers AI binding 不回傳 usage，用字元長度估算 token 數
    // 中英混合約每 2 字元 = 1 token
    const estimatedTokens = Math.ceil(
      (SYSTEM_PROMPT.length + prompt.length + answer.length) / 2
    );
    const tokenCount = llmResult.usage?.total_tokens ?? estimatedTokens;

    // 6. 記錄查詢日誌
    const queryId = await this.logQuery({
      userId: userId ?? null,
      query,
      response: answer,
      sources: include_sources ? sources : [],
      latencyMs,
      tokenCount,
    });

    const response: AIAskResponse = {
      answer,
      sources: include_sources ? sources : [],
      query_id: queryId,
    };

    // 7. 快取結果
    await this.env.CACHE.put(cacheKey, JSON.stringify(response), {
      expirationTtl: CACHE_TTL,
    });

    return response;
  }

  // 純語義搜尋（不呼叫 LLM）
  async search(request: AISearchRequest): Promise<{ results: AISource[]; count: number }> {
    const { query, limit = DEFAULT_TOP_K } = request;

    const queryVector = await this.embeddingService.embed(query);
    const filter = this.buildFilter(request);

    const searchResults = await this.env.VECTOR_INDEX.query(queryVector, {
      topK: Math.min(limit, 50),
      filter: Object.keys(filter).length > 0 ? filter : undefined,
      returnMetadata: 'all',
    });

    const relevantMatches = searchResults.matches.filter((m) => m.score >= MIN_SCORE);
    const documents = await this.getDocuments(relevantMatches.map((m) => m.id));

    const results: AISource[] = relevantMatches
      .map((match) => {
        const doc = documents.get(match.id);
        if (!doc) return null;
        return {
          id: doc.source_id,
          type: doc.type,
          title: this.extractTitle(doc),
          excerpt: doc.text.slice(0, 120).replace(/\n/g, ' '),
          url: this.buildUrl(doc),
          score: match.score,
        } as AISource;
      })
      .filter((s): s is AISource => s !== null);

    return { results, count: results.length };
  }

  // 建立 Vectorize metadata 過濾條件
  buildFilter(request: AISearchRequest): Record<string, unknown> {
    const filter: Record<string, unknown> = {};

    if (request.type) {
      filter['type'] = { $eq: request.type };
    }
    if (request.filters?.crag_id) {
      filter['crag_id'] = { $eq: request.filters.crag_id };
    }
    if (request.filters?.route_type) {
      filter['route_type'] = { $eq: request.filters.route_type };
    }
    if (request.filters?.grade_min !== undefined || request.filters?.grade_max !== undefined) {
      const gradeFilter: Record<string, number> = {};
      if (request.filters?.grade_min !== undefined) {
        gradeFilter['$gte'] = request.filters.grade_min;
      }
      if (request.filters?.grade_max !== undefined) {
        gradeFilter['$lte'] = request.filters.grade_max;
      }
      filter['grade_numeric'] = gradeFilter;
    }

    return filter;
  }

  // 從 query 文字偵測使用者意圖，回傳適合的文件類型過濾（'crag' | 'route' | null）
  // 原則：若明確詢問岩場資訊（無路線意圖） → 'crag'；明確詢問路線 → 'route'；混合/不明 → null
  extractTypeFilter(query: string): 'crag' | 'route' | null {
    const cragKeywords = ['岩場', '攀岩場', '岩區', '岩壁', '介紹', '哪些岩場', '台灣岩場'];
    const routeKeywords = ['路線', '幾條', '多少條', '5.', 'V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', '難度', '幾級', '幾b', '幾c'];

    const hasCragIntent = cragKeywords.some((k) => query.includes(k));
    const hasRouteIntent = routeKeywords.some((k) => query.includes(k));

    if (hasCragIntent && !hasRouteIntent) return 'crag';
    if (hasRouteIntent && !hasCragIntent) return 'route';
    return null;
  }

  // 從 D1 批次取得文件
  async getDocuments(ids: string[]): Promise<Map<string, AIDocument>> {
    const result = new Map<string, AIDocument>();
    if (ids.length === 0) return result;

    const placeholders = ids.map(() => '?').join(', ');
    const docs = await this.env.DB.prepare(
      `SELECT * FROM ai_documents WHERE embedding_id IN (${placeholders})`
    )
      .bind(...ids)
      .all<AIDocument>();

    for (const doc of docs.results) {
      result.set(doc.embedding_id ?? doc.id, doc);
    }
    return result;
  }

  // 從文件中提取標題
  extractTitle(doc: AIDocument): string {
    const firstLine = doc.text.split('\n')[0];
    return firstLine.replace(/^路線名稱：|^岩場名稱：/, '').trim() || doc.source_id;
  }

  // 依文件類型建立 URL
  buildUrl(doc: AIDocument): string | undefined {
    if (doc.type === 'route') {
      const meta = doc.metadata ? (JSON.parse(doc.metadata) as AIDocumentMetadata) : {};
      if (meta.crag_id) {
        return `/crag/${meta.crag_id}/route/${doc.source_id}`;
      }
      return undefined;
    }
    if (doc.type === 'crag') {
      return `/crag/${doc.source_id}`;
    }
    if (doc.type === 'video') {
      const meta = doc.metadata ? (JSON.parse(doc.metadata) as AIDocumentMetadata) : {};
      if (meta.youtube_id) {
        return `https://youtube.com/watch?v=${meta.youtube_id}`;
      }
    }
    return undefined;
  }

  // 記錄查詢日誌，回傳 query_id
  async logQuery(params: {
    userId: string | null;
    query: string;
    response: string;
    sources: AISource[];
    latencyMs: number;
    tokenCount: number | null;
  }): Promise<string> {
    const id = crypto.randomUUID();
    try {
      await this.env.DB.prepare(`
        INSERT INTO ai_query_logs (id, user_id, query, response, sources, latency_ms, token_count)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
        .bind(
          id,
          params.userId,
          params.query,
          params.response,
          JSON.stringify(params.sources),
          params.latencyMs,
          params.tokenCount
        )
        .run();
    } catch (error) {
      console.error('Failed to log AI query:', error);
    }
    return id;
  }

  // 生成查詢快取鍵（簡單雜湊）
  hashQuery(query: string): string {
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 轉為 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}
