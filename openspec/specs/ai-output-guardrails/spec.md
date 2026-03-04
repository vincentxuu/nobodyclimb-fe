## ADDED Requirements

### Requirement: System Prompt Leakage 偵測
系統 SHALL 掃描 LLM 回應，偵測是否包含 system prompt 特徵字串；命中時 SHALL 以通用錯誤訊息取代，並記錄告警。

#### Scenario: 偵測到 system prompt 洩漏
- **WHEN** LLM 回應包含 `SYSTEM_PROMPT`、`You are a climbing assistant`、`你是一個攀岩助理` 等 system prompt 特徵
- **THEN** 回應被替換為「抱歉，回答過程發生錯誤，請重新提問。」；告警記錄寫入 `ai_query_logs`

#### Scenario: 正常回應不受影響
- **WHEN** LLM 回應為一般攀岩資訊
- **THEN** 回應原樣返回前端

### Requirement: PII 過濾
系統 SHALL 掃描 LLM 回應中的 email、電話號碼格式；命中時 SHALL 以 `[已隱藏]` 取代。

#### Scenario: 回應含 email 被過濾
- **WHEN** LLM 回應包含格式如 `user@example.com` 的字串
- **THEN** 該部分被替換為 `[已隱藏]`，其餘內容不受影響

#### Scenario: 回應含電話號碼被過濾
- **WHEN** LLM 回應包含格式如 `0912-345-678` 或 `02-12345678` 的字串（regex：`\b0\d{1,2}-?\d{6,8}\b`）
- **THEN** 該部分被替換為 `[已隱藏]`

#### Scenario: 正常內容不受影響
- **WHEN** LLM 回應不含 PII 資訊
- **THEN** 回應原樣返回

### Requirement: 回應長度截斷
系統 SHALL 在回應超過 3,000 字元時自動截斷，並附加提示訊息。

#### Scenario: 回應超過長度上限
- **WHEN** LLM 生成的回應超過 3,000 字元
- **THEN** 回應截斷至 3,000 字元，末尾附加「…（回答已截斷，請縮短問題或分多次詢問）」

#### Scenario: 正常長度回應不截斷
- **WHEN** LLM 生成的回應不超過 3,000 字元
- **THEN** 回應完整返回，無截斷提示
