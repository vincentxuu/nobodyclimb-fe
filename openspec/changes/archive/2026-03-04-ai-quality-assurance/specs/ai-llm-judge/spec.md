## ADDED Requirements

### Requirement: 品質自動評分
系統 SHALL 在同一次 judge LLM 呼叫中（與 groundedness 合併），對每個 RAG 回答進行 1–4 分的品質評分。評分維度：相關性（回答是否直接回應了問題）、完整性（資訊是否充分）、格式正確性（是否符合繁體中文與 Markdown 規則）。Judge MUST 以 JSON 格式輸出 `{ "groundedness": <float>, "quality": <int> }`，其中 quality 為 1–4 整數。

#### Scenario: 高品質回答
- **WHEN** 回答直接且完整回應了問題，格式正確
- **THEN** judge 回傳 `quality = 4`

#### Scenario: 普通品質回答
- **WHEN** 回答大致相關但有部分不足或格式小問題
- **THEN** judge 回傳 `quality = 2` 或 `quality = 3`

#### Scenario: 低品質回答
- **WHEN** 回答不相關、嚴重不完整或格式錯誤
- **THEN** judge 回傳 `quality = 1`

#### Scenario: Judge 呼叫失敗
- **WHEN** judge LLM 呼叫超時或格式錯誤
- **THEN** auto_score 記錄為 null，不影響主回答返回

### Requirement: 用戶回饋與自動評分比對標記
系統 SHALL 在用戶提交 feedback_score 時，若 auto_score 不為 null 且兩者差異 >= 2（|feedback_score_normalized - auto_score| 以共同 1–4 尺度計算），自動向 `ai_flagged_responses` 新增 flag_reason = `score_discrepancy` 的標記記錄。

評分正規化規則：feedback_score（1–5 星）→ 1–4 分換算：1–2 星 = 1、3 星 = 2、4 星 = 3、5 星 = 4。

#### Scenario: 顯著評分差異觸發標記
- **WHEN** 用戶給予 feedback_score = 1（正規化為 1 分），而 auto_score = 3
- **THEN** 差異 = 2，系統向 ai_flagged_responses 新增 flag_reason = `score_discrepancy` 記錄

#### Scenario: 正常評分差異不觸發標記
- **WHEN** 用戶給予 feedback_score = 4（正規化為 3 分），而 auto_score = 4
- **THEN** 差異 = 1，系統不新增標記

#### Scenario: 缺乏自動評分時不標記
- **WHEN** auto_score 為 null（judge 未執行）
- **THEN** 無論 feedback_score 為何，不觸發 score_discrepancy 標記

### Requirement: 品質評分記錄
系統 SHALL 將 auto_score 寫入 `ai_query_logs.auto_score` 欄位（INTEGER 型別，nullable，值域 1–4）。

#### Scenario: 評分成功記錄
- **WHEN** judge 成功回傳有效 quality 值（1–4 整數）
- **THEN** ai_query_logs 的 auto_score 欄位更新為該分數

#### Scenario: 評分超出範圍處理
- **WHEN** judge 回傳 quality 值不在 1–4 範圍內
- **THEN** auto_score 記錄為 null
