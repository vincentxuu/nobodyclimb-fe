## Context

React-agent 是 NobodyClimb 的 AI 攀岩助理，採用 ReAct（Reasoning + Acting）架構，LLM 透過 tool calling 從資料庫查詢後回答使用者。

目前流程：使用者發問 → orchestrator 呼叫 LLM → LLM 選擇工具（如 `user_profile`、`recommend`、`search_routes`）→ 取得結果 → LLM 生成回答。

**問題場景**：使用者說「我爬了斜陽跟新竹客家人，推薦墾丁下一條」，LLM 第一步呼叫 `user_profile`，回傳「總完攀：0 條，去過 0 個岩場」。LLM 看到 0 條記錄後直接回覆「沒有記錄，請問您的偏好」，忽略了使用者訊息中已提供的路線名稱和目標岩場。

**根因分析**：
1. `REACT_AGENT_SYSTEM_PROMPT_TEMPLATE` 沒有針對 zero-ascent 場景的指引
2. `buildPersonalizedSystemPrompt` 在 0 筆記錄時回傳未修改的 base prompt，沒有任何提示 LLM 該如何處理新用戶
3. `recommend` tool 的描述是「根據用戶的攀登歷史和能力」，暗示必須有歷史才能用
4. LLM 在無個人化 context 且 profile 為空時，合理選擇了「反問」而非「推薦」——因為 prompt 沒告訴它可以從使用者訊息中提取資訊

## Goals / Non-Goals

**Goals:**
- 使用者即使沒有完攀記錄，react-agent 也能根據使用者訊息中提到的路線名稱、難度、岩場等線索進行路線推薦
- 修改範圍最小化：只調整 prompt 和 tool 描述/邏輯，不改架構

**Non-Goals:**
- 不改動 react-agent 的 ReAct 迴圈架構
- 不新增工具
- 不改動資料庫 schema
- 不處理未登入用戶的情況（仍維持現有行為）

## Decisions

### Decision 1：在 system prompt 新增 zero-ascent 指引

**做法**：在 `REACT_AGENT_SYSTEM_PROMPT_TEMPLATE` 的工具呼叫規定區塊後，新增一段 zero-ascent 場景指引，明確告訴 LLM：
- 當 `user_profile` 顯示 0 條完攀記錄時，不要反問使用者偏好
- 應從使用者的訊息中提取路線名稱、難度等級、岩場名稱等線索
- 用這些線索呼叫 `search_routes` 或 `recommend`（帶 crag 參數）繼續推薦

**為什麼不改 personalization**：`buildPersonalizedSystemPrompt` 的 null 回傳是正確的——新用戶確實沒有個人化 context。問題在於 LLM 不知道「沒有 context」時該怎麼做，所以解法是在 prompt 中補上指引，而非硬塞假 context。

**替代方案考慮**：
- ~~在 personalization 回傳 null 時注入「新手 context」~~：這會汙染 personalization 的語意（它本該反映真實用戶資料），且後續如果用戶有了記錄，過渡行為會變得複雜
- ~~新增一個 tool 專門處理無記錄場景~~：過度工程，問題本質是 prompt 引導不足

### Decision 2：修改 recommend tool 的 prompt 描述（execute 不需改）

**做法**：只修改 `recommend` tool 的 `prompt()` 方法描述文字，從「根據用戶的攀登歷史和能力」改為「根據用戶的攀登歷史或訊息中提到的條件」。

**execute 不需修改**：程式碼確認 `recommend.ts:98` 的 `if (userMaxGrade !== null)` 已正確在 0 ascents 時跳過難度過濾，`climbedRouteIds` 為空集合也不影響排除邏輯。此工具在 0 ascents 場景的 execute 行為已經正確，問題只在 prompt 描述讓 LLM 誤以為不該呼叫它。

### Decision 3：不修改 personalization.ts

**理由**：`buildAscentContext` 回傳 null、`estimateAbilityLevel` 回傳 null 的行為是正確的——新用戶確實沒有這些資料。修改 prompt 已足夠解決問題，不需要在 personalization 層硬塞 fallback。

### Decision 4：Prompt 段落草稿

在 `REACT_AGENT_SYSTEM_PROMPT_TEMPLATE` 的規則 11（建議問題）之後，新增以下段落：

```
**【無完攀記錄時的處理規定】**
當 user_profile 工具回傳用戶完攀記錄為 0 條時：
- **禁止**以「沒有記錄」為由反問使用者偏好或拒絕推薦
- 從使用者的訊息中提取可用線索（路線名稱、難度等級、岩場名稱、攀登類型），呼叫 search_routes 或 recommend 工具繼續搜尋推薦
- 若使用者提到已爬過的路線名稱，可從這些路線的難度推斷使用者程度，搜尋相近難度的路線
- 若使用者訊息中完全沒有任何線索，呼叫 recommend 工具進行通用推薦
- 若搜尋工具找不到使用者提及的路線，仍應根據其他線索（如岩場名稱）繼續推薦，並說明該路線在目前資料中找不到
```

## Risks / Trade-offs

- **LLM 遵從度風險**：prompt 指引是軟約束，LLM 可能偶爾仍選擇反問而非推薦 → 緩解：用明確的「禁止…」語氣撰寫指引，與現有 prompt 風格一致
- **Engine retry 限制**：`engine.ts` 的 retry 機制只在 turn 1 無 tool call 時觸發。本 bug 場景中 LLM 在 turn 1 已呼叫 `user_profile`，turn 2 決定直接回答而非繼續呼叫工具時，engine 不會強制它再呼叫。因此 prompt 的禁止語氣必須足夠強硬，不能只是「建議」→ 緩解：使用與現有規則一致的「禁止」「絕對不可」措辭
- **推薦品質**：無記錄時推薦缺少能力評估，可能推薦過難/過簡的路線 → 緩解：LLM 可從使用者提到的路線難度推斷程度（例如提到 5.11a 的路線，表示至少有 5.11 的能力），prompt 中明確指引此行為
- **搜不到提及路線**：使用者說的路線名稱可能不在資料庫中（如口語化的別名），`search_routes` 可能搜不到 → 緩解：prompt 指引 LLM 在搜不到特定路線時仍用其他線索（岩場、難度）繼續推薦
