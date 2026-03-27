import type { Env, ParsedQuery } from '../../types';
import type { TokenUsageInfo } from '../pipeline/types';
import { TOOL_SELECTION_PROMPT, HYDE_PROMPT, MULTI_QUERY_EXPANSION_PROMPT, JUDGE_PROMPT } from '../../utils/ai-prompts';
import { estimateTokens, extractResponseText, type LLMResponse } from './types';
import { DEFAULT_LIGHTWEIGHT_MODEL } from './config';
import toolRegistry from '../tool-registry';
import { logGeneration } from '../../utils/langfuse';
import type { LangfuseParent } from '../../utils/langfuse';

// LLM A：解析查詢意圖，選擇搜尋工具與參數
// 失敗時回傳 null，由呼叫方 fallback 到 regex 方法
export async function parseQueryWithLLM(
  env: Env,
  query: string,
  llmModel: string,
  crags: string[],
  areas: string[],
  regions: string[],
  gatewayOptions?: { gateway: { id: string } },
  promptTemplate?: string,
  langfuseParent?: LangfuseParent | null,
): Promise<{ result: ParsedQuery | null; usage?: TokenUsageInfo }> {
  const prompt = (promptTemplate ?? TOOL_SELECTION_PROMPT)
    .replace('{crags}', crags.join('、') || '無')
    .replace('{areas}', areas.join('、') || '無')
    .replace('{regions}', regions.join('、') || '無')
    .replace('{query}', query);

  let rawResult: LLMResponse | undefined;
  try {
    rawResult = (await env.AI.run(
      llmModel,
      { messages: [{ role: 'user', content: prompt }] },
      gatewayOptions
    )) as LLMResponse;
  } catch {
    return { result: null };
  }

  const text = extractResponseText(rawResult);
  logGeneration(langfuseParent ?? null, {
    name: 'tool-selection',
    model: llmModel,
    input: [{ role: 'user', content: prompt }],
    output: text,
    usage: rawResult.usage ? {
      promptTokens: rawResult.usage.prompt_tokens,
      completionTokens: rawResult.usage.completion_tokens,
      totalTokens: rawResult.usage.total_tokens,
    } : undefined,
  });
  const usage: TokenUsageInfo = rawResult.usage
    ? { ...rawResult.usage, estimated: false }
    : { ...estimateTokens(prompt, text), estimated: true };

  try {
    const jsonText = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(jsonText) as ParsedQuery;

    if (!parsed.tool || !toolRegistry.getValidToolNames().includes(parsed.tool)) {
      return { result: null, usage };
    }
    if (!parsed.query_type || !['simple', 'complex', 'general-knowledge', 'sql', 'hybrid', 'clarification-needed'].includes(parsed.query_type)) {
      parsed.query_type = 'complex';
    }
    // multi_tool 驗證
    if (parsed.tool === 'multi_tool') {
      const validSubTools = toolRegistry.getValidToolNames().filter((t) => t !== 'multi_tool' && t !== 'general_knowledge');
      if (!parsed.multi_tool?.steps || !Array.isArray(parsed.multi_tool.steps) || parsed.multi_tool.steps.length === 0) {
        parsed.tool = 'search_routes';
        parsed.multi_tool = undefined;
      } else {
        const validSteps = parsed.multi_tool.steps.filter((s) => s.tool && validSubTools.includes(s.tool));
        if (validSteps.length === 0) {
          parsed.tool = 'search_routes';
          parsed.multi_tool = undefined;
        } else {
          parsed.multi_tool.steps = validSteps.slice(0, 3);
        }
      }
    }
    // confidence normalize
    if (typeof parsed.confidence !== 'number' || isNaN(parsed.confidence)) {
      parsed.confidence = 1.0;
    } else {
      parsed.confidence = Math.max(0, Math.min(1, parsed.confidence));
    }
    if (parsed.alternative && !toolRegistry.getValidToolNames().includes(parsed.alternative)) {
      parsed.alternative = undefined;
    }
    return { result: parsed, usage };
  } catch {
    return { result: null, usage };
  }
}

// LLM B：HyDE - 生成假設性理想答案文件以提升語義搜尋效果
export async function generateHyDE(
  env: Env,
  query: string,
  llmModel: string,
  gatewayOptions?: { gateway: { id: string } },
  promptTemplate?: string,
  langfuseParent?: LangfuseParent | null,
): Promise<{ doc: string; usage?: TokenUsageInfo }> {
  const prompt = (promptTemplate ?? HYDE_PROMPT).replace('{query}', query);
  try {
    const result = (await env.AI.run(
      llmModel,
      { messages: [{ role: 'user', content: prompt }] },
      gatewayOptions
    )) as LLMResponse;

    const doc = extractResponseText(result);
    logGeneration(langfuseParent ?? null, {
      name: 'hyde',
      model: llmModel,
      input: [{ role: 'user', content: prompt }],
      output: doc,
      usage: result.usage ? {
        promptTokens: result.usage.prompt_tokens,
        completionTokens: result.usage.completion_tokens,
        totalTokens: result.usage.total_tokens,
      } : undefined,
    });
    const usage: TokenUsageInfo = result.usage
      ? { ...result.usage, estimated: false }
      : { ...estimateTokens(prompt, doc), estimated: true };
    return { doc, usage };
  } catch {
    return { doc: '' };
  }
}

// Multi-Query Expansion：將查詢改寫為 N 個不同角度的子查詢
export async function generateMultipleQueries(
  env: Env,
  query: string,
  count: number,
  model: string,
  gatewayOptions?: { gateway: { id: string } },
  promptTemplate?: string,
  langfuseParent?: LangfuseParent | null,
): Promise<{ queries: string[]; usage?: TokenUsageInfo }> {
  const prompt = (promptTemplate ?? MULTI_QUERY_EXPANSION_PROMPT)
    .replace(/\{count\}/g, String(count))
    .replace('{query}', query);
  try {
    const result = (await (env.AI.run as Function)(
      model,
      { messages: [{ role: 'user', content: prompt }], max_tokens: 200 },
      gatewayOptions
    )) as LLMResponse;
    const text = extractResponseText(result);
    logGeneration(langfuseParent ?? null, {
      name: 'multi-query',
      model,
      input: [{ role: 'user', content: prompt }],
      output: text,
      usage: result.usage ? {
        promptTokens: result.usage.prompt_tokens,
        completionTokens: result.usage.completion_tokens,
        totalTokens: result.usage.total_tokens,
      } : undefined,
    });
    const queries = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .slice(0, count);
    const usage: TokenUsageInfo = result.usage
      ? { ...result.usage, estimated: false }
      : { ...estimateTokens(prompt, text), estimated: true };
    return { queries, usage };
  } catch {
    return { queries: [] };
  }
}

// LLM 串流生成：邊生成邊透過 onToken 回調推送，回傳完整原始文字
// 偵測 ---SUGGESTIONS--- 標記，標記之前的內容推送給 onToken，之後收集但不推送
export async function streamLLMGeneration(
  env: Env,
  model: string,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  maxTokens: number,
  gatewayOptions: unknown,
  onToken: (token: string) => Promise<void>,
  langfuseParent?: LangfuseParent | null,
): Promise<string> {
  const stream = (await (env.AI.run as Function)(
    model,
    { messages, max_tokens: maxTokens, stream: true },
    gatewayOptions,
  )) as ReadableStream<Uint8Array>;

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
        if (payload === '[DONE]') break;
        try {
          const parsed = JSON.parse(payload) as { response?: string };
          if (!parsed.response) continue;

          fullText += parsed.response;
          if (suggestionsStarted) continue;

          slideBuffer += parsed.response;
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
        } catch { /* 忽略格式錯誤的 SSE 行 */ }
      }
    }
    if (!suggestionsStarted && slideBuffer) await onToken(slideBuffer);
  } finally {
    reader.releaseLock();
  }

  logGeneration(langfuseParent ?? null, {
    name: 'llm-generation-stream',
    model,
    input: messages,
    output: fullText,
    metadata: { streaming: true },
  });
  return fullText;
}

// 解析 judge LLM 回傳的 JSON，容錯處理格式錯誤
export function parseJudgeResponse(raw: string): { groundedness: number | null; quality: number | null; constraint_ok: boolean } {
  if (raw.includes('<float') || raw.includes('<int')) {
    return { groundedness: null, quality: null, constraint_ok: true };
  }

  try {
    const jsonMatch = raw.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const groundedness = typeof parsed.groundedness === 'number' && parsed.groundedness >= 0 && parsed.groundedness <= 1
        ? parsed.groundedness : null;
      let quality = typeof parsed.quality === 'number' && Number.isInteger(parsed.quality) && parsed.quality >= 1 && parsed.quality <= 4
        ? parsed.quality : null;
      const constraint_ok = parsed.constraint_ok === false ? false : true;
      // 約束違反時強制 quality = 1
      if (!constraint_ok && quality !== null) quality = 1;
      if (groundedness !== null || quality !== null) return { groundedness, quality, constraint_ok };
    }
  } catch { /* fall through */ }

  let groundedness: number | null = null;
  let quality: number | null = null;
  const gMatch = raw.match(/groundedness[^0-9]*([0-9]+(?:\.[0-9]+)?)/i);
  if (gMatch) {
    const g = parseFloat(gMatch[1]);
    if (g >= 0 && g <= 1) groundedness = g;
  }
  const qMatch = raw.match(/quality[^1-4]*([1-4])(?![0-9])/i);
  if (qMatch) {
    quality = parseInt(qMatch[1], 10);
  }
  return { groundedness, quality, constraint_ok: true };
}

// 呼叫 judge LLM，timeout 與 context 截斷長度由 config 控制
export async function runJudge(
  env: Env,
  query: string,
  context: string,
  response: string,
  opts: { model?: string; timeoutMs?: number; contextTruncate?: number; promptTemplate?: string } = {},
  langfuseParent?: LangfuseParent | null,
): Promise<{
  groundedness: number | null;
  quality: number | null;
  constraint_ok: boolean;
  rawResponse: string | null;
  contextChars: number;
  contextTruncated: boolean;
  usage?: TokenUsageInfo;
}> {
  const { model: judgeModel, timeoutMs = 8000, contextTruncate = 2000, promptTemplate } = opts;
  const truncatedContext = context.slice(0, contextTruncate);
  const judgePrompt = (promptTemplate ?? JUDGE_PROMPT)
    .replace('{context}', truncatedContext)
    .replace('{query}', query)
    .replace('{response}', response);
  const model = judgeModel ?? DEFAULT_LIGHTWEIGHT_MODEL;
  const contextTruncated = context.length > contextTruncate;

  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('judge timeout')), timeoutMs)
    );
    const judgePromise = (env.AI.run as Function)(
      model,
      {
        messages: [
          { role: 'system', content: '只回傳 JSON，不含任何說明文字。格式：{"groundedness": <float 0.0-1.0>, "quality": <int 1-4>, "constraint_ok": <true|false>}' },
          { role: 'user', content: judgePrompt },
        ],
        max_tokens: 60,
      }
    ) as Promise<LLMResponse>;

    const judgeResult = await Promise.race([judgePromise, timeoutPromise]);
    const rawResponse = extractResponseText(judgeResult);
    const scores = parseJudgeResponse(rawResponse);
    logGeneration(langfuseParent ?? null, {
      name: 'judge',
      model,
      input: [
        { role: 'system', content: '只回傳 JSON，不含任何說明文字。' },
        { role: 'user', content: judgePrompt },
      ],
      output: rawResponse,
      usage: judgeResult.usage ? {
        promptTokens: judgeResult.usage.prompt_tokens,
        completionTokens: judgeResult.usage.completion_tokens,
        totalTokens: judgeResult.usage.total_tokens,
      } : undefined,
    });
    const usage: TokenUsageInfo = judgeResult.usage
      ? { ...judgeResult.usage, estimated: false }
      : { ...estimateTokens(judgePrompt, rawResponse), estimated: true };
    return { ...scores, rawResponse, contextChars: truncatedContext.length, contextTruncated, usage };
  } catch (err) {
    console.error('[judge] error:', err instanceof Error ? err.message : String(err));
    return { groundedness: null, quality: null, constraint_ok: true, rawResponse: null, contextChars: truncatedContext.length, contextTruncated };
  }
}
