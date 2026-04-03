## Context

NobodyClimb 目前有兩套 AI 系統（pipeline engine、ai-graph），各自實作三種策略（baseline、agentic、plan-execute），共六條路徑處理同一件事。兩套系統的共同瓶頸是 LLM 只在入口做一次 tool selection，之後走固定管線，無法動態組合工具。

參考 Claude Code 的 ReAct + Tool Use 架構，新增第三套系統 `react-agent`，讓 LLM 透過 tool_use API 每步動態選擇工具。現有兩套系統不動，三套透過 `rag_strategy` config 並行切換。

每個 LLM 觸點可獨立配置 provider（Workers AI、Anthropic、OpenAI、Google、GitHub Models）和模型。

## Goals / Non-Goals

**Goals:**
- 提升回答品質：LLM 可以組合多個資料源（路線 + 天氣 + 用戶能力）回答複雜問題
- 動態策略：簡單問題 0 tool call 直接回答，複雜問題多輪工具呼叫
- 易擴展：加新能力 = 寫一個 Tool file + 註冊，不影響其他
- 多 provider 多模型彈性：每個 LLM 觸點獨立配置 provider + 模型，DB 即時切換不用重新部署
- 三套並行 A/B 測試：用數據驅動決策

**Non-Goals:**
- 不取代現有 pipeline/ai-graph（並行共存）
- 不做 sub-agent spawning（攀岩問答場景不需要嵌套 agent）
- 不做 permission system（後端服務不需要）
- 不做 streaming tool execution（tool 執行本身不 stream，但透過 SSE progress events 推送執行狀態）
- 不做 context auto-compact（maxTurns=3，不會爆 context）
- 不做 tool deferred loading（7 個 tool 全載入，~1400 tokens，但 interface 預留 tags/alwaysLoad 欄位）

## Decisions

### 1. ReAct loop 自建，不用 LangGraph

**決定**: 外層 orchestrator 用純 TypeScript while loop + tool_use API，不用 LangGraph。

**替代方案**: 用 LangGraph 建 ReAct graph。

**理由**: ReAct loop 是 `while (turns < max) { call LLM → execute tools → observe }` 的簡單模式，不需要 Graph/Node/Edge 的概念。LangGraph 在固定管線（baseline）很適合，但 ReAct 的動態性讓 Graph 的宣告式路由反而是限制。自建 ~150 行，完全掌控，零 library overhead。

### 2. Tool 粗粒度：search_routes 包住整個 RAG pipeline

**決定**: `search_routes` tool 內部包含 embed → search → rerank 全流程，LLM 只看到一個 tool。

**替代方案**: 拆成 embed_query、search_vectors、rerank_results 三個 tool，讓 LLM 自己組合。

**理由**: 拆細會多 2-3 輪 LLM call（+3-6s 延遲），且小模型組合出錯機率高。攀岩場景不需要這種檢索粒度控制。Tool 對 LLM 應該表現為「能力」，不是「實作步驟」。

### 3. 多 provider 多模型，per-觸點配置

**決定**: 每個 LLM 觸點（orchestrator、hyde、multi-query、text-to-sql、rerank、judge、embedding）可獨立配置 provider + 模型。支援 Workers AI、Anthropic、OpenAI、Google、GitHub Models 五個 provider。

**替代方案**: 全部使用 Workers AI；或統一一個 provider + 模型。

**理由**: 不同觸點對 LLM 能力的需求不同。Orchestrator 需要強 tool_use 能力（可能用 Anthropic Claude 或 GitHub Models 的 GPT-4o），tool 內部的 HyDE/query expansion 只需要快速文本生成（用 Workers AI 8B 即可）。GitHub Models 提供免費/低成本的模型推論 API（包含 OpenAI、Meta、Mistral 等模型），適合作為備選 provider。Per-觸點配置允許：
- 成本最佳化：關鍵觸點用好模型，輔助觸點用便宜模型
- 品質最佳化：orchestrator 用 Claude/GPT-4o 保證 tool 選擇準確度
- A/B 測試：只換某個觸點的 provider/模型，精準量化影響
- 配置存 DB，admin dashboard 即時切換，不用改 code 或 redeploy

**預設配置**:
```
orchestrator:  workers-ai / @cf/meta/llama-4-scout-17b-16e-instruct
hyde:          workers-ai / @cf/meta/llama-3.1-8b-instruct
multiQuery:    workers-ai / @cf/meta/llama-3.1-8b-instruct
textToSql:     workers-ai / @cf/meta/llama-3.1-8b-instruct
rerank:        workers-ai / @cf/baai/bge-reranker-v2-m3
judge:         workers-ai / @cf/meta/llama-3.1-8b-instruct
embedding:     workers-ai / @cf/baai/bge-m3
```

### 4. Tool interface 參考 Claude Code 但簡化

**決定**: Tool interface 包含 `prompt()`（動態描述）、`execute()`、`formatResult()`、`concurrencySafe`、`maxResultChars`、`cacheTTL`、`tags`、`alwaysLoad`。不包含 Claude Code 的 permission、React rendering、deferred loading 邏輯。

**理由**: 保留 Claude Code 影響回答品質的核心設計（動態 prompt、並行控制、結果大小控制），去掉 CLI/IDE 場景專屬的功能。tags/alwaysLoad 預留未來 tool 數量增長時的分類載入能力。

**prompt() 動態適配**：參考 Claude Code 的 tool prompt 設計（根據 user type、feature flags、系統能力動態生成），react-agent 的 prompt() 根據三個維度調整輸出：
1. **locale**：中/英/日文描述切換
2. **orchestrator 模型能力**：小模型（Workers AI 8B/17B）附加 few-shot 使用範例，大模型（Claude/GPT-4o）省略以節省 token
3. **可用 tools**：當互補的 tool 共存時附加組合使用提示（如「先查天氣再搜路線」）

搭配 `isSmallModel(config)` helper 判斷模型大小，基於 model 名稱關鍵字（'8b', 'scout', 'mini', 'flash' → 小模型）。

**Tool 命名慣例**: tool 的 `name` 欄位用底線（`search_routes`，符合 function calling API 慣例），tool 的檔案名稱用連字號（`search-routes.ts`，符合 TypeScript 檔案慣例）。

### 5. 並行/串行 tool 執行

**決定**: LLM 一次呼叫多個 tool 時，`concurrencySafe=true` 的 tool 用 `Promise.all` 並行，其他串行。多個 unsafe tool 按回傳順序依次執行。

**替代方案**: 全部串行。

**理由**: search_routes、weather、user_profile 都是唯讀查詢，並行可節省 0.5-1s。參考 Claude Code 的 `isConcurrencySafe()` 模式。

### 6. 錯誤處理：不中斷，送回 LLM + 重複失敗保護

**決定**: tool 執行失敗時，包成 `is_error: true` 的 tool_result 送回 LLM，loop 繼續。同一個 tool 連續失敗 2 次，自動從該 turn 的可用 tool 列表移除，防止無限重試。

**替代方案**: tool 失敗就中斷整個 query。

**理由**: Claude Code 的核心模式。LLM 可以根據錯誤訊息自行修正策略（換個 tool 或直接回答）。加上重複失敗保護防止 LLM 固執地重試同一個失敗的 tool。

### 7. 品質守衛：規則同步 + judge 非同步，input guard 用規則式

**決定**: 最終回答先過規則式檢查（長度、有引用、無 system prompt 洩漏），通過後非同步跑 LLM judge（groundedness + quality），結果寫 log 不擋回應。Input guardrail 複用現有 `checkInput()` 函數（規則式，不用 LLM）。

**替代方案**: 每輪都 judge；或完全不 judge；或 input guard 用 LLM。

**理由**: ReAct loop 本身是 self-correcting（LLM 觀察結果不好會自己改策略），不需要每輪額外 judge。Input guard 用規則式足夠且零延遲。ModelMap 中不需要 inputGuard 觸點（從 8 個減為 7 個）。

### 8. Provider 擴展：所有 provider 新增 chatWithTools()

**決定**: 在現有 AIProvider interface 新增 `chatWithTools(messages, tools, opts)` method。所有 provider（Workers AI、Anthropic、OpenAI、Google、GitHub Models）各自實作 adapter，回傳統一的 `ToolUseResponse` 格式。

**理由**: 各家 API 的 function calling / tool_use 格式不同（Anthropic 用 content blocks、OpenAI 用 function 物件、Workers AI 用自己的格式、GitHub Models 使用 OpenAI 相容 API），需要 adapter 層統一。每個 provider ~50 行 adapter code。GitHub Models adapter 可大部分複用 OpenAI adapter（API 相容）。

### 9. Tool result 大小控制：engine 負責截斷

**決定**: tool 的 `formatResult()` 只負責格式化（raw → 結構化文字），engine 統一負責截斷。超過 `maxResultChars` 時截斷 + 附摘要「[結果已截斷，共 N 筆，顯示前 M 筆]」。

**替代方案**: 由 tool 自己控制大小；或用 KV 儲存大結果。

**理由**: 職責分離。Tool 不需要知道 context window 限制，engine 統一管理。Workers 沒有檔案系統，3 turns 內 context 不會太大，截斷足夠。

### 10. 防禦性 tool_use 解析

**決定**: engine 的 tool call 解析需要 robust parsing，處理 Workers AI 可能的格式不一致（多空格、string 而非 object、markdown 包裹的 JSON）。

**理由**: Workers AI 的 Llama 模型在 function calling 上偶爾格式不標準，比 Anthropic/OpenAI 更需要容錯解析。

### 11. Semantic cache 區分 strategy

**決定**: semantic cache key 包含 `rag_strategy` 標籤。react 的快取結果不會被 baseline/agentic 命中，反之亦然。

**理由**: 不同 strategy 對同一查詢可能產生品質差異很大的回答，混用快取會導致不一致的用戶體驗和 A/B 測試污染。

### 12. Turn 計算方式

**決定**: 1 turn = 1 次 orchestrator LLM call。一個 turn 裡無論呼叫幾個 tool 都算 1 turn。

**理由**: turn 是 LLM 的「思考次數」，不是 tool 的「執行次數」。LLM 一次呼叫 3 個 tool 跟呼叫 1 個 tool 都是一次推理。

### 13. 守衛優先順序

**決定**: 檢查順序為 semantic_cache → embedding_cache → input_guard → （進入 loop）→ tool_result_cache → token_budget → maxTurns → end_turn。

**理由**: 
- semantic_cache 最先：命中就不用做任何事
- input_guard 在 loop 前：有害輸入不應進入 loop
- token_budget 在 maxTurns 前：token 花光比輪數到更緊急

### 14. 多層 Cache 體系

**決定**: 在 semantic cache 之外，新增三層 cache 機制：

1. **Embedding Cache**：`hash(text + model)` → 向量，TTL 24hr。避免同一文字在 semantic cache 查詢 + RAG 檢索中被重複 embed。
2. **Tool Result Cache**：`tool_name + hash(params)` → ToolResult，TTL 由各 tool 自定。同一對話或跨對話中，相同參數的 tool 呼叫直接回 cache。
3. **Entity Cache**（延後實作）：`entity_type + id` → 靜態資料，TTL 6hr。岩場基本資訊（座標、交通、設施）更新頻率極低，跨對話共享。介面預留 namespace `entity:{type}`，具體填入邏輯待 tool result cache 上線後評估命中率再決定是否實作。

**替代方案**: 只做 semantic cache（查詢層），不做工具層和資料層 cache。

**理由**: 
- Embedding 是最常被重複執行的操作（semantic cache 查詢 + RAG 都需要），cache 命中率高
- ReAct loop 中 LLM 常重複呼叫同一 tool（如多次 search_routes 加不同 filter），tool result cache 能省 DB 查詢和延遲
- 岩場基本資料幾乎不變，6hr TTL 的 entity cache 能大幅降低 D1 查詢量
- 三層 cache 各自獨立，可逐步上線

**per-tool TTL 設計**:
```
weather:        30min  — 天氣預報更新頻率約 1hr
crag_info:       6hr  — 岩場基本資訊極少變動
search_crags:    6hr  — 岩場列表極少變動
search_routes:   1hr  — 路線資料偶有更新（新評論、評分）
user_profile:   10min — 用戶可能剛記錄新攀登
recommend:       5min — 個人化推薦受 profile 影響，變動快
sql_query:       5min — 結構化數據可能有即時寫入
```

### 15. AgentCache 統一介面

**決定**: 提供統一的 `AgentCache` 介面注入 ToolContext，所有 cache 操作透過此介面，底層使用 Cloudflare KV。

```typescript
interface AgentCache {
  get<T>(namespace: string, key: string): Promise<T | null>
  set<T>(namespace: string, key: string, data: T, ttlSeconds: number): Promise<void>
  invalidate(namespace: string, key?: string): Promise<void>
}
```

**理由**: 
- 統一介面讓 tool 實作不需要知道底層儲存機制
- namespace 區分不同 cache 類型（'embedding', 'tool:weather', 'entity:crag'），方便監控和清除
- Cloudflare KV 原生支援 TTL（expirationTtl 參數），不需要自己管理過期
- 未來可替換底層實作（如改用 R2 + metadata TTL）而不影響 tool 程式碼

### 16. Provider Fallback Chain

**決定**: 每個 LLM 觸點的 ModelConfig 可配置 `fallback` 備援。LLM API 呼叫失敗（5xx、timeout、rate limit）時，自動切換到 fallback provider 重試。

```typescript
interface ModelConfig {
  provider: 'workers-ai' | 'anthropic' | 'openai' | 'google' | 'github'
  model: string
  temperature?: number
  maxTokens?: number
  fallback?: ModelConfig  // 失敗時的備援配置
}
```

**替代方案**: 不做 fallback，失敗就直接回錯誤。

**理由**: 
- Workers AI 和 GitHub Models 是免費/低成本 provider，但穩定度不如付費 API
- 多 provider 是 react-agent 的核心優勢，fallback 讓這個優勢不只是「可以選」，還是「自動切」
- 攀岩平台的用戶不該因為某個 provider 暫時不穩定而看到錯誤頁面
- Fallback 只在 API 錯誤（5xx、timeout、rate limit 429）時觸發，不在 LLM 回答品質差時觸發

**預設 fallback chain**:
```
orchestrator: Workers AI → GitHub Models → Anthropic
其他觸點:     Workers AI → GitHub Models
```

### 17. Retry with Exponential Backoff

**決定**: LLM API 呼叫失敗時，先在同一 provider 內重試（最多 2 次，exponential backoff + jitter），全部失敗後才觸發 fallback。

**重試策略**:
```
第 1 次失敗 → 等 1s + random(0-500ms) 重試
第 2 次失敗 → 等 2s + random(0-500ms) 重試
第 3 次失敗 → 觸發 fallback provider（如有配置）
fallback 也失敗 → 包成 is_error 送回 engine
```

**替代方案**: 失敗直接 fallback，不重試。

**理由**: 
- Workers AI 偶發 502/503 通常是暫時性的，一次重試就能恢復
- 不重試直接 fallback 會過度消耗付費 provider 的 API（Anthropic/OpenAI）
- 加 jitter 避免 thundering herd（多個 request 同時重試打爆 API）
- Cloudflare Workers 有 30s request timeout，retry 2 次（最多等 ~4s）不會超時

**可重試的錯誤**:
- HTTP 429（rate limit）
- HTTP 500/502/503/504（server error）
- Network timeout
- Connection refused

**不可重試的錯誤**:
- HTTP 400（bad request — 參數錯誤，重試也沒用）
- HTTP 401/403（認證失敗）
- HTTP 413（payload too large）

### 18. Provider-Level 成本追蹤（USD + TWD）

**決定**: TokenTracker 除了記錄 token 數，還根據 provider + model 的定價表換算 USD 成本，並以匯率轉換為 TWD。

**替代方案**: 只記錄 token 數，不算成本。

**理由**: 
- 不同 provider 價差 100 倍以上（Workers AI 免費 vs Anthropic $15/M tokens）
- 只看 token 數無法回答「這個月 react strategy 花了多少錢」
- Admin 需要成本數據來決定是否值得用付費 provider 提升品質
- per-query 成本寫入 ai_query_logs，可計算每個 strategy 的單位成本
- TWD 是實際付款幣別，admin dashboard 顯示 TWD 更直覺

**定價表**（存在 code 中，定期更新）:
```typescript
const PRICING: Record<string, { input: number; output: number }> = {
  // per 1M tokens, USD
  'workers-ai/*':              { input: 0,     output: 0 },
  'github/*':                  { input: 0,     output: 0 },
  'anthropic/claude-sonnet':   { input: 3,     output: 15 },
  'anthropic/claude-haiku':    { input: 0.25,  output: 1.25 },
  'openai/gpt-4o':             { input: 2.50,  output: 10 },
  'openai/gpt-4o-mini':        { input: 0.15,  output: 0.60 },
  'google/gemini-2.0-flash':   { input: 0.10,  output: 0.40 },
  'google/gemini-2.5-pro':     { input: 1.25,  output: 10 },
}
```

**匯率策略**: DB 存 `react_usd_to_twd` 匯率（REAL，預設 32.0），admin dashboard 可手動更新。不即時查匯率 API，因為 LLM 成本計算不需要精確到小數點，月結時人工校正即可。
```

## Key Type Definitions

### ToolContext

```typescript
interface ToolContext {
  env: Env                          // Cloudflare Workers bindings (DB, KV, R2, AI)
  userId: string                    // 當前用戶 ID（需登入）
  locale: string                    // 'zh-TW' | 'en' | 'ja'
  models: ModelMap                  // per-觸點的 provider + model 配置
  queryService: QueryService        // 複用現有 query service（search, embed, SQL 等）
  langfuseTrace?: LangfuseTraceClient  // 可選的 tracing
  tracker: TokenTracker             // token 追蹤
  cache: AgentCache                 // 多層 cache（embedding, tool result, entity）
  availableTools: string[]          // 當前已註冊的 tool 名稱列表
}

interface AgentCache {
  get<T>(namespace: string, key: string): Promise<T | null>
  set<T>(namespace: string, key: string, data: T, ttlSeconds: number): Promise<void>
  invalidate(namespace: string, key?: string): Promise<void>
}
```

### ToolResult

```typescript
interface ToolResult {
  content: string                   // 給 LLM 看的格式化文字
  metadata?: Record<string, unknown> // 給 trace/log 用（如 resultCount, latencyMs）
}
```

### ModelConfig & ModelMap

```typescript
interface ModelConfig {
  provider: 'workers-ai' | 'anthropic' | 'openai' | 'google' | 'github'
  model: string                     // e.g. '@cf/meta/llama-4-scout-17b-16e-instruct'
  temperature?: number
  maxTokens?: number
  fallback?: ModelConfig            // 失敗時的備援配置（可鏈式）
}

interface ModelMap {
  orchestrator: ModelConfig
  hyde: ModelConfig
  multiQuery: ModelConfig
  textToSql: ModelConfig
  rerank: ModelConfig
  judge: ModelConfig
  embedding: ModelConfig
}
```

### DB Schema (ai_config additions)

```
react_models:       TEXT (JSON) — ModelMap JSON，null 時用預設值
react_max_turns:    INTEGER — 預設 3
react_token_budget: INTEGER — 預設 8000
react_usd_to_twd:  REAL — USD→TWD 匯率，預設 32.0
```

### Langfuse Span Hierarchy

```
trace: react-agent (name=query text)
  └ span: turn-1
    ├ generation: orchestrator-call (model, tokens, duration)
    ├ span: tool:search_routes (duration)
    │  └ generation: hyde (model=8B, tokens)
    │  └ span: embedding (model=bge-m3)
    │  └ span: hybrid-search
    └ span: tool:weather (duration)
  └ span: turn-2
    ├ generation: orchestrator-call
    └ span: tool:user_profile
  └ span: turn-3
    └ generation: orchestrator-final-answer (model, tokens)
  └ span: judge (async, model, scores)
```

## Risks / Trade-offs

- **Workers AI tool_use 穩定度** → 防禦性解析 + fallback（解析失敗視為 end_turn）。如果 Workers AI 不夠穩定，orchestrator 可即時切換到 Anthropic/OpenAI/GitHub Models
- **延遲增加**（多輪 LLM call）→ maxTurns=3 硬上限，簡單問題 1 turn ~2-3s，複雜 3 turns ~6-9s。最後一輪 streaming 降低體感延遲
- **Workers AI 中文 tool description 理解力** → tool prompt 用簡潔中英混合，關鍵 parameter name 用英文。或切換 orchestrator 到 Anthropic Claude
- **三套系統維護成本** → react-agent 設計為獨立模組，不與 pipeline/ai-graph 耦合。長期根據 A/B 數據 deprecate 表現差的
- **Tool 內部 LLM 呼叫的 token 追蹤** → per-觸點追蹤確保可見性，Langfuse span 標記 provider + 模型名稱
- **多 provider 成本控制** → 用 Anthropic/OpenAI 的觸點會產生 API 費用，GitHub Models 提供免費額度但有 rate limit，token tracker 記錄 per-provider 成本，admin 可隨時切回 Workers AI

## Migration Plan

1. 新增 `react-agent/` 目錄，不修改現有 pipeline/ai-graph 程式碼
2. 在 `ai_config` DB 新增 react 相關欄位（react_models TEXT, react_max_turns INTEGER, react_token_budget INTEGER），預設 disabled
3. 在 `routes/ai.ts` 新增 `react` strategy 路由分支
4. 所有 provider（Workers AI、Anthropic、OpenAI、Google、GitHub Models）擴展 `chatWithTools()` method
5. 逐步建置 7 個 tools，每個 tool 可獨立測試
6. Admin dashboard 啟用 `react` strategy，開始 A/B 測試
7. 回滾：config 切回 baseline/agentic/plan-execute 即可，零程式碼改動

### 19. Circuit Breaker

**決定**: 每個 provider 維護一個 circuit breaker 狀態。連續失敗超過閾值後，短時間內直接跳過該 provider，走 fallback，避免浪費 retry 時間。

**狀態機**:
```
CLOSED（正常）→ 連續失敗 >= 3 次 → OPEN（熔斷）
OPEN → 經過 cooldown（30s）→ HALF_OPEN（試探）
HALF_OPEN → 成功 → CLOSED / 失敗 → OPEN
```

**替代方案**: 不做 circuit breaker，每次都 retry + fallback。

**理由**: 
- Workers AI 偶爾會整段時間不穩定（不是單次失敗），retry 3 次 × backoff 要等 ~4s 才觸發 fallback
- Circuit breaker OPEN 時直接走 fallback，延遲從 4s 降到 <1s
- 狀態存 in-memory（Workers isolate 級別），不需要跨 request 共享——同一個 isolate 短時間內處理的 request 自然共享狀態

### 20. 查詢分類快速路徑

**決定**: 在 ReAct loop 前加一個規則式分類器。閒聊和通用知識問題跳過 orchestrator LLM call，直接用小模型回答。

**分類規則**（規則式，不用 LLM）:
```
1. 打招呼（「你好」「嗨」「hello」）→ 固定回覆，0 LLM call
2. 系統問題（「你是誰」「你會什麼」）→ 固定回覆，0 LLM call
3. 通用攀岩知識（「難度分級有哪些」「什麼是 flash」）→ 小模型直接回答，不進 ReAct loop
4. 其他 → 進 ReAct loop
```

**替代方案**: 所有查詢都進 ReAct loop，靠 LLM 自己判斷是否需要 tool。

**理由**: 
- 閒聊查詢佔比可能 10-20%，每個都消耗一次 orchestrator LLM call
- 規則式分類零延遲零成本，keyword matching 就能處理前兩類
- 第三類（通用知識）可用 Workers AI 8B 直接回答，比 orchestrator 便宜且快
- 分類錯誤的代價很低——最壞情況是本該用 tool 的查詢被小模型回答，品質差一點但不會出錯

### 21. Admin 成本 Dashboard

**決定**: 在 admin dashboard 新增成本分析頁面，聚合 ai_query_logs 的成本數據。

**Dashboard 內容**:
- 每日/每週/每月成本趨勢圖（TWD）
- 按 strategy 分（baseline vs agentic vs react）
- 按 provider 分（Workers AI vs Anthropic vs OpenAI...）
- 按觸點分（orchestrator vs hyde vs judge...）
- 平均每次查詢成本（per strategy）
- Fallback 觸發率
- Cache hit rate（semantic / tool result）

**理由**: 有了 USD + TWD 成本追蹤數據，需要可視化界面讓 admin 做決策（哪個 strategy 性價比最高、哪個觸點最貴可以降級）。

### 22. 異常告警

**決定**: 基於 ai_query_logs 數據，定義告警規則。觸發時透過現有通知管道發送。

**告警規則**:
- 單日成本超過 TWD 閾值（admin 可配置，預設 NT$500）
- 某 provider 錯誤率超過 30%（1 小時內）
- 品質分數（judge groundedness）平均值低於 2.0（1 小時內）
- Fallback 觸發率超過 50%（1 小時內）

**替代方案**: 不做告警，靠 admin 自己看 dashboard。

**理由**: 成本失控和品質驟降需要即時發現，不能等 admin 偶爾打開 dashboard 才看到。告警規則存 DB，admin 可調整閾值。

## Open Questions

- Workers AI llama-4-scout 的 function calling 實測表現如何？需要先做 spike 驗證 tool_use 格式穩定度
- ~~是否需要在 tool prompt 中加入 few-shot examples 來引導 Workers AI 更準確地選工具？~~ → 已決定（Decision 4）：小模型自動附加 few-shot，大模型省略
