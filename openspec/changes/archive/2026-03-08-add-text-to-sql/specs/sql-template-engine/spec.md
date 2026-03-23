## ADDED Requirements

### Requirement: SQL 模板執行
系統 SHALL 提供 `TextToSqlService` 獨立 class（`backend/src/services/text-to-sql.ts`），支援以下 SQL 模板。所有查詢 MUST 使用 D1 參數化查詢（`?` 佔位符），禁止字串拼接。`TextToSqlService` 由 `text-to-sql` pipeline step 呼叫，不直接與 `QueryService` 或 `PipelineEngine` 耦合。

支援的模板及觸發條件：

| 模板 ID | 必要參數 | 可選參數 |
|---------|---------|---------|
| `COUNT_ROUTES_AT_CRAG` | `crag_id` | — |
| `LIST_ROUTES_BY_CRITERIA` | `crag_id` | `grade_min`, `grade_max`, `route_type` |
| `LIST_ROUTES_AT_GRADE` | `crag_id`, `grade` | — |
| `ROUTE_INFO_LOOKUP` | `route_id`（驗證後） | — |
| `CRAG_INFO_LOOKUP` | `crag_id` | — |
| `RANK_CRAGS_BY_ROUTES` | — | `limit`（預設 5） |
| `GRADE_DISTRIBUTION` | `crag_id` | — |
| `ROUTE_TYPE_DISTRIBUTION` | `crag_id` | — |
| `ROUTE_FIRST_ASCENT` | `route_id`（驗證後） | — |
| `LIST_VIDEOS_FOR_ROUTE` | `route_id`（驗證後） | — |
| `ROUTES_WITH_VIDEOS` | `crag_id` | — |
| `MY_ASCENT_COUNT` | `user_id` | — |
| `MY_ASCENT_BY_TYPE` | `user_id`, `ascent_type` | — |
| `MY_ASCENT_LIST` | `user_id` | `limit`（預設 20） |
| `MY_ASCENT_AT_CRAG` | `user_id`, `crag_id` | — |
| `MY_ASCENT_BY_DATE` | `user_id`, `date_from`, `date_to` | — |
| `MY_HIGHEST_GRADE` | `user_id` | — |
| `MY_RATED_ROUTES` | `user_id`, `rating` | — |

#### Scenario: 計數模板回傳精確數字
- **WHEN** 執行 `COUNT_ROUTES_AT_CRAG`，`crag_id = 'longdong-id'`
- **THEN** D1 回傳 `{ count: 42 }`，`text-to-sql` step 將結果交輕量 LLM 組裝「龍洞共有 42 條路線。」

#### Scenario: 影片模板回傳標題與連結
- **WHEN** 執行 `LIST_VIDEOS_FOR_ROUTE`，`route_id = 'ghost-knife-id'`
- **THEN** 回傳包含 `title`、`youtube_id`、`thumbnail_url` 的陣列，依 `sort_order` 排序

#### Scenario: 個人完攀類型參數正規化
- **WHEN** 用戶輸入「我有幾條 rp？」或「我有幾條紅點？」
- **THEN** 系統將 `rp`/`紅點` 對應至 `ascent_type = 'redpoint'` 執行 `MY_ASCENT_BY_TYPE`

#### Scenario: 攀登類型中文對應
- **WHEN** 用戶輸入「龍洞有幾條運攀？」
- **THEN** 系統將 `運攀` 對應至 `route_type = 'sport'` 執行 `ROUTE_TYPE_DISTRIBUTION` 或 `LIST_ROUTES_BY_CRITERIA`

### Requirement: Hybrid 候選集查詢
`TextToSqlService` SHALL 提供 `queryCandidates(params)` 方法，供 `text-to-sql` pipeline step 在 `hybrid` 路徑中取得候選集。

#### Scenario: 撈取候選集
- **WHEN** `text-to-sql` step 呼叫 `queryCandidates({ crag_name: '龍洞', grade_max: '5.10d' })`
- **THEN** 回傳最多 20 條符合條件的路線（含 name、grade、route_type、description），依 grade 排序

### Requirement: 查詢安全限制
系統 MUST 只允許 SELECT 陳述句，MUST 限定查詢對象為白名單資料表（`routes`、`crags`、`route_videos`、`videos`、`user_route_ascents`），MUST 禁止查詢 `users` 及其他敏感資料表。白名單強制執行方式：所有 SQL 模板均為靜態字串常數定義於 `TextToSqlService`，不接受外部動態 SQL 輸入，LLM 只能選擇模板 ID 與填入參數，無法影響 SQL 結構。

#### Scenario: 非 SELECT 陳述句被拒絕
- **WHEN** 任何情況下（包含 prompt injection 嘗試）SQL 模板試圖執行 UPDATE/DELETE/INSERT/DROP
- **THEN** 系統拋出錯誤，`text-to-sql` step 走 fallback RAG，不執行該 SQL

#### Scenario: 未登入用戶查詢個人完攀
- **WHEN** 未登入用戶詢問「我完攀了幾條？」
- **THEN** `text-to-sql` step 設定 `ctx.earlyReturn` 回應「請先登入才能查詢個人完攀紀錄。」，不執行 SQL

### Requirement: user_id 取得與驗證
個人完攀模板的 `user_id` SHALL 只能來自 PipelineContext 的 `ctx.userId`（由 auth middleware 設定），不接受來自用戶輸入或 LLM 輸出的 `user_id`。

#### Scenario: user_id 來自 PipelineContext
- **WHEN** 已登入用戶詢問個人完攀問題
- **THEN** `text-to-sql` step 從 `ctx.userId` 取得 user_id 傳入 `TextToSqlService.execute()`，LLM 輸出的 `params` 不含 `user_id`

#### Scenario: ctx.userId 為 undefined 時拒絕執行個人模板
- **WHEN** `ctx.userId` 為 undefined 但 `ctx.sqlTemplate` 為個人完攀模板（`MY_*`）
- **THEN** `text-to-sql` step 設定 `ctx.earlyReturn` 回應「請先登入才能查詢個人完攀紀錄。」

### Requirement: 執行錯誤處理
`TextToSqlService` SHALL 在方法內部包裝 try/catch，捕獲 D1 連線失敗或 SQL 執行超時等例外後 throw 統一的錯誤，讓 `text-to-sql` step 走 fallback RAG，不向用戶暴露原始錯誤訊息。

#### Scenario: D1 執行拋出例外時 fallback RAG
- **WHEN** `TextToSqlService.execute()` 拋出任何例外
- **THEN** `text-to-sql` step catch 該例外，設定 `ctx.queryType = 'complex'`、`ctx.trace.sql_fallback = true`，不設 `earlyReturn`，pipeline 繼續走 RAG

### Requirement: 路線名稱驗證
`TextToSqlService` SHALL 提供 `validateRouteName(routeName, cragId?)` 方法，在執行需要路線名稱的模板前驗證路線存在。

#### Scenario: 路線名稱驗證成功
- **WHEN** 呼叫 `validateRouteName('一陽指')`
- **THEN** 執行 `SELECT id, name FROM routes WHERE name LIKE '%一陽指%' LIMIT 5`，回傳 `{ id, name }`

#### Scenario: 路線名稱驗證失敗
- **WHEN** LIKE 查詢回傳 0 筆結果
- **THEN** 回傳 `null`，由 `text-to-sql` step 決定 fallback 策略

### Requirement: 模板未覆蓋時 fallback
`text-to-sql` step SHALL 在 `ctx.sqlTemplate` 不在支援清單中時，走 fallback RAG 機制。

#### Scenario: 無對應模板時 fallback
- **WHEN** `ctx.sqlTemplate` 值不在 `TextToSqlService` 支援的模板清單中
- **THEN** `text-to-sql` step 設定 `ctx.queryType = 'complex'`、`ctx.trace.sql_fallback = true`，不設 `earlyReturn`
