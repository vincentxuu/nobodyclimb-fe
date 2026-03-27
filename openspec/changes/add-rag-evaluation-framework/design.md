## Context

本專案 RAG 系統已建構 14 步驟 Modular Pipeline、5 個檢索工具、Self-RAG loopBack、LLM Judge（groundedness + quality）等完整元件，但缺乏量化評估能力。目前改動效果僅靠人工測試幾個查詢判斷，無法追蹤品質趨勢或防止退步。

**現有基礎設施可利用**：
- `QueryService.ask()` 可直接呼叫（不需走 HTTP），回傳 `AIAskResponse`（answer、sources、query_id）
- `ai_query_logs.pipeline_trace` 記錄完整 JSON trace（tool_selection、scores、latency、token breakdown）
- LLM Judge 已產出 `groundedness`（0-1）和 `quality`（1-4）
- `checkInput()` / `checkOutput()` 可獨立測試
- CI/CD 已有 preview 部署流程（`deploy-api.yml`）

## Goals / Non-Goals

**Goals:**
- 建立可重複執行的離線評估流程，量化 RAG 品質
- 定義品質門檻，防止改動造成退步
- 自動化紅隊測試，持續驗證 Guardrails 有效性
- CI/CD 整合，preview 部署後自動跑品質檢查

**Non-Goals:**
- 線上即時評估（現有 Judge 已處理）
- 前端評估 Dashboard（可用終端報告和 CI artifact）
- RAGAS 框架整合（自建更貼合本專案架構）
- 評估框架的 Admin UI 管理介面

## Decisions

### 決策 1：評估腳本直接呼叫 API 端點，非 Service 層

**選擇**：透過 HTTP 呼叫 `POST /api/v1/ai/ask` 端點

**替代方案**：直接 import `QueryService.ask()` 在 Node.js 中執行

**理由**：
- 評估需測試完整路徑（包含 route handler 的 guardrails、quota 邏輯）
- 可針對 preview 或 production 環境執行，不需本地 D1/Vectorize/Workers AI 綁定
- 評估腳本可獨立於 backend 程式碼執行（CI/CD 中部署後跑）
- 缺點是需要有效的 auth token，用管理員帳號的 JWT 解決

### 決策 2：測試集使用 JSON 檔案，非資料庫

**選擇**：`backend/tests/golden-test-set.json` 和 `red-team-test-set.json`

**替代方案**：存入 D1 資料表管理

**理由**：
- 測試集需版本控制（Git 追蹤變更歷史）
- 不需動態更新（由開發者手動維護）
- JSON 易於 code review 和 PR 審查
- CI/CD 中直接讀取，無需資料庫連線

### 決策 3：Faithfulness 指標復用現有 Judge

**選擇**：使用現有 `pipeline_trace` 中的 `groundedness` 分數作為 Faithfulness 指標

**替代方案**：獨立跑 RAGAS Faithfulness 評估（額外 LLM 呼叫）

**理由**：
- Judge 已在 pipeline 中運行，`groundedness`（0-1 分數）語意等同 Faithfulness
- 避免額外 LLM 呼叫成本和延遲
- 可從 `ai_query_logs.groundedness_score` 或 `pipeline_trace` 取得
- 若未來需更精確的 Faithfulness，可獨立新增而不影響現有指標

### 決策 4：評估腳本使用 TypeScript（tsx）

**選擇**：`backend/scripts/evaluate-rag.ts`，用 `tsx` 執行

**理由**：
- 與後端相同語言，共用型別定義（`AIAskResponse`、`AISource`）
- 專案已有 `tsx` 依賴（用於其他腳本）
- 可直接 import `@nobodyclimb/types` 共用型別

### 決策 5：CI/CD 評估跑子集而非完整測試集

**選擇**：preview 部署後跑 ~50 筆關鍵子集，完整評估手動觸發

**理由**：
- 完整 200+ 筆在 Workers AI 上耗時過長（每筆 2-5s → 7-17 分鐘）
- preview 環境只需快速 smoke test 確認無重大退步
- 完整評估作為獨立 workflow 手動或定期觸發
- 子集標記為 `"ci": true` 在 JSON 中篩選

### 決策 6：品質門檻數值設定

**選擇**：Tool Accuracy >= 0.95、Faithfulness >= 0.8、Answer Relevancy >= 0.8、Filter Accuracy >= 0.85、Error Rate（1 - error_rate）>= 0.95

**來源**：參考 `11-rag-improvement-tasks.md` B3 段落的業界標準：

| 指標 | 門檻 | 來源與理由 |
|------|------|-----------|
| Tool Accuracy >= 0.95 | 內部標準，本專案工具選擇為確定性流程（LLM 分類 5 種工具），應維持高準確率 |
| Faithfulness >= 0.8 | RAGAS 建議值，與現有 Judge groundedness 語意一致 |
| Answer Relevancy >= 0.8 | RAGAS 建議值，用關鍵字覆蓋率近似 |
| Filter Accuracy >= 0.85 | 內部標準，過濾條件解析涉及 NLP 模糊匹配，容許些許誤差 |
| Error Rate >= 0.95 | 即容許最多 5% 的 API 錯誤率，涵蓋超時和異常情況 |

**替代方案**：首次跑完評估後依據實際數據調整門檻（門檻值存於 `baseline-metrics.json`，可隨時更新）

### 決策 7：CI/CD 整合方式

**選擇**：新增獨立 workflow `evaluate-rag.yml`，由 `deploy-api.yml` 透過 `workflow_call` 觸發

**具體方案**：
1. `deploy-api.yml` 在 preview 部署 + migrations 完成後，新增 job 呼叫 `evaluate-rag.yml`
2. `evaluate-rag.yml` 同時支援 `workflow_dispatch`（手動觸發完整評估）和 `workflow_call`（被其他 workflow 呼叫）
3. 被 `deploy-api.yml` 呼叫時自動帶入 `--ci` 旗標，只跑 50 筆子集
4. 評估 job 使用 `continue-on-error: true`，失敗不阻擋部署
5. JWT token 從 GitHub Secrets 取得（`EVAL_JWT_TOKEN`），指向管理員帳號

## Pipeline Trace 欄位依賴分析

評估指標依賴以下 `pipeline_trace` 欄位，已確認均為現有系統穩定輸出：

| 評估指標 | 依賴欄位 | 來源 | 備註 |
|---------|---------|------|------|
| Tool Accuracy | `trace.query_parsing.tool` | `pipeline/steps/tool-selection.ts` | 工具名稱字串 |
| Faithfulness | `quality.groundedness_score`（admin log 欄位）或 `trace.judge.groundedness` | `pipeline/steps/judge.ts` | 0.0-1.0 浮點數，Judge 超時時為 null |
| Filter Accuracy | `trace.filter.applied`（含 location、grade_gte、grade_lte、type） | `pipeline/steps/filter-build.ts` | 物件結構，各欄位可為 null |
| Answer Relevancy | API 回應的 `answer` 文字 | `AIAskResponse.answer` | 不依賴 trace |
| Error Rate | HTTP 狀態碼 | route handler | 不依賴 trace |

**取得方式**：評估腳本透過 HTTP 呼叫 API 時，`pipeline_trace` 不在標準 `/ai/ask` 回應中返回。需透過以下方式取得：
- **選擇方案 A**：呼叫後查詢 `GET /api/v1/admin/ai/logs/:id`（已存在的端點，回應中的 `query_id` 即為 log ID）。此端點返回完整 `pipeline_trace` JSON、`quality`（groundedness_score、auto_score）、`sources` 等所有評估所需資料
- 方案 B：在 `/ai/ask` 回應中新增 `trace` 欄位（僅管理員 token 時返回）— 不採用，避免修改現有 API

**AISource.id 可用性**：`AISource` 介面包含 `id: string` 欄位（`backend/src/types.ts:134`），可用於 Recall@5 的 `expected_source_ids` 比對

## Risks / Trade-offs

**[風險] Workers AI 速率限制** → 評估腳本加入請求間隔（預設 1s），支援 `--delay` 參數調整。批次大小可配置。

**[風險] 黃金測試集的 ground truth 品質** → 初期由開發者手動編寫，需對攀岩領域有足夠了解。可從 `ai_query_logs` 高評分查詢提取種子資料。Ground truth 不要求完美匹配，用關鍵字覆蓋率（而非精確字串比對）。

**[風險] 評估環境與 production 資料不一致** → preview 環境的 D1 和 Vectorize 資料可能與 production 不同步，影響評估結果的代表性。建議定期同步或標明評估環境。

**[風險] 紅隊測試的攻擊模式過時** → 定期更新攻擊模式（隨業界新發現），在測試集中標記版本號。

**[取捨] 評估精度 vs 執行速度** → 子集模式犧牲覆蓋率換取速度。透過精選 CI 子集（覆蓋所有查詢類型和工具）減輕影響。
