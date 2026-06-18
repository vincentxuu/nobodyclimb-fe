## 1. System Prompt 修改

- [ ] 1.1 在 `backend/src/utils/ai-prompts.ts` 的 `REACT_AGENT_SYSTEM_PROMPT_TEMPLATE` 規則 11 之後，新增【無完攀記錄時的處理規定】段落（見 design.md Decision 4 草稿），使用「禁止」語氣確保 LLM 遵從

## 2. Recommend Tool 描述修改

- [ ] 2.1 修改 `backend/src/services/react-agent/tools/recommend.ts` 的 `prompt()` 方法，將已登入用戶的描述從「根據用戶的攀登歷史和能力，推薦適合的攀岩路線。會排除已完攀的路線。」改為「根據用戶的攀登歷史或訊息中提到的條件，推薦適合的攀岩路線。會排除已完攀的路線。」
- [ ] 2.2 閱讀確認 `recommend` tool 的 `execute()` 在 0 ascents 時行為已正確（不需改程式碼）：`userMaxGrade` 為 null 時跳過難度過濾、`climbedRouteIds` 為空集合不影響結果

## 3. 驗證

- [ ] 3.1 本地測試：用無完攀記錄的帳號發送「我爬了斜陽跟新竹客家人，推薦墾丁下一條」，確認 agent 呼叫搜尋工具並回傳推薦路線
- [ ] 3.2 本地測試：用無完攀記錄的帳號發送「推薦路線」（無任何線索），確認 agent 回傳通用推薦而非反問
- [ ] 3.3 本地測試：用無完攀記錄的帳號發送提及不存在路線的訊息，確認 agent 仍根據其他線索推薦
- [ ] 3.4 確認有完攀記錄的帳號行為不受影響
