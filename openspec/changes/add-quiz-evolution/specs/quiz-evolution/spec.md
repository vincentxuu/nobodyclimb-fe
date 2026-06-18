## ADDED Requirements

### Requirement: 性格演化演算法

系統 SHALL 提供性格演化演算法，從用戶攀登紀錄萃取行為訊號並調整三軸百分比。三個行為訊號為：路線類型偏好（overhang/roof 比例 → Power/Technique 軸）、onsight/redpoint 比率（→ Goal/Free 軸）、難度突破頻率（近 90 天新最高難度次數 → Bold/Steady 軸）。演化結果 SHALL 與原測驗結果加權混合：20~50 筆紀錄 quiz 70% / behavior 30%；51~100 筆 quiz 50% / behavior 50%；100+ 筆 quiz 30% / behavior 70%。

#### Scenario: 行為訊號計算——Power/Technique

- **WHEN** 用戶有 30 筆攀登紀錄，其中 20 筆為 overhang/roof 類型
- **THEN** power_signal = 20/30 ≈ 0.67，表示偏 Power

#### Scenario: 行為訊號計算——Goal/Free

- **WHEN** 用戶有 25 筆 redpoint 紀錄、15 筆 onsight 紀錄
- **THEN** goal_signal = 25/40 = 0.625，表示偏 Goal

#### Scenario: 行為訊號計算——Bold/Steady

- **WHEN** 用戶近 90 天活躍 3 個月，期間有 4 次新最高難度
- **THEN** bold_signal = 4/3 ≈ 1.33，clamp 至 1.0，表示極偏 Bold

#### Scenario: 加權混合——新用戶（30 筆紀錄）

- **WHEN** 用戶原測驗 power_pct = 70，behavior power_signal = 0.4（40%），紀錄 30 筆
- **THEN** final_power_pct = 0.7 * 70 + 0.3 * 40 = 61

#### Scenario: 加權混合——資深用戶（120 筆紀錄）

- **WHEN** 用戶原測驗 power_pct = 70，behavior power_signal = 0.4（40%），紀錄 120 筆
- **THEN** final_power_pct = 0.3 * 70 + 0.7 * 40 = 49

#### Scenario: 最低資料門檻

- **WHEN** 用戶攀登紀錄少於 20 筆
- **THEN** 不執行演化計算，維持原測驗結果

### Requirement: Ego Grade 計算

系統 SHALL 計算用戶的 Ego Grade，定義為 redpoint 最高難度與 onsight 最高難度的數值差距。難度 SHALL 轉換為數字序列（5.6=1, 5.7=2, ..., 5.15d=30）。正值表示用戶傾向挑戰超出 onsight 能力的路線；負值表示保守型；零表示平衡。

#### Scenario: 正 Ego Grade

- **WHEN** 用戶 redpoint 最高難度 5.12a（數值 13）、onsight 最高難度 5.10d（數值 9）
- **THEN** Ego Grade = 13 - 9 = 4

#### Scenario: 負 Ego Grade（保守型）

- **WHEN** 用戶 redpoint 最高難度 5.11a（數值 10）、onsight 最高難度 5.11c（數值 12）
- **THEN** Ego Grade = 10 - 12 = -2

#### Scenario: 無足夠資料

- **WHEN** 用戶無 onsight 紀錄或無 redpoint 紀錄
- **THEN** Ego Grade 為 null

### Requirement: 週排程演化計算

系統 SHALL 透過 Cloudflare Workers Cron Trigger 每週一 UTC 00:00 執行全站演化計算。計算對象為 `personality_type IS NOT NULL` 且 `last_active_at` 在 30 天內且攀登紀錄 >= 20 筆的用戶。每批處理 50 用戶以避免超出 CPU 時間限制。

#### Scenario: Cron 正常執行

- **WHEN** 每週一 UTC 00:00 觸發 cron
- **THEN** 系統查詢符合條件的活躍用戶，批次執行演化計算，記錄結果

#### Scenario: 性格類型改變

- **WHEN** 演化計算後用戶的 personality_type 從 PGB 變為 TGB
- **THEN** INSERT personality_evolution 記錄（from_type: PGB, to_type: TGB, trigger: cron），UPDATE users SET personality_type = TGB

#### Scenario: 性格類型未改變

- **WHEN** 演化計算後用戶的 personality_type 仍為 PGB（三軸百分比微調但未跨越 50% 門檻）
- **THEN** 不產生 personality_evolution 記錄，不更新 users 表

#### Scenario: 批次處理

- **WHEN** 符合條件的用戶有 120 人
- **THEN** 分 3 批（50, 50, 20）依序處理

### Requirement: 手動觸發演化計算 API

系統 SHALL 提供 `POST /api/v1/quiz/evolution/calculate` 端點（Auth: Required），允許用戶手動觸發自身的演化計算。每用戶每天最多觸發 1 次。

#### Scenario: 手動觸發成功

- **WHEN** 已登入用戶且攀登紀錄 >= 20 筆，POST `/api/v1/quiz/evolution/calculate`
- **THEN** 執行演化計算，回傳 `{ success: true, data: { personality_type, power_pct, goal_pct, bold_pct, ego_grade, changed: boolean } }`

#### Scenario: 紀錄不足

- **WHEN** 用戶攀登紀錄 < 20 筆
- **THEN** 回傳 400 `{ error: "insufficient_records", message: "需要至少 20 筆攀登紀錄" }`

#### Scenario: 速率限制

- **WHEN** 用戶同一天內第 2 次呼叫
- **THEN** 回傳 429

#### Scenario: 未登入被拒絕

- **WHEN** 未驗證用戶 POST
- **THEN** 回傳 401

### Requirement: 演化歷史時間軸 API

系統 SHALL 提供 `GET /api/v1/quiz/evolution/timeline` 端點（Auth: Required），回傳用戶的性格演化歷史記錄，按 `calculated_at` 降序排列。

#### Scenario: 有演化歷史

- **WHEN** 已登入用戶 GET `/api/v1/quiz/evolution/timeline`
- **THEN** 回傳 `{ success: true, data: EvolutionRecord[] }`，每筆含 from_type、to_type、power_pct、goal_pct、bold_pct、ego_grade、trigger、calculated_at

#### Scenario: 無演化歷史

- **WHEN** 用戶從未經歷演化
- **THEN** 回傳 `{ success: true, data: [] }`

#### Scenario: 未登入被拒絕

- **WHEN** 未驗證用戶 GET
- **THEN** 回傳 401

### Requirement: Ego Grade 查詢 API

系統 SHALL 提供 `GET /api/v1/quiz/evolution/ego-grade` 端點（Auth: Required），回傳用戶當前的 Ego Grade 及相關分析。

#### Scenario: 有 Ego Grade

- **WHEN** 已登入用戶且有足夠紀錄
- **THEN** 回傳 `{ success: true, data: { ego_grade: number, onsight_max: string, redpoint_max: string, interpretation: string } }`

#### Scenario: 無足夠資料

- **WHEN** 用戶無 onsight 或無 redpoint 紀錄
- **THEN** 回傳 `{ success: true, data: null }`

### Requirement: 演化通知

系統 SHALL 在性格類型改變時產生 in-app 通知。通知內容包含舊型態名稱、新型態名稱、演化觸發因素。通知 SHALL 在用戶下次進入 profile 頁面時以 banner 形式顯示。

#### Scenario: 進化通知顯示

- **WHEN** 用戶的性格從「碎岩者 (PGB)」演化為「鍛造者 (PGS)」，用戶下次進入 profile
- **THEN** 顯示 banner「你從碎岩者進化為鍛造者！」，附帶「查看演化歷程」連結

#### Scenario: 通知已讀

- **WHEN** 用戶關閉 banner 或點擊查看
- **THEN** 通知標記為已讀，不再顯示

### Requirement: 演化歷史時間軸 UI（Web）

系統 SHALL 在 Web 端提供 `/profile/evolution` 頁面（需登入），以垂直時間軸視覺化用戶的性格演化歷史。每個節點顯示日期、前後型態圖示與名稱、三軸百分比變化、Ego Grade。無演化記錄時顯示引導文案。

#### Scenario: 有演化歷史的時間軸

- **WHEN** 已登入用戶進入 `/profile/evolution`，有 3 筆演化記錄
- **THEN** 顯示垂直時間軸，3 個節點，最新在上，每個節點含型態圖示轉換動畫、日期、三軸百分比柱狀圖

#### Scenario: 無演化歷史

- **WHEN** 已登入用戶進入 `/profile/evolution`，無演化記錄
- **THEN** 顯示引導文案「持續攀登，你的性格會隨著經驗演化！需要至少 20 筆攀登紀錄。」

#### Scenario: 未登入重導向

- **WHEN** 未登入用戶訪問 `/profile/evolution`
- **THEN** 重導向至登入頁

### Requirement: 演化歷史時間軸 UI（Mobile）

系統 SHALL 在 Mobile 端提供 `profile/evolution` 路由，功能與 Web 端對齊：垂直時間軸、型態轉換視覺化、三軸百分比變化、Ego Grade 顯示。

#### Scenario: Mobile 時間軸顯示

- **WHEN** 已登入用戶在 Mobile App 進入演化歷史頁面
- **THEN** 顯示垂直時間軸，功能與 Web 版相同，適應行動裝置螢幕寬度

#### Scenario: Mobile 進化通知

- **WHEN** 用戶性格類型改變
- **THEN** Mobile App 下次開啟 profile 時顯示通知 banner

### Requirement: 演化資料表

系統 SHALL 提供 D1 資料表 `personality_evolution` 儲存演化歷史，包含 id、user_id、from_type、to_type、power_pct、goal_pct、bold_pct、ego_grade、trigger（`cron` | `manual` | `quiz`）、calculated_at。系統 SHALL 在 `users` 表新增 `ego_grade REAL` 欄位。

#### Scenario: 資料表建立

- **WHEN** 執行 D1 migration
- **THEN** `personality_evolution` 資料表建立成功，含 user_id 索引

#### Scenario: 演化記錄寫入

- **WHEN** 用戶性格從 PGB 演化為 TGB
- **THEN** 插入一筆 personality_evolution 記錄，from_type = PGB，to_type = TGB，trigger = cron
