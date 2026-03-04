## Context

AI 助理（`POST /api/v1/ai/ask`）目前無使用限制，每次呼叫 Cloudflare Workers AI（Gemma 3 12B）和 Vectorize 均有成本。用戶群擴大後需防止濫用，同時平台缺乏一個統一的「攀岩者身份等級」概念。

現有相關系統：

- **Badge 系統**：個人成就徽章（故事新芽、故事達人等），以 `user_badges` 資料表記錄解鎖狀態，顯示於 `/profile/stats`。此系統**保留不變**，雙軌並存。
- **Biography 內容**：`biographies`（基本欄位）、`biography_core_stories`（3題）、`biography_one_liners`、`biography_stories`
- **攀岩記錄**：`user_route_ascents`
- **人生清單**：`bucket_list_items`（含完成狀態）

---

## Goals / Non-Goals

**Goals:**

- 建立四等級系統：**麓 → 壁 → 稜 → 巔**，根據用戶內容豐富度自動升降
- 等級決定每日 AI 助理使用上限（5 / 10 / 20 / 40 次）
- 等級顯示在：個人 Profile 頁顯眼位置、AI 聊天介面、留言/互動旁、人物誌公開頁
- 每日 Cron 重置使用量並重算積分
- 管理員可查詢各模組積分明細並手動覆寫等級

**Non-Goals:**

- 不修改現有 Badge 系統（故事新芽等個人成就徽章）
- 不實作付費升級
- 未登入用戶不適用等級（直接拒絕 AI 請求）
- 積分不即時更新（用戶更新內容後最快隔日生效）

---

## Decisions

### D1：資料表設計

**`climber_ranks` — 等級定義表**（系統設定，不常變動）：

```
id, name, display_name, min_score, daily_ai_limit, color, icon, description
```

預設資料：

| id | name | display_name | min_score | daily_ai_limit |
|----|------|-------------|-----------|----------------|
| 1 | foothill | 麓 | 0 | 2 |
| 2 | wall | 壁 | 25 | 6 |
| 3 | ridge | 稜 | 55 | 12 |
| 4 | summit | 巔 | 85 | 24 |

**`user_ranks` — 用戶等級狀態表**：

```
user_id (PK), score, rank_id, daily_ai_used, daily_ai_limit,
last_reset_date, last_score_calculated_at, rank_override_id
```

- `rank_override_id`：管理員手動覆寫等級（不被 Cron 覆蓋）
- `daily_ai_limit` 冗餘儲存（避免每次 AI 請求再 JOIN `climber_ranks`）

設計理由：等級定義與用戶狀態分離，可透過管理介面調整積分門檻，不需重新部署。

---

### D2：積分計算

**選擇 Cron 批次計算**（非每次請求即時計算），理由：避免 AI 請求前做多表 JOIN，延遲最多 1 天可接受。

積分來源：

| 來源 | 計分方式 | 上限 |
|------|---------|------|
| biography 文字欄位（5 項：攀岩資歷、常去岩場、路線型態、動機、意義） | 每填一欄 +3 分 | 15 分 |
| biography.bucket_list 欄位非空 | +3 分 | 3 分 |
| biography.is_public = 1 | +5 分 | 5 分 |
| biography_core_stories（最多 3 篇） | 每篇 +8 分 | 24 分 |
| biography_one_liners（含 source='system' 和 'user'） | 每篇 +2 分，上限 10 篇 | 20 分 |
| biography_stories | 每篇 +3 分，上限 5 篇 | 15 分 |
| user_route_ascents（攀爬記錄） | 每筆 +1 分，上限 20 筆 | 20 分 |
| bucket_list_items（人生清單項目） | 每項 +1 分，上限 10 項 | 10 分 |
| bucket_list_items（已完成） | 每項額外 +2 分，上限 5 項 | 10 分 |

理論最高 ≈ 122 分，岩魂門檻設 85 分，確保積極參與的用戶可達頂級。

---

### D3：AI 配額扣除原子性

**使用 D1 單一原子 UPDATE**，避免 race condition：

```sql
UPDATE user_ranks
SET daily_ai_used = daily_ai_used + 1
WHERE user_id = ? AND daily_ai_used < daily_ai_limit
```

- 影響 1 行 → 成功，繼續處理 AI 請求
- 影響 0 行 → 配額耗盡，回傳 429 `{ error: "quota_exceeded", tier: "岩芽", ... }`

首次使用 AI 時若 `user_ranks` 無記錄，先 `INSERT OR IGNORE`（以岩芽預設值初始化），再執行原子 UPDATE。

---

### D4：Cron Trigger 設計

`wrangler.toml` 設定：

```toml
[triggers]
crons = ["0 16 * * *"]  # UTC 16:00 = 台灣 00:00
```

執行步驟：

1. `UPDATE user_ranks SET daily_ai_used = 0, last_reset_date = date('now')` — 重置所有用戶使用量
2. 批次重算積分並更新 `score`、`rank_id`、`daily_ai_limit`（跳過 `rank_override_id` 非空的用戶）
3. 未有 `user_ranks` 記錄但已有 biography 的用戶，INSERT 初始記錄

---

### D5：等級顯示方式

四個顯示位置，各有不同的 UI 形式：

| 位置 | 顯示形式 | 說明 |
|------|---------|------|
| 個人 Profile 頁 | 顯眼等級 badge（名稱 + 圖示 + 色彩） | avatar 下方或頁面頂部 |
| AI 聊天介面 | 小等級 badge + 剩餘次數（如「岩友 7/10」） | 輸入框旁或視窗頂部 |
| 留言/互動旁 | 小型等級標籤（如論壇身份組） | 使用者名稱旁 |
| 人物誌公開頁 | 等級 badge 與個人介紹並列 | 頭像下方 |

等級色彩建議（設計層面，可調整）：

- 麓：`stone/earth`（大地色，山腳泥土感）
- 壁：`slate/blue-gray`（岩壁冷靜色）
- 稜：`orange/amber`（稜線日照感）
- 巔：`deep indigo/purple`（高空深邃感）

---

### D6：與現有 Badge 系統的關係

**雙軌並存，互不干擾**：

- Badge 系統：個人成就里程碑（解鎖即永久保留，展示於 `/profile/stats`）
- 等級系統：整體投入等級（可隨內容增減而變動，展示於多個位置）

Badge 不會轉換為積分，積分不會影響 Badge 解鎖。兩者均反映用戶的攀岩社群參與，但維度不同（「你達成了什麼」vs「你現在的等級」）。

---

## Risks / Trade-offs

**[積分延遲 — 用戶今天填完資料，明天才升等級]**
→ 設計上接受此延遲。前端說明「積分每日更新」，避免用戶困惑。

**[Cron 執行失敗導致今日未重置]**
→ `user_ranks` 記錄 `last_reset_date`，AI 請求時若發現日期不符，觸發懶重置（fallback）確保安全。

**[等級降級 — 用戶刪除內容後積分下降]**
→ 積分是基於當日快照計算的，分數下降會導致等級下降（有 `rank_override_id` 的用戶除外）。此設計鼓勵持續貢獻內容。

**[D1 效能 — 每次 AI 請求多一次讀寫]**
→ 原子 UPDATE 是 PK 查詢，D1 延遲約 1-5ms，可接受。

**[留言旁顯示等級需要新 API 欄位]**
→ 留言列表 API 需新增 `rank` 欄位（JOIN `user_ranks`），需評估查詢效能影響。可考慮僅顯示「岩魂」以上等級，其餘不顯示以減少視覺噪音。

---

## Migration Plan

1. 新增 `0047_climber_rank_system.sql`：建立 `climber_ranks`、`user_ranks`，插入四個預設等級
2. 部署後端（rank 服務、AI 配額整合、Cron Trigger）
3. 部署前端（Profile、ChatWidget、留言旁、人物誌頁）
4. 首批用戶在首次 AI 請求時懶建立 `user_ranks` 記錄（岩芽預設）；Cron 當晚執行後全部更新

Rollback：移除 Cron Trigger 設定，恢復 ai.ts 無配額版本；`climber_ranks` / `user_ranks` 保留（無害）。

---

## Open Questions

- 留言旁等級標籤是否只顯示「攀岩人」以上，避免岩芽/岩友被強調而感到自卑？→ 待決策
- 等級降級是否要有緩衝期（如連續 3 天積分不足才降級）？→ 暫定直接降，若有用戶反饋再調整
- 人物誌公開頁的等級是否要有 tooltip 說明？→ 是，應說明等級代表什麼（積分來源說明）
