import { Langfuse, LangfuseTraceClient, LangfuseSpanClient } from 'langfuse';
import { Env } from '../../types';

/** 每次請求建立一個新的 Langfuse client 實例（request-scoped）
 *  env 不含 keys 時回傳 null（靜默降級）
 */
export function getLangfuseClient(env: Env): Langfuse | null {
  if (!env.LANGFUSE_PUBLIC_KEY || !env.LANGFUSE_SECRET_KEY) return null;
  return new Langfuse({
    publicKey: env.LANGFUSE_PUBLIC_KEY,
    secretKey: env.LANGFUSE_SECRET_KEY,
    baseUrl: env.LANGFUSE_BASEURL ?? 'https://cloud.langfuse.com',
    flushAt: 10,
    flushInterval: 5000,
  });
}

/** 建立一個新 trace，代表一次完整的 AI 問答請求 */
export function createTrace(
  langfuse: Langfuse | null,
  opts: {
    name: string;
    userId?: string;
    sessionId?: string;
    input: unknown;
    metadata?: Record<string, unknown>;
  },
): LangfuseTraceClient | null {
  if (!langfuse) return null;
  return langfuse.trace({
    name: opts.name,
    userId: opts.userId,
    sessionId: opts.sessionId,
    input: opts.input,
    metadata: opts.metadata,
  });
}

/** 在 trace 下建立一個 span，代表一個 pipeline node 的執行 */
export function startSpan(
  trace: LangfuseTraceClient | null,
  name: string,
  input?: unknown,
): LangfuseSpanClient | null {
  if (!trace) return null;
  return trace.span({ name, input });
}

/** 結束一個 span，記錄輸出與 metadata */
export function endSpan(
  span: LangfuseSpanClient | null,
  opts: {
    output?: unknown;
    metadata?: Record<string, unknown>;
    level?: 'DEFAULT' | 'DEBUG' | 'WARNING' | 'ERROR';
  } = {},
): void {
  if (!span) return;
  span.end({
    output: opts.output,
    metadata: opts.metadata,
    level: opts.level,
  });
}

/** 強制 flush，在 Cloudflare Workers waitUntil 中呼叫 */
export async function flushLangfuse(langfuse: Langfuse | null): Promise<void> {
  if (!langfuse) return;
  await langfuse.flushAsync();
}
