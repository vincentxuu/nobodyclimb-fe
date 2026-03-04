## ADDED Requirements

### Requirement: RAG 分段 Latency 追蹤
系統 SHALL 在 RAG 查詢執行過程中，分別記錄三個關鍵階段的耗時（毫秒）：embedding 階段、retrieval 階段（向量搜尋 + reranking + MMR）、generation 階段（LLM 生成 + 回答後處理）。計時使用 `Date.now()` 差值，精度約 ±5ms。

#### Scenario: 完整 RAG pipeline 計時
- **WHEN** 查詢走完整 RAG 流程（embedding → search → LLM）
- **THEN** 系統記錄 embedding_ms、retrieval_ms、generation_ms 三個數值，皆為正整數

#### Scenario: 快取命中時不計時
- **WHEN** 查詢命中 KV 快取，直接返回快取結果
- **THEN** embedding_ms、retrieval_ms、generation_ms 皆記錄為 null（無實際計算）

#### Scenario: General knowledge 路徑計時
- **WHEN** 查詢走 general_knowledge 路徑（無向量搜尋）
- **THEN** embedding_ms = null、retrieval_ms = null，generation_ms 記錄 LLM 呼叫耗時

#### Scenario: Generation 計時包含後處理
- **WHEN** LLM 生成完成後執行 parseSuggestedQuestions() 後處理
- **THEN** generation_ms 包含 LLM 呼叫 + parseSuggestedQuestions() 的完整耗時（反映用戶感受的延遲）

### Requirement: 分段延遲記錄
系統 SHALL 將三個分段延遲值寫入 `ai_query_logs` 的對應欄位（`embedding_ms`、`retrieval_ms`、`generation_ms`，INTEGER 型別，皆 nullable）。

#### Scenario: 三段延遲全部寫入
- **WHEN** 完整 RAG pipeline 執行完畢
- **THEN** logQuery() 呼叫包含三個延遲值，且均寫入 DB

#### Scenario: 延遲值不為負數
- **WHEN** 任何分段計時結果為負數（時鐘異常）
- **THEN** 該欄位記錄為 null，不寫入負值

### Requirement: 低分 Feedback 自動標記
系統 SHALL 在用戶提交 feedback_score <= 2 時，自動向 `ai_flagged_responses` 新增 flag_reason = `low_feedback` 的標記記錄。

#### Scenario: 低評分觸發標記
- **WHEN** 用戶提交 feedback_score = 1 或 2
- **THEN** 系統向 ai_flagged_responses 新增記錄：flag_reason = `low_feedback`，is_reviewed = false

#### Scenario: 中高評分不觸發標記
- **WHEN** 用戶提交 feedback_score >= 3
- **THEN** 系統不新增 low_feedback 標記

#### Scenario: 同一 query 可有多個 flag 原因
- **WHEN** 同一查詢同時符合 low_groundedness 和 low_feedback 條件
- **THEN** ai_flagged_responses 新增兩筆記錄，各有不同的 flag_reason，皆為獨立審核項目

### Requirement: 標記審核管理
`ai_flagged_responses` 資料表 SHALL 支援管理員標記「已處理」以追蹤審核進度。

#### Scenario: 管理員標記已處理
- **WHEN** 管理員審核完一筆標記記錄後呼叫更新端點
- **THEN** 該記錄的 is_reviewed = true，不再出現在「待審核」篩選結果中

#### Scenario: 未審核標記查詢
- **WHEN** Admin API 查詢 is_reviewed = false 的標記
- **THEN** 只回傳尚未審核的記錄，依 created_at 降序排列
