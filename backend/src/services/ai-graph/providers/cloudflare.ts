// 封裝現有的 Cloudflare Workers AI binding 呼叫

import { Env } from '../../../types'
import { AIProvider, ChatMessage, EmbeddingOptions, LLMCallOptions, LLMResponse } from './types'

export class CloudflareProvider implements AIProvider {
  readonly name = 'cloudflare'
  constructor(
    private readonly ai: Env['AI'],
    private readonly defaultModel = '@cf/meta/llama-3.1-8b-instruct',
    private readonly defaultEmbeddingModel = '@cf/baai/bge-m3'
  ) {}

  async chat(messages: ChatMessage[], opts: LLMCallOptions = {}): Promise<LLMResponse> {
    const response = await this.ai.run(
      opts.model ?? this.defaultModel,
      {
        messages,
        max_tokens: opts.maxTokens,
        tools: opts.tools,
      } as Parameters<typeof this.ai.run>[1],
      opts.gatewayOptions
    )
    // parse Workers AI response format
    const content =
      (response as { response?: string; result?: { response: string } })?.response ??
      (response as { result?: { response: string } })?.result?.response ??
      ''
    return { content, usage: (response as { usage?: LLMResponse['usage'] }).usage }
  }

  async streamChat(
    messages: ChatMessage[],
    opts: LLMCallOptions & { onToken: (token: string) => Promise<void> }
  ): Promise<LLMResponse> {
    const stream = (await (this.ai.run as Function)(
      opts.model ?? this.defaultModel,
      { messages, max_tokens: opts.maxTokens, stream: true },
      opts.gatewayOptions
    )) as ReadableStream<Uint8Array>

    const reader = stream.getReader()
    const decoder = new TextDecoder()
    let fullText = ''
    let sseBuffer = ''
    // 偵測 ---SUGGESTIONS--- 標記，標記之前推送給 onToken，之後收集但不推送
    let slideBuffer = ''
    let suggestionsStarted = false
    const MARKER = '---SUGGESTIONS---'

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        sseBuffer += decoder.decode(value, { stream: true })
        const lines = sseBuffer.split('\n')
        sseBuffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6).trim()
          if (payload === '[DONE]') break
          try {
            const parsed = JSON.parse(payload) as { response?: string }
            if (!parsed.response) continue

            fullText += parsed.response
            if (suggestionsStarted) continue

            slideBuffer += parsed.response
            const markerIdx = slideBuffer.indexOf(MARKER)
            if (markerIdx !== -1) {
              const beforeMarker = slideBuffer.slice(0, markerIdx)
              if (beforeMarker) await opts.onToken(beforeMarker)
              suggestionsStarted = true
            } else {
              const safeLen = slideBuffer.length - (MARKER.length - 1)
              if (safeLen > 0) {
                await opts.onToken(slideBuffer.slice(0, safeLen))
                slideBuffer = slideBuffer.slice(safeLen)
              }
            }
          } catch {
            /* 忽略格式錯誤的 SSE 行 */
          }
        }
      }
      if (!suggestionsStarted && slideBuffer) await opts.onToken(slideBuffer)
    } finally {
      reader.releaseLock()
    }

    return { content: fullText }
  }

  async embed(text: string, opts: EmbeddingOptions = {}): Promise<number[]> {
    const result = await this.ai.run(opts.model ?? this.defaultEmbeddingModel, {
      text: [text],
    } as Parameters<typeof this.ai.run>[1])
    const data = (result as { data?: number[][] }).data
    if (!data || !data[0]) throw new Error('CloudflareProvider embed: unexpected response shape')
    return data[0]
  }

  async embedBatch(texts: string[], opts: EmbeddingOptions = {}): Promise<number[][]> {
    const result = await this.ai.run(opts.model ?? this.defaultEmbeddingModel, {
      text: texts,
    } as Parameters<typeof this.ai.run>[1])
    const data = (result as { data?: number[][] }).data
    if (!data) throw new Error('CloudflareProvider embedBatch: unexpected response shape')
    return data
  }
}
