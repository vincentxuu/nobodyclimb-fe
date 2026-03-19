# nobodyclimb-ai 服務規劃

**日期**：2026-03-20
**參考**：claude-architect-exercises 四大核心模式
**狀態**：已核准，待實作

---

## 概覽

`nobodyclimb-ai` 是一個獨立的 AI API 服務，以 Hono + Cloudflare Workers 架構建構，負責處理 nobodyclimb 平台所有 AI 相關功能。

nobodyclimb backend 透過 **Cloudflare Service Binding** 呼叫此服務，零延遲、不走公網。

### 核心設計原則

架構直接對應 claude-architect-exercises 的四個核心模式：

| claude-architect-exercises | nobodyclimb-ai 對應實作 |
|---|---|
| ex1：Agentic Loop（stop_reason 驅動） | `AgentRunner`：工具迴圈控制 |
| ex1：Programmatic Gates + Hooks | `ToolRegistry`：前置條件檢查 + 攔截 |
| ex3：Forced tool_use 結構化擷取 | `Extractor`：強制結構化輸出 |
| ex4：asyncio.gather 並行 subagent | `Orchestrator`：`Promise.all` 並行執行 |

---

## 技術棧

- **語言**：TypeScript
- **框架**：Hono（Cloudflare Workers 上）
- **部署**：Cloudflare Workers（獨立 repo：`nobodyclimb-ai`）
- **呼叫方式**：Cloudflare Service Binding（from nobodyclimb backend）
- **AI Provider**：可切換（Anthropic / Cloudflare Workers AI / OpenAI）

---

## 第一節：整體架構

### 資料流

```
nobodyclimb backend
       ↓ Cloudflare Service Binding（傳入 userId + 預取的 user context）
  nobodyclimb-ai (Hono)
       ↓
  Auth Middleware（驗證 userId / gate 條件）
       ↓
  Router → AgentRunner / Extractor / Orchestrator
       ↓
  ToolRegistry（工具執行 + 前置條件 + hooks）
       ↓
  AIProvider interface
       ↓
  Anthropic | Cloudflare Workers AI | OpenAI
```

### Provider 抽象層

所有 AI 呼叫統一透過 `AIProvider` interface，上層邏輯不依賴任何特定 provider。

```typescript
// providers/base.ts
interface AIProvider {
  chat(messages: Message[], options: ChatOptions): Promise<ChatResponse>
  embed(text: string): Promise<number[]>
  // 回傳 ReadableStream 以相容 Cloudflare Workers（不使用 AsyncIterable generator）
  stream(messages: Message[], options: ChatOptions): Promise<ReadableStream<Uint8Array>>
}
```

三個 provider 實作：`AnthropicProvider`、`CloudflareProvider`、`OpenAIProvider`。

### Provider 選擇機制

**Deploy-time 預設**：`wrangler.toml` 的 `[vars]` 設定預設 provider：

```toml
[vars]
AI_PROVIDER = "anthropic"  # anthropic | cloudflare | openai
```

**Per-request override**：請求 body 可帶 `provider` 欄位覆蓋預設值，讓 nobodyclimb backend 依任務類型動態選擇（例：embedding 用 cloudflare、複雜推理用 anthropic）：

```typescript
// 請求 body 範例
{ "query": "...", "provider": "anthropic" }  // 覆蓋 deploy-time 預設
```

---

## 第二節：Agent 層（對應 ex1）

### AgentRunner — stop_reason 驅動的迴圈

```typescript
// agents/runner.ts
const MAX_ITERATIONS = 10  // 防止無限迴圈

class AgentRunner {
  async run(session: AgentSession): Promise<AgentResult> {
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const response = await this.provider.chat(session.messages, {
        tools: this.registry.getTools(session),
      })

      if (response.stop_reason === 'end_turn') break
      if (response.stop_reason === 'tool_use') {
        const results = await this.registry.execute(response.tool_calls, session)
        session.appendToolResults(results)
      }

      if (i === MAX_ITERATIONS - 1) {
        // 達到上限：回傳 partial result，標記 truncated: true
        return session.toResult({ truncated: true })
      }
    }
    return session.toResult()
  }
}
```

**Cloudflare Workers 執行時間限制**：
- 單一 AgentRunner 最多 `MAX_ITERATIONS = 10` 輪
- Orchestrator 內的 subagent runner 另設 `MAX_ITERATIONS = 5`
- 估算每輪 LLM 呼叫 2-3 秒，10 輪約 20-30 秒，符合 Workers 130 秒上限（付費方案）
- 若使用免費方案（30 秒限制），`MAX_ITERATIONS` 調降為 3

### Session 狀態管理

**單次請求內**（大多數情況）：`AgentSession` 僅存在於 request lifecycle，包含當次對話歷史。

**多輪對話**（故事生成助手）：需跨 HTTP 請求保持狀態。使用 **Cloudflare KV** 儲存 session：

```typescript
// session 存取
const sessionId = crypto.randomUUID()
await env.AI_KV.put(`session:${sessionId}`, JSON.stringify(session), {
  expirationTtl: 3600  // 1 小時
})
// 回傳 sessionId 給 nobodyclimb backend，下次請求帶入
```

### ToolRegistry — Programmatic Gates + Hooks

```typescript
// agents/tool-registry.ts
class ToolRegistry {
  // Gate：工具前置條件（例：userId 存在才能取得個人推薦）
  checkGate(tool: string, session: AgentSession): GateResult
  // { allowed: true } | { allowed: false, reason: string }

  // Hooks：工具執行前後攔截
  onBeforeTool(tool: string, args: unknown): void   // 記錄 log、費用追蹤
  onAfterTool(tool: string, result: unknown): void  // 更新 session 狀態
}
```

### 工具清單

| 工具名稱 | 資料來源 | 輸入 | 輸出 | Gate |
|---|---|---|---|---|
| `search_knowledge` | Cloudflare Vectorize + D1 | `{ query: string, limit: number }` | `{ chunks: KnowledgeChunk[] }` | 無 |
| `get_route_info` | request payload（預取） | `{ routeId: string }` | `{ route: Route }` | 無 |
| `vector_search` | Cloudflare Vectorize | `{ embedding: number[], limit: number }` | `{ results: VectorResult[] }` | 無 |
| `fulltext_search` | D1 FTS | `{ query: string, limit: number }` | `{ results: TextResult[] }` | 無 |
| `synthesize` | 內部（組合結果） | `{ results: SearchResult[] }` | `{ summary: string }` | 無 |
| `get_user_ascents` | request payload（預取） | `{ userId: string }` | `{ ascents: Ascent[] }` | userId 必填 |
| `match_routes` | D1 | `{ grade: string, type: string[] }` | `{ routes: Route[] }` | 無 |
| `ask_question` | 內部（引導問題） | `{ topic: string }` | `{ question: string }` | 無 |
| `draft_story` | 內部（生成初稿） | `{ answers: Answer[] }` | `{ draft: string }` | 至少 3 個 answers |
| `suggest_edit` | 內部（修改建議） | `{ draft: string }` | `{ suggestions: string[] }` | draft 必填 |

**避免循環 Service Binding**：nobodyclimb-ai **不持有** nobodyclimb backend 的 Service Binding。需要的使用者資料（ascents、user profile）由 **nobodyclimb backend 在呼叫時預取並放入 request payload**，nobodyclimb-ai 只讀取 payload，不主動回呼 backend。

---

## 第三節：Extractor（對應 ex3）+ Orchestrator（對應 ex4）

### Extractor — Forced tool_use 結構化擷取

```typescript
// extraction/extractor.ts
class Extractor {
  async extract<T>(input: string, schema: ExtractionSchema<T>): Promise<T> {
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await this.provider.chat([...], {
        tools: [schema.toTool()],
        tool_choice: { type: 'any' },  // 強制 tool_use
      })

      if (response.tool_calls?.[0]) {
        const result = schema.validate(response.tool_calls[0].input)
        if (result.success) return result.data
        // validation 失敗：第二次嘗試帶入錯誤訊息讓模型修正
      }
    }
    // 兩次嘗試後仍失敗：回傳 ExtractionError，由 route handler 回 422
    throw new ExtractionError('extraction_failed')
  }
}
```

**失敗行為**：Extractor 失敗回傳 HTTP 422，body 包含 `{ error: 'extraction_failed', input }` 讓 nobodyclimb backend 決策（例：顯示手動輸入表單）。

兩個主要 Extractor：

- **RouteExtractor**：從文字 / 影片描述擷取 `{ name, grade, type, description }`
- **AscentExtractor**：從自然語言擷取 `{ date, cragId, routeId, grade, notes }`

### Orchestrator — Promise.all 並行 subagent

```typescript
// orchestrator/training-orchestrator.ts
// 每個 subagent 使用 MAX_ITERATIONS = 5 的 AgentRunner
class TrainingPlanOrchestrator {
  async run(ctx: UserContext): Promise<TrainingPlan> {
    const [strengthResult, routeResult, scheduleResult] = await Promise.all([
      this.strengthAgent.run(ctx),   // subagent，最多 5 輪
      this.routeMatchAgent.run(ctx), // subagent，最多 5 輪
      this.scheduleAgent.run(ctx),   // subagent，最多 5 輪
    ])

    // 彙整結果 + 標註缺漏（對應 ex4 coverage gap annotation）
    return this.synthesize(strengthResult, routeResult, scheduleResult)
  }

  private synthesize(
    strength: SubagentResult<StrengthAnalysis>,
    routes: SubagentResult<RouteMatch[]>,
    schedule: SubagentResult<Schedule>,
  ): TrainingPlan {
    return {
      plan: buildPlan(strength.data, routes.data, schedule.data),
      gaps: [strength, routes, schedule]
        .filter(r => !r.success)
        .map(r => r.error?.message),
    }
  }
}
```

**執行時間估算**：三個 subagent 並行，各最多 5 輪（約 10-15 秒），總計約 15-20 秒，符合付費 Workers 限制。

### SubagentResult 錯誤傳遞

```typescript
interface SubagentResult<T> {
  success: boolean
  data?: T
  error?: {
    category: 'transient' | 'validation' | 'business'
    message: string
  }
  truncated?: boolean  // AgentRunner 達到 MAX_ITERATIONS
}
```

---

## 第四節：Hono API 路由 + 錯誤處理

### API 端點

```
POST /ai/rag/query          → RAG 問答（支援 SSE streaming）
POST /ai/rag/agentic        → Agentic 多步搜尋
POST /ai/extract/route      → 路線資料擷取
POST /ai/extract/ascent     → 攀登記錄擷取
POST /ai/recommend/routes   → 個人化路線推薦
POST /ai/story/guide        → 故事生成引導（多輪）
POST /ai/plan/training      → 訓練計畫（multi-agent）

GET  /ai/health             → provider 狀態確認
GET  /ai/provider           → 目前使用的 provider
```

### SSE Streaming 合約

`/ai/rag/query` 支援 SSE。nobodyclimb backend 透過 Service Binding 呼叫後，**直接 proxy ReadableStream** 給前端，不緩衝：

```typescript
// nobodyclimb backend
const aiResponse = await env.AI_SERVICE.fetch(req)
return new Response(aiResponse.body, {
  headers: { 'Content-Type': 'text/event-stream' }
})

// nobodyclimb-ai 回傳格式
data: {"type":"chunk","text":"..."}
data: {"type":"done","sources":[...]}
```

### Request Body 統一結構

```typescript
interface AIRequest {
  // 身份（nobodyclimb backend 傳入，不要求 AI service 驗證 JWT）
  userId?: string
  userContext?: {
    ascents?: Ascent[]       // 預取的攀登紀錄
    profile?: UserProfile    // 預取的使用者資料
  }

  // 功能參數（各 endpoint 自訂）
  query?: string
  sessionId?: string         // 多輪對話用
  provider?: AIProviderType  // per-request override
  [key: string]: unknown
}
```

### HTTP 錯誤碼規範

| 狀況 | HTTP Status | body |
|---|---|---|
| 正常 | 200 | `{ data: ... }` |
| Extractor 失敗 | 422 | `{ error: 'extraction_failed', input }` |
| Gate 未通過 | 403 | `{ error: 'gate_failed', tool, reason }` |
| AgentRunner truncated | 200 | `{ data: ..., truncated: true }` |
| Provider 呼叫失敗（transient） | 503 | `{ error: 'provider_unavailable', category: 'transient' }` |
| 無效請求 | 400 | `{ error: 'invalid_request', details }` |

### 目錄結構

```
nobodyclimb-ai/
├── src/
│   ├── index.ts                      # Hono app entry + Service Binding export
│   ├── providers/
│   │   ├── base.ts                   # AIProvider interface
│   │   ├── factory.ts                # createProvider(env, override?)
│   │   ├── anthropic.ts
│   │   ├── cloudflare.ts
│   │   └── openai.ts
│   ├── agents/
│   │   ├── runner.ts                 # AgentRunner（agentic loop, MAX_ITERATIONS）
│   │   ├── tool-registry.ts          # ToolRegistry（gates + hooks）
│   │   ├── session.ts                # AgentSession state（+ KV 多輪持久化）
│   │   ├── rag-agent.ts
│   │   ├── story-agent.ts
│   │   └── recommend-agent.ts
│   ├── extraction/
│   │   ├── extractor.ts              # Extractor base（forced tool_use + retry）
│   │   ├── route-extractor.ts
│   │   └── ascent-extractor.ts
│   ├── orchestrator/
│   │   ├── base.ts                   # SubagentResult + error types
│   │   └── training-orchestrator.ts
│   ├── routes/
│   │   ├── rag.ts
│   │   ├── extract.ts
│   │   ├── recommend.ts
│   │   ├── story.ts
│   │   └── plan.ts
│   ├── middleware/
│   │   └── auth.ts                   # userId 驗證 + gate 前置處理
│   └── types.ts                      # 共用型別（AIRequest, SubagentResult...）
├── test/
├── wrangler.toml
└── package.json
```

---

## 功能模組詳細說明

### 1. RAG 問答
- 單輪：直接 vector search → 組 context → 回答（支援 SSE streaming）
- 多輪：AgentRunner 管理當次對話歷史，工具：`search_knowledge`、`get_route_info`
- 無跨請求狀態需求（每次請求獨立）

### 2. Agentic 搜尋（ReAct）
- AgentRunner 多步推理，工具：`vector_search`、`fulltext_search`、`synthesize`
- 自動判斷何時資訊足夠（stop_reason = end_turn 或達到 MAX_ITERATIONS）

### 3. 結構化資料擷取
- RouteExtractor：處理岩場爬蟲、YouTube 描述文字
- AscentExtractor：使用者自然語言輸入攀登紀錄，自動結構化
- 最多 2 次 retry，失敗回 422

### 4. 個人化推薦
- nobodyclimb backend 預取 user ascents 放入 request payload
- AgentRunner 單步，工具：`get_user_ascents`（讀 payload）、`match_routes`
- Gate：userId 必填，否則 403

### 5. 故事生成助手（多輪）
- 多輪跨請求對話，session 存 KV（TTL 1 小時）
- 工具：`ask_question` → `draft_story`（gate：至少 3 answers）→ `suggest_edit`
- 第一次呼叫回傳 sessionId，後續請求帶入 sessionId 繼續

### 6. 訓練計畫（Multi-Agent Orchestrator）
- 三個 subagent 並行（各 MAX_ITERATIONS=5）：體能分析、路線配對、時程規劃
- 彙整結果，gaps 欄位標註失敗的 subagent
- nobodyclimb backend 預取 user context 放入 payload

---

## 與 nobodyclimb 的整合

```toml
# nobodyclimb backend wrangler.toml
[[services]]
binding = "AI_SERVICE"
service = "nobodyclimb-ai"
```

```typescript
// 呼叫範例（nobodyclimb backend）
const aiResponse = await env.AI_SERVICE.fetch(
  new Request('http://internal/ai/rag/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: ctx.user?.id,
      userContext: { ascents: preloadedAscents },
      query: userQuery,
    }),
  })
)
```

---

## 實作優先順序

1. **Provider 層**（base interface + factory + 三個 adapter）
2. **AgentRunner + ToolRegistry**（核心 agentic loop，含 MAX_ITERATIONS）
3. **RAG 問答**（最高使用頻率，含 SSE）
4. **Extractor**（RouteExtractor + AscentExtractor，含 retry）
5. **故事生成助手**（KV session + multi-turn）
6. **個人化推薦**
7. **Agentic 搜尋**
8. **Orchestrator + 訓練計畫**（最複雜，最後）
