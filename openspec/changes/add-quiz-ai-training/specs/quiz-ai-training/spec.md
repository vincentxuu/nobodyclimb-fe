## ADDED Requirements

### Requirement: AI 訓練計畫生成

系統 SHALL 提供 AI 動態訓練計畫生成服務，根據用戶的攀登紀錄、性格類型、訓練進度與回饋，透過 Workers AI（`@cf/google/gemma-3-12b-it`）產生個人化週訓練計畫。生成結果 SHALL 符合 `TrainingWeek` 結構（3 天，每天含 title、description、duration、exercises[]）。

#### Scenario: 生成個人化訓練計畫

- **WHEN** 已登入用戶且攀登紀錄 >= 5 筆，呼叫 `POST /api/v1/training/ai/generate`
- **THEN** 系統分析用戶攀登紀錄、性格類型、既有訓練完成率，呼叫 Workers AI 生成個人化週訓練計畫，以 JSON 格式回傳 `{ success: true, data: { plan: TrainingWeek, source: "ai", difficulty_level: number } }`

#### Scenario: 同週重複請求使用快取

- **WHEN** 用戶在同一週內再次呼叫 `POST /api/v1/training/ai/generate`（`force: false` 或未指定）
- **THEN** 回傳已快取的 `ai_training_plans` 記錄，不重新呼叫 Workers AI

#### Scenario: 強制重新生成

- **WHEN** 用戶呼叫 `POST /api/v1/training/ai/generate` 並指定 `force: true`
- **THEN** 刪除既有快取記錄並重新呼叫 Workers AI 生成新計畫

#### Scenario: 強制重新生成速率限制

- **WHEN** 用戶同一天內已使用 `force: true` 3 次
- **THEN** 回傳 429 Too Many Requests

### Requirement: AI 訓練計畫 Fallback

系統 SHALL 在以下條件下退回靜態模板訓練計畫：用戶攀登紀錄少於 5 筆、Workers AI 呼叫失敗、AI 回傳內容 JSON 解析失敗、AI 回傳內容不符合 TrainingWeek schema。Fallback 結果 SHALL 標記 `source: "template"`。

#### Scenario: 攀登紀錄不足 fallback

- **WHEN** 用戶攀登紀錄少於 5 筆，呼叫 `POST /api/v1/training/ai/generate`
- **THEN** 回傳靜態模板計畫，`source: "template"`，不呼叫 Workers AI

#### Scenario: Workers AI 呼叫失敗 fallback

- **WHEN** Workers AI 呼叫逾時或回傳錯誤
- **THEN** 回傳靜態模板計畫，`source: "template"`，並記錄錯誤日誌

#### Scenario: AI 回傳格式無效 fallback

- **WHEN** Workers AI 回傳內容無法解析為 JSON 或不符合 TrainingWeek Zod schema
- **THEN** 回傳靜態模板計畫，`source: "template"`

### Requirement: 難度自適應調整

系統 SHALL 根據用戶的訓練完成率與回饋自動調整 AI 生成計畫的難度等級（1~5）。初始難度根據用戶最高完攀難度推算。調整規則：上週完成率 100% 且回饋「太簡單」時 +1；上週完成率 < 50% 或回饋「太難」時 -1；難度不低於 1 且不高於 5。

#### Scenario: 初始難度推算

- **WHEN** 用戶首次生成 AI 訓練計畫，最高完攀難度為 5.11a
- **THEN** 初始難度等級設為 2

#### Scenario: 難度上調

- **WHEN** 用戶上週訓練完成率 100% 且回饋為「太簡單」，當前難度為 3
- **THEN** 本週生成計畫的難度等級為 4

#### Scenario: 難度下調

- **WHEN** 用戶上週訓練完成率 33% 且回饋為「太難」，當前難度為 3
- **THEN** 本週生成計畫的難度等級為 2

#### Scenario: 難度不低於下限

- **WHEN** 當前難度為 1，觸發下調條件
- **THEN** 難度維持 1

### Requirement: 取得 AI 訓練計畫 API

系統 SHALL 提供 `GET /api/v1/training/ai/plan` 端點（Auth: Required），回傳用戶最新的 AI 生成訓練計畫。支援 query parameter `type`（性格類型代碼）篩選。若無 AI 計畫，回傳空結果。

#### Scenario: 取得最新 AI 計畫

- **WHEN** 已登入用戶 GET `/api/v1/training/ai/plan?type=PGB`
- **THEN** 回傳 `{ success: true, data: { plan: TrainingWeek, source: "ai", difficulty_level: number, generated_at: string } }`

#### Scenario: 無 AI 計畫

- **WHEN** 用戶從未生成過 AI 計畫
- **THEN** 回傳 `{ success: true, data: null }`

#### Scenario: 未登入用戶被拒絕

- **WHEN** 未驗證用戶 GET
- **THEN** 回傳 401

### Requirement: 訓練回饋 API

系統 SHALL 提供 `POST /api/v1/training/ai/feedback` 端點（Auth: Required），接收用戶對 AI 訓練計畫的回饋。Request body 包含 `plan_id`（對應 ai_training_plans.id）、`rating`（`too_easy` | `just_right` | `too_hard`）、`comment`（選填文字）。

#### Scenario: 提交回饋

- **WHEN** 已登入用戶 POST `{ plan_id: "abc", rating: "too_hard", comment: "引體向上組數太多" }`
- **THEN** 建立 `ai_training_feedback` 記錄，回傳 200

#### Scenario: 無效 plan_id

- **WHEN** `plan_id` 不存在於 `ai_training_plans`
- **THEN** 回傳 404

#### Scenario: 無效 rating 值

- **WHEN** `rating` 不是 `too_easy`、`just_right`、`too_hard` 之一
- **THEN** 回傳 400

#### Scenario: 未登入用戶被拒絕

- **WHEN** 未驗證用戶 POST
- **THEN** 回傳 401

### Requirement: AI 訓練資料表

系統 SHALL 提供 D1 資料表 `ai_training_plans` 儲存 AI 生成的訓練計畫，包含 id、user_id、personality_type、week_number、difficulty_level、plan_content（JSON）、source（`ai` | `template`）、model_id、prompt_tokens、completion_tokens、generated_at。`(user_id, personality_type, week_number)` 為 UNIQUE 約束。

系統 SHALL 提供 D1 資料表 `ai_training_feedback` 儲存用戶回饋，包含 id、user_id、plan_id（外鍵）、rating、comment、created_at。

#### Scenario: 資料表建立

- **WHEN** 執行 D1 migration
- **THEN** `ai_training_plans` 和 `ai_training_feedback` 資料表建立成功，含索引

#### Scenario: 同週計畫唯一性

- **WHEN** 嘗試為同一用戶、同一性格類型、同一週插入第二筆 ai_training_plans
- **THEN** 觸發 UNIQUE 約束衝突
