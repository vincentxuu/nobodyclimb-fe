## ADDED Requirements

### Requirement: 黃金測試資料集結構
系統 SHALL 維護一份 JSON 格式的黃金測試資料集（`backend/tests/golden-test-set.json`），每筆測試案例 SHALL 包含以下欄位：`id`（唯一識別碼，格式 GT-NNN）、`query`（測試查詢文字）、`category`（分類：simple / complex / general-knowledge / edge-case）、`expected_tool`（預期選用的工具名稱）、`expected_answer_keywords`（預期回答應包含的關鍵字陣列）、`ci`（布林值，標記是否納入 CI 子集）。可選欄位：`expected_filters`（預期解析的過濾條件）、`expected_min_results`（預期最少檢索結果數）、`expected_source_ids`（預期檢索結果應包含的文件 ID 陣列，用於 Recall@K 計算）、`ground_truth_answer`（完整參考答案）。

#### Scenario: 測試集包含四種查詢類別
- **WHEN** 讀取黃金測試資料集
- **THEN** SHALL 包含至少 80 筆 simple 類、80 筆 complex 類、30 筆 general-knowledge 類、10 筆 edge-case 類，合計至少 200 筆

#### Scenario: 每筆測試案例 ID 唯一
- **WHEN** 驗證測試資料集完整性
- **THEN** 所有 `id` 欄位 SHALL 唯一，無重複

#### Scenario: CI 子集涵蓋所有類別
- **WHEN** 篩選 `ci: true` 的測試案例
- **THEN** SHALL 包含至少 50 筆，且四種 category 各至少有 5 筆

#### Scenario: 每筆案例包含預期工具
- **WHEN** 讀取任一測試案例
- **THEN** `expected_tool` SHALL 為有效工具名稱之一：search_routes / search_crags / general_knowledge / search_sql / hybrid

#### Scenario: edge-case 類別包含幻覺誘導案例
- **WHEN** 讀取 `category: "edge-case"` 的測試案例
- **THEN** SHALL 包含至少 3 筆幻覺誘導案例（查詢不存在的岩場、虛構路線、矛盾條件），其 `expected_answer_keywords` SHALL 包含不確定性關鍵字（如「沒有找到」、「不確定」、「無法確認」、「建議確認」）

---

### Requirement: 離線批次評估腳本
系統 SHALL 提供評估腳本（`backend/scripts/evaluate-rag.ts`），能讀取黃金測試資料集、逐筆呼叫 `POST /api/v1/ai/ask` 端點、收集回應與 pipeline trace、計算品質指標、輸出評估報告。腳本 SHALL 支援命令列參數：`--api-url`（API 位址）、`--token`（JWT 認證 token）、`--category`（只跑指定類別）、`--ci`（只跑 CI 子集）、`--delay`（請求間隔毫秒數，預設 1000）、`--output`（報告輸出路徑）。

#### Scenario: 執行完整評估
- **WHEN** 執行 `tsx backend/scripts/evaluate-rag.ts --api-url https://api.nobodyclimb.cc --token <jwt>`
- **THEN** 腳本 SHALL 逐筆執行所有測試案例，每筆之間等待 `--delay` 毫秒，完成後輸出 JSON 報告和終端摘要

#### Scenario: 執行 CI 子集
- **WHEN** 執行帶 `--ci` 旗標的評估
- **THEN** 腳本 SHALL 僅執行 `ci: true` 的測試案例

#### Scenario: 篩選特定類別
- **WHEN** 執行帶 `--category simple` 的評估
- **THEN** 腳本 SHALL 僅執行 `category: "simple"` 的測試案例

#### Scenario: API 呼叫失敗時繼續
- **WHEN** 某筆測試案例的 API 呼叫返回錯誤（非 200 狀態碼）
- **THEN** 腳本 SHALL 記錄該筆為失敗（`status: "error"`），繼續執行後續案例，不中斷整體評估

#### Scenario: 連續失敗自動中斷
- **WHEN** 連續 10 筆測試案例的 API 呼叫均返回錯誤（非 200 狀態碼）
- **THEN** 腳本 SHALL 自動中斷執行，輸出已完成部分的報告，終端顯示「連續失敗過多，疑似 API 不可用」警告，退出碼為 2

#### Scenario: 請求間隔防止速率限制
- **WHEN** 連續執行測試案例
- **THEN** 每筆請求之間 SHALL 等待至少 `--delay` 毫秒（預設 1000ms）

---

### Requirement: 品質指標計算
評估腳本 SHALL 計算以下六大品質指標，每項指標 SHALL 為 0.0-1.0 範圍的浮點數：

1. **Tool Accuracy**：`expected_tool` 與實際 `pipeline_trace.tool_selection.tool` 的匹配率
2. **Faithfulness**：所有測試案例的 `groundedness_score` 平均值（從 pipeline trace 取得，語意等同 RAGAS Faithfulness）
3. **Answer Relevancy**：回答包含 `expected_answer_keywords` 的覆蓋率（命中關鍵字數 / 總關鍵字數，取所有案例平均）
4. **Recall@5**：檢索結果的前 5 筆是否包含預期文件（`expected_source_ids` 中命中的比例），僅計算有 `expected_source_ids` 的案例
5. **Filter Accuracy**：`expected_filters` 與實際 `pipeline_trace.filters` 的欄位匹配率（僅計算有 `expected_filters` 的案例）。匹配規則：`location` 精確匹配（字串相等）、`grade` 範圍匹配（grade_gte/grade_lte 各自比對）、`type` 精確匹配。每個欄位等權重，單筆得分 = 匹配欄位數 / 預期欄位數
6. **Success Rate**：API 呼叫成功且返回非空答案的比例（1 - error_rate，越高越好）

#### Scenario: 計算 Tool Accuracy
- **WHEN** 10 筆測試案例中有 9 筆的 `expected_tool` 與實際工具選擇一致
- **THEN** Tool Accuracy SHALL 為 0.9

#### Scenario: 計算 Answer Relevancy
- **WHEN** 某筆案例的 `expected_answer_keywords` 為 ["龍洞", "5.10", "路線"] 且回答包含 "龍洞" 和 "路線" 但不含 "5.10"
- **THEN** 該筆的 keyword 覆蓋率 SHALL 為 2/3 ≈ 0.667

#### Scenario: 計算 Recall@5
- **WHEN** 某筆案例的 `expected_source_ids` 為 ["doc-1", "doc-3"] 且實際檢索結果前 5 筆的 source_id 包含 "doc-1" 但不含 "doc-3"
- **THEN** 該筆的 Recall@5 SHALL 為 1/2 = 0.5

#### Scenario: 無 expected_source_ids 的案例不計入 Recall@5
- **WHEN** 某筆案例無 `expected_source_ids` 欄位
- **THEN** 該筆 SHALL 不納入 Recall@5 的計算分母

#### Scenario: 計算 Filter Accuracy 的欄位匹配
- **WHEN** 某筆案例的 `expected_filters` 為 `{ "location": "龍洞", "grade_gte": "5.10a" }` 且實際 filters 為 `{ "location": "龍洞", "grade_gte": "5.10b" }`
- **THEN** location 精確匹配（pass）、grade_gte 不匹配（fail），該筆 Filter Accuracy SHALL 為 1/2 = 0.5

#### Scenario: 無 expected_filters 的案例不計入 Filter Accuracy
- **WHEN** 某筆案例無 `expected_filters` 欄位
- **THEN** 該筆 SHALL 不納入 Filter Accuracy 的計算分母

#### Scenario: groundedness_score 為 null 的案例
- **WHEN** 某筆案例的 pipeline trace 中 `groundedness_score` 為 null（Judge 超時或跳過）
- **THEN** 該筆 SHALL 不納入 Faithfulness 的計算分母

---

### Requirement: 評估報告輸出
評估腳本 SHALL 輸出兩種格式的報告：

1. **JSON 報告**（寫入 `--output` 指定路徑，預設 `backend/tests/evaluation-report.json`）：包含所有指標數值、每筆案例的詳細結果、執行上下文（git commit、環境、測試集版本）
2. **終端摘要**：顯示六大指標數值、與基線的對比（pass/fail）、失敗案例清單

#### Scenario: JSON 報告結構
- **WHEN** 評估完成後生成 JSON 報告
- **THEN** 報告 SHALL 包含 `metrics`（六大指標）、`results`（每筆案例詳細結果陣列）、`summary`（通過/失敗計數）、`executed_at`（ISO 時間戳）、`api_url`（測試端點）、`test_set_count`（執行筆數）、`context`（包含 `git_commit`、`git_branch`、`environment` 執行上下文資訊）

#### Scenario: 終端摘要顯示 pass/fail
- **WHEN** 評估完成後輸出終端摘要
- **THEN** 每項指標 SHALL 顯示數值和 pass/fail 狀態（對比品質門檻），整體結果為全部 pass 或有 fail。六大指標為：Tool Accuracy、Faithfulness、Answer Relevancy、Recall@5、Filter Accuracy、Success Rate

#### Scenario: 失敗案例詳細資訊
- **WHEN** 某筆案例的 Tool Accuracy 或 Answer Relevancy 未達標
- **THEN** 終端摘要 SHALL 列出該案例的 id、query、預期值與實際值

---

### Requirement: 品質門檻與基線管理
系統 SHALL 維護品質門檻設定於 `backend/tests/baseline-metrics.json`，包含每項指標的最低門檻值。評估腳本 SHALL 將實際指標與門檻比較，判定 pass/fail。

#### Scenario: 預設品質門檻
- **WHEN** 首次建立 `baseline-metrics.json`
- **THEN** SHALL 包含以下預設門檻：Tool Accuracy >= 0.95、Faithfulness >= 0.8、Answer Relevancy >= 0.8、Recall@5 >= 0.85、Filter Accuracy >= 0.85、Success Rate >= 0.95

#### Scenario: 指標低於門檻判定為 fail
- **WHEN** 某項指標的實際值低於對應門檻
- **THEN** 該指標 SHALL 判定為 fail，終端摘要以紅色標記

#### Scenario: 所有指標通過
- **WHEN** 所有指標的實際值均達到或超過門檻
- **THEN** 整體評估結果 SHALL 為 pass，腳本退出碼為 0

#### Scenario: 任一指標未通過
- **WHEN** 至少一項指標未達門檻
- **THEN** 整體評估結果 SHALL 為 fail，腳本退出碼為 1

---

### Requirement: CI/CD 自動化評估整合
系統 SHALL 提供 GitHub Actions workflow（`.github/workflows/evaluate-rag.yml`），支援手動觸發完整評估和 preview 部署後自動跑 CI 子集。

#### Scenario: 手動觸發完整評估
- **WHEN** 透過 GitHub Actions 手動觸發 `evaluate-rag.yml`（workflow_dispatch）
- **THEN** SHALL 對指定環境執行完整黃金測試集（所有案例），將 JSON 報告上傳為 workflow artifact

#### Scenario: preview 部署後自動評估
- **WHEN** `deploy-api.yml` 部署到 preview 環境完成
- **THEN** SHALL 自動觸發 CI 子集評估（`--ci` 旗標），品質未達門檻時在 workflow 中標記警告（不阻擋部署）

#### Scenario: 評估結果輸出為 artifact
- **WHEN** CI/CD 評估完成
- **THEN** JSON 報告 SHALL 上傳為 GitHub Actions artifact，保留 30 天

#### Scenario: 評估失敗不阻擋部署
- **WHEN** CI 子集評估中有指標未達門檻
- **THEN** workflow SHALL 標記為警告狀態（非失敗），不阻擋 preview 部署流程

---

### Requirement: 評估對比模式
評估腳本 SHALL 支援 `--baseline` 參數，載入先前的評估報告作為對比基線，顯示每項指標的變化趨勢（↑ 改善 / ↓ 退步 / → 持平）。

#### Scenario: 與基線對比
- **WHEN** 執行帶 `--baseline backend/tests/previous-report.json` 的評估
- **THEN** 終端摘要 SHALL 顯示每項指標的當前值、基線值、差異值和趨勢箭頭

#### Scenario: 無基線時跳過對比
- **WHEN** 執行評估但未提供 `--baseline` 參數
- **THEN** 腳本 SHALL 正常輸出指標，不顯示對比資訊
