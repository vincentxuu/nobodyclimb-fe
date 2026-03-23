## ADDED Requirements

### Requirement: Metrics API 端點

系統 SHALL 提供 `GET /api/v1/admin/ai/metrics` 端點，回傳指定時間範圍內的每日聚合指標時間序列，供 Admin Metrics 頁面消費。

#### Scenario: 預設查詢 30 天資料

- **WHEN** 管理員呼叫 `GET /admin/ai/metrics`（未帶 `range` 參數）
- **THEN** 系統回傳過去 30 天的每日聚合資料，`range` 欄位為 `"30d"`

#### Scenario: 指定時間範圍

- **WHEN** 管理員呼叫 `GET /admin/ai/metrics?range=7d`
- **THEN** 系統回傳過去 7 天的每日聚合資料
- **WHEN** 管理員呼叫 `GET /admin/ai/metrics?range=90d`
- **THEN** 系統回傳過去 90 天的每日聚合資料

#### Scenario: 無效 range 參數

- **WHEN** 管理員呼叫 `GET /admin/ai/metrics?range=999d`
- **THEN** 系統回傳 400 錯誤，訊息說明合法值為 `7d`、`30d`、`90d`

#### Scenario: 需要 Admin 驗證

- **WHEN** 未驗證或非 Admin 角色的使用者呼叫此端點
- **THEN** 系統回傳 401 或 403 錯誤

### Requirement: 每日延遲聚合

系統 SHALL 在 Metrics API 回應的每日物件中包含分段延遲的 P50 與 P95 百分位數。

#### Scenario: 完整延遲聚合

- **WHEN** 該日有至少 1 筆非快取命中的查詢（`embedding_ms IS NOT NULL`）
- **THEN** 每日物件的 `latency` 欄位 SHALL 包含：`embedding_p50`、`embedding_p95`、`retrieval_p50`、`retrieval_p95`、`generation_p50`、`generation_p95`、`total_p50`、`total_p95`，皆為正整數

#### Scenario: 該日無有效延遲數據

- **WHEN** 該日所有查詢皆為快取命中（`embedding_ms` 全為 null）
- **THEN** `latency` 欄位所有百分位數 SHALL 為 `null`

#### Scenario: 總延遲使用 latency_ms 欄位

- **WHEN** 計算 `total_p50` 和 `total_p95`
- **THEN** 系統 SHALL 使用 `ai_query_logs.latency_ms` 欄位（包含所有查詢，含快取命中）

### Requirement: 每日品質聚合

系統 SHALL 在 Metrics API 回應的每日物件中包含品質指標的平均值。

#### Scenario: 品質指標聚合

- **WHEN** 該日有查詢記錄
- **THEN** 每日物件的 `quality` 欄位 SHALL 包含：`avg_groundedness`（0.0-1.0，2 位小數）、`avg_auto_score`（1-4，1 位小數）、`avg_feedback_score`（1-5，1 位小數，僅計算有 feedback 的查詢）

#### Scenario: 無 feedback 的日期

- **WHEN** 該日無任何使用者提交 feedback
- **THEN** `avg_feedback_score` SHALL 為 `null`

### Requirement: 每日快取聚合

系統 SHALL 在 Metrics API 回應的每日物件中包含快取命中統計。

#### Scenario: 快取聚合計算

- **WHEN** 該日有查詢記錄
- **THEN** 每日物件的 `cache` 欄位 SHALL 包含：`hit_rate`（0.0-1.0，2 位小數）、`kv_hits`（整數）、`semantic_hits`（整數）、`misses`（整數）

#### Scenario: KV 與語意快取區分

- **WHEN** 計算快取命中類型
- **THEN** 系統 SHALL 使用 SQL `json_extract(pipeline_trace, '$.cache.type')` 區分快取類型：值為 `'kv'` 計入 `kv_hits`，值為 `'semantic'` 計入 `semantic_hits`，`cache_hit = 0` 的計入 `misses`

#### Scenario: pipeline_trace 缺失時的快取判斷

- **WHEN** `cache_hit = 1` 但 `pipeline_trace` 為 null 或不含 `cache.type` 欄位
- **THEN** 該筆 SHALL 計入 `kv_hits`（KV 快取為預設歸類）

### Requirement: 每日查詢類型分佈

系統 SHALL 在 Metrics API 回應的每日物件中包含查詢類型分佈。

#### Scenario: 查詢類型計數

- **WHEN** 該日有查詢記錄
- **THEN** 每日物件的 `query_types` 欄位 SHALL 包含各類型的計數：`simple`、`complex`、`general-knowledge`、`guardrails_blocked`，皆為非負整數

#### Scenario: 未出現的查詢類型

- **WHEN** 該日無 `complex` 類型查詢
- **THEN** `query_types.complex` SHALL 為 `0`（非 null 或省略）

### Requirement: Summary 聚合

系統 SHALL 在 Metrics API 回應中包含指定範圍的整體摘要。

#### Scenario: Summary 計算

- **WHEN** Metrics API 回應組裝完成
- **THEN** `summary` 物件 SHALL 包含：`total_queries`（總查詢數）、`avg_latency_ms`（平均總延遲，整數）、`avg_groundedness`（平均 groundedness，2 位小數）、`cache_hit_rate`（整體快取命中率，2 位小數）

### Requirement: 異常偵測

系統 SHALL 對每日聚合指標執行 Z-Score 異常偵測，標記偏離 7 日移動平均超過 2 個標準差的指標。

#### Scenario: 延遲異常偵測

- **WHEN** 某日的 `generation_p95` 偏離前 7 日移動平均超過 2σ
- **THEN** 該日的 `anomalies` 陣列 SHALL 包含 `"latency.generation_p95"`

#### Scenario: 品質異常偵測

- **WHEN** 某日的 `avg_groundedness` 偏離前 7 日移動平均超過 2σ（含下降方向）
- **THEN** 該日的 `anomalies` 陣列 SHALL 包含 `"quality.avg_groundedness"`

#### Scenario: 低流量日不偵測異常

- **WHEN** 某日的 `query_count` 小於 5
- **THEN** 該日的 `anomalies` 陣列 SHALL 為空陣列（不進行異常偵測）

#### Scenario: 歷史不足時不偵測異常

- **WHEN** 某日之前不足 7 天的歷史資料（如時間範圍開頭的前 7 天）
- **THEN** 該日的 `anomalies` 陣列 SHALL 為空陣列

#### Scenario: 無異常時回傳空陣列

- **WHEN** 該日所有指標皆在 2σ 範圍內
- **THEN** `anomalies` SHALL 為 `[]`（空陣列，非 null 或省略）

### Requirement: Metrics 頁面延遲趨勢圖

系統 SHALL 在 `/admin/ai/metrics` 頁面顯示分段延遲趨勢折線圖。

#### Scenario: 顯示延遲趨勢

- **WHEN** 管理員造訪 Metrics 頁面
- **THEN** 延遲趨勢圖 SHALL 顯示 6 條折線：embedding P50/P95、retrieval P50/P95、generation P50/P95，X 軸為日期，Y 軸為毫秒

#### Scenario: 延遲圖 hover 提示

- **WHEN** 管理員 hover 圖表上的某個日期點
- **THEN** tooltip SHALL 顯示該日所有 6 個延遲百分位數值

#### Scenario: 延遲數據缺失

- **WHEN** 某日的延遲百分位為 null
- **THEN** 該日的折線 SHALL 中斷（不連線至下一個有效點）

### Requirement: Metrics 頁面品質趨勢圖

系統 SHALL 在 `/admin/ai/metrics` 頁面顯示品質指標趨勢折線圖。

#### Scenario: 顯示品質趨勢

- **WHEN** 管理員造訪 Metrics 頁面
- **THEN** 品質趨勢圖 SHALL 顯示 3 條折線：avg_groundedness（左 Y 軸 0-1）、avg_auto_score（左 Y 軸 0-4）、avg_feedback_score（右 Y 軸 1-5），X 軸為日期

#### Scenario: Feedback 無值時不顯示

- **WHEN** 某日 avg_feedback_score 為 null
- **THEN** feedback 折線 SHALL 在該日中斷

### Requirement: Metrics 頁面快取效率圖

系統 SHALL 在 `/admin/ai/metrics` 頁面顯示快取命中率趨勢面積圖。

#### Scenario: 顯示快取趨勢

- **WHEN** 管理員造訪 Metrics 頁面
- **THEN** 快取效率圖 SHALL 顯示 hit_rate 面積圖（0-1 範圍），X 軸為日期

#### Scenario: 快取圖 hover 提示

- **WHEN** 管理員 hover 圖表上的某個日期點
- **THEN** tooltip SHALL 顯示：hit_rate 百分比、KV 命中數、語意命中數、未命中數

### Requirement: Metrics 頁面查詢類型分佈圖

系統 SHALL 在 `/admin/ai/metrics` 頁面顯示查詢類型堆疊柱狀圖。

#### Scenario: 顯示查詢類型分佈

- **WHEN** 管理員造訪 Metrics 頁面
- **THEN** 查詢類型圖 SHALL 顯示堆疊柱狀圖，每日一根柱子，分為 4 色：simple、complex、general-knowledge、guardrails_blocked

#### Scenario: 類型圖 hover 提示

- **WHEN** 管理員 hover 某日柱子
- **THEN** tooltip SHALL 顯示各類型查詢數與佔比百分比

### Requirement: Metrics 頁面異常標記

系統 SHALL 在 Metrics 頁面的圖表上視覺標記異常日。

#### Scenario: 延遲圖異常標記

- **WHEN** 某日的 `anomalies` 陣列包含 `latency.*` 項目
- **THEN** 延遲趨勢圖上該日 SHALL 以紅色圓點標記

#### Scenario: 品質圖異常標記

- **WHEN** 某日的 `anomalies` 陣列包含 `quality.*` 項目
- **THEN** 品質趨勢圖上該日 SHALL 以紅色圓點標記

#### Scenario: 異常 hover 說明

- **WHEN** 管理員 hover 異常標記的紅色圓點
- **THEN** tooltip SHALL 額外顯示偏離方向（高於/低於平均）與異常指標名稱

### Requirement: Metrics 頁面時間範圍選擇

系統 SHALL 在 Metrics 頁面頂部提供時間範圍選擇器。

#### Scenario: 時間範圍切換

- **WHEN** 管理員點擊「7 天」/「30 天」/「90 天」按鈕
- **THEN** 所有圖表與 summary 卡片 SHALL 重新載入對應範圍的資料

#### Scenario: 預設時間範圍

- **WHEN** 管理員首次造訪 Metrics 頁面
- **THEN** 預設顯示 30 天範圍

#### Scenario: 載入狀態

- **WHEN** 切換時間範圍後資料載入中
- **THEN** 圖表區域 SHALL 顯示 skeleton loading 動畫

### Requirement: Metrics 頁面 Summary 卡片

系統 SHALL 在 Metrics 頁面頂部顯示 4 張 summary KPI 卡片。

#### Scenario: Summary 卡片內容

- **WHEN** Metrics 頁面資料載入完成
- **THEN** 頁面頂部 SHALL 顯示 4 張卡片：總查詢數、平均延遲（ms）、平均 Groundedness（0-1）、快取命中率（%）

#### Scenario: Summary 反映選擇的時間範圍

- **WHEN** 管理員選擇「7 天」範圍
- **THEN** 4 張 summary 卡片 SHALL 顯示該 7 天範圍內的聚合值
