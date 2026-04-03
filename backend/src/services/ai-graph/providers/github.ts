/**
 * GitHub Models provider — OpenAI-compatible API
 * Endpoint: https://models.github.ai/inference
 * Auth: token <GITHUB_TOKEN>
 */

import { openAIChatWithTools } from './openai'
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

export class GitHubModelsProvider implements AIProvider {
  readonly name = 'github'
  private readonly baseUrl = 'https://models.github.ai/inference'

  constructor(
    private readonly token: string,
    private readonly defaultModel = 'openai/gpt-4o-mini'
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
      headers: {
        'Content-Type': 'application/json',
        Authorization: `token ${this.token}`,
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`GitHub Models error: ${res.status} ${await res.text()}`)
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
      headers: {
        'Content-Type': 'application/json',
        Authorization: `token ${this.token}`,
      },
      body: JSON.stringify({
        model: opts.model ?? this.defaultModel,
        messages,
        max_tokens: opts.maxTokens,
        stream: true,
      }),
    })
    if (!res.ok) throw new Error(`GitHub Models stream error: ${res.status}`)
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
          /* ignore */
        }
      }
    }
    return { content: fullContent }
  }

  async embed(_text: string, _opts?: EmbeddingOptions): Promise<number[]> {
    throw new Error('GitHubModelsProvider does not support embedding.')
  }

  async embedBatch(_texts: string[], _opts?: EmbeddingOptions): Promise<number[][]> {
    throw new Error('GitHubModelsProvider does not support embedding.')
  }

  async chatWithTools(
    messages: ChatMessage[],
    tools: ToolSchema[],
    opts: ChatWithToolsOptions = {}
  ): Promise<ToolUseResponse> {
    return openAIChatWithTools(
      this.baseUrl,
      this.token,
      'token',
      opts.model ?? this.defaultModel,
      messages,
      tools,
      opts
    )
  }
}
