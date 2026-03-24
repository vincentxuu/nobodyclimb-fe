import { AIProvider, ChatMessage, EmbeddingOptions, LLMCallOptions, LLMResponse } from './types';

export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic';
  private readonly baseUrl = 'https://api.anthropic.com/v1';

  constructor(
    private readonly apiKey: string,
    private readonly defaultModel = 'claude-haiku-4-5-20251001',
  ) {}

  async chat(messages: ChatMessage[], opts: LLMCallOptions = {}): Promise<LLMResponse> {
    const system = messages.find(m => m.role === 'system')?.content;
    const nonSystem = messages.filter(m => m.role !== 'system');
    const body: Record<string, unknown> = {
      model: opts.model ?? this.defaultModel,
      max_tokens: opts.maxTokens ?? 1024,
      messages: nonSystem,
    };
    if (system) body.system = system;
    if (opts.tools?.length) {
      body.tools = opts.tools.map(t => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters,
      }));
    }
    const res = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Anthropic error: ${res.status} ${await res.text()}`);
    const data = await res.json() as {
      content: Array<{ type: string; text?: string; name?: string; input?: Record<string, unknown> }>;
      usage: { input_tokens: number; output_tokens: number };
    };
    const textBlock = data.content.find(b => b.type === 'text');
    const toolBlock = data.content.find(b => b.type === 'tool_use');
    return {
      content: textBlock?.text ?? '',
      usage: {
        prompt_tokens: data.usage.input_tokens,
        completion_tokens: data.usage.output_tokens,
        total_tokens: data.usage.input_tokens + data.usage.output_tokens,
      },
      toolCall: toolBlock ? { name: toolBlock.name!, arguments: toolBlock.input! } : undefined,
    };
  }

  async streamChat(
    messages: ChatMessage[],
    opts: LLMCallOptions & { onToken: (token: string) => Promise<void> },
  ): Promise<LLMResponse> {
    const system = messages.find(m => m.role === 'system')?.content;
    const nonSystem = messages.filter(m => m.role !== 'system');
    const res = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: opts.model ?? this.defaultModel,
        max_tokens: opts.maxTokens ?? 1024,
        messages: nonSystem,
        system,
        stream: true,
      }),
    });
    let fullContent = '';
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = decoder.decode(value).split('\n');
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        try {
          const ev = JSON.parse(line.slice(5)) as { type: string; delta?: { type: string; text?: string } };
          if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta' && ev.delta.text) {
            fullContent += ev.delta.text;
            await opts.onToken(ev.delta.text);
          }
        } catch { /* ignore */ }
      }
    }
    return { content: fullContent };
  }

  // Anthropic 無原生 embedding API，降級至拋出錯誤，呼叫方應 fallback 到 Cloudflare
  async embed(_text: string): Promise<number[]> {
    throw new Error('AnthropicProvider does not support embedding. Configure a separate embedding provider.');
  }
  async embedBatch(_texts: string[]): Promise<number[][]> {
    throw new Error('AnthropicProvider does not support embedding.');
  }
}
