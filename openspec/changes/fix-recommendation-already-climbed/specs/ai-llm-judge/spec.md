## MODIFIED Requirements

### Requirement: 品質自動評分
系統 SHALL 在同一次 judge LLM 呼叫中（與 groundedness 合併），對每個 RAG 回答進行品質評估。評估維度包含：相關性（回答是否直接回應了問題）、完整性（資訊是否充分）、格式正確性（是否符合繁體中文與 Markdown 規則），以及**約束滿足度**（若問題有明確排除條件，回答是否違反）。Judge MUST 以 JSON 格式輸出 `{ "groundedness": <float>, "quality": <int>, "constraint_ok": <bool> }`。

當 `constraint_ok = false` 時，`quality` MUST 強制為 1，無論其他維度分數為何。

#### Scenario: 高品質且滿足約束的回答
- **WHEN** 回答直接且完整回應了問題，格式正確，且未違反問題中的排除條件
- **THEN** judge 回傳 `{"groundedness": 1.0, "quality": 4, "constraint_ok": true}`

#### Scenario: 推薦了已完攀路線（約束違反）
- **WHEN** 問題包含「尚未爬過」等排除條件，回答中出現問題前文列出的已完攀路線名稱
- **THEN** judge 回傳 `constraint_ok = false`，且 `quality` 強制為 1，無論 groundedness 多高

#### Scenario: 問題無明確排除條件
- **WHEN** 問題不包含「尚未爬過」「未爬過」等排除關鍵詞
- **THEN** judge 回傳 `constraint_ok = true`（預設），quality 依原有維度評分

#### Scenario: Judge 解析失敗或缺少 constraint_ok 欄位
- **WHEN** judge LLM 回傳的 JSON 中缺少 `constraint_ok` 欄位，或解析失敗
- **THEN** `constraint_ok` 預設為 `true`，不影響 groundedness 和 quality 的現有記錄邏輯

#### Scenario: 普通品質回答
- **WHEN** 回答大致相關但有部分不足或格式小問題，且 constraint_ok = true
- **THEN** judge 回傳 `quality = 2` 或 `quality = 3`

#### Scenario: 低品質回答
- **WHEN** 回答不相關、嚴重不完整或格式錯誤，且 constraint_ok = true
- **THEN** judge 回傳 `quality = 1`

#### Scenario: Judge 呼叫失敗
- **WHEN** judge LLM 呼叫超時或格式錯誤
- **THEN** auto_score 記錄為 null，constraint_ok 記錄為 null，不影響主回答返回
