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

## ADDED Requirements (ai-quality-assurance)

### Requirement: Judge 評估整合
系統 SHALL 在 LLM 回答生成完成後、回傳給用戶前，同步呼叫 judge LLM 取得 groundedness_score 與 auto_score，並在 groundedness_score 低於閾值時向回答注入免責聲明前綴。Judge 邏輯 MUST 在超時（8 秒）時靜默失敗，不影響主回答返回。

#### Scenario: Judge 在主回答後執行
- **WHEN** LLM 主回答生成完成（parseSuggestedQuestions 後）
- **THEN** 系統以 query + context（前 800 字元）+ response 為輸入呼叫 judge LLM

#### Scenario: 免責聲明注入（中等 groundedness）
- **WHEN** judge 回傳 0.6 <= groundedness < 0.8
- **THEN** 回答的 `answer` 欄位前綴加入「⚠️ 部分資訊來自推斷，建議實地確認\n\n」

#### Scenario: 免責聲明注入（低 groundedness）
- **WHEN** judge 回傳 groundedness < 0.6
- **THEN** 回答的 `answer` 欄位前綴加入「❓ 以下資訊基於現有資料推斷，建議實地確認\n\n」

#### Scenario: 快取命中不執行 judge
- **WHEN** 查詢命中 KV 快取直接返回
- **THEN** 不呼叫 judge LLM，直接返回快取回應（groundedness_score、auto_score 維持快取時的值）

### Requirement: 查詢記錄擴充
系統 SHALL 擴充 `logQuery()` 方法，新增 optional 參數：`groundednessScore`、`autoScore`、`embeddingMs`、`retrievalMs`、`generationMs`，並將這些值寫入 `ai_query_logs` 對應欄位。未提供的 optional 參數預設為 null。

#### Scenario: 完整參數記錄
- **WHEN** RAG 查詢完成並呼叫 logQuery() 含所有新參數
- **THEN** ai_query_logs 記錄包含 5 個新欄位的值

#### Scenario: 舊版呼叫向後相容
- **WHEN** logQuery() 以舊版簽名呼叫（不含新參數）
- **THEN** 查詢記錄成功寫入，新欄位值為 null，不拋出錯誤
