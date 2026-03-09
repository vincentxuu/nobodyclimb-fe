'use client'

import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import { StageDesc, StageSection, IOFlow, TraceBadge } from '../shared'
import type { PipelineTrace } from '../types'

export function SelfReflectionTrace({
  trace,
  pipelineStage,
}: {
  trace: PipelineTrace | null
  pipelineStage: Record<string, unknown> | null
}) {
  const sr = trace?.self_reflection
  const triggered = pipelineStage?.triggered as boolean | undefined

  const firstQuality = sr?.first_judge_quality ?? sr?.original_quality
  const firstGroundedness = sr?.first_judge_groundedness ?? sr?.original_groundedness
  const secondQuality = sr?.second_judge_quality ?? sr?.regen_quality
  const secondGroundedness = sr?.second_judge_groundedness ?? sr?.regen_groundedness
  const regenReason = sr?.regen_reason
  const acceptanceReason = sr?.acceptance_reason
  const regenAccepted = sr?.regen_accepted

  const regenReasonLabels: Record<string, string> = {
    quality_below_threshold: '品質分低於閾值',
    groundedness_below_threshold: 'Groundedness 低於閾值',
    both: '品質與 Groundedness 皆不足',
  }

  return (
    <div>
      <StageDesc>LLM Judge 對初次生成的回答評分後，若品質（Quality &lt; 2/4）或接地性（Groundedness &lt; 50%）低於閾值，自動觸發重新生成（Regen）。重生成後再次評判，比較兩版本分數，選出品質較佳者作為最終回答。觸發條件：query_type = complex 或 pipeline 設定允許。</StageDesc>
    <IOFlow>
      <StageSection type="input">
        <div className="space-y-1.5">
          <p className="text-wb-50">來自 LLM 生成的原始回答 + 初次 Judge 評分</p>
          <p className="text-[10px] text-wb-30">觸發重生成條件：Quality &lt; 2（滿分 4）或 Groundedness &lt; 50%</p>
          {firstQuality != null && (
            <div className="flex gap-6 pt-0.5">
              <div>
                <p className="text-wb-40 text-[10px]">第一次 Quality（1–4）</p>
                <p className={`font-bold tabular-nums ${firstQuality >= 3 ? 'text-emerald-600' : firstQuality >= 2 ? 'text-amber-600' : 'text-red-500'}`}>
                  {firstQuality} / 4
                </p>
              </div>
              {firstGroundedness != null && (
                <div>
                  <p className="text-wb-40 text-[10px]">第一次 Groundedness（0–1）</p>
                  <p className={`font-bold tabular-nums ${firstGroundedness >= 0.7 ? 'text-emerald-600' : firstGroundedness >= 0.5 ? 'text-amber-600' : 'text-red-500'}`}>
                    {(firstGroundedness * 100).toFixed(0)}%
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </StageSection>
      <StageSection type="decision">
        {!triggered ? (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <TraceBadge text="未觸發重生成" color="default" />
            </div>
            {firstQuality != null ? (
              <p className="text-wb-50">
                第一次 Judge Quality {firstQuality}/4 高於門檻，使用原始回答
              </p>
            ) : (
              <ul className="text-wb-50 space-y-0.5 list-disc list-inside">
                <li>非 complex 查詢（simple / general-knowledge 不觸發）</li>
                <li>初次 Quality 分已高於門檻</li>
              </ul>
            )}
          </div>
        ) : sr ? (
          <div className="space-y-2">
            <div className="space-y-1.5">
              {regenReason && (
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span className="text-wb-50">觸發原因：</span>
                  <TraceBadge text={regenReasonLabels[regenReason] ?? regenReason} color="amber" />
                </div>
              )}
              <div className="flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                <TraceBadge text="執行重生成" color="violet" />
              </div>
              {secondQuality != null && (
                <div className="flex gap-4 pl-5">
                  <div>
                    <p className="text-wb-40 text-[10px]">第二次 Judge Quality</p>
                    <p className={`font-bold tabular-nums ${secondQuality >= 3 ? 'text-emerald-600' : secondQuality >= 2 ? 'text-amber-600' : 'text-red-500'}`}>
                      {secondQuality} / 4
                    </p>
                  </div>
                  {secondGroundedness != null && (
                    <div>
                      <p className="text-wb-40 text-[10px]">第二次 Groundedness</p>
                      <p className={`font-bold tabular-nums ${secondGroundedness >= 0.7 ? 'text-emerald-600' : secondGroundedness >= 0.5 ? 'text-amber-600' : 'text-red-500'}`}>
                        {(secondGroundedness * 100).toFixed(0)}%
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-wb-40">無詳細 trace 資料（舊記錄）</p>
        )}
      </StageSection>
      <StageSection type="output">
        {!triggered ? (
          <p className="text-wb-50">保留原始生成答案</p>
        ) : sr ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TraceBadge
                text={
                  acceptanceReason === 'regen_accepted' ? '採用重生成答案'
                  : acceptanceReason === 'original_kept' ? '保留原始答案（重生成未改善）'
                  : regenAccepted ? '採用重生成答案' : '保留原始答案（重生成未改善）'
                }
                color={regenAccepted ? 'emerald' : 'amber'}
              />
            </div>
            {!regenAccepted && secondGroundedness != null && firstGroundedness != null && (
              <p className="text-wb-40 text-[10px]">
                比較 Groundedness：原始 {(firstGroundedness * 100).toFixed(0)}% vs 重生成 {(secondGroundedness * 100).toFixed(0)}%，保留較高者
              </p>
            )}
          </div>
        ) : (
          <p className="text-wb-40">無詳細資料（舊記錄）</p>
        )}
      </StageSection>
    </IOFlow>
    </div>
  )
}
