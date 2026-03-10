# RAG-as-a-Service 服務規劃文件

> 基於 NobodyClimb AI RAG 系統的 SaaS 化方案
>
> 版本：v0.1  日期：2026-03-10

---

## 目錄

1. [服務概覽](#1-服務概覽)
2. [核心能力盤點](#2-核心能力盤點)
3. [目標客戶與使用場景](#3-目標客戶與使用場景)
4. [產品功能模組](#4-產品功能模組)
5. [多租戶架構設計](#5-多租戶架構設計)
6. [API 設計](#6-api-設計)
7. [Admin Dashboard 規格](#7-admin-dashboard-規格)
8. [定價方案](#8-定價方案)
9. [技術架構](#9-技術架構)
10. [實作路線圖](#10-實作路線圖)
11. [商業模式分析](#11-商業模式分析)

---

## 1. 服務概覽

### 1.1 服務定義

**RAGKit** 是一個基於 Cloudflare 全球邊緣運算的 RAG-as-a-Service 平台，讓開發者和企業無需自行建構複雜的 AI 知識庫問答系統，即可透過 Embed Widget 或 API 整合到任何產品中。

核心主張：
- **3 分鐘上線**：貼上一段 `<script>` 標籤，即可在任何網站嵌入智慧問答 Widget
- **零基礎設施煩惱**：Vectorize、LLM、KV Cache、FTS 全部由平台代管
- **開箱即用的 Admin**：內建知識庫管理、費用監控、對話記錄、Prompt 版本控制

### 1.2 來源系統

NobodyClimb 已實作的 AI 系統是本服務的核心原型，包含：

| 組件 | 現有實作位置 | 成熟度 |
|------|------------|--------|
| RAG Pipeline（14 步驟）| `backend/src/services/pipeline/` | ★★★★★ |
| Hybrid Search（Vector + BM25） | `backend/src/services/query/retrieval.ts` | ★★★★★ |
| Chat Widget UI | `apps/web/src/components/ai/ChatWidget.tsx` | ★★★★☆ |
| Admin Dashboard | `apps/web/src/app/admin/ai/` | ★★★★☆ |
| 輸入安全防護 | `backend/src/utils/guardrails.ts` | ★★★★★ |
| 配額與計費追蹤 | `backend/src/routes/ai.ts` | ★★★★☆ |
| 語意快取 | `backend/src/services/pipeline/` | ★★★★☆ |
| Text-to-SQL | `backend/src/services/text-to-sql.ts` | ★★★☆☆ |

---

## 2. 核心能力盤點

### 2.1 RAG Pipeline 引擎

目前 NobodyClimb 實作了業界 Gen 3 等級的模組化 14 步驟 Pipeline：

```
Query Input
    │
    ▼
[1] Tool Selection          ← LLM 自適應路由（6 種工具）
    │
    ▼
[2] Semantic Cache          ← 0.95 相似度門檻，避免重複計算
    │
    ▼
[3] Query Embedding         ← @cf/baai/bge-m3（1024 維）
    │
    ▼
[4] Filter Build            ← LLM 從自然語言提取結構化過濾條件
    │
    ├─────────────────────┐
    ▼                     ▼
[5a] Vector Search      [5b] BM25 FTS
    │                     │
    └────────┬────────────┘
             ▼
[6] RRF Fusion              ← Reciprocal Rank Fusion 混合排序
    │
    ▼
[7] MMR Diversity           ← Maximal Marginal Relevance 多樣性
    │
    ▼
[8] HyDE                    ← Hypothetical Document Embedding
    │
    ▼
[9] Multi-Query Expansion   ← LLM 擴展 3 個子問題
    │
    ▼
[10] Cross-Encoder Rerank   ← 精排序 + 相關性門檻過濾
    │
    ▼
[11] Popularity Rerank      ← 業務相關性加權（可自訂）
    │
    ▼
[12] LLM Generation         ← Gemma-3-12b-it / Llama-3.1-8b
    │
    ▼
[13] Self-Reflection Judge  ← 雙層評估（groundedness + quality）
    │  （品質不足則 loop back）
    ▼
[14] Response Output        ← SSE Streaming
```

**可抽象化的關鍵設計**：
- 每個步驟可透過 DB config 動態啟用/停用
- 每個步驟有 `requires`/`provides` 依賴驗證
- 配置完全 DB 驅動，無需重新部署即可調整

### 2.2 安全防護層

```
輸入層（36 種 Prompt Injection 模式）
    + 11 種 Jailbreak 模式
    + 系統 Prompt 洩露防護
    + IP 速率限制（20 req/min）
    + 配額強制執行（按 Tier 每日限額）
```

### 2.3 快取策略

| 層次 | 機制 | 命中條件 | TTL |
|------|------|---------|-----|
| L1 語意快取 | 向量相似度 | cosine ≥ 0.95 | 可配置 |
| L2 KV 快取 | 精確 key hash | 完全相符 | 可配置 |

---

## 3. 目標客戶與使用場景

### 3.1 目標客群

**Tier 1：小型 SaaS 產品團隊**
- 有知識庫（Docs、FAQ、Blog）但沒有 AI 工程師
- 希望快速加入「問問 AI」功能
- 典型：開發者工具、HR SaaS、客服系統

**Tier 2：內容平台**
- 有大量垂直領域內容（影片字幕、文章、商品描述）
- 想做智慧搜尋或問答
- 典型：電商、媒體、教育平台

**Tier 3：企業內部知識管理**
- 員工手冊、技術文件、流程 SOP 問答
- 需要資料隔離、自訂 Prompt、SSO

**Tier 4：代理商 / 系統整合商**
- 為客戶提供 AI 整合服務
- 需要白標（White Label）能力、多項目管理

### 3.2 使用場景對照

| 場景 | 需要功能 | 對應現有模組 |
|------|---------|------------|
| 網站嵌入問答 Widget | Chat Widget、知識庫索引 | ChatWidget.tsx + indexing.ts |
| 智慧客服 | 對話記憶、多輪對話 | memory-extractor.ts + chat sessions |
| 文件搜尋 | Hybrid Search、Source 引用 | retrieval.ts + SourceCard.tsx |
| 結構化資料查詢 | Text-to-SQL | text-to-sql.ts |
| 個人化推薦 | User Memory | personalization.ts |
| 多語言支援 | Prompt 模板配置 | ai-prompts.ts |

---

## 4. 產品功能模組

### 4.1 模組一：知識庫管理（Knowledge Base）

**功能**：
- 多格式文件上傳（Markdown、PDF、HTML、CSV、JSON）
- URL 批次爬取（Sitemap 支援）
- 分塊策略配置（chunk_size、overlap、strategy）
- Contextual RAG：LLM 自動為每個 chunk 生成背景摘要
- 增量索引（只重新索引有變更的文件）
- 索引狀態監控（pending / processing / indexed / error）

**API 端點**（新增）：
```
POST   /v1/kb/{kb_id}/documents          # 上傳文件
POST   /v1/kb/{kb_id}/urls               # URL 批次索引
DELETE /v1/kb/{kb_id}/documents/{doc_id} # 刪除文件
GET    /v1/kb/{kb_id}/documents          # 列出文件
POST   /v1/kb/{kb_id}/reindex            # 重新索引
GET    /v1/kb/{kb_id}/status             # 索引狀態
```

### 4.2 模組二：問答引擎（Query Engine）

**功能**：
- REST API 問答（同步 + SSE 串流）
- 對話上下文（chat_history，最多 20 輪）
- 來源引用（sources with score + excerpt）
- 追蹤查詢 ID（query_id for feedback）
- 澄清問題（clarification flow）
- 建議問題（suggested_questions）

**可配置參數**：
```json
{
  "pipeline": {
    "semantic_cache": true,
    "hybrid_search": true,
    "hyde": false,
    "multi_query": false,
    "self_reflection": true,
    "top_k": 5
  },
  "llm": {
    "model": "gemma-3-12b-it",
    "temperature": 0.3,
    "max_tokens": 1024
  }
}
```

### 4.3 模組三：Chat Widget（嵌入式聊天）

**嵌入方式**：
```html
<!-- 方法一：Script Tag（最簡單） -->
<script
  src="https://cdn.ragkit.io/widget.js"
  data-api-key="YOUR_API_KEY"
  data-kb-id="YOUR_KB_ID"
  data-theme="light"
  data-position="bottom-right"
  data-lang="zh-TW"
></script>

<!-- 方法二：npm 套件 -->
<RAGKitWidget
  apiKey="YOUR_API_KEY"
  kbId="YOUR_KB_ID"
  theme={customTheme}
  onMessage={handleMessage}
/>
```

**自訂選項**：
- 主色調、字體、圓角
- 開場白、佔位符文字
- 建議問題（固定或動態）
- 歡迎訊息
- 隱藏 / 顯示來源卡片
- 配額顯示開關

**現有 ChatWidget.tsx 需改造的部分**：
- 移除 NobodyClimb 硬編碼的領域邏輯（攀岩相關 suggested questions）
- 改為 API Key + KB ID 驅動
- 抽出 theme token 讓外部配置

### 4.4 模組四：Admin Dashboard

從現有 `apps/web/src/app/admin/ai/` 擴充為多租戶管理介面：

**子頁面**：

| 頁面 | 現有實作 | SaaS 版新增 |
|------|---------|-----------|
| Overview | ✅ KPI 卡片 | 加入多知識庫切換、方案使用量 |
| Knowledge Base | ✅ 文件管理 | 支援多 KB、上傳進度、爬取排程 |
| Query Logs | ✅ 查詢記錄 | 加入 KB 篩選、匯出 CSV |
| Metrics | ✅ 效能指標 | 加入 P50/P95 latency 圖表 |
| Costs | ✅ Token 費用 | 加入方案限額對比、帳單預覽 |
| Prompts | ✅ Prompt 版本管理 | 加入 A/B 測試、回滾 |
| Settings | ✅ AI 參數配置 | 加入 API Key 管理、Webhook |
| Team | ❌ 未實作 | 成員邀請、角色權限（Owner/Admin/Viewer） |
| Billing | ❌ 未實作 | 方案升級、發票下載、用量警示 |

### 4.5 模組五：安全與防護

沿用現有 `guardrails.ts` 並增強：
- Prompt Injection 偵測（36 種模式）
- Jailbreak 防護（11 種模式）
- PII 遮蔽（email、電話、身分證）
- 輸出內容過濾（可自訂黑名單詞彙）
- 速率限制（IP + API Key 雙層）

---

## 5. 多租戶架構設計

### 5.1 隔離策略

採用 **Shared DB + Row-Level Isolation** 策略（適合 Cloudflare D1 架構）：

```sql
-- 所有核心表加入 tenant_id
CREATE TABLE tenants (
  id         TEXT PRIMARY KEY,        -- UUID
  name       TEXT NOT NULL,
  slug       TEXT UNIQUE NOT NULL,    -- subdomain: acme.ragkit.io
  plan       TEXT DEFAULT 'starter',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE knowledge_bases (
  id         TEXT PRIMARY KEY,
  tenant_id  TEXT NOT NULL REFERENCES tenants(id),
  name       TEXT NOT NULL,
  lang       TEXT DEFAULT 'zh-TW',
  settings   TEXT DEFAULT '{}',       -- JSON pipeline config
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE ai_documents (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL,          -- 隔離鍵
  kb_id       TEXT NOT NULL,
  type        TEXT NOT NULL,
  source_id   TEXT,
  text        TEXT NOT NULL,
  metadata    TEXT DEFAULT '{}',
  embedding_id TEXT,
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE api_keys (
  id         TEXT PRIMARY KEY,
  tenant_id  TEXT NOT NULL,
  name       TEXT,
  key_hash   TEXT UNIQUE NOT NULL,    -- SHA-256 of actual key
  prefix     TEXT NOT NULL,           -- rk_live_xxxx（顯示用）
  scopes     TEXT DEFAULT '["ask","index"]',
  last_used  TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
```

### 5.2 Vectorize 隔離

Cloudflare Vectorize 透過 **metadata filter** 實現租戶隔離：

```typescript
// 每次索引時附帶 tenant_id
await vectorize.insert([{
  id: docId,
  values: embedding,
  metadata: {
    tenant_id: ctx.tenantId,  // 必填
    kb_id: kbId,
    type: 'document',
  }
}])

// 每次查詢時強制加入 tenant_id filter
const results = await vectorize.query(queryVector, {
  topK: 10,
  filter: {
    tenant_id: { $eq: ctx.tenantId },  // 強制隔離
    kb_id: { $eq: kbId },
  }
})
```

### 5.3 請求路由

```
客戶端 API 請求
    │
    ▼
Cloudflare Workers (Edge)
    │
    ├─ Authorization: Bearer rk_live_xxxx
    │       │
    │       ▼
    │  API Key 查找 (KV Cache)
    │  → 解析出 tenant_id + scopes
    │
    ├─ 注入 TenantContext
    │  { tenantId, plan, kbId, quotas }
    │
    └─ 下游所有 DB / Vectorize 查詢
       自動附帶 tenant_id WHERE 條件
```

### 5.4 配額管理

```typescript
// 配額定義（對應現有 ai_config 表的 SaaS 化版本）
interface TenantQuota {
  // 問答配額
  daily_ask_limit: number        // 每日問答次數
  monthly_ask_limit: number      // 每月問答次數
  // Token 配額
  monthly_input_token_limit: number
  monthly_output_token_limit: number
  // 知識庫
  max_knowledge_bases: number    // KB 數量上限
  max_documents_per_kb: number   // 每 KB 文件上限
  max_total_vectors: number      // 向量總量上限
  // 索引
  monthly_index_token_limit: number
}
```

---

## 6. API 設計

### 6.1 認證

```http
Authorization: Bearer rk_live_sk_xxxxxxxxxxxxxxxx
```

API Key 類型：
- `rk_live_*`：正式環境（對外 Widget 使用，只有 `ask` scope）
- `rk_secret_*`：伺服器端（有 `index`、`admin` scope）

### 6.2 核心端點

#### 問答 API

```http
POST /v1/ask
Content-Type: application/json

{
  "kb_id": "kb_xxxxxxxx",
  "query": "如何設定 SSO？",
  "stream": true,
  "chat_history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],
  "options": {
    "top_k": 5,
    "include_sources": true,
    "no_cache": false
  }
}
```

**串流回應（SSE）**：
```
data: {"type":"token","content":"根據"}
data: {"type":"token","content":"文件"}
data: {"type":"sources","sources":[{"id":"...","title":"...","excerpt":"...","score":0.92}]}
data: {"type":"suggestions","questions":["如何...","什麼是..."]}
data: {"type":"done","query_id":"q_xxxx","usage":{"input_tokens":512,"output_tokens":256}}
```

#### 知識庫 API

```http
# 建立知識庫
POST /v1/knowledge-bases
{ "name": "產品文件", "lang": "zh-TW", "settings": {} }

# 上傳文件
POST /v1/knowledge-bases/{kb_id}/documents
Content-Type: multipart/form-data
file=@manual.pdf&metadata={"source":"v2.1-manual"}

# URL 索引
POST /v1/knowledge-bases/{kb_id}/index-url
{ "url": "https://docs.example.com", "crawl_depth": 2 }

# 查詢語意搜尋（無 LLM）
GET /v1/knowledge-bases/{kb_id}/search?q=安裝步驟&top_k=5
```

#### 回饋 API

```http
POST /v1/feedback
{
  "query_id": "q_xxxx",
  "score": 1,     // 1=positive, -1=negative
  "comment": "回答太模糊"
}
```

#### Webhook

```http
POST https://your-server.com/webhook
X-RAGKit-Signature: sha256=...

{
  "event": "ask.completed",
  "data": {
    "query_id": "q_xxxx",
    "kb_id": "kb_xxxx",
    "latency_ms": 1230,
    "token_usage": { "input": 512, "output": 256 }
  }
}
```

### 6.3 回應格式

所有錯誤回應統一格式：
```json
{
  "error": {
    "code": "quota_exceeded",
    "message": "已超過每日問答次數上限（100 次）",
    "param": null,
    "doc_url": "https://docs.ragkit.io/errors#quota_exceeded"
  }
}
```

---

## 7. Admin Dashboard 規格

### 7.1 頁面結構

```
ragkit.io/dashboard/
├── /                        # Overview（使用量總覽）
├── /knowledge-bases         # 知識庫列表
│   └── /[kb_id]/
│       ├── /documents       # 文件管理
│       ├── /settings        # KB 設定（Prompt、Pipeline）
│       └── /test            # 即時測試問答
├── /analytics/
│   ├── /queries             # 查詢記錄 + 篩選
│   ├── /metrics             # 效能指標（latency、cache hit rate）
│   └── /costs               # Token 費用分析
├── /settings/
│   ├── /api-keys            # API Key 管理
│   ├── /webhooks            # Webhook 配置
│   ├── /team                # 成員管理
│   └── /billing             # 方案與帳單
```

### 7.2 知識庫測試介面

Admin 內建 Playground（沿用 ChatWidget 但帶有 debug 資訊）：

```
Query: [輸入框]                              [送出]
──────────────────────────────────────────────
Answer: ...

Debug Panel:
  Cache Hit:      ❌
  Pipeline Steps: ✅ tool_selection (32ms)
                  ✅ embedding (45ms)
                  ✅ hybrid_search (120ms)
                  ✅ rerank (88ms)
                  ✅ llm_generation (830ms)
  Total Latency:  1,115ms
  Input Tokens:   487
  Output Tokens:  312
  Judge Score:    3/4 (groundedness: 0.87)

Sources Retrieved (5):
  [0.94] 安裝指南 > 第三節 > p.12
  [0.88] FAQ > 常見問題 > Q5
  ...
```

---

## 8. 定價方案

### 8.1 方案設計

| 功能 | Free | Starter | Pro | Enterprise |
|------|------|---------|-----|-----------|
| **月費** | $0 | $29 | $99 | 客製 |
| 每月問答次數 | 500 | 5,000 | 50,000 | 無限 |
| 知識庫數量 | 1 | 3 | 10 | 無限 |
| 文件數量 / KB | 100 | 1,000 | 10,000 | 無限 |
| 向量總量 | 50K | 500K | 5M | 無限 |
| 串流回應 | ✅ | ✅ | ✅ | ✅ |
| Hybrid Search | ❌ | ✅ | ✅ | ✅ |
| Self-Reflection | ❌ | ❌ | ✅ | ✅ |
| 自訂 Prompt | ❌ | ✅ | ✅ | ✅ |
| API Access | ✅ | ✅ | ✅ | ✅ |
| Webhook | ❌ | ✅ | ✅ | ✅ |
| 白標 Widget | ❌ | ❌ | ✅ | ✅ |
| SSO / SAML | ❌ | ❌ | ❌ | ✅ |
| SLA | ❌ | 99.5% | 99.9% | 99.99% |
| 支援 | Community | Email | Priority | Dedicated |

### 8.2 超量計費（Pay-as-you-go）

- 超量問答：$0.005 / 次
- 超量索引 Token：$0.50 / 100萬 token
- 超量向量儲存：$0.10 / 100萬向量 / 月

### 8.3 成本結構參考

基於 Cloudflare Workers AI 定價：
- Embedding（bge-m3）：$0.000006 / 1K tokens（Neurons）
- LLM（Gemma-3-12b）：$0.0000192 / 1K tokens
- Vectorize：$0.01 / 100萬向量查詢
- D1：$0.001 / 100萬 reads

以 Starter 方案（5,000 問答/月）為例：
- 每次問答平均 input 500 tokens + output 400 tokens
- LLM 費用：5000 × 900 × $0.0000192 / 1000 ≈ **$0.86**
- Embedding 費用：5000 × 500 × $0.000006 / 1000 ≈ **$0.015**
- 基礎設施費用（Workers、D1、R2）：**< $1**
- **總成本 ≈ $2 / 月**，售價 $29，毛利率 **93%**

---

## 9. 技術架構

### 9.1 整體架構圖

```
                          ┌─────────────────────────┐
                          │      ragkit.io           │
                          │   (Next.js on CF Pages)  │
                          │  - Landing Page          │
                          │  - Admin Dashboard       │
                          │  - Documentation         │
                          └────────────┬────────────┘
                                       │
                          ┌────────────▼────────────┐
                          │   api.ragkit.io          │
                          │  (Hono on CF Workers)    │
                          │                          │
                          │  ┌────────────────────┐  │
                          │  │  Auth Middleware    │  │
                          │  │  (API Key → Tenant) │  │
                          │  └────────┬───────────┘  │
                          │           │               │
                          │  ┌────────▼───────────┐  │
                          │  │  RAG Pipeline       │  │
                          │  │  (14-step modular)  │  │
                          │  └────────┬───────────┘  │
                          └───────────┼──────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
   ┌──────────▼──────────┐  ┌────────▼────────┐  ┌──────────▼──────────┐
   │  Cloudflare D1      │  │ CF Vectorize    │  │  CF KV              │
   │  (tenant data,      │  │ (embeddings,    │  │  (api key cache,    │
   │   query logs,       │  │  metadata filter│  │   semantic cache,   │
   │   config, prompts)  │  │  per tenant_id) │  │   rate limit state) │
   └─────────────────────┘  └─────────────────┘  └─────────────────────┘
              │
   ┌──────────▼──────────┐
   │  CF R2              │
   │  (raw documents,    │
   │   uploaded files)   │
   └─────────────────────┘
```

### 9.2 Widget CDN 架構

```
客戶網站
    │
    │ <script src="https://cdn.ragkit.io/widget.js">
    │
    ▼
CF Pages / R2 Static Assets
    │ (widget.js bundle, versioned)
    │
    ▼
Browser 初始化 Widget
    │ POST https://api.ragkit.io/v1/ask
    │ Authorization: Bearer rk_live_xxx (public key)
    │
    ▼
CF Workers API
    │ scope 驗證（只允許 ask scope）
    │ tenant + kb 解析
    ▼
RAG Pipeline
```

### 9.3 索引管道架構

```
客戶上傳文件 / URL
    │
    ▼
CF Workers (Indexing API)
    │
    ├─ 文件解析（PDF / HTML / MD / CSV）
    │
    ├─ 分塊（chunk_size=512, overlap=50）
    │
    ├─ Contextual Enrichment（LLM 生成每 chunk 摘要）[可選]
    │
    ├─ Embedding（bge-m3 批次，100 chunks/batch）
    │
    ├─ Vectorize 插入（附 tenant_id metadata）
    │
    ├─ D1 FTS5 同步（BM25 全文索引）
    │
    └─ D1 ai_documents 記錄（metadata + status）
```

### 9.4 現有程式碼可重用率評估

| 模組 | 現有實作 | 重用率 | 需改造項目 |
|------|---------|------|-----------|
| Pipeline Engine | `pipeline/` | 90% | 注入 tenant_id |
| Retrieval | `query/retrieval.ts` | 85% | Vectorize filter |
| Embedding | `services/embedding.ts` | 95% | 幾乎不用改 |
| Indexing | `services/indexing.ts` | 70% | 移除領域邏輯 |
| Guardrails | `utils/guardrails.ts` | 95% | 增加 PII 遮蔽 |
| Prompts | `utils/ai-prompts.ts` | 60% | 改為 DB 驅動 + 租戶自訂 |
| Chat Widget | `ChatWidget.tsx` | 75% | 移除硬編碼、加入主題系統 |
| Admin Pages | `app/admin/ai/` | 65% | 加入多租戶概念 |
| API Routes | `routes/ai.ts` | 70% | API Key 認證替換 JWT |

---

## 10. 實作路線圖

### Phase 0：基礎設施（2 週）

**目標**：建立多租戶骨架，現有程式碼可掛上去跑

- [ ] Tenant / Knowledge Base / API Key 資料表設計與 migration
- [ ] API Key 認證 middleware（取代 JWT）
- [ ] TenantContext 注入機制
- [ ] Vectorize metadata filter 全面套用 tenant_id
- [ ] 環境分離（ragkit dev / staging / production）

### Phase 1：核心 API（3 週）

**目標**：問答 API + 知識庫管理 API 可公開使用

- [ ] `POST /v1/ask`（串流 + 同步）
- [ ] `POST /v1/knowledge-bases` + `POST /v1/knowledge-bases/{id}/documents`
- [ ] Markdown / Plain text 文件解析
- [ ] PDF 解析（via CF Workers + pdf-parse）
- [ ] URL 爬取索引（限深度 2）
- [ ] 配額驗證邏輯（移植自現有 quota enforcement）
- [ ] API Key 管理 CRUD

### Phase 2：Admin Dashboard（3 週）

**目標**：租戶可自助管理知識庫

- [ ] 認證系統（Email OTP / Google OAuth）
- [ ] 知識庫管理頁（CRUD、文件上傳）
- [ ] 問答測試 Playground（含 Debug Panel）
- [ ] 查詢記錄頁
- [ ] 用量概覽頁（問答次數、Token 費用）
- [ ] API Key 管理頁

### Phase 3：Chat Widget（2 週）

**目標**：客戶可以 1 行程式碼嵌入

- [ ] Widget 抽離為獨立 npm package
- [ ] Script Tag 嵌入模式
- [ ] 主題配置系統（CSS Variables）
- [ ] CDN 部署（CF Pages static assets）
- [ ] Widget 文件 + 範例

### Phase 4：進階功能（4 週）

- [ ] Webhook 系統
- [ ] Prompt 版本管理（A/B 測試）
- [ ] 成員邀請 + 角色權限
- [ ] 帳單系統（Stripe 整合）
- [ ] 用量警示（email + webhook）
- [ ] 白標 Widget 支援

### Phase 5：企業功能（持續）

- [ ] SSO / SAML 整合
- [ ] Dedicated 部署選項
- [ ] 自帶 LLM（BYOLLM：OpenAI / Azure OpenAI）
- [ ] 自帶向量資料庫
- [ ] SLA 監控與報告

---

## 11. 商業模式分析

### 11.1 競品對比

| 服務 | 定位 | 優勢 | 劣勢 |
|------|------|------|------|
| Mendable | Developer 問答 RAG | 早期市場驗證 | 定價較貴 |
| Inkeep | 技術文件 AI | 深度整合 GitHub、Slack | 只針對開發者工具 |
| Algolia AI Search | 搜尋 + 問答 | 品牌知名度 | 以搜尋為主，AI 為輔 |
| Orama | 全端 AI 搜尋 | 開源友好 | 較新，生態系不成熟 |
| **RAGKit（本計畫）** | Edge-native RAG | Cloudflare 邊緣低延遲、Pipeline 可配置、成本結構優 | 品牌未知 |

### 11.2 差異化優勢

1. **Edge-native**：全程在 Cloudflare 邊緣執行，無冷啟動，P95 < 2s
2. **Pipeline 透明化**：Admin 可看到每個步驟的 latency、token 消耗、Judge 分數
3. **Self-Reflection 品質保證**：業界少見的內建品質評估機制
4. **成本優勢**：Cloudflare Workers AI Neurons 計費，比 OpenAI API 便宜 50-80%
5. **繁體中文優先**：bge-m3 多語言 embedding，中文語意搜尋效果好

### 11.3 Go-to-Market 策略

**Phase 1（Beta）**：
- 邀請 10-20 個目標用戶免費使用
- 聚焦：技術文件類（開發者工具、SaaS 公司文件站）
- 蒐集回饋，打磨 onboarding 流程

**Phase 2（Public Launch）**：
- Product Hunt 發布
- Dev.to / Medium 技術文章（「用 Cloudflare 邊緣建 RAG」）
- GitHub 開源 Widget SDK（吸引開發者注意力）

**Phase 3（Growth）**：
- 代理商計畫（Reseller：提供白標 + 分潤）
- 整合市場（Notion、Confluence、Intercom 等）

### 11.4 關鍵指標（KPI）

| 指標 | 說明 | 目標（Launch + 6M） |
|------|------|-----------------|
| MRR | 月經常性收入 | $5,000 |
| Active Tenants | 有活躍問答的租戶 | 100 |
| Avg Query Latency | P95 問答延遲 | < 2,000ms |
| Cache Hit Rate | 語意快取命中率 | > 30% |
| Judge Score Avg | 平均品質分數 | > 3.0 / 4 |
| Churn Rate | 月流失率 | < 5% |

---

## 附錄：技術債與風險

### 已知技術債

1. **Text-to-SQL 抽象化**：現有 SQL 模板高度耦合 NobodyClimb Schema，需設計租戶自訂 Schema 對應機制
2. **Memory Extractor**：攀岩領域特化的記憶提取邏輯，需改為通用領域可配置版本
3. **Prompt 硬編碼**：`ai-prompts.ts` 有中文攀岩相關規則，需移至 DB 並支援租戶覆寫

### 風險識別

| 風險 | 影響 | 緩解措施 |
|------|------|---------|
| Vectorize 隔離不完整 | 資料外洩 | 所有 query 強制帶 tenant_id filter，單元測試覆蓋 |
| API Key 洩漏 | 費用盜刷 | Public Key 只有 `ask` scope，限速 + 異常偵測 |
| LLM 成本暴增 | 毛利損失 | Token 預算硬上限，超量拒絕而非靜默計費 |
| Cloudflare D1 Scale | 大量租戶讀寫壓力 | 早期監控，考慮讀寫分離或 Hyperdrive |
