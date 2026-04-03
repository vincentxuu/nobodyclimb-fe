## 1. 基礎架構

- [x] 1.1 建立 `backend/src/services/react-agent/` 目錄結構（types.ts, engine.ts, registry.ts, guards.ts, tracker.ts, index.ts, tools/）
- [x] 1.2 定義 Tool interface、ToolResult（content + metadata）、ToolContext（env, userId, locale, models, queryService, langfuseTrace, tracker, cache, availableTools）等核心型別（types.ts）
- [x] 1.3 定義 ModelConfig（provider: workers-ai|anthropic|openai|google|github + model + temperature + maxTokens）、ModelMap（7 個觸點）型別（types.ts）— `fallback` 欄位在 task 11.4 新增
- [x] 1.4 定義 TokenTracker interface（perModel 含 provider、perTurn、累計統計）（types.ts）
- [x] 1.5 定義 ToolUseResponse、ToolCall 等 provider 回傳型別（types.ts）

## 2. Provider 擴展

- [x] 2.1 在 AIProvider interface 新增 `chatWithTools(messages, tools, opts)` method 定義
- [x] 2.2 實作 Workers AI 的 chatWithTools adapter + 防禦性 tool_use 解析（多空格、string input、markdown 包裹 JSON）
- [x] 2.3 實作 Anthropic 的 chatWithTools adapter（content blocks → ToolUseResponse）
- [x] 2.4 實作 OpenAI 的 chatWithTools adapter（function calling + JSON string arguments → ToolUseResponse）
- [x] 2.5 實作 Google AI 的 chatWithTools adapter
- [x] 2.6 實作 GitHub Models 的 chatWithTools adapter（複用 OpenAI adapter，改 endpoint + auth）
- [x] 2.7 撰寫各 provider chatWithTools 單元測試（正常 tool call、直接回答、格式異常）

## 3. Tool Registry

- [x] 3.1 實作 Tool Registry：registerTool()、getTools()、getTools(tags)、toAPISchema(ctx) 轉換（registry.ts）
- [x] 3.2 實作 toAPISchema(ctx)：呼叫每個 tool 的 prompt(ctx) + parameters 轉為 LLM tool_use 格式
- [x] 3.3 撰寫 registry 單元測試

## 4. ReAct Engine 核心

- [x] 4.1 實作 ReAct loop 主邏輯：while loop + chatWithTools + tool execution + message composition（engine.ts）
- [x] 4.2 實作並行/串行 tool 執行分流：concurrencySafe=true 用 Promise.all，其他按回傳順序串行
- [x] 4.3 實作 tool 錯誤處理：try-catch 包裝成 is_error tool_result + 同一 tool 連續失敗 2 次自動移除
- [x] 4.4 實作 turn 計算（1 turn = 1 次 orchestrator call）+ maxTurns 守衛
- [x] 4.5 實作 token budget 守衛（優先於 maxTurns）
- [x] 4.6 實作 engine 統一截斷邏輯：tool result 超過 maxResultChars 截斷 + 摘要
- [x] 4.7 實作 fallback：tool_use 解析全部失敗時視為 end_turn
- [x] 4.8 實作守衛優先順序：semantic_cache → embedding_cache → input_guard →（loop）→ tool_result_cache → token_budget → maxTurns → end_turn
- [x] 4.9 撰寫 engine 單元測試（0 tool call、單 tool、多 tool 並行、錯誤恢復、maxTurns、token budget、重複失敗移除）

## 5. Token Tracker

- [x] 5.1 實作 TokenTracker：per-provider+model 記錄、per-turn 記錄、累計統計（tracker.ts）
- [x] 5.2 整合 Langfuse trace：span 層級 trace → turn-N → orchestrator-call / tool:name → internal-llm，標記 provider + model
- [x] 5.3 整合 ai_query_logs：query 完成後寫入 token 統計（含 provider 明細）

## 6. 品質守衛

- [x] 6.1 實作規則式同步檢查：回答長度、system prompt 洩漏偵測（guards.ts）
- [x] 6.2 實作 input guardrail：複用現有 checkInput() 規則式檢查（不用 LLM）
- [x] 6.3 實作 LLM judge 非同步評分：複用現有 judge 邏輯，使用 ModelMap 的 judge 觸點 provider + 模型
- [x] 6.4 實作 semantic cache 前置檢查：複用現有邏輯，cache key 加入 rag_strategy='react' 標籤

## 7. Tool 實作

- [x] 7.1 實作 search-routes tool：prompt()、execute()（複用 pipeline 的 embed/search/rerank）、formatResult()
- [x] 7.2 實作 search-crags tool：prompt()、execute()、formatResult()
- [x] 7.3 實作 sql-query tool：prompt()、execute()（複用 text-to-sql 18 templates）、formatResult()
- [x] 7.4 實作 weather tool：prompt()、execute()、formatResult()
- [x] 7.5 實作 user-profile tool：prompt()、execute()（查 DB ascents + ability）、formatResult()
- [x] 7.6 實作 recommend tool：prompt()、execute()（複用 RecommendationService）、formatResult()
- [x] 7.7 實作 crag-info tool：prompt()、execute()（查 DB crags）、formatResult()
- [x] 7.8 為每個 tool 設定 tags、alwaysLoad、concurrencySafe、maxResultChars
- [x] 7.9 實作 isSmallModel(config: ModelConfig) helper（基於 model 名稱關鍵字判斷）
- [x] 7.10 各 tool prompt() 加入小模型 few-shot（search_routes、sql_query、weather 優先）
- [x] 7.11 search_routes 的 prompt() 加入跨 tool 組合提示（ctx.availableTools 包含 weather 時）
- [x] 7.12 weather 的 prompt() 加入中文 locale 岩場名稱對應提示

## 8. 多 Provider 多模型配置

- [x] 8.1 撰寫 D1 migration：ai_config 新增 react_models (TEXT)、react_max_turns (INTEGER DEFAULT 3)、react_token_budget (INTEGER DEFAULT 8000)
- [x] 8.2 實作 loadModelMap()：從 DB 讀取 react_models JSON，null 時回傳具體預設值（orchestrator=llama-4-scout, 其他=8b, embedding=bge-m3）
- [x] 8.3 實作 createProviderForConfig(modelConfig)：根據 ModelConfig 的 provider 欄位建立對應的 provider instance
- [x] 8.4 在 admin dashboard 新增 react 模型配置 UI（每個觸點可選 provider + 模型，即時切換）

## 9. 路由整合

- [x] 9.1 在 routes/ai.ts 新增 `react` strategy 路由分支，呼叫 runReactAgent()
- [x] 9.2 實作 runReactAgent() entry point（index.ts）：loadModelMap、初始化 registry + tracker、建立 ToolContext、呼叫 engine
- [x] 9.3 runReactAgent() 啟動前並行載入 memorySummary + ascentContext + abilityLevel，注入 orchestrator system prompt（複用 buildPersonalizedSystemPrompt）
- [x] 9.4 實作 progress events：tool 執行前送 SSE `{ type: 'progress', tool, status: 'executing' }`，完成後送 `done`（cache hit 不送、0 tool call 不送）
- [x] 9.5 整合 streaming：最後一輪回答（stopReason=end_turn 且無 tool_use blocks）支援 SSE 串流，複用現有 SSE 格式
- [x] 9.6 整合 post-processing：query log、KV cache、semantic cache 寫入（cache key 含 strategy 標籤）
- [x] 9.7 post-processing 非同步觸發 extractMemoriesFromQuery()（waitUntil，不阻塞回應）

## 10. Cache 體系

- [x] 10.1 實作 AgentCache 介面（底層 Cloudflare KV，支援 namespace + TTL）
- [x] 10.2 在 ToolContext 注入 cache instance
- [x] 10.3 實作 embedding cache：embed 前查 cache（key=hash(text+model)，TTL=24hr）
- [x] 10.4 實作 engine 層 tool result cache：execute() 前查 cache（key=tool_name+hash(params)），命中跳過執行
- [x] 10.5 各 tool 設定 cacheTTL 欄位（weather=1800, crag_info=21600, search_crags=21600, search_routes=3600, user_profile=600, recommend=300, sql_query=300）
- [x] 10.6 錯誤結果（is_error=true）不寫入 cache
- [x] 10.7 Langfuse span 標記 cache hit/miss
- [x] 10.8 撰寫 cache 單元測試（命中、miss、TTL 過期、error 不快取）

## 11. Provider Resilience（Retry + Fallback）

- [x] 11.1 實作 `withRetry(fn, opts)` 工具函式：exponential backoff（1s, 2s）+ jitter（0-500ms），最多重試 2 次
- [x] 11.2 定義可重試錯誤類型（429, 500, 502, 503, 504, timeout, connection refused）vs 不可重試（400, 401, 403, 413）
- [x] 11.3 在 chatWithTools() 內整合 withRetry
- [x] 11.4 ModelConfig 型別新增 `fallback?: ModelConfig` 欄位
- [x] 11.5 實作 fallback chain 邏輯：retry 耗盡 → createProviderForConfig(fallback) → 呼叫 fallback provider
- [x] 11.6 Langfuse span 標記 `retry_count` 和 `fallback: true`（含原始 provider 名稱）
- [x] 11.7 Admin dashboard 的 ModelConfig UI 支援配置 fallback provider
- [ ] 11.8 撰寫 retry + fallback 單元測試（成功重試、retry 耗盡觸發 fallback、fallback chain、不可重試錯誤直接失敗）

## 12. 成本追蹤（USD + TWD）

- [x] 12.1 建立 PRICING 定價表（per provider + model，含 input/output 單價 USD）
- [x] 12.2 實作 `calculateCostUSD(provider, model, inputTokens, outputTokens)` 函式
- [x] 12.3 實作 `convertToTWD(usd, rate)` 函式，匯率從 DB `react_usd_to_twd` 讀取（預設 32.0）
- [x] 12.4 D1 migration：ai_config 新增 `react_usd_to_twd` REAL DEFAULT 32.0
- [x] 12.5 TokenTracker 新增 perProvider USD + TWD 成本累計
- [x] 12.6 ai_query_logs 寫入 totalCostUSD + totalCostTWD + perProvider 成本明細 + fallback 次數
- [x] 12.7 Admin dashboard 新增匯率設定 UI + 成本顯示（TWD 為主，USD 為輔）
- [ ] 12.8 撰寫成本計算單元測試（免費 provider、付費 provider、fallback 成本歸屬、TWD 換算）

## 13. Circuit Breaker

- [x] 13.1 實作 CircuitBreaker class（CLOSED/OPEN/HALF_OPEN 狀態機，閾值 3 次連續失敗，cooldown 30s）
- [x] 13.2 每個 provider 建立獨立的 circuit breaker instance（in-memory，isolate 級別）
- [x] 13.3 整合到 chatWithTools()：OPEN 時直接跳過 retry，走 fallback
- [x] 13.4 Langfuse span 標記 `circuit_breaker: open/half_open`
- [ ] 13.5 撰寫 circuit breaker 單元測試（CLOSED→OPEN→HALF_OPEN→CLOSED 全流程）

## 14. 查詢分類快速路徑

- [x] 14.1 實作規則式分類器 `classifyQuery(query)`：回傳 'greeting' | 'system' | 'general_knowledge' | 'needs_tool'
- [x] 14.2 定義 pattern 列表（打招呼、系統問題、通用攀岩知識的 keyword/regex）
- [x] 14.3 greeting/system 類回傳固定訊息（0 LLM call）
- [x] 14.4 general_knowledge 類用 hyde 觸點（小模型）直接回答
- [x] 14.5 needs_tool 類和分類不確定時進入 ReAct loop
- [ ] 14.6 撰寫分類器單元測試（各類型 + 邊界 case）

## 15. Admin 成本 Dashboard + 異常告警

- [ ] 15.1 admin dashboard 新增成本分析頁面（每日/週/月趨勢圖，按 strategy/provider/觸點分）
- [ ] 15.2 顯示 cache hit rate（semantic + tool result）和 fallback 觸發率
- [ ] 15.3 顯示各 strategy 的平均每次查詢成本（TWD）和品質分數
- [ ] 15.4 實作告警規則引擎：成本超閾值（預設 NT$500/日）、provider 錯誤率 >30%、品質分數 <2.0、fallback 率 >50%
- [ ] 15.5 D1 migration：ai_config 新增告警閾值欄位（react_alert_daily_cost_twd, react_alert_error_rate, react_alert_quality_min, react_alert_fallback_rate）
- [ ] 15.6 Admin dashboard 告警閾值設定 UI
- [ ] 15.7 告警觸發時發送通知（複用現有通知管道）

## 16. 測試與驗證

- [ ] 16.1 端對端測試：簡單問題（0 tool call）
- [ ] 16.2 端對端測試：單 tool 查詢（search_routes）
- [ ] 16.3 端對端測試：多 tool 組合（weather + user_profile + search_routes）
- [ ] 16.4 端對端測試：tool 錯誤恢復 + 重複失敗移除
- [ ] 16.5 端對端測試：streaming 最終回答 + progress events
- [ ] 16.6 端對端測試：混合 provider 配置（如 orchestrator 用 GitHub Models/Anthropic、tool 用 Workers AI）
- [ ] 16.7 端對端測試：tool result cache 命中（同一對話內重複 tool call）
- [ ] 16.8 端對端測試：provider fallback + circuit breaker（模擬 provider 連續失敗）
- [ ] 16.9 端對端測試：查詢分類快速路徑（打招呼、通用知識、需要 tool 各一）
- [ ] 16.10 驗證 Langfuse trace 完整記錄（turns、tool calls、provider + model、token 用量、cache hit/miss、retry/fallback/circuit breaker）
- [ ] 16.11 驗證 ai_query_logs 記錄 totalCostUSD + totalCostTWD 和 perProvider 成本明細
- [ ] 16.12 驗證 admin dashboard：成本 dashboard、告警設定、provider/模型/fallback 配置
- [ ] 16.13 A/B 比較：同一組測試 query 分別跑 baseline、agentic、react，比較 groundedness、品質分數、成本
