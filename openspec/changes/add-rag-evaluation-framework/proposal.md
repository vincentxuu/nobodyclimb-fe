## Why

本專案 RAG 系統已達業界 Advanced + Modular + Agentic 水準（14 步驟 Pipeline、5 個工具、Self-RAG loopBack），但**完全缺乏系統性評估框架**。目前所有 prompt 調整、config 變更、模型更換都是「盲飛」——無法量化改動是改善還是退步。差距分析標記此為🔴最高優先度缺口，業界 60% 的 RAG 從第一天就納入系統性評估。

## What Changes

- 建立**黃金測試資料集**（200+ 筆），涵蓋 simple / complex / general-knowledge / 邊界情況四類，每筆包含預期工具、過濾條件、關鍵字、ground truth 答案
- 實作**離線批次評估腳本**，計算 Tool Accuracy、Faithfulness、Answer Relevancy、Recall@5、Filter Accuracy、Success Rate 六大指標
- 定義**品質門檻與基線數據**，建立可量化的品質閘門（Recall@5 >= 0.85、Faithfulness >= 0.8、Tool Accuracy >= 0.95）
- 建立**紅隊測試集**（~40 筆），系統性測試 Prompt Injection、資料洩露、越權操作、Jailbreak 等攻擊的 Guardrails 攔截率
- 整合 **CI/CD 自動化評估**，preview 部署後自動跑關鍵子集，結果輸出為 PR comment 或 artifact

## Capabilities

### New Capabilities
- `rag-evaluation-framework`: RAG 系統品質評估框架，包含黃金測試集結構定義（含幻覺誘導 edge-case）、離線評估腳本、品質指標計算（Tool Accuracy / Faithfulness / Answer Relevancy / Recall@5 / Filter Accuracy / Success Rate）、品質門檻與基線管理、評估報告生成
- `rag-red-team-testing`: RAG 安全對抗測試，包含紅隊測試集結構定義、雙層安全判定（Guardrails 攔截 + 安全拒答）、攻擊模式分類（Prompt Injection / 資料洩露 / 越權操作 / Jailbreak）

### Modified Capabilities
（無需修改現有 spec 層級的行為——評估框架消費現有 API 和 trace 資料，不改變其規格）

## Impact

- **新增檔案**：
  - `backend/tests/golden-test-set.json` — 黃金測試資料集
  - `backend/tests/red-team-test-set.json` — 紅隊測試集
  - `backend/tests/baseline-metrics.json` — 基線數據
  - `backend/scripts/evaluate-rag.ts` — 離線評估腳本
  - `.github/workflows/evaluate-rag.yml` — CI/CD 評估 workflow
- **依賴的現有系統**：
  - `/api/v1/ai/ask` 端點（或直接呼叫 `QueryService.ask()`）
  - `ai_query_logs` 的 pipeline_trace JSON（取得 tool_selection、scores 等）
  - LLM Judge 現有基礎（groundedness + quality 評分）
  - Input/Output Guardrails（`checkInput` / `checkOutput`）
- **不影響**：現有 API 行為、前端、資料庫 schema（純新增評估工具）
