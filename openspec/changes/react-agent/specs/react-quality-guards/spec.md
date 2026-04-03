## ADDED Requirements

### Requirement: 規則式同步檢查
系統 SHALL 在 ReAct loop 結束後對最終回答執行規則式品質檢查（同步，不用 LLM）。

#### Scenario: 回答長度不足
- **WHEN** 最終回答長度 < 50 字
- **THEN** 標記 `quality_flag: 'too_short'`，記入 log

#### Scenario: System prompt 洩漏
- **WHEN** 最終回答包含 system prompt 內容或內部指令
- **THEN** 系統移除洩漏內容，標記 `quality_flag: 'prompt_leak'`

#### Scenario: 回答未引用資料來源
- **WHEN** 最終回答涉及路線、岩場等具體資訊，但未提及任何資料來源（如路線名稱、岩場名稱）
- **THEN** 標記 `quality_flag: 'no_citation'`，記入 log

#### Scenario: 通過所有規則檢查
- **WHEN** 最終回答通過所有規則式檢查
- **THEN** 回答正常回傳給用戶

### Requirement: LLM judge 非同步評分
系統 SHALL 在回傳回答後非同步執行 LLM judge 評分（使用 ModelMap 中的 judge 觸點配置），結果寫入 log，不擋回應。

#### Scenario: 非同步 judge 執行
- **WHEN** 最終回答已回傳給用戶
- **THEN** 系統在背景使用 judge 觸點配置的 provider + 模型評估 groundedness（0-4）和 quality（0-5）
- **THEN** 評分結果寫入 ai_query_logs 和 Langfuse trace

#### Scenario: Judge 失敗不影響回答
- **WHEN** judge LLM 呼叫逾時或失敗
- **THEN** 記錄 judge 失敗事件，不影響已回傳的回答

### Requirement: Input guardrail（規則式）
系統 SHALL 在進入 ReAct loop 前以規則式檢查用戶輸入，複用現有 `checkInput()` 函數，不使用 LLM。

#### Scenario: 有害輸入
- **WHEN** 用戶輸入包含有害內容（注入攻擊、惡意指令），經 checkInput() 判斷不安全
- **THEN** 系統拒絕處理，回傳安全提示訊息，不進入 ReAct loop

#### Scenario: 正常輸入
- **WHEN** checkInput() 判斷輸入安全
- **THEN** 繼續進入 ReAct loop
