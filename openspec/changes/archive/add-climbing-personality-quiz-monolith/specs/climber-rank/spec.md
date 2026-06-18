## MODIFIED Requirements

### Requirement: 等級積分計算

系統 SHALL 根據用戶在各內容模組的完成情況計算「等級積分」，並對應至麓 / 壁 / 稜 / 巔四個等級。

積分來源與上限：

- biography 文字欄位（climbing_start_year, frequent_locations, favorite_route_type, climbing_reason, climbing_meaning）：每填一欄 +3 分，上限 15 分
- biography.bucket_list 欄位非空：+3 分
- biography.is_public = 1：+5 分
- biography_core_stories：每篇 +8 分，上限 24 分（最多 3 篇）
- biography_one_liners：每篇 +2 分，上限 20 分（最多 10 篇）
- biography_stories：每篇 +3 分，上限 15 分（最多 5 篇）
- user_route_ascents：每筆 +1 分，上限 20 分（最多 20 筆）
- bucket_list_items（所有）：每項 +1 分，上限 10 分（最多 10 項）
- bucket_list_items（已完成）：每項額外 +2 分，上限 10 分（最多 5 項）
- **quiz_results（完成人格測驗）：+5 分（僅計一次）**
- **training_progress（完成訓練計畫）：+15 分（每型計畫僅計一次）**

等級門檻：

- 麓（foothill）：0–24 分
- 壁（wall）：25–54 分
- 稜（ridge）：55–84 分
- 巔（summit）：85 分以上

#### Scenario: 新用戶無任何內容

- **WHEN** 用戶剛註冊，無 biography 也無任何攀岩記錄
- **THEN** 積分為 0，等級為「麓」

#### Scenario: 用戶填寫 biography 欄位

- **WHEN** 用戶填寫了 climbing_start_year、frequent_locations、favorite_route_type 三個欄位
- **THEN** 積分增加 9 分（3 欄 × 3 分）

#### Scenario: 用戶積分達到等級門檻

- **WHEN** 用戶積分從 24 增加至 25
- **THEN** 等級由「麓」升為「壁」（於下次 Cron 執行後生效）

#### Scenario: 積分上限不超出各模組上限

- **WHEN** 用戶有 30 筆 user_route_ascents 記錄
- **THEN** 路線積分僅計算 20 分（上限 20 筆）

#### Scenario: 用戶完成人格測驗獲得積分

- **WHEN** 用戶首次完成人格測驗
- **THEN** 積分增加 5 分（重複測驗不重複計分）

#### Scenario: 用戶完成訓練計畫獲得積分

- **WHEN** 用戶完成碎岩者「以柔克剛」4 週訓練計畫
- **THEN** 積分增加 15 分（同型計畫僅計一次，不同型態可各計一次）
