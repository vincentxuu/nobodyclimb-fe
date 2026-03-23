## 1. Pipeline 基礎架構

- [x] 1.1 建立 `backend/src/services/pipeline/` 目錄結構（types.ts、context.ts、registry.ts、engine.ts、steps/）
- [x] 1.2 定義 `PipelineStep` 介面（含 `skipWhen?: SkipCondition[]`）、`PipelineContext` 介面（含 `loopCount`、`loopBack`、`branchResults`）、`SkipCondition` 型別、`BranchConfig` 型別（types.ts）
- [x] 1.3 實作 `createPipelineContext()` factory 函式（context.ts），從 QueryService.ask() 參數建立初始 context（含 queryService 實例、pipelineConfig、prompts、個人化資料等）
- [x] 1.4 實作 step 註冊表 registry.ts：匯出 13 個 step 的 metadata 陣列（id、name、description、phase、defaultEnabled、defaultOrder、requires、provides、skipWhen），提供 `getStepById()` 查詢方法
- [x] 1.5 實作 `PipelineEngine` 類別（engine.ts）：載入 pipeline_steps 設定（從 ai_config JSON）、依賴驗證、KV 快取前置檢查/後置寫入、按 phase+order 排序依序執行已啟用 step、skipWhen 條件評估、earlyReturn 檢查、loopBack 迴圈控制、分支並行執行與融合、step 執行時間 trace 記錄、post-pipeline 後處理（logQuery 寫入日誌、flagResponse 低分標記、語義快取 waitUntil 寫入、串流模式異步 Judge waitUntil、memory extraction waitUntil）

## 2. Pipeline Steps 實作（Pre-retrieval Phase）

- [x] 2.1 實作 `semantic-cache` step：從現有 `ask()` 中提取語義快取檢查邏輯，命中時設定 `ctx.earlyReturn`
- [x] 2.2 實作 `tool-selection` step：從現有 `ask()` 中提取 Stage 1a（預載 crags/areas）+ Stage 1b（parseQueryWithLLM）邏輯，設定 `ctx.queryType`、`ctx.parsedQuery`、`ctx.effectiveLlmModel`；包含 similar route 意圖偵測（hasSimilarRouteIntent）
- [x] 2.3 實作 `hyde` step：從現有 `ask()` 中提取 HyDE 生成邏輯；GK 跳過由 engine skipWhen 處理，step 內部保留 simple query 和 agentic 模式的業務邏輯跳過
- [x] 2.4 實作 `multi-query` step：從現有 `ask()` 中提取 Multi-Query Expansion 邏輯；GK 跳過由 engine skipWhen 處理，step 內部保留 non-complex 和 agentic 模式的業務邏輯跳過
- [x] 2.5 實作 `filter-build` step：從現有 `ask()` 中提取 Stage 2 filter 建構邏輯（buildFiltersFromParsed、extractGradeFilter 保底、extractLocationFilter 多岩場、對話歷史補充位置、similar route filter）；GK 跳過由 engine skipWhen 處理

## 3. Pipeline Steps 實作（Retrieval Phase）

- [x] 3.1 實作 `embedding` step：從現有 `ask()` 中提取 Stage 3 embedding 邏輯，內部 Promise.all 並行 embed(query) + embed(hydeDoc) + embedBatch(expandedQueries)，復用 earlyQueryVector；GK 跳過由 engine skipWhen 處理
- [x] 3.2 實作 `hybrid-search` step：從現有 `ask()` 中提取 Stage 4-5 邏輯，內部 Promise.all 並行 Vectorize 搜尋（query + hyde + expanded）+ BM25 搜尋 → RRF 合併 → 低分過濾 → CRAG fallback → getDocuments；包含 agentic 模式分支（agenticRetrieve）和 similar route fallback；GK 跳過由 engine skipWhen 處理

## 4. Pipeline Steps 實作（Post-retrieval Phase）

- [x] 4.1 實作 `cross-encoder` step：從現有 `ask()` 中提取 cross-encoder reranking 邏輯（bge-reranker-base）；GK 跳過由 engine skipWhen 處理，step 內部保留候選數 ≤ 1 的業務邏輯跳過
- [x] 4.2 實作 `mmr` step：從現有 `ask()` 中提取 applyMMR 邏輯，使用 pipelineCfg.mmr_lambda 與 effectiveLimit；GK 跳過由 engine skipWhen 處理
- [x] 4.3 實作 `popularity-rerank` step：從現有 `ask()` 中提取熱門度加權排序邏輯（影片數量查詢、combined score 計算）、組合 sources 陣列、建立 context 文字；GK 跳過由 engine skipWhen 處理

## 5. Pipeline Steps 實作（Generation + Evaluation Phase）

- [x] 5.1 實作 `llm-generation` step：從現有 `ask()` 中提取 Stage 6 LLM 生成邏輯（含串流模式 streamLLMGeneration、parseSuggestedQuestions、injectRouteLinks）；queryType 為 general-knowledge 時走 GK 通識路徑（直接 LLM 呼叫 + checkOutput + 設定 earlyReturn）
- [x] 5.2 實作 `judge` step（evaluation phase, order 11）：從現有 `ask()` 中提取第一次 Judge 評估邏輯（同步 runJudge → 設定 ctx.groundedness 和 ctx.quality），非串流模式下注入免責聲明前綴（依 groundedness 閾值）、執行 outputGuardrails（checkOutput）；GK 跳過由 engine skipWhen 處理
- [x] 5.3 實作 `self-reflection` step（evaluation phase, order 12，依賴 judge 的 quality 輸出）：從現有 `ask()` 中提取 Judge 驅動重生成邏輯（ctx.quality 低於 judge_regen_quality_max 門檻時重試 LLM 生成 + 第二次 runJudge 比較 groundedness 取較高者 + 重新注入免責聲明）；GK 跳過由 engine skipWhen 處理；新增 loopBack 觸發：groundedness < 0.5 且 loopCount === 0 時回跳 retrieval phase

## 6. QueryService 重構

- [x] 6.1 修改 `QueryService.ask()` 方法：建立 PipelineContext（含 this 作為 queryService） → 呼叫 PipelineEngine.run() → engine 內部完成所有 step 執行與 post-pipeline 後處理（logQuery、KV 快取、waitUntil 等） → 回傳 ctx.earlyReturn 或從 ctx 組合 AIAskResponse
- [x] 6.2 確認 QueryService 保留所有工具方法（extractGradeFilter、extractLocationFilter、extractTypeFilter、getDocuments、buildUrl、buildExcerpt、extractTitle、injectRouteLinks、runJudge、logQuery、hashQuery、parseJudgeResponse、mergeResults、applyMMR、searchBM25、buildFTSQuery 等），確保各 step 可透過 ctx.queryService 存取
- [x] 6.3 確認 askStream() 和 search() 方法行為不變（askStream 透過 ask 的 onToken 自動受益，search 不經過 pipeline）
- [x] 6.4 移除 ask() 中已搬遷至 step 的舊程式碼，清理不再使用的局部變數和 import

## 7. 後端 API

- [x] 7.1 在 `admin-ai.ts` 新增 `GET /api/v1/admin/ai/pipeline-steps` 端點：從 ai_config 讀取 pipeline_steps JSON，與 registry 合併回傳完整 step 資訊（id、name、description、phase、enabled、order、requires、provides）
- [x] 7.2 在 `admin-ai.ts` 新增 `PUT /api/v1/admin/ai/pipeline-steps` 端點：接收 step 設定陣列，驗證 JSON 格式（Zod schema）、驗證依賴關係（呼叫 engine 的依賴驗證邏輯），通過後寫入 ai_config，失敗回傳 400 含衝突細節

## 8. 前端 Pipeline Flow UI

- [x] 8.1 在 `apps/web/src/lib/api/admin-ai.ts` 新增 `fetchPipelineSteps()` 和 `updatePipelineSteps()` API client 函式及 TanStack Query hooks
- [x] 8.2 在 `/admin/ai/settings/page.tsx` 新增「Pipeline Flow」tab（加入 TABS 陣列中，id: 'pipeline'，label: 'Pipeline Flow'）
- [x] 8.3 實作 PipelineFlowPanel 元件：按 5 個 phase 分組顯示 step 卡片（名稱、描述、啟用開關），使用 HTML5 drag and drop 支援 phase 內拖拉排序
- [x] 8.4 實作儲存按鈕（呼叫 PUT API）、重設為預設按鈕、依賴衝突警告顯示（停用 step 時即時檢查受影響的下游 step）

## 9. 驗證與測試

- [ ] 9.1 手動驗證：所有 step 啟用時的完整 pipeline 執行結果與重構前一致（對比 pipeline trace）
- [ ] 9.2 手動驗證：停用 hyde step 後查詢仍正常回應，trace 顯示 hyde skipped
- [ ] 9.3 手動驗證：停用 judge step 後查詢回應無免責聲明前綴
- [ ] 9.4 手動驗證：GK 路徑（通識問題）正常運作，earlyReturn 在 llm-generation step 觸發
- [ ] 9.5 手動驗證：串流模式（SSE）正常運作
- [ ] 9.6 手動驗證：前端 Pipeline Flow tab 正確顯示、拖拉排序、儲存、重設、依賴警告
- [ ] 9.7 手動驗證：依賴驗證 — 停用 embedding 後啟用 hybrid-search 時 API 回傳 400
- [ ] 9.8 手動驗證：Conditional Routing — GK 問題時 trace 顯示 10 個 step 被 skipWhen 跳過，各 step 內部無 hardcoded queryType 檢查
- [ ] 9.9 手動驗證：Looping — 低 groundedness 回答觸發 loopBack 到 retrieval，trace 顯示 loop_count=1 與前後 groundedness 對比
- [ ] 9.10 手動驗證：Branching — 配置分支後 trace 顯示並行執行時間與 fusion 結果

## 10. Conditional Routing（條件路由）

- [x] 10.1 定義 `SkipCondition` 型別（types.ts）：`{ field: keyof PipelineContext, operator: 'eq' | 'neq' | 'in', value: unknown }`
- [x] 10.2 `PipelineStep` 介面新增 `skipWhen?: SkipCondition[]` 可選欄位
- [x] 10.3 Engine 加入 skipWhen 評估邏輯：在呼叫 `step.execute(ctx)` 前遍歷 `step.skipWhen`，任一條件成立則跳過（trace 記錄 `skipped: true, reason: 'skipWhen: ...'`）
- [x] 10.4 Registry 各 step 加入 skipWhen 預設值：10 個 step 設定 `[{ field: 'queryType', operator: 'eq', value: 'general-knowledge' }]`，semantic-cache、tool-selection、llm-generation 不設定
- [x] 10.5 移除各 step execute() 中的 hardcoded `if (ctx.queryType === 'general-knowledge') return ctx;` 檢查（共 10 個 step）

## 11. Looping Pattern（迴圈模式）

- [x] 11.1 PipelineContext 新增 `loopCount: number`（初始化為 0）和 `loopBack?: { targetPhase: PipelinePhase, reason: string }` 欄位
- [x] 11.2 `ai_config` 新增 `max_pipeline_loops` key（預設值 1），加入 `PipelineConfig` 介面與 `loadPipelineConfig()`
- [x] 11.3 Engine 加入迴圈執行邏輯：每個 step 執行後檢查 `ctx.loopBack`，若設定且 `loopCount < max_pipeline_loops` 則 `loopCount++`、清除 loopBack、清除目標 phase 的舊產出、跳回 targetPhase 重新執行；若超限則記錄 trace warning 並忽略
- [x] 11.4 self-reflection step 升級：新增 `groundedness < 0.5 && loopCount === 0` 時設定 `loopBack: { targetPhase: 'retrieval', reason: 'low-groundedness' }` 觸發 re-retrieve

## 12. Branching + Fusion（並行分支與融合）

- [x] 12.1 定義 `BranchConfig` 型別（types.ts）：`{ id: string, branches: StepId[][], fusionStep: StepId }`
- [x] 12.2 PipelineContext 新增 `branchResults?: Map<string, Partial<PipelineContext>>` 欄位
- [x] 12.3 `ai_config` 新增 `pipeline_branches` key（預設值 `[]` 空陣列），加入設定讀取邏輯
- [x] 12.4 Engine 加入分支執行邏輯：偵測 step 屬於 BranchConfig 時，為各分支建立 context 淺拷貝、`Promise.all()` 並行執行、將分支產出存入 `ctx.branchResults`、呼叫 fusionStep 合併結果
- [x] 12.5 在 `admin-ai.ts` 新增 `GET/PUT /api/v1/admin/ai/pipeline-branches` 端點：讀取與更新分支配置，驗證 branch 內的 stepId 存在於 registry
- [x] 12.6 前端 Pipeline Flow UI 擴充：顯示分支配置（並行 step 以分支視覺化呈現），支援新增/刪除分支組
