import type { AILogDetail } from '@/lib/api/admin-ai'

export type PipelineTrace = NonNullable<AILogDetail['pipeline_trace']>

export type PipelineKey = keyof AILogDetail['pipeline']

export type StageBreakdownItem = {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  model: string
  estimated: boolean
}

export type TokenBreakdown = NonNullable<
  NonNullable<AILogDetail['pipeline_trace']>['token_breakdown']
>

export function ensureArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}
