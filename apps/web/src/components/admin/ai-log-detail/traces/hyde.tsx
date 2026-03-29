'use client'

import { IOFlow, KVRow, StageDesc, StageSection, TraceBadge } from '../shared'
import type { PipelineTrace } from '../types'

export function HydeTrace({
  trace,
  pipelineStage,
}: {
  trace: PipelineTrace | null
  pipelineStage?: Record<string, unknown> | null
}) {
  const h = trace?.hyde
  const triggered = pipelineStage?.triggered as boolean | undefined
  const queryType = pipelineStage?.query_type as string | undefined

  return (
    <div>
      <StageDesc>
        Hypothetical Document Embedding。對 complex 類型查詢，先讓 LLM
        生成一份「假設性的理想回答文件」，再對此文件進行向量化。用假設文件的向量而非查詢向量去搜尋，能找到在語意空間中更接近「答案形式」的文件，顯著提升複雜查詢的召回品質。
      </StageDesc>
      <IOFlow>
        <StageSection type="input">
          <div className="space-y-1">
            <KVRow label="觸發條件" value="query_type = complex 或相似路線搜尋意圖" />
            {queryType && (
              <KVRow
                label="本次類型"
                value={
                  <TraceBadge
                    text={queryType}
                    color={
                      queryType === 'complex'
                        ? 'violet'
                        : queryType === 'simple'
                          ? 'blue'
                          : 'emerald'
                    }
                  />
                }
              />
            )}
          </div>
        </StageSection>
        <StageSection type="decision">
          {triggered === false ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <TraceBadge text="未觸發" color="default" />
                <span className="text-wb-50">此查詢不符合 HyDE 觸發條件</span>
              </div>
              <ul className="text-wb-50 space-y-0.5 list-disc list-inside">
                <li>simple 查詢 → 不需要假設性文件擴展</li>
                <li>general-knowledge → 不依賴向量檢索</li>
              </ul>
            </div>
          ) : triggered === true ? (
            <div className="flex items-center gap-2">
              <TraceBadge text="已觸發" color="violet" />
              <span className="text-wb-50">LLM 生成假設性文件以改善向量搜尋品質</span>
            </div>
          ) : (
            <p className="text-wb-40">無詳細資料（舊記錄）</p>
          )}
        </StageSection>
        <StageSection type="output">
          {h?.document ? (
            <div>
              <p className="text-wb-40 mb-1">假設性文件（前 300 字）：</p>
              <pre className="font-mono text-wb-70 bg-wb-5 rounded px-2 py-1.5 whitespace-pre-wrap leading-relaxed max-h-48 overflow-auto text-[10px]">
                {h.document}
              </pre>
            </div>
          ) : triggered === false ? (
            <p className="text-wb-40">跳過，不產生假設性文件</p>
          ) : triggered === true ? (
            <p className="text-wb-40">假設性文件未記錄（舊記錄不含此資料）</p>
          ) : (
            <p className="text-wb-40">無詳細資料</p>
          )}
        </StageSection>
      </IOFlow>
    </div>
  )
}
