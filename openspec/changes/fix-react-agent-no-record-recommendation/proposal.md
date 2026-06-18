## Why

React-agent 在 `user_profile` 回傳 0 條完攀記錄時，直接放棄推薦並反問使用者偏好，即使使用者訊息中已明確提到路線名稱和目標岩場（例如「我爬了斜陽跟新竹客家人，推薦墾丁下一條」）。問題根因有三：

1. **System prompt 缺少 zero-ascent 引導**：沒有指示 LLM 在無記錄時仍應從使用者訊息中提取路線名稱、難度、岩場等線索去呼叫搜尋工具
2. **Recommend tool 描述暗示需要歷史**：prompt 描述為「根據用戶的攀登歷史和能力」，讓 LLM 誤以為必須有歷史才能使用（但 execute 邏輯本身已正確處理 0 ascents 場景）

## What Changes

- **修改 system prompt**：新增 zero-ascent 場景的明確指引，指示 LLM 當 user_profile 無記錄時，應從使用者訊息中提取路線、難度、岩場等線索，呼叫 `search_routes` 或 `recommend` 工具進行推薦，而非反問使用者
- **修改 recommend tool 描述**：將 prompt 描述從「根據用戶的攀登歷史和能力」改為不暗示必須有歷史的措辭（execute 邏輯本身已正確處理 0 ascents，不需修改）

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `ai-query-service`：修改 react-agent system prompt 和 recommend tool 描述，處理 zero-ascent 場景

## Impact

- **後端**：`backend/src/utils/ai-prompts.ts`（system prompt）、`backend/src/services/react-agent/tools/recommend.ts`（prompt 描述）
- **無 breaking change**：不影響 API 介面、資料庫 schema 或前端
- **有記錄的使用者不受影響**：只新增 zero-ascent 分支邏輯
