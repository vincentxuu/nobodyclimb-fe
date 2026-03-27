export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMCallOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  tools?: Array<{
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  }>;
  gatewayOptions?: { gateway: { id: string } };
}

export interface LLMResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  toolCall?: {
    name: string;
    arguments: Record<string, unknown>;
  };
}

export interface EmbeddingOptions {
  model?: string;
}

export interface AIProvider {
  name: string;
  /** 呼叫 LLM 生成，支援 tool calling */
  chat(messages: ChatMessage[], opts?: LLMCallOptions): Promise<LLMResponse>;
  /** 串流生成，每個 token 觸發 onToken callback */
  streamChat(
    messages: ChatMessage[],
    opts: LLMCallOptions & { onToken: (token: string) => Promise<void> }
  ): Promise<LLMResponse>;
  /** 向量嵌入 */
  embed(text: string, opts?: EmbeddingOptions): Promise<number[]>;
  /** 批次向量嵌入 */
  embedBatch(texts: string[], opts?: EmbeddingOptions): Promise<number[][]>;
}

export type ProviderName = 'cloudflare' | 'openai' | 'anthropic' | 'google';
