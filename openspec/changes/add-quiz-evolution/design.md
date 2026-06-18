## Context

攀岩性格測驗產生靜態結果（3 軸百分比 → 8 型代碼），但攀岩者的風格會隨經驗演變。本設計引入演化演算法，從攀登紀錄中萃取行為訊號，自動調整性格軸向，並記錄演化歷史。

**約束條件**：
- 演化計算涉及全站用戶，需要 cron job 批次處理
- 需最低 20 筆攀登紀錄才有統計意義
- 演化不應完全覆蓋測驗結果——採加權混合
- Cloudflare Workers Cron Trigger 有執行時間限制（~30s CPU time）

## Goals / Non-Goals

**Goals:**
- 從攀登紀錄自動推算三軸傾向，與原測驗結果加權混合
- 計算 Ego Grade（onsight grade vs redpoint grade 差距）
- 記錄演化歷史，提供時間軸視覺化
- 性格類型改變時發送通知
- Web 與 Mobile 均提供時間軸頁面

**Non-Goals:**
- 不改變原始測驗流程或問卷內容
- 不做即時演化（每次上傳紀錄就重算）——以週為週期
- 不做社交比較（「你比 80% 的人進化更快」）
- 不涉及訓練計畫自動調整（由 `quiz-ai-training` 處理）

## Decisions

### Decision 1：三軸演化演算法

從攀登紀錄萃取三個行為訊號，各對應一個軸向：

**Body 軸（Power ◄► Technique）**：
- 訊號：路線類型偏好分佈
- overhang/roof 比例高 → 偏 Power；slab/vertical/crack 比例高 → 偏 Technique
- 公式：`power_signal = overhang_count / total_count`（0~1，0.5 為中性）

**Motive 軸（Goal ◄► Free）**：
- 訊號：onsight/redpoint 比率
- 高 onsight 率 → 偏 Free（享受過程）；高 redpoint 率 → 偏 Goal（追求目標）
- 公式：`goal_signal = redpoint_count / (onsight_count + redpoint_count)`（0~1）

**Mind 軸（Bold ◄► Steady）**：
- 訊號：難度突破頻率
- 計算近 90 天內「新最高難度」出現次數
- 頻繁突破 → 偏 Bold；穩定不變 → 偏 Steady
- 公式：`bold_signal = breakthrough_count / max(1, months_active)`，clamp(0, 1)

**替代方案**：使用 AI 分析攀登紀錄。但演算法更透明、可解釋、無 AI 延遲與配額問題。

### Decision 2：混合策略——測驗 + 行為加權

演化結果不完全取代測驗結果，採加權混合：

```
final_pct = quiz_weight * quiz_pct + behavior_weight * behavior_signal * 100
```

權重隨紀錄筆數漸進調整：
- 20~50 筆：quiz 70% / behavior 30%
- 51~100 筆：quiz 50% / behavior 50%
- 100+ 筆：quiz 30% / behavior 70%

這確保新用戶以測驗為主，資深用戶以行為為主。

**替代方案**：完全以行為取代測驗。但測驗捕捉主觀偏好（你想成為什麼），行為反映客觀現實（你實際做什麼），兩者互補。

### Decision 3：Ego Grade 計算（Casey Elliott 研究）

Ego Grade = onsight 最高難度 - redpoint 最高難度的差距：
- 差距大（redpoint >> onsight）→ 高 Ego Grade → 傾向挑戰超出能力的路線
- 差距小 → 低 Ego Grade → 能力與企圖心平衡
- 負值（onsight > redpoint）→ 保守型，有實力但不常挑戰極限

數值化：將難度轉換為數字序列（5.6=1, 5.7=2, ..., 5.15d=30），計算差值。

### Decision 4：Cron Job 設計

使用 Cloudflare Workers Cron Trigger，每週一 UTC 00:00 執行：

1. 查詢所有 `personality_type IS NOT NULL` 且 `last_active_at` 在 30 天內的用戶
2. 對每個用戶：檢查攀登紀錄 >= 20 筆 → 執行演化計算
3. 比較新舊 personality_type，若改變：
   - INSERT personality_evolution 記錄
   - UPDATE users SET personality_type, ego_grade
   - 觸發通知（寫入通知佇列或直接發送）
4. 批次處理：每批 50 用戶，避免超出 CPU 時間限制

**手動觸發**：`POST /api/v1/quiz/evolution/calculate`（Auth: Required），供用戶上傳大量紀錄後立即重算。有速率限制（每用戶每天 1 次）。

### Decision 5：資料表設計

```sql
CREATE TABLE personality_evolution (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  from_type TEXT,           -- 演化前的 PersonalityTypeCode（首次為 NULL）
  to_type TEXT NOT NULL,    -- 演化後的 PersonalityTypeCode
  power_pct REAL NOT NULL,  -- 混合後的 Body 軸百分比
  goal_pct REAL NOT NULL,   -- 混合後的 Motive 軸百分比
  bold_pct REAL NOT NULL,   -- 混合後的 Mind 軸百分比
  ego_grade REAL,           -- Ego Grade 值
  trigger TEXT NOT NULL,    -- 'cron' | 'manual' | 'quiz'
  calculated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

ALTER TABLE users ADD COLUMN ego_grade REAL;
```

### Decision 6：通知機制

性格類型改變時：
- Web：使用既有的通知系統（若有）或 toast notification 在下次登入時顯示
- Mobile：local push notification「你從 [舊型態中文名] 進化為 [新型態中文名]！」
- 演化記錄頁面內的 in-app 通知橫幅

首版簡化為 in-app 通知（下次進入 profile 時顯示 banner），避免依賴尚未建立的推播基礎設施。

## Risks / Trade-offs

- **演算法偏誤** → 路線類型資料可能不完整（用戶未標記），需在資料不足時跳過該軸的行為訊號，僅使用測驗值。
- **Cron 超時** → 批次處理 + 限制每批 50 用戶。若用戶量超過 Workers Cron 可處理範圍，改用 Durable Objects alarm 或拆分多次執行。
- **用戶困惑** → 性格突然改變可能引起不安。在時間軸中清楚解釋「為什麼你的性格變了」，標註觸發因素。
- **Ego Grade 爭議** → 名稱可能引起負面觀感。UI 上改用中性名稱「能力認知指標」，tooltip 解釋概念。
