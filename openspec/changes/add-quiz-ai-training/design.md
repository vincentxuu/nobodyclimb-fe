## Context

靜態訓練計畫（`@nobodyclimb/constants` 的 `TRAINING_PLANS`）為 8 種人格類型提供固定的 4 週 x 3 天內容。但攀岩者的能力、進度、偏好各異，靜態計畫無法調整。本設計引入 Workers AI 動態生成個人化訓練建議，作為靜態計畫的智慧補充層。

**約束條件**：
- Workers AI 有 token 限制與延遲（~2-5s），不適合即時生成
- 用戶可能無足夠攀登紀錄，需要 fallback
- 生成結果需快取，避免重複呼叫浪費配額
- 必須與既有 training API 共存，不破壞靜態計畫流程

## Goals / Non-Goals

**Goals:**
- 根據用戶攀登紀錄 + 性格類型 + 訓練完成率，生成個人化週訓練計畫
- 支援難度自適應：根據完成率與用戶回饋調整下週強度
- 提供 fallback：資料不足或 AI 不可用時退回靜態模板
- 生成結果快取於 D1，同一週不重複生成

**Non-Goals:**
- 不替換靜態模板——AI 計畫與靜態計畫共存，用戶可選擇
- 不做即時串流生成（與 AI chat 的 SSE 不同，訓練計畫是批次生成）
- 不涉及前端 UI 修改（由 `add-quiz-training-ui` 消費）
- 不做多輪對話式訓練教練

## Decisions

### Decision 1：生成策略——按週快取

AI 每週為用戶生成一次訓練計畫，結果存入 `ai_training_plans` 表。同一 `(user_id, personality_type, week_number)` 組合只生成一次，後續請求直接查表回傳。用戶可透過 `POST /ai/generate` 強制重新生成（`force: true`）。

**替代方案**：每日生成。但訓練計畫以「週」為單位設計，每日生成增加 AI 呼叫次數且破壞訓練連貫性。

### Decision 2：Prompt 結構——結構化輸入 + JSON 輸出

Prompt 包含：
1. System prompt：你是攀岩訓練教練，根據以下資料生成個人化週訓練計畫
2. 用戶資料摘要：性格類型、攀登紀錄統計（最高難度、偏好路線類型、近期活躍度）
3. 訓練進度：已完成天數、完成率、上週回饋
4. 輸出格式：要求 JSON，結構對齊 `TrainingWeek` 型別（3 天，每天含 title, description, duration, exercises[]）

使用 `response_format: { type: "json" }` 確保結構化輸出。若 JSON 解析失敗，fallback 至靜態模板。

**替代方案**：自然語言輸出後解析。但 JSON 格式更可靠，減少解析錯誤。

### Decision 3：難度自適應演算法

難度等級 1~5（1=入門，5=挑戰極限），初始根據用戶最高完攀難度推算：
- 5.10 以下 → level 1
- 5.10~5.11 → level 2
- 5.11~5.12 → level 3
- 5.12~5.13 → level 4
- 5.13+ → level 5

調整規則：
- 上週完成率 100% + 回饋「太簡單」→ level +1
- 上週完成率 < 50% 或回饋「太難」→ level -1
- 其他情況維持不變

Level 寫入 prompt，影響 AI 生成的訓練強度。

### Decision 4：Fallback 策略

以下情況退回靜態模板（`@nobodyclimb/constants` 的 `getTrainingPlan(type)`）：
1. 用戶攀登紀錄 < 5 筆
2. Workers AI 呼叫失敗（timeout、rate limit、服務不可用）
3. AI 回傳 JSON 解析失敗
4. AI 回傳內容不符合 `TrainingWeek` schema 驗證

Fallback 時在回傳中標記 `source: "template"`（正常為 `source: "ai"`），前端可據此顯示提示。

### Decision 5：資料表設計

```sql
CREATE TABLE ai_training_plans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  personality_type TEXT NOT NULL,
  week_number INTEGER NOT NULL,
  difficulty_level INTEGER NOT NULL DEFAULT 2,
  plan_content TEXT NOT NULL,  -- JSON string of TrainingWeek
  source TEXT NOT NULL DEFAULT 'ai',  -- 'ai' | 'template'
  model_id TEXT,  -- e.g. '@cf/google/gemma-3-12b-it'
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  generated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, personality_type, week_number)
);

CREATE TABLE ai_training_feedback (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan_id TEXT NOT NULL REFERENCES ai_training_plans(id),
  rating TEXT NOT NULL,  -- 'too_easy' | 'just_right' | 'too_hard'
  comment TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

## Risks / Trade-offs

- **AI 品質不穩定** → Zod schema 驗證 AI 輸出，不合格則 fallback。記錄 prompt/completion tokens 供後續品質分析。
- **Workers AI 配額** → 每用戶每週最多 1 次生成（`UNIQUE` 約束），`force` 重新生成有速率限制（每用戶每天最多 3 次）。
- **延遲** → 生成可能需要 2-5 秒，端點回傳完整結果（非串流），前端需顯示 loading 狀態。
- **冷啟動問題** → 新用戶無攀登紀錄，直接使用靜態模板，不觸發 AI 生成。
