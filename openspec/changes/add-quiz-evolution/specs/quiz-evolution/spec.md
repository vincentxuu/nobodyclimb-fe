## ADDED Requirements

### Requirement: 行為模式信號萃取（非路線標籤）

系統 SHALL 從攀登紀錄萃取行為模式信號，不依賴路線類型標籤（避免環境限制偏差）。

**Power/Technique 軸信號**：
- 高難度完攀集中在哪類路線（突破點分析）
- 各類路線的 onsight 成功率差異（直覺強項）
- 各類路線的平均嘗試次數差異（哪種需要更多嘗試 = 非強項）

**Goal/Free 軸信號**：
- 同一條路線嘗試次數 > 3 的比例（project 傾向）
- unique 路線數 / 總攀爬數 比值（多樣性 vs 專注）

**Bold/Steady 軸信號**：
- 難度突破頻率（近 90 天新最高難度次數 / 活躍月數）
- lead / top-rope 比例（敢不敢先鋒）
- Style Spectrum（onsight vs redpoint 差距）

#### Scenario: Power 信號 — 突破點集中在 overhang

- **WHEN** 用戶 30 筆完攀中，最高難度 3 筆都是 overhang，且 slab 完攀率 60% 而 overhang 完攀率 85%
- **THEN** power_signal 偏高（完攀率差異顯示 overhang 是直覺強項）

#### Scenario: Power 信號 — 環境限制下仍可判斷

- **WHEN** 用戶所在岩館只有 slab 牆，30 筆全是 slab，但平均嘗試次數 3.2 次（高於同等級平均 1.8 次）
- **THEN** power_signal 仍偏高（高嘗試次數暗示 slab 不是強項風格）

#### Scenario: Goal 信號 — project 傾向高

- **WHEN** 用戶 40 筆攀爬中，15 筆的同路線嘗試次數 > 3（37.5%），unique 路線 20 條 / 總 40 次 = 0.5
- **THEN** goal_signal 偏高（高 project 比例 + 低路線多樣性）

#### Scenario: Bold 信號 — 敢先鋒

- **WHEN** 用戶 50 筆攀爬中 40 筆為 lead（80%），近 90 天有 3 次新最高難度（月均 1 次）
- **THEN** bold_signal 偏高

### Requirement: 三重門檻慣性機制

系統 SHALL 使用三重門檻防止人格頻繁跳動，讓進化成為「重大事件」：

1. **最低資料門檻**：至少 20 筆攀登記錄才啟動演化計算
2. **穩定期**：同一型態至少維持 8 週才有資格進化
3. **連續確認**：需要連續 3 次週計算都指向同一個新型態才觸發實際進化

每週 cron 照常執行計算和記錄，但只在三重門檻都滿足時才更新 `users.personality_type` 並發送通知。

#### Scenario: 正常進化流程

- **WHEN** 用戶為 PGB 已 10 週，第 11、12、13 週的計算結果都指向 PGS
- **THEN** 第 13 週觸發進化：INSERT personality_evolution，UPDATE users SET personality_type = 'PGS'，發送通知

#### Scenario: 穩定期內不進化

- **WHEN** 用戶為 PGB 才 5 週，計算結果連續 3 次指向 PGS
- **THEN** 不觸發進化（穩定期未滿 8 週），記錄計算結果但不更新 users

#### Scenario: 連續確認中斷

- **WHEN** 用戶為 PGB 已 10 週，第 11 週指向 PGS，第 12 週指向 PGB，第 13 週指向 PGS
- **THEN** 不觸發進化（連續計數在第 12 週重置），consecutive_count 歸零重算

#### Scenario: 最低資料不足

- **WHEN** 用戶攀登紀錄 < 20 筆
- **THEN** 跳過計算，回傳 `{ changed: false, reason: 'insufficient_records' }`

### Requirement: 加權混合計算

系統 SHALL 將測驗基線與行為信號加權混合，權重隨紀錄筆數漸進調整：

- 20~50 筆：quiz 70% / behavior 30%
- 51~100 筆：quiz 50% / behavior 50%
- 100+ 筆：quiz 30% / behavior 70%

無測驗結果時 SHALL 僅使用行為信號（behavior 100%）。

#### Scenario: 新用戶 30 筆紀錄

- **WHEN** 測驗 power_pct = 70，behavior power_signal = 40%，紀錄 30 筆
- **THEN** final_power_pct = 0.7 × 70 + 0.3 × 40 = 61

#### Scenario: 資深用戶 120 筆紀錄

- **WHEN** 測驗 power_pct = 70，behavior power_signal = 40%，紀錄 120 筆
- **THEN** final_power_pct = 0.3 × 70 + 0.7 × 40 = 49

#### Scenario: 無測驗結果

- **WHEN** 用戶從未做過測驗但有 50 筆攀登紀錄
- **THEN** final_power_pct = behavior power_signal × 100（100% behavior）

### Requirement: 攀岩光譜 Style Spectrum

系統 SHALL 計算用戶的攀岩光譜（取代 Ego Grade 命名），定義為 redpoint 最高難度與 onsight 最高難度的數值差距。難度 SHALL 轉換為數字序列（5.6=1, 5.7=2, ..., 5.15d=30）。

三種定位（全部正面）：

| 差距 | 名稱 | 英文 | 描述 |
|------|------|------|------|
| > 3 子級 | 深耕者 | Deep Sender | 你在一條路線上能挖掘出別人看不到的可能性。極高的路線學習能力。 |
| 0-3 子級 | 全能者 | All-Rounder | 你的 onsight 和 redpoint 同步成長。最均衡的攀岩狀態。 |
| < 0 子級 | 即興者 | Flash Reader | 你在未知路線上的表現幾乎跟練過的一樣好。極強的動態 beta 閱讀能力。 |

每種定位 SHALL 附帶正面的「成長方向」建議。

#### Scenario: 深耕者

- **WHEN** 用戶 redpoint 最高 5.12a（數值 13）、onsight 最高 5.10d（數值 9），差距 = 4
- **THEN** style_spectrum = 4，定位為「深耕者 Deep Sender」，成長方向：嘗試更多 onsight

#### Scenario: 全能者

- **WHEN** 用戶 redpoint 最高 5.11c（數值 12）、onsight 最高 5.11a（數值 10），差距 = 2
- **THEN** style_spectrum = 2，定位為「全能者 All-Rounder」

#### Scenario: 即興者

- **WHEN** 用戶 redpoint 最高 5.11a（數值 10）、onsight 最高 5.11c（數值 12），差距 = -2
- **THEN** style_spectrum = -2，定位為「即興者 Flash Reader」

#### Scenario: 無足夠資料

- **WHEN** 用戶無 onsight 紀錄或無 redpoint 紀錄
- **THEN** style_spectrum 為 null，不顯示定位

### Requirement: 週排程演化計算

系統 SHALL 透過 Cloudflare Workers Cron Trigger 每週一 UTC 00:00 執行全站演化計算。計算對象為 `personality_type IS NOT NULL` 且 `last_active_at` 在 30 天內且攀登紀錄 >= 20 筆的用戶。每批處理 50 用戶。

每次計算 SHALL 記錄「指向型態」到 personality_evolution 表（含 consecutive_count），但只在三重門檻全部滿足時才更新 users 表並發送通知。

#### Scenario: Cron 正常執行

- **WHEN** 每週一 UTC 00:00 觸發 cron
- **THEN** 系統查詢符合條件的用戶，批次執行計算，記錄 personality_evolution

#### Scenario: 三重門檻觸發進化

- **WHEN** 計算結果指向新型態，且穩定期 >= 8 週，且 consecutive_count 達到 3
- **THEN** UPDATE users SET personality_type，發送進化通知

#### Scenario: 僅記錄不進化

- **WHEN** 計算結果指向新型態，但穩定期 < 8 週或 consecutive_count < 3
- **THEN** INSERT personality_evolution 記錄（用於追蹤趨勢），不更新 users

### Requirement: 手動觸發演化計算 API

系統 SHALL 提供 `POST /api/v1/quiz/evolution/calculate` 端點（Auth: Required），允許用戶手動觸發自身的演化計算。每用戶每天最多觸發 1 次。手動觸發同樣受三重門檻限制。

#### Scenario: 手動觸發成功

- **WHEN** 已登入用戶且攀登紀錄 >= 20 筆
- **THEN** 執行演化計算，回傳 `{ personality_type, power_pct, goal_pct, bold_pct, style_spectrum, changed, consecutive_count, weeks_stable }`

#### Scenario: 紀錄不足

- **WHEN** 用戶攀登紀錄 < 20 筆
- **THEN** 回傳 400

#### Scenario: 速率限制

- **WHEN** 用戶同一天內第 2 次呼叫
- **THEN** 回傳 429

### Requirement: 攀岩光譜查詢 API

系統 SHALL 提供 `GET /api/v1/quiz/evolution/style-spectrum` 端點（Auth: Required）。

#### Scenario: 有攀岩光譜

- **WHEN** 已登入用戶且有足夠紀錄
- **THEN** 回傳 `{ style_spectrum, onsight_max, redpoint_max, position: 'deep_sender' | 'all_rounder' | 'flash_reader', description, growth_direction }`

#### Scenario: 無足夠資料

- **WHEN** 用戶無 onsight 或無 redpoint 紀錄
- **THEN** 回傳 `{ data: null }`

### Requirement: 演化歷史時間軸 API

系統 SHALL 提供 `GET /api/v1/quiz/evolution/timeline` 端點（Auth: Required），回傳用戶的性格演化歷史記錄，按 `calculated_at` 降序排列。

#### Scenario: 有演化歷史

- **WHEN** 已登入用戶 GET
- **THEN** 回傳 EvolutionRecord[]，每筆含 from_type、to_type、三軸百分比、style_spectrum、trigger、calculated_at

#### Scenario: 無演化歷史

- **WHEN** 用戶從未經歷演化
- **THEN** 回傳空陣列

### Requirement: 演化通知

系統 SHALL 在性格類型改變（三重門檻全部滿足）時產生 in-app 通知。通知 SHALL 使用正面語氣：「你從 {舊型態中文名} 進化為 {新型態中文名} 了！」。Profile 頁面以 banner 形式顯示，附帶「查看演化歷程」連結。用戶關閉或點擊後標記已讀。

#### Scenario: 進化通知顯示

- **WHEN** 用戶從碎岩者進化為鍛造者，下次進入 profile
- **THEN** 顯示 banner「你從碎岩者進化為鍛造者了！」

#### Scenario: 通知已讀

- **WHEN** 用戶關閉 banner
- **THEN** 標記已讀，不再顯示

### Requirement: 演化時間軸 UI（Web + Mobile）

系統 SHALL 在 Web（`/profile/evolution`）和 Mobile（`profile/evolution`）提供垂直時間軸頁面（需登入），視覺化演化歷史。每個節點顯示：日期、前後型態圖示與名稱、三軸百分比變化、攀岩光譜定位。無記錄時顯示引導文案。

#### Scenario: 有記錄的時間軸

- **WHEN** 已登入用戶有 3 筆演化記錄
- **THEN** 顯示垂直時間軸，3 個節點，最新在上

#### Scenario: 無記錄

- **WHEN** 已登入用戶無演化記錄
- **THEN** 顯示「持續攀登，你的性格會隨著經驗演化！需要至少 20 筆攀登紀錄和 8 週穩定期。」

### Requirement: 演化資料表

系統 SHALL 提供 D1 資料表：

```sql
CREATE TABLE personality_evolution (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  from_type TEXT,
  to_type TEXT NOT NULL,
  power_pct REAL NOT NULL,
  goal_pct REAL NOT NULL,
  bold_pct REAL NOT NULL,
  style_spectrum REAL,
  trigger TEXT NOT NULL,
  consecutive_count INTEGER DEFAULT 1,
  calculated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
ALTER TABLE users ADD COLUMN style_spectrum REAL;
```

#### Scenario: 資料表建立

- **WHEN** 執行 D1 migration
- **THEN** personality_evolution 表和 users 欄位建立成功
