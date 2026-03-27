import type { Env, AISource } from '../../types';
import type { PipelineConfig, TokenUsageInfo } from '../pipeline/types';
import { PLANNING_PROMPT, SYNTHESIS_PROMPT } from '../../utils/ai-prompts';
import { logGeneration } from '../../utils/langfuse';
import type { LangfuseParent } from '../../utils/langfuse';
import { EmbeddingService } from '../embedding';
import { estimateTokens, extractResponseText, type LLMResponse, type PlanStep, type ExecutionPlan, type StepExecutionResult, type SearchResult } from './types';
import { getDocuments, extractTitle, buildExcerpt, buildUrl } from './documents';
import { searchBM25, mergeResults } from './retrieval';

export type PlanExecuteDeps = {
  env: Env;
  embeddingService: EmbeddingService;
};

// 每輪搜尋：embedding + BM25 並行，RRF 合併（plan-execute 內部用）
async function runPlanSearch(
  deps: PlanExecuteDeps,
  query: string,
  filter: Record<string, unknown>,
  topK: number,
  bm25TopK: number,
): Promise<SearchResult[]> {
  const vecPromise = deps.embeddingService.embed(query).then((queryVector) =>
    deps.env.VECTOR_INDEX.query(queryVector, {
      topK,
      returnMetadata: 'all',
      filter: Object.keys(filter).length > 0 ? filter : undefined,
    })
  );

  const bm25Promise = searchBM25(deps.env.DB, query, bm25TopK);

  const [vecResult, bm25Matches] = await Promise.all([vecPromise, bm25Promise]);
  const vecMatches: SearchResult[] = vecResult.matches.map((m) => ({ id: m.id, score: m.score, metadata: m.metadata }));
  return mergeResults([vecMatches, bm25Matches], topK);
}

// Plan-and-Execute：將複雜查詢分解為子任務計畫
export async function planQuery(
  env: Env,
  query: string,
  cfg: PipelineConfig,
  crags: string[],
  areas: string[],
  promptTemplate?: string,
  gatewayOptions?: { gateway: { id: string } },
  langfuseParent?: LangfuseParent | null,
): Promise<{
  plan: ExecutionPlan | null;
  failureReason?: 'timeout' | 'json_parse_error' | 'empty_steps';
  usage?: TokenUsageInfo;
}> {
  const template = promptTemplate ?? PLANNING_PROMPT;
  const prompt = template
    .replace('{query}', query)
    .replace('{crags}', crags.join('、'))
    .replace('{areas}', areas.join('、'))
    .replace('{max_steps}', String(cfg.plan_execute_max_steps));

  let rawResult: LLMResponse | undefined;
  try {
    const planPromise = env.AI.run(
      cfg.llm_model,
      { messages: [{ role: 'user', content: prompt }] },
      gatewayOptions,
    ) as Promise<LLMResponse>;

    rawResult = await Promise.race([
      planPromise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('planning_timeout')), cfg.planning_timeout_ms),
      ),
    ]);
  } catch {
    return { plan: null, failureReason: 'timeout' };
  }

  const text = extractResponseText(rawResult);
  logGeneration(langfuseParent ?? null, {
    name: 'planning',
    model: cfg.llm_model,
    input: [{ role: 'user', content: prompt }],
    output: text,
    usage: rawResult?.usage ? {
      promptTokens: rawResult.usage.prompt_tokens,
      completionTokens: rawResult.usage.completion_tokens,
      totalTokens: rawResult.usage.total_tokens,
    } : undefined,
  });
  const usage: TokenUsageInfo = rawResult?.usage
    ? { ...rawResult.usage, estimated: false }
    : { ...estimateTokens(prompt, text), estimated: true };

  try {
    const jsonText = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(jsonText) as ExecutionPlan;

    if (!Array.isArray(parsed.steps) || parsed.steps.length === 0) {
      return { plan: null, failureReason: 'empty_steps', usage };
    }

    const validTools = ['search_routes', 'search_crags', 'sql_query'];
    const MAX_QUERY_LENGTH = 500;
    const validSteps = parsed.steps
      .filter((s) => {
        if (!s.id || typeof s.id !== 'number') return false;
        if (!s.query || typeof s.query !== 'string') return false;
        if (!validTools.includes(s.tool)) return false;
        if (!Array.isArray(s.depends_on)) return false;
        if (s.depends_on.includes(s.id)) return false;
        return true;
      })
      .slice(0, cfg.plan_execute_max_steps)
      .map((s) => ({
        ...s,
        query: s.query.slice(0, MAX_QUERY_LENGTH),
        depends_on: s.depends_on.filter((id) => typeof id === 'number' && id !== s.id),
        filters: Object.fromEntries(
          Object.entries(s.filters ?? {}).filter(
            ([, v]) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean',
          ),
        ),
      }));

    if (validSteps.length === 0) return { plan: null, failureReason: 'empty_steps', usage };

    return {
      plan: {
        steps: validSteps,
        execution_mode: ['parallel', 'sequential', 'mixed'].includes(parsed.execution_mode)
          ? parsed.execution_mode
          : 'parallel',
      },
      usage,
    };
  } catch {
    return { plan: null, failureReason: 'json_parse_error', usage };
  }
}

// 執行單一子任務（內部實作）
async function executeStepInner(
  deps: PlanExecuteDeps,
  step: PlanStep,
  cfg: PipelineConfig,
): Promise<StepExecutionResult> {
  const start = Date.now();

  if (step.tool === 'sql_query') {
    try {
      const { TextToSqlService } = await import('../text-to-sql');
      const sqlService = new TextToSqlService(deps.env.DB);
      const cragName = step.filters?.crag as string | undefined;
      let cragId: string | undefined;
      if (cragName) {
        const row = await deps.env.DB.prepare(
          `SELECT id FROM crags WHERE name LIKE ? LIMIT 1`,
        ).bind(`%${cragName}%`).first<{ id: string }>();
        cragId = row?.id;
      }
      const template = 'LIST_ROUTES_BY_CRITERIA';
      const params: Record<string, unknown> = { ...step.filters };
      if (cragId) params['crag_id'] = cragId;

      const sqlResult = await sqlService.execute(template, params);
      const sqlContext = JSON.stringify(sqlResult.rows?.slice(0, 20) ?? []);

      return {
        stepId: step.id,
        query: step.query,
        tool: step.tool,
        candidates: [],
        documents: new Map(),
        sqlContext,
        durationMs: Date.now() - start,
      };
    } catch {
      // SQL 失敗時 fallback 為向量搜尋
      const candidates = await runPlanSearch(deps, step.query, {}, cfg.merge_top_k, cfg.bm25_top_k);
      const docIds = candidates.map((c) => c.id);
      const docs = await getDocuments(deps.env.DB, docIds);
      const docSummaries = new Map<string, { title: string; excerpt: string; url?: string }>();
      for (const [id, doc] of docs) {
        docSummaries.set(id, { title: extractTitle(doc), excerpt: buildExcerpt(doc), url: buildUrl(doc) });
      }
      return { stepId: step.id, query: step.query, tool: step.tool, candidates, documents: docSummaries, durationMs: Date.now() - start };
    }
  }

  // search_routes / search_crags
  const vectorFilter: Record<string, unknown> = {};
  if (step.filters?.crag) {
    const cragName = step.filters.crag as string;
    const row = await deps.env.DB.prepare(
      `SELECT id FROM crags WHERE name LIKE ? LIMIT 1`,
    ).bind(`%${cragName}%`).first<{ id: string }>();
    if (row) vectorFilter['crag_id'] = { $eq: row.id };
  }

  const candidates = await runPlanSearch(deps, step.query, vectorFilter, cfg.merge_top_k, cfg.bm25_top_k);
  const docIds = candidates.map((c) => c.id);
  const docs = await getDocuments(deps.env.DB, docIds);
  const docSummaries = new Map<string, { title: string; excerpt: string; url?: string }>();
  for (const [id, doc] of docs) {
    docSummaries.set(id, { title: extractTitle(doc), excerpt: buildExcerpt(doc), url: buildUrl(doc) });
  }

  return {
    stepId: step.id,
    query: step.query,
    tool: step.tool,
    candidates,
    documents: docSummaries,
    durationMs: Date.now() - start,
  };
}

// 執行單一子任務（含超時保護）
async function executeStep(
  deps: PlanExecuteDeps,
  step: PlanStep,
  cfg: PipelineConfig,
): Promise<StepExecutionResult> {
  const start = Date.now();
  const emptyResult = (): StepExecutionResult => ({
    stepId: step.id,
    query: step.query,
    tool: step.tool,
    candidates: [],
    documents: new Map(),
    durationMs: Date.now() - start,
  });

  try {
    const stepPromise = executeStepInner(deps, step, cfg);
    const result = await Promise.race([
      stepPromise,
      new Promise<StepExecutionResult>((_, reject) =>
        setTimeout(() => reject(new Error('step_timeout')), cfg.plan_step_timeout_ms),
      ),
    ]);
    return { ...result, durationMs: Date.now() - start };
  } catch (err) {
    return { ...emptyResult(), error: err instanceof Error ? err.message : 'unknown' };
  }
}

// Adaptive Plan：子任務結果為空時，用輕量模型生成替代子任務
async function adaptiveReplan(
  env: Env,
  failedResult: StepExecutionResult,
  plan: ExecutionPlan,
  cfg: PipelineConfig,
  gatewayOptions?: { gateway: { id: string } },
  langfuseParent?: LangfuseParent | null,
): Promise<{ newStep: PlanStep; triggerStepId: number; reason: string } | null> {
  try {
    const safeQuery = failedResult.query.slice(0, 200).replace(/[「」]/g, '');
    const validTools = ['search_routes', 'search_crags', 'sql_query'] as const;
    const safeTool = validTools.includes(failedResult.tool as typeof validTools[number])
      ? failedResult.tool : 'search_routes';
    const newId = plan.steps.length + 1;

    const prompt = `原始子任務（工具：${safeTool}）檢索結果為空。查詢摘要：${safeQuery}
請生成一個替代子任務，放寬條件或換用其他工具。只輸出 JSON：
{"id":${newId},"query":"...","tool":"search_routes|search_crags|sql_query","filters":{},"depends_on":[]}`;

    const replanPromise = env.AI.run(
      cfg.lightweight_model,
      { messages: [{ role: 'user', content: prompt }] },
      gatewayOptions,
    ) as Promise<LLMResponse>;

    const result = await Promise.race([
      replanPromise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('adaptive_replan_timeout')), cfg.planning_timeout_ms),
      ),
    ]);

    const text = extractResponseText(result);
    logGeneration(langfuseParent ?? null, {
      name: 'adaptive-replan',
      model: cfg.lightweight_model,
      input: [{ role: 'user', content: prompt }],
      output: text,
      usage: result.usage ? {
        promptTokens: result.usage.prompt_tokens,
        completionTokens: result.usage.completion_tokens,
        totalTokens: result.usage.total_tokens,
      } : undefined,
    });
    const jsonText = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const newStep = JSON.parse(jsonText) as PlanStep;

    if (!newStep.query || !['search_routes', 'search_crags', 'sql_query'].includes(newStep.tool)) {
      return null;
    }

    return { newStep, triggerStepId: failedResult.stepId, reason: 'empty_result' };
  } catch {
    return null;
  }
}

// Plan-and-Execute：按計畫執行子任務檢索（含 Adaptive Plan）
export async function executePlan(
  deps: PlanExecuteDeps,
  plan: ExecutionPlan,
  cfg: PipelineConfig,
  gatewayOptions?: { gateway: { id: string } },
  langfuseParent?: LangfuseParent | null,
): Promise<{
  results: StepExecutionResult[];
  adaptiveReplan: boolean;
  adaptiveReplanInfo?: { trigger_step_id: number; reason: string; new_steps: PlanStep[] };
}> {
  const results: StepExecutionResult[] = [];
  const completedIds = new Set<number>();
  let adaptiveReplanFlag = false;
  let adaptiveReplanInfo: { trigger_step_id: number; reason: string; new_steps: PlanStep[] } | undefined;

  const remaining = [...plan.steps];
  const maxIterations = plan.steps.length * 3;
  let iterations = 0;

  while (remaining.length > 0) {
    if (++iterations > maxIterations) break;

    const executable = remaining.filter((s) =>
      s.depends_on.every((depId) => completedIds.has(depId)),
    );

    if (executable.length === 0) break;

    const execResults = await Promise.all(
      executable.map((step) => executeStep(deps, step, cfg)),
    );

    for (const result of execResults) {
      results.push(result);
      completedIds.add(result.stepId);

      if (
        cfg.adaptive_plan_enabled &&
        !adaptiveReplanFlag &&
        result.candidates.length === 0 &&
        !result.sqlContext &&
        !result.error
      ) {
        const replanResult = await adaptiveReplan(
          deps.env, result, plan, cfg, gatewayOptions, langfuseParent,
        );
        if (replanResult) {
          adaptiveReplanFlag = true;
          adaptiveReplanInfo = {
            trigger_step_id: replanResult.triggerStepId,
            reason: replanResult.reason,
            new_steps: [replanResult.newStep],
          };
          remaining.push(replanResult.newStep);
        }
      }
    }

    for (const exec of executable) {
      const idx = remaining.findIndex((s) => s.id === exec.id);
      if (idx >= 0) remaining.splice(idx, 1);
    }
  }

  return { results, adaptiveReplan: adaptiveReplanFlag, adaptiveReplanInfo };
}

// 從子任務結果收集 AISource
function collectSources(stepResults: StepExecutionResult[]): AISource[] {
  const seen = new Set<string>();
  const sources: AISource[] = [];

  for (const r of stepResults) {
    for (const c of r.candidates) {
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      const doc = r.documents.get(c.id);
      if (doc) {
        sources.push({
          id: c.id,
          type: r.tool === 'search_crags' ? 'crag' : 'route',
          title: doc.title,
          excerpt: doc.excerpt,
          url: doc.url,
          score: c.score,
        });
      }
    }
  }
  return sources;
}

// Synthesis fallback：LLM 失敗時的簡單拼接
function fallbackSynthesis(
  stepResults: StepExecutionResult[],
): { context: string; sources: AISource[] } {
  const parts: string[] = [];
  for (const r of stepResults) {
    if (r.sqlContext) {
      parts.push(`【${r.query}】\n${r.sqlContext}`);
    } else {
      for (const c of r.candidates.slice(0, 10)) {
        const doc = r.documents.get(c.id);
        if (doc) parts.push(`【${doc.title}】${doc.excerpt}`);
      }
    }
  }

  return {
    context: parts.join('\n\n') || '無相關資料',
    sources: collectSources(stepResults),
  };
}

// Plan-and-Execute：將多源檢索結果合併為結構化 context
export async function synthesize(
  env: Env,
  query: string,
  stepResults: StepExecutionResult[],
  cfg: PipelineConfig,
  promptTemplate?: string,
  gatewayOptions?: { gateway: { id: string } },
  langfuseParent?: LangfuseParent | null,
): Promise<{
  context: string;
  sources: AISource[];
  usage?: TokenUsageInfo;
}> {
  if (stepResults.length === 0 || stepResults.every((r) => r.candidates.length === 0 && !r.sqlContext)) {
    return fallbackSynthesis(stepResults);
  }

  const stepResultsText = stepResults.map((r) => {
    const header = `子任務 ${r.stepId}：「${r.query}」（工具：${r.tool}）`;
    if (r.error) return `${header}\n  錯誤：${r.error}`;
    if (r.sqlContext) return `${header}\n  SQL 結果：${r.sqlContext}`;
    if (r.candidates.length === 0) return `${header}\n  無結果`;

    const docEntries: string[] = [];
    for (const c of r.candidates.slice(0, 10)) {
      const doc = r.documents.get(c.id);
      if (doc) {
        docEntries.push(`  - ${doc.title}：${doc.excerpt}`);
      }
    }
    return `${header}\n${docEntries.join('\n')}`;
  }).join('\n\n');

  const template = promptTemplate ?? SYNTHESIS_PROMPT;
  const prompt = template
    .replace('{query}', query)
    .replace('{step_results}', stepResultsText);

  let rawResult: LLMResponse | undefined;
  try {
    const synthPromise = env.AI.run(
      cfg.llm_model,
      { messages: [{ role: 'user', content: prompt }] },
      gatewayOptions,
    ) as Promise<LLMResponse>;

    rawResult = await Promise.race([
      synthPromise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('synthesis_timeout')), cfg.synthesis_timeout_ms),
      ),
    ]);
  } catch {
    return fallbackSynthesis(stepResults);
  }

  const text = extractResponseText(rawResult);
  logGeneration(langfuseParent ?? null, {
    name: 'synthesis',
    model: cfg.llm_model,
    input: [{ role: 'user', content: prompt }],
    output: text,
    usage: rawResult?.usage ? {
      promptTokens: rawResult.usage.prompt_tokens,
      completionTokens: rawResult.usage.completion_tokens,
      totalTokens: rawResult.usage.total_tokens,
    } : undefined,
  });
  const usage: TokenUsageInfo = rawResult?.usage
    ? { ...rawResult.usage, estimated: false }
    : { ...estimateTokens(prompt, text), estimated: true };

  if (!text) {
    return { ...fallbackSynthesis(stepResults), usage };
  }

  const sources = collectSources(stepResults);

  return { context: text, sources, usage };
}
