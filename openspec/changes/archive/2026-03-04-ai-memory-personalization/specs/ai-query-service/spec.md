## MODIFIED Requirements

### Requirement: RAG 查詢執行
系統應透過結合向量搜尋結果與 LLM 生成來執行 RAG（檢索增強生成）查詢。查詢 SHALL 在 LLM 呼叫前經過輸入 guardrails 驗證，LLM 回應 SHALL 經過輸出 guardrails 過濾後才返回。對已登入用戶，查詢流程 SHALL 額外注入用戶記憶摘要與完攀紀錄 context。

#### Scenario: 執行基礎 RAG 查詢
- **WHEN** 使用者詢問「龍洞有什麼 5.10 的路線？」
- **THEN** 服務執行：1) 輸入 guardrails 驗證，2) 轉換查詢為 embedding，3) 搜尋 Vectorize，4) 取得 D1 文件，5) 生成 LLM 回應，6) 輸出 guardrails 過濾，7) 返回結果

#### Scenario: 回傳包含來源的答案
- **WHEN** RAG 查詢成功完成
- **THEN** 回應包含：答案文字、包含 id/type/title/url/score 的來源陣列，以及 query_id

#### Scenario: 輸入驗證失敗時中止查詢
- **WHEN** 輸入 guardrails 偵測到惡意模式
- **THEN** `QueryService.ask()` 拋出 `GuardrailError`，上層路由返回 400，不進行後續 RAG 步驟

#### Scenario: 已登入用戶查詢時注入個人化 context
- **WHEN** 已登入用戶發送查詢，且有記憶或完攀紀錄
- **THEN** LLM prompt 包含用戶記憶摘要與完攀紀錄描述，回答依據個人化資訊調整

### Requirement: System prompt 設定
系統應使用可設定的 system prompt，指示 LLM 僅根據提供的資料以繁體中文回答。對已登入且有記憶或完攀紀錄的用戶，system prompt SHALL 在基礎指令前附加個人化 context 段落。

#### Scenario: 套用 system prompt 規則
- **WHEN** LLM 生成回應
- **THEN** 回應遵循規則：只使用提供的資料、使用繁體中文、簡潔扼要

#### Scenario: 已登入用戶帶有個人化 context
- **WHEN** 已登入用戶有記憶「攀岩程度約 5.11，偏好台中地區」及完攀紀錄
- **THEN** system prompt 前段包含「用戶資訊：攀岩程度約 5.11，偏好台中地區。已完攀：XX（5.10a）、YY（5.11b）。建議挑戰難度：5.11c-5.12a。」

#### Scenario: 匿名用戶或無資料時使用標準 system prompt
- **WHEN** 未登入用戶，或已登入但無記憶與完攀紀錄
- **THEN** 使用標準 system prompt，不加入個人化段落
