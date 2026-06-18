## ADDED Requirements

### Requirement: 模板化訓練計畫

系統 SHALL 為每個型態提供一套 4 週模板化訓練計畫，結構：
- Week 1：意識 — 認識盲點
- Week 2：練習 — 針對性訓練
- Week 3：整合 — 融入攀爬
- Week 4：挑戰 — 具體目標

每週 3 天，每天有具體的訓練內容描述。每型計畫有一個主題名稱和畢業測試。

核心理念：訓練你的「反面」（Anti-style），依據 Anti-style Gap 研究。

#### Scenario: 碎岩者訓練計畫

- **WHEN** 查詢 PGB 型態的訓練計畫
- **THEN** 回傳「以柔克剛」計畫，Week 1 Day 1 為「靜音攀岩」，畢業測試為完攀等級內的 slab 路線

### Requirement: 結果頁訓練處方預覽

結果頁 SHALL 顯示訓練計畫的模糊化預覽：
- 訓練處方摘要（2-3 句）
- 畢業測試描述
- 4 週計畫的標題可見，但內容模糊化
- CTA：「登入解鎖完整 4 週訓練計畫」

#### Scenario: 未登入用戶看到模糊計畫

- **WHEN** 未登入用戶在結果頁查看訓練區塊
- **THEN** 顯示 Week 1 標題和 Day 1 摘要，Week 2-4 內容模糊化，底部顯示登入 CTA

#### Scenario: 已登入用戶看到完整計畫

- **WHEN** 已登入用戶在結果頁或訓練計畫頁查看
- **THEN** 顯示完整 4 週 × 3 天的詳細訓練內容

### Requirement: 訓練進度追蹤

系統 SHALL 提供訓練進度追蹤功能（Phase 2）：
- 用戶可「開始計畫」啟動 4 週訓練
- 每日可勾選完成狀態
- 可記錄訓練筆記
- 畢業測試完成後獲得徽章

API 端點：
- `GET /api/v1/training/plan/:type` — 取得計畫內容
- `POST /api/v1/training/progress` — 記錄完成狀態
- `GET /api/v1/training/progress/me` — 查詢進度

#### Scenario: 用戶完成一天訓練

- **WHEN** 用戶勾選 Week 2 Day 1 為完成
- **THEN** 建立 `training_progress` 記錄，completed = true

#### Scenario: 用戶完成畢業測試

- **WHEN** 用戶完成 4 週計畫所有天數
- **THEN** 系統標記計畫完成，用戶獲得畢業徽章

### Requirement: 訓練進度 D1 Schema

```sql
CREATE TABLE training_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  personality_type TEXT NOT NULL,
  week INTEGER NOT NULL,
  day INTEGER NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
```

#### Scenario: 查詢用戶完成進度

- **WHEN** 查詢用戶的訓練進度
- **THEN** 回傳所有 training_progress 記錄，可計算完成率
