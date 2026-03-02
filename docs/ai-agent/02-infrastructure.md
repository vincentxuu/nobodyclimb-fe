# 基礎設施設定

## 需要新增的 Cloudflare 服務

| 服務 | 用途 | 計費方式 |
|------|------|---------|
| Workers AI | Embedding + LLM 推論 | 免費 10,000 Neurons/日 |
| Vectorize | 向量資料庫 | 免費 5 索引，各 200K 向量 |
| AI Gateway | 可觀測性、快取、限流 | 免費 100K 日誌/月 |

## wrangler.toml 修改

### Preview 環境

```toml
# ============================================
# 測試環境 (Preview) - 新增 AI 設定
# ============================================

[env.preview]
# ... 現有設定 ...

# Workers AI Binding
[env.preview.ai]
binding = "AI"

# Vectorize Binding
[[env.preview.vectorize]]
binding = "VECTOR_INDEX"
index_name = "nobodyclimb-routes-preview"

# AI Gateway (可選，用於監控)
# 需要先在 Cloudflare Dashboard 建立 Gateway
[env.preview.vars]
# ... 現有變數 ...
AI_GATEWAY_SLUG = "nobodyclimb-preview"
```

### Production 環境

```toml
# ============================================
# 正式環境 (Production) - 新增 AI 設定
# ============================================

[env.production]
# ... 現有設定 ...

# Workers AI Binding
[env.production.ai]
binding = "AI"

# Vectorize Binding
[[env.production.vectorize]]
binding = "VECTOR_INDEX"
index_name = "nobodyclimb-routes"

# AI Gateway
[env.production.vars]
# ... 現有變數 ...
AI_GATEWAY_SLUG = "nobodyclimb"
```

## Vectorize 索引建立

### 使用 Wrangler CLI 建立索引

```bash
# Preview 環境 (使用 bge-m3 的 1024 維度)
wrangler vectorize create nobodyclimb-routes-preview \
  --dimensions 1024 \
  --metric cosine

# Production 環境
wrangler vectorize create nobodyclimb-routes \
  --dimensions 1024 \
  --metric cosine

# 建立 metadata 索引（用於過濾）
wrangler vectorize create-metadata-index nobodyclimb-routes \
  --property-name=grade_numeric --type=number
wrangler vectorize create-metadata-index nobodyclimb-routes \
  --property-name=crag --type=string
wrangler vectorize create-metadata-index nobodyclimb-routes \
  --property-name=type --type=string
```

### 索引設定說明

| 參數 | 值 | 說明 |
|------|-----|------|
| dimensions | 1024 | BGE-M3 輸出維度（支援多語言） |
| metric | cosine | 餘弦相似度，適合語義搜尋 |

## AI Gateway 設定

### 在 Cloudflare Dashboard 建立

1. 前往 Cloudflare Dashboard > AI > AI Gateway
2. 建立新的 Gateway:
   - Name: `nobodyclimb` (production)
   - Name: `nobodyclimb-preview` (preview)

### Gateway 功能

| 功能 | 說明 | 建議設定 |
|------|------|---------|
| 日誌記錄 | 記錄所有 AI 請求 | 啟用 |
| 快取 | 快取相同請求 | 啟用，TTL 1 小時 |
| 限流 | 防止濫用 | 100 req/min |
| 重試 | 自動重試失敗請求 | 3 次 |

## 資料庫 Migration

### 檔案: `backend/migrations/0031_create_ai_documents.sql`

```sql
-- AI 文件表
-- 儲存用於 RAG 的文件內容
CREATE TABLE IF NOT EXISTS ai_documents (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,                    -- route, crag, video, article
  source_id TEXT NOT NULL,               -- 原始實體 ID
  text TEXT NOT NULL,                    -- 完整文字用於 LLM context
  metadata TEXT,                         -- JSON metadata
  embedding_id TEXT,                     -- Vectorize 中的向量 ID
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_ai_documents_type ON ai_documents(type);
CREATE INDEX IF NOT EXISTS idx_ai_documents_source ON ai_documents(source_id);
CREATE INDEX IF NOT EXISTS idx_ai_documents_embedding ON ai_documents(embedding_id);

-- AI 查詢日誌表
-- 用於分析和改進 AI 回答品質
CREATE TABLE IF NOT EXISTS ai_query_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,                          -- 使用者 ID (可 NULL)
  query TEXT NOT NULL,                   -- 使用者問題
  response TEXT,                         -- AI 回答
  sources TEXT,                          -- JSON: 使用的來源文件 ID
  latency_ms INTEGER,                    -- 回應時間
  token_count INTEGER,                   -- 使用的 token 數
  feedback_score INTEGER,                -- 使用者評分 1-5
  feedback_text TEXT,                    -- 使用者回饋文字
  created_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_ai_query_logs_user ON ai_query_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_query_logs_created ON ai_query_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_query_logs_feedback ON ai_query_logs(feedback_score);
```

### 執行 Migration

```bash
# 本地測試
cd backend
pnpm db:migrate

# Preview 環境
pnpm db:migrate:remote --env preview

# Production 環境
pnpm db:migrate:remote --env production
```

## 型別定義更新

### 檔案: `backend/src/types.ts`

```typescript
// === 新增 AI 相關型別 ===

// Cloudflare AI Binding
export interface AI {
  run(
    model: string,
    inputs: Record<string, unknown>
  ): Promise<unknown>;
}

// Vectorize Types
export interface VectorizeIndex {
  query(
    vector: number[],
    options?: VectorizeQueryOptions
  ): Promise<VectorizeMatches>;

  insert(vectors: VectorizeVector[]): Promise<VectorizeInsertResult>;
  upsert(vectors: VectorizeVector[]): Promise<VectorizeUpsertResult>;
  deleteByIds(ids: string[]): Promise<VectorizeDeleteResult>;
  getByIds(ids: string[]): Promise<VectorizeVector[]>;
}

export interface VectorizeQueryOptions {
  topK?: number;
  filter?: Record<string, unknown>;
  returnValues?: boolean;
  returnMetadata?: boolean;
}

export interface VectorizeMatches {
  matches: VectorizeMatch[];
  count: number;
}

export interface VectorizeMatch {
  id: string;
  score: number;
  values?: number[];
  metadata?: Record<string, unknown>;
}

export interface VectorizeVector {
  id: string;
  values: number[];
  metadata?: Record<string, unknown>;
}

export interface VectorizeInsertResult {
  count: number;
}

export interface VectorizeUpsertResult {
  count: number;
}

export interface VectorizeDeleteResult {
  count: number;
}

// AI Document Types
export interface AIDocument {
  id: string;
  type: 'route' | 'crag' | 'video' | 'article';
  source_id: string;
  text: string;
  metadata: string | null;
  embedding_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIDocumentMetadata {
  // 共用欄位
  name?: string;
  region?: string;

  // 路線專用
  grade?: string;
  grade_numeric?: number;
  route_type?: string;
  crag_id?: string;
  crag_name?: string;

  // 岩場專用
  climbing_types?: string[];
  best_seasons?: string[];

  // 影片專用
  channel?: string;
  youtube_id?: string;
  category?: string;
}

// AI Query Types
export interface AIQueryLog {
  id: string;
  user_id: string | null;
  query: string;
  response: string | null;
  sources: string | null;
  latency_ms: number | null;
  token_count: number | null;
  feedback_score: number | null;
  feedback_text: string | null;
  created_at: string;
}

// AI API Request/Response Types
export interface AIAskRequest {
  query: string;
  limit?: number;           // 搜尋結果數量，預設 5
  include_sources?: boolean; // 是否回傳來源，預設 true
}

export interface AIAskResponse {
  answer: string;
  sources: AISource[];
  query_id: string;         // 用於回饋
}

export interface AISource {
  id: string;
  type: 'route' | 'crag' | 'video' | 'article';
  title: string;
  excerpt: string;
  url?: string;
  score: number;
}

export interface AISearchRequest {
  query: string;
  type?: 'route' | 'crag' | 'video' | 'article';
  limit?: number;
  filters?: {
    region?: string;
    grade_min?: number;
    grade_max?: number;
    route_type?: string;
  };
}

export interface AIFeedbackRequest {
  query_id: string;
  score: 1 | 2 | 3 | 4 | 5;
  text?: string;
}

// 更新 Env interface
export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  STORAGE: R2Bucket;
  ACCESS_LOGS: AnalyticsEngineDataset;
  CORS_ORIGIN: string;
  JWT_ISSUER: string;
  JWT_SECRET: string;
  R2_PUBLIC_URL: string;
  CWA_API_KEY: string;
  GOOGLE_CLIENT_ID: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_API_TOKEN?: string;

  // 新增 AI 相關 bindings
  AI: AI;
  VECTOR_INDEX: VectorizeIndex;
  AI_GATEWAY_SLUG?: string;
}
```

## 部署檢查清單

### 部署前

- [ ] 在 Cloudflare Dashboard 建立 AI Gateway
- [ ] 使用 wrangler 建立 Vectorize 索引
- [ ] 確認 wrangler.toml 已更新
- [ ] 執行資料庫 migration

### 部署後驗證

```bash
# 檢查 AI binding
curl https://api.nobodyclimb.cc/api/v1/ai/health

# 檢查 Vectorize 索引
wrangler vectorize list

# 查看 AI Gateway 日誌
# 在 Cloudflare Dashboard > AI > AI Gateway
```

## 環境變數

| 變數 | 環境 | 說明 |
|------|------|------|
| AI_GATEWAY_SLUG | both | AI Gateway 名稱 |
| AI_MAX_TOKENS | optional | LLM 最大 token 數 |
| AI_TEMPERATURE | optional | LLM 溫度參數 |
