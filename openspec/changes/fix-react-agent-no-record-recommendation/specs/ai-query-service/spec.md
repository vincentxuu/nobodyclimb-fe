## MODIFIED Requirements

### Requirement: System prompt 設定
系統應使用可設定的 system prompt，指示 LLM 僅根據提供的資料以繁體中文回答。對已登入且有記憶或完攀紀錄的用戶，system prompt SHALL 在基礎指令前附加個人化 context 段落。React Agent 的 system prompt SHALL 包含 zero-ascent 場景指引，確保 LLM 在用戶無完攀記錄時仍能從對話訊息中提取線索進行推薦。

#### Scenario: 套用 system prompt 規則
- **WHEN** LLM 生成回應
- **THEN** 回應遵循規則：只使用提供的資料、使用繁體中文、簡潔扼要

#### Scenario: 已登入用戶帶有個人化 context
- **WHEN** 已登入用戶有記憶「攀岩程度約 5.11，偏好台中地區」及完攀紀錄
- **THEN** system prompt 前段包含「用戶資訊：攀岩程度約 5.11，偏好台中地區。已完攀：XX（5.10a）、YY（5.11b）。建議挑戰難度：5.11c-5.12a。」

#### Scenario: 匿名用戶或無資料時使用標準 system prompt
- **WHEN** 未登入用戶，或已登入但無記憶與完攀紀錄
- **THEN** 使用標準 system prompt，不加入個人化段落

#### Scenario: Zero-ascent 用戶提及路線名稱時 LLM 繼續推薦
- **WHEN** 已登入用戶發送「我爬了斜陽跟新竹客家人，推薦墾丁下一條」，且 `user_profile` 回傳 0 條完攀記錄
- **THEN** LLM SHALL 從使用者訊息中提取路線名稱（斜陽、新竹客家人）和目標岩場（墾丁），呼叫 `search_routes` 或 `recommend` 工具搜尋，而非回覆「沒有記錄」並反問使用者偏好

#### Scenario: Zero-ascent 用戶未提及任何線索時
- **WHEN** 已登入用戶發送「推薦路線」，且 `user_profile` 回傳 0 條完攀記錄，訊息中無路線名稱、難度、岩場等線索
- **THEN** LLM SHALL 呼叫 `recommend` 工具進行通用推薦，回傳熱門或入門路線，而非反問使用者偏好

#### Scenario: Zero-ascent 用戶提及的路線搜不到時
- **WHEN** 已登入用戶發送「我爬了XX，推薦墾丁下一條」，且 `search_routes` 找不到「XX」這條路線
- **THEN** LLM SHALL 仍根據其他可用線索（如目標岩場「墾丁」）呼叫工具繼續推薦，並在回答中說明該路線在目前資料中找不到

## ADDED Requirements

### Requirement: React Agent zero-ascent prompt 指引
`REACT_AGENT_SYSTEM_PROMPT_TEMPLATE` SHALL 包含一段 zero-ascent 場景的明確指引規則，指示 LLM 在 `user_profile` 回傳 0 條完攀記錄時的行為。

#### Scenario: Prompt 包含 zero-ascent 指引
- **WHEN** react-agent 組裝 system prompt
- **THEN** prompt 文字中 SHALL 包含以下指引內容：（1）當 user_profile 顯示 0 條完攀時，禁止反問使用者偏好；（2）應從使用者訊息中提取路線名稱、難度、岩場等線索呼叫搜尋工具；（3）若使用者提到已爬過的路線，可從這些路線的難度推斷使用者程度

#### Scenario: 指引不影響有記錄的用戶
- **WHEN** `user_profile` 回傳 5 條完攀記錄
- **THEN** zero-ascent 指引不影響 LLM 行為，LLM 照常根據歷史記錄推薦

### Requirement: Recommend tool zero-ascent 支援
`recommend` tool 的 prompt 描述 SHALL 不暗示必須有攀登歷史才能使用。execute 邏輯在 0 ascents 時已正確跳過難度過濾（`userMaxGrade === null` 時不套用 grade filter），此行為 SHALL 維持不變。

#### Scenario: Recommend tool prompt 描述不預設需要歷史
- **WHEN** react-agent 組裝工具描述
- **THEN** `recommend` tool 的 prompt 描述 SHALL 為「根據用戶的攀登歷史或訊息中提到的條件，推薦適合的攀岩路線。會排除已完攀的路線。」，不暗示必須有歷史記錄才能使用

#### Scenario: 無記錄用戶帶 crag 參數呼叫 recommend（既有行為確認）
- **WHEN** LLM 以 `{ "crag": "墾丁" }` 呼叫 `recommend` tool，且用戶有 0 條完攀記錄
- **THEN** tool 搜尋墾丁岩場路線並回傳推薦清單，不套用難度過濾（`userMaxGrade` 為 null），已攀登路線排除集合為空不影響結果

#### Scenario: 無記錄用戶不帶 crag 參數呼叫 recommend（既有行為確認）
- **WHEN** LLM 以 `{}` 呼叫 `recommend` tool，且用戶有 0 條完攀記錄
- **THEN** tool 回傳通用推薦路線清單，不套用難度過濾
