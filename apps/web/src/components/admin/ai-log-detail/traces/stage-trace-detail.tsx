'use client'

import type { PipelineTrace } from '../types'
import { AgenticTrace } from './agentic'
import { CacheTrace } from './cache'
import { CRAGFallbackTrace } from './crag-fallback'
import { EmbeddingTrace } from './embedding'
import { FilterTrace } from './filter'
import { GenerationTrace } from './generation'
import { GuardrailsInputTrace } from './guardrails-input'
import { GuardrailsOutputTrace } from './guardrails-output'
import { HydeTrace } from './hyde'
import { JudgeTrace } from './judge'
import { MemoryExtractionTrace } from './memory-extraction'
import { MMRSelectionTrace } from './mmr-selection'
import { MultiQueryTrace } from './multi-query'
import { MultiToolTrace } from './multi-tool'
import { PlanAndExecuteTrace } from './plan-execute'
import { PopularityRerankTrace } from './popularity-rerank'
import { QueryParsingTrace } from './query-parsing'
import { QuotaCheckTrace } from './quota-check'
import { RerankerTrace } from './reranker'
import { RetrievalTrace } from './retrieval'
import { RRFFusionTrace } from './rrf-fusion'
import { SelfReflectionTrace } from './self-reflection'
import { TextToSqlTrace } from './text-to-sql'

export function StageTraceDetail({
  stageKey,
  trace,
  query,
  pipelineStage,
  response,
  sources,
}: {
  stageKey: string
  trace: PipelineTrace | null
  query: string
  pipelineStage?: Record<string, unknown> | null
  response: string | null
  sources: Array<{ title?: string; type?: string; score?: number }>
}) {
  if (stageKey === 'guardrails_input')
    return <GuardrailsInputTrace query={query} pipelineStage={pipelineStage ?? null} />
  if (stageKey === 'cache')
    return <CacheTrace pipelineStage={pipelineStage ?? null} query={query} pipelineTrace={trace} />
  if (stageKey === 'quota_check') return <QuotaCheckTrace pipelineStage={pipelineStage ?? null} />
  if (stageKey === 'query_parsing') {
    if (!trace) return <p className="text-[11px] text-wb-40">無詳細資料（舊記錄）</p>
    return <QueryParsingTrace trace={trace} query={query} />
  }
  if (stageKey === 'hyde') return <HydeTrace trace={trace} pipelineStage={pipelineStage} />
  if (stageKey === 'multi_query') {
    if (!trace) return <p className="text-[11px] text-wb-40">無詳細資料（舊記錄）</p>
    return <MultiQueryTrace trace={trace} query={query} />
  }
  if (stageKey === 'text_to_sql') {
    if (!trace) return <p className="text-[11px] text-wb-40">無詳細資料（舊記錄）</p>
    return <TextToSqlTrace trace={trace} />
  }
  if (stageKey === 'agentic') {
    if (!trace) return <p className="text-[11px] text-wb-40">無詳細資料（舊記錄）</p>
    return <AgenticTrace trace={trace} />
  }
  if (stageKey === 'plan_execute') {
    if (!trace) return <p className="text-[11px] text-wb-40">無詳細資料（舊記錄）</p>
    return <PlanAndExecuteTrace trace={trace} />
  }
  if (stageKey === 'filter')
    return <FilterTrace trace={trace} pipelineStage={pipelineStage ?? null} />
  if (stageKey === 'embedding')
    return <EmbeddingTrace trace={trace} pipelineStage={pipelineStage ?? null} query={query} />
  if (stageKey === 'retrieval') {
    if (!trace) return <p className="text-[11px] text-wb-40">無詳細資料（舊記錄）</p>
    return <RetrievalTrace trace={trace} pipelineStage={pipelineStage ?? null} query={query} />
  }
  if (stageKey === 'multi_tool') {
    if (!trace) return <p className="text-[11px] text-wb-40">無詳細資料（舊記錄）</p>
    return <MultiToolTrace trace={trace} />
  }
  if (stageKey === 'rrf_fusion') return <RRFFusionTrace trace={trace} />
  if (stageKey === 'crag_fallback') return <CRAGFallbackTrace trace={trace} />
  if (stageKey === 'reranking') return <RerankerTrace trace={trace} query={query} />
  if (stageKey === 'mmr_selection') return <MMRSelectionTrace trace={trace} sources={sources} />
  if (stageKey === 'popularity_rerank')
    return <PopularityRerankTrace trace={trace} sources={sources} />
  if (stageKey === 'generation') {
    if (!trace) return <p className="text-[11px] text-wb-40">無詳細資料（舊記錄）</p>
    return (
      <GenerationTrace
        trace={trace}
        pipelineStage={pipelineStage ?? null}
        query={query}
        response={response}
      />
    )
  }
  if (stageKey === 'self_reflection')
    return <SelfReflectionTrace trace={trace} pipelineStage={pipelineStage ?? null} />
  if (stageKey === 'judge')
    return <JudgeTrace pipelineStage={pipelineStage ?? null} response={response} />
  if (stageKey === 'guardrails_output')
    return <GuardrailsOutputTrace response={response} pipelineStage={pipelineStage ?? null} />
  if (stageKey === 'memory_extraction')
    return <MemoryExtractionTrace pipelineStage={pipelineStage ?? null} />
  return <p className="text-[11px] text-wb-40">此階段無額外詳細資料</p>
}
