## 1. ToolRegistry 基礎建設

- [x] 1.1 建立 `backend/src/services/tool-registry.ts`：定義 `RAGToolDefinition`、`ToolParameter` 介面和 `ToolRegistry` class（register / get / getAll / getValidToolNames / generatePromptBlock）
- [x] 1.2 將現有 5 個工具（search_routes / search_crags / general_knowledge / search_sql / hybrid）的 metadata 從 `TOOL_SELECTION_PROMPT` 提取為 `RAGToolDefinition` 定義並註冊到 ToolRegistry
- [x] 1.3 實作 `generatePromptBlock()`：從已註冊工具動態生成工具描述文字區塊（含 name、description、triggerSignals、parameters + enum 值），格式與現有靜態 prompt 等效
- [x] 1.4 驗證 `generatePromptBlock()` 輸出與現有 `TOOL_SELECTION_PROMPT` 工具描述區塊功能等效（人工比對）

## 2. TOOL_SELECTION_PROMPT 動態化

- [x] 2.1 將 `ai-prompts.ts` 中 `TOOL_SELECTION_PROMPT` 的靜態工具描述區塊替換為 `{tools}` 佔位符，保留規則邏輯區塊和 `{crags}` / `{areas}` / `{regions}` / `{query}` 模板變數
- [x] 2.2 修改 `tool-selection.ts` 的 `execute()` 方法：呼叫 `ToolRegistry.generatePromptBlock()` 填入 `{tools}` 佔位符後再傳給 `parseQueryWithLLM()`
- [x] 2.3 修改 `parseQueryWithLLM()`：使用 `ToolRegistry.getValidToolNames()` 驗證 LLM 輸出的 tool 名稱（取代現有硬寫的驗證陣列）

## 3. Confidence 信心分數

- [x] 3.1 擴充 `ParsedQuery` 介面：新增 `confidence: number` 和 `alternative?: string` 欄位
- [x] 3.2 更新 `TOOL_SELECTION_PROMPT`：要求 LLM 在 JSON 輸出中包含 `confidence`（0.0-1.0）和當 confidence < 0.8 時的 `alternative`
- [x] 3.3 修改 `parseQueryWithLLM()`：解析 `confidence` 和 `alternative` 欄位，未輸出時 confidence 預設為 1.0
- [x] 3.4 擴充 `PipelineContext` 介面：新增 `toolConfidence: number`（預設 1.0）、`fallbackEnabled: boolean`（預設 false）、`alternativeTool?: string`
- [x] 3.5 修改 `tool-selection.ts`：依 confidence 設定 PipelineContext — confidence < 0.5 覆寫為 general_knowledge、0.5-0.8 設定 fallbackEnabled = true、>= 0.8 直接使用
- [x] 3.6 更新 `tool-selection` step metadata：provides 新增 `toolConfidence`、`fallbackEnabled`、`alternativeTool`

## 4. Pipeline-level 工具 Fallback

- [x] 4.1 在 `hybrid-search` 步驟的 `execute()` 末尾新增 fallback 檢查：若 `ctx.fallbackEnabled === true` 且 `ctx.candidateMatches.length === 0`，觸發 fallback
- [x] 4.2 實作 fallback 邏輯：更新 `ctx.queryType` 和 `ctx.parsedQuery.tool`、設定 `ctx.fallbackEnabled = false`、設定 `ctx.loopBack = { targetPhase: 'pre-retrieval', reason: 'tool_fallback' }` 從 filter-build 重新執行
- [x] 4.3 記錄 fallback 事件到 `ctx.trace.tool_selection.fallback`：`{ triggered: true, from_tool, to_tool, reason: 'empty_results' }`

## 5. Agentic SWITCH_TOOL 動作

- [x] 5.1 擴充 `AgenticActionType` type：新增 `'SWITCH_TOOL'`，`AgenticAction` 介面新增 `targetTool?: string` 和 `reason?: string`
- [x] 5.2 更新 `AGENTIC_DECISION_PROMPT`：新增 `SWITCH_TOOL` 選項說明和選擇規則（僅在 RETRIEVE/BROADEN 不滿意時使用、不可切換到 general_knowledge）
- [x] 5.3 修改 `agenticRetrieve()` 的 action 解析邏輯：處理 `SWITCH_TOOL` type，新增 `switchToolUsed` 旗標限制最多 1 次
- [x] 5.4 實作 SWITCH_TOOL 執行邏輯：依 targetTool 呼叫 `buildFiltersFromParsed()` 重建 vectorFilter，呼叫 `runAgenticSearch()` 檢索，透過 RRF 合併到現有候選集
- [x] 5.5 處理 SWITCH_TOOL 邊界情況：targetTool 為 general_knowledge 時視為 ANSWER、已使用過 SWITCH_TOOL 時視為 ANSWER

## 6. Trace 擴充

- [x] 6.1 在 `tool-selection.ts` 記錄 `ctx.trace.tool_selection`：`{ selected_tool, confidence, alternative? }`
- [x] 6.2 在 fallback 邏輯中記錄 `ctx.trace.tool_selection.fallback`：`{ triggered, from_tool?, to_tool?, reason? }`
- [x] 6.3 在 `agenticRetrieve()` 的每步 trace 中新增 `action_type` 欄位（ANSWER / RETRIEVE / BROADEN / SWITCH_TOOL），SWITCH_TOOL 時額外記錄 `target_tool` 和 `reason`

## 7. 驗證與測試

- [ ] 7.1 人工測試 20+ 筆查詢：驗證 ToolRegistry 遷移後工具選擇行為不變
- [ ] 7.2 驗證 confidence 輸出穩定性：測試 simple / complex / sql / hybrid / general-knowledge 各類型查詢的 confidence 分佈
- [ ] 7.3 驗證 fallback 觸發：構造低信心 + 空結果場景，確認 fallback 正確執行且最多 1 次
- [ ] 7.4 驗證 SWITCH_TOOL：在 agentic 模式下構造需要切換工具的場景，確認 SWITCH_TOOL 正確執行且最多 1 次
- [ ] 7.5 驗證 trace 記錄完整性：檢查 pipeline_trace 中 tool_selection 和 agentic.steps 欄位正確記錄

## 8. E4 補完 — DECOMPOSE + VERIFY Agentic 動作

- [x] 8.1 `pipeline/types.ts`：`AgenticActionType` 加入 `'DECOMPOSE' | 'VERIFY'`，`AgenticAction` 新增 `subQueries?: string[]`（DECOMPOSE 用）和 `verifyQuery?: string`（VERIFY 用），`AgenticStepTrace` 新增相同欄位
- [x] 8.2 `ai-prompts.ts`：`AGENTIC_DECISION_PROMPT` 新增 DECOMPOSE 和 VERIFY 動作選項及選擇規則
- [x] 8.3 `query.ts`：`decideNextAction()` 新增 DECOMPOSE 驗證（`subQueries` 非空字串陣列、最多 3 個、截斷 500 字元）和 VERIFY 驗證（`verifyQuery` 非空字串、截斷 500 字元）
- [x] 8.4 `query.ts`：`agenticRetrieve()` 新增 `decomposeUsed` 旗標和 DECOMPOSE 執行邏輯（Promise.all 並行子查詢、合併到 allPaths）
- [x] 8.5 `query.ts`：`agenticRetrieve()` 新增 `verifyUsed` 旗標和 VERIFY 執行邏輯（空 filter 獨立搜尋、合併到 allPaths）
- [x] 8.6 Trace：AgenticStepTrace 已擴充 `subQueries` 和 `verifyQuery` 欄位，自動包含在 agentic trace 中

## 9. E5 — 檢索方法動態選擇

- [x] 9.1 `pipeline/types.ts`：新增 `RetrievalMethod = 'vector' | 'bm25' | 'hybrid'`，`PipelineContext` 新增 `retrievalMethod: RetrievalMethod`，`AgenticAction` 新增 `retrievalMethod?: RetrievalMethod`
- [x] 9.2 `types.ts`：`ParsedQuery` 新增 `retrieval_method?: 'vector' | 'bm25' | 'hybrid'`
- [x] 9.3 `context.ts`：`retrievalMethod` 預設值為 `'hybrid'`
- [x] 9.4 `ai-prompts.ts`：`TOOL_SELECTION_PROMPT` 新增 `retrieval_method` 欄位說明及判斷規則（bm25 精確匹配、vector 語意模糊、hybrid 預設）
- [x] 9.5 `ai-prompts.ts`：`AGENTIC_DECISION_PROMPT` RETRIEVE 動作新增選填 `retrievalMethod` 欄位
- [x] 9.6 `tool-selection.ts`：讀取 `parsedQuery.retrieval_method` 並設定 `ctx.retrievalMethod`，`provides` 新增 `'retrievalMethod'`
- [x] 9.7 `embedding.ts`：`ctx.retrievalMethod === 'bm25'` 時跳過 embedding，trace 記錄 `{ skipped: true, reason: 'bm25_only' }`
- [x] 9.8 `hybrid-search.ts`：baseline 路徑根據 `ctx.retrievalMethod` 選擇性跳過 Vector（bm25 模式）或 BM25（vector 模式），trace 記錄 `retrieval_method`
- [x] 9.9 `query.ts`：`runAgenticSearch()` 新增 `method: RetrievalMethod = 'hybrid'` 參數，根據 method 選擇性執行 Vector/BM25
- [x] 9.10 `query.ts`：`agenticRetrieve()` RETRIEVE 動作解析 `action.retrievalMethod` 並傳遞給 `runAgenticSearch()`，`decideNextAction()` 驗證 `retrievalMethod` 合法值

## 10. E7 — 多工具組合選擇

- [x] 10.1 `pipeline/types.ts`：新增 `MultiToolStep`（tool/purpose/query/params）和 `MultiToolPlan`（steps/execution_mode）介面，`PipelineContext.queryType` union 新增 `'multi-tool'`，`PipelineContext` 新增 `multiToolPlan?: MultiToolPlan`
- [x] 10.2 `types.ts`：`ParsedQuery.tool` union 加入 `'multi_tool'`，新增 `multi_tool?: { steps, execution_mode }` 欄位
- [x] 10.3 `tool-registry.ts`：註冊第 6 個工具 `multi_tool`（description、triggerSignals、queryType: 'multi-tool'、llmModel: 'main'）
- [x] 10.4 `ai-prompts.ts`：`TOOL_SELECTION_PROMPT` JSON 輸出格式新增 `multi_tool` 欄位說明及與 `hybrid` 的區分規則
- [x] 10.5 `tool-selection.ts`：`multi_tool` 分支驗證 steps 結構（非空、每步 tool 名稱有效且排除 multi_tool/general_knowledge、最多 3 步），設定 `ctx.queryType = 'multi-tool'` 和 `ctx.multiToolPlan`
- [x] 10.6 skipWhen 更新：`'multi-tool'` 加入 text-to-sql、hyde、multi-query、filter-build、embedding、cross-encoder、mmr、popularity-rerank（8 個步驟），hybrid-search 不加
- [x] 10.7 `hybrid-search.ts`：multi-tool 優先分支，將 `MultiToolPlan` 轉為 `ExecutionPlan` 格式，復用 `executePlan()` + `synthesize()`，失敗時 fallback 走 BM25-only
- [x] 10.8 `query.ts`：`parseQueryWithLLM()` 驗證 `multi_tool` 結構（steps 非空、每步 tool 有效、最多 3 步），無效時降級為 `search_routes`

## 11. 驗證

- [x] 11.1 TypeScript 編譯通過（`npx tsc --noEmit` 零錯誤）
