## 1. 型別擴充

- [x] 1.1 在 `backend/src/types.ts` 的 `ParsedQuery` 介面擴充：`tool` 聯合型別新增 `'search_sql' | 'hybrid'`；`query_type` 聯合型別新增 `'sql' | 'hybrid' | 'clarification-needed'`；`params` 新增 `route_name?: string`；新增 `template?: string` 和 `clarification_type?: 'intent' | 'missing-crag'` 欄位
- [x] 1.2 在 `backend/src/types.ts` 的 `AIAskResponse` 介面新增 `clarification_needed?: boolean`、`clarification_options?: string[]`、`query_route?: string`
- [x] 1.3 在 `backend/src/services/pipeline/types.ts` 的 `StepId` 聯合型別新增 `'text-to-sql'`
- [x] 1.4 在 `backend/src/services/pipeline/types.ts` 的 `PipelineContext` 擴充 `queryType` 聯合型別：新增 `'sql' | 'hybrid' | 'clarification-needed'`
- [x] 1.5 在 `backend/src/services/pipeline/types.ts` 的 `PipelineContext` 新增 SQL 相關欄位：`sqlTemplate?: string`、`sqlParams?: Record<string, unknown>`、`clarificationType?: 'intent' | 'missing-crag'`、`sqlCandidates?: Array<Record<string, unknown>>`、`sqlContext?: string`
- [x] 1.6 確認前端 `packages/types` 或 `apps/web/src/lib/api/` 中的 `AIAskResponse` 型別同步更新

## 2. Registry 與 Engine 擴充

- [x] 2.1 在 `backend/src/services/pipeline/registry.ts` 新增 `text-to-sql` step metadata（id: 'text-to-sql'、name: 'Text-to-SQL 直查'、phase: 'pre-retrieval'、defaultOrder: 2、requires: ['queryType', 'parsedQuery']、provides: ['earlyReturn', 'sqlCandidates', 'sqlContext']、skipWhen: [{ field: 'queryType', operator: 'in', value: ['simple', 'complex', 'general-knowledge'] }]），插入在 `tool-selection`（order 1）之後
- [x] 2.2 更新 registry.ts 中既有 step 的 defaultOrder：`hyde` 從 2→3、`multi-query` 從 3→4、`filter-build` 從 4→5、`embedding` 從 5→6、`hybrid-search` 從 6→7、`cross-encoder` 從 7→8、`mmr` 從 8→9、`popularity-rerank` 從 9→10、`llm-generation` 從 10→11、`judge` 從 11→12、`self-reflection` 從 12→13
- [x] 2.3 將 registry.ts 中 `GK_SKIP` 常數拆分為兩個：`NON_RAG_SKIP`（跳過 sql/hybrid/clarification-needed/general-knowledge，用於 hyde 至 popularity-rerank 共 8 個 step）和 `GK_SQL_SKIP`（跳過 sql/clarification-needed/general-knowledge，不含 hybrid，用於 judge 和 self-reflection）。原 `GK_SKIP = [{ field: 'queryType', operator: 'eq', value: 'general-knowledge' }]` 改為：`NON_RAG_SKIP = [{ field: 'queryType', operator: 'in', value: ['general-knowledge', 'sql', 'hybrid', 'clarification-needed'] }]`、`GK_SQL_SKIP = [{ field: 'queryType', operator: 'in', value: ['general-knowledge', 'sql', 'clarification-needed'] }]`
- [x] 2.4 更新 `tool-selection` step 在 registry.ts 中的 `provides`：加入 `'sqlTemplate'`、`'sqlParams'`、`'clarificationType'`
- [x] 2.5 在 `backend/src/services/pipeline/engine.ts` 的 `STEP_MAP` 新增 `'text-to-sql': textToSqlStep` 匯入與映射
- [x] 2.6 在 `engine.ts` 的停用 step 記錄邏輯（line 204-215）後加入 fallback：若 `text-to-sql` step 被停用，在 pipeline 執行前將 `ctx.queryType` 為 `'sql'`/`'hybrid'`/`'clarification-needed'` 時回復為 `'complex'`，確保後續 RAG step 不被 skipWhen 跳過
- [x] 2.7 更新 `ai_config` 的 `pipeline_steps` 預設值為 14 個 step（透過 `getDefaultStepConfigs()` 自動從 registry 生成，無需手動更新）

## 3. TOOL_SELECTION_PROMPT 擴充

- [x] 3.1 在 `backend/src/utils/ai-prompts.ts` 的 `TOOL_SELECTION_PROMPT` 新增 `search_sql` 和 `hybrid` 兩個 tool 選項說明（search_sql: 計數/統計/篩選/精確查詢；hybrid: 推薦型查詢需 SQL 候選集 + LLM 推薦），並更新 JSON schema 中 tool 的可選值
- [x] 3.2 新增 `query_type` 可用值：`sql`（計數/統計/精確查詢）、`hybrid`（推薦型）、`clarification-needed`（模糊/缺少必要參數），並附上判斷規則與信號範例（「有幾條」「列出」「幾顆 bolt」「FA 是誰」「我有幾條 rp」等）
- [x] 3.3 在 JSON schema 中新增 `template` 欄位說明（僅在 `query_type = 'sql'` 或 `'hybrid'` 時輸出，值為 SQL 模板 ID）和 `clarification_type` 欄位（`intent` 或 `missing-crag`）
- [x] 3.4 在 `backend/src/utils/ai-prompts.ts` 新增 `SQL_RESULT_ASSEMBLY_PROMPT`，指示輕量 LLM 將 SQL 結果轉換為自然語言（繁體中文、簡潔），覆蓋計數型、清單型、影片型、個人統計型格式

## 4. tool-selection step 擴充

- [x] 4.1 在 `backend/src/services/pipeline/steps/tool-selection.ts` 的 `execute()` 方法中（line 88-95 附近），新增對 `search_sql` 和 `hybrid` tool 的處理：當 `parsedQuery?.tool` 為 `'search_sql'` 時設定 `ctx.queryType = parsedQuery.query_type ?? 'sql'`，為 `'hybrid'` 時設定 `ctx.queryType = 'hybrid'`
- [x] 4.2 從 `parsedQuery` 解析並設定 `ctx.sqlTemplate = parsedQuery.template`、`ctx.sqlParams = parsedQuery.params`、`ctx.clarificationType = parsedQuery.clarification_type`
- [x] 4.3 sql/hybrid 類型使用輕量模型：`ctx.effectiveLlmModel = pipelineConfig.lightweight_model`

## 5. TextToSqlService 建立

- [x] 5.1 建立 `backend/src/services/text-to-sql.ts`，定義 `TextToSqlService` class，constructor 注入 `D1Database`
- [x] 5.2 實作 `validateRouteName(routeName: string, cragId?: string): Promise<{ id: string; name: string; crag_id: string } | null>`，執行 `SELECT id, name, crag_id FROM routes WHERE name LIKE ? LIMIT 5` 驗證查詢
- [x] 5.3 實作 `execute(template: string, params: Record<string, unknown>): Promise<{ rows: Record<string, unknown>[]; template: string }>`，根據 template ID 分派至對應查詢方法
- [x] 5.4 實作路線查詢模板：`countRoutesAtCrag`、`listRoutesByCriteria`、`listRoutesAtGrade`、`routeInfoLookup`
- [x] 5.5 實作路線查詢模板：`cragInfoLookup`、`rankCragsByRoutes`、`gradeDistribution`、`routeTypeDistribution`、`routeFirstAscent`
- [x] 5.6 實作影片查詢模板：`listVideosForRoute`（JOIN routes ↔ route_videos ↔ videos）、`routesWithVideos`
- [x] 5.7 實作個人完攀模板：`myAscentCount`、`myAscentByType`、`myAscentList`、`myAscentAtCrag`
- [x] 5.8 實作個人完攀模板：`myAscentByDate`、`myHighestGrade`、`myRatedRoutes`
- [x] 5.9 實作 `queryCandidates(params: Record<string, unknown>): Promise<Record<string, unknown>[]>` 供 hybrid pipeline 取得候選集（最多 20 條，含 grade + crag 過濾，依 grade 排序）
- [x] 5.10 實作參數正規化方法：攀登類型中文→英文（運攀→sport、傳攀→trad、抱石→boulder、混合→mixed）、ascent_type 縮寫→enum（rp/紅點→redpoint、os→onsight、flash→flash 等）
- [x] 5.11 個人完攀模板的 `user_id` 參數只接受外部傳入（從 `ctx.userId`），`MY_*` 模板收到 `userId = undefined` 時直接 throw Error('LOGIN_REQUIRED')
- [x] 5.12 所有方法包裝 try/catch，捕獲 D1 例外後 throw 統一的 SqlExecutionError，讓 step 層 fallback

## 6. text-to-sql Pipeline Step 實作

- [x] 6.1 建立 `backend/src/services/pipeline/steps/text-to-sql.ts`，匯出 `textToSqlStep` 實作 `PipelineStep` 介面
- [x] 6.2 sql 路徑（`ctx.queryType === 'sql'`）：建立 `TextToSqlService(ctx.env.DB)`，從 `ctx.sqlTemplate` 和 `ctx.sqlParams` 執行；路線名稱模板（ROUTE_INFO_LOOKUP、LIST_VIDEOS_FOR_ROUTE、ROUTE_FIRST_ASCENT）先呼叫 `validateRouteName()`，用 `ctx.queryService.extractLocationFilter()` 解析 crag_id 縮小範圍
- [x] 6.3 sql 路徑成功：SQL 結果交 `env.AI.run(pipelineConfig.lightweight_model, ...)` 使用 `SQL_RESULT_ASSEMBLY_PROMPT` 組裝自然語言，設定 `ctx.earlyReturn = { answer, sources: [], query_id, query_route: 'sql', suggested_questions: [] }`（含 logQuery 和 KV 快取寫入）
- [x] 6.4 sql fallback：驗證失敗（validateRouteName 回傳 null）、無對應模板、TextToSqlService throw、或 SQL 結果 0 筆時，將 `ctx.queryType` 回復為 `'complex'`，設定 `ctx.trace.sql_fallback = true`，**不設 `earlyReturn`**，讓 pipeline 繼續走 RAG
- [x] 6.5 hybrid 路徑（`ctx.queryType === 'hybrid'`）：呼叫 `TextToSqlService.queryCandidates()`，將結果格式化為 context 文字（每條路線：「路線名稱：XX，難度：5.10a，類型：運攀，描述：…」），存入 `ctx.sqlCandidates` 和 `ctx.sqlContext`，不設 `earlyReturn`
- [x] 6.6 hybrid fallback：候選集為空時，將 `ctx.queryType` 回復為 `'complex'`，`ctx.trace.sql_fallback = true`
- [x] 6.7 clarification-needed 路徑（`ctx.queryType === 'clarification-needed'`）：根據 `ctx.clarificationType` 組裝回應，設定 `ctx.earlyReturn = { answer: '...', sources: [], query_id, clarification_needed: true, clarification_options: [...], query_route: 'clarification', suggested_questions: [] }`（含 logQuery）
- [x] 6.8 個人完攀模板：偵測 `ctx.sqlTemplate` 以 `MY_` 開頭且 `ctx.userId` 為 undefined 時，設定 `ctx.earlyReturn` 回應「請先登入才能查詢個人完攀紀錄。」

## 7. llm-generation step 擴充

- [x] 7.1 在 `backend/src/services/pipeline/steps/llm-generation.ts` 的 RAG 路徑（line 129 附近），新增 hybrid 分支：當 `ctx.queryType === 'hybrid'` 且 `ctx.sqlContext` 有值時，使用 `ctx.sqlContext` 取代 `ctx.context` 作為 context 變數（`const context = ctx.queryType === 'hybrid' && ctx.sqlContext ? ctx.sqlContext : ctx.context ?? '目前沒有找到相關資料。';`）

## 8. 安全驗證

- [x] 8.1 確認所有 SQL 模板均使用 D1 參數化查詢（`db.prepare(SQL).bind(...params)`），無字串拼接
- [x] 8.2 確認 `TextToSqlService` 所有模板的 SQL 字串為靜態常數，只查詢白名單資料表（`routes`、`crags`、`route_videos`、`videos`、`user_route_ascents`）

## 9. 測試驗證（手動）

- [ ] 9.1 手動測試計數型：「龍洞有幾條路線？」→ trace 顯示 `tool-selection` 設定 `queryType: 'sql'`、`text-to-sql` 執行、`earlyReturn` 帶 `query_route: 'sql'`
- [ ] 9.2 手動測試路線查詢：「鬼頭刀幾級？」→ 確認 `validateRouteName` 流程、`ROUTE_INFO_LOOKUP` 模板執行
- [ ] 9.3 手動測試影片查詢：「一陽指有哪些影片？」→ 確認影片標題與 YouTube ID 回傳
- [ ] 9.4 手動測試 clarification：「找路線」→ earlyReturn 帶 `clarification_needed: true`；「列出 5.11 以上的運攀路線」→ 回問岩場
- [ ] 9.5 手動測試 hybrid：「推薦我幾條龍洞的初級路線」→ `text-to-sql` step 存入 `sqlContext`，`llm-generation` step 使用候選集生成推薦
- [ ] 9.6 手動測試 fallback：不存在的路線名稱 → `queryType` 回復 `complex`，trace 顯示 `sql_fallback: true`，後續 RAG step 正常執行
- [ ] 9.7 手動測試個人完攀：登入後「我有幾條 rp？」→ `ascent_type = 'redpoint'`、計數正確
- [ ] 9.8 手動測試未登入個人完攀 → earlyReturn 回傳「請先登入」
- [ ] 9.9 手動測試 step 停用：停用 `text-to-sql` step 後問 SQL 問題 → engine fallback 將 queryType 改為 complex，RAG 正常回答
- [ ] 9.10 手動測試 skipWhen：sql 問題的 trace 確認 `text-to-sql` 執行後 earlyReturn，pipeline 停止；hybrid 問題確認 hyde 至 popularity-rerank 被 skipWhen 跳過，judge/self-reflection 正常執行
