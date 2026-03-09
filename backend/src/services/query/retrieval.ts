import type { Env, AIDocument, AIDocumentMetadata } from '../../types';
import type { PipelineConfig, AgenticAction, AgenticActionType, AgenticStepTrace, RetrievalMethod, StageTokenUsage, TokenUsageInfo } from '../pipeline/types';
import { AGENTIC_DECISION_PROMPT } from '../../utils/ai-prompts';
import { EmbeddingService } from '../embedding';
import { estimateTokens, type LLMResponse, type SearchResult } from './types';
import toolRegistry from '../tool-registry';

export type RetrievalDeps = {
  env: Env;
  embeddingService: EmbeddingService;
};

// 清理查詢字串，移除 FTS5 語法特殊字符
function buildFTSQuery(query: string): string {
  return query.replace(/["\x00-\x1f()*^[\]]/g, ' ').trim();
}

// BM25 全文搜尋：利用 D1 FTS5 索引做關鍵字匹配
export async function searchBM25(db: D1Database, query: string, topK: number): Promise<SearchResult[]> {
  const ftsQuery = buildFTSQuery(query);
  if (!ftsQuery) return [];
  try {
    const rows = await db.prepare(`
      SELECT doc_id, bm25(ai_documents_fts) AS bm25_score
      FROM ai_documents_fts
      WHERE ai_documents_fts MATCH ?
      ORDER BY bm25(ai_documents_fts)
      LIMIT ?
    `).bind(ftsQuery, topK).all<{ doc_id: string; bm25_score: number }>();
    return rows.results.map((row) => ({
      id: row.doc_id,
      score: -row.bm25_score,
    }));
  } catch {
    return [];
  }
}

// N 路 RRF 合併：支援任意數量的搜尋結果列表
export function mergeResults(results: SearchResult[][], limit = 10): SearchResult[] {
  const K = 60;
  const rrfScores = new Map<string, number>();
  const metaMap = new Map<string, SearchResult>();

  for (const resultList of results) {
    for (const [rank, item] of resultList.entries()) {
      rrfScores.set(item.id, (rrfScores.get(item.id) ?? 0) + 1 / (K + rank + 1));
      if (!metaMap.has(item.id)) metaMap.set(item.id, item);
    }
  }

  return Array.from(rrfScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, score]) => ({ ...metaMap.get(id)!, score }));
}

// 文件相似度（metadata-based approximation）
function documentSimilarity(docA: AIDocument | undefined, docB: AIDocument | undefined): number {
  if (!docA || !docB) return 0;
  if (docA.source_id === docB.source_id) return 1;

  try {
    const metaA = docA.metadata ? JSON.parse(docA.metadata) as AIDocumentMetadata : null;
    const metaB = docB.metadata ? JSON.parse(docB.metadata) as AIDocumentMetadata : null;
    if (!metaA || !metaB) return 0;

    let sim = 0;
    if (metaA.crag_id && metaA.crag_id === metaB.crag_id) sim += 0.6;
    if (metaA.grade_numeric && metaB.grade_numeric) {
      const diff = Math.abs(metaA.grade_numeric - metaB.grade_numeric);
      if (diff <= 5) sim += 0.4 * (1 - diff / 5);
    }
    if (metaA.route_type && metaA.route_type === metaB.route_type) sim += 0.1;

    return Math.min(sim, 1);
  } catch {
    return 0;
  }
}

// MMR（Maximal Marginal Relevance）：兼顧相關性與多樣性
export function applyMMR(
  candidates: SearchResult[],
  documents: Map<string, AIDocument>,
  lambda: number,
  k: number,
): SearchResult[] {
  if (candidates.length <= 1) return candidates;

  const selected: SearchResult[] = [];
  const remaining = [...candidates];

  while (selected.length < k && remaining.length > 0) {
    let bestIdx = 0;
    let bestScore = -Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i];
      const relevance = candidate.score;

      let maxSim = 0;
      for (const sel of selected) {
        const sim = documentSimilarity(
          documents.get(candidate.id),
          documents.get(sel.id),
        );
        if (sim > maxSim) maxSim = sim;
      }

      const mmrScore = lambda * relevance - (1 - lambda) * maxSim;
      if (mmrScore > bestScore) {
        bestScore = mmrScore;
        bestIdx = i;
      }
    }

    selected.push(remaining[bestIdx]);
    remaining.splice(bestIdx, 1);
  }

  return selected;
}

// 每輪 Agentic 搜尋：embedding + BM25 並行，RRF 合併
async function runAgenticSearch(
  deps: RetrievalDeps,
  query: string,
  filter: Record<string, unknown>,
  topK: number,
  bm25TopK: number,
  method: RetrievalMethod = 'hybrid',
): Promise<SearchResult[]> {
  const skipVector = method === 'bm25';
  const skipBM25 = method === 'vector';

  const vecPromise = !skipVector
    ? deps.embeddingService.embed(query).then((queryVector) =>
        deps.env.VECTOR_INDEX.query(queryVector, {
          topK,
          returnMetadata: 'all',
          filter: Object.keys(filter).length > 0 ? filter : undefined,
        })
      )
    : Promise.resolve({ matches: [] as Array<{ id: string; score: number; metadata?: Record<string, unknown> }> });

  const bm25Promise = !skipBM25
    ? searchBM25(deps.env.DB, query, bm25TopK)
    : Promise.resolve([] as SearchResult[]);

  const [vecResult, bm25Matches] = await Promise.all([vecPromise, bm25Promise]);
  const vecMatches: SearchResult[] = vecResult.matches.map((m) => ({ id: m.id, score: m.score, metadata: m.metadata }));
  return mergeResults([vecMatches, bm25Matches], topK);
}

// 建立 evidence summary 供 decideNextAction prompt 使用
function buildEvidenceSummary(docs: SearchResult[]): string {
  if (docs.length === 0) return '（尚無資料）';
  return docs.slice(0, 8).map((doc) => {
    const meta = doc.metadata as Record<string, unknown> | undefined;
    if (!meta) return `文件：${doc.id}`;
    const docType = meta['type'] as string | undefined;
    if (docType === 'route') {
      return `路線：${meta['name'] ?? doc.id}｜${meta['crag_name'] ?? ''}｜${meta['grade'] ?? ''}`;
    } else if (docType === 'crag') {
      return `岩場：${meta['name'] ?? doc.id}｜${meta['region'] ?? ''}`;
    }
    return `文件：${meta['name'] ?? doc.id}`;
  }).join('\n');
}

// Agentic 決策：讓 LLM 評估目前文件是否足夠，決定下一步行動
async function decideNextAction(
  env: Env,
  query: string,
  currentDocs: SearchResult[],
  step: number,
  maxSteps: number,
  minDocs: number,
  model: string,
  promptTemplate?: string,
): Promise<{ action: AgenticAction; usage?: TokenUsageInfo }> {
  const evidenceSummary = buildEvidenceSummary(currentDocs);
  const prompt = (promptTemplate ?? AGENTIC_DECISION_PROMPT)
    .replace('{count}', String(currentDocs.length))
    .replace('{evidence_summary}', evidenceSummary)
    .replace('{min_docs}', String(minDocs))
    .replace('{remaining_steps}', String(maxSteps - step - 1))
    .replace('{query}', query);

  try {
    const gatewayOptions = env.AI_GATEWAY_SLUG
      ? { gateway: { id: env.AI_GATEWAY_SLUG } }
      : undefined;
    const result = (await env.AI.run(
      model,
      { messages: [{ role: 'user', content: prompt }], max_tokens: 200 },
      gatewayOptions,
    )) as LLMResponse;

    const raw = result.response ?? '';
    const usage: TokenUsageInfo = result.usage
      ? { ...result.usage, estimated: false }
      : { ...estimateTokens(prompt, raw), estimated: true };

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { action: { type: 'ANSWER' }, usage };

    const parsed = JSON.parse(jsonMatch[0]) as AgenticAction;
    if (!['ANSWER', 'RETRIEVE', 'BROADEN', 'SWITCH_TOOL', 'DECOMPOSE', 'VERIFY'].includes(parsed.type)) return { action: { type: 'ANSWER' }, usage };

    if (parsed.type === 'RETRIEVE') {
      if (typeof parsed.refinedQuery !== 'string' || parsed.refinedQuery.trim().length === 0) {
        return { action: { type: 'ANSWER' }, usage };
      }
      parsed.refinedQuery = parsed.refinedQuery.slice(0, 500);
    }

    if (parsed.type === 'SWITCH_TOOL') {
      const validTargets = toolRegistry.getValidToolNames().filter((t) => t !== 'general_knowledge');
      if (!parsed.targetTool || !validTargets.includes(parsed.targetTool)) {
        return { action: { type: 'ANSWER' }, usage };
      }
    }

    if (parsed.type === 'DECOMPOSE') {
      if (!Array.isArray(parsed.subQueries) || parsed.subQueries.length === 0) {
        return { action: { type: 'ANSWER' }, usage };
      }
      parsed.subQueries = parsed.subQueries
        .filter((sq): sq is string => typeof sq === 'string' && sq.trim().length > 0)
        .slice(0, 3)
        .map((sq) => sq.slice(0, 500));
      if (parsed.subQueries.length === 0) {
        return { action: { type: 'ANSWER' }, usage };
      }
    }

    if (parsed.type === 'VERIFY') {
      if (typeof parsed.verifyQuery !== 'string' || parsed.verifyQuery.trim().length === 0) {
        return { action: { type: 'ANSWER' }, usage };
      }
      parsed.verifyQuery = parsed.verifyQuery.slice(0, 500);
    }

    if (parsed.retrievalMethod) {
      const VALID_METHODS = ['vector', 'bm25', 'hybrid'] as const;
      if (!(VALID_METHODS as readonly string[]).includes(parsed.retrievalMethod)) {
        parsed.retrievalMethod = undefined;
      }
    }

    return { action: parsed, usage };
  } catch {
    return { action: { type: 'ANSWER' } };
  }
}

// Agentic Multi-Step RAG：主控方法，管理多輪搜尋迴圈
export async function agenticRetrieve(
  deps: RetrievalDeps,
  query: string,
  vectorFilter: Record<string, unknown>,
  cfg: PipelineConfig,
  steps: AgenticStepTrace[],
  agenticPromptTemplate?: string,
  decisionUsages?: Array<StageTokenUsage & { step: number }>,
): Promise<{ candidates: SearchResult[]; terminationReason: 'enough_docs' | 'max_steps' | 'no_improvement' }> {
  const cragFilter = vectorFilter['crag_id'] as { $in?: string[] } | undefined;
  const isMultiCrag = Array.isArray(cragFilter?.$in) && cragFilter.$in.length > 1;
  const MERGE_TOP_K = isMultiCrag ? Math.max(20, cfg.merge_top_k * 2) : cfg.merge_top_k;
  const hasFilter = Object.keys(vectorFilter).some((k) => ['grade_numeric', 'crag_id', 'area_id', 'region', 'route_type'].includes(k));
  const minScore = hasFilter ? cfg.min_rrf_score_filtered : cfg.min_rrf_score;

  const allPaths: SearchResult[][] = [];
  let agenticTerminationReason: 'enough_docs' | 'max_steps' | 'no_improvement' = 'max_steps';
  let switchToolUsed = false;
  let decomposeUsed = false;
  let verifyUsed = false;

  // Step 0：初始搜尋
  const initialResults = await runAgenticSearch(deps, query, vectorFilter, MERGE_TOP_K, cfg.bm25_top_k);
  allPaths.push(initialResults);

  const AGENTIC_MAX_MERGE_K = MERGE_TOP_K * 3;

  for (let step = 0; step < cfg.agentic_max_steps; step++) {
    const merged = mergeResults(allPaths, AGENTIC_MAX_MERGE_K);
    const uniqueCount = merged.length;

    if (uniqueCount >= cfg.agentic_min_docs_to_answer) {
      agenticTerminationReason = 'enough_docs';
      break;
    }

    const { action, usage: decisionUsage } = await decideNextAction(
      deps.env, query, merged, step, cfg.agentic_max_steps, cfg.agentic_min_docs_to_answer, cfg.lightweight_model, agenticPromptTemplate
    );
    if (decisionUsage && decisionUsages) {
      decisionUsages.push({ ...decisionUsage, model: cfg.lightweight_model, step });
    }

    if (action.type === 'ANSWER') {
      steps.push({ step, type: action.type, docs_retrieved: merged.length } as AgenticStepTrace & { docs_retrieved: number });
      agenticTerminationReason = 'no_improvement';
      break;
    }

    if (action.type === 'RETRIEVE') {
      if (!action.refinedQuery) {
        steps.push({ step, type: 'ANSWER', docs_retrieved: merged.length } as AgenticStepTrace & { docs_retrieved: number });
        agenticTerminationReason = 'no_improvement';
        break;
      }
      const stepMethod = action.retrievalMethod ?? 'hybrid';
      const newResults = await runAgenticSearch(deps, action.refinedQuery, vectorFilter, MERGE_TOP_K, cfg.bm25_top_k, stepMethod);
      steps.push({ step, type: action.type, refinedQuery: action.refinedQuery, docs_retrieved: newResults.length } as AgenticStepTrace & { docs_retrieved: number });
      allPaths.push(newResults);
    } else if (action.type === 'BROADEN') {
      const broadenFilter: Record<string, unknown> = {};
      if (vectorFilter['crag_id']) broadenFilter['crag_id'] = vectorFilter['crag_id'];
      if (vectorFilter['area_id']) broadenFilter['area_id'] = vectorFilter['area_id'];
      if (vectorFilter['region']) broadenFilter['region'] = vectorFilter['region'];
      const broadenResults = await runAgenticSearch(deps, query, broadenFilter, MERGE_TOP_K, cfg.bm25_top_k);
      steps.push({ step, type: action.type, docs_retrieved: broadenResults.length } as AgenticStepTrace & { docs_retrieved: number });
      allPaths.push(broadenResults);
    } else if (action.type === 'SWITCH_TOOL') {
      if (switchToolUsed || !action.targetTool || action.targetTool === 'general_knowledge') {
        steps.push({ step, type: 'ANSWER', docs_retrieved: merged.length } as AgenticStepTrace & { docs_retrieved: number });
        agenticTerminationReason = 'no_improvement';
        break;
      }
      switchToolUsed = true;

      const switchFilter: Record<string, unknown> = {};
      if (action.targetTool === 'search_crags') {
        switchFilter['type'] = { $eq: 'crag' };
      } else if (action.targetTool === 'search_routes' || action.targetTool === 'hybrid') {
        switchFilter['type'] = { $eq: 'route' };
        if (vectorFilter['crag_id']) switchFilter['crag_id'] = vectorFilter['crag_id'];
        if (vectorFilter['area_id']) switchFilter['area_id'] = vectorFilter['area_id'];
        if (vectorFilter['region']) switchFilter['region'] = vectorFilter['region'];
      }
      const switchResults = await runAgenticSearch(deps, query, switchFilter, MERGE_TOP_K, cfg.bm25_top_k);
      steps.push({
        step, type: action.type, targetTool: action.targetTool, reason: action.reason,
        docs_retrieved: switchResults.length,
      } as AgenticStepTrace & { docs_retrieved: number });
      allPaths.push(switchResults);
    } else if (action.type === 'DECOMPOSE') {
      if (decomposeUsed || !action.subQueries?.length) {
        steps.push({ step, type: 'ANSWER', docs_retrieved: merged.length } as AgenticStepTrace & { docs_retrieved: number });
        agenticTerminationReason = 'no_improvement';
        break;
      }
      decomposeUsed = true;
      const subResults = await Promise.all(
        action.subQueries.slice(0, 3).map((sq) =>
          runAgenticSearch(deps, sq, vectorFilter, MERGE_TOP_K, cfg.bm25_top_k)
        )
      );
      const totalDocs = subResults.reduce((sum, r) => sum + r.length, 0);
      steps.push({
        step, type: action.type, subQueries: action.subQueries,
        docs_retrieved: totalDocs,
      } as AgenticStepTrace & { docs_retrieved: number });
      allPaths.push(...subResults);
    } else if (action.type === 'VERIFY') {
      if (verifyUsed || !action.verifyQuery) {
        steps.push({ step, type: 'ANSWER', docs_retrieved: merged.length } as AgenticStepTrace & { docs_retrieved: number });
        agenticTerminationReason = 'no_improvement';
        break;
      }
      verifyUsed = true;
      const verifyResults = await runAgenticSearch(deps, action.verifyQuery, {}, MERGE_TOP_K, cfg.bm25_top_k);
      steps.push({
        step, type: action.type, verifyQuery: action.verifyQuery,
        docs_retrieved: verifyResults.length,
      } as AgenticStepTrace & { docs_retrieved: number });
      allPaths.push(verifyResults);
    }
  }

  const finalMerged = mergeResults(allPaths, AGENTIC_MAX_MERGE_K);
  const finalCandidates = finalMerged.filter((m) => m.score >= minScore);

  return { candidates: finalCandidates, terminationReason: agenticTerminationReason };
}
