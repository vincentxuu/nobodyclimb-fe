/**
 * 統一 LLM 提供者客戶端
 *
 * 支援的提供者（由 model 名稱自動偵測）：
 *   - Cloudflare Workers AI : @cf/...
 *   - OpenAI                : gpt-*, o1-*, o3-*, o4-*
 *   - Anthropic             : claude-*
 *   - Google Gemini         : gemini-* (OpenAI 相容端點)
 *
 * 使用方式：
 *   // 非串流
 *   const result = await callLLM(env, model, messages, { maxTokens: 800 });
 *
 *   // 串流
 *   const fullText = await streamLLM(env, model, messages, maxTokens, gatewayOptions, onToken);
 */

import type { Env } from '../types';
import type { LLMResponse } from './query/types';

// ── Provider detection ────────────────────────────────────────────────────────

export type LLMProvider = 'cloudflare' | 'openai' | 'anthropic' | 'google';

/**
 * 從 model 名稱推斷 LLM 提供者。
 * - `@cf/...`           → Cloudflare Workers AI
 * - `gpt-*` / `o1-*` / `o3-*` / `o4-*` → OpenAI
 * - `claude-*`          → Anthropic
 * - `gemini-*`          → Google Gemini（OpenAI 相容 API）
 */
export function detectProvider(model: string): LLMProvider {
  if (model.startsWith('@cf/')) return 'cloudflare';
  if (/^(gpt-|o1-|o3-|o4-)/.test(model)) return 'openai';
  if (model.startsWith('claude-')) return 'anthropic';
  if (model.startsWith('gemini-')) return 'google';
  return 'cloudflare'; // fallback
}

// ── Public interface ──────────────────────────────────────────────────────────

export interface LLMCallOptions {
  maxTokens?: number;
  gatewayOptions?: { gateway: { id: string } };
}

/**
 * 統一非串流 LLM 呼叫。
 * 依 model 名稱自動選擇提供者，並正規化回傳格式為 LLMResponse。
 */
export async function callLLM(
  env: Env,
  model: string,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options: LLMCallOptions = {},
): Promise<LLMResponse> {
  const provider = detectProvider(model);

  switch (provider) {
    case 'cloudflare': return callCloudflare(env, model, messages, options);
    case 'openai':     return callOpenAICompat(env, model, messages, options, 'openai');
    case 'google':     return callOpenAICompat(env, model, messages, options, 'google');
    case 'anthropic':  return callAnthropic(env, model, messages, options);
  }
}

/**
 * 統一串流 LLM 呼叫。
 * 偵測 ---SUGGESTIONS--- 標記，標記之前的內容透過 onToken 推送，之後收集但不推送。
 * 回傳完整原始文字。
 */
export async function streamLLM(
  env: Env,
  model: string,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  maxTokens: number,
  gatewayOptions: unknown,
  onToken: (token: string) => Promise<void>,
): Promise<string> {
  const provider = detectProvider(model);

  switch (provider) {
    case 'cloudflare': return streamCloudflare(env, model, messages, maxTokens, gatewayOptions, onToken);
    case 'openai':     return streamOpenAICompat(env, model, messages, maxTokens, 'openai', onToken);
    case 'google':     return streamOpenAICompat(env, model, messages, maxTokens, 'google', onToken);
    case 'anthropic':  return streamAnthropic(env, model, messages, maxTokens, onToken);
  }
}

// ── Non-streaming implementations ────────────────────────────────────────────

async function callCloudflare(
  env: Env,
  model: string,
  messages: Array<{ role: string; content: string }>,
  options: LLMCallOptions,
): Promise<LLMResponse> {
  const result = (await (env.AI.run as Function)(
    model,
    { messages, ...(options.maxTokens ? { max_tokens: options.maxTokens } : {}) },
    options.gatewayOptions,
  )) as LLMResponse;
  return { response: result.response ?? '', usage: result.usage };
}

async function callOpenAICompat(
  env: Env,
  model: string,
  messages: Array<{ role: string; content: string }>,
  options: LLMCallOptions,
  provider: 'openai' | 'google',
): Promise<LLMResponse> {
  const apiKey = provider === 'openai' ? env.OPENAI_API_KEY : env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error(`Missing API key for provider: ${provider}. Set ${provider === 'openai' ? 'OPENAI_API_KEY' : 'GOOGLE_AI_API_KEY'} secret.`);

  const baseUrl = provider === 'openai'
    ? 'https://api.openai.com/v1'
    : 'https://generativelanguage.googleapis.com/v1beta/openai';

  const body: Record<string, unknown> = { model, messages };
  if (options.maxTokens) body.max_tokens = options.maxTokens;

  const resp = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`${provider} API error ${resp.status}: ${errText.slice(0, 200)}`);
  }

  const data = await resp.json() as {
    choices: Array<{ message: { content: string } }>;
    usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  };

  return {
    response: data.choices[0]?.message?.content?.trim() ?? '',
    usage: data.usage,
  };
}

async function callAnthropic(
  env: Env,
  model: string,
  messages: Array<{ role: string; content: string }>,
  options: LLMCallOptions,
): Promise<LLMResponse> {
  if (!env.ANTHROPIC_API_KEY) throw new Error('Missing ANTHROPIC_API_KEY secret.');

  // Anthropic 要求 system prompt 獨立於 messages 之外
  const systemContent = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n');
  const chatMessages = messages.filter((m) => m.role !== 'system');

  const body: Record<string, unknown> = {
    model,
    max_tokens: options.maxTokens ?? 1024,
    messages: chatMessages,
  };
  if (systemContent) body.system = systemContent;

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Anthropic API error ${resp.status}: ${errText.slice(0, 200)}`);
  }

  const data = await resp.json() as {
    content: Array<{ type: string; text: string }>;
    usage?: { input_tokens: number; output_tokens: number };
  };

  const text = data.content.filter((c) => c.type === 'text').map((c) => c.text).join('');

  return {
    response: text.trim(),
    usage: data.usage
      ? {
          prompt_tokens: data.usage.input_tokens,
          completion_tokens: data.usage.output_tokens,
          total_tokens: data.usage.input_tokens + data.usage.output_tokens,
        }
      : undefined,
  };
}

// ── Streaming implementations ─────────────────────────────────────────────────

async function streamCloudflare(
  env: Env,
  model: string,
  messages: Array<{ role: string; content: string }>,
  maxTokens: number,
  gatewayOptions: unknown,
  onToken: (token: string) => Promise<void>,
): Promise<string> {
  const stream = (await (env.AI.run as Function)(
    model,
    { messages, max_tokens: maxTokens, stream: true },
    gatewayOptions,
  )) as ReadableStream<Uint8Array>;

  return consumeSSEStream(stream, parseCloudflareSSEPayload, onToken);
}

async function streamOpenAICompat(
  env: Env,
  model: string,
  messages: Array<{ role: string; content: string }>,
  maxTokens: number,
  provider: 'openai' | 'google',
  onToken: (token: string) => Promise<void>,
): Promise<string> {
  const apiKey = provider === 'openai' ? env.OPENAI_API_KEY : env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error(`Missing API key for provider: ${provider}`);

  const baseUrl = provider === 'openai'
    ? 'https://api.openai.com/v1'
    : 'https://generativelanguage.googleapis.com/v1beta/openai';

  const resp = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens, stream: true }),
  });

  if (!resp.ok || !resp.body) throw new Error(`${provider} stream error: ${resp.status}`);

  return consumeSSEStream(resp.body, parseOpenAISSEPayload, onToken);
}

async function streamAnthropic(
  env: Env,
  model: string,
  messages: Array<{ role: string; content: string }>,
  maxTokens: number,
  onToken: (token: string) => Promise<void>,
): Promise<string> {
  if (!env.ANTHROPIC_API_KEY) throw new Error('Missing ANTHROPIC_API_KEY secret.');

  const systemContent = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n');
  const chatMessages = messages.filter((m) => m.role !== 'system');

  const body: Record<string, unknown> = {
    model,
    max_tokens: maxTokens,
    messages: chatMessages,
    stream: true,
  };
  if (systemContent) body.system = systemContent;

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok || !resp.body) throw new Error(`Anthropic stream error: ${resp.status}`);

  return consumeSSEStream(resp.body, parseAnthropicSSEPayload, onToken);
}

// ── SSE payload parsers ───────────────────────────────────────────────────────

function parseCloudflareSSEPayload(payload: string): string | null {
  if (payload === '[DONE]') return null;
  try {
    const parsed = JSON.parse(payload) as { response?: string };
    return parsed.response ?? null;
  } catch { return null; }
}

function parseOpenAISSEPayload(payload: string): string | null {
  if (payload === '[DONE]') return null;
  try {
    const parsed = JSON.parse(payload) as {
      choices?: Array<{ delta?: { content?: string } }>;
    };
    return parsed.choices?.[0]?.delta?.content ?? null;
  } catch { return null; }
}

function parseAnthropicSSEPayload(payload: string): string | null {
  try {
    const parsed = JSON.parse(payload) as {
      type?: string;
      delta?: { type?: string; text?: string };
    };
    if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
      return parsed.delta.text ?? null;
    }
    return null;
  } catch { return null; }
}

// ── Generic SSE consumer (with ---SUGGESTIONS--- marker handling) ─────────────

/**
 * 消費 SSE ReadableStream，透過 parsePayload 提取 token。
 * 偵測 ---SUGGESTIONS--- 標記：標記前的 token 推送給 onToken，之後只累積不推送。
 */
async function consumeSSEStream(
  stream: ReadableStream<Uint8Array>,
  parsePayload: (payload: string) => string | null,
  onToken: (token: string) => Promise<void>,
): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let sseBuffer = '';
  let slideBuffer = '';
  let suggestionsStarted = false;
  const MARKER = '---SUGGESTIONS---';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      sseBuffer += decoder.decode(value, { stream: true });
      const lines = sseBuffer.split('\n');
      sseBuffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        const token = parsePayload(payload);
        if (token === null) continue;

        fullText += token;
        if (suggestionsStarted) continue;

        slideBuffer += token;
        const markerIdx = slideBuffer.indexOf(MARKER);
        if (markerIdx !== -1) {
          const beforeMarker = slideBuffer.slice(0, markerIdx);
          if (beforeMarker) await onToken(beforeMarker);
          suggestionsStarted = true;
        } else {
          const safeLen = slideBuffer.length - (MARKER.length - 1);
          if (safeLen > 0) {
            await onToken(slideBuffer.slice(0, safeLen));
            slideBuffer = slideBuffer.slice(safeLen);
          }
        }
      }
    }
    if (!suggestionsStarted && slideBuffer) await onToken(slideBuffer);
  } finally {
    reader.releaseLock();
  }

  return fullText;
}
