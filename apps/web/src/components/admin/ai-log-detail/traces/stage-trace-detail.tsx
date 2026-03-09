'use client'

import type { PipelineTrace } from '../types'
import { GuardrailsInputTrace } from './guardrails-input'
import { CacheTrace } from './cache'
import { QuotaCheckTrace } from './quota-check'
import { QueryParsingTrace } from './query-parsing'
import { FilterTrace } from './filter'
import { HydeTrace } from './hyde'
import { MultiQueryTrace } from './multi-query'
import { EmbeddingTrace } from './embedding'
import { RetrievalTrace } from './retrieval'
import { RRFFusionTrace } from './rrf-fusion'
import { CRAGFallbackTrace } from './crag-fallback'
import { RerankerTrace } from './reranker'
import { MMRSelectionTrace } from './mmr-selection'
import { GenerationTrace } from './generation'
import { SelfReflectionTrace } from './self-reflection'
import { JudgeTrace } from './judge'
import { GuardrailsOutputTrace } from './guardrails-output'
import { MemoryExtractionTrace } from './memory-extraction'
import { AgenticTrace } from './agentic'
import { MultiToolTrace } from './multi-tool'

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
  if (stageKey === 'guardrails_input') return <GuardrailsInputTrace query={query} pipelineStage={pipelineStage ?? null} />
  if (stageKey === 'cache') return <CacheTrace pipelineStage={pipelineStage ?? null} query={query} pipelineTrace={trace} />
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
  if (stageKey === 'agentic') {
    if (!trace) return <p className="text-[11px] text-wb-40">無詳細資料（舊記錄）</p>
    return <AgenticTrace trace={trace} />
  }
  if (stageKey === 'filter') return <FilterTrace trace={trace} pipelineStage={pipelineStage ?? null} />
  if (stageKey === 'embedding') return <EmbeddingTrace trace={trace} pipelineStage={pipelineStage ?? null} query={query} />
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
  if (stageKey === 'generation') {
    if (!trace) return <p className="text-[11px] text-wb-40">無詳細資料（舊記錄）</p>
    return <GenerationTrace trace={trace} pipelineStage={pipelineStage ?? null} query={query} response={response} />
  }
  if (stageKey === 'self_reflection') return <SelfReflectionTrace trace={trace} pipelineStage={pipelineStage ?? null} />
  if (stageKey === 'judge') return <JudgeTrace pipelineStage={pipelineStage ?? null} response={response} />
  if (stageKey === 'guardrails_output') return <GuardrailsOutputTrace response={response} pipelineStage={pipelineStage ?? null} />
  if (stageKey === 'memory_extraction') return <MemoryExtractionTrace pipelineStage={pipelineStage ?? null} />
  return <p className="text-[11px] text-wb-40">此階段無額外詳細資料</p>
}
