# NobodyClimb AI Agent 實作計畫

## 專案目標

建構「攀岩進步助手」AI 功能，解決兩個核心用戶痛點：

1. **找適合自己程度的路線** - 語義搜尋 + 等級過濾
2. **不知道該練什麼** - 個人化訓練建議

---

## 技術架構

```
用戶查詢 → Embedding → Vectorize 搜尋 → LLM 回應生成
              ↓              ↓
         Workers AI    路線/影片向量庫
         (bge-m3)      (946路線+9582影片)
```

### Cloudflare 服務選用

| 服務 | 用途 | 成本 |
|------|------|------|
| Workers AI | Embedding + LLM 推論 | < $5/月 |
| Vectorize | 向量儲存與搜尋 | 免費額度內 |
| D1 | 結構化資料儲存 | 已有 |
| KV | 快取查詢結果 | 已有 |

### Embedding 模型選擇

**`@cf/baai/bge-m3`** - 多語言大型模型
- 維度: 1024
- 支援繁體中文
- 適合語義搜尋
- 比 bge-base-en-v1.5 (768 維) 更適合中文路線名稱

---

## MVP 功能範圍

### Phase 1：語義路線搜尋（優先）

- 自然語言查詢：「我爬 5.10a，想找龍洞適合的路線」
- 等級範圍過濾
- 岩場/區域過濾
- 路線類型過濾（sport/trad/boulder）

### Phase 2：訓練建議

- 根據用戶程度推薦練習路線
- 連結相關教學影片
- 簡單的進步建議

### 暫不實作

- 多輪對話記憶
- 用戶攀爬歷史分析
- 語音介面

---

## 實作步驟

### Step 1：資料準備與匯入

**目標**：將現有 JSON 資料匯入 D1 資料庫

**資料來源**：
- `apps/web/src/data/crags/*.json` - 5 個岩場，946 條路線
- `apps/web/public/data/videos/*.json` - 9,582 支影片

**新增腳本**：`backend/src/scripts/import-routes.ts`

```bash
cd backend
npx tsx src/scripts/import-routes.ts
```

### Step 2：後端基礎設施

**修改檔案**：

#### `backend/wrangler.toml` - 新增 AI + Vectorize bindings

```toml
# Preview 環境
[env.preview.ai]
binding = "AI"

[[env.preview.vectorize]]
binding = "ROUTES_INDEX"
index_name = "nobodyclimb-routes-preview"

# Production 環境
[env.production.ai]
binding = "AI"

[[env.production.vectorize]]
binding = "ROUTES_INDEX"
index_name = "nobodyclimb-routes"
```

#### `backend/src/types.ts` - 更新 Env 類型

```typescript
export interface Env {
  // ... 現有 bindings
  AI: Ai;
  ROUTES_INDEX: VectorizeIndex;
}
```

### Step 3：建立 Vectorize 索引

```bash
# 建立路線向量索引 (使用 bge-m3 的 1024 維度)
npx wrangler vectorize create nobodyclimb-routes \
  --dimensions=1024 \
  --metric=cosine

# 建立 metadata 索引（用於過濾）
npx wrangler vectorize create-metadata-index nobodyclimb-routes \
  --property-name=grade_numeric --type=number

npx wrangler vectorize create-metadata-index nobodyclimb-routes \
  --property-name=crag --type=string

npx wrangler vectorize create-metadata-index nobodyclimb-routes \
  --property-name=type --type=string
```

### Step 4：Embedding 生成腳本

**新增檔案**：`backend/src/scripts/generate-embeddings.ts`

處理流程：
1. 從 D1 讀取路線資料
2. 組合可搜尋文字（名稱 + 等級 + 區域 + 描述）
3. 呼叫 Workers AI 生成 embedding
4. 存入 Vectorize（含 metadata）

**文件模板範例**：

```
路線名稱：黃色乖乖 (Yellow Guai Guai)
所屬岩場：龍洞 - 黃金海岸區
難度等級：5.10a
路線類型：sport
路線長度：15米
bolt 數量：6
描述：經典入門路線，手點良好
地區：新北市
```

### Step 5：AI 搜尋 API

**新增檔案**：`backend/src/routes/ai.ts`

```typescript
// POST /api/v1/ai/search
interface AISearchRequest {
  query: string;
  filters?: {
    grade?: { min?: string; max?: string };
    crag?: string;
    type?: string[];  // sport, trad, boulder
  };
  limit?: number;  // 預設 10
}

interface AISearchResponse {
  results: {
    id: string;
    name: string;
    grade: string;
    crag: string;
    type: string;
    score: number;  // 相似度分數
  }[];
  query_id: string;  // 用於回饋追蹤
}
```

### Step 6：前端整合

**修改/新增檔案**：
- `apps/web/src/components/search/AISearchBar.tsx` - AI 搜尋元件
- `apps/web/src/hooks/useAISearch.ts` - AI 搜尋 hook
- `apps/web/src/lib/api/ai.ts` - API 客戶端

---

## 關鍵檔案清單

| 檔案 | 動作 | 說明 |
|------|------|------|
| `backend/src/scripts/import-routes.ts` | 新增 | 匯入 JSON 到 D1 腳本 |
| `backend/wrangler.toml` | 修改 | 新增 AI/Vectorize bindings |
| `backend/src/types.ts` | 修改 | 新增 Env 類型 |
| `backend/src/routes/ai.ts` | 新增 | AI 相關 API 路由 |
| `backend/src/scripts/generate-embeddings.ts` | 新增 | Embedding 生成腳本 |
| `backend/src/utils/ai.ts` | 新增 | AI 工具函數（等級轉換等） |
| `backend/src/index.ts` | 修改 | 註冊新路由 |
| `backend/migrations/0031_create_ai_documents.sql` | 新增 | AI 文件表 migration |
| `packages/types/src/ai.ts` | 新增 | AI 相關類型定義 |
| `apps/web/src/hooks/useAISearch.ts` | 新增 | 前端 AI hook |
| `apps/web/src/lib/api/ai.ts` | 新增 | AI API 客戶端 |

---

## 資料模型

### routes 表結構（現有）

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | TEXT | 主鍵 |
| crag_id | TEXT | 岩場 ID |
| name | TEXT | 路線名稱 |
| grade | TEXT | 難度等級 (YDS) |
| route_type | TEXT | sport/trad/boulder |
| description | TEXT | 描述 |
| ... | | |

### ai_documents 表（新增）

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | TEXT | 主鍵 |
| type | TEXT | route/crag/video |
| source_id | TEXT | 原始實體 ID |
| text | TEXT | 完整文字用於 LLM context |
| metadata | TEXT | JSON metadata |
| embedding_id | TEXT | Vectorize 向量 ID |
| created_at | TEXT | 建立時間 |

### Vectorize Metadata 欄位

```typescript
interface RouteVectorMetadata {
  type: 'route';
  source_id: string;
  name: string;
  grade: string;
  grade_numeric: number;  // 5.10a → 100
  crag: string;
  crag_id: string;
  route_type: string;
  region: string;
}
```

---

## 難度轉數值對照

將 YDS 等級轉為數值，用於範圍過濾：

| 等級 | 數值 |
|------|------|
| 5.5 | 50 |
| 5.6 | 60 |
| 5.7 | 70 |
| 5.8 | 80 |
| 5.9 | 90 |
| 5.10a | 100 |
| 5.10b | 101 |
| 5.10c | 102 |
| 5.10d | 103 |
| 5.11a | 110 |
| ... | |
| 5.14d | 143 |

```typescript
function gradeToNumeric(grade: string): number {
  const match = grade.match(/5\.(\d+)([a-d])?/);
  if (!match) return 0;

  const base = parseInt(match[1], 10) * 10;
  const suffix = match[2] ? 'abcd'.indexOf(match[2]) : 0;
  return base + suffix;
}
```

---

## 驗證方式

### 1. Vectorize 索引驗證

```bash
# 確認索引建立
npx wrangler vectorize list

# 檢查索引詳情
npx wrangler vectorize get nobodyclimb-routes
```

### 2. Embedding 生成驗證

```bash
cd backend
npx wrangler dev

# 執行索引腳本
curl -X POST http://localhost:8787/api/v1/ai/index \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"type": "route"}'
```

### 3. API 搜尋測試

```bash
# 語義搜尋
curl -X POST https://api.nobodyclimb.cc/api/v1/ai/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "適合 5.10 的龍洞路線",
    "limit": 5
  }'

# 帶過濾的搜尋
curl -X POST https://api.nobodyclimb.cc/api/v1/ai/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "適合新手的運動攀",
    "filters": {
      "grade": { "max": "5.9" },
      "type": ["sport"]
    }
  }'
```

### 4. 前端整合測試

- 開啟搜尋頁面
- 輸入自然語言查詢
- 確認回傳結果符合語義

---

## 成本分析

### 免費額度

| 項目 | 免費額度 | 預估使用 | 狀態 |
|------|---------|---------|------|
| Workers AI | 10K neurons/日 | ~1K/日 | 免費 |
| Vectorize | 5 索引，各 200K 向量 | 1 索引，~11K 向量 | 免費 |
| D1 | 5GB 儲存 | ~100MB | 免費 |
| KV | 100K 讀取/日 | ~10K | 免費 |

### Workers AI Neurons 消耗估算

| 操作 | 模型 | Neurons/次 | 日均次數 | 日消耗 |
|------|------|-----------|---------|--------|
| 查詢 Embedding | bge-m3 | ~10 | 100 | 1,000 |
| LLM 生成 | llama-3.1-8b | ~50 | 50 | 2,500 |
| **總計** | | | | **3,500** |

**結論：MVP 階段完全在免費額度內運行**

---

## 實作階段

| Phase | 內容 | 預計時間 |
|-------|------|---------|
| 1 | 資料匯入 D1 + 基礎設施設定 | 1-2 天 |
| 2 | Vectorize 索引 + Embedding 生成 | 2-3 天 |
| 3 | AI 搜尋 API | 2-3 天 |
| 4 | 前端整合 (ChatWidget) | 2-3 天 |
| 5 | 測試 + 調整 | 1-2 天 |
| 6 | Admin Dashboard (MVP) | 3-5 天 |
| 7 | Admin 進階功能 | 3-5 天 |

**Phase 1-5 總計：約 8-13 天**
**含 Admin Dashboard：約 14-23 天**

### Admin Dashboard 細分

| 階段 | 功能 |
|------|------|
| 6.1 | Dashboard 總覽 + 查詢日誌 |
| 6.2 | 知識庫管理（資料來源、索引控制） |
| 7.1 | Prompt 模板管理 + 版本控制 |
| 7.2 | 工具管理 + 分析報表 |

---

## 查詢範例與預期結果

### 範例 1：難度 + 岩場

**查詢**：「龍洞有什麼 5.10 的路線？」

**預期行為**：
1. 擷取關鍵詞：龍洞、5.10
2. Embedding 查詢
3. 過濾 metadata: `crag = "龍洞"`, `grade_numeric BETWEEN 100 AND 103`
4. 返回相關路線列表

### 範例 2：難度範圍

**查詢**：「適合初學者的運動攀路線」

**預期行為**：
1. 語義理解「初學者」→ 5.8 以下
2. 過濾 `route_type = "sport"`, `grade_numeric < 80`
3. 返回符合條件的路線

### 範例 3：自由查詢

**查詢**：「有什麼好爬的路線推薦？」

**預期行為**：
1. 純語義搜尋
2. 返回最相關的路線（不做過濾）
3. 讓使用者自行判斷難度

---

## 技術參考

### Cloudflare Workers AI 模型

| 模型 | 用途 | 特點 |
|------|------|------|
| @cf/baai/bge-m3 | Embedding | 1024 維，支援多語言 |
| @cf/baai/bge-base-en-v1.5 | Embedding | 768 維，英文為主 |
| @cf/meta/llama-3.1-8b-instruct | LLM | 8B 參數，適合對話 |
| @cf/meta/llama-3.2-3b-instruct | LLM | 3B 參數，速度更快 |

### Vectorize 限制

| 項目 | 限制 |
|------|------|
| 向量維度 | 1-1536 |
| 每索引向量數 | 200,000 (免費) / 5,000,000 (付費) |
| Metadata 大小 | 10KB/向量 |
| 批次插入 | 1,000 向量/次 |
| 查詢 topK | 最大 100 |

### 相關文件連結

- [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/)
- [Cloudflare Vectorize](https://developers.cloudflare.com/vectorize/)
- [BGE-M3 模型說明](https://huggingface.co/BAAI/bge-m3)

---

## 附錄：詳細設計文件

本專案的詳細設計分拆於以下文件：

| 文件 | 說明 |
|------|------|
| [01-architecture.md](./01-architecture.md) | RAG 流程與核心元件設計 |
| [02-infrastructure.md](./02-infrastructure.md) | Cloudflare 服務設定細節 |
| [03-backend-implementation.md](./03-backend-implementation.md) | 後端 API 與服務實作 |
| [04-frontend-integration.md](./04-frontend-integration.md) | 前端元件與整合 |
| [05-admin-dashboard.md](./05-admin-dashboard.md) | Admin 管理介面設計 |
