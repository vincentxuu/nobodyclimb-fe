import type { AISource } from '../../types';

// Plan-and-Execute 型別
export interface PlanStep {
  id: number;
  query: string;
  tool: 'search_routes' | 'search_crags' | 'sql_query';
  filters: Record<string, unknown>;
  depends_on: number[];
}

export interface ExecutionPlan {
  steps: PlanStep[];
  execution_mode: 'parallel' | 'sequential' | 'mixed';
}

export interface StepExecutionResult {
  stepId: number;
  query: string;
  tool: string;
  candidates: SearchResult[];
  documents: Map<string, { title: string; excerpt: string; url?: string }>;
  sqlContext?: string;
  durationMs: number;
  error?: string;
}

export interface LLMResponse {
  response: string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

export interface SearchResult {
  id: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface StageTokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  model: string;
  estimated: boolean;
}

export interface PipelineTokenBreakdown {
  tool_selection?: StageTokenUsage;
  hyde?: StageTokenUsage;
  multi_query?: StageTokenUsage;
  agentic_decisions?: Array<StageTokenUsage & { step: number }>;
  main_generation?: StageTokenUsage;
  self_reflection_regen?: StageTokenUsage;
  judge?: StageTokenUsage;
  judge_2nd?: StageTokenUsage;
}

export function sumTokenBreakdown(tb: PipelineTokenBreakdown): number {
  let total = 0;
  for (const v of Object.values(tb)) {
    if (Array.isArray(v)) {
      for (const item of v) total += item.total_tokens ?? 0;
    } else if (v) {
      total += v.total_tokens ?? 0;
    }
  }
  return total;
}

// 當 Cloudflare Workers AI 未回傳 usage 時，從文字長度估算 token 數
export function estimateTokens(inputText: string, outputText: string): { prompt_tokens: number; completion_tokens: number; total_tokens: number } {
  const prompt_tokens = Math.max(1, Math.ceil(inputText.length / 2));
  const completion_tokens = Math.max(1, Math.ceil(outputText.length / 2));
  return { prompt_tokens, completion_tokens, total_tokens: prompt_tokens + completion_tokens };
}
