## Why

AI 助理功能目前對所有用戶開放且無使用限制，隨著用戶增加將造成 API 成本失控。同時，平台缺乏一個統一的「攀岩者等級」概念來反映用戶對社群的貢獻與投入程度。透過建立「攀岩等級系統」，以用戶的攀岩內容豐富度決定等級（麓 / 壁 / 稜 / 巔），等級同時決定 AI 助理每日配額上限，讓激勵機制、社群識別、資源管控三者整合為一個連貫的系統。

## What Changes

- 新增「攀岩等級系統」：根據用戶攀岩日誌、故事、人生清單、路線記錄等內容計算「等級積分」，自動對應四個等級
- 新增 `climber_ranks` 資料表：定義各等級的積分門檻、每日 AI 配額、顯示名稱、樣式
- 新增 `user_ranks` 資料表：記錄每位用戶的當前等級、積分、AI 每日使用量、最後計算時間
- 等級顯示在：個人 Profile 頁（顯眼位置）、AI 聊天介面（剩餘次數旁）、留言/互動旁（識別標籤）、人物誌公開頁
- 修改 AI Ask 端點：根據等級決定每日配額，超限回傳 429，回應中帶等級與剩餘次數
- 新增管理端點：查詢用戶等級、手動覆寫、觸發重新計算
- 新增 Cloudflare Workers Cron Trigger：每日台灣時間 00:00 重置當日 AI 使用量並重新計算等級積分
- **現有 Badge 系統保留不變**：個人成就徽章（故事新芽、目標達成等）雙軌並存，與等級系統互不干擾

## Capabilities

### New Capabilities

- `climber-rank`：攀岩等級核心系統——定義四個等級（麓/壁/稜/巔）、積分計算規則、積分來源（biography 完整度、故事、人生清單、路線記錄等）、用戶等級資料儲存、各顯示位置（Profile、留言、人物誌公開頁）的等級 badge/標籤 UI
- `ai-quota-enforcement`：AI 助理的每日配額檢查與扣除——根據用戶等級查詢每日上限，以原子 UPDATE 扣除次數，超限時回傳 429，成功時回應附帶剩餘次數與等級資訊
- `ai-quota-reset`：透過 Cloudflare Workers Cron Trigger 每日定時重置 AI 使用量並重新計算所有用戶積分與等級
- `ai-quota-admin`：管理員端點——查詢用戶等級詳情（含各模組積分分解）、手動覆寫等級、手動觸發積分重算

### Modified Capabilities

- `ai-api-endpoints`：`POST /api/v1/ai/ask` 整合配額檢查；回應加入 `quota` 物件（tier、remaining、daily_limit）；新增 `GET /api/v1/ai/quota/me` 供前端初始化載入

## Impact

**資料庫**：

- 新增 migration：`climber_ranks` 資料表（等級定義）、`user_ranks` 資料表（用戶等級狀態）

**後端**：

- `backend/src/services/`：新增 `rank.ts`（積分計算 + 等級查詢）
- `backend/src/routes/ai.ts`：整合配額檢查，新增 `/quota/me` 端點
- `backend/src/routes/admin-ai.ts`：新增等級管理端點
- `backend/wrangler.toml`：新增 Cron Trigger（UTC 16:00）

**前端**：

- `apps/web/src/components/ai/ChatWidget.tsx`：等級 badge + 剩餘次數顯示、超限提示
- `apps/web/src/components/biography/`：Profile 頁等級顯示組件、留言/互動旁等級標籤
- `apps/web/src/lib/api/ai.ts`：新增 `getMyQuota()` API

**共享套件**：

- `packages/types/`：新增 `ClimberRank`、`UserRank`、`AiQuota` 類型
