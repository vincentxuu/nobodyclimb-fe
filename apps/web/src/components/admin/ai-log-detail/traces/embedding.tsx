'use client'

import { IOFlow, KVRow, StageDesc, StageSection, TraceBadge } from '../shared'
import type { PipelineTrace } from '../types'

export function EmbeddingTrace({
  trace,
  pipelineStage,
  query,
}: {
  trace: PipelineTrace | null
  pipelineStage: Record<string, unknown> | null
  query: string
}) {
  const e = trace?.embedding
  const durationMs = pipelineStage?.duration_ms as number | null | undefined
  const hydeDoc = trace?.hyde?.document
  const expandedQueries = trace?.multi_query?.queries ?? []

  if (e?.skipped) {
    return (
      <div>
        <StageDesc>將查詢文字轉換為 1024 維稠密向量。當檢索方法為 BM25 時跳過此步驟。</StageDesc>
        <IOFlow>
          <StageSection type="decision">
            <div className="flex items-center gap-2">
              <TraceBadge text="已跳過" color="amber" />
              <span className="text-wb-60">
                原因：{e.reason === 'bm25_only' ? 'BM25 精確匹配模式，無需向量嵌入' : e.reason}
              </span>
            </div>
          </StageSection>
        </IOFlow>
      </div>
    )
  }

  return (
    <div>
      <StageDesc>
        將查詢文字（及 HyDE 假設文件、Multi-Query 擴展查詢）轉換為 1024
        維稠密向量（@cf/baai/bge-m3），供向量資料庫執行餘弦相似度搜尋。若前序階段已生成 query
        向量（early_vector），可直接復用以節省時間。
      </StageDesc>
      <IOFlow>
        <StageSection type="input">
          {e ? (
            <div className="space-y-2">
              <KVRow
                label="觸發條件"
                value="所有向量搜尋必經；若已有 early_vector 可直接復用，跳過重新 embedding"
              />
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
                  <span>
                    {e.early_vector_reused ? 'query 向量（復用早期向量）' : 'query 向量（新生成）'}
                  </span>
                </div>
                {query && (
                  <p className="ml-3 text-[10px] text-wb-60 font-mono border-l-2 border-blue-100 pl-2 line-clamp-2">
                    {query}
                  </p>
                )}
              </div>
              {e.hyde_embedded && (
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shrink-0" />
                    <span>HyDE 假設文件向量</span>
                  </div>
                  {hydeDoc ? (
                    <p className="ml-3 text-[10px] text-wb-60 border-l-2 border-violet-100 pl-2 line-clamp-3">
                      {hydeDoc}
                    </p>
                  ) : (
                    <p className="ml-3 text-[10px] text-wb-30 border-l-2 border-wb-10 pl-2">
                      假設性文件未記錄（舊記錄）
                    </p>
                  )}
                </div>
              )}
              {e.expanded_count > 0 && (
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                    <span>Multi-Query 擴展向量 ×{e.expanded_count}</span>
                  </div>
                  {expandedQueries.length > 0 ? (
                    <div className="ml-3 border-l-2 border-amber-100 pl-2 space-y-0.5">
                      {expandedQueries.map((q, i) => (
                        <p key={i} className="text-[10px] text-wb-60 font-mono line-clamp-1">
                          {i + 1}. {q}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="ml-3 text-[10px] text-wb-30 border-l-2 border-wb-10 pl-2">
                      擴展查詢未記錄（舊記錄）
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-wb-40">無詳細資料（舊記錄）</p>
          )}
        </StageSection>
        <StageSection type="decision">
          <div className="space-y-1">
            <KVRow label="模型" value="@cf/baai/bge-m3（1024 維多語言嵌入）" />
            {e && (
              <KVRow
                label="早期向量"
                value={e.early_vector_reused ? '已復用（節省 embedding 時間）' : '重新生成'}
              />
            )}
            {durationMs != null && <KVRow label="耗時" value={`${durationMs} ms`} />}
          </div>
        </StageSection>
        <StageSection type="output">
          {e ? (
            <div className="space-y-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <TraceBadge
                    text={e.early_vector_reused ? 'query vec（復用）' : 'query vec'}
                    color="blue"
                  />
                  <span className="text-[10px] text-wb-40">1024 維</span>
                </div>
                {query && (
                  <p className="ml-1 text-[10px] text-wb-50 line-clamp-1 font-mono border-l border-wb-10 pl-2">
                    {query}
                  </p>
                )}
              </div>
              {e.hyde_embedded && (
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <TraceBadge text="HyDE vec" color="violet" />
                    <span className="text-[10px] text-wb-40">1024 維</span>
                  </div>
                  {hydeDoc && (
                    <p className="ml-1 text-[10px] text-wb-50 line-clamp-2 border-l border-wb-10 pl-2">
                      {hydeDoc}
                    </p>
                  )}
                </div>
              )}
              {e.expanded_count > 0 && (
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <TraceBadge text={`擴展 vec ×${e.expanded_count}`} color="amber" />
                    <span className="text-[10px] text-wb-40">1024 維 × {e.expanded_count}</span>
                  </div>
                  {expandedQueries.length > 0 && (
                    <div className="ml-1 space-y-0.5 border-l border-wb-10 pl-2">
                      {expandedQueries.map((q, i) => (
                        <p key={i} className="text-[10px] text-wb-50 line-clamp-1 font-mono">
                          {i + 1}. {q}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
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
