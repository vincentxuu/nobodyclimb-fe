## 1. DB Migration

- [x] 1.1 建立 migration 檔案，在 `ai_query_logs` 表新增 4 個 nullable 欄位：`query_type TEXT`、`model_used TEXT`、`retrieval_score REAL`、`self_reflection_triggered INTEGER DEFAULT 0`
- [x] 1.2 執行本地 migration：`pnpm db:migrate`，確認 schema 變更正確
- [x] 1.3 執行遠端 migration：`pnpm db:migrate:remote`

## 2. 型別與 Prompt 更新

- [x] 2.1 更新 `ParsedQuery` 介面（`backend/src/types.ts` 第 96 行），新增 `query_type?: 'simple' | 'complex' | 'general-knowledge'` 欄位
- [x] 2.2 更新 `TOOL_SELECTION_PROMPT`（`backend/src/utils/ai-prompts.ts`），在輸出 JSON schema 中加入 `query_type` 欄位定義與分類規則說明（simple：直接 lookup；complex：比較、推薦、多條件分析）
- [x] 2.3 在 `ai-prompts.ts` 新增 `SELF_REFLECTION_PROMPT` 常數，要求模型回答「這個回答是否完整回答了問題？只回覆 YES 或 NO」

## 3. Query Classifier 整合

- [x] 3.1 更新 `parseQueryWithLLM()` 函式，從 LLM A 回應中解析並回傳 `query_type`（解析失敗時 fallback 為 `'complex'`）
- [x] 3.2 在 `ask()` 入口決定 `queryType`：相似路線意圖優先設為 `'complex'`；`general_knowledge` 保持原有路徑；其餘從 `parsedQuery.query_type` 取得
- [x] 3.3 依 `queryType` 決定目標 LLM 模型：`simple` 與 `general-knowledge` 使用 `@cf/meta/llama-3.1-8b-instruct`；`complex` 使用設定的 `llmModel`

## 4. 簡單查詢快速通道

- [x] 4.1 重構 `ask()` 的 Stage 1b：`queryType === 'simple'` 時跳過 `generateHyDE()` 呼叫（僅執行 Tool Calling，不生成 HyDE 文件）
- [x] 4.2 重構 Stage 3-4：`hydeDoc` 為空時執行單路 Vectorize 搜尋（已有此邏輯，確認 simple 路徑正確觸發），不執行 RRF 合併（直接用 query vector 結果）

## 5. Corrective RAG（CRAG）

- [x] 5.1 在 RRF 過濾後（`filteredDocs` 計算完成後），偵測是否為空（`filteredDocs.length === 0` 且未曾執行 CRAG retry）
- [x] 5.2 CRAG retry：複製 `vectorFilter`，移除 `grade_numeric` 欄位，重新執行 Vectorize 查詢（複用已有 `queryVector`）並重新過濾
- [x] 5.3 記錄 `retrievalScore`：取 RRF 過濾前的最高分數（`Math.max(...rrfScores, 0)`），供 query log 使用

## 6. Self-reflection

- [x] 6.1 在 LLM C 生成回答後（`queryType === 'complex'` 且非 general-knowledge 路徑），呼叫 `SELF_REFLECTION_PROMPT` + 原始 query + 生成回答，取得 YES/NO 判斷
- [x] 6.2 若判斷為 NO 且回答長度 >= 50 字元：重新呼叫 LLM C 生成一次；否則保留原始回答
- [x] 6.3 使用 regex 解析 self-reflection 回應（`/^\s*YES\s*$/i`），任何非 NO 的輸出視為 YES
- [x] 6.4 記錄 `selfReflectionTriggered`：重新生成時設為 `1`，否則為 `0`

## 7. Query Log 更新

- [x] 7.1 更新 `logQuery()` 函式簽名，接受選用參數：`queryType`、`modelUsed`、`retrievalScore`、`selfReflectionTriggered`
- [x] 7.2 更新所有 `logQuery()` 呼叫點（general-knowledge 路徑、RAG 路徑），傳入對應的追蹤值
- [x] 7.3 確認 INSERT SQL 語句包含 4 個新欄位（欄位均為 nullable，舊版 code 不傳入時資料庫自動填 NULL，向下相容）
