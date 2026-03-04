# AI Pipeline 強化設計文件（HyDE + LLM Query Understanding + Tool Calling + Re-ranking）

## 概覽

本次強化將 LLM 從「最後一步答案生成」擴展為「全程參與搜尋意圖解析與文件擴充」，顯著提升語義搜尋品質。

### 核心改進
- **LLM Tool Calling**：LLM A 解析使用者意圖，選擇搜尋工具與過濾參數（取代 regex/字串比對）
- **HyDE**（Hypothetical Document Embeddings）：LLM B 生成假設性理想答案文件，以其向量進行第二路搜尋
- **雙路向量搜尋 + 合併**：query 向量 + HyDE 向量分別搜尋，去重合併取最佳 Top-10
- **隱性 Re-ranking**：LLM C（生成 LLM）系統提示包含「自行忽略不相關資料」指引

---

## Pipeline 架構

```
[使用者 query]
      │
      ├──────────────────────── parallel ────────────────────────┐
      ▼                                                            ▼
 LLM A: Tool Selection                                     LLM B: HyDE
（解析意圖、選工具、選參數）                        （生成假設性理想答案文件）
      │                                                            │
      ▼                                                            ▼
 buildFiltersFromParsed()                             Embed(hydeDoc) → hydeVector
（DB 解析 crag/area 名稱 → ID）                                   │
      │                                                            │
      └──────────────────────── parallel ────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
           Vectorize Search 1              Vectorize Search 2
    （原始 query embedding + LLM 過濾）  （HyDE embedding，無過濾）
                    │                               │
                    └───────────── merge ───────────┘
                                    │
                             Top 10 docs（去重）
                             DB: 取得完整原文
                                    │
                                    ▼
                           LLM C: Generate（含隱性 re-ranking）
                   （系統提示要求只使用最相關資料回答）
                                    │
                          Cache + Log + Return
```

---

## 時序分析

| 階段 | 操作 | 預估時間 |
|------|------|---------|
| Stage 1a | 取 crags/areas 清單（DB） | ~0.2s |
| Stage 1b | 並行 LLM A（Tool Calling）+ LLM B（HyDE） | ~2-3s |
| Stage 2 | buildFiltersFromParsed（DB 名稱解析） | ~0.2s |
| Stage 3 | 並行 embed(query) + embed(hydeDoc) | ~0.5s |
| Stage 4 | 並行兩路 Vectorize 搜尋 | ~0.3s |
| Stage 5 | D1 取完整文件 | ~0.2s |
| Stage 6 | LLM C 生成回答 | ~3-5s |
| **合計** | | **~7-10s** |

快取命中時（KV TTL 1hr）回傳 < 100ms。

---

## LLM 呼叫次數

- **LLM A**（Tool Calling/Query Understanding）：1 次
- **LLM B**（HyDE 文件生成）：1 次
- **LLM C**（答案生成）：1 次
- **A + B 並行**，C 序列於搜尋之後

---

## Prompt 設計

### TOOL_SELECTION_PROMPT（LLM A）
注入已知岩場/區域/地區清單，要求 LLM 只輸出 JSON，選擇：
- `search_routes`：搜尋路線，可選 crag_name、area_name、grade、route_type、region
- `search_crags`：搜尋岩場，可選 region、climbing_type
- `general_knowledge`：一般攀岩知識，不需搜尋

### HYDE_PROMPT（LLM B）
要求生成 100 字以內假設性理想答案文件，包含攀岩術語，直接輸出內容。

### SYSTEM_PROMPT 更新（LLM C）
新增 Rule 9：「若提供的資料中有不相關的內容，請自行忽略，只根據真正相關的資料作答。」

---

## Fallback 策略

| 失敗情況 | Fallback 行為 |
|---------|---------------|
| `parseQueryWithLLM` 回傳 null | 使用現有 regex 方法（`extractGradeFilter`、`extractLocationFilter`、`extractTypeFilter`） |
| `generateHyDE` 回傳空字串 | 跳過 HyDE，只用原始 query embedding 搜尋 |
| 任一 Vectorize 搜尋失敗 | `mergeResults` 使用另一路結果 |
| LLM 回傳 JSON 格式錯誤 | `parseQueryWithLLM` catch 回傳 null，觸發 regex fallback |

---

## 修改的檔案

| 檔案 | 修改內容 |
|------|---------|
| `backend/src/utils/ai-prompts.ts` | 新增 `TOOL_SELECTION_PROMPT`、`HYDE_PROMPT`；SYSTEM_PROMPT 加入 Rule 9 |
| `backend/src/types.ts` | 新增 `ParsedQuery` 介面；AI.run 加入選用第三參數 |
| `backend/src/services/query.ts` | 新增 `parseQueryWithLLM`、`generateHyDE`、`buildFiltersFromParsed`、`mergeResults` 四個私有方法；重寫 `ask()` 串接新 pipeline |

---

## 驗證方式

```bash
# 啟動 dev server
cd backend && pnpm dev

# 測試 query understanding（有岩場名稱 + 難度）
curl -X POST http://localhost:8787/api/v1/ai/ask \
  -H "Content-Type: application/json" \
  -d '{"query":"龍洞有什麼5.11的路線？"}'

# 測試 HyDE 效益（模糊查詢）
curl -X POST http://localhost:8787/api/v1/ai/ask \
  -H "Content-Type: application/json" \
  -d '{"query":"有挑戰性但不要太難的路線"}'

# 測試 general_knowledge（不需搜尋 DB）
curl -X POST http://localhost:8787/api/v1/ai/ask \
  -H "Content-Type: application/json" \
  -d '{"query":"攀岩前要做什麼熱身？"}'
```

預期：
- 第一個查詢：sources 包含龍洞 5.11 路線，latency ≤ 10s
- 第二個查詢：結果比純 regex 方法更相關（HyDE 效益）
- 第三個查詢：LLM 判斷為 `general_knowledge`，不需 sources 也能回答
