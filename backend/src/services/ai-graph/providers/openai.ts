import {
  AIProvider,
  ChatMessage,
  ChatWithToolsOptions,
  EmbeddingOptions,
  LLMCallOptions,
  LLMResponse,
  ToolSchema,
  ToolUseResponse,
} from './types'

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai'
  private readonly baseUrl = 'https://api.openai.com/v1'

  constructor(
    private readonly apiKey: string,
    private readonly defaultModel = 'gpt-4o-mini',
    private readonly defaultEmbeddingModel = 'text-embedding-3-small'
  ) {}

  async chat(messages: ChatMessage[], opts: LLMCallOptions = {}): Promise<LLMResponse> {
    const body: Record<string, unknown> = {
      model: opts.model ?? this.defaultModel,
      messages,
      max_tokens: opts.maxTokens,
      temperature: opts.temperature ?? 0.7,
    }
    if (opts.tools?.length) {
      body.tools = opts.tools.map((t) => ({
        type: 'function',
        function: { name: t.name, description: t.description, parameters: t.parameters },
      }))
      body.tool_choice = 'auto'
    }
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`OpenAI error: ${res.status} ${await res.text()}`)
    const data = (await res.json()) as {
      choices: Array<{
        message: {
          content: string
          tool_calls?: Array<{ function: { name: string; arguments: string } }>
        }
      }>
      usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
    }
    const choice = data.choices[0].message
    const toolCall = choice.tool_calls?.[0]?.function
      ? {
          name: choice.tool_calls[0].function.name,
          arguments: JSON.parse(choice.tool_calls[0].function.arguments),
        }
      : undefined
    return { content: choice.content ?? '', usage: data.usage, toolCall }
  }

  async streamChat(
    messages: ChatMessage[],
    opts: LLMCallOptions & { onToken: (token: string) => Promise<void> }
  ): Promise<LLMResponse> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: opts.model ?? this.defaultModel,
        messages,
        max_tokens: opts.maxTokens,
        stream: true,
      }),
    })
    if (!res.ok) throw new Error(`OpenAI stream error: ${res.status}`)
    let fullContent = ''
    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const lines = decoder
        .decode(value)
        .split('\n')
        .filter((l) => l.startsWith('data: '))
      for (const line of lines) {
        const data = line.slice(6)
        if (data === '[DONE]') break
        try {
          const chunk = JSON.parse(data) as { choices: Array<{ delta: { content?: string } }> }
          const token = chunk.choices[0]?.delta?.content ?? ''
          if (token) {
            fullContent += token
            await opts.onToken(token)
          }
        } catch {
          /* ignore parse errors */
        }
      }
    }
    return { content: fullContent }
  }

  async embed(text: string, opts: EmbeddingOptions = {}): Promise<number[]> {
    const res = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({ model: opts.model ?? this.defaultEmbeddingModel, input: text }),
    })
    if (!res.ok) throw new Error(`OpenAI embed error: ${res.status} ${await res.text()}`)
    const data = (await res.json()) as { data: Array<{ embedding: number[] }> }
    return data.data[0].embedding
  }

  async embedBatch(texts: string[], opts: EmbeddingOptions = {}): Promise<number[][]> {
    const res = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({ model: opts.model ?? this.defaultEmbeddingModel, input: texts }),
    })
    if (!res.ok) throw new Error(`OpenAI embedBatch error: ${res.status} ${await res.text()}`)
    const data = (await res.json()) as { data: Array<{ embedding: number[]; index: number }> }
    return data.data.sort((a, b) => a.index - b.index).map((d) => d.embedding)
  }

  async chatWithTools(
    messages: ChatMessage[],
    tools: ToolSchema[],
    opts: ChatWithToolsOptions = {}
  ): Promise<ToolUseResponse> {
    return openAIChatWithTools(
      this.baseUrl,
      this.apiKey,
      'Bearer',
      opts.model ?? this.defaultModel,
      messages,
      tools,
      opts
    )
  }
}

/**
 * 共用的 OpenAI-compatible chatWithTools 實作
 * OpenAI 與 GitHub Models 共用（API 格式相容）
 */
export async function openAIChatWithTools(
  baseUrl: string,
  apiKey: string,
  authScheme: 'Bearer' | 'token',
  model: string,
  messages: ChatMessage[],
  tools: ToolSchema[],
  opts: ChatWithToolsOptions = {}
): Promise<ToolUseResponse> {
  const apiMessages = [...messages]
  if (opts.system) {
    apiMessages.unshift({ role: 'system', content: opts.system })
  }

  const body: Record<string, unknown> = {
    model,
    messages: apiMessages,
    max_tokens: opts.maxTokens,
    temperature: opts.temperature ?? 0.7,
  }
  if (tools.length) {
    body.tools = tools.map((t) => ({
      type: 'function',
      function: { name: t.name, description: t.description, parameters: t.parameters },
    }))
    body.tool_choice = 'auto'
  }

  const authHeader = authScheme === 'token' ? `token ${apiKey}` : `Bearer ${apiKey}`
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: authHeader },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`OpenAI-compatible error: ${res.status} ${await res.text()}`)

  const data = (await res.json()) as {
    choices: Array<{
      message: {
        content: string | null
        tool_calls?: Array<{
          id: string
          function: { name: string; arguments: string }
        }>
      }
      finish_reason: string
    }>
    usage: { prompt_tokens: number; completion_tokens: number }
  }

  const choice = data.choices[0]
  const toolCalls = (choice.message.tool_calls ?? []).map((tc) => {
    let input: unknown = {}
    try {
      input = JSON.parse(tc.function.arguments)
    } catch {
      input = {}
    }
    return { id: tc.id, name: tc.function.name, input }
  })

  return {
    content: choice.message.content ?? undefined,
    toolCalls,
    stopReason:
      choice.finish_reason === 'tool_calls' || toolCalls.length > 0 ? 'tool_use' : 'end_turn',
    usage: {
      input: data.usage.prompt_tokens,
      output: data.usage.completion_tokens,
    },
  }
}
