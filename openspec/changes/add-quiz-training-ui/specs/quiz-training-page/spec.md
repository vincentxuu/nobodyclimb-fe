## ADDED Requirements

### Requirement: 訓練計畫頁面路由與登入保護

系統 SHALL 在 `/quiz/training/[type]` 提供訓練計畫頁面，`[type]` 為 3 字母 PersonalityTypeCode（如 PGB、TFS）。頁面 SHALL 沿用 Quiz 專用 layout（無主站 nav/footer）。未登入用戶 SHALL 被導向登入頁，登入後自動返回原頁面。

#### Scenario: 已登入用戶訪問訓練計畫頁

- **WHEN** 已登入用戶訪問 `/quiz/training/PGB`
- **THEN** 頁面載入碎岩者的完整 4 週訓練計畫內容，同時呼叫 `GET /api/v1/training/plan/PGB` 取得計畫與 `GET /api/v1/training/progress/me?type=PGB` 取得進度

#### Scenario: 未登入用戶被導向登入

- **WHEN** 未登入用戶訪問 `/quiz/training/PGB`
- **THEN** 導向登入頁面，登入完成後自動返回 `/quiz/training/PGB`

#### Scenario: 無效型態代碼

- **WHEN** 用戶訪問 `/quiz/training/XXX`（非合法代碼）
- **THEN** 顯示 404 頁面

### Requirement: 4 週計畫內容展示

頁面 SHALL 以週為單位展示訓練計畫，包含頂部型態資訊區與週切換導覽。

頂部資訊區 SHALL 顯示：型態圖示、中文名稱、計畫主題名稱、整體進度百分比。

每週展示 SHALL 包含：
- 週標題（Week N：主題，如「Week 1：意識」）
- 3 天訓練卡片，每張含 title、description、duration、exercises 列表
- 週進度指示（已完成天數 / 3）

#### Scenario: 用戶切換週次

- **WHEN** 用戶點選 Week 3 標籤
- **THEN** 頁面顯示 Week 3 的 3 天訓練卡片，並標示各天完成狀態

#### Scenario: 首次進入預設顯示

- **WHEN** 用戶首次進入訓練計畫頁（無任何進度）
- **THEN** 預設展開 Week 1，所有天數顯示為未完成

#### Scenario: 有部分進度時的預設顯示

- **WHEN** 用戶已完成 Week 1 全部 3 天和 Week 2 Day 1
- **THEN** 預設展開 Week 2（當前進行中的週），Week 1 標籤顯示完成勾勾

### Requirement: 每日完成勾選

用戶 SHALL 可在每天的訓練卡片上勾選「完成」。勾選後 SHALL 呼叫 `POST /api/v1/training/progress` 記錄完成狀態，並即時更新 UI。

#### Scenario: 用戶勾選一天完成

- **WHEN** 用戶在 Week 1 Day 2 卡片點擊「完成」勾選框
- **THEN** 呼叫 `POST /api/v1/training/progress { personality_type: "PGB", week: 1, day: 2, completed: true }`
- **THEN** 卡片樣式變為已完成（勾勾圖示 + 淡化），週進度更新為 "N/3"，整體進度百分比更新

#### Scenario: 用戶取消完成標記

- **WHEN** 用戶對已完成的 Day 再次點擊勾選框
- **THEN** 呼叫 `POST /api/v1/training/progress { ... completed: false }`
- **THEN** 卡片恢復為未完成樣式，進度數值回退

#### Scenario: API 呼叫失敗時 UI 回滾

- **WHEN** 用戶勾選完成但 API 回傳錯誤（網路問題、伺服器錯誤）
- **THEN** UI 回滾至勾選前狀態（optimistic update 復原），顯示錯誤提示 toast

### Requirement: 訓練筆記

用戶 SHALL 可為每天的訓練記錄筆記。筆記以可展開的文字輸入框呈現，隨完成狀態一併送出。

#### Scenario: 用戶新增筆記

- **WHEN** 用戶在 Week 2 Day 1 卡片展開筆記區，輸入「今天 slab 練習時發現腳踝靈活度不夠」
- **THEN** 用戶點擊儲存後，呼叫 `POST /api/v1/training/progress { ..., notes: "今天 slab 練習時發現腳踝靈活度不夠" }`
- **THEN** 筆記保存成功，卡片顯示筆記圖示表示有記錄

#### Scenario: 用戶修改已有筆記

- **WHEN** 用戶編輯已儲存的筆記並點擊儲存
- **THEN** API 以 upsert 方式更新筆記內容

### Requirement: 進度追蹤視覺化

頁面 SHALL 提供以下進度視覺化元素：

1. **整體進度環**：圓環圖顯示完成百分比（已完成天數 / 12）
2. **週進度條**：每週標籤旁顯示 mini 進度條（0-3 天）
3. **天數統計**：「已完成 N / 12 天」文字

#### Scenario: 進度即時更新

- **WHEN** 用戶勾選新的一天為完成，總進度從 5/12 變為 6/12
- **THEN** 整體進度環動畫從 41.7% 更新至 50%，天數統計更新為「6 / 12 天」

#### Scenario: 全部完成

- **WHEN** 用戶完成第 12 天（最後一天）
- **THEN** 進度環顯示 100%，觸發畢業流程

### Requirement: 畢業徽章

當用戶完成某型態的全部 12 天訓練後，系統 SHALL 顯示畢業慶祝並頒發徽章。

#### Scenario: 用戶完成最後一天

- **WHEN** 用戶勾選第 12 天完成（4 週 x 3 天全部 completed）
- **THEN** 觸發畢業慶祝動畫（confetti + 徽章圖示浮現）
- **THEN** 頁面頂部永久顯示「已畢業」徽章與完成日期

#### Scenario: 取消最後一天後徽章消失

- **WHEN** 用戶取消第 12 天的完成標記（從 12/12 回到 11/12）
- **THEN** 畢業徽章消失，恢復為進行中狀態

#### Scenario: 畢業後再訪頁面

- **WHEN** 已畢業用戶重新訪問訓練計畫頁
- **THEN** 頂部顯示畢業徽章與完成日期，所有天數顯示為已完成

### Requirement: 開始計畫 CTA

首次進入訓練計畫頁（無任何進度記錄）時，頁面 SHALL 在計畫內容上方顯示「開始訓練計畫」CTA 區塊，包含計畫簡介和預估時長（4 週、每週 3 天）。

#### Scenario: 用戶首次進入

- **WHEN** 用戶無任何該型態的 training_progress 記錄
- **THEN** 頂部顯示「開始訓練計畫」引導卡片，說明 4 週計畫結構和核心理念（訓練你的反面）

#### Scenario: 用戶已有進度

- **WHEN** 用戶至少有一筆完成記錄
- **THEN** 不顯示開始引導，直接顯示進度和計畫內容

## MODIFIED Requirements

### Requirement: 結果頁訓練區塊 CTA 更新

結果頁的 `ResultTraining` 元件 SHALL 根據登入狀態顯示不同 CTA：

#### Scenario: 未登入用戶

- **WHEN** 未登入用戶在結果頁查看訓練區塊
- **THEN** CTA 文字為「登入解鎖完整訓練計畫」，點擊導向登入頁

#### Scenario: 已登入用戶

- **WHEN** 已登入用戶在結果頁查看訓練區塊
- **THEN** CTA 文字為「前往訓練計畫」，點擊導向 `/quiz/training/[type]`
- **THEN** Week 1 內容清楚顯示，Week 2-4 不再模糊化（已登入）

### Requirement: TanStack Query 資料管理

訓練計畫頁 SHALL 使用 TanStack Query 管理所有 API 狀態：

#### Scenario: 計畫內容快取

- **WHEN** 用戶載入訓練計畫頁
- **THEN** `GET /api/v1/training/plan/:type` 以 `staleTime: Infinity` 快取（靜態內容不會變）

#### Scenario: 進度資料即時性

- **WHEN** 用戶勾選完成後
- **THEN** 使用 optimistic update 即時更新 UI，API 成功後 invalidate `training-progress` query key

#### Scenario: 錯誤重試

- **WHEN** API 呼叫失敗
- **THEN** TanStack Query 自動重試 2 次，仍失敗則顯示錯誤提示並回滾 optimistic update
