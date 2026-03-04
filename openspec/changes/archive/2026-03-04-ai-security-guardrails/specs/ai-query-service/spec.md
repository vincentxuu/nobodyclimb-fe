## MODIFIED Requirements

### Requirement: RAG 查詢執行
系統應透過結合向量搜尋結果與 LLM 生成來執行 RAG（檢索增強生成）查詢。查詢 SHALL 在 LLM 呼叫前經過輸入 guardrails 驗證，LLM 回應 SHALL 經過輸出 guardrails 過濾後才返回。

#### Scenario: 執行基礎 RAG 查詢
- **WHEN** 使用者詢問「龍洞有什麼 5.10 的路線？」
- **THEN** 服務執行：1) 輸入 guardrails 驗證，2) 轉換查詢為 embedding，3) 搜尋 Vectorize，4) 取得 D1 文件，5) 生成 LLM 回應，6) 輸出 guardrails 過濾，7) 返回結果

#### Scenario: 回傳包含來源的答案
- **WHEN** RAG 查詢成功完成
- **THEN** 回應包含：答案文字、包含 id/type/title/url/score 的來源陣列，以及 query_id

#### Scenario: 輸入驗證失敗時中止查詢
- **WHEN** 輸入 guardrails 偵測到惡意模式
- **THEN** `QueryService.ask()` 拋出 `GuardrailError`，上層路由返回 400，不進行後續 RAG 步驟
