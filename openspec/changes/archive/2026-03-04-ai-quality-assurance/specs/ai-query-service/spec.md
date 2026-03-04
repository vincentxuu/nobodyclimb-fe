## ADDED Requirements

### Requirement: Judge 評估整合
系統 SHALL 在 LLM 回答生成完成後、回傳給用戶前，同步呼叫 judge LLM 取得 groundedness_score 與 auto_score，並在 groundedness_score 低於閾值時向回答注入免責聲明前綴。Judge 邏輯 MUST 在超時（3 秒）時靜默失敗，不影響主回答返回。

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
