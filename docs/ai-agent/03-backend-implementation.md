# 後端實作細節

## 新增檔案結構

```
backend/src/
├── routes/
│   └── ai.ts                    # AI API 路由
├── services/
│   ├── embedding.ts             # Embedding 服務
│   ├── indexing.ts              # 資料索引服務
│   └── query.ts                 # RAG 查詢服務
└── utils/
    └── ai-prompts.ts            # Prompt 模板
```

## API 端點設計

### 1. POST /api/v1/ai/ask - 主要 RAG 問答

```typescript
// backend/src/routes/ai.ts

import { Hono } from 'hono';
import { Env, AIAskRequest, AIAskResponse } from '../types';
import { authMiddleware } from '../middleware/auth';
import { QueryService } from '../services/query';

export const aiRoutes = new Hono<{ Bindings: Env }>();

// RAG 問答端點
aiRoutes.post('/ask', async (c) => {
  const body = await c.req.json<AIAskRequest>();

  if (!body.query || body.query.length < 2) {
    return c.json({
      success: false,
      error: 'Bad Request',
      message: '問題至少需要 2 個字元',
    }, 400);
  }

  const startTime = Date.now();
  const queryService = new QueryService(c.env);

  try {
    const response = await queryService.ask(body.query, {
      limit: body.limit || 5,
      includeSources: body.include_sources !== false,
    });

    const latencyMs = Date.now() - startTime;

    // 記錄查詢日誌
    await queryService.logQuery({
      query: body.query,
      response: response.answer,
      sources: response.sources,
      latencyMs,
      userId: c.get('userId') || null,
    });

    return c.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('AI Ask Error:', error);
    return c.json({
      success: false,
      error: 'AI Error',
      message: '無法處理您的問題，請稍後再試',
    }, 500);
  }
});
```

### 2. GET /api/v1/ai/search - 語義搜尋

```typescript
// 純語義搜尋（不經過 LLM）
aiRoutes.get('/search', async (c) => {
  const query = c.req.query('q');
  const type = c.req.query('type');
  const limit = parseInt(c.req.query('limit') || '10', 10);

  if (!query || query.length < 2) {
    return c.json({
      success: false,
      error: 'Bad Request',
      message: '搜尋詞至少需要 2 個字元',
    }, 400);
  }

  const queryService = new QueryService(c.env);

  try {
    const results = await queryService.search(query, {
      type: type as any,
      limit: Math.min(limit, 50),
    });

    return c.json({
      success: true,
      data: results,
      query,
    });
  } catch (error) {
    console.error('AI Search Error:', error);
    return c.json({
      success: false,
      error: 'Search Error',
      message: '搜尋失敗，請稍後再試',
    }, 500);
  }
});
```

### 3. POST /api/v1/ai/index - 管理員索引端點

```typescript
// 管理員：重建索引
aiRoutes.post('/index', authMiddleware, adminMiddleware, async (c) => {
  const body = await c.req.json<{
    type?: 'route' | 'crag' | 'video' | 'all';
    reindex?: boolean;
  }>();

  const indexingService = new IndexingService(c.env);

  try {
    const type = body.type || 'all';
    const reindex = body.reindex || false;

    if (reindex) {
      await indexingService.reindexAll(type);
    } else {
      await indexingService.indexNew(type);
    }

    return c.json({
      success: true,
      message: `${type} 索引完成`,
    });
  } catch (error) {
    console.error('Indexing Error:', error);
    return c.json({
      success: false,
      error: 'Indexing Error',
      message: '索引失敗',
    }, 500);
  }
});
```

### 4. POST /api/v1/ai/feedback - 使用者回饋

```typescript
// 使用者回饋
aiRoutes.post('/feedback', async (c) => {
  const body = await c.req.json<AIFeedbackRequest>();

  if (!body.query_id || !body.score || body.score < 1 || body.score > 5) {
    return c.json({
      success: false,
      error: 'Bad Request',
      message: '無效的回饋資料',
    }, 400);
  }

  try {
    await c.env.DB.prepare(`
      UPDATE ai_query_logs
      SET feedback_score = ?, feedback_text = ?
      WHERE id = ?
    `).bind(body.score, body.text || null, body.query_id).run();

    return c.json({
      success: true,
      message: '感謝您的回饋',
    });
  } catch (error) {
    console.error('Feedback Error:', error);
    return c.json({
      success: false,
      error: 'Feedback Error',
      message: '回饋提交失敗',
    }, 500);
  }
});

// Health check
aiRoutes.get('/health', async (c) => {
  try {
    // 測試 AI binding
    const test = await c.env.AI.run('@cf/baai/bge-m3', {
      text: 'test',
    });

    return c.json({
      success: true,
      status: 'healthy',
      ai: !!test,
    });
  } catch (error) {
    return c.json({
      success: false,
      status: 'unhealthy',
      error: (error as Error).message,
    }, 500);
  }
});
```

## Embedding 服務

```typescript
// backend/src/services/embedding.ts

import { Env } from '../types';

export class EmbeddingService {
  private env: Env;
  private model = '@cf/baai/bge-m3';  // 1024 維度，支援多語言

  constructor(env: Env) {
    this.env = env;
  }

  // 單一文字 embedding
  async embed(text: string): Promise<number[]> {
    const response = await this.env.AI.run(this.model, {
      text: [text],
    }) as { data: number[][] };

    return response.data[0];
  }

  // 批次 embedding
  async embedBatch(texts: string[]): Promise<number[][]> {
    // Workers AI 批次限制：100 個文字
    const batchSize = 100;
    const results: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const response = await this.env.AI.run(this.model, {
        text: batch,
      }) as { data: number[][] };

      results.push(...response.data);
    }

    return results;
  }
}
```

## 索引服務

```typescript
// backend/src/services/indexing.ts

import { Env, AIDocument, AIDocumentMetadata, Route, Crag } from '../types';
import { EmbeddingService } from './embedding';
import { generateId } from '../utils/id';

export class IndexingService {
  private env: Env;
  private embeddingService: EmbeddingService;

  constructor(env: Env) {
    this.env = env;
    this.embeddingService = new EmbeddingService(env);
  }

  // 索引所有路線
  async indexRoutes(): Promise<number> {
    const routes = await this.env.DB.prepare(`
      SELECT r.*, c.name as crag_name, c.region
      FROM routes r
      JOIN crags c ON r.crag_id = c.id
    `).all<Route & { crag_name: string; region: string }>();

    const documents = routes.results.map((route) =>
      this.createRouteDocument(route)
    );

    await this.indexDocuments(documents);
    return documents.length;
  }

  // 建立路線文件
  private createRouteDocument(
    route: Route & { crag_name: string; region: string }
  ): Omit<AIDocument, 'id' | 'embedding_id' | 'created_at' | 'updated_at'> {
    const text = `
路線名稱：${route.name}
所屬岩場：${route.crag_name}
難度等級：${route.grade || '未知'}
路線類型：${route.route_type}
路線長度：${route.height ? `${route.height}米` : '未知'}
bolt 數量：${route.bolt_count || '未知'}
描述：${route.description || '無描述'}
地區：${route.region || '未知'}
首攀資訊：${route.first_ascent || '無資料'}
    `.trim();

    const metadata: AIDocumentMetadata = {
      name: route.name,
      grade: route.grade || undefined,
      grade_numeric: this.gradeToNumeric(route.grade),
      route_type: route.route_type,
      crag_id: route.crag_id,
      crag_name: route.crag_name,
      region: route.region,
    };

    return {
      type: 'route',
      source_id: route.id,
      text,
      metadata: JSON.stringify(metadata),
    };
  }

  // 索引所有岩場
  async indexCrags(): Promise<number> {
    const crags = await this.env.DB.prepare(`
      SELECT * FROM crags
    `).all<Crag>();

    const documents = crags.results.map((crag) =>
      this.createCragDocument(crag)
    );

    await this.indexDocuments(documents);
    return documents.length;
  }

  // 建立岩場文件
  private createCragDocument(
    crag: Crag
  ): Omit<AIDocument, 'id' | 'embedding_id' | 'created_at' | 'updated_at'> {
    const climbingTypes = crag.climbing_types
      ? JSON.parse(crag.climbing_types).join('、')
      : '未知';
    const bestSeasons = crag.best_seasons
      ? JSON.parse(crag.best_seasons).join('、')
      : '未知';

    const text = `
岩場名稱：${crag.name}
地區：${crag.region || '未知'}
位置：${crag.location || '未知'}
海拔：${crag.altitude ? `${crag.altitude}米` : '未知'}
岩石類型：${crag.rock_type || '未知'}
攀岩類型：${climbingTypes}
難度範圍：${crag.difficulty_range || '未知'}
路線數量：${crag.route_count}
接近時間：${crag.approach_time ? `${crag.approach_time}分鐘` : '未知'}
交通資訊：${crag.access_info || '無資料'}
停車資訊：${crag.parking_info || '無資料'}
最佳季節：${bestSeasons}
描述：${crag.description || '無描述'}
    `.trim();

    const metadata: AIDocumentMetadata = {
      name: crag.name,
      region: crag.region || undefined,
      climbing_types: crag.climbing_types
        ? JSON.parse(crag.climbing_types)
        : undefined,
      best_seasons: crag.best_seasons
        ? JSON.parse(crag.best_seasons)
        : undefined,
    };

    return {
      type: 'crag',
      source_id: crag.id,
      text,
      metadata: JSON.stringify(metadata),
    };
  }

  // 批次索引文件
  private async indexDocuments(
    docs: Omit<AIDocument, 'id' | 'embedding_id' | 'created_at' | 'updated_at'>[]
  ): Promise<void> {
    // 1. 生成 embeddings
    const texts = docs.map((d) => d.text);
    const embeddings = await this.embeddingService.embedBatch(texts);

    // 2. 插入到 Vectorize 和 D1
    const vectors = [];
    const dbInserts = [];

    for (let i = 0; i < docs.length; i++) {
      const id = generateId();
      const doc = docs[i];
      const embedding = embeddings[i];

      vectors.push({
        id,
        values: embedding,
        metadata: doc.metadata ? JSON.parse(doc.metadata) : {},
      });

      dbInserts.push({
        id,
        type: doc.type,
        source_id: doc.source_id,
        text: doc.text,
        metadata: doc.metadata,
        embedding_id: id,
      });
    }

    // 3. 插入 Vectorize
    await this.env.VECTOR_INDEX.upsert(vectors);

    // 4. 批次插入 D1
    const stmt = this.env.DB.prepare(`
      INSERT INTO ai_documents (id, type, source_id, text, metadata, embedding_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const batch = dbInserts.map((doc) =>
      stmt.bind(doc.id, doc.type, doc.source_id, doc.text, doc.metadata, doc.embedding_id)
    );

    await this.env.DB.batch(batch);
  }

  // 難度轉數值（用於過濾）
  private gradeToNumeric(grade: string | null): number | undefined {
    if (!grade) return undefined;

    // YDS 轉換 (5.5 = 55, 5.10a = 100, 5.14d = 144)
    const match = grade.match(/5\.(\d+)([a-d])?/);
    if (match) {
      const base = parseInt(match[1], 10) * 10;
      const suffix = match[2] ? 'abcd'.indexOf(match[2]) : 0;
      return base + suffix;
    }

    return undefined;
  }

  // 重建所有索引
  async reindexAll(type: 'route' | 'crag' | 'video' | 'all' = 'all'): Promise<void> {
    // 1. 清除現有資料
    if (type === 'all' || type === 'route') {
      await this.clearType('route');
    }
    if (type === 'all' || type === 'crag') {
      await this.clearType('crag');
    }
    if (type === 'all' || type === 'video') {
      await this.clearType('video');
    }

    // 2. 重新索引
    if (type === 'all' || type === 'route') {
      await this.indexRoutes();
    }
    if (type === 'all' || type === 'crag') {
      await this.indexCrags();
    }
    // TODO: indexVideos
  }

  private async clearType(type: string): Promise<void> {
    // 取得所有該類型的 embedding_id
    const docs = await this.env.DB.prepare(`
      SELECT embedding_id FROM ai_documents WHERE type = ?
    `).bind(type).all<{ embedding_id: string }>();

    // 從 Vectorize 刪除
    const ids = docs.results.map((d) => d.embedding_id);
    if (ids.length > 0) {
      await this.env.VECTOR_INDEX.deleteByIds(ids);
    }

    // 從 D1 刪除
    await this.env.DB.prepare(`
      DELETE FROM ai_documents WHERE type = ?
    `).bind(type).run();
  }
}
```

## 查詢服務

```typescript
// backend/src/services/query.ts

import { Env, AIAskResponse, AISource, AIDocument } from '../types';
import { EmbeddingService } from './embedding';
import { generateId } from '../utils/id';
import { SYSTEM_PROMPT, QUERY_TEMPLATE } from '../utils/ai-prompts';

interface QueryOptions {
  limit?: number;
  includeSources?: boolean;
  type?: 'route' | 'crag' | 'video' | 'article';
  filters?: {
    region?: string;
    grade_min?: number;
    grade_max?: number;
  };
}

export class QueryService {
  private env: Env;
  private embeddingService: EmbeddingService;
  private llmModel = '@cf/meta/llama-3.1-8b-instruct';

  constructor(env: Env) {
    this.env = env;
    this.embeddingService = new EmbeddingService(env);
  }

  async ask(query: string, options: QueryOptions = {}): Promise<AIAskResponse> {
    const limit = options.limit || 5;

    // 1. 檢查快取
    const cacheKey = `ai:ask:${this.hashQuery(query)}`;
    const cached = await this.env.CACHE.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // 2. 向量搜尋
    const queryEmbedding = await this.embeddingService.embed(query);
    const vectorResults = await this.env.VECTOR_INDEX.query(queryEmbedding, {
      topK: limit,
      filter: this.buildFilter(options),
      returnMetadata: true,
    });

    // 3. 取得完整文件
    const docIds = vectorResults.matches.map((m) => m.id);
    const documents = await this.getDocuments(docIds);

    // 4. 建立 context
    const context = documents.map((d) => d.text).join('\n\n---\n\n');

    // 5. 呼叫 LLM
    const prompt = QUERY_TEMPLATE
      .replace('{context}', context)
      .replace('{query}', query);

    const llmResponse = await this.env.AI.run(this.llmModel, {
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1024,
      temperature: 0.7,
    }) as { response: string };

    // 6. 建立來源
    const sources: AISource[] = options.includeSources !== false
      ? documents.map((doc, i) => ({
          id: doc.id,
          type: doc.type,
          title: this.extractTitle(doc),
          excerpt: doc.text.slice(0, 150) + '...',
          url: this.buildUrl(doc),
          score: vectorResults.matches[i].score,
        }))
      : [];

    // 7. 建立回應
    const queryId = generateId();
    const response: AIAskResponse = {
      answer: llmResponse.response,
      sources,
      query_id: queryId,
    };

    // 8. 快取結果
    await this.env.CACHE.put(cacheKey, JSON.stringify(response), {
      expirationTtl: 3600, // 1 小時
    });

    return response;
  }

  async search(
    query: string,
    options: QueryOptions = {}
  ): Promise<AISource[]> {
    const limit = options.limit || 10;

    // 1. 向量搜尋
    const queryEmbedding = await this.embeddingService.embed(query);
    const vectorResults = await this.env.VECTOR_INDEX.query(queryEmbedding, {
      topK: limit,
      filter: this.buildFilter(options),
      returnMetadata: true,
    });

    // 2. 取得完整文件
    const docIds = vectorResults.matches.map((m) => m.id);
    const documents = await this.getDocuments(docIds);

    // 3. 建立結果
    return documents.map((doc, i) => ({
      id: doc.id,
      type: doc.type,
      title: this.extractTitle(doc),
      excerpt: doc.text.slice(0, 200) + '...',
      url: this.buildUrl(doc),
      score: vectorResults.matches[i].score,
    }));
  }

  async logQuery(data: {
    query: string;
    response: string;
    sources: AISource[];
    latencyMs: number;
    userId: string | null;
  }): Promise<void> {
    const id = generateId();
    await this.env.DB.prepare(`
      INSERT INTO ai_query_logs (id, user_id, query, response, sources, latency_ms)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      data.userId,
      data.query,
      data.response,
      JSON.stringify(data.sources),
      data.latencyMs
    ).run();
  }

  private async getDocuments(ids: string[]): Promise<AIDocument[]> {
    if (ids.length === 0) return [];

    const placeholders = ids.map(() => '?').join(', ');
    const result = await this.env.DB.prepare(`
      SELECT * FROM ai_documents WHERE id IN (${placeholders})
    `).bind(...ids).all<AIDocument>();

    // 保持原順序
    const docMap = new Map(result.results.map((d) => [d.id, d]));
    return ids.map((id) => docMap.get(id)!).filter(Boolean);
  }

  private buildFilter(options: QueryOptions): Record<string, unknown> | undefined {
    const filters: Record<string, unknown> = {};

    if (options.type) {
      filters.type = options.type;
    }

    if (options.filters?.region) {
      filters.region = options.filters.region;
    }

    // Vectorize filter 語法
    if (options.filters?.grade_min || options.filters?.grade_max) {
      if (options.filters.grade_min) {
        filters.grade_numeric = { $gte: options.filters.grade_min };
      }
      if (options.filters.grade_max) {
        filters.grade_numeric = {
          ...filters.grade_numeric as object,
          $lte: options.filters.grade_max,
        };
      }
    }

    return Object.keys(filters).length > 0 ? filters : undefined;
  }

  private extractTitle(doc: AIDocument): string {
    const metadata = doc.metadata ? JSON.parse(doc.metadata) : {};
    return metadata.name || `${doc.type}-${doc.source_id}`;
  }

  private buildUrl(doc: AIDocument): string | undefined {
    const metadata = doc.metadata ? JSON.parse(doc.metadata) : {};

    switch (doc.type) {
      case 'route':
        return `/crags/${metadata.crag_id}/routes/${doc.source_id}`;
      case 'crag':
        return `/crags/${doc.source_id}`;
      case 'video':
        return metadata.youtube_id
          ? `https://youtube.com/watch?v=${metadata.youtube_id}`
          : undefined;
      default:
        return undefined;
    }
  }

  private hashQuery(query: string): string {
    // 簡單的 hash 函式
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}
```

## Prompt 模板

```typescript
// backend/src/utils/ai-prompts.ts

export const SYSTEM_PROMPT = `你是 NobodyClimb 攀岩社群平台的 AI 助手。你的任務是根據提供的資料，回答使用者關於台灣攀岩的問題。

回答原則：
1. 只根據提供的資料回答，不要編造資訊
2. 如果資料不足以回答問題，請誠實告知
3. 使用繁體中文回答
4. 提供具體的路線名稱、難度、位置等資訊
5. 如果適合，推薦相關的影片或文章
6. 回答要簡潔有用，避免冗長

你擁有的資料包括：
- 台灣各地的戶外岩場資訊
- 各岩場的攀岩路線資料
- 攀岩相關的 YouTube 影片

請簡潔、準確地回答使用者的問題。`;

export const QUERY_TEMPLATE = `根據以下資料回答使用者的問題：

---
{context}
---

使用者問題：{query}

請根據上述資料提供準確的回答。如果資料中沒有相關資訊，請告知使用者。`;
```

## 註冊路由

```typescript
// backend/src/index.ts (修改)

// 新增 import
import { aiRoutes } from './routes/ai';

// 在 v1 routes 區塊新增
v1.route('/ai', aiRoutes);
```

## 測試範例

### 使用 curl 測試

```bash
# Health check
curl https://api.nobodyclimb.cc/api/v1/ai/health

# 問答
curl -X POST https://api.nobodyclimb.cc/api/v1/ai/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "北部有什麼適合初學者的岩場？"}'

# 語義搜尋
curl "https://api.nobodyclimb.cc/api/v1/ai/search?q=5.10%20路線"

# 回饋
curl -X POST https://api.nobodyclimb.cc/api/v1/ai/feedback \
  -H "Content-Type: application/json" \
  -d '{"query_id": "xxx", "score": 5, "text": "很有幫助！"}'
```

### Wrangler 本地測試

```bash
cd backend
wrangler dev --local

# 在另一個終端測試
curl http://localhost:8787/api/v1/ai/health
```
