## ADDED Requirements

### Requirement: 反風格補充檢索

系統 SHALL 在 retrieve 階段，除了用戶原始查詢的檢索外，額外執行一次「反風格補充檢索」。

補充檢索邏輯：
- 根據用戶的 `personality_type` 的 Body 軸判斷反風格方向
- Power 型（P__）→ 補充檢索加入 slab / vertical / technique 相關關鍵字
- Technique 型（T__）→ 補充檢索加入 overhang / roof / dynamic 相關關鍵字
- 補充檢索結果上限由 `ai_config.personality_anti_retrieve_count` 控制（預設 10）
- 補充結果與主查詢結果合併後進入後續 pipeline 階段

用戶無 `personality_type` 時 SHALL 跳過補充檢索。

#### Scenario: Power 型用戶查詢路線

- **WHEN** PGB 碎岩者用戶問「推薦龍洞的路線」
- **THEN** 主檢索拿回 ~40 條龍洞路線，補充檢索額外拿回 ~10 條龍洞 slab/technique 路線，合併為 ~50 條候選

#### Scenario: 無人格類型用戶

- **WHEN** 未測驗用戶查詢路線
- **THEN** 不執行補充檢索，行為與現有完全一致

#### Scenario: 補充檢索無結果

- **WHEN** 補充檢索在該岩場找不到反風格路線
- **THEN** 候選池僅包含主檢索結果，pipeline 正常繼續

### Requirement: Personality Rerank Pipeline 階段

系統 SHALL 在現有 pipeline 的 Popularity Rerank 之後、Personalization 之前，新增 Personality Rerank 階段。

計分邏輯：
1. 判斷每條路線的風格傾向（style_signal 0-1，基於路線標籤/描述關鍵字）
2. 與用戶人格的 Body 軸比對，計算 style_match（0=反風格，0.5=中性，1=順風格）
3. 根據 `personality_mode` 計算 personality_score：
   - `balanced`（預設）：`pScore = style_match × 0.6 + (1 - style_match) × 0.4`
   - `anti_style`：`pScore = (1 - style_match) × 0.7 + style_match × 0.3`
4. 混合進 pipeline：`finalScore = prevScore × (1 - personality_weight) + pScore × personality_weight`

用戶無 `personality_type` 時 SHALL 跳過此階段，prevScore 直接傳遞。

#### Scenario: 碎岩者的路線排序調整

- **WHEN** PGB 用戶的候選池中有 overhang 路線（style_match=1.0）和 slab 路線（style_match=0.0）
- **THEN** balanced 模式下 slab 路線的 pScore = 0.4，overhang 的 pScore = 0.6，slab 路線不會被排到最後

#### Scenario: anti_style 模式

- **WHEN** 管理員將 `personality_mode` 設為 `anti_style`
- **THEN** 反風格路線的 pScore (0.7) 高於順風格 (0.3)，推薦結果以反風格為主

#### Scenario: personality_weight 為 0

- **WHEN** `ai_config.personality_weight` 設為 0
- **THEN** personality rerank 階段不影響任何分數，等同關閉

### Requirement: ai_config 動態參數

系統 SHALL 在 `ai_config` 表新增以下可調參數：

| 參數 | 預設值 | 說明 |
|------|--------|------|
| `personality_weight` | 0.15 | personality rerank 在最終分數中的權重 |
| `personality_mode` | 'balanced' | 'balanced' 或 'anti_style' |
| `personality_anti_ratio` | 0.4 | balanced 模式下反風格的基礎分數 |
| `personality_anti_retrieve_count` | 10 | 反風格補充檢索的最大數量 |

#### Scenario: A/B 測試權重

- **WHEN** 管理員修改 `personality_weight` 從 0.15 到 0.3
- **THEN** 下次推薦請求即生效，不需重啟或部署

### Requirement: user_profile tool 加入性格類型

`user_profile` tool SHALL 在 SQL 查詢中加入 `users.personality_type`，並在 formatResult 中輸出性格名稱。

#### Scenario: 已測驗用戶的 profile

- **WHEN** react-agent 呼叫 user_profile tool，用戶 personality_type = 'PGB'
- **THEN** 回傳包含「攀岩性格：碎岩者（PGB）— 力量型、目標型、大膽型」

#### Scenario: 未測驗用戶的 profile

- **WHEN** 用戶 personality_type 為 NULL
- **THEN** 回傳不包含性格欄位，行為與現有一致

### Requirement: System Prompt 輕微調整

react-agent system prompt SHALL 加入一段簡短指引（< 100 tokens），告知 LLM 推薦結果中標記為 `[反風格]` 的路線可以用正面語氣介紹（「拓展你的能力」而非「補強弱點」）。

#### Scenario: LLM 回答包含反風格路線

- **WHEN** LLM 拿到的推薦結果中有 `[反風格:技巧訓練]` 標籤的路線
- **THEN** LLM 在回答中以正面語氣介紹該路線，不使用「弱點」「不擅長」等負面詞彙
