# nobodyclimb-ai Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立全新獨立 repo `nobodyclimb-ai`，完成 Provider 抽象層、AgentRunner、ToolRegistry、KV Session 持久化，讓後續所有 AI 功能模組可以建立在此基礎上。

**Architecture:** 新 Hono + Cloudflare Workers TypeScript 專案，Provider interface 統一所有 AI 呼叫，AgentRunner 實作 stop_reason 驅動的 agentic loop（MAX_ITERATIONS=10），ToolRegistry 管理工具前置條件 gate 與 pre/post hooks，AgentSession 支援 KV 持久化供多輪對話使用。

**Tech Stack:** TypeScript、Hono 4.x、Cloudflare Workers、Wrangler 3.x、Vitest（unit，node env）、@anthropic-ai/sdk、openai、@cloudflare/workers-types

**Testing approach:** `environment: 'node'`（Vitest 單元測試，手動 mock Workers bindings）。Workers runtime 整合測試由 `@cloudflare/vitest-pool-workers` 負責（另行設定，不在本計畫範圍）。

---

## 檔案結構（本計畫完成後）

```
nobodyclimb-ai/
├── src/
│   ├── index.ts                  # Hono app entry（含 GateError → 403 error handler）
│   ├── types.ts                  # AIRequest, AIProvider types, SubagentResult
│   ├── providers/
│   │   ├── base.ts               # AIProvider interface + Message/ChatOptions types
│   │   ├── factory.ts            # createProvider(env, override?)
│   │   ├── anthropic.ts          # AnthropicProvider（embed 不支援，拋出錯誤）
│   │   ├── cloudflare.ts         # CloudflareProvider（bge-m3 embed + llama chat）
│   │   └── openai.ts             # OpenAIProvider
│   ├── agents/
│   │   ├── session.ts            # AgentSession + KV 持久化（saveToKV / loadFromKV）
│   │   ├── tool-registry.ts      # ToolRegistry: gates + hooks（getTools 不過濾，execute 強制 gate）
│   │   └── runner.ts             # AgentRunner: stop_reason loop + MAX_ITERATIONS
│   └── middleware/
│       └── auth.ts               # userId + sessionId 注入 context
├── test/
│   ├── providers/
│   │   ├── factory.test.ts
│   │   ├── anthropic.test.ts
│   │   ├── cloudflare.test.ts
│   │   └── openai.test.ts
│   ├── agents/
│   │   ├── session.test.ts
│   │   ├── tool-registry.test.ts
│   │   └── runner.test.ts
│   └── middleware/
│       └── auth.test.ts
├── wrangler.toml
├── vitest.config.ts
├── tsconfig.json
└── package.json
```

---

### Task 0: 建立專案骨架

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `wrangler.toml`
- Create: `vitest.config.ts`
- Create: `src/index.ts`

- [ ] **Step 1: 建立目錄**

```bash
mkdir -p ~/Projects/nobodyclimb-ai
cd ~/Projects/nobodyclimb-ai
```

- [ ] **Step 2: 初始化 npm + 安裝依賴**

```bash
npm init -y
npm install hono
npm install -D typescript wrangler vitest @cloudflare/workers-types @types/node
npm install @anthropic-ai/sdk openai
```

- [ ] **Step 3: 建立 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "types": ["@cloudflare/workers-types"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitAny": true,
    "outDir": "dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
```

- [ ] **Step 4: 建立 wrangler.toml**

```toml
name = "nobodyclimb-ai"
main = "src/index.ts"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[vars]
AI_PROVIDER = "anthropic"

[[kv_namespaces]]
binding = "AI_KV"
id = "placeholder"
preview_id = "placeholder"
```

- [ ] **Step 5: 建立 vitest.config.ts**

注意：使用 `environment: 'node'`。Workers 全域型別（`Ai`, `KVNamespace`）在測試中以 mock object 傳入，不依賴 Workers runtime。

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
})
```

- [ ] **Step 6: 建立 src/index.ts（最小 Hono app）**

```typescript
import { Hono } from 'hono'

const app = new Hono()

app.get('/ai/health', (c) => c.json({ status: 'ok' }))

export default app
```

- [ ] **Step 7: 確認 TypeScript 可編譯**

```bash
npx tsc --noEmit
```
Expected: 無錯誤

- [ ] **Step 8: Commit**

```bash
git init && git add .
git commit -m "chore: 初始化 nobodyclimb-ai 專案骨架"
```

---

### Task 1: 共用型別（types.ts）

**Files:**
- Create: `src/types.ts`
- Create: `test/types.test.ts`

- [ ] **Step 1: 寫測試**

```typescript
// test/types.test.ts
import { describe, it, expect } from 'vitest'
import type { AIRequest, SubagentResult } from '../src/types'
import { ExtractionError, GateError } from '../src/types'

describe('types', () => {
  it('AIRequest 接受 userId + userContext', () => {
    const req: AIRequest = {
      userId: 'user-123',
      userContext: { ascents: [] },
      query: '如何訓練抱石',
    }
    expect(req.userId).toBe('user-123')
  })

  it('SubagentResult 成功案例', () => {
    const result: SubagentResult<string> = {
      success: true,
      data: 'some result',
    }
    expect(result.success).toBe(true)
  })

  it('SubagentResult 失敗案例有 error.category', () => {
    const result: SubagentResult<string> = {
      success: false,
      error: { category: 'transient', message: 'timeout' },
    }
    expect(result.error?.category).toBe('transient')
  })

  it('ExtractionError 有正確 name', () => {
    const err = new ExtractionError('extraction_failed')
    expect(err.name).toBe('ExtractionError')
    expect(err.message).toBe('extraction_failed')
  })

  it('GateError 帶 tool + reason', () => {
    const err = new GateError('get_user_ascents', 'userId 必填')
    expect(err.name).toBe('GateError')
    expect(err.tool).toBe('get_user_ascents')
    expect(err.reason).toBe('userId 必填')
  })
})
```

- [ ] **Step 2: 執行測試，確認失敗**

```bash
npx vitest run test/types.test.ts
```
Expected: FAIL（找不到 `../src/types`）

- [ ] **Step 3: 實作 src/types.ts**

```typescript
export type AIProviderType = 'anthropic' | 'cloudflare' | 'openai'

export interface Ascent {
  id: string
  routeId: string
  grade: string
  date: string
  notes?: string
}

export interface UserProfile {
  id: string
  displayName: string
  climbingStyle?: string[]
}

export interface AIRequest {
  userId?: string
  userContext?: {
    ascents?: Ascent[]
    profile?: UserProfile
  }
  query?: string
  sessionId?: string
  provider?: AIProviderType
  [key: string]: unknown
}

export interface SubagentResult<T> {
  success: boolean
  data?: T
  error?: {
    category: 'transient' | 'validation' | 'business'
    message: string
  }
  truncated?: boolean
}

export class ExtractionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ExtractionError'
  }
}

export class GateError extends Error {
  constructor(
    public readonly tool: string,
    public readonly reason: string,
  ) {
    super(`Gate blocked: ${tool} — ${reason}`)
    this.name = 'GateError'
  }
}
```

- [ ] **Step 4: 執行測試，確認通過**

```bash
npx vitest run test/types.test.ts
```
Expected: PASS（5 tests）

- [ ] **Step 5: Commit**

```bash
git add src/types.ts test/types.test.ts
git commit -m "feat(types): 新增 AIRequest, SubagentResult, 錯誤類型"
```

---

### Task 2: Provider Interface + Factory

**Files:**
- Create: `src/providers/base.ts`
- Create: `src/providers/factory.ts`（含 stub classes）
- Create: `test/providers/factory.test.ts`

- [ ] **Step 1: 寫測試**

```typescript
// test/providers/factory.test.ts
import { describe, it, expect } from 'vitest'
import { createProvider } from '../../src/providers/factory'

// Workers bindings 以 plain object mock 傳入（environment: node）
const makeEnv = (provider: string) => ({
  AI_PROVIDER: provider,
  AI: {} as unknown as Ai,
  ANTHROPIC_API_KEY: 'test-key',
  OPENAI_API_KEY: 'test-key',
  AI_KV: {} as unknown as KVNamespace,
})

describe('createProvider', () => {
  it('AI_PROVIDER=anthropic 回傳 AnthropicProvider', () => {
    const p = createProvider(makeEnv('anthropic'))
    expect(p.constructor.name).toBe('AnthropicProvider')
  })

  it('AI_PROVIDER=cloudflare 回傳 CloudflareProvider', () => {
    const p = createProvider(makeEnv('cloudflare'))
    expect(p.constructor.name).toBe('CloudflareProvider')
  })

  it('override 參數優先於 env', () => {
    const p = createProvider(makeEnv('anthropic'), 'openai')
    expect(p.constructor.name).toBe('OpenAIProvider')
  })

  it('未知 provider 拋出錯誤', () => {
    expect(() => createProvider(makeEnv('unknown'))).toThrow('Unknown AI provider: unknown')
  })
})
```

- [ ] **Step 2: 執行測試，確認失敗**

```bash
npx vitest run test/providers/factory.test.ts
```
Expected: FAIL

- [ ] **Step 3: 實作 src/providers/base.ts**

```typescript
export interface Message {
  role: 'user' | 'assistant'
  content: string | ContentBlock[]
}

export interface ContentBlock {
  type: 'text' | 'tool_use' | 'tool_result'
  text?: string
  id?: string
  name?: string
  input?: unknown
  tool_use_id?: string
  content?: unknown
}

export interface ToolDefinition {
  name: string
  description: string
  input_schema: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
  }
}

export interface ToolCall {
  id: string
  name: string
  input: unknown
}

export interface ChatOptions {
  tools?: ToolDefinition[]
  tool_choice?: { type: 'auto' | 'any' | 'none' } | { type: 'tool'; name: string }
  max_tokens?: number
  system?: string
}

export interface ChatResponse {
  stop_reason: 'end_turn' | 'tool_use' | 'max_tokens' | 'stop_sequence'
  content: ContentBlock[]
  tool_calls: ToolCall[]
}

export interface AIProvider {
  chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse>
  embed(text: string): Promise<number[]>
  stream(messages: Message[], options?: ChatOptions): Promise<ReadableStream<Uint8Array>>
}
```

- [ ] **Step 4: 實作 src/providers/factory.ts（含三個 stub class）**

```typescript
import type { AIProvider } from './base'
import type { AIProviderType } from '../types'

// Stub classes — 完整實作在 Task 3-4
export class AnthropicProvider implements AIProvider {
  constructor(private apiKey: string) {}
  async chat(..._args: Parameters<AIProvider['chat']>): ReturnType<AIProvider['chat']> { throw new Error('Not implemented') }
  async embed(_text: string): Promise<number[]> { throw new Error('Not implemented') }
  async stream(..._args: Parameters<AIProvider['stream']>): ReturnType<AIProvider['stream']> { throw new Error('Not implemented') }
}
export class CloudflareProvider implements AIProvider {
  constructor(private ai: unknown) {}
  async chat(..._args: Parameters<AIProvider['chat']>): ReturnType<AIProvider['chat']> { throw new Error('Not implemented') }
  async embed(_text: string): Promise<number[]> { throw new Error('Not implemented') }
  async stream(..._args: Parameters<AIProvider['stream']>): ReturnType<AIProvider['stream']> { throw new Error('Not implemented') }
}
export class OpenAIProvider implements AIProvider {
  constructor(private apiKey: string) {}
  async chat(..._args: Parameters<AIProvider['chat']>): ReturnType<AIProvider['chat']> { throw new Error('Not implemented') }
  async embed(_text: string): Promise<number[]> { throw new Error('Not implemented') }
  async stream(..._args: Parameters<AIProvider['stream']>): ReturnType<AIProvider['stream']> { throw new Error('Not implemented') }
}

type Env = { AI_PROVIDER: string; AI: unknown; ANTHROPIC_API_KEY?: string; OPENAI_API_KEY?: string }

export function createProvider(env: Env, override?: AIProviderType): AIProvider {
  const type = (override ?? env.AI_PROVIDER) as AIProviderType
  switch (type) {
    case 'anthropic': return new AnthropicProvider(env.ANTHROPIC_API_KEY ?? '')
    case 'cloudflare': return new CloudflareProvider(env.AI)
    case 'openai': return new OpenAIProvider(env.OPENAI_API_KEY ?? '')
    default: throw new Error(`Unknown AI provider: ${type}`)
  }
}
```

- [ ] **Step 5: 執行測試，確認通過**

```bash
npx vitest run test/providers/factory.test.ts
```
Expected: PASS（4 tests）

- [ ] **Step 6: Commit**

```bash
git add src/providers/ test/providers/
git commit -m "feat(providers): 新增 AIProvider interface + factory（含三個 stub）"
```

---

### Task 3: AnthropicProvider 完整實作

**Files:**
- Create: `src/providers/anthropic.ts`
- Create: `test/providers/anthropic.test.ts`
- Modify: `src/providers/factory.ts`（更新 import）

- [ ] **Step 1: 寫測試**

```typescript
// test/providers/anthropic.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Anthropic from '@anthropic-ai/sdk'
import { AnthropicProvider } from '../../src/providers/anthropic'

vi.mock('@anthropic-ai/sdk')

describe('AnthropicProvider', () => {
  let provider: AnthropicProvider
  let mockCreate: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockCreate = vi.fn()
    vi.mocked(Anthropic).mockImplementation(() => ({
      messages: { create: mockCreate, stream: vi.fn() },
    } as unknown as Anthropic))
    provider = new AnthropicProvider('test-key')
  })

  it('chat end_turn：stop_reason 正確，tool_calls 空陣列', async () => {
    mockCreate.mockResolvedValue({
      stop_reason: 'end_turn',
      content: [{ type: 'text', text: 'hello' }],
    })
    const result = await provider.chat([{ role: 'user', content: 'hi' }])
    expect(result.stop_reason).toBe('end_turn')
    expect(result.tool_calls).toEqual([])
  })

  it('chat tool_use：tool_calls 包含正確資料', async () => {
    mockCreate.mockResolvedValue({
      stop_reason: 'tool_use',
      content: [{ type: 'tool_use', id: 'tool-1', name: 'search', input: { query: 'test' } }],
    })
    const result = await provider.chat(
      [{ role: 'user', content: 'search' }],
      { tools: [{ name: 'search', description: 'search', input_schema: { type: 'object', properties: {} } }] },
    )
    expect(result.stop_reason).toBe('tool_use')
    expect(result.tool_calls[0]?.name).toBe('search')
    expect(result.tool_calls[0]?.input).toEqual({ query: 'test' })
  })

  it('embed 拋出錯誤（Anthropic 不支援 native embedding）', async () => {
    await expect(provider.embed('test')).rejects.toThrow('Anthropic does not support native embeddings')
  })
})
```

- [ ] **Step 2: 執行測試，確認失敗**

```bash
npx vitest run test/providers/anthropic.test.ts
```
Expected: FAIL

- [ ] **Step 3: 建立 src/providers/anthropic.ts**

```typescript
import Anthropic from '@anthropic-ai/sdk'
import type { AIProvider, Message, ChatOptions, ChatResponse, ToolCall } from './base'

export class AnthropicProvider implements AIProvider {
  private client: Anthropic

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey })
  }

  async chat(messages: Message[], options: ChatOptions = {}): Promise<ChatResponse> {
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: options.max_tokens ?? 4096,
      system: options.system,
      messages: messages as Anthropic.MessageParam[],
      tools: options.tools as Anthropic.Tool[] | undefined,
      tool_choice: options.tool_choice as Anthropic.ToolChoiceAuto | undefined,
    })

    const tool_calls: ToolCall[] = response.content
      .filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
      .map(b => ({ id: b.id, name: b.name, input: b.input }))

    return {
      stop_reason: response.stop_reason as ChatResponse['stop_reason'],
      content: response.content as ChatResponse['content'],
      tool_calls,
    }
  }

  async embed(_text: string): Promise<number[]> {
    // Anthropic 無原生 embedding API。
    // 若需 embedding，使用 CloudflareProvider（bge-m3）或 OpenAIProvider（text-embedding-3-small）。
    throw new Error('Anthropic does not support native embeddings. Use CloudflareProvider or OpenAIProvider for embed().')
  }

  async stream(messages: Message[], options: ChatOptions = {}): Promise<ReadableStream<Uint8Array>> {
    const encoder = new TextEncoder()
    const stream = this.client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: options.max_tokens ?? 4096,
      system: options.system,
      messages: messages as Anthropic.MessageParam[],
    })

    return new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', text: chunk.delta.text })}\n\n`))
          }
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', sources: [] })}\n\n`))
        controller.close()
      },
    })
  }
}
```

- [ ] **Step 4: 更新 factory.ts import AnthropicProvider**

```typescript
// src/providers/factory.ts 最頂部加入：
import { AnthropicProvider } from './anthropic'
// 移除 factory.ts 內的 AnthropicProvider stub class
```

- [ ] **Step 5: 執行測試**

```bash
npx vitest run test/providers/anthropic.test.ts
```
Expected: PASS（3 tests）

- [ ] **Step 6: Commit**

```bash
git add src/providers/anthropic.ts src/providers/factory.ts test/providers/anthropic.test.ts
git commit -m "feat(providers): 實作 AnthropicProvider（embed 拋出錯誤而非靜默回傳空值）"
```

---

### Task 4: CloudflareProvider + OpenAIProvider

**Files:**
- Create: `src/providers/cloudflare.ts`
- Create: `src/providers/openai.ts`
- Create: `test/providers/cloudflare.test.ts`
- Create: `test/providers/openai.test.ts`
- Modify: `src/providers/factory.ts`

- [ ] **Step 1: 寫 CloudflareProvider 測試**

```typescript
// test/providers/cloudflare.test.ts
import { describe, it, expect, vi } from 'vitest'
import { CloudflareProvider } from '../../src/providers/cloudflare'

const mockAi = { run: vi.fn() }

describe('CloudflareProvider', () => {
  const provider = new CloudflareProvider(mockAi as unknown as Ai)

  it('chat 呼叫 llama，回傳 end_turn', async () => {
    mockAi.run.mockResolvedValue({ response: 'hello world' })
    const result = await provider.chat([{ role: 'user', content: 'hi' }])
    expect(result.stop_reason).toBe('end_turn')
    expect(result.tool_calls).toEqual([])
    expect(result.content[0]?.text).toBe('hello world')
  })

  it('embed 呼叫 bge-m3 回傳 number[]', async () => {
    mockAi.run.mockResolvedValue({ data: [[0.1, 0.2, 0.3]] })
    const result = await provider.embed('攀岩')
    expect(result).toEqual([0.1, 0.2, 0.3])
  })

  it('embed 無結果時回傳空陣列', async () => {
    mockAi.run.mockResolvedValue({ data: [] })
    const result = await provider.embed('test')
    expect(result).toEqual([])
  })
})
```

- [ ] **Step 2: 寫 OpenAIProvider 測試**

```typescript
// test/providers/openai.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import OpenAI from 'openai'
import { OpenAIProvider } from '../../src/providers/openai'

vi.mock('openai')

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider
  let mockCreate: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockCreate = vi.fn()
    vi.mocked(OpenAI).mockImplementation(() => ({
      chat: { completions: { create: mockCreate } },
      embeddings: { create: vi.fn().mockResolvedValue({ data: [{ embedding: [0.1, 0.2] }] }) },
    } as unknown as OpenAI))
    provider = new OpenAIProvider('test-key')
  })

  it('chat end_turn（finish_reason=stop）', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ finish_reason: 'stop', message: { content: 'hello', tool_calls: null } }],
    })
    const result = await provider.chat([{ role: 'user', content: 'hi' }])
    expect(result.stop_reason).toBe('end_turn')
    expect(result.tool_calls).toEqual([])
  })

  it('chat tool_use（finish_reason=tool_calls）', async () => {
    mockCreate.mockResolvedValue({
      choices: [{
        finish_reason: 'tool_calls',
        message: {
          content: '',
          tool_calls: [{
            id: 'tc-1',
            function: { name: 'search', arguments: JSON.stringify({ query: 'test' }) },
          }],
        },
      }],
    })
    const result = await provider.chat([{ role: 'user', content: 'search' }])
    expect(result.stop_reason).toBe('tool_use')
    expect(result.tool_calls[0]?.name).toBe('search')
    expect(result.tool_calls[0]?.input).toEqual({ query: 'test' })
  })

  it('embed 回傳 number[]', async () => {
    const result = await provider.embed('攀岩')
    expect(result).toEqual([0.1, 0.2])
  })

  it('chat 無 choices 拋出錯誤', async () => {
    mockCreate.mockResolvedValue({ choices: [] })
    await expect(provider.chat([{ role: 'user', content: 'hi' }])).rejects.toThrow('No response from OpenAI')
  })
})
```

- [ ] **Step 3: 執行兩個測試，確認失敗**

```bash
npx vitest run test/providers/cloudflare.test.ts test/providers/openai.test.ts
```
Expected: FAIL

- [ ] **Step 4: 實作 src/providers/cloudflare.ts**

```typescript
import type { AIProvider, Message, ChatOptions, ChatResponse } from './base'

export class CloudflareProvider implements AIProvider {
  constructor(private ai: Ai) {}

  async chat(messages: Message[], _options: ChatOptions = {}): Promise<ChatResponse> {
    const result = await this.ai.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: messages.map(m => ({
        role: m.role,
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
      })),
    }) as { response: string }

    return {
      stop_reason: 'end_turn',
      content: [{ type: 'text', text: result.response }],
      tool_calls: [],
    }
  }

  async embed(text: string): Promise<number[]> {
    const result = await this.ai.run('@cf/baai/bge-m3', { text: [text] }) as { data: number[][] }
    return result.data[0] ?? []
  }

  async stream(messages: Message[], options: ChatOptions = {}): Promise<ReadableStream<Uint8Array>> {
    const encoder = new TextEncoder()
    const response = await this.chat(messages, options)
    const text = response.content.find(b => b.type === 'text')?.text ?? ''

    return new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', text })}\n\n`))
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', sources: [] })}\n\n`))
        controller.close()
      },
    })
  }
}
```

- [ ] **Step 5: 實作 src/providers/openai.ts**

```typescript
import OpenAI from 'openai'
import type { AIProvider, Message, ChatOptions, ChatResponse, ToolCall } from './base'

export class OpenAIProvider implements AIProvider {
  private client: OpenAI

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey })
  }

  async chat(messages: Message[], options: ChatOptions = {}): Promise<ChatResponse> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: options.max_tokens ?? 4096,
      messages: messages.map(m => ({
        role: m.role,
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
      })) as OpenAI.ChatCompletionMessageParam[],
      tools: options.tools?.map(t => ({
        type: 'function' as const,
        function: { name: t.name, description: t.description, parameters: t.input_schema },
      })),
    })

    const choice = response.choices[0]
    if (!choice) throw new Error('No response from OpenAI')

    const tool_calls: ToolCall[] = (choice.message.tool_calls ?? []).map(tc => ({
      id: tc.id,
      name: tc.function.name,
      input: JSON.parse(tc.function.arguments) as unknown,
    }))

    return {
      stop_reason: choice.finish_reason === 'tool_calls' ? 'tool_use' : 'end_turn',
      content: [{ type: 'text', text: choice.message.content ?? '' }],
      tool_calls,
    }
  }

  async embed(text: string): Promise<number[]> {
    const result = await this.client.embeddings.create({ model: 'text-embedding-3-small', input: text })
    return result.data[0]?.embedding ?? []
  }

  async stream(messages: Message[], options: ChatOptions = {}): Promise<ReadableStream<Uint8Array>> {
    const encoder = new TextEncoder()
    const stream = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: options.max_tokens ?? 4096,
      messages: messages.map(m => ({
        role: m.role,
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
      })) as OpenAI.ChatCompletionMessageParam[],
      stream: true,
    })

    return new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? ''
          if (text) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', text })}\n\n`))
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', sources: [] })}\n\n`))
        controller.close()
      },
    })
  }
}
```

- [ ] **Step 6: 更新 factory.ts 使用獨立 provider 檔案（最終版）**

```typescript
// src/providers/factory.ts
import { AnthropicProvider } from './anthropic'
import { CloudflareProvider } from './cloudflare'
import { OpenAIProvider } from './openai'
import type { AIProvider } from './base'
import type { AIProviderType } from '../types'

type Env = { AI_PROVIDER: string; AI: Ai; ANTHROPIC_API_KEY?: string; OPENAI_API_KEY?: string }

export function createProvider(env: Env, override?: AIProviderType): AIProvider {
  const type = (override ?? env.AI_PROVIDER) as AIProviderType
  switch (type) {
    case 'anthropic': return new AnthropicProvider(env.ANTHROPIC_API_KEY ?? '')
    case 'cloudflare': return new CloudflareProvider(env.AI)
    case 'openai': return new OpenAIProvider(env.OPENAI_API_KEY ?? '')
    default: throw new Error(`Unknown AI provider: ${type}`)
  }
}

export { AnthropicProvider, CloudflareProvider, OpenAIProvider }
```

- [ ] **Step 7: 執行所有 provider 測試**

```bash
npx vitest run test/providers/
```
Expected: PASS（全部）

- [ ] **Step 8: Commit**

```bash
git add src/providers/ test/providers/
git commit -m "feat(providers): 實作 CloudflareProvider + OpenAIProvider（含完整測試）"
```

---

### Task 5: AgentSession（含 KV 持久化）

**Files:**
- Create: `src/agents/session.ts`
- Create: `test/agents/session.test.ts`

- [ ] **Step 1: 寫測試**

```typescript
// test/agents/session.test.ts
import { describe, it, expect, vi } from 'vitest'
import { AgentSession } from '../../src/agents/session'
import type { Message } from '../../src/providers/base'

// Mock KVNamespace
function makeKV(): KVNamespace {
  const store = new Map<string, string>()
  return {
    put: vi.fn().mockImplementation(async (key: string, value: string) => { store.set(key, value) }),
    get: vi.fn().mockImplementation(async (key: string) => store.get(key) ?? null),
  } as unknown as KVNamespace
}

describe('AgentSession', () => {
  it('初始化帶 system message', () => {
    const session = new AgentSession({ system: '你是攀岩助手' })
    expect(session.systemPrompt).toBe('你是攀岩助手')
    expect(session.messages).toHaveLength(0)
  })

  it('appendUserMessage 加入 user role', () => {
    const session = new AgentSession({})
    session.appendUserMessage('如何提升抓力？')
    expect(session.messages[0]?.role).toBe('user')
    expect(session.messages[0]?.content).toBe('如何提升抓力？')
  })

  it('appendAssistantResponse 加入 assistant role', () => {
    const session = new AgentSession({})
    session.appendAssistantResponse([{ type: 'text', text: 'answer' }])
    expect(session.messages[0]?.role).toBe('assistant')
  })

  it('appendToolResults 加入 tool_result content', () => {
    const session = new AgentSession({})
    session.appendToolResults([{ toolCallId: 'tc-1', name: 'search', result: { data: 'result' } }])
    expect(session.messages).toHaveLength(1)
    expect(session.messages[0]?.role).toBe('user')
  })

  it('toResult 回傳最後 assistant 訊息的文字', () => {
    const session = new AgentSession({})
    session.appendAssistantResponse([{ type: 'text', text: 'answer' }])
    const result = session.toResult()
    expect(result.text).toBe('answer')
    expect(result.truncated).toBe(false)
  })

  it('toResult 帶 truncated:true', () => {
    const session = new AgentSession({})
    const result = session.toResult({ truncated: true })
    expect(result.truncated).toBe(true)
  })

  it('serialize / deserialize 保留訊息', () => {
    const session = new AgentSession({ system: 'test', userId: 'u-1' })
    session.appendUserMessage('hello')
    const json = session.serialize()
    const restored = AgentSession.deserialize(json)
    expect(restored.messages).toHaveLength(1)
    expect(restored.systemPrompt).toBe('test')
    expect(restored.userId).toBe('u-1')
  })

  it('saveToKV 存入 session（含 TTL），loadFromKV 還原', async () => {
    const kv = makeKV()
    const session = new AgentSession({ system: 'test', userId: 'u-1' })
    session.appendUserMessage('hello')
    const sessionId = await session.saveToKV(kv)
    expect(sessionId).toMatch(/^[0-9a-f-]{36}$/)  // UUID
    // 確認 KV put 帶入 TTL
    expect(kv.put).toHaveBeenCalledWith(
      `session:${sessionId}`,
      expect.any(String),
      { expirationTtl: 3600 },
    )

    const restored = await AgentSession.loadFromKV(kv, sessionId)
    expect(restored).not.toBeNull()
    expect(restored?.messages).toHaveLength(1)
    expect(restored?.userId).toBe('u-1')
  })

  it('loadFromKV 不存在的 sessionId 回傳 null', async () => {
    const kv = makeKV()
    const result = await AgentSession.loadFromKV(kv, 'nonexistent')
    expect(result).toBeNull()
  })
})
```

- [ ] **Step 2: 執行測試，確認失敗**

```bash
npx vitest run test/agents/session.test.ts
```

- [ ] **Step 3: 實作 src/agents/session.ts**

```typescript
import type { Message, ContentBlock } from '../providers/base'

interface AgentSessionOptions {
  system?: string
  userId?: string
}

interface ToolResult {
  toolCallId: string
  name: string
  result: unknown
}

export interface AgentResult {
  text: string
  truncated: boolean
  messages: Message[]
}

interface SessionData {
  systemPrompt: string
  userId?: string
  messages: Message[]
}

export class AgentSession {
  systemPrompt: string
  userId?: string
  messages: Message[] = []

  constructor(options: AgentSessionOptions) {
    this.systemPrompt = options.system ?? ''
    this.userId = options.userId
  }

  appendUserMessage(content: string): void {
    this.messages.push({ role: 'user', content })
  }

  appendAssistantResponse(content: ContentBlock[]): void {
    this.messages.push({ role: 'assistant', content })
  }

  appendToolResults(results: ToolResult[]): void {
    const content: ContentBlock[] = results.map(r => ({
      type: 'tool_result',
      tool_use_id: r.toolCallId,
      content: JSON.stringify(r.result),
    }))
    this.messages.push({ role: 'user', content })
  }

  toResult(options?: { truncated?: boolean }): AgentResult {
    const last = [...this.messages].reverse().find(m => m.role === 'assistant')
    const content = last?.content
    let text = ''
    if (Array.isArray(content)) {
      text = content.find(b => b.type === 'text')?.text ?? ''
    } else if (typeof content === 'string') {
      text = content
    }
    return { text, truncated: options?.truncated ?? false, messages: this.messages }
  }

  serialize(): string {
    const data: SessionData = { systemPrompt: this.systemPrompt, userId: this.userId, messages: this.messages }
    return JSON.stringify(data)
  }

  static deserialize(json: string): AgentSession {
    const data = JSON.parse(json) as SessionData
    const session = new AgentSession({ system: data.systemPrompt, userId: data.userId })
    session.messages = data.messages
    return session
  }

  async saveToKV(kv: KVNamespace, sessionId?: string): Promise<string> {
    const id = sessionId ?? crypto.randomUUID()
    await kv.put(`session:${id}`, this.serialize(), { expirationTtl: 3600 })
    return id
  }

  static async loadFromKV(kv: KVNamespace, sessionId: string): Promise<AgentSession | null> {
    const json = await kv.get(`session:${sessionId}`)
    if (!json) return null
    return AgentSession.deserialize(json)
  }
}
```

- [ ] **Step 4: 執行測試**

```bash
npx vitest run test/agents/session.test.ts
```
Expected: PASS（9 tests）

- [ ] **Step 5: Commit**

```bash
git add src/agents/session.ts test/agents/session.test.ts
git commit -m "feat(agents): 實作 AgentSession（含 KV saveToKV/loadFromKV）"
```

---

### Task 6: ToolRegistry（Gates + Hooks）

**設計說明：** `getTools(session)` 回傳所有工具（不依 gate 過濾），gate 強制由 `execute()` 執行。理由：模型需要知道所有可用工具才能決策；gate 失敗在執行層拋出 `GateError`，route handler 捕捉後回 403。

**Files:**
- Create: `src/agents/tool-registry.ts`
- Create: `test/agents/tool-registry.test.ts`

- [ ] **Step 1: 寫測試**

```typescript
// test/agents/tool-registry.test.ts
import { describe, it, expect, vi } from 'vitest'
import { ToolRegistry } from '../../src/agents/tool-registry'
import { AgentSession } from '../../src/agents/session'
import { GateError } from '../../src/types'

const noGateTool = {
  name: 'search_knowledge',
  description: '搜尋知識庫',
  input_schema: { type: 'object' as const, properties: { query: { type: 'string' } } },
  execute: vi.fn().mockResolvedValue({ chunks: [] }),
}

const gatedTool = {
  name: 'get_user_ascents',
  description: '取得使用者攀登記錄',
  input_schema: { type: 'object' as const, properties: { userId: { type: 'string' } } },
  gate: (session: AgentSession) => session.userId ? null : 'userId 必填',
  execute: vi.fn().mockResolvedValue({ ascents: [] }),
}

describe('ToolRegistry', () => {
  it('getTools 回傳所有工具（不過濾 gate）', () => {
    const registry = new ToolRegistry([noGateTool, gatedTool])
    const session = new AgentSession({}) // 無 userId
    const tools = registry.getTools(session)
    // 兩個工具都回傳，gate 不在此過濾
    expect(tools).toHaveLength(2)
    expect(tools.map(t => t.name)).toContain('get_user_ascents')
  })

  it('checkGate 無 gate 回傳 allowed:true', () => {
    const registry = new ToolRegistry([noGateTool])
    const session = new AgentSession({})
    expect(registry.checkGate('search_knowledge', session).allowed).toBe(true)
  })

  it('checkGate gate 失敗回傳 allowed:false + reason', () => {
    const registry = new ToolRegistry([gatedTool])
    const result = registry.checkGate('get_user_ascents', new AgentSession({}))
    expect(result.allowed).toBe(false)
    if (!result.allowed) expect(result.reason).toBe('userId 必填')
  })

  it('checkGate gate 通過回傳 allowed:true', () => {
    const registry = new ToolRegistry([gatedTool])
    expect(registry.checkGate('get_user_ascents', new AgentSession({ userId: 'u-1' })).allowed).toBe(true)
  })

  it('execute 觸發 onBeforeTool + onAfterTool hooks', async () => {
    const onBefore = vi.fn()
    const onAfter = vi.fn()
    const registry = new ToolRegistry([noGateTool], { onBeforeTool: onBefore, onAfterTool: onAfter })
    const session = new AgentSession({})
    await registry.execute([{ id: 'tc-1', name: 'search_knowledge', input: { query: 'test' } }], session)
    expect(onBefore).toHaveBeenCalledWith('search_knowledge', { query: 'test' })
    expect(onAfter).toHaveBeenCalled()
  })

  it('execute gate 未通過拋出 GateError', async () => {
    const registry = new ToolRegistry([gatedTool])
    const session = new AgentSession({}) // 無 userId
    await expect(
      registry.execute([{ id: 'tc-1', name: 'get_user_ascents', input: {} }], session)
    ).rejects.toThrow(GateError)
  })

  it('execute 回傳包含 toolCallId 的 results', async () => {
    const registry = new ToolRegistry([noGateTool])
    const results = await registry.execute(
      [{ id: 'tc-99', name: 'search_knowledge', input: { query: 'test' } }],
      new AgentSession({}),
    )
    expect(results[0]?.toolCallId).toBe('tc-99')
    expect(results[0]?.name).toBe('search_knowledge')
  })
})
```

- [ ] **Step 2: 執行測試，確認失敗**

```bash
npx vitest run test/agents/tool-registry.test.ts
```

- [ ] **Step 3: 實作 src/agents/tool-registry.ts**

```typescript
import type { ToolDefinition, ToolCall } from '../providers/base'
import type { AgentSession } from './session'
import { GateError } from '../types'

interface ToolEntry {
  name: string
  description: string
  input_schema: ToolDefinition['input_schema']
  gate?: (session: AgentSession) => string | null  // null = 通過，string = 拒絕原因
  execute: (input: unknown, session: AgentSession) => Promise<unknown>
}

interface ToolRegistryHooks {
  onBeforeTool?: (name: string, args: unknown) => void
  onAfterTool?: (name: string, result: unknown) => void
}

type GateResult =
  | { allowed: true }
  | { allowed: false; reason: string }

export class ToolRegistry {
  private tools: Map<string, ToolEntry>
  private hooks: ToolRegistryHooks

  constructor(tools: ToolEntry[], hooks: ToolRegistryHooks = {}) {
    this.tools = new Map(tools.map(t => [t.name, t]))
    this.hooks = hooks
  }

  // 回傳所有工具 ToolDefinition（gate 不在此過濾，由 execute 強制）
  getTools(_session: AgentSession): ToolDefinition[] {
    return Array.from(this.tools.values()).map(t => ({
      name: t.name,
      description: t.description,
      input_schema: t.input_schema,
    }))
  }

  checkGate(toolName: string, session: AgentSession): GateResult {
    const tool = this.tools.get(toolName)
    if (!tool?.gate) return { allowed: true }
    const reason = tool.gate(session)
    if (reason === null) return { allowed: true }
    return { allowed: false, reason }
  }

  async execute(
    calls: ToolCall[],
    session: AgentSession,
  ): Promise<Array<{ toolCallId: string; name: string; result: unknown }>> {
    return Promise.all(
      calls.map(async call => {
        const gate = this.checkGate(call.name, session)
        if (!gate.allowed) throw new GateError(call.name, gate.reason)

        const tool = this.tools.get(call.name)
        if (!tool) throw new Error(`Unknown tool: ${call.name}`)

        this.hooks.onBeforeTool?.(call.name, call.input)
        const result = await tool.execute(call.input, session)
        this.hooks.onAfterTool?.(call.name, result)

        return { toolCallId: call.id, name: call.name, result }
      }),
    )
  }
}
```

- [ ] **Step 4: 執行測試**

```bash
npx vitest run test/agents/tool-registry.test.ts
```
Expected: PASS（7 tests）

- [ ] **Step 5: Commit**

```bash
git add src/agents/tool-registry.ts test/agents/tool-registry.test.ts
git commit -m "feat(agents): 實作 ToolRegistry（getTools 不過濾，execute 強制 gate）"
```

---

### Task 7: AgentRunner（Agentic Loop）

**Files:**
- Create: `src/agents/runner.ts`
- Create: `test/agents/runner.test.ts`

- [ ] **Step 1: 寫測試**

```typescript
// test/agents/runner.test.ts
import { describe, it, expect, vi } from 'vitest'
import { AgentRunner, MAX_ITERATIONS } from '../../src/agents/runner'
import { AgentSession } from '../../src/agents/session'
import { ToolRegistry } from '../../src/agents/tool-registry'
import type { AIProvider, ChatResponse } from '../../src/providers/base'

function makeProvider(responses: Partial<ChatResponse>[]): AIProvider {
  let i = 0
  return {
    chat: vi.fn().mockImplementation(async (): Promise<ChatResponse> => {
      const r = responses[i++] ?? responses[responses.length - 1]!
      return {
        stop_reason: (r.stop_reason ?? 'end_turn') as ChatResponse['stop_reason'],
        content: r.content ?? [],
        tool_calls: r.tool_calls ?? [],
      }
    }),
    embed: vi.fn(),
    stream: vi.fn(),
  } as unknown as AIProvider
}

describe('AgentRunner', () => {
  it('end_turn 立即停止，session messages 包含 assistant，truncated:false', async () => {
    const provider = makeProvider([{
      stop_reason: 'end_turn',
      content: [{ type: 'text', text: 'done' }],
    }])
    const runner = new AgentRunner(provider, new ToolRegistry([]))
    const session = new AgentSession({})
    session.appendUserMessage('hello')
    const result = await runner.run(session)
    expect(result.truncated).toBe(false)
    expect(result.text).toBe('done')
    // end_turn 後 assistant 訊息應已加入 session
    expect(session.messages.some(m => m.role === 'assistant')).toBe(true)
  })

  it('tool_use → 執行工具 → end_turn 流程', async () => {
    const mockTool = {
      name: 'search',
      description: 'search',
      input_schema: { type: 'object' as const, properties: {} },
      execute: vi.fn().mockResolvedValue({ data: 'result' }),
    }
    const provider = makeProvider([
      { stop_reason: 'tool_use', tool_calls: [{ id: 'tc-1', name: 'search', input: {} }] },
      { stop_reason: 'end_turn', content: [{ type: 'text', text: 'final' }] },
    ])
    const runner = new AgentRunner(provider, new ToolRegistry([mockTool]))
    const session = new AgentSession({})
    session.appendUserMessage('search something')
    const result = await runner.run(session)
    expect(mockTool.execute).toHaveBeenCalledOnce()
    expect(result.truncated).toBe(false)
    expect(result.text).toBe('final')
  })

  it(`達到 MAX_ITERATIONS(${MAX_ITERATIONS}) 回傳 truncated:true`, async () => {
    const mockTool = {
      name: 'loop',
      description: 'loop',
      input_schema: { type: 'object' as const, properties: {} },
      execute: vi.fn().mockResolvedValue({}),
    }
    // 永遠回傳 tool_use
    const provider = makeProvider([{
      stop_reason: 'tool_use',
      tool_calls: [{ id: 'tc-1', name: 'loop', input: {} }],
    }])
    const runner = new AgentRunner(provider, new ToolRegistry([mockTool]))
    const session = new AgentSession({})
    session.appendUserMessage('loop')
    const result = await runner.run(session)
    expect(result.truncated).toBe(true)
    expect(mockTool.execute).toHaveBeenCalledTimes(MAX_ITERATIONS)
  })

  it('未知 stop_reason（max_tokens）立即停止，truncated:false', async () => {
    const provider = makeProvider([{ stop_reason: 'max_tokens', content: [{ type: 'text', text: 'cut off' }] }])
    const runner = new AgentRunner(provider, new ToolRegistry([]))
    const session = new AgentSession({})
    session.appendUserMessage('hello')
    const result = await runner.run(session)
    expect(result.truncated).toBe(false)
  })

  it('subagent 模式支援自訂 maxIterations', async () => {
    const mockTool = {
      name: 'loop',
      description: 'loop',
      input_schema: { type: 'object' as const, properties: {} },
      execute: vi.fn().mockResolvedValue({}),
    }
    const provider = makeProvider([{ stop_reason: 'tool_use', tool_calls: [{ id: 'tc-1', name: 'loop', input: {} }] }])
    const runner = new AgentRunner(provider, new ToolRegistry([mockTool]), 5)
    const session = new AgentSession({})
    session.appendUserMessage('loop')
    const result = await runner.run(session)
    expect(result.truncated).toBe(true)
    expect(mockTool.execute).toHaveBeenCalledTimes(5)
  })
})
```

- [ ] **Step 2: 執行測試，確認失敗**

```bash
npx vitest run test/agents/runner.test.ts
```

- [ ] **Step 3: 實作 src/agents/runner.ts**

```typescript
import type { AIProvider } from '../providers/base'
import type { ToolRegistry } from './tool-registry'
import type { AgentSession, AgentResult } from './session'

export const MAX_ITERATIONS = 10

export class AgentRunner {
  constructor(
    private provider: AIProvider,
    private registry: ToolRegistry,
    private maxIterations: number = MAX_ITERATIONS,
  ) {}

  async run(session: AgentSession): Promise<AgentResult> {
    for (let i = 0; i < this.maxIterations; i++) {
      const response = await this.provider.chat(session.messages, {
        tools: this.registry.getTools(session),
        system: session.systemPrompt || undefined,
      })

      if (response.stop_reason === 'end_turn') {
        session.appendAssistantResponse(response.content)
        break
      }

      if (response.stop_reason === 'tool_use') {
        session.appendAssistantResponse(response.content)
        const results = await this.registry.execute(response.tool_calls, session)
        session.appendToolResults(results)
      } else {
        // max_tokens, stop_sequence 等其他情況：記錄回應後停止迴圈
        session.appendAssistantResponse(response.content)
        break
      }

      if (i === this.maxIterations - 1) {
        return session.toResult({ truncated: true })
      }
    }
    return session.toResult()
  }
}
```

- [ ] **Step 4: 執行測試**

```bash
npx vitest run test/agents/runner.test.ts
```
Expected: PASS（5 tests）

- [ ] **Step 5: Commit**

```bash
git add src/agents/runner.ts test/agents/runner.test.ts
git commit -m "feat(agents): 實作 AgentRunner（含 max_tokens 處理 + session 記錄驗證）"
```

---

### Task 8: Auth Middleware + Hono Entry（含錯誤處理）

**Files:**
- Create: `src/middleware/auth.ts`
- Modify: `src/index.ts`（加入 GateError → 403 + ExtractionError → 422 handler）
- Create: `test/middleware/auth.test.ts`

- [ ] **Step 1: 寫測試**

```typescript
// test/middleware/auth.test.ts
import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import { authMiddleware } from '../../src/middleware/auth'

describe('authMiddleware', () => {
  it('注入 userId 到 context', async () => {
    const app = new Hono()
    app.use('*', authMiddleware)
    app.post('/test', async (c) => c.json({ userId: c.get('userId') }))

    const res = await app.request('/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'user-123' }),
    })
    expect((await res.json() as { userId: string }).userId).toBe('user-123')
  })

  it('無 userId 時注入 undefined', async () => {
    const app = new Hono()
    app.use('*', authMiddleware)
    app.post('/test', async (c) => c.json({ userId: c.get('userId') ?? null }))

    const res = await app.request('/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'test' }),
    })
    expect((await res.json() as { userId: null }).userId).toBeNull()
  })

  it('帶 sessionId 注入 context（KV 載入由 route handler 負責）', async () => {
    const app = new Hono()
    app.use('*', authMiddleware)
    app.post('/test', async (c) => c.json({ sessionId: c.get('sessionId') }))

    const res = await app.request('/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'sid-abc' }),
    })
    expect((await res.json() as { sessionId: string }).sessionId).toBe('sid-abc')
  })
})
```

- [ ] **Step 2: 執行測試，確認失敗**

```bash
npx vitest run test/middleware/auth.test.ts
```

- [ ] **Step 3: 實作 src/middleware/auth.ts**

注意：middleware 只注入 `userId`、`sessionId`、`aiRequest`。KV session 載入由各個 route handler 負責（route 有 `env.AI_KV` 存取權，middleware 沒有）。

```typescript
import type { MiddlewareHandler } from 'hono'
import type { AIRequest } from '../types'

type Variables = {
  userId: string | undefined
  sessionId: string | undefined
  aiRequest: AIRequest
}

export const authMiddleware: MiddlewareHandler<{ Variables: Variables }> = async (c, next) => {
  let body: AIRequest = {}
  try {
    body = await c.req.json<AIRequest>()
  } catch {
    // GET requests 或 empty body — 忽略
  }
  c.set('userId', body.userId)
  c.set('sessionId', body.sessionId)
  c.set('aiRequest', body)
  await next()
}
```

- [ ] **Step 4: 更新 src/index.ts（完整版含 error handler）**

```typescript
import { Hono } from 'hono'
import { authMiddleware } from './middleware/auth'
import { createProvider } from './providers/factory'
import { GateError, ExtractionError } from './types'

type Env = {
  Bindings: {
    AI_PROVIDER: string
    AI: Ai
    AI_KV: KVNamespace
    ANTHROPIC_API_KEY?: string
    OPENAI_API_KEY?: string
  }
}

const app = new Hono<Env>()

// 全域錯誤處理：GateError → 403，ExtractionError → 422
app.onError((err, c) => {
  if (err instanceof GateError) {
    return c.json({ error: 'gate_failed', tool: err.tool, reason: err.reason }, 403)
  }
  if (err instanceof ExtractionError) {
    return c.json({ error: 'extraction_failed' }, 422)
  }
  console.error(err)
  return c.json({ error: 'internal_error', message: err.message }, 500)
})

app.use('/ai/*', authMiddleware)

app.get('/ai/health', (c) => c.json({ status: 'ok', timestamp: Date.now() }))

app.get('/ai/provider', (c) => {
  const provider = createProvider(c.env)
  return c.json({ provider: c.env.AI_PROVIDER, class: provider.constructor.name })
})

export default app
```

- [ ] **Step 5: 新增 test/index.test.ts（測試 error handler wiring）**

```typescript
// test/index.test.ts
import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import { GateError, ExtractionError } from '../src/types'

// 建立一個帶有 error handler 的最小 app（與 src/index.ts 同邏輯）
function makeApp() {
  const app = new Hono()
  app.onError((err, c) => {
    if (err instanceof GateError) {
      return c.json({ error: 'gate_failed', tool: err.tool, reason: err.reason }, 403)
    }
    if (err instanceof ExtractionError) {
      return c.json({ error: 'extraction_failed' }, 422)
    }
    return c.json({ error: 'internal_error', message: err.message }, 500)
  })
  return app
}

describe('index error handler', () => {
  it('GateError → 403 含 tool + reason', async () => {
    const app = makeApp()
    app.get('/throw-gate', () => { throw new GateError('get_user_ascents', 'userId 必填') })

    const res = await app.request('/throw-gate')
    expect(res.status).toBe(403)
    const body = await res.json() as { error: string; tool: string; reason: string }
    expect(body.error).toBe('gate_failed')
    expect(body.tool).toBe('get_user_ascents')
    expect(body.reason).toBe('userId 必填')
  })

  it('ExtractionError → 422', async () => {
    const app = makeApp()
    app.get('/throw-extract', () => { throw new ExtractionError('extraction_failed') })

    const res = await app.request('/throw-extract')
    expect(res.status).toBe(422)
    const body = await res.json() as { error: string }
    expect(body.error).toBe('extraction_failed')
  })

  it('未知錯誤 → 500', async () => {
    const app = makeApp()
    app.get('/throw-unknown', () => { throw new Error('something broke') })

    const res = await app.request('/throw-unknown')
    expect(res.status).toBe(500)
    const body = await res.json() as { error: string; message: string }
    expect(body.error).toBe('internal_error')
    expect(body.message).toBe('something broke')
  })
})
```

- [ ] **Step 6: 執行所有測試**

```bash
npx vitest run
```
Expected: PASS（全部）

- [ ] **Step 7: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: 無錯誤

- [ ] **Step 8: Final commit**

```bash
git add src/ test/
git commit -m "feat(foundation): 完成 Hono entry + auth middleware + 全域錯誤處理（GateError→403, ExtractionError→422）"
```

---

## 完成標準

Plan 1 完成後，`nobodyclimb-ai` repo 應具備：

- [ ] 全新 TypeScript + Hono + Cloudflare Workers 專案可編譯（`npx tsc --noEmit`）
- [ ] `GET /ai/health` → `{ status: 'ok' }`
- [ ] `GET /ai/provider` → 目前 provider 名稱
- [ ] `createProvider(env, override?)` 可切換三個 provider，AnthropicProvider.embed 拋出清楚錯誤
- [ ] `AgentRunner` stop_reason loop + MAX_ITERATIONS=10，subagent 支援 maxIterations=5
- [ ] `ToolRegistry` gates（execute 強制）+ hooks，getTools 回傳全部工具
- [ ] `AgentSession` serialize/deserialize + KV saveToKV/loadFromKV（TTL 3600s）
- [ ] `authMiddleware` 注入 userId + sessionId
- [ ] 全域 error handler：GateError → 403，ExtractionError → 422
- [ ] 全部單元測試通過（`npx vitest run`）

## 架構備注（供後續計畫參考）

**`draft_story` gate（實作於 Plan 3）：** `AgentSession` 目前無 `answers` 欄位。實作故事助手時，需在 session 加入 `metadata: Record<string, unknown>` 或 `answers: string[]` 欄位，讓 `draft_story` gate 可查詢已收集的回答數量。

## 下一步

完成 Plan 1 後，繼續 **Plan 2**：
- `search_knowledge`、`get_route_info`、`vector_search`、`fulltext_search`、`synthesize` 工具實作
- RAG Agent（rag-agent.ts）
- SSE streaming route（`POST /ai/rag/query`）
- Extractor base + RouteExtractor + AscentExtractor
- `POST /ai/extract/route` + `POST /ai/extract/ascent` routes
