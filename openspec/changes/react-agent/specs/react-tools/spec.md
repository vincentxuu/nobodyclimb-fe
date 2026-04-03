## ADDED Requirements

### Requirement: search_routes tool
系統 SHALL 提供 search_routes tool，語意搜尋攀岩路線。內部複用現有 pipeline 的 embed → hybrid-search → cross-encoder → mmr → popularity-rerank 邏輯。

#### Scenario: 基本路線搜尋
- **WHEN** LLM 呼叫 search_routes({ query: "龍洞 5.10 裂隙" })
- **THEN** tool 執行語意搜尋，回傳排序後的路線列表（名稱、難度、岩場、摘要）

#### Scenario: 帶篩選條件
- **WHEN** LLM 呼叫 search_routes({ query: "適合新手的路線", crag: "龍洞" })
- **THEN** tool 在搜尋時加上 crag 篩選條件

#### Scenario: Cache 命中（cacheTTL: 3600）
- **WHEN** 同一參數的 search_routes 在 1 小時內被再次呼叫
- **THEN** 直接回傳快取結果，不執行 RAG pipeline

#### Scenario: 小模型 prompt 附加 few-shot
- **WHEN** ctx.models.orchestrator 為小模型
- **THEN** prompt 附加使用範例：
  - 「龍洞 5.10 的裂隙路線」→ `{ "query": "裂隙", "crag": "龍洞", "grade_min": "5.10a" }`
  - 「適合新手的 sport 路線」→ `{ "query": "新手 sport" }`

#### Scenario: 有 weather tool 時附加組合提示
- **WHEN** ctx.availableTools 包含 'weather'
- **THEN** prompt 附加：「如果用戶問適不適合去某個岩場，建議先用 weather 確認天氣」

### Requirement: search_crags tool
系統 SHALL 提供 search_crags tool，搜尋岩場資訊。

#### Scenario: 岩場搜尋
- **WHEN** LLM 呼叫 search_crags({ query: "北部適合新手的戶外岩場" })
- **THEN** tool 回傳符合的岩場列表（名稱、地點、難度範圍、特色）

#### Scenario: Cache 命中（cacheTTL: 21600）
- **WHEN** 同一參數的 search_crags 在 6 小時內被再次呼叫
- **THEN** 直接回傳快取結果

### Requirement: sql_query tool
系統 SHALL 提供 sql_query tool，處理結構化數據查詢。複用現有 text-to-sql 的 18 個 SQL templates。

#### Scenario: 統計查詢
- **WHEN** LLM 呼叫 sql_query({ query: "龍洞有幾條 5.10 的路線？" })
- **THEN** tool 匹配 SQL template，執行查詢，回傳格式化的統計結果

#### Scenario: SQL 無結果
- **WHEN** sql_query 執行後回傳 0 筆結果
- **THEN** tool 回傳「查無結果」訊息，讓 LLM 決定是否改用其他 tool

#### Scenario: Cache 命中（cacheTTL: 300）
- **WHEN** 同一參數的 sql_query 在 5 分鐘內被再次呼叫
- **THEN** 直接回傳快取結果

### Requirement: weather tool
系統 SHALL 提供 weather tool，查詢岩場天氣預報。

#### Scenario: 查詢天氣
- **WHEN** LLM 呼叫 weather({ crag: "龍洞" })
- **THEN** tool 回傳該岩場未來數天的天氣預報（溫度、降雨機率、風速）

#### Scenario: Cache 命中（cacheTTL: 1800）
- **WHEN** 同一岩場的 weather 在 30 分鐘內被再次呼叫
- **THEN** 直接回傳快取結果，不呼叫外部天氣 API

#### Scenario: 中文 locale 補充岩場名稱對應
- **WHEN** ctx.locale = 'zh-TW'
- **THEN** prompt 附加岩場中英文對應提示（如「龍洞」=「Longdong」）

### Requirement: user_profile tool
系統 SHALL 提供 user_profile tool，查詢用戶攀登歷史與能力。

#### Scenario: 查詢用戶資料
- **WHEN** LLM 呼叫 user_profile({ user_id: "abc123" })
- **THEN** tool 回傳用戶的能力等級、近期攀登記錄、偏好路線類型

#### Scenario: Cache 命中（cacheTTL: 600）
- **WHEN** 同一 user_id 的 user_profile 在 10 分鐘內被再次呼叫
- **THEN** 直接回傳快取結果

### Requirement: recommend tool
系統 SHALL 提供 recommend tool，個人化路線推薦。複用現有 RecommendationService。

#### Scenario: 個人化推薦
- **WHEN** LLM 呼叫 recommend({ user_id: "abc123", crag: "龍洞" })
- **THEN** tool 根據用戶能力與歷史，回傳適合的路線推薦

#### Scenario: Cache 命中（cacheTTL: 300）
- **WHEN** 同一參數的 recommend 在 5 分鐘內被再次呼叫
- **THEN** 直接回傳快取結果


### Requirement: crag_info tool
系統 SHALL 提供 crag_info tool，查詢岩場詳細資訊。

#### Scenario: 查詢岩場詳情
- **WHEN** LLM 呼叫 crag_info({ crag: "龍洞" })
- **THEN** tool 回傳岩場的交通方式、停車資訊、設施、規範、開放時間等詳情

#### Scenario: Cache 命中（cacheTTL: 21600）
- **WHEN** 同一岩場的 crag_info 在 6 小時內被再次呼叫
- **THEN** 直接回傳快取結果
