## 1. 資料庫 Migration

- [x] 1.1 建立 `backend/migrations/0049_ai_quality_assurance.sql`，加入 `ALTER TABLE ai_query_logs ADD COLUMN groundedness_score REAL`
- [x] 1.2 在同一 migration 加入其他 4 個欄位：`auto_score INTEGER`、`embedding_ms INTEGER`、`retrieval_ms INTEGER`、`generation_ms INTEGER`
- [x] 1.3 在同一 migration 建立 `ai_flagged_responses` 資料表：`id TEXT PK`、`query_log_id TEXT FK`、`flag_reason TEXT`、`is_reviewed INTEGER DEFAULT 0`、`created_at TEXT`，加上 `UNIQUE(query_log_id, flag_reason)` constraint
- [x] 1.4 在 preview 環境執行 migration：`pnpm db:migrate`，確認欄位與資料表建立成功

## 2. Judge Prompt 與解析工具

- [x] 2.1 在 `backend/src/utils/ai-prompts.ts` 新增 `JUDGE_PROMPT` 常數，要求 judge LLM 輸出 `{"groundedness": <float 0-1>, "quality": <int 1-4>}` JSON
- [x] 2.2 在 `backend/src/services/query.ts` 新增 `parseJudgeResponse(raw: string): { groundedness: number | null; quality: number | null }` 函式，使用 try/catch + regex fallback 解析 JSON；groundedness 超出 0–1 或 quality 超出 1–4 時回傳 null

## 3. RAG 分段計時

- [x] 3.1 在 `QueryService.executeQuery()` 的 embedding 呼叫前後加入 `Date.now()` 計時，計算 `embeddingMs`
- [x] 3.2 在 retrieval 階段（vector search → reranking → MMR 全程）前後加入計時，計算 `retrievalMs`
- [x] 3.3 在 generation 階段（LLM 呼叫開始 → `parseSuggestedQuestions` 結束）前後加入計時，計算 `generationMs`
- [x] 3.4 快取命中路徑確認不設定計時值（保持 undefined，寫入 DB 時為 null）

## 4. Judge 呼叫整合

- [x] 4.1 在 `QueryService` 新增私有方法 `runJudge(query: string, context: string, response: string): Promise<{ groundedness: number | null; quality: number | null }>`，context 截斷為前 800 字元
- [x] 4.2 `runJudge()` 使用 `@cf/meta/llama-3.1-8b-instruct` 呼叫 Workers AI，並設定 3 秒 timeout（使用 `Promise.race` + `setTimeout` reject）
- [x] 4.3 在 `executeQuery()` 主流程中，LLM 生成完成後呼叫 `runJudge()`，取得分數
- [x] 4.4 依 groundedness 分數決定是否在 `answer` 前綴加入免責聲明（< 0.6 加「❓ 以下資訊基於現有資料推斷，建議實地確認\n\n」；0.6–0.8 加「⚠️ 部分資訊來自推斷，建議實地確認\n\n」；>= 0.8 不加）

## 5. logQuery() 擴充

- [x] 5.1 擴充 `logQuery()` 的 params 型別，新增 optional 欄位：`groundednessScore?: number | null`、`autoScore?: number | null`、`embeddingMs?: number | null`、`retrievalMs?: number | null`、`generationMs?: number | null`
- [x] 5.2 更新 `logQuery()` 的 INSERT SQL，將 5 個新欄位加入 INSERT 語句，未傳入時以 `undefined ?? null` 寫入 null
- [x] 5.3 在 `executeQuery()` 呼叫 `logQuery()` 時傳入所有新參數（計時值 + judge 分數）

## 6. 低分自動標記

- [x] 6.1 在 `QueryService` 新增私有方法 `flagResponse(queryLogId: string, reason: 'low_groundedness' | 'low_feedback' | 'score_discrepancy'): Promise<void>`，向 `ai_flagged_responses` INSERT OR IGNORE
- [x] 6.2 在 `executeQuery()` 的 logQuery 之後，若 groundednessScore < 0.5 則呼叫 `flagResponse(queryId, 'low_groundedness')`
- [x] 6.3 在 `backend/src/routes/ai.ts` 的 feedback 端點，提交後若 feedback_score <= 2 則呼叫 `flagResponse(queryLogId, 'low_feedback')`
- [x] 6.4 在 feedback 端點，提交後若 auto_score 不為 null 且 |正規化後的 feedback_score - auto_score| >= 2 則呼叫 `flagResponse(queryLogId, 'score_discrepancy')`（正規化：1–2 星=1、3 星=2、4 星=3、5 星=4）

## 7. Admin API - 品質統計端點

- [x] 7.1 在 `backend/src/routes/admin-ai.ts` 新增 `GET /quality-stats` route，查詢過去 7 天每日平均 groundedness_score、auto_score、feedback_score
- [x] 7.2 `quality-stats` 回應格式：`{ daily: [{ date, avg_groundedness, avg_auto_score, avg_feedback }], overall: { avg_groundedness, avg_auto_score, avg_feedback } }`；null 欄位在計算平均時排除（使用 SQLite `AVG()` 會自動忽略 null）
- [x] 7.3 驗證端點需要 admin 權限（使用現有 auth middleware）

## 8. Admin API - 延遲分析端點

- [x] 8.1 在 `admin-ai.ts` 新增 `GET /latency-stats` route，查詢過去 24 小時 embedding_ms NOT NULL 的查詢，計算三段的 P50/P95
- [x] 8.2 P50/P95 使用 `ORDER BY + LIMIT + OFFSET` 計算近似值（D1 不支援 percentile UDF）：先 `SELECT embedding_ms ORDER BY embedding_ms`，再以 `LIMIT 1 OFFSET CAST(COUNT * 0.5 AS INT)` 取 P50、`OFFSET CAST(COUNT * 0.95 AS INT)` 取 P95，三個欄位各執行一次；回傳格式：`{ embedding_p50, embedding_p95, retrieval_p50, retrieval_p95, generation_p50, generation_p95, sample_count }`
- [x] 8.3 驗證端點需要 admin 權限

## 9. Admin API - 標記管理端點

- [x] 9.1 在 `admin-ai.ts` 新增 `GET /flagged` route，查詢 is_reviewed = 0 的記錄，JOIN ai_query_logs 取得 query 欄位，支援 `?reason=` query param 篩選，最多回傳 50 筆
- [x] 9.2 在 `admin-ai.ts` 新增 `PATCH /flagged/:id` route，將指定 id 的 is_reviewed 更新為 1；id 不存在時回傳 404
- [x] 9.3 驗證兩個端點皆需要 admin 權限

## 10. 驗證與部署

- [x] 10.1 在 preview 環境測試完整 RAG 查詢，確認 ai_query_logs 的新欄位有正確寫入值
- [x] 10.2 確認 judge 超時（>3s）情況下主回答正常返回，新欄位為 null
- [x] 10.3 測試 feedback_score <= 2 時 ai_flagged_responses 有新增記錄
- [x] 10.4 測試 GET /admin/ai/quality-stats、/latency-stats、/flagged 端點回傳正確格式
- [ ] 10.5 在生產環境執行 migration：`pnpm db:migrate:remote`
- [ ] 10.6 部署後端到 production：`pnpm deploy:production`
