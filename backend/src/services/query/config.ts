import type { PipelineConfig } from '../pipeline/types';
import { DEFAULT_SYSTEM_PROMPT_LEAKAGE_PATTERNS } from '../../utils/guardrails';

export const DEFAULT_TOP_K = 5;
export const MIN_VECTOR_SCORE = 0.5;
export const DEFAULT_LLM_MODEL = '@cf/google/gemma-3-12b-it';
export const DEFAULT_LIGHTWEIGHT_MODEL = '@cf/meta/llama-3.1-8b-instruct';

export function num(v: string | undefined, fallback: number, min?: number, max?: number): number {
  const parsed = v !== undefined && v !== '' ? parseFloat(v) : NaN;
  const result = Number.isNaN(parsed) ? fallback : parsed;
  if (min !== undefined && result < min) return min;
  if (max !== undefined && result > max) return max;
  return result;
}

export async function loadPipelineConfig(db: D1Database): Promise<PipelineConfig> {
  const rows = await db.prepare(`SELECT key, value FROM ai_config`).all<{ key: string; value: string }>();
  const cfg: Record<string, string> = Object.fromEntries(rows.results.map((r) => [r.key, r.value]));
  return {
    // 模型
    llm_model:                    cfg['llm_model']                    ?? DEFAULT_LLM_MODEL,
    simple_model:                 cfg['simple_model']                 ?? DEFAULT_LIGHTWEIGHT_MODEL,
    lightweight_model:            cfg['lightweight_model']            ?? DEFAULT_LIGHTWEIGHT_MODEL,
    // 搜尋與檢索
    max_results:                  num(cfg['max_results'],                  5,    1,    20),
    merge_top_k:                  num(cfg['merge_top_k'],                  10,   5,    50),
    min_rrf_score:                num(cfg['min_rrf_score'],                0.005, 0,   1),
    min_rrf_score_filtered:       num(cfg['min_rrf_score_filtered'],       0.002, 0,   1),
    min_vector_score:             num(cfg['min_vector_score'],             0.5,   0,   1),
    // 排名與多樣性
    mmr_lambda:                   num(cfg['mmr_lambda'],                   0.6,  0,    1),
    ...(() => {
      const rw = num(cfg['reranker_weight'],   0.7, 0, 1);
      const pw = num(cfg['popularity_weight'], 0.3, 0, 1);
      const total = rw + pw;
      return total > 0
        ? { reranker_weight: rw / total, popularity_weight: pw / total }
        : { reranker_weight: 0.7, popularity_weight: 0.3 };
    })(),
    // Token 限制
    max_tokens_generation:        num(cfg['max_tokens_generation'],        800,  200,  2000),
    max_tokens_gk:                num(cfg['max_tokens_gk'],                600,  200,  2000),
    high_consumption_threshold:   num(cfg['high_consumption_threshold'],   3000, 100,  10000),
    // 品質閾值
    groundedness_disclaimer_low:  num(cfg['groundedness_disclaimer_low'],  0.6,  0,    1),
    groundedness_disclaimer_mid:  num(cfg['groundedness_disclaimer_mid'],  0.8,  0,    1),
    groundedness_flag_threshold:  num(cfg['groundedness_flag_threshold'],  0.5,  0,    1),
    // Judge
    judge_timeout_ms:             num(cfg['judge_timeout_ms'],             8000, 1000, 30000),
    judge_context_truncate:       num(cfg['judge_context_truncate'],       2000, 200,  5000),
    assistant_history_truncate:   num(cfg['assistant_history_truncate'],   500,  100,  2000),
    judge_regen_quality_max:      num(cfg['judge_regen_quality_max'],      2,    1,    3),
    // Self-reflection
    self_reflection_min_length:   num(cfg['self_reflection_min_length'],   50,   10,   500),
    // 對話與快取
    chat_history_depth:           num(cfg['chat_history_depth'],           6,    2,    20),
    cache_ttl:                    num(cfg['cache_ttl'],                    3600, 60,   86400),
    // 語義快取
    semantic_cache_enabled:       cfg['semantic_cache_enabled'] === '1',
    semantic_cache_threshold:     num(cfg['semantic_cache_threshold'],     0.95, 0.8,  1),
    // BM25 混合搜尋
    bm25_top_k:                   num(cfg['bm25_top_k'],                   10,   5,    50),
    // Multi-Query Expansion
    multi_query_count:            num(cfg['multi_query_count'],            3,    1,    5),
    // 防護設定
    max_output_length:            num(cfg['max_output_length'],            3000, 500,  10000),
    system_prompt_leakage_patterns: (() => {
      try {
        if (cfg['system_prompt_leakage_patterns']) {
          const parsed = JSON.parse(cfg['system_prompt_leakage_patterns']);
          if (Array.isArray(parsed)) return parsed as string[];
        }
      } catch { /* fallback */ }
      return DEFAULT_SYSTEM_PROMPT_LEAKAGE_PATTERNS;
    })(),
    // Agentic 模式
    rag_strategy:               (() => {
      const v = cfg['rag_strategy'] ?? 'baseline';
      return ['baseline', 'agentic', 'plan-execute', 'auto'].includes(v) ? v : 'baseline';
    })(),
    agentic_max_steps:          num(cfg['agentic_max_steps'],          3, 1, 5),
    agentic_min_docs_to_answer: num(cfg['agentic_min_docs_to_answer'], 3, 1, 10),
    // Plan-and-Execute 模式
    plan_execute_max_steps:     num(cfg['plan_execute_max_steps'],     4, 2, 6),
    plan_execute_min_entities:  num(cfg['plan_execute_min_entities'],  2, 2, 5),
    planning_timeout_ms:        num(cfg['planning_timeout_ms'],        5000, 3000, 10000),
    synthesis_timeout_ms:       num(cfg['synthesis_timeout_ms'],       8000, 5000, 15000),
    plan_step_timeout_ms:       num(cfg['plan_step_timeout_ms'],       6000, 3000, 10000),
    adaptive_plan_enabled:      cfg['adaptive_plan_enabled'] !== '0',
    // Pipeline 迴圈上限
    max_pipeline_loops:         num(cfg['max_pipeline_loops'],          2, 1, 3),
    // Pipeline 超時
    pipeline_timeout_ms:        num(cfg['pipeline_timeout_ms'],        40000, 10000, 45000),
    embedding_timeout_ms:       num(cfg['embedding_timeout_ms'],       3000,  1000,  10000),
    search_timeout_ms:          num(cfg['search_timeout_ms'],          4000,  1000,  10000),
    generation_timeout_ms:      num(cfg['generation_timeout_ms'],      18000, 5000,  20000),
    hyde_timeout_ms:            num(cfg['hyde_timeout_ms'],            5000,  2000,  10000),
    multi_query_timeout_ms:     num(cfg['multi_query_timeout_ms'],     5000,  2000,  10000),
    // Circuit Breaker 熔斷器
    circuit_breaker_threshold:  num(cfg['circuit_breaker_threshold'],  5,     1,     20),
    circuit_breaker_reset_ms:   num(cfg['circuit_breaker_reset_ms'],   30000, 5000,  120000),
    // Reranker 閾值過濾
    reranker_relevance_threshold: num(cfg['reranker_relevance_threshold'], 0.3, 0, 1),
    reranker_min_keep:            num(cfg['reranker_min_keep'],            2,   1, 20),
    // Tool Selection 信心
    tool_confidence_threshold:    num(cfg['tool_confidence_threshold'],    0.7, 0, 1),
  };
}

// 驗證 DB prompt 是否包含所有必要變數，缺少則 fallback 到硬編碼預設
export function resolvePrompt(dbContent: string | undefined, fallback: string, requiredVars: string[]): string {
  if (!dbContent) return fallback;
  if (requiredVars.length > 0 && requiredVars.some((v) => !dbContent.includes(`{${v}}`))) {
    return fallback;
  }
  return dbContent;
}

// Prompt 載入：DB 優先 + 硬編碼 fallback
export async function loadPrompts(db: D1Database): Promise<Record<string, string>> {
  try {
    const rows = await db.prepare(
      `SELECT name, content FROM ai_prompts WHERE status = 'active'`
    ).all<{ name: string; content: string }>();
    return Object.fromEntries(rows.results.map((r) => [r.name, r.content]));
  } catch {
    return {};
  }
}
