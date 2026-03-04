## ADDED Requirements

### Requirement: 品質 KPI 面板
Admin API SHALL 提供 `GET /admin/ai/quality-stats` 端點，回傳 AI 品質相關的統計數據，供 Dashboard 顯示。回傳資料包含：過去 7 天每日平均 groundedness_score、每日平均 auto_score、每日平均用戶 feedback_score（1–5 尺度）、以及三者的整體平均值。

#### Scenario: 取得品質統計
- **WHEN** 管理員呼叫 GET /admin/ai/quality-stats
- **THEN** API 回傳 JSON，包含：daily_groundedness（7 天陣列，各含 date 與 avg_score）、daily_auto_score（7 天陣列）、daily_feedback（7 天陣列）、overall 彙總

#### Scenario: 無評分資料時回傳 null
- **WHEN** 某日尚無任何評分（所有欄位為 null）
- **THEN** 該日的 avg_score 回傳 null，不影響其他日期的計算

#### Scenario: 需要 Admin 權限
- **WHEN** 非管理員用戶呼叫 GET /admin/ai/quality-stats
- **THEN** 回傳 403 Forbidden

### Requirement: RAG 分段延遲分析
Admin API SHALL 提供 `GET /admin/ai/latency-stats` 端點，回傳 RAG 各階段的延遲分布統計（P50、P95）。分析範圍：過去 24 小時的非快取查詢（embedding_ms NOT NULL）。

#### Scenario: 取得延遲統計
- **WHEN** 管理員呼叫 GET /admin/ai/latency-stats
- **THEN** API 回傳：embedding_p50、embedding_p95、retrieval_p50、retrieval_p95、generation_p50、generation_p95（單位毫秒）

#### Scenario: 樣本不足時的處理
- **WHEN** 過去 24 小時的非快取查詢少於 10 筆
- **THEN** 回傳現有樣本的計算結果，response 含 `sample_count` 欄位說明樣本數

#### Scenario: 需要 Admin 權限
- **WHEN** 非管理員用戶呼叫 GET /admin/ai/latency-stats
- **THEN** 回傳 403 Forbidden

### Requirement: 待審核標記列表
Admin API SHALL 提供 `GET /admin/ai/flagged` 端點，回傳 `is_reviewed = false` 的標記記錄列表，支援依 flag_reason 篩選，依 created_at 降序排列，預設回傳最近 50 筆。

#### Scenario: 取得待審核列表
- **WHEN** 管理員呼叫 GET /admin/ai/flagged
- **THEN** 回傳 is_reviewed = false 的標記列表，每筆含：id、query_log_id、flag_reason、created_at，以及對應的 query 文字（JOIN ai_query_logs）

#### Scenario: 依 flag_reason 篩選
- **WHEN** 管理員呼叫 GET /admin/ai/flagged?reason=low_groundedness
- **THEN** 只回傳 flag_reason = low_groundedness 的記錄

#### Scenario: 標記已處理
- **WHEN** 管理員呼叫 PATCH /admin/ai/flagged/:id，body = `{ "is_reviewed": true }`
- **THEN** 該標記記錄的 is_reviewed 更新為 true，下次查詢不再出現

#### Scenario: 需要 Admin 權限
- **WHEN** 非管理員用戶呼叫任何 /admin/ai/flagged 端點
- **THEN** 回傳 403 Forbidden
