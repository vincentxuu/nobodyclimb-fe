## MODIFIED Requirements

### 需求：查詢記錄
系統應將所有查詢記錄到 ai_query_logs 表格，用於分析和改進。

#### 場景：記錄成功查詢
- **當** RAG 查詢完成
- **則** 建立包含以下內容的日誌記錄：query、response、sources、latency_ms、user_id（如已驗證）、query_type、model_used、retrieval_score、self_reflection_triggered

#### 場景：記錄沒有使用者的查詢
- **當** 匿名使用者進行查詢
- **則** 日誌記錄的 user_id 為 null，其餘欄位（含 query_type、model_used）正常記錄
