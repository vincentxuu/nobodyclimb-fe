## Why

AI 推薦 pipeline 目前依據語意相關度（70%）和熱門度（30%）排序，加上能力過濾和已爬排除。但完全缺乏「攀岩風格」維度——碎岩者和禪者問同樣的問題會拿到一模一樣的推薦。將人格類型注入現有 pipeline 的**兩個階段**（retrieve 補充檢索 + rerank 分數調整），可以在不干擾用戶原始意圖的前提下，自然地混入反風格路線，幫助攀岩者突破瓶頸。

## What Changes

- 新增 pipeline step `personality-rerank.ts`：在 popularity-rerank 之後加入人格維度分數調整，權重由 `ai_config` 動態控制
- 修改 retrieve 階段：用戶查詢照常執行，額外做一次「反風格補充檢索」（根據人格類型的反面風格關鍵字），拿 5-10 條備選混入候選池
- 修改 `user_profile` tool：SQL 查詢加入 `personality_type`，回傳格式化輸出包含性格類型名稱
- `ai_config` 新增 3 個可調參數：`personality_weight`、`personality_mode`、`personality_anti_ratio`
- 輕微調整 react-agent system prompt：告知 LLM 推薦結果中可能包含反風格路線（標籤已由 pipeline 標記）

## Capabilities

### New Capabilities

- `quiz-ai-recommend`：人格感知推薦 pipeline — 反風格補充檢索 + personality-rerank 階段 + ai_config 動態權重

## Impact

- `backend/src/services/pipeline/steps/personality-rerank.ts`：新增 pipeline 階段
- `backend/src/services/query/retrieval.ts`：修改，加入反風格補充檢索邏輯
- `backend/src/services/react-agent/tools/user-profile.ts`：修改 SQL + formatResult
- `backend/src/services/query/config.ts`：新增 3 個 ai_config 參數
- `backend/src/utils/ai-prompts.ts`：輕微修改 system prompt
- 依賴 `add-quiz-backend`（`users.personality_type` 欄位）
- 依賴 `add-quiz-personality-model`（`@nobodyclimb/constants` 型態定義）
