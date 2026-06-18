## Context

攀岩性格測驗的共用模型已定義於 `add-quiz-personality-model`（`packages/constants/src/quiz/`、`packages/types/src/quiz.ts`），前端測驗流程由 `add-quiz-web-flow` 負責。本變更為後端部分：D1 資料持久化、REST API 端點、KV cache、Climber Rank 積分整合。

現有後端架構：Hono 路由（`backend/src/routes/`）、JWT auth middleware、D1 + KV + R2 bindings、OpenAPI 3.1 自動文件。最新 migration 編號為 0068。

---

## Goals / Non-Goals

**Goals:**

- 提供測驗結果 CRUD API（儲存、查詢、統計）
- 提供訓練進度追蹤 API
- 提供同型態用戶排名
- 將測驗與訓練完成納入 Climber Rank 積分
- 所有端點含 OpenAPI 文件與 Zod 驗證

**Non-Goals:**

- 不實作前端 UI（由 `add-quiz-web-flow`、`add-quiz-mobile` 負責）
- 不實作計分引擎（已在 `@nobodyclimb/constants` 中，由 `add-quiz-personality-model` 提供）
- 不實作 AI 推薦整合（由 `add-quiz-ai-recommend` 負責）
- 不修改現有 Cron Trigger 邏輯（rank 積分重算由既有 Cron 處理）

---

## Decisions

### D1：Migration 編號與檔案

**決定**：使用 `0069_quiz_system.sql` 單一 migration 檔案，包含 quiz_results、training_progress 兩張表建立與 users 欄位擴充。

**理由**：三個 DDL 操作在邏輯上屬於同一功能，合併為一個 migration 降低部署風險。D1 migration 無 transaction 支援，但 DDL 語句（CREATE TABLE、ALTER TABLE）個別為原子操作。

### D2：POST /quiz/results 的 Auth 策略——Optional Auth

**決定**：POST 端點使用 Optional Auth。已登入用戶綁定 user_id，未登入用戶 user_id 設為 null。

**理由**：
- 降低測驗門檻——訪客可先完成測驗再決定是否註冊
- 匿名結果仍可貢獻全站統計
- 未來可在用戶登入後將匿名記錄綁定至帳號（此變更不實作）

**替代方案**：
- 強制登入 → 降低測驗完成率，影響行銷漏斗
- 完全不存匿名結果 → 全站統計不含訪客數據，失真

### D3：全站統計的 KV Cache 策略

**決定**：`GET /quiz/stats` 使用 Cloudflare KV cache，key 為 `quiz:stats:v1`，TTL 為 3600 秒（1 小時）。

**理由**：
- 統計查詢涉及 COUNT + GROUP BY，高併發時對 D1 壓力大
- 1 小時延遲對統計數據可接受
- KV 讀取在邊緣節點，延遲極低

**Cache 失效**：依 TTL 自然過期，不主動失效。新測驗結果最多延遲 1 小時反映在統計中。

### D4：排名 API 排序邏輯

**決定**：排名依據 `user_route_ascents` 表的：
1. 完攀數降序（`COUNT(*)`）
2. 最高難度降序（`MAX(grade)` 以 Yosemite Decimal System 排序）

**理由**：完攀數反映活躍度，最高難度反映實力，兩者結合較全面。

**限制**：上限回傳 50 筆，避免大量資料傳輸。已登入用戶額外回傳自身排位。

### D5：訓練進度的 Upsert 策略

**決定**：`POST /training/progress` 使用 `INSERT ... ON CONFLICT(user_id, personality_type, week, day) DO UPDATE` 實現 upsert。

**理由**：用戶可能重複標記同一天、也可能取消標記。Upsert 避免重複記錄，同時支援 completed 狀態切換。

**前提**：需在 training_progress 表上建立 UNIQUE constraint on (user_id, personality_type, week, day)。

### D6：Climber Rank 積分上限設計

**決定**：
- 測驗完成：+5 分，僅計一次（不論測驗幾次）
- 訓練完成：+15 分，僅計一個型態（首個完成的型態）

**理由**：避免用戶透過反覆測驗或切換型態刷分。總新增上限 20 分，與現有積分來源比例合理（biography 最高 23 分、core stories 24 分）。

### D7：路由檔案結構

**決定**：新增 `backend/src/routes/quiz.ts`（含 results + stats + ranking）和 `backend/src/routes/training.ts`。

**理由**：沿用現有路由拆分慣例（如 `ai.ts`、`ascents.ts`）。Quiz 的三個端點邏輯相關，放同一檔案；Training 是獨立功能域，另建檔案。

---

## Risks / Trade-offs

**[匿名結果後續綁定]**
→ 本變更不實作匿名結果綁定。匿名記錄僅影響全站統計，不影響個人歷史。後續可新增 `POST /quiz/results/claim` 端點處理。

**[排名查詢效能]**
→ 排名涉及 JOIN quiz_results + users + user_route_ascents，加上 GROUP BY 和 ORDER BY。50 筆上限和 personality_type 索引可控制查詢時間。若用戶量大，可考慮加入 KV cache（本變更暫不實作）。

**[training_progress UNIQUE constraint]**
→ D1（SQLite）支援 `ON CONFLICT` 語法，但需確保 UNIQUE constraint 在 CREATE TABLE 時定義。Migration 中須包含此 constraint。

**[Climber Rank 積分 20 分上限]**
→ 測驗 5 分 + 訓練 15 分 = 20 分。以現有門檻（麓 0 / 壁 20 / 稜 70 / 巔 100），完成測驗加訓練可直升壁等級。此為刻意設計——鼓勵新用戶參與測驗與訓練。
