## Context

攀岩性格測驗產生靜態結果（3 軸百分比 → 8 型代碼），但攀岩者的風格會隨經驗演變。本設計引入演化演算法，從攀登紀錄中萃取**行為模式信號**（非路線標籤），自動調整性格軸向，並記錄演化歷史。

**約束條件**：
- 演化計算涉及全站用戶，需要 cron job 批次處理
- 需最低 20 筆攀登紀錄才有統計意義
- 演化不應完全覆蓋測驗結果——採加權混合
- 進化必須是「重大事件」，不能每週跳來跳去
- Cloudflare Workers Cron Trigger 有執行時間限制（~30s CPU time）

## Goals / Non-Goals

**Goals:**
- 從攀登紀錄萃取行為模式信號，與原測驗結果加權混合
- 計算攀岩光譜 Style Spectrum（取代 Ego Grade，三種正面定位）
- 三重門檻慣性機制，讓進化成為有意義的事件
- 記錄演化歷史，提供時間軸視覺化
- 性格類型改變時發送通知
- Web 與 Mobile 均提供時間軸頁面

**Non-Goals:**
- 不改變原始測驗流程或問卷內容
- 不做即時演化（每次上傳紀錄就重算）——以週為週期
- 不做社交比較（「你比 80% 的人進化更快」）
- 不涉及訓練計畫自動調整（由 `quiz-ai-training` 處理）

## Decisions

### Decision 1：行為模式信號萃取（非路線標籤）

不看路線「是什麼類型」，看「你在各類型上的表現模式」——避免環境限制偏差（例如岩館只有 slab 牆）。

**Body 軸（Power ◄► Technique）**：
- 高難度完攀集中在哪類路線（突破點分析）
- 各類路線的 onsight 成功率差異（直覺強項）
- 各類路線的平均嘗試次數差異（需要更多嘗試 = 非強項）
- 即使環境只有 slab，碎岩者的行為模式（高嘗試次數、低完攀率）跟禪者（低嘗試次數、高完攀率）仍然不同

**Motive 軸（Goal ◄► Free）**：
- 同一條路線嘗試次數 > 3 的比例（project 傾向）
- unique 路線數 / 總攀爬數（多樣性 vs 專注）

**Mind 軸（Bold ◄► Steady）**：
- 難度突破頻率（近 90 天新最高難度次數 / 活躍月數）
- lead / top-rope 比例（敢不敢先鋒）

**替代方案**：直接用路線類型標籤計數（overhang 佔比 → Power）。但受環境限制嚴重（岩館只有某類牆面），且路線類型標籤可能缺失。用表現模式更穩健。

### Decision 2：混合策略——測驗 + 行為加權

演化結果不完全取代測驗結果，採加權混合：

```
final_pct = quiz_weight * quiz_pct + behavior_weight * behavior_signal * 100
```

權重隨紀錄筆數漸進調整：
- 20~50 筆：quiz 70% / behavior 30%
- 51~100 筆：quiz 50% / behavior 50%
- 100+ 筆：quiz 30% / behavior 70%

無測驗結果時 behavior 100%。

**替代方案**：完全以行為取代測驗。但測驗捕捉主觀偏好（你想成為什麼），行為反映客觀現實（你實際做什麼），兩者互補。

### Decision 3：攀岩光譜 Style Spectrum（取代 Ego Grade）

redpoint 最高難度與 onsight 最高難度的差距，用三種全部正面的定位取代原本可能帶負面暗示的 Ego Grade：

| 差距 | 定位 | 英文 | 描述 |
|------|------|------|------|
| > 3 子級 | 深耕者 | Deep Sender | 極高的路線學習能力，在熟悉路線上挖掘出別人看不到的可能性 |
| 0-3 子級 | 全能者 | All-Rounder | onsight 和 redpoint 同步成長，最均衡的攀岩狀態 |
| < 0 子級 | 即興者 | Flash Reader | 在未知路線上的表現幾乎跟練過的一樣好，極強的動態 beta 閱讀能力 |

每種定位附帶正面的「成長方向」建議。

難度轉換：5.6=1, 5.7=2, ..., 5.15d=30，差值 = redpoint 數值 - onsight 數值。

**替代方案**：直接用 Ego Grade 命名。但「ego 很高」聽起來負面，用戶不想分享負面標籤。三種正面定位每種都有價值，更適合分享和展示。

### Decision 4：三重門檻慣性機制

防止人格頻繁跳動，讓進化成為「重大事件」：

1. **最低資料門檻**：至少 20 筆攀登記錄
2. **穩定期**：同一型態至少維持 8 週
3. **連續確認**：連續 3 次週計算都指向同一個新型態

每週 cron 照常計算和記錄（含 consecutive_count），但只在三重門檻全部滿足時才更新 `users.personality_type` 並發送通知。

這讓進化從「每週可能跳」變成至少需要「8 週穩定 + 3 週連續確認 = 最快 11 週」才能進化一次。

**替代方案**：無慣性機制，每次計算結果不同就進化。但用戶剛跟朋友分享「我是碎岩者」，下週就變成鍛造者，身份感被稀釋。

### Decision 5：Cron Job 設計

Cloudflare Workers Cron Trigger，每週一 UTC 00:00：

1. 查詢 `personality_type IS NOT NULL` 且 `last_active_at` 30 天內且 ascent count >= 20 的用戶
2. 每批 50 用戶
3. 對每用戶執行演化計算
4. INSERT personality_evolution（每次計算都記錄，含 consecutive_count）
5. 三重門檻通過 → UPDATE users + 發通知
6. 記錄處理結果

手動觸發：`POST /api/v1/quiz/evolution/calculate`，每日限 1 次，同樣受三重門檻限制。

### Decision 6：資料表設計

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
  trigger TEXT NOT NULL,       -- 'cron' | 'manual' | 'quiz'
  consecutive_count INTEGER DEFAULT 1,
  calculated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

ALTER TABLE users ADD COLUMN style_spectrum REAL;
```

### Decision 7：通知機制

性格類型改變（三重門檻全部滿足）時：
- In-app banner：下次進入 profile 顯示「你從 [舊型態] 進化為 [新型態] 了！」
- 附「查看演化歷程」連結
- 用戶關閉/點擊後標記已讀

首版簡化為 in-app 通知，避免依賴尚未建立的推播基礎設施。

## Risks / Trade-offs

- **行為信號偏誤** → 路線類型資料可能不完整。用表現模式（完攀率、嘗試次數差異）而非標籤計數來降低風險。資料不足的軸跳過行為信號，僅用測驗值。
- **Cron 超時** → 批次 50 用戶。若超出 Workers Cron 可處理範圍，改用 Durable Objects alarm。
- **慣性機制過嚴** → 最快 11 週才能進化。但這是有意的——讓進化成為值得分享的事件。如果太嚴可以調（穩定期 8→4 週，連續確認 3→2 次），都是常數。
- **攀岩光譜分佈** → 大多數人可能集中在「全能者」（差距 0-3），深耕者和即興者較少。這是自然的——均衡本來就比極端常見。
