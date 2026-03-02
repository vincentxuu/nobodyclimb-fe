# 系統架構設計

## RAG (Retrieval-Augmented Generation) 流程

```
┌──────────────────────────────────────────────────────────────────┐
│                        RAG 查詢流程                               │
└──────────────────────────────────────────────────────────────────┘

1. 使用者提問
   │
   ▼
2. Query Embedding
   │  使用 @cf/baai/bge-m3
   │  將問題轉換為 1024 維向量
   ▼
3. Vector Search
   │  在 Vectorize 中搜尋 top-5 相似段落
   │  使用 cosine similarity
   ▼
4. Context Retrieval
   │  從 D1 取得完整文字內容
   │  組合為 context
   ▼
5. Prompt Construction
   │  System prompt + Context + User query
   ▼
6. LLM Generation
   │  使用 @cf/meta/llama-3.1-8b-instruct
   │  生成自然語言回答
   ▼
7. Response + Sources
   │  回傳答案與來源連結
   └──▶ 使用者
```

## 核心元件

### 1. Embedding 服務

```typescript
// backend/src/services/embedding.ts

interface EmbeddingService {
  // 將文字轉換為向量
  embed(text: string): Promise<number[]>;

  // 批次處理多個文字
  embedBatch(texts: string[]): Promise<number[][]>;
}
```

**使用模型**: `@cf/baai/bge-m3`
- 維度: 1024
- 支援多語言（繁體中文效果更好）
- 適合語義搜尋
- 比 bge-base-en-v1.5 更適合中文路線名稱

### 2. 索引服務

```typescript
// backend/src/services/indexing.ts

interface IndexingService {
  // 索引單一文件
  indexDocument(doc: AIDocument): Promise<void>;

  // 批次索引
  indexBatch(docs: AIDocument[]): Promise<void>;

  // 重建索引
  reindexAll(): Promise<void>;
}
```

### 3. 查詢服務

```typescript
// backend/src/services/query.ts

interface QueryService {
  // 執行 RAG 查詢
  ask(query: string, options?: QueryOptions): Promise<AIResponse>;

  // 純語義搜尋 (不經過 LLM)
  search(query: string, limit?: number): Promise<SearchResult[]>;
}
```

## 資料模型

### AI 文件表 (ai_documents)

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | TEXT | 主鍵 |
| type | TEXT | 文件類型: route, crag, video, article |
| source_id | TEXT | 原始實體 ID |
| text | TEXT | 完整文字 (用於 LLM context) |
| metadata | TEXT | JSON metadata |
| embedding_id | TEXT | Vectorize 中的向量 ID |
| created_at | TEXT | 建立時間 |

### 查詢日誌表 (ai_query_logs)

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | TEXT | 主鍵 |
| user_id | TEXT | 使用者 ID (可選) |
| query | TEXT | 使用者問題 |
| response | TEXT | AI 回答 |
| sources | TEXT | JSON 來源列表 |
| latency_ms | INTEGER | 回應延遲 |
| feedback_score | INTEGER | 使用者評分 (1-5) |
| created_at | TEXT | 建立時間 |

## 文件模板

### 路線文件模板

```
路線名稱：{name} ({nameEn})
所屬岩場：{crag_name} - {area_name}
難度等級：{grade}
路線類型：{route_type}
路線長度：{length}
bolt 數量：{bolt_count}
描述：{description}
地區：{region}
適合季節：{seasons}
首攀資訊：{first_ascent}
```

### 岩場文件模板

```
岩場名稱：{name}
地區：{region}
位置：{location}
海拔：{altitude}
岩石類型：{rock_type}
攀岩類型：{climbing_types}
難度範圍：{difficulty_range}
路線數量：{route_count}
接近時間：{approach_time} 分鐘
交通資訊：{access_info}
停車資訊：{parking_info}
最佳季節：{best_seasons}
描述：{description}
```

### 影片文件模板

```
影片標題：{title}
頻道：{channel}
類別：{category}
標籤：{tags}
描述：{description}
發布日期：{published_at}
YouTube 連結：https://youtube.com/watch?v={youtube_id}
```

## Vectorize 索引設定

```toml
# Vectorize 索引配置
name = "nobodyclimb-routes"
dimensions = 1024
metric = "cosine"

# Metadata 索引欄位
[metadata_indexes]
type = "string"      # route, crag, video
crag_id = "string"   # 岩場 ID
region = "string"    # 地區
route_type = "string" # sport, trad, boulder, mixed
grade_numeric = "number" # 難度數值化
```

## 支援的查詢類型

### 1. 地區+難度查詢
```
使用者: 「北部有什麼適合 5.10 的戶外路線？」

處理流程:
1. 提取關鍵詞: 北部, 5.10
2. 向量搜尋 + metadata 過濾
3. 組合 context
4. LLM 生成回答
```

### 2. 岩場推薦
```
使用者: 「推薦適合新手的龍洞岩場路線」

處理流程:
1. 識別岩場: 龍洞
2. 過濾難度: 初學者級別
3. 返回推薦路線列表
```

### 3. 裝備建議
```
使用者: 「這條路線需要什麼裝備？」

處理流程:
1. 識別路線
2. 根據路線類型推斷裝備
3. 生成裝備建議
```

### 4. 季節查詢
```
使用者: 「冬天可以爬的岩場有哪些？」

處理流程:
1. 過濾 best_seasons 包含「冬」的岩場
2. 返回符合條件的岩場列表
```

### 5. 影片搜尋
```
使用者: 「有關於 5.12 路線的教學影片嗎？」

處理流程:
1. 搜尋影片內容
2. 過濾相關難度
3. 返回影片列表
```

## Prompt 設計

### System Prompt

```
你是 NobodyClimb 攀岩社群平台的 AI 助手。你的任務是根據提供的資料，回答使用者關於台灣攀岩的問題。

回答原則：
1. 只根據提供的資料回答，不要編造資訊
2. 如果資料不足以回答問題，請誠實告知
3. 使用繁體中文回答
4. 提供具體的路線名稱、難度、位置等資訊
5. 如果適合，推薦相關的影片或文章

你擁有的資料包括：
- 台灣各地的戶外岩場資訊
- 各岩場的攀岩路線資料
- 攀岩相關的 YouTube 影片
- 攀岩社群的文章

請簡潔、準確地回答使用者的問題。
```

### Query Template

```
根據以下資料回答使用者的問題：

---
{context}
---

使用者問題：{query}

請根據上述資料提供準確的回答。如果資料中沒有相關資訊，請告知使用者。
```

## 快取策略

### KV 快取

```typescript
// 快取 key 設計
const cacheKey = `ai:query:${hashQuery(query)}`;

// TTL 設定
const TTL = 3600; // 1 小時

// 快取流程
async function askWithCache(query: string): Promise<AIResponse> {
  const cached = await env.CACHE.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const response = await executeRAG(query);
  await env.CACHE.put(cacheKey, JSON.stringify(response), { expirationTtl: TTL });

  return response;
}
```

## 錯誤處理

| 錯誤類型 | 處理方式 |
|---------|---------|
| Embedding 失敗 | 重試 3 次，然後返回錯誤 |
| Vectorize 超時 | 返回快取結果或錯誤 |
| LLM 生成失敗 | 返回純搜尋結果 |
| 無相關結果 | 返回友善提示 |
