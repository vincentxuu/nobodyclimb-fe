## ADDED Requirements

### Requirement: Groundedness 自動評分
系統 SHALL 在每次 RAG 回答生成後，使用輕量 LLM（`@cf/meta/llama-3.1-8b-instruct`）作為 judge，評估回答是否有充分依據於檢索到的來源文件，並回傳 0.0–1.0 的評分。Judge 輸入包含：原始查詢、retrieved context（前 800 字元）、LLM 生成的回答。Judge MUST 在 3 秒內完成，超時時 groundedness_score 記錄為 null，主回答正常返回。Judge MUST 以 JSON 格式輸出 `{ "groundedness": <float> }`。

#### Scenario: 高 groundedness 回答
- **WHEN** LLM 回答的所有主要陳述都明確引用了 retrieved context 中的資料
- **THEN** judge 回傳 `groundedness >= 0.8`，回答不加入免責聲明

#### Scenario: 中等 groundedness 回答
- **WHEN** LLM 回答部分基於 retrieved context，但有推斷性內容
- **THEN** judge 回傳 `0.6 <= groundedness < 0.8`，回答加入「⚠️ 部分資訊來自推斷，建議實地確認」前綴聲明

#### Scenario: 低 groundedness 回答
- **WHEN** LLM 回答大量偏離 retrieved context（可能為幻覺）
- **THEN** judge 回傳 `groundedness < 0.6`，回答加入「❓ 以下資訊基於現有資料推斷，建議實地確認」前綴聲明

#### Scenario: Judge 超時
- **WHEN** judge LLM 呼叫超過 3 秒
- **THEN** groundedness_score 記錄為 null，主回答不加免責聲明，查詢正常返回

#### Scenario: Judge 回傳格式錯誤
- **WHEN** judge LLM 回傳非 JSON 或缺少 groundedness 欄位
- **THEN** groundedness_score 記錄為 null，主回答不加免責聲明

### Requirement: 低分自動標記
系統 SHALL 在 groundedness_score < 0.5 時，自動向 `ai_flagged_responses` 資料表新增一筆標記記錄，供管理員人工審核。

#### Scenario: 低 groundedness 觸發標記
- **WHEN** groundedness_score 計算完成且分數 < 0.5
- **THEN** 系統向 ai_flagged_responses 新增記錄，flag_reason = `low_groundedness`，is_reviewed = false

#### Scenario: 高 groundedness 不觸發標記
- **WHEN** groundedness_score >= 0.5
- **THEN** 系統不向 ai_flagged_responses 新增記錄

#### Scenario: 重複查詢不重複標記
- **WHEN** 同一 query_log_id 的 groundedness_score 已存在標記
- **THEN** 系統不再新增重複的 low_groundedness 標記（使用 INSERT OR IGNORE）

### Requirement: Groundedness 分數記錄
系統 SHALL 將 groundedness_score 寫入 `ai_query_logs.groundedness_score` 欄位（REAL 型別，nullable）。

#### Scenario: 評分成功記錄
- **WHEN** judge 成功回傳有效分數
- **THEN** ai_query_logs 的 groundedness_score 欄位更新為該分數（0.0–1.0）

#### Scenario: 評分失敗仍記錄
- **WHEN** judge 超時或格式錯誤
- **THEN** ai_query_logs 的 groundedness_score 欄位保持 null，不影響主記錄
