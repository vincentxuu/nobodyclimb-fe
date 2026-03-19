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
    // 使用現有的 streamLLMGeneration 邏輯移植至此
    // ...
    return { content: '' };
  }

  async embed(text: string, opts: EmbeddingOptions = {}): Promise<number[]> {
    const result = await this.ai.run(
      opts.model ?? this.defaultEmbeddingModel,
      { text: [text] } as Parameters<typeof this.ai.run>[1],
    );
    return (result as { data: number[][] }).data[0];
  }

  async embedBatch(texts: string[], opts: EmbeddingOptions = {}): Promise<number[][]> {
    const result = await this.ai.run(
      opts.model ?? this.defaultEmbeddingModel,
      { text: texts } as Parameters<typeof this.ai.run>[1],
    );
    return (result as { data: number[][] }).data;
  }
}
