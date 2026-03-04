## ADDED Requirements

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

### Requirement: 用戶等級記錄初始化

系統 SHALL 在用戶首次呼叫 AI 端點時，若無等級記錄，自動建立預設「麓」等級記錄。

#### Scenario: 首次 AI 請求自動建立等級記錄

- **WHEN** 已登入用戶首次呼叫 `POST /api/v1/ai/ask`，且 `user_ranks` 無該用戶記錄
- **THEN** 系統以 `rank_id=foothill, daily_ai_used=0, daily_ai_limit=2` 建立記錄，再繼續處理配額檢查

#### Scenario: 封鎖用戶不建立等級記錄

- **WHEN** `users.is_active = 0` 的用戶呼叫 AI 端點
- **THEN** 回傳 403，不建立 `user_ranks` 記錄

### Requirement: 等級顯示於個人 Profile 頁

系統 SHALL 在個人 Profile 頁的顯眼位置顯示用戶當前等級。

#### Scenario: 用戶查看自己的 Profile

- **WHEN** 已登入用戶進入自己的個人 Profile 頁
- **THEN** 頁面顯示等級名稱（如「稜」）與對應色彩 badge，位置在 avatar 下方

#### Scenario: 他人查看用戶 Profile

- **WHEN** 訪客或其他用戶查看某用戶的 Profile 頁
- **THEN** 同樣顯示該用戶的等級 badge

#### Scenario: 用戶尚未有等級記錄

- **WHEN** 用戶從未使用過 AI，無 `user_ranks` 記錄
- **THEN** Profile 頁顯示「麓」（預設等級）

### Requirement: 等級顯示於留言旁

系統 SHALL 在用戶的留言旁顯示等級標籤，作為社群身份識別。

#### Scenario: 用戶發表留言

- **WHEN** 留言列表渲染某則留言
- **THEN** 用戶名稱旁顯示小型等級標籤（如 `[稜]`）

#### Scenario: 等級為「麓」時不顯示標籤

- **WHEN** 用戶等級為「麓」
- **THEN** 留言旁不顯示等級標籤（避免標記新手）

### Requirement: 等級顯示於人物誌公開頁

系統 SHALL 在人物誌公開頁面顯示該用戶的等級 badge。

#### Scenario: 訪客查看公開人物誌

- **WHEN** 訪客瀏覽公開的 biography 頁面（`/biography/:slug`）
- **THEN** 頭像下方顯示等級 badge，hovering 顯示 tooltip 說明積分與升段條件

#### Scenario: 非公開人物誌不顯示等級

- **WHEN** biography.is_public = 0
- **THEN** 不顯示等級 badge（頁面本身不公開）
