// 封裝現有的 Cloudflare Workers AI binding 呼叫
import { AIProvider, ChatMessage, EmbeddingOptions, LLMCallOptions, LLMResponse } from './types';
import { Env } from '../../../types';

export class CloudflareProvider implements AIProvider {
  readonly name = 'cloudflare';
  constructor(
    private readonly ai: Env['AI'],
    private readonly defaultModel = '@cf/meta/llama-3.1-8b-instruct',
    private readonly defaultEmbeddingModel = '@cf/baai/bge-m3',
  ) {}

  async chat(messages: ChatMessage[], opts: LLMCallOptions = {}): Promise<LLMResponse> {
    const response = await this.ai.run(opts.model ?? this.defaultModel, {
      messages,
      max_tokens: opts.maxTokens,
      tools: opts.tools,
    } as Parameters<typeof this.ai.run>[1], opts.gatewayOptions);
    // parse Workers AI response format
    const content = (response as { response?: string; result?: { response: string } })?.response
      ?? (response as { result?: { response: string } })?.result?.response ?? '';
    return { content, usage: (response as { usage?: LLMResponse['usage'] }).usage };
  }

  async streamChat(
    messages: ChatMessage[],
    opts: LLMCallOptions & { onToken: (token: string) => Promise<void> },
  ): Promise<LLMResponse> {
    // TODO: Cloudflare Workers AI streaming requires EventSource/ReadableStream handling.
    // Not yet implemented — use non-streaming chat() until this is ported from the legacy pipeline.
    throw new Error('CloudflareProvider.streamChat is not yet implemented. Use chat() for non-streaming generation.');
  }

  async embed(text: string, opts: EmbeddingOptions = {}): Promise<number[]> {
    const result = await this.ai.run(
      opts.model ?? this.defaultEmbeddingModel,
      { text: [text] } as Parameters<typeof this.ai.run>[1],
    );
    const data = (result as { data?: number[][] }).data;
    if (!data || !data[0]) throw new Error('CloudflareProvider embed: unexpected response shape');
    return data[0];
  }

  async embedBatch(texts: string[], opts: EmbeddingOptions = {}): Promise<number[][]> {
    const result = await this.ai.run(
      opts.model ?? this.defaultEmbeddingModel,
      { text: texts } as Parameters<typeof this.ai.run>[1],
    );
    const data = (result as { data?: number[][] }).data;
    if (!data) throw new Error('CloudflareProvider embedBatch: unexpected response shape');
    return data;
  }
}
