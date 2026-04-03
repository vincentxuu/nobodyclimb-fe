import { describe, expect, it, vi } from 'vitest'
import { AnthropicProvider } from '../../ai-graph/providers/anthropic'
import { CloudflareProvider } from '../../ai-graph/providers/cloudflare'
import { GitHubModelsProvider } from '../../ai-graph/providers/github'
import { GoogleProvider } from '../../ai-graph/providers/google'
import { OpenAIProvider } from '../../ai-graph/providers/openai'
import type { ToolSchema } from '../../ai-graph/providers/types'

const SAMPLE_TOOLS: ToolSchema[] = [
  {
    name: 'search_routes',
    description: '搜尋攀岩路線',
    parameters: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
  },
]

const MESSAGES = [{ role: 'user' as const, content: '龍洞有什麼路線？' }]

// ---------------------------------------------------------------------------
// Cloudflare (Workers AI) — chatWithTools
// ---------------------------------------------------------------------------

describe('CloudflareProvider.chatWithTools', () => {
  function createProvider(mockResponse: unknown) {
    const mockAI = { run: vi.fn().mockResolvedValue(mockResponse) }
    return new CloudflareProvider(mockAI as any)
  }

  it('sends tools in function-calling shape expected by Workers AI', async () => {
    const mockAI = {
      run: vi.fn().mockResolvedValue({
        response: '直接回答',
        usage: { prompt_tokens: 80, completion_tokens: 30 },
      }),
    }
    const provider = new CloudflareProvider(mockAI as any)

    await provider.chatWithTools!(MESSAGES, SAMPLE_TOOLS)

    expect(mockAI.run).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        messages: MESSAGES,
        tools: [
          {
            type: 'function',
            function: {
              name: 'search_routes',
              description: '搜尋攀岩路線',
              parameters: SAMPLE_TOOLS[0].parameters,
            },
          },
        ],
      })
    )
  })

  it('parses normal tool call', async () => {
    const provider = createProvider({
      tool_calls: [{ id: 'tc-1', name: 'search_routes', arguments: { query: '龍洞' } }],
      usage: { prompt_tokens: 100, completion_tokens: 20 },
    })
    const result = await provider.chatWithTools!(MESSAGES, SAMPLE_TOOLS)
    expect(result.stopReason).toBe('tool_use')
    expect(result.toolCalls).toHaveLength(1)
    expect(result.toolCalls[0].name).toBe('search_routes')
    expect(result.toolCalls[0].input).toEqual({ query: '龍洞' })
    expect(result.usage.input).toBe(100)
    expect(result.usage.output).toBe(20)
  })

  it('returns end_turn when no tool calls (direct answer)', async () => {
    const provider = createProvider({
      response: '龍洞是台灣北部知名的攀岩場。',
      usage: { prompt_tokens: 80, completion_tokens: 30 },
    })
    const result = await provider.chatWithTools!(MESSAGES, SAMPLE_TOOLS)
    expect(result.stopReason).toBe('end_turn')
    expect(result.toolCalls).toHaveLength(0)
    expect(result.content).toBe('龍洞是台灣北部知名的攀岩場。')
  })

  it('handles string arguments (defensive parsing)', async () => {
    const provider = createProvider({
      tool_calls: [{ id: 'tc-1', name: 'search_routes', arguments: '{"query": "龍洞"}' }],
      usage: { prompt_tokens: 100, completion_tokens: 20 },
    })
    const result = await provider.chatWithTools!(MESSAGES, SAMPLE_TOOLS)
    expect(result.toolCalls[0].input).toEqual({ query: '龍洞' })
  })

  it('handles markdown-wrapped JSON arguments', async () => {
    const provider = createProvider({
      tool_calls: [
        { id: 'tc-1', name: 'search_routes', arguments: '```json\n{"query": "龍洞"}\n```' },
      ],
      usage: { prompt_tokens: 100, completion_tokens: 20 },
    })
    const result = await provider.chatWithTools!(MESSAGES, SAMPLE_TOOLS)
    expect(result.toolCalls[0].input).toEqual({ query: '龍洞' })
  })

  it('handles tool name with extra spaces', async () => {
    const provider = createProvider({
      tool_calls: [{ id: 'tc-1', name: ' search  routes ', arguments: { query: '龍洞' } }],
      usage: { prompt_tokens: 100, completion_tokens: 20 },
    })
    const result = await provider.chatWithTools!(MESSAGES, SAMPLE_TOOLS)
    expect(result.toolCalls[0].name).toBe('search_routes')
  })

  it('handles function-style format (OpenAI compat)', async () => {
    const provider = createProvider({
      tool_calls: [
        { id: 'tc-1', function: { name: 'search_routes', arguments: { query: '龍洞' } } },
      ],
      usage: { prompt_tokens: 100, completion_tokens: 20 },
    })
    const result = await provider.chatWithTools!(MESSAGES, SAMPLE_TOOLS)
    expect(result.toolCalls[0].name).toBe('search_routes')
  })

  it('skips tool calls with empty name', async () => {
    const provider = createProvider({
      tool_calls: [
        { id: 'tc-1', name: '', arguments: {} },
        { id: 'tc-2', name: 'search_routes', arguments: { query: '龍洞' } },
      ],
      usage: { prompt_tokens: 100, completion_tokens: 20 },
    })
    const result = await provider.chatWithTools!(MESSAGES, SAMPLE_TOOLS)
    expect(result.toolCalls).toHaveLength(1)
    expect(result.toolCalls[0].name).toBe('search_routes')
  })

  it('generates fallback id when none provided', async () => {
    const provider = createProvider({
      tool_calls: [{ name: 'search_routes', arguments: { query: '龍洞' } }],
      usage: { prompt_tokens: 100, completion_tokens: 20 },
    })
    const result = await provider.chatWithTools!(MESSAGES, SAMPLE_TOOLS)
    expect(result.toolCalls[0].id).toBe('wai-tc-0')
  })
})

// ---------------------------------------------------------------------------
// Anthropic — chatWithTools
// ---------------------------------------------------------------------------

describe('AnthropicProvider.chatWithTools', () => {
  function mockFetch(responseBody: unknown, status = 200) {
    return vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      text: async () => JSON.stringify(responseBody),
      json: async () => responseBody,
    })
  }

  it('parses tool_use content blocks', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = mockFetch({
      content: [
        { type: 'text', text: '讓我搜尋一下' },
        { type: 'tool_use', id: 'tu-1', name: 'search_routes', input: { query: '龍洞' } },
      ],
      stop_reason: 'tool_use',
      usage: { input_tokens: 150, output_tokens: 40 },
    })
    try {
      const provider = new AnthropicProvider('test-key')
      const result = await provider.chatWithTools!(MESSAGES, SAMPLE_TOOLS)
      expect(result.stopReason).toBe('tool_use')
      expect(result.toolCalls).toHaveLength(1)
      expect(result.toolCalls[0]).toEqual({
        id: 'tu-1',
        name: 'search_routes',
        input: { query: '龍洞' },
      })
      expect(result.content).toBe('讓我搜尋一下')
      expect(result.usage).toEqual({ input: 150, output: 40 })
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it('returns end_turn when no tool_use blocks', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = mockFetch({
      content: [{ type: 'text', text: '龍洞有很多路線' }],
      stop_reason: 'end_turn',
      usage: { input_tokens: 100, output_tokens: 30 },
    })
    try {
      const provider = new AnthropicProvider('test-key')
      const result = await provider.chatWithTools!(MESSAGES, SAMPLE_TOOLS)
      expect(result.stopReason).toBe('end_turn')
      expect(result.toolCalls).toHaveLength(0)
      expect(result.content).toBe('龍洞有很多路線')
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it('handles multiple tool calls in one response', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = mockFetch({
      content: [
        { type: 'tool_use', id: 'tu-1', name: 'search_routes', input: { query: '龍洞 5.10' } },
        { type: 'tool_use', id: 'tu-2', name: 'search_routes', input: { query: '龍洞 5.11' } },
      ],
      stop_reason: 'tool_use',
      usage: { input_tokens: 200, output_tokens: 60 },
    })
    try {
      const provider = new AnthropicProvider('test-key')
      const result = await provider.chatWithTools!(MESSAGES, SAMPLE_TOOLS)
      expect(result.toolCalls).toHaveLength(2)
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it('throws on API error', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = mockFetch({ error: 'bad request' }, 400)
    try {
      const provider = new AnthropicProvider('test-key')
      await expect(provider.chatWithTools!(MESSAGES, SAMPLE_TOOLS)).rejects.toThrow(
        'Anthropic error: 400'
      )
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})

// ---------------------------------------------------------------------------
// OpenAI — chatWithTools
// ---------------------------------------------------------------------------

describe('OpenAIProvider.chatWithTools', () => {
  function mockFetch(responseBody: unknown, status = 200) {
    return vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      text: async () => JSON.stringify(responseBody),
      json: async () => responseBody,
    })
  }

  it('parses function calling tool_calls', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = mockFetch({
      choices: [
        {
          message: {
            content: null,
            tool_calls: [
              {
                id: 'call-1',
                function: { name: 'search_routes', arguments: '{"query":"龍洞"}' },
              },
            ],
          },
          finish_reason: 'tool_calls',
        },
      ],
      usage: { prompt_tokens: 120, completion_tokens: 25 },
    })
    try {
      const provider = new OpenAIProvider('test-key')
      const result = await provider.chatWithTools!(MESSAGES, SAMPLE_TOOLS)
      expect(result.stopReason).toBe('tool_use')
      expect(result.toolCalls).toHaveLength(1)
      expect(result.toolCalls[0]).toEqual({
        id: 'call-1',
        name: 'search_routes',
        input: { query: '龍洞' },
      })
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it('returns end_turn when no tool_calls', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = mockFetch({
      choices: [
        {
          message: { content: '直接回答', tool_calls: undefined },
          finish_reason: 'stop',
        },
      ],
      usage: { prompt_tokens: 80, completion_tokens: 20 },
    })
    try {
      const provider = new OpenAIProvider('test-key')
      const result = await provider.chatWithTools!(MESSAGES, SAMPLE_TOOLS)
      expect(result.stopReason).toBe('end_turn')
      expect(result.content).toBe('直接回答')
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it('handles malformed JSON arguments gracefully', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = mockFetch({
      choices: [
        {
          message: {
            content: null,
            tool_calls: [
              {
                id: 'call-1',
                function: { name: 'search_routes', arguments: 'not-json' },
              },
            ],
          },
          finish_reason: 'tool_calls',
        },
      ],
      usage: { prompt_tokens: 120, completion_tokens: 25 },
    })
    try {
      const provider = new OpenAIProvider('test-key')
      const result = await provider.chatWithTools!(MESSAGES, SAMPLE_TOOLS)
      expect(result.toolCalls[0].input).toEqual({})
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})

// ---------------------------------------------------------------------------
// Google — chatWithTools
// ---------------------------------------------------------------------------

describe('GoogleProvider.chatWithTools', () => {
  function mockFetch(responseBody: unknown, status = 200) {
    return vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      text: async () => JSON.stringify(responseBody),
      json: async () => responseBody,
    })
  }

  it('parses functionCall parts', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = mockFetch({
      candidates: [
        {
          content: {
            parts: [{ functionCall: { name: 'search_routes', args: { query: '龍洞' } } }],
          },
        },
      ],
      usageMetadata: { promptTokenCount: 130, candidatesTokenCount: 35 },
    })
    try {
      const provider = new GoogleProvider('test-key')
      const result = await provider.chatWithTools!(MESSAGES, SAMPLE_TOOLS)
      expect(result.stopReason).toBe('tool_use')
      expect(result.toolCalls).toHaveLength(1)
      expect(result.toolCalls[0].name).toBe('search_routes')
      expect(result.toolCalls[0].input).toEqual({ query: '龍洞' })
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it('returns end_turn with text-only parts', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = mockFetch({
      candidates: [
        {
          content: { parts: [{ text: '龍洞攀岩場' }] },
        },
      ],
      usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 20 },
    })
    try {
      const provider = new GoogleProvider('test-key')
      const result = await provider.chatWithTools!(MESSAGES, SAMPLE_TOOLS)
      expect(result.stopReason).toBe('end_turn')
      expect(result.content).toBe('龍洞攀岩場')
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})

// ---------------------------------------------------------------------------
// GitHub Models — chatWithTools (delegates to OpenAI adapter)
// ---------------------------------------------------------------------------

describe('GitHubModelsProvider.chatWithTools', () => {
  function mockFetch(responseBody: unknown, status = 200) {
    return vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      text: async () => JSON.stringify(responseBody),
      json: async () => responseBody,
    })
  }

  it('uses token auth header', async () => {
    const originalFetch = globalThis.fetch
    const fetchMock = mockFetch({
      choices: [
        {
          message: { content: '回答', tool_calls: undefined },
          finish_reason: 'stop',
        },
      ],
      usage: { prompt_tokens: 80, completion_tokens: 20 },
    })
    globalThis.fetch = fetchMock
    try {
      const provider = new GitHubModelsProvider('gh-token')
      await provider.chatWithTools!(MESSAGES, SAMPLE_TOOLS)
      const callArgs = fetchMock.mock.calls[0]
      expect(callArgs[0]).toContain('models.github.ai')
      expect(callArgs[1].headers.Authorization).toBe('token gh-token')
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it('parses tool calls same as OpenAI', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = mockFetch({
      choices: [
        {
          message: {
            content: null,
            tool_calls: [
              {
                id: 'gh-call-1',
                function: { name: 'search_routes', arguments: '{"query":"大砲岩"}' },
              },
            ],
          },
          finish_reason: 'tool_calls',
        },
      ],
      usage: { prompt_tokens: 100, completion_tokens: 30 },
    })
    try {
      const provider = new GitHubModelsProvider('gh-token')
      const result = await provider.chatWithTools!(MESSAGES, SAMPLE_TOOLS)
      expect(result.stopReason).toBe('tool_use')
      expect(result.toolCalls[0].name).toBe('search_routes')
      expect(result.toolCalls[0].input).toEqual({ query: '大砲岩' })
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
