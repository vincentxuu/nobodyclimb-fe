## ADDED Requirements

### Requirement: 推薦查詢不包含已完攀路線名稱
`buildRecommendationQuery()` SHALL 以攀登能力程度描述取代路線名稱清單，目標難度 SHALL 由最近完攀最高難度 +1 級計算。

#### Scenario: 有完攀紀錄時生成能力程度查詢
- **WHEN** 用戶有 5 筆完攀紀錄，最高難度為 5.11d
- **THEN** 查詢字串為「我的攀登程度約 5.11d，請推薦難度在 5.12a–5.12b 的路線，或類型不同的路線」，不包含任何路線名稱

#### Scenario: 無完攀紀錄時使用通用查詢
- **WHEN** 用戶無完攀紀錄
- **THEN** 查詢字串使用通用初學者推薦語句，不變

### Requirement: Pipeline context 注入已完攀 route_id 列表
`RecommendationService.generate()` SHALL 查詢用戶完攀的 route_id 列表，注入 pipeline context 的 `climbed_route_ids` 欄位。

#### Scenario: 有完攀紀錄時注入 route_id 列表
- **WHEN** 用戶有完攀紀錄
- **THEN** `ctx.climbed_route_ids` 為該用戶所有完攀路線的 route_id 字串陣列

#### Scenario: 無完攀紀錄時注入空列表
- **WHEN** 用戶無任何完攀紀錄
- **THEN** `ctx.climbed_route_ids` 為空陣列 `[]`

### Requirement: MMR 候選集排除已完攀路線
`popularity-rerank` 步驟 SHALL 在執行 MMR 計算前，從候選集中移除 `ctx.climbed_route_ids` 中的路線文件（依 route_id 比對）。

#### Scenario: 候選集含已完攀路線時排除
- **WHEN** MMR 輸入候選集包含用戶已完攀的路線（route_id 在 climbed_route_ids 內），且 `ctx.climbed_route_ids` 非空
- **THEN** 該路線在 MMR 計算前被移除，最終推薦結果不含該路線

#### Scenario: climbed_route_ids 為空或 null 時不過濾
- **WHEN** `ctx.climbed_route_ids` 為 null 或空陣列
- **THEN** MMR 正常執行，無任何額外過濾

#### Scenario: 排除後候選集不為空
- **WHEN** 排除已完攀路線後候選集仍有文件
- **THEN** MMR 繼續執行並選出最終結果

#### Scenario: 排除後候選集為空
- **WHEN** 排除已完攀路線後候選集為空
- **THEN** 不執行排除（不影響空集合），回傳空結果交由後續邏輯處理

### Requirement: Hybrid SQL 候選集排除已完攀路線
`queryCandidates()` SHALL 支援 `excluded_ids` 參數，當傳入時 SQL 加入 `r.id NOT IN (...)` 過濾。

#### Scenario: 傳入 excluded_ids 時過濾 SQL 候選集
- **WHEN** `queryCandidates()` 收到非空的 `excluded_ids` 陣列
- **THEN** 回傳的候選路線不含任何 excluded_ids 中的路線

#### Scenario: excluded_ids 為空時不過濾
- **WHEN** `excluded_ids` 為空陣列或未傳入
- **THEN** SQL 執行無 NOT IN 條件，行為與修改前相同
