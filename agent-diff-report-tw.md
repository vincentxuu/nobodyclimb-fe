以下是該份 **Agent Architecture Diff Report** 的繁體中文翻譯：

---

# Agent 架構差異報告

**目標專案**：`/Users/xiaoxu/Projects/nobodyclimb`  
**日期**：2026-04-03  
**總分**：95/195（48.7%）

## 摘要

| 類別 | 分數 | 滿分 | 百分比 |
|------|------|------|--------|
| Harness Engineering（代理執行框架工程） | 52 | 115 | 45.2% |
| Context Engineering（上下文工程） | 23 | 50 | 46.0% |
| Prompt Engineering（提示詞工程） | 20 | 30 | 66.7% |
| **總計** | **95** | **195** | **48.7%** |

## 主要缺口（影響最大）

1. **MCP 整合**（A13：0/5）  
   完全沒有 MCP client/server；目前既有工具（search-routes、sql-query、weather）可考慮暴露為 MCP 工具，以提升生態系相容性

2. **Hooks / Lifecycle（鉤子 / 生命週期）**（A1：1/5）  
   沒有可擴充的事件／hook 系統；所有 before/after 邏輯都硬編碼在 `engine.ts` 中，阻礙安全擴充

3. **上下文組裝管線**（B1：2/5）  
   system prompt 是單一硬編碼字串；沒有 section 抽象、cache 邊界或優先級系統

4. **上下文淘汰與壓縮**（B9：1/5）  
   只有對舊訊息做硬截斷；沒有摘要化、關鍵事實萃取或 compact hooks

5. **背景執行**（A8：2/5）  
   目前僅使用 Cloudflare `waitUntil` 做 fire-and-forget；沒有耐久佇列、工作狀態追蹤或排程型 AI 工作

---

# 詳細分析

## A. 代理執行框架工程（Harness Engineering）— 52/115（45.2%）

### A1. Hooks / Lifecycle（鉤子 / 生命週期）— 分數：1/5

**狀態**：部分實作

**證據**：

- `backend/src/services/react-agent/engine.ts:85-128`  
  硬編碼的 `onProgress` callback，只有 2 種事件型別（`executing` / `done`）；生命週期節點直接寫死在原始碼中，不可配置
- `backend/src/services/react-agent/guards.ts`  
  `runInputGuard` 與 `runOutputGuards` 是硬編碼順序執行步驟，而非可擴充 hook 系統
- `backend/src/services/pipeline/engine.ts:451-532`  
  每一步的錯誤處理與 Langfuse spans 都是硬編碼，沒有 plugin / event-emitter 架構

**行動方案**：

- 引入 `HookRegistry`，定義型別化事件（`before_llm_call`、`after_llm_call`、`before_tool_execute`、`after_tool_execute`、`on_tool_error`）與 `register(event, handler)` API
- 允許 hook 回傳修改後輸入，或透過 throw 阻止執行

**工作量**：高

---

### A2. 權限模型（Permission Model）— 分數：2/5

**狀態**：部分實作

**證據**：

- `backend/src/utils/guardrails.ts:26-55`  
  全域輸入 deny list（封鎖清單、prompt injection、jailbreak patterns），可透過 `ai_config` 資料表配置
- `backend/src/services/react-agent/registry.ts:4-38`  
  `ToolRegistry` 有 `removeTool(name)`，但沒有 per-tool allow/deny 或 per-user 權限控管
- `backend/src/routes/admin-ai.ts:30-31`  
  Admin routes 由 `adminMiddleware` 保護；但沒有 per-tool 使用者層級權限

**缺口**：

- 沒有針對使用者或角色的 per-tool allow/deny list
- 沒有權限模式（plan mode、auto mode、confirm mode）
- 沒有權限決策的稽核日誌

**行動方案**：

- 在每個 `Tool` 定義中增加 `ToolPermission` 介面，包含 `allowedRoles: string[]` 與 `requiresConfirmation: boolean`
- 在 `executeSingleTool` 呼叫 `tool.execute` 前先檢查權限

**工作量**：中

---

### A3. 工具系統（Tool System）— 分數：4/5

**狀態**：進階

**證據**：

- `backend/src/services/react-agent/types.ts:109-121`  
  `Tool` 介面包含 `concurrencySafe`、`maxResultChars`、`cacheTTL`、JSON Schema `parameters`、動態 `prompt(ctx)`、`execute`、`formatResult`，屬於完整結構化定義
- `backend/src/services/react-agent/registry.ts`  
  `ToolRegistry` 支援 `registerTool`、`getTool`、`getTools(tags)`、`removeTool`、`toAPISchema(ctx, tags)`
- `backend/src/services/react-agent/engine.ts:329-379`  
  `executeTools()` 會將 `concurrencySafe` 工具平行執行（`Promise.all`），其餘序列執行
- `backend/src/services/react-agent/engine.ts:427-429`  
  有強制執行 `maxResultChars`，超長結果會截斷
- 已註冊 7 個工具，支援 per-tool cache、依上下文動態描述、連續失敗 2 次後自動移除

**缺口**：

- 沒有 MCP 整合，工具都只存在內部系統
- 沒有 `isDestructive` / `readOnly` 中繼資料欄位
- 沒有延遲／懶加載工具

**行動方案**：

- 在 `Tool` 介面中加入 `isReadOnly: boolean` 與 `isDestructive: boolean`
- 評估用 MCP adapter 整合外部工具

**工作量**：低

---

### A4. 設定分層（Configuration Layering）— 分數：3/5

**狀態**：已實作

**證據**：

- `backend/src/services/query/config.ts:17-117`  
  `loadPipelineConfig` 會從 `ai_config` 的 D1 資料表讀取約 40 個設定鍵，並有型別化預設值
- `backend/src/services/react-agent/index.ts:71-92`  
  `normalizeModelConfig` 與 `DEFAULT_MODEL_MAP` 做 deep-merge，部分覆寫安全
- `backend/src/services/query/config.ts:133-142`  
  `loadPrompts` 會從 DB 載入模板，`resolvePrompt` 驗證必要變數

**缺口**：

- 沒有動態 reload；設定每次 request 都讀一次，沒有 in-process cache invalidation
- 沒有明確宣告多來源優先順序
- 沒有 session-level overrides

**行動方案**：

- 在 KV 中加一層短 TTL（例如 60 秒）的 `configCache`，避免每次都打 DB
- 在註解中明確記錄 config priority chain

**工作量**：低

---

### A5. 錯誤處理與韌性（Error Handling & Resilience）— 分數：4/5

**狀態**：進階

**證據**：

- `backend/src/services/react-agent/resilience.ts:62-81`  
  `withRetry` 支援 exponential backoff：`baseDelayMs * 2^attempt + jitter`，最多重試 2 次；並依 HTTP 狀態碼分類（429, 500-504）
- `backend/src/services/react-agent/resilience.ts:94-152`  
  內建 `CircuitBreaker`，有 CLOSED → OPEN → HALF_OPEN 狀態轉換；每個 provider 各自維護
- `backend/src/utils/circuit-breaker.ts`  
  還有 KV-backed `CircuitBreaker`，可跨 isolate 持續保存
- `backend/src/services/react-agent/engine.ts:233-308`  
  有 fallback chain：primary provider 失敗後會迭代 `modelConfig.fallback`
- `backend/src/services/pipeline/engine.ts:496-519`  
  各 step timeout 時可降級處理並重設狀態，pipeline 繼續執行但品質降低
- `backend/src/services/react-agent/engine.ts:174-217`  
  當 `maxTurns` / `tokenBudget` 觸發時，會進行最後一輪 no-tools call 萃取答案

**缺口**：

- 沒有在接近 context limit 前先做 context compaction
- 沒有遞迴式 conversation history truncation 策略

**行動方案**：

- 加入 `compactHistory(messages, maxTokens)` 工具，在接近模型 context limit 時優先裁切最舊的非 system 訊息

**工作量**：中

---

### A6. 多模型支援（Multi-Model Support）— 分數：4/5

**狀態**：進階

**證據**：

- `backend/src/services/ai-graph/providers/index.ts`  
  工廠支援 5 家 provider：`cloudflare`、`openai`、`anthropic`、`google`、`github`
- `backend/src/services/react-agent/types.ts:22-30`  
  `ModelMap` 有 7 種 LLM 觸點：`orchestrator`、`hyde`、`multiQuery`、`textToSql`、`rerank`、`judge`、`embedding`，皆可獨立配置
- `backend/src/services/react-agent/types.ts:101-107`  
  `isSmallModel()` 透過模型名稱關鍵字判斷能力，並調整工具 prompt（小模型加 few-shot）
- `backend/src/services/react-agent/pricing.ts`  
  內建各 provider/model 的 USD 成本表

**缺口**：

- 沒有基於成本的自動模型路由（例如超出預算時自動降級）
- 能力判斷是 heuristic（依名稱關鍵字），沒有正式 capability registry

**行動方案**：

- 在 `ModelConfig` 加入 `capabilities: string[]`
- 實作 cost-aware routing：若 `totalCostUSD > threshold`，自動降級到 workers-ai

**工作量**：中

---

### A7. 操作模式（Operational Modes）— 分數：3/5

**狀態**：已實作

**證據**：

- `backend/src/services/query/config.ts:83-87`  
  `rag_strategy` 有 5 種模式：`baseline`、`agentic`、`plan-execute`、`react`、`auto`
- `backend/src/services/react-agent/classifier.ts`  
  Query classifier 可將請求分流到 `greeting` / `system` / `general_knowledge` / `needs_tool`
- `backend/src/services/pipeline/types.ts:136-199`  
  `PipelineConfig` 可逐步 enable/disable；模式也會影響工具可用性

**缺口**：

- 沒有 plan-mode：先規劃、等使用者批准後才執行
- 沒有 sandbox / dry-run mode：可測試但不產生副作用
- 沒有 per-request mode override，必須改 DB config

**行動方案**：

- 在 `AIAskRequest` 加入每次請求可指定的 `mode`
- 加入 `dry_run` 旗標，跳過工具執行，只回傳計畫中的 tool calls

**工作量**：中

---

### A8. 背景執行（Background Execution）— 分數：2/5

**狀態**：部分實作

**證據**：

- `backend/src/routes/ascents.ts:447`  
  `c.executionCtx.waitUntil(recommendationService.generate(...))`：用 Cloudflare `waitUntil` 做 fire-and-forget 推薦生成
- `backend/src/services/react-agent/index.ts:280-285`  
  用 `waitUntil` 執行 async judge、memory extraction
- `backend/src/services/indexing.ts:446`  
  `ctx.waitUntil(this.enrichWithContextualSummaries(...))`

**缺口**：

- 所有背景工作都只靠 `waitUntil`，屬於 request 生命週期內的 fire-and-forget，不是耐久型機制
- 沒有 job queue（例如 Cloudflare Queues）處理可重試／可排程任務
- 沒有任務狀態追蹤，也沒有類似 `ps` / `logs` / `kill` 的控制能力

**行動方案**：

- 導入 Cloudflare Queues 處理可耐久、可重試的背景任務（例如重建索引、大量推薦）
- 增加 `background_jobs` 資料表於 D1，追蹤任務狀態並提供輪詢 API

**工作量**：高

---

### A9. 技能 / 外掛系統（Skill / Plugin System）— 分數：2/5

**狀態**：部分實作

**證據**：

- `.claude/skills/`  
  有 14 個 skill 目錄（code-review、format-commit、openspec-*、pre-commit-check、project-rules）— 供 Claude Code CLI 按需載入的 prompt 模板
- `backend/src/services/react-agent/registry.ts`  
  `ToolRegistry` 透過 `registerTool()` 註冊工具並經 `toAPISchema()` 對外
- `backend/src/services/react-agent/tools/`  
  7 個獨立工具檔在 build time 註冊

**缺口**：

- 沒有 plugin manifest 定義能力、extension points 或 dependencies
- 沒有 plugin marketplace 或外部插件探索；工具全都是 build time 寫死
- `.claude/skills` 與產品內的 tool registry 是兩套互不相通的系統

**行動方案**：

- 定義型別化 `ToolManifest` 介面，描述 capabilities、version、dependencies
- 增加檔案式或 DB 式 plugin loader，讓新工具不必重新部署即可加入

**工作量**：中

---

### A10. Agent Dispatch（代理分派���— 分數：3/5

**狀態**：已實作

**證據**：

- `backend/src/services/ai-graph/graphs/plan-execute.ts`  
  使用 LangGraph `Send` API 的 Plan-and-Execute graph，可平行派發 subagent，採 map-reduce 模式
- `backend/src/services/ai-graph/nodes/planning.ts:14`  
  `PlanStepExtended` 包含 `depends_on: number[]`，可做依賴感知排程
- `backend/src/services/react-agent/classifier.ts`  
  在 dispatch 前先進行 agent type classification
- `.worktrees/python-ai-service/`  
  有獨立 Python AI service 的 Git worktree，可做隔離式開發

**缺口**：

- 沒有並行 plan step 間的 inter-agent communication protocol
- 沒有 per-agent 權限隔離
- 沒有 coordinator 模式讓一個 agent 委派給具名 specialist agents

**行動方案**：

- 在 `GraphState` 增加 inter-step result-passing，讓依賴步驟可讀取 `depends_on` 的輸出
- 在 ToolRegistry 層加上 permission tags

**工作量**：中

---

### A11. 輸出控制（Output Control）— 分數：3/5

**狀態**：已實作

**證據**：

- `backend/src/routes/ai.ts:1`  
  `streamSSE` 支援 `?stream=true`，可逐 token SSE 輸出，最後送 `{"type":"done",...}`
- `backend/src/services/react-agent/types.ts`  
  定義了 `ProgressEvent` 與 `onProgress` callback
- `backend/src/utils/guardrails.ts:143`  
  輸出長度會依可配置的 `maxLength`（預設 3000 字元）截斷

**缺口**：

- 沒有使用者可選的命名輸出風格（verbose / concise）；目前只有 streaming / non-streaming 差異
- 沒有工具層級的輸出格式組裝

**行動方案**：

- 在 `/ask` endpoint 加入 `response_style: 'brief' | 'detailed' | 'structured'`
- 在 `Tool` 介面支援 per-tool output template，用於格式化 `observation`

**工作量**：低

---

### A12. 規劃與任務管理（Planning & Task Management）— 分數：3/5

**狀態**：已實作

**證據**：

- `backend/src/services/ai-graph/graphs/plan-execute.ts`  
  完整的 plan-and-execute LangGraph 流程，可輸出 JSON `ExecutionPlan` 並平行執行 `Send` steps
- `backend/src/services/ai-graph/nodes/planning.ts:62`  
  有 timeout guard、`depends_on` 驗證、避免自我依賴、最大步數限制
- `backend/migrations/0065_plan_execute_config.sql`  
  已有對應 DB migration

**缺口**：

- 計畫是暫態的，沒有跨 session 持久保存執行狀態
- 沒有把「只規劃不執行」的 plan mode 對外暴露給 caller
- 沒有跨 session 的 plan persistence 或 task ownership

**行動方案**：

- 在 D1 增加 `plans` 資料表，保存每個 user session 的 plan 狀態供重播／除錯
- 暴露 `?dry_run=true` 參數，回傳計畫但不執行

**工作量**：中

---

### A13. MCP 整合（MCP Integration）— 分數：0/5

**狀態**：未實作

**證據**：

- 專案根目錄找不到 `.mcp.json`
- 在 `backend/src/` 與 `apps/` 中找不到 `McpServer`、`MCPConnection` 或 MCP client 程式碼
- 所有工具整合都是自訂 HTTP 或 D1 形式

**行動方案**：

- 評估將 ReAct agent 工具（`search-routes`、`sql-query`、`weather` 等）作為 MCP server 對外提供，供外部 agent 使用
- 新增 `.mcp.json`，將現有 Claude Code skills 接入為 MCP tools

**工作量**：高

---

### A14. 安全與隱私（Security & Privacy）— 分數：3/5

**狀態**：已實作

**證據**：

- `backend/src/utils/guardrails.ts`  
  有雙語 prompt injection 偵測（13 種 pattern）、jailbreak 偵測（10 種，含中文變體）、PII 過濾（email、phone）、輸出長度截斷
- `backend/src/services/rank.ts`  
  使用原子 SQL 條件保護進行 quota 扣除
- `backend/migrations/0049_ai_security_guardrails.sql`  
  migration 加入 token limit tracking

**缺口**：

- 沒有 guardrail violation 的稽核軌跡；目前只寫 app logs，沒有進 security events table
- 沒有 OWASP 指南文件或 CI 自動安全掃描
- jailbreak patterns 使用簡單 `includes()`，容易被 Unicode 替代繞過

**行動方案**：

- 將 guardrail violations 寫入專用 `security_events` 資料表，包含 `user_id`、`timestamp`、`triggered_check`、`matched_pattern`
- 在比對 jailbreak patterns 前先做 Unicode normalization

**工作量**：低

---

### A15. 可觀測性與成本追蹤（Observability & Cost Tracking）— 分數：4/5

**狀態**：進階

**證據**：

- `backend/src/utils/langfuse.ts`  
  完整 Langfuse 整合：`createTrace()`、`startSpan()`、`logGeneration()`，記錄 model、token usage、duration；若 key 缺失可優雅降級
- `backend/src/services/react-agent/tracker.ts`  
  `DefaultTokenTracker` 可依 model / turn 追蹤，並輸出 USD / TWD 成本摘要
- `backend/src/services/react-agent/pricing.ts`  
  價格表涵蓋 5 個 provider，且支援 wildcard fallback
- `backend/src/routes/ai.ts:145`  
  `ai_query_logs` 會記錄 token_count、latency_ms、cache_hit、hyde_triggered、pipeline_trace（完整 JSON）

**缺口**：

- 沒有成本警示或預算閾值通知
- 沒有 distributed trace correlation（回應 header 中沒有 `X-Trace-Id`）

**行動方案**：

- 在 `user_ranks` 加入 `daily_cost_usd` 欄位，超過可配置閾值時觸發警示
- 在 AI 回應中回傳 `X-Trace-Id`，方便前端錯誤與 Langfuse trace 對應

**工作量**：低

---

### A16. IDE 與外部整合（IDE & External Integration）— 分數：0/5

**狀態**：未實作

**證據**：

- 沒有 VSCode extension、JetBrains plugin、LSP server 或 deep-link protocol handler
- 專案本質上是 web/mobile/backend 產品，對外整合僅透過標準 HTTP REST / SSE API
- `.claude/` 內是 Claude Code skills，屬於開發工具，不是產品整合

**行動方案**：

- 實作 universal links / app links，支援 web 到原生 mobile app 深連結（實用性高）
- 發佈一個 VSCode snippet pack，封裝 `/api/v1/ai/ask` 給開發者工具使用（低工作量）

**工作量**：高

---

### A17. 指令系統（Command System）— 分數：2/5

**狀態**：部分實作

**證據**：

- `backend/src/services/react-agent/registry.ts`  
  有可擴充的 `ToolRegistry`
- `backend/src/services/pipeline/registry.ts`  
  `STEP_REGISTRY` 有 14 個 pipeline steps，具備 `id`、`name`、`description`、`phase`、`defaultEnabled`、`defaultOrder`、`skipWhen` 等 metadata
- `.claude/skills/`  
  有 14 個 project-level skills；`.worktrees/python-ai-service/.claude/commands/` 有 8 個 Claude Code slash commands

**缺口**：

- 產品端沒有面向使用者的 slash command 介面（如 `/recommend`、`/stats`）
- 沒有 keybinding / keymap 系統
- 工具數量只有 7 個，距離 level-5 門檻 50+ 很遠

**行動方案**：

- 為 chat API 增加 slash command 支援（例如 `/recommend`、`/stats`、`/help`）
- 讓工具註冊也能像 `STEP_REGISTRY` 一樣透過 DB 動態配置

**工作量**：中

---

### A18. SDK / 程式化 API — 分數：3/5

**狀態**：已實作

**證據**：

- `packages/api-client/src/core/client.ts`  
  有型別化 `createApiClient(config)` 工廠，支援 auto-retry 與 token refresh
- `packages/api-client/src/index.ts`  
  有乾淨的 public API 匯出面
- 平台 adapter：`packages/api-client/src/web/` 與 `packages/api-client/src/native/`
- `backend/src/services/react-agent/index.ts`  
  `runReactAgent(params: RunReactAgentParams): Promise<ReactAgentResult>` 是型別明確的程式介面入口

**缺口**：

- `api-client` 套件沒有 streaming / event callback 系統；後端雖支援 SSE，但 SDK 沒包裝
- 沒有由 Scalar docs / OpenAPI 自動產生的 client

**行動方案**：

- 在 `api-client` 中暴露 SSE streaming，提供型別化 `onToken` / `onProgress` callback
- 從 `/api/v1/openapi.json` 自動生成 typed client

**工作量**：中

---

### A19. 並發管理（Concurrency Management）— 分數：3/5

**狀態**：已實作

**證據**：

- `backend/src/services/react-agent/types.ts:116`  
  `Tool` 介面有 `concurrencySafe: boolean`
- `backend/src/services/react-agent/engine.ts:330-379`  
  `executeTools()` 會將 safe 工具平行執行、unsafe 工具序列執行
- `backend/src/services/react-agent/resilience.ts`  
  有 per-provider `CircuitBreaker`

**缺口**：

- 沒有共享資源 mutex / lock（例如 KV cache 寫入是 fire-and-forget）
- 沒有應用層級 queue 或 backpressure

**行動方案**：

- 為 cache update 增加 KV write coalescing 或輕量 mutex
- 將既有 `timeout.ts` 接進每個 tool execution

**工作量**：中

---

### A20. 版本遷移（Version Migration）— 分數：2/5

**狀態**：部分實作

**證據**：

- `backend/migrations/`  
  有 68 個依序編號的 `.sql` migration（0001–0068），透過 `pnpm db:migrate` 手動執行
- `backend/docs/database-migration-guide.md`  
  有 migration guide
- `backend/scripts/verify-migration-step-by-step.sh`  
  有手動驗證 helper script

**缺口**：

- 沒有 startup 自動 migration；目前只能靠 Wrangler CLI
- 沒有 rollback / down migrations，都是單向
- 沒有 `schema_version` tracking table

**行動方案**：

- 增加 `schema_version` 資料表，用來偵測與自動執行 pending migrations
- 為每個 migration 撰寫 down migration

**工作量**：高

---

### A21. 檔案操作安全（File Operation Safety）— 分數：0/5

**狀態**：未實作

**證據**：

- ReAct agent 沒有任何檔案操作工具；7 個工具全是唯讀 API / DB 呼叫
- Tool registry 中沒有 file read、write 或 edit 工具

**說明**：  
這個維度對目前的領域型 agent 並不適用。若未來新增檔案工具，應實作 read-before-edit、diff preview、atomic write 等安全機制。

**行動方案**：

- 若未來想要支援檔案編輯：先實作 `readFileTool`，再於 registry 或 engine 層強制 read-before-edit

**工作量**：高（若從零實作）

---

### A22. 沙箱執行環境（Sandbox Execution Environment）— 分數：1/5

**狀態**：部分實作

**證據**：

- Cloudflare Workers runtime 天生提供 OS 層級隔離（無檔案系統、不可任意啟動程序）
- `backend/src/utils/guardrails.ts`  
  有應用層 guardrails（prompt injection、jailbreak、PII）
- `backend/src/services/react-agent/engine.ts:163`  
  有 XML delimiter injection 防護，避免工具結果污染 prompt

**缺口**：

- 沒有工具層級的 network allowlist
- 沒有 per-tool 應用層資源限制

**行動方案**：

- 為工具 `fetch()` 增加 URL allowlist，只允許特定 API
- 把既有 `timeout.ts` 接進 tool execution，限制每個工具執行時間

**工作量**：低（allowlist）/ 中（完整資源限制）

---

### A23. Computer Use — 分數：0/5

**狀態**：未實作

**證據**：

- 在 `backend/src/` 與 `apps/` 中找不到 screenshot、playwright、selenium 或 GUI interaction 相關程式碼
- 7 個 ReAct 工具都只是資料/API 呼叫，沒有瀏覽器或 GUI 操作

**說明**：  
對一個攀岩社群平台 agent 而言，這屬於範圍外。雖然 Claude Code 開發環境中可能有 Playwright MCP 工具，但它們不屬於 NobodyClimb 產品的一部分。

**工作量**：高（若實作）

---

## B. 上下文工程（Context Engineering）— 23/50（46.0%）

### B1. 上下文組裝管線（Context Assembly Pipeline）— 分數：2/5

**狀態**：部分實作

**證據**：

- `backend/src/utils/ai-prompts.ts:3-38`  
  `SYSTEM_PROMPT` 是一整段大型硬編碼字串常數
- `backend/src/services/personalization.ts:79-99`  
  `buildPersonalizedSystemPrompt()` 會拼接 3 個動態 section（memory summary、ascent context、ability level）並 prepend 到 basePrompt
- `backend/src/services/query/config.ts:133-142`  
  `loadPrompts()` 可從 DB 載入 prompt，找不到則 fallback 到硬編碼

**缺口**：

- 沒有 `buildSystemPrompt()` / `assembleSections()` 類型抽象；prompt 建構是臨時拼接
- 沒有 static 與 dynamic section 的 cache boundary
- 沒有 section ordering / priority system，也沒有 parallel resolution

**行動方案**：

- 抽出 `buildContextSections()`，以具名 sections（`base_prompt`、`user_memory`、`ascent_context`、`ability_level`、`rag_context`、`chat_history`）與排序 metadata 組裝
- 區分 static（可 cache）與 dynamic（每 request 計算）sections，加入 `STATIC_BOUNDARY` marker

**工作量**：中

---

### B2. 指令分層與合併（Instruction Layering & Merging）— 分數：2/5

**狀態**：部分實作

**證據**：

- `CLAUDE.md`  
  有 project-level instruction file
- `~/.claude/CLAUDE.md`  
  有使用者全域 instruction file（由 Claude Code runtime 載入）
- `.claude/skills/project-rules/SKILL.md`  
  有 project-specific rules skill file
- 共有 14 份 skill files，涵蓋 commit format、code review、pre-commit checks、OpenSpec workflows

**缺口**：

- 目前只有 2 層指令（global + project）；沒有 folder / feature 層級 CLAUDE.md（如 `backend/CLAUDE.md`、`apps/web/CLAUDE.md`）
- 沒有 per-agent instruction differentiation（RAG agent 與 React agent 共用同一套）
- 沒有 instruction validation 或 reload 機制

**行動方案**：

- 新增 `backend/CLAUDE.md`，記錄 backend-specific coding conventions（Hono patterns、D1 migration rules、repository layer rules）
- 新增 `apps/web/CLAUDE.md`，記錄前端 Next.js 慣例
- 新增 `.claude/skills/ai-agent/SKILL.md`，整理 AI 開發規範

**工作量**：低

---

### B3. 記憶系統（Memory System）— 分數：3/5

**狀態**：已實作

**證據**：

- `backend/src/repositories/memory.ts:4-11`  
  `UserMemory` 介面具備型別化欄位，`memory_type` 可為 `preference`、`behavior`、`fact`
- `backend/src/repositories/memory.ts:27-48`  
  `upsertMemory()` 使用 D1 與 `ON CONFLICT (user_id, memory_key) DO UPDATE`
- `backend/src/services/memory-extractor.ts:39-45`  
  只允許 5 個 memory keys：`climbing_level`、`preferred_region`、`preferred_style`、`preferred_crag`、`goals`
- `backend/src/services/memory-extractor.ts:49-98`  
  用 LLM 從 user query 異步抽取記憶，透過 `waitUntil`
- `backend/src/services/personalization.ts:79-99`  
  對已登入使用者，會將 memory summary 主動注入 system prompt

**缺口**：

- 沒有記憶衰減或新鮮度概念；記憶永久存在
- 沒有 relevance-based recall；無論 query 是否相關，所有記憶都被注入
- 只有 3 種記憶類型與 5 個固定 key，缺乏可擴展分類
- 沒有 negative rules（哪些內容不該儲存）

**行動方案**：

- 依 `updated_at` 做軟性衰減，只注入 90 天內更新的記憶
- 增加 relevance scoring：對 memory keys 做 embedding，只注入與當前 query 語意相關的記憶

**工作量**：中

---

### B4. 對話歷史管理（Conversation History Management）— 分數：3/5

**狀態**：已實作

**證據**：

- `backend/src/routes/ai.ts:631-638`  
  `chat_sessions` 資料表與 `POST /sessions`
- `backend/src/routes/ai.ts:768-798`  
  `chat_messages` 資料表與 `POST /sessions/:id/messages`
- `backend/src/services/query/index.ts:100,103`  
  `chat_history` 只取最後 6 則：`chat_history.slice(-6)`
- `backend/src/services/query/config.ts:60`  
  `chat_history_depth`（預設 6）與 `assistant_history_truncate`（預設 500 chars）可配置

**缺口**：

- 歷史保存是 **client-driven**：前端必須自行呼叫 `/sessions/:id/messages`
- AI query endpoint 不會自動存對話
- 沒有從 session transcript 自動 resume；client 每次都要重送 `chat_history`
- 沒有長 session 的摘要／壓縮機制

**行動方案**：

- 當 request 帶 `session_id` 時，讓 `/ai/ask` 自動將訊息寫入 D1
- 當歷史超過 `chat_history_depth`，自動將較舊對話壓縮成 summary message

**工作量**：中

---

### B5. Token 預算與分配（Token Budget & Allocation）— 分數：3/5

**狀態**：已實作

**證據**：

- `backend/src/services/query/types.ts:79-86`  
  `estimateTokens()` 以字元數 ÷2 估算 token，作為 fallback
- `backend/src/services/query/types.ts:54-76`  
  `PipelineTokenBreakdown` 可按階段追蹤：tool_selection、hyde、multi_query、agentic_decisions、main_generation、judge
- `backend/src/services/react-agent/engine.ts:64-66`  
  有 token budget guard：若 `ctx.tracker.getTotalTokens() >= tokenBudget` 則中止
- `backend/src/services/react-agent/engine.ts:427-430`  
  per-tool result truncation 透過 `tool.maxResultChars`
- `backend/src/services/react-agent/tracker.ts`  
  `DefaultTokenTracker` 可記錄 per-model / per-turn token 使用與成本

**缺口**：

- 沒有在呼叫模型前先做 token 預估
- 沒有 cache-aware token accounting（例如 AI Gateway cache hit 與 miss 沒區分）
- 沒有 mid-pipeline 接近上限時的遞迴壓縮機制

**行動方案**：

- 在呼叫模型前先用字元轉 token 比例做預估，提早偵測 budget overflow
- 當 `recentHistory` token estimate 過高時觸發 `compactHistory()`

**工作量**：中

---

### B6. 動態注入（Dynamic Injection）— 分數：2/5

**狀態**：部分實作

**證據**：

- `backend/src/services/personalization.ts:79-97`  
  `buildPersonalizedSystemPrompt()` 會依 request 動態組裝 system prompt，包含 user memory、ascent data、ability level
- `backend/src/services/query/index.ts:110-125`  
  透過 `Promise.all` 平行抓取 user memory 與 ascent data，再組進 system prompt

**缺口**：

- 沒有 inter-turn system reminder injection
- 沒有 attachment system 或 per-message context scoping
- 沒有 hook-based context injection architecture
- 沒有工具輸出修改（PostToolUse hooks）

**行動方案**：

- 在 pipeline 層加入 hook，允許在多輪對話中間插入 system reminder sections
- 加入 attachment / context-slot 系統，可在執行期注入結構化資料（如當前天氣、岩場狀況）

**工作量**：中

---

### B7. 資訊檢索策略（Information Retrieval Strategy）— 分數：4/5

**狀態**：進階

**證據**：

- `backend/src/services/query/retrieval.ts:30-50`  
  透過 D1 FTS5 index 做 BM25 全文搜尋
- `backend/src/services/ai-graph/nodes/agentic-retrieve.ts:35-60`  
  向量搜尋（Cloudflare Vectorize）與 BM25 平行查詢，再用 RRF 合併
- `backend/src/services/pipeline/steps/`  
  有 14 個命名步驟，包括 `hyde.ts`、`multi-query.ts`、`cross-encoder.ts`、`mmr.ts`、`popularity-rerank.ts`、`self-reflection.ts`、`semantic-cache.ts`
- `backend/src/services/react-agent/cache.ts`  
  `cachedEmbed()` 使用 KV cache，FNV-1a hash key，TTL 24 小時

**缺口**：

- 沒有單一 Worker request 內的 in-memory LRU embedding cache
- 沒有 subagent-based exploration 處理複雜 multi-hop query
- 沒有 post-compact restoration of retrieved documents

**行動方案**：

- 在 Worker request 內實作小型 LRU cache（固定大小 Map + LRU eviction）快取熱門 embedding
- 對複雜多岩場查詢，可考慮 subagent 平行探索

**工作量**：中

---

### B8. 多模態輸入（Multimodal Input）— 分數：0/5

**狀態**：未實作

**證據**：

- AI routes 只接受文字 `query` 與 `chat_history`；沒有 image、audio、file 參數
- `media.ts` 雖可上傳圖片到 R2，但與 AI pipeline 完全分離
- 沒有 vision-capable model 的配置與呼叫

**行動方案**：

- 在 `AIAskRequest` 新增可選 `image_url` 欄位，轉成 base64 並傳給支援 vision 的模型
- 將既有 R2 圖片上傳與 AI chat 整合，支援路線照片分析／分享

**工作量**：高

---

### B9. 上下文淘汰與壓縮（Context Eviction & Compression）— 分數：1/5

**狀態**：部分實作

**證據**：

- `backend/src/services/pipeline/steps/llm-generation.ts:190,194`  
  chat history 只保留 `chat_history_depth`；assistant messages 直接截斷到 `assistant_history_truncate`
- `backend/src/services/react-agent/engine.ts:428-429`  
  工具結果截斷時會加上 `[結果已截斷...]`
- `backend/src/services/query/llm.ts:358`  
  `context.slice(0, contextTruncate)` 用於 judge context

**缺口**：

- 沒有舊歷史摘要；只是粗暴丟掉最舊訊息
- 沒有關鍵事實萃取
- 沒有 compact 前後 hooks 或恢復機制

**行動方案**：

- 實作 `summarizeHistory()`，用 LLM 將舊對話壓成 `[歷史摘要]` system message
- 用 session ID 為 key，將 summary 存入 KV 以支援跨 request 使用

**工作量**：中

---

### B10. 快取策略（Cache Strategy）— 分數：3/5

**狀態**：已實作

**證據**：

- `backend/src/services/query/cache-log.ts:1-45`  
  Semantic cache：用 Vectorize 做相似度搜尋，再從 KV 抓 response，`cacheHit` 會寫進 `ai_query_logs`
- `backend/src/services/pipeline/steps/semantic-cache.ts`  
  semantic cache 是一個命名 pipeline step（`phase: 'pre-retrieval'`、`defaultOrder: 0`）
- `backend/src/services/react-agent/cache.ts`  
  `KVAgentCache` 用於工具結果快取與 embedding cache
- `backend/migrations/0056_semantic_cache_config.sql`  
  cache 閾值與 TTL 可透過 DB 配置
- cache key 包含 user prefix、query hash、history hash、personalization hash

**缺口**：

- 沒有 API-level prompt caching（如 `cache_control` blocks）
- 每次 Anthropic API call 都送完整 system prompt，沒有 cache markers
- 沒有明確 static / dynamic cache boundary 標記
- 沒有 section-level memoization 或 per-section invalidation

**行動方案**：

- 在 Anthropic provider 中，對 static `SYSTEM_PROMPT` block 增加 `cache_control: { type: "ephemeral" }`，並帶 `anthropic-beta: prompt-caching-2024-07-31` header，以降低重複 query 成本
- 在 admin AI dashboard 中加入 `cacheHit` 指標

**工作量**：低

---

## C. 提示詞工程（Prompt Engineering）— 20/30（66.7%）

### C1. 指令撰寫模式（Instruction Writing Patterns）— 分數：4/5

**狀態**：良好

**證據**：

- `backend/src/utils/ai-prompts.ts:4`  
  「**【語言規定（最高優先）】你必須使用繁體中文回答…違反此規定視為嚴重錯誤。**」  
  最高優先規則被放在最前面，且語氣強烈
- `backend/src/utils/ai-prompts.ts:9-14`  
  多條 anti-hallucination 規則，如：  
  「嚴禁推斷資料中未提及的路線關係」  
  「絕對不可假設路線所屬的岩場區域」
- `backend/src/utils/ai-prompts.ts:18`  
  明確 anti-pattern：  
  「列表一律用 - 符號（禁止 *）、禁止使用 ## 標題語法」
- `backend/src/utils/ai-prompts.ts:26-36`  
  SUGGESTIONS 區塊有嚴格條件判斷與禁止開場語
- `.claude/skills/project-rules/SKILL.md:23`  
  「新功能涉及型別或驗證時，**必須放 shared packages**」

**缺口**：

- `REACT_AGENT_SYSTEM_PROMPT` 中沒有專門的 anti-pattern table，禁止事項零散分布
- `SYSTEM_PROMPT` 規則編號不一致
- 沒有明確區分開發者指令與 runtime LLM 指令的優先層級

**行動方案**：

- 在 `SYSTEM_PROMPT` 與 `REACT_AGENT_SYSTEM_PROMPT` 中加入獨立的 `【禁止事項（Anti-patterns）】` 表格段落
- 修正規則編號
- 新增顯式優先層級：P0（語言/幻覺）、P1（格式）、P2（內容風格）

**工作量**：低

---

### C2. 工具描述品質（Tool Description Quality）— 分數：3/5

**狀態**：尚可

**證據**：

- `backend/src/services/react-agent/tools/search-routes.ts:28-39`  
  `prompt()` 是動態的：若是小模型會追加 few-shot examples，若有 `weather` 工具也會補 cross-tool guidance
- `backend/src/services/react-agent/tools/sql-query.ts:49-63`  
  `prompt()` 會依登入狀態調整：登入與未登入使用者得到不同指引
- `backend/src/utils/ai-prompts.ts:92-97`  
  TOOL_SELECTION_PROMPT 有明確 prefer X over Y 指導，例如：  
  「search_sql 與 search_routes 的區別：需要精確數字…」
- `backend/src/services/tool-registry.ts:170-177`  
  `multi_tool` 與 `hybrid` 有明確比較說明

**缺口**：

- 沒有任何工具的「何時不要用」說明
- `recommend.ts` 的 prompt 過於精簡，缺少 prefer-over guidance
- `sql-query.ts` 沒有清楚描述各模板的參數限制

**行動方案**：

- 為每個工具的 `prompt()` 增加 `whenNotToUse`
- 擴充 `recommend.ts`，補上「適合使用時機」與「禁止使用時機」
- 在 `sql-query.ts` 中加入結構化註解，說明各模板參數要求

**工作量**：中

---

### C3. Few-shot 與範例設計（Few-Shot & Example Design）— 分數：3/5

**狀態**：尚可

**證據**：

- `backend/src/utils/ai-prompts.ts:306-315`  
  PLANNING_PROMPT 有 2 組具體 JSON input/output 範例：岩場比較、熱門度 + 分佈查詢
- `backend/src/services/react-agent/tools/search-routes.ts:32-34`  
  小模型動態 few-shot：3 組 input → parameter 範例
- `backend/src/services/react-agent/tools/sql-query.ts:59-60`  
  有 3 組配對範例，含個人攀登查詢
- `.claude/skills/format-commit/SKILL.md:109-125`  
  有完整 commit message 範例

**缺口**：

- 沒有錯誤示例（bad examples），只有 happy path
- PLANNING_PROMPT 沒有展示 `depends_on` 串接這種關鍵 edge case
- `recommend.ts` 與 `weather.ts` 沒有範例
- JUDGE_PROMPT 只有抽象評分尺度，沒有正反範例

**行動方案**：

- 在 SYSTEM_PROMPT 中加上 `❌ 錯誤示例` 與 `✅ 正確示例`
- 在 PLANNING_PROMPT 補一組 `depends_on` 串接範例
- 至少為 `recommend.ts` 加一個範例

**工作量**：低

---

### C4. 推理與思考指引（Reasoning & Thinking Guidance）— 分數：3/5

**狀態**：尚可

**證據**：

- `backend/src/utils/ai-prompts.ts:271-294`  
  AGENTIC_DECISION_PROMPT 定義 6 種命名推理動作（ANSWER、RETRIEVE、BROADEN、SWITCH_TOOL、DECOMPOSE、VERIFY）
- `backend/src/utils/ai-prompts.ts:297-325`  
  PLANNING_PROMPT 是獨立命名階段，要求結構化 JSON 與最大步數限制
- `backend/src/utils/ai-prompts.ts:327-342`  
  SYNTHESIS_PROMPT 明確要求不要輸出最終答案，只整理資料供後續使用
- `.claude/skills/openspec-explore/SKILL.md:13`  
  「IMPORTANT: Explore mode is for thinking, not implementing」

**缺口**：

- 沒有可配置的 thinking budget 或明確 token 配額
- REACT_AGENT_SYSTEM_PROMPT 沒有明確說明何時該先停下來思考再呼叫工具
- 沒有 scratchpad pattern（如 `<thinking>`）

**行動方案**：

- 在 REACT_AGENT_SYSTEM_PROMPT 增加 `【思考流程】` 區塊，例如「先判斷所需工具，再呼叫，最後整合」
- 在 AGENTIC_DECISION_PROMPT 與 PLANNING_PROMPT 暴露 `{thinking_budget}` 變數
- 視情況加入 `<scratchpad>` 指令

**工作量**：中

---

### C5. Guardrails 與邊界控制（Guardrails & Boundary Control）— 分數：4/5

**狀態**：良好

**證據**：

- `backend/src/utils/guardrails.ts:26-55`  
  雙語 prompt injection / jailbreak 關鍵字清單，且可由 DB 配置
- `backend/src/utils/guardrails.ts:185-196`  
  有 PII pattern matching 與自動遮罩、輸出長度截斷
- `backend/src/utils/ai-prompts.ts:220-247`  
  JUDGE_PROMPT 含 `constraint_ok` 欄位，並明示 judge 不得遵從參考資料中的指令性語言
- `backend/src/utils/ai-prompts.ts:9-14`  
  system prompt 內嵌多條 anti-hallucination 規則
- `backend/src/services/react-agent/guards.ts:9-13`  
  Input guard 為 pre-loop 規則式，不必消耗 LLM quota

**缺口**：

- CLAUDE.md 或 skills 中沒有 YAGNI / minimal-change 規則
- jailbreak patterns 採 `includes()`，容易被 Unicode substitution 繞過
- 開發工作流 skills 中沒有 reversibility assessment 指引

**行動方案**：

- 在 CLAUDE.md 加入 YAGNI 規則：「只實作使用者明確要求的功能，不自行擴展範圍」
- 在比對 jailbreak patterns 前做 Unicode normalization
- 在 `code-review/SKILL.md` checklist 補上不可逆操作警告

**工作量**：中

---

### C6. 語氣、風格與使用者適配（Tone, Style & User Adaptation）— 分數：3/5

**狀態**：尚可

**證據**：

- `backend/src/utils/ai-prompts.ts:4`  
  明確強制使用繁體中文
- `backend/src/utils/ai-prompts.ts:192`  
  一般知識回應限制在 300 字內
- `backend/src/services/personalization.ts:79-99`  
  ability level、recent ascents、memory summary 已形成某種程度的個人化
- `backend/src/utils/ai-prompts.ts:18`  
  有 markdown 格式約束
- `backend/src/services/react-agent/tools/recommend.ts:22-25`  
  prompt 會依登入狀態調整

**缺口**：

- REACT_AGENT_SYSTEM_PROMPT 對主回答沒有明確 verbosity / length guidance
- 使用者不能在 session 中選 concise / detailed
- 沒有明確 emoji policy
- 專業程度適配僅影響推薦難度，不影響說明深度與詞彙

**行動方案**：

- 在 REACT_AGENT_SYSTEM_PROMPT 增加 `{response_style}` placeholder，值可為 `concise` / `detailed`
- 加入 emoji policy：「除路線推薦格式使用 ⛰ 外，回答中不使用 emoji」
- 在 SYSTEM_PROMPT 加入預設字數指引：「一般回答控制在 200–400 字」
- 延伸 personalization：新手用較簡單詞彙，進階使用者用較精簡專業語言

**工作量**：中

---

# 行動計畫（依優先順序）

| 優先級 | 維度 | 目前分數 | 目標分數 | 工作量 | 影響 |
|--------|------|----------|----------|--------|------|
| 1 | A13 MCP 整合 | 0 | 2 | 高 | 高 |
| 2 | A1 Hooks / Lifecycle | 1 | 3 | 高 | 高 |
| 3 | B9 上下文淘汰與壓縮 | 1 | 3 | 中 | 高 |
| 4 | B1 上下文組裝管線 | 2 | 4 | 中 | 高 |
| 5 | B2 指令分層 | 2 | 4 | 低 | 中 |
| 6 | B10 快取策略 | 3 | 4 | 低 | 中 |
| 7 | A14 安全與隱私 | 3 | 4 | 低 | 中 |
| 8 | A15 可觀測性 | 4 | 5 | 低 | 中 |
| 9 | A22 沙箱執行 | 1 | 2 | 低 | 中 |
| 10 | C1 指令撰寫 | 4 | 5 | 低 | 中 |
| 11 | C3 Few-shot 範例 | 3 | 4 | 低 | 中 |
| 12 | A2 權限模型 | 2 | 3 | 中 | 中 |
| 13 | B3 記憶系統 | 3 | 4 | 中 | 中 |
| 14 | B4 對話歷史 | 3 | 4 | 中 | 中 |
| 15 | A8 背景執行 | 2 | 3 | 高 | 中 |

---

如果你要，我也可以進一步幫你做下面其中一種版本：

1. **更自然的繁中潤稿版**（不是逐句直譯，會比較像正式顧問報告）
2. **保留英文術語的雙語版**（適合工程團隊內部討論）
3. **濃縮成高層摘要版**（適合拿去跟 PM / 老闆報告）
4. **轉成 Markdown 可直接貼到文件裡的版本**
