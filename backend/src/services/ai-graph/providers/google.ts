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

export class GoogleProvider implements AIProvider {
  readonly name = 'google'
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta'

  constructor(
    private readonly apiKey: string,
    private readonly defaultModel = 'gemini-2.0-flash',
    private readonly defaultEmbeddingModel = 'text-embedding-004'
  ) {}

  async chat(messages: ChatMessage[], opts: LLMCallOptions = {}): Promise<LLMResponse> {
    const model = opts.model ?? this.defaultModel
    const systemInstruction = messages.find((m) => m.role === 'system')
    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))
    const body: Record<string, unknown> = {
      contents,
      generationConfig: { maxOutputTokens: opts.maxTokens, temperature: opts.temperature ?? 0.7 },
    }
    if (systemInstruction) body.systemInstruction = { parts: [{ text: systemInstruction.content }] }
    const res = await fetch(`${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`Google AI error: ${res.status} ${await res.text()}`)
    const data = (await res.json()) as {
      candidates: Array<{ content: { parts: Array<{ text: string }> } }>
      usageMetadata: {
        promptTokenCount: number
        candidatesTokenCount: number
        totalTokenCount: number
      }
    }
    return {
      content: data.candidates[0]?.content.parts[0]?.text ?? '',
      usage: {
        prompt_tokens: data.usageMetadata.promptTokenCount,
        completion_tokens: data.usageMetadata.candidatesTokenCount,
        total_tokens: data.usageMetadata.totalTokenCount,
      },
    }
  }

  async streamChat(
    messages: ChatMessage[],
    opts: LLMCallOptions & { onToken: (token: string) => Promise<void> }
  ): Promise<LLMResponse> {
    const model = opts.model ?? this.defaultModel
    const systemInstruction = messages.find((m) => m.role === 'system')
    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))
    const body: Record<string, unknown> = { contents }
    if (systemInstruction) body.systemInstruction = { parts: [{ text: systemInstruction.content }] }
    const res = await fetch(
      `${this.baseUrl}/models/${model}:streamGenerateContent?key=${this.apiKey}&alt=sse`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    )
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
        try {
          const chunk = JSON.parse(line.slice(6)) as {
            candidates: Array<{ content: { parts: Array<{ text: string }> } }>
          }
          const text = chunk.candidates[0]?.content.parts[0]?.text ?? ''
          if (text) {
            fullContent += text
            await opts.onToken(text)
          }
        } catch {
          /* ignore */
        }
      }
    }
    return { content: fullContent }
  }

  async embed(text: string, opts: EmbeddingOptions = {}): Promise<number[]> {
    const model = opts.model ?? this.defaultEmbeddingModel
    const res = await fetch(`${this.baseUrl}/models/${model}:embedContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: `models/${model}`, content: { parts: [{ text }] } }),
    })
    const data = (await res.json()) as { embedding: { values: number[] } }
    return data.embedding.values
  }

  async embedBatch(texts: string[], opts: EmbeddingOptions = {}): Promise<number[][]> {
    const model = opts.model ?? this.defaultEmbeddingModel
    const res = await fetch(
      `${this.baseUrl}/models/${model}:batchEmbedContents?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: texts.map((text) => ({
            model: `models/${model}`,
            content: { parts: [{ text }] },
          })),
        }),
      }
    )
    const data = (await res.json()) as { embeddings: Array<{ values: number[] }> }
    return data.embeddings.map((e) => e.values)
  }

  async chatWithTools(
    messages: ChatMessage[],
    tools: ToolSchema[],
    opts: ChatWithToolsOptions = {}
  ): Promise<ToolUseResponse> {
    const model = opts.model ?? this.defaultModel
    const systemInstruction = opts.system ?? messages.find((m) => m.role === 'system')?.content
    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        maxOutputTokens: opts.maxTokens,
        temperature: opts.temperature ?? 0.7,
      },
    }
    if (systemInstruction) {
      body.systemInstruction = { parts: [{ text: systemInstruction }] }
    }
    if (tools.length) {
      body.tools = [
        {
          functionDeclarations: tools.map((t) => ({
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          })),
        },
      ]
    }

    const res = await fetch(`${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`Google AI error: ${res.status} ${await res.text()}`)

    const data = (await res.json()) as {
      candidates: Array<{
        content: {
          parts: Array<{
            text?: string
            functionCall?: { name: string; args: Record<string, unknown> }
          }>
        }
      }>
      usageMetadata: {
        promptTokenCount: number
        candidatesTokenCount: number
      }
    }

    const parts = data.candidates[0]?.content?.parts ?? []
    const textParts = parts.filter((p) => p.text).map((p) => p.text!)
    const toolCalls = parts
      .filter((p) => p.functionCall)
      .map((p, idx) => ({
        id: `google-tc-${idx}`,
        name: p.functionCall!.name,
        input: p.functionCall!.args ?? {},
      }))

    return {
      content: textParts.join('') || undefined,
      toolCalls,
      stopReason: toolCalls.length > 0 ? 'tool_use' : 'end_turn',
      usage: {
        input: data.usageMetadata?.promptTokenCount ?? 0,
        output: data.usageMetadata?.candidatesTokenCount ?? 0,
      },
    }
  }
}
