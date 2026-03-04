## Why

AI 問答目前對每個用戶一視同仁，無法根據個人攀岩程度、偏好或歷史紀錄給出量身定制的回答。加入記憶與個人化機制，讓 AI 能「認識」用戶，提升推薦準確度與使用黏著度，是 2026 AI Agent 發展的核心趨勢。

## What Changes

- 新增 `user_ai_memory` 表，儲存從對話中自動提取的用戶偏好記憶（攀岩程度、偏好岩場、攀岩類型）
- 對話結束後，用輕量 LLM 自動從對話中提取關鍵用戶資訊，寫入記憶表
- 每次 AI 查詢時，將用戶記憶摘要注入 system prompt（「此用戶攀岩程度約 5.11，偏好台中地區，喜歡運攀」）
- 新增 `/profile/ai-memory` 前端頁面，供用戶查看與刪除個人 AI 記憶（符合資料自主精神）
- 查詢時從 `route_ascents` 取用戶最近 10 條完攀紀錄，加入 RAG context，讓 LLM 能根據實際能力調整推薦難度
- 根據完攀紀錄推算用戶能力區間，推薦路線時優先推薦「比目前能力略難一級」的路線

## Capabilities

### New Capabilities

- `ai-user-memory`: 用戶 AI 記憶的 CRUD、對話後自動提取記憶、system prompt 注入，以及前端記憶管理介面
- `ai-ascent-personalization`: 查詢時讀取用戶完攀紀錄並注入 RAG context、推算能力區間以個人化難度推薦

### Modified Capabilities

- `ai-query-service`: 查詢執行流程加入記憶注入（system prompt）與完攀紀錄 context，改變 prompt 組成方式

## Impact

- **後端**：新增 `user_ai_memory` 表 migration；`backend/src/services/query.ts` 加入 memory 注入與 ascent context；新增 `backend/src/routes/ai.ts` 的記憶管理端點（GET/DELETE）
- **前端**：新增 `apps/web/src/app/profile/ai-memory/` 頁面
- **資料庫**：`user_ai_memory` 表（`user_id`、`memory_type`、`content`、`updated_at`）
- **依賴**：`route_ascents` 表必須存在（現有功能）；Cloudflare Workers AI binding 供記憶提取 LLM 呼叫
