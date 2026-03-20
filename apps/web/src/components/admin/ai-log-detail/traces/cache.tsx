'use client'

import { Zap, ArrowRight } from 'lucide-react'
import { StageDesc, StageSection, IOFlow, TraceBadge, KVRow } from '../shared'
import type { PipelineTrace } from '../types'

export function CacheTrace({ pipelineStage, query, pipelineTrace }: { pipelineStage: Record<string, unknown> | null; query: string; pipelineTrace: PipelineTrace | null }) {
  const hit = pipelineStage?.hit as boolean | undefined
  const cacheType = (pipelineTrace?.cache as { type?: string } | undefined)?.type
  return (
    <div>
      <StageDesc>在執行完整 RAG Pipeline 之前先查詢快取，避免相同查詢重複運算。支援兩種命中模式：KV 精確快取（完全相同的查詢鍵）與語義相似度快取（向量餘弦相似度超過閾值的近似查詢）。命中時直接回傳結果，跳過後續所有 Pipeline 階段。</StageDesc>
    <IOFlow>
      <StageSection type="input">
        <KVRow label="觸發命中條件" value="KV 精確命中：Cache Key 完全相符 ／ 語義命中：向量餘弦相似度 ≥ 閾值" />
        <KVRow label="正規化查詢" value={<span className="italic">{query}</span>} />
        <KVRow label="Cache Key 組成" value="normalized query + chat_history_depth + user_id" />
      </StageSection>
      <StageSection type="decision">
        <div className="flex items-center gap-2">
          <span className="text-wb-50">KV 快取查詢：</span>
          {hit === true
            ? <TraceBadge text="命中 (HIT)" color="blue" />
            : <TraceBadge text="未命中 (MISS)" color="default" />}
          {hit === true && cacheType === 'kv' && <TraceBadge text="KV 精確命中" color="blue" />}
          {hit === true && cacheType === 'semantic' && <TraceBadge text="語義相似命中（向量）" color="violet" />}
        </div>
      </StageSection>
      <StageSection type="output">
        {hit === true ? (
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-sky-500 shrink-0" />
            <span>
              {cacheType === 'kv'
                ? '直接回傳精確快取，跳過剩餘 Pipeline'
                : cacheType === 'semantic'
                  ? '向量相似度命中語義快取，跳過剩餘 Pipeline'
                  : '直接回傳快取結果，跳過剩餘 Pipeline'}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <ArrowRight className="h-3.5 w-3.5 text-wb-40 shrink-0" />
            <span>快取未命中，繼續執行後續 Pipeline 階段</span>
          </div>
        )}
      </StageSection>
    </IOFlow>
    </div>
  )
}
