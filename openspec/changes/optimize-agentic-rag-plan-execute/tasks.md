## 1. 配置與型別基礎設施

- [x] 1.1 擴充 `PipelineConfig` 介面，新增 `plan_execute_max_steps`、`plan_execute_min_entities`、`planning_timeout_ms`、`synthesis_timeout_ms`、`plan_step_timeout_ms`、`adaptive_plan_enabled` 欄位
- [x] 1.2 擴充 `loadPipelineConfig()` 載入新配置項，使用 `num()` 驗證範圍和預設值，`rag_strategy` 支援 `'plan-execute'` 和 `'auto'`
- [x] 1.3 擴充 `PipelineContext` 型別，新增 `strategyHint?: string` 和 `skipPostRetrieval?: boolean` 欄位
- [x] 1.4 新增 DB migration：在 `ai_config` 插入 Plan-and-Execute 預設配置值，在 `ai_prompts` 插入 PLANNING_PROMPT 和 SYNTHESIS_PROMPT 預設記錄
- [x] 1.5 擴充 `rag_strategy` 驗證邏輯：在 `loadPipelineConfig()` 加入 allowlist 驗證（`baseline` / `agentic` / `plan-execute` / `auto`），無效值 fallback 為 `baseline`

## 2. Prompt 模板

- [x] 2.1 在 `ai-prompts.ts` 新增 `PLANNING_PROMPT` 模板，包含可用工具清單、已知岩場/區域、few-shot 範例（至少 2 個），要求輸出結構化 JSON 計畫
- [x] 2.2 在 `ai-prompts.ts` 新增 `SYNTHESIS_PROMPT` 模板，包含原始查詢、子任務結果結構、合併策略指示，要求輸出繁體中文一致回答
- [x] 2.3 擴充 `TOOL_SELECTION_PROMPT`，在 `auto` 模式下要求 LLM 額外輸出 `strategy_hint` 欄位（`'baseline'` | `'agentic'` | `'plan-execute'`）

## 3. 核心方法實作（query.ts）

- [x] 3.1 實作 `planQuery()` 方法：接收查詢和配置，呼叫強模型生成結構化計畫 JSON，包含 JSON 解析和驗證邏輯，超時 fallback
- [x] 3.2 實作 `executePlan()` 方法：按 `depends_on` 依賴排序子任務，無依賴的 `Promise.all()` 並行執行，有依賴的循序執行，每個子任務呼叫 embedding + vector search + BM25 或 TextToSqlService
- [x] 3.3 實作 `synthesize()` 方法：呼叫強模型將所有子任務的檢索結果智慧合併為結構化 context（非最終答案），回傳與 `popularity-rerank` 產出相容的 context + sources 格式，處理 SQL 與向量檢索混合結果
- [x] 3.4 實作 Adaptive Plan 邏輯：在 `executePlan()` 中檢測子任務結果為空時，呼叫輕量模型 replan，限制最多 1 次

## 4. Pipeline 整合

- [x] 4.1 修改 `tool-selection.ts`：在 `auto` 模式下解析 LLM 回傳的 `strategy_hint`，設定 `ctx.strategyHint`，更新 provides 清單
- [x] 4.2 修改 `hybrid-search.ts`：新增 Plan-and-Execute 分支條件判斷（`rag_strategy === 'plan-execute'` 或 `auto` + `strategyHint`），呼叫 `planQuery` → `executePlan` → `synthesize`，成功時設定 `ctx.skipPostRetrieval = true`
- [x] 4.3 實作 Plan-and-Execute fallback 邏輯：planning 失敗（JSON 解析錯誤或超時）→ fallback 到 ReAct 分支；auto 模式下計畫子任務數 < `plan_execute_min_entities` → 降級為 ReAct
- [x] 4.4 更新 `registry.ts`：`tool-selection` 步驟的 provides 清單新增 `strategyHint`
- [x] 4.5 修改 `cross-encoder.ts`、`mmr.ts`、`popularity-rerank.ts`：偵測 `ctx.skipPostRetrieval === true` 時跳過執行

## 5. Trace 與可觀測性

- [x] 5.1 擴充 `pipelineTrace` 型別，新增 `plan_execute` 物件定義（strategy、plan、planning_duration_ms、steps 陣列、synthesis_duration_ms、total_duration_ms、adaptive_replan、plan_fallback）
- [x] 5.2 在 `planQuery()`、`executePlan()`、`synthesize()` 各階段記錄 duration_ms 和結果統計至 trace
- [x] 5.3 fallback 事件記錄：planning 失敗原因、fallback 目標策略

## 6. Streaming 整合

- [x] 6.1 確認 `askStream()` 與 Plan-and-Execute 相容：planning + execution 階段為非串流，完成後將結構化 context 交給 `llm-generation` 步驟串流生成
- [x] 6.2 確認 streaming 模式下 Plan-and-Execute 的 time to first token 在可接受範圍內（planning + execution 總延遲 < 10s）

## 7. 驗證與測試

- [ ] 7.1 手動驗證：`rag_strategy: 'plan-execute'` + 多實體比較查詢，確認三階段正常執行
- [ ] 7.2 手動驗證：`rag_strategy: 'auto'` + 不同查詢類型，確認策略自動選擇正確
- [ ] 7.3 手動驗證：planning JSON 解析失敗時 fallback 到 ReAct
- [ ] 7.4 手動驗證：子任務超時和結果為空時的 Adaptive Plan 邏輯
- [ ] 7.5 手動驗證：`rag_strategy: 'baseline'` 和 `'agentic'` 行為不受影響（無回歸）
- [x] 7.6 確認 trace 記錄完整性，包含 plan_execute 所有欄位
- [ ] 7.7 手動驗證：Plan-and-Execute 模式下 `skipPostRetrieval` 正確跳過 cross-encoder、mmr、popularity-rerank
- [ ] 7.8 手動驗證：SSE streaming 模式下 Plan-and-Execute 正常串流回答
