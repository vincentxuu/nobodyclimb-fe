## ADDED Requirements

### Requirement: Prompt Injection 過濾
系統 SHALL 在 LLM 呼叫前掃描輸入文字，偵測已知 prompt injection 模式；命中時 SHALL 返回 400 且不消耗用戶配額。

#### Scenario: 偵測到 prompt injection 關鍵字
- **WHEN** 用戶查詢包含 `ignore previous instructions`、`you are now`、`pretend to be`、`DAN`、`jailbreak` 等關鍵字
- **THEN** 返回 400，body 為 `{ "success": false, "error": "invalid_input", "message": "輸入內容不符合使用規範" }`，且不扣除配額

#### Scenario: 正常攀岩問題通過
- **WHEN** 用戶查詢為「龍洞有哪些 5.11 路線？」
- **THEN** 通過驗證，繼續執行 RAG 流程

### Requirement: Jailbreak Pattern 偵測
系統 SHALL 偵測 role-play 類型攻擊；命中時 SHALL 返回 400 且不消耗配額。

#### Scenario: 偵測到 role-play 攻擊
- **WHEN** 查詢包含 `act as`、`roleplay as`、`simulate`、`扮演`、`假裝你是` 等模式
- **THEN** 返回 400，body 含 `error: "invalid_input"`，不扣除配額

#### Scenario: 正常問句含類似詞彙不誤判
- **WHEN** 查詢為「模擬攀岩訓練應該怎麼規劃？」（含「模擬」但非攻擊模式）
- **THEN** 通過驗證（關鍵字比對不區分攀岩語境，可接受少量 false positive）

### Requirement: 無效輸入拒絕
系統 SHALL 拒絕純符號、亂碼、連續重複字元組成的無意義輸入；命中時 SHALL 返回 400 且不消耗配額。

#### Scenario: 純符號輸入被拒絕
- **WHEN** 查詢為 `!!!???###` 或 `aaaaaaaaaaaaaaaa`（10 個以上相同字元）
- **THEN** 返回 400，body 含 `error: "invalid_input"`

#### Scenario: 中英混合正常輸入通過
- **WHEN** 查詢為「5.12a route in Longdong」
- **THEN** 通過驗證

### Requirement: 黑名單可動態更新
系統 SHALL 支援從 `ai_config` 表讀取額外黑名單關鍵字；更新黑名單不需重新部署。

#### Scenario: 從 ai_config 載入自訂黑名單
- **WHEN** `ai_config` 表中 `key = 'input_blocklist'` 有值
- **THEN** 該值解析為 JSON 陣列，追加至預設關鍵字清單
