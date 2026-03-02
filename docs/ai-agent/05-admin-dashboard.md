# AI Agent Admin 管理介面設計

> 參考 [Dify](https://dify.ai/)、[LangSmith](https://www.langchain.com/langsmith/observability)、[Langfuse](https://langfuse.com/docs/prompt-management/overview)、[RAGFlow](https://ragflow.io/) 等主流平台

---

## 概覽

Admin 介面提供集中化管理 AI 助理的能力，涵蓋以下核心模組：

| 模組 | 功能 |
|------|------|
| **Dashboard** | 總覽、使用量統計、健康狀態 |
| **Knowledge Base** | RAG 文件管理、Chunking 設定 |
| **Prompts** | Prompt 模板管理、版本控制 |
| **Tools** | 工具管理、API 整合 |
| **Logs & Analytics** | 查詢日誌、回饋分析 |
| **Settings** | 模型設定、系統配置 |

---

## 1. Dashboard - 總覽頁面

### 1.1 關鍵指標 (KPIs)

```
┌─────────────────────────────────────────────────────────────┐
│  AI Agent Dashboard                                         │
├───────────────┬───────────────┬───────────────┬────────────┤
│ 今日查詢數     │ 平均回應時間   │ 成功率        │ Token 使用  │
│    156        │   1.2s        │   98.5%       │   45,230   │
│   ↑ 12%       │   ↓ 0.3s      │   ↑ 0.5%      │   ↑ 8%     │
└───────────────┴───────────────┴───────────────┴────────────┘
```

### 1.2 監控面板

| 指標 | 說明 | 來源 |
|------|------|------|
| 查詢數趨勢 | 每小時/每日查詢量圖表 | `ai_query_logs` |
| 回應延遲分佈 | P50/P95/P99 延遲 | `latency_ms` |
| 錯誤率 | 失敗查詢比例 | API 錯誤紀錄 |
| Token 消耗 | Embedding + LLM token 用量 | Workers AI |
| 回饋分數 | 使用者評分分佈 | `feedback_score` |
| 熱門查詢 | Top 10 常見問題 | 查詢分群 |

### 1.3 健康狀態

```typescript
interface HealthStatus {
  workersAI: 'healthy' | 'degraded' | 'down';
  vectorize: 'healthy' | 'degraded' | 'down';
  d1Database: 'healthy' | 'degraded' | 'down';
  lastCheck: Date;
}
```

---

## 2. Knowledge Base - 知識庫管理

> 參考 [RAGFlow](https://ragflow.io/docs/dev/configure_knowledge_base) 和 [Dify RAG Pipeline](https://dify.ai/blog/agentic-rag-smarter-retrieval-with-autonomous-reasoning)

### 2.1 資料來源管理

```
┌─────────────────────────────────────────────────────────────┐
│  Knowledge Sources                           [+ 新增來源]    │
├─────────────────────────────────────────────────────────────┤
│  ☑ Routes (路線)        946 筆    已索引    最後更新: 1小時前  │
│  ☑ Crags (岩場)         5 筆     已索引    最後更新: 1小時前  │
│  ☐ Videos (影片)        9,582 筆  未索引   [開始索引]         │
│  ☐ Articles (文章)      0 筆     --       [匯入]            │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 文件管理功能

| 功能 | 說明 |
|------|------|
| 匯入文件 | 支援 JSON、CSV、Markdown 格式 |
| 預覽 Chunks | 查看文件如何被切分 |
| 編輯 Metadata | 調整 metadata 欄位 |
| 重新索引 | 觸發重新 embedding |
| 刪除 | 從 Vectorize 和 D1 移除 |

### 2.3 Chunking 設定

```typescript
interface ChunkingConfig {
  // 文件模板
  template: string;  // 使用 {field} 佔位符

  // Chunk 參數
  maxTokens: number;      // 預設 500
  overlapTokens: number;  // 預設 50

  // Metadata 欄位
  metadataFields: string[];  // ['name', 'grade', 'crag', ...]
}
```

**文件模板編輯器：**

```
┌─────────────────────────────────────────────────────────────┐
│  Route Document Template                                     │
├─────────────────────────────────────────────────────────────┤
│  路線名稱：{name}                                            │
│  所屬岩場：{crag_name} - {area_name}                         │
│  難度等級：{grade}                                           │
│  路線類型：{route_type}                                      │
│  描述：{description}                                         │
│                                                              │
│  [預覽] [儲存] [重置為預設]                                   │
└─────────────────────────────────────────────────────────────┘
```

### 2.4 索引狀態監控

| 指標 | 說明 |
|------|------|
| 總向量數 | Vectorize 中的向量筆數 |
| 索引進度 | 批次處理進度 |
| 最後同步時間 | 上次完整索引時間 |
| 待處理項目 | 需要重新索引的項目 |

---

## 3. Prompts - Prompt 管理

> 參考 [Langfuse Prompt Management](https://langfuse.com/docs/prompt-management/get-started) 和 [PromptLayer](https://blog.promptlayer.com/version-control-ai/)

### 3.1 Prompt 列表

```
┌─────────────────────────────────────────────────────────────┐
│  Prompts                                     [+ 新增]        │
├─────────────────────────────────────────────────────────────┤
│  system-prompt          v3 (production)     使用中           │
│  query-template         v2 (production)     使用中           │
│  route-search-prompt    v1 (draft)          草稿            │
│  training-advisor       v1 (draft)          草稿            │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 版本控制

```typescript
interface PromptVersion {
  id: string;
  name: string;
  version: number;
  content: string;
  variables: string[];      // 可替換變數 ['context', 'query']
  status: 'draft' | 'staging' | 'production';
  createdAt: Date;
  createdBy: string;
  changelog: string;
}
```

### 3.3 Prompt 編輯器

```
┌─────────────────────────────────────────────────────────────┐
│  system-prompt (v3)                          [production ▾]  │
├─────────────────────────────────────────────────────────────┤
│  你是 NobodyClimb 攀岩社群平台的 AI 助手。                    │
│                                                              │
│  回答原則：                                                   │
│  1. 只根據提供的資料回答，不要編造資訊                          │
│  2. 使用繁體中文回答                                          │
│  3. 提供具體的路線名稱、難度、位置等資訊                        │
│                                                              │
│  變數: {context}, {query}                                    │
├─────────────────────────────────────────────────────────────┤
│  [測試] [儲存草稿] [發布到 Staging] [發布到 Production]        │
└─────────────────────────────────────────────────────────────┘
```

### 3.4 A/B 測試

| 功能 | 說明 |
|------|------|
| 流量分配 | 設定不同版本的流量比例 |
| 效果對比 | 比較不同版本的回饋分數 |
| 自動回滾 | 效果變差時自動切回舊版 |

---

## 4. Tools - 工具管理

> 參考 [Dify Agent Tools](https://dify.ai/blog/dify-ai-unveils-ai-agent-creating-gpts-and-assistants-with-various-llms)

### 4.1 可用工具列表

```
┌─────────────────────────────────────────────────────────────┐
│  Tools                                       [+ 新增工具]    │
├─────────────────────────────────────────────────────────────┤
│  ☑ route_search        語義搜尋路線         啟用            │
│  ☑ crag_info           取得岩場資訊         啟用            │
│  ☑ grade_filter        難度過濾            啟用            │
│  ☐ video_search        搜尋相關影片         停用            │
│  ☐ weather_check       天氣查詢 (外部 API)  停用            │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 工具定義

```typescript
interface ToolDefinition {
  id: string;
  name: string;
  description: string;  // 給 LLM 看的描述

  // 參數 schema (JSON Schema)
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required: string[];
  };

  // 實作
  endpoint?: string;      // 內部 API 端點
  externalUrl?: string;   // 外部 API
  handler?: string;       // 處理函數名稱

  // 狀態
  enabled: boolean;
  rateLimit?: number;     // 每分鐘最大調用次數
}
```

### 4.3 工具編輯器

```
┌─────────────────────────────────────────────────────────────┐
│  route_search                                [啟用 ✓]        │
├─────────────────────────────────────────────────────────────┤
│  名稱: route_search                                          │
│  描述: 根據使用者的描述搜尋相關的攀岩路線                       │
│                                                              │
│  參數:                                                       │
│  ┌───────────┬─────────┬──────────────────────────────────┐ │
│  │ 名稱       │ 類型    │ 描述                              │ │
│  ├───────────┼─────────┼──────────────────────────────────┤ │
│  │ query     │ string  │ 搜尋關鍵詞                        │ │
│  │ crag      │ string? │ 指定岩場                          │ │
│  │ grade_min │ string? │ 最低難度                          │ │
│  │ grade_max │ string? │ 最高難度                          │ │
│  │ limit     │ number? │ 結果數量限制                      │ │
│  └───────────┴─────────┴──────────────────────────────────┘ │
│                                                              │
│  端點: POST /api/v1/ai/search                                │
│  限流: 60 次/分鐘                                            │
├─────────────────────────────────────────────────────────────┤
│  [測試工具] [儲存]                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Logs & Analytics - 日誌與分析

> 參考 [LangSmith Observability](https://www.langchain.com/langsmith/observability)

### 5.1 查詢日誌

```
┌─────────────────────────────────────────────────────────────┐
│  Query Logs                [篩選 ▾] [匯出]                   │
├─────────────────────────────────────────────────────────────┤
│  時間          查詢                    延遲    評分   狀態    │
├─────────────────────────────────────────────────────────────┤
│  14:32:15     龍洞有什麼5.10的路線？   1.2s    5     成功    │
│  14:31:42     適合新手的岩場推薦       0.9s    4     成功    │
│  14:30:58     北部有哪些岩場？         1.5s    -     成功    │
│  14:30:12     [錯誤] 連線逾時          -       -     失敗    │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 單一查詢詳情

```
┌─────────────────────────────────────────────────────────────┐
│  Query Details                                               │
├─────────────────────────────────────────────────────────────┤
│  ID: qry_abc123                                              │
│  時間: 2025-02-09 14:32:15                                   │
│  使用者: user_xyz (可選)                                     │
│                                                              │
│  ► 查詢: 龍洞有什麼5.10的路線？                               │
│                                                              │
│  ► Embedding: 1024 維向量 (bge-m3)                           │
│                                                              │
│  ► 檢索結果 (Top 5):                                         │
│    1. 黃色乖乖 (5.10a) - score: 0.89                         │
│    2. 藍色乖乖 (5.10b) - score: 0.85                         │
│    3. 紅色乖乖 (5.10c) - score: 0.82                         │
│    ...                                                       │
│                                                              │
│  ► LLM 回應:                                                 │
│    龍洞有多條適合 5.10 等級的路線，以下是推薦...               │
│                                                              │
│  ► 統計:                                                     │
│    總延遲: 1.2s | Embedding: 0.2s | Search: 0.3s | LLM: 0.7s │
│    Token: 輸入 512 / 輸出 256                                │
│                                                              │
│  ► 使用者回饋: ⭐⭐⭐⭐⭐ (5/5)                               │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 分析報表

| 報表 | 說明 |
|------|------|
| 查詢趨勢 | 每日/每週查詢量變化 |
| 熱門主題 | 使用者最常問的主題分類 |
| 回饋分析 | 評分分佈、低分查詢分析 |
| 效能報告 | 延遲分佈、錯誤率趨勢 |
| 成本報告 | Token 使用量、預估費用 |

---

## 6. Settings - 系統設定

### 6.1 模型設定

```typescript
interface ModelConfig {
  embedding: {
    model: string;        // '@cf/baai/bge-m3'
    dimensions: number;   // 1024
  };

  llm: {
    model: string;        // '@cf/meta/llama-3.1-8b-instruct'
    maxTokens: number;    // 1024
    temperature: number;  // 0.7
  };

  search: {
    topK: number;         // 5
    minScore: number;     // 0.5
  };
}
```

### 6.2 快取設定

| 設定項 | 預設值 | 說明 |
|--------|--------|------|
| 啟用快取 | true | 是否快取查詢結果 |
| 快取 TTL | 3600s | 快取存活時間 |
| 快取大小 | 1000 | 最大快取筆數 |

### 6.3 存取控制

| 設定項 | 說明 |
|--------|------|
| API Key | 管理 API 金鑰 |
| 限流 | 設定每分鐘/每日請求上限 |
| IP 白名單 | 限制存取來源 |

---

## 資料庫 Schema 擴充

### ai_prompts 表

```sql
CREATE TABLE IF NOT EXISTS ai_prompts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  version INTEGER NOT NULL DEFAULT 1,
  content TEXT NOT NULL,
  variables TEXT,                    -- JSON array
  status TEXT DEFAULT 'draft',       -- draft, staging, production
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  created_by TEXT
);

CREATE INDEX idx_ai_prompts_name_status ON ai_prompts(name, status);
```

### ai_tools 表

```sql
CREATE TABLE IF NOT EXISTS ai_tools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  parameters TEXT NOT NULL,          -- JSON Schema
  endpoint TEXT,
  external_url TEXT,
  enabled INTEGER DEFAULT 1,
  rate_limit INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

### ai_config 表

```sql
CREATE TABLE IF NOT EXISTS ai_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);
```

---

## API 端點設計

### Admin API

| 方法 | 端點 | 說明 |
|------|------|------|
| GET | `/api/v1/admin/ai/dashboard` | 取得 Dashboard 資料 |
| GET | `/api/v1/admin/ai/knowledge` | 取得知識庫狀態 |
| POST | `/api/v1/admin/ai/knowledge/index` | 觸發索引 |
| GET | `/api/v1/admin/ai/prompts` | 列出所有 Prompt |
| POST | `/api/v1/admin/ai/prompts` | 建立新 Prompt |
| PUT | `/api/v1/admin/ai/prompts/:id` | 更新 Prompt |
| POST | `/api/v1/admin/ai/prompts/:id/publish` | 發布 Prompt |
| GET | `/api/v1/admin/ai/tools` | 列出所有工具 |
| POST | `/api/v1/admin/ai/tools` | 建立工具 |
| PUT | `/api/v1/admin/ai/tools/:id` | 更新工具 |
| GET | `/api/v1/admin/ai/logs` | 查詢日誌 |
| GET | `/api/v1/admin/ai/logs/:id` | 日誌詳情 |
| GET | `/api/v1/admin/ai/analytics` | 分析報表 |
| GET | `/api/v1/admin/ai/config` | 取得設定 |
| PUT | `/api/v1/admin/ai/config` | 更新設定 |

---

## 前端頁面結構

```
apps/web/src/app/admin/ai/
├── page.tsx                    # Dashboard
├── knowledge/
│   ├── page.tsx               # 知識庫列表
│   └── [sourceId]/page.tsx    # 單一來源詳情
├── prompts/
│   ├── page.tsx               # Prompt 列表
│   └── [promptId]/page.tsx    # Prompt 編輯
├── tools/
│   ├── page.tsx               # 工具列表
│   └── [toolId]/page.tsx      # 工具編輯
├── logs/
│   ├── page.tsx               # 日誌列表
│   └── [logId]/page.tsx       # 日誌詳情
├── analytics/
│   └── page.tsx               # 分析報表
└── settings/
    └── page.tsx               # 系統設定
```

---

## 實作優先順序

### Phase 1: 基礎監控 (MVP)

1. Dashboard 總覽頁面
2. 查詢日誌列表
3. 基礎健康檢查

### Phase 2: 知識庫管理

4. 資料來源列表
5. 手動觸發索引
6. 文件模板編輯

### Phase 3: Prompt 管理

7. Prompt 列表與編輯
8. 版本控制
9. 發布流程

### Phase 4: 進階功能

10. 工具管理
11. 分析報表
12. A/B 測試

---

## 參考資源

- [Microsoft Agent 365 Dashboard](https://www.axios.com/2025/11/18/microsoft-ai-agent-365-ignite)
- [LangSmith Dashboards](https://docs.langchain.com/langsmith/dashboards)
- [Dify RAG Pipeline](https://dify.ai/)
- [Langfuse Prompt Management](https://langfuse.com/docs/prompt-management/overview)
- [RAGFlow Knowledge Base](https://ragflow.io/docs/dev/configure_knowledge_base)
- [PromptLayer Version Control](https://blog.promptlayer.com/version-control-ai/)
