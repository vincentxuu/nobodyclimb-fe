## MODIFIED Requirements

### Requirement: 儲存測驗結果 API

系統 SHALL 提供 `POST /api/v1/quiz/results` 端點。Auth: Optional。

Zod schema 驗證 request body（answers 長度 24、值 1~5、personality_type 為合法代碼、pct 為 0~100）。已登入綁 user_id，未登入設 null。INSERT quiz_results。若已登入：UPDATE users SET personality_type, personality_taken_at。

演化系統擴充：儲存測驗結果時，若用戶已有 personality_evolution 記錄，SHALL 同時插入一筆 trigger = 'quiz' 的演化記錄，標記「測驗重設」事件，確保時間軸完整反映所有性格變更來源。

#### Scenario: 儲存測驗結果（已登入）

- **WHEN** 已登入用戶 POST 合法的測驗結果
- **THEN** INSERT quiz_results，UPDATE users SET personality_type、personality_taken_at，回傳 201

#### Scenario: 儲存測驗結果（未登入）

- **WHEN** 未登入用戶 POST 合法的測驗結果
- **THEN** INSERT quiz_results（user_id = null），回傳 201

#### Scenario: 測驗重設演化記錄

- **WHEN** 已登入用戶重新測驗，原 personality_type 為 PGB，新結果為 TFS
- **THEN** INSERT personality_evolution（from_type: PGB, to_type: TFS, trigger: 'quiz'），UPDATE users SET personality_type = TFS
