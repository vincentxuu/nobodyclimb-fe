'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { IOFlow, KVRow, StageDesc, StageSection, TraceBadge } from '../shared'
import { ensureArray, type PipelineTrace } from '../types'

export function GenerationTrace({
  trace,
  pipelineStage,
  query,
  response,
}: {
  trace: PipelineTrace
  pipelineStage: Record<string, unknown> | null
  query: string
  response: string | null
}) {
  const g = trace.generation
  const [showMemoryPreview, setShowMemoryPreview] = useState(false)
  if (!g) return <p className="text-[11px] text-wb-40">無詳細資料（舊記錄）</p>
  const model = pipelineStage?.model as string | null | undefined
  const tokenCount = pipelineStage?.token_count as number | null | undefined
  const durationMs = pipelineStage?.duration_ms as number | null | undefined
  const contextDocTitles = ensureArray<string>(g.context_doc_titles)
  const suggestedQuestions = ensureArray<string>(g.suggested_questions)

  return (
    <div>
      <StageDesc>
        將 MMR 選出的文件作為 Context，連同用戶查詢和個人化資訊（攀登歷史、記憶摘要）注入
        Prompt，呼叫
        LLM（Gemma-3-12B）生成最終回答。依查詢類型選擇個人化或通用模板，並同時輸出建議追問問題。
      </StageDesc>
      <IOFlow>
        <StageSection type="input">
          <div className="space-y-1.5">
            <KVRow label="觸發條件" value="所有完整 Pipeline 查詢必經此階段（快取命中時跳過）" />
            <KVRow label="Context 文件" value={`${g.context_doc_count} 筆`} />
            <KVRow
              label="查詢"
              value={<span className="italic text-wb-60 line-clamp-1">{query}</span>}
            />
            {contextDocTitles.length > 0 && (
              <div>
                <p className="text-wb-40 text-[10px] mb-1">
                  注入 Prompt 的文件（前 {contextDocTitles.length} 筆）：
                </p>
                <ol className="space-y-0.5">
                  {contextDocTitles.map((title, i) => (
                    <li key={i} className="flex gap-1.5 text-[11px]">
                      <span className="shrink-0 text-wb-40 tabular-nums">{i + 1}.</span>
                      <span className="text-wb-70 truncate">{title}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-wb-40">Prompt 模板：</span>
              <TraceBadge
                text={
                  g.prompt_template === 'personalized'
                    ? '個人化模板'
                    : g.prompt_template === 'default'
                      ? '通用模板'
                      : g.personalized
                        ? '個人化模板'
                        : '通用模板'
                }
                color={
                  g.prompt_template === 'personalized' || g.personalized ? 'violet' : 'default'
                }
              />
            </div>
            {g.ability_level != null && (
              <KVRow
                label="能力等級"
                value={
                  <TraceBadge
                    text={
                      g.ability_level >= 120
                        ? '高階（5.12+）'
                        : g.ability_level >= 100
                          ? '中階（5.10-5.11）'
                          : '入門'
                    }
                    color={
                      g.ability_level >= 120
                        ? 'violet'
                        : g.ability_level >= 100
                          ? 'blue'
                          : 'default'
                    }
                  />
                }
              />
            )}
            {g.memory_summary_preview !== undefined && g.memory_summary_preview !== null && (
              <div>
                <button
                  onClick={() => setShowMemoryPreview((v) => !v)}
                  className="flex items-center gap-1 text-[11px] text-wb-50 hover:text-wb-70"
                >
                  {showMemoryPreview ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                  記憶摘要預覽
                </button>
                {showMemoryPreview && (
                  <pre className="mt-1 font-sans text-wb-60 bg-wb-5 rounded px-2 py-1.5 text-[10px] whitespace-pre-wrap leading-relaxed max-h-24 overflow-auto">
                    {g.memory_summary_preview}
                  </pre>
                )}
              </div>
            )}
            {g.memory_summary_length != null &&
              g.memory_summary_length > 0 &&
              !g.memory_summary_preview && (
                <KVRow label="記憶長度" value={`${g.memory_summary_length} 字元`} />
              )}
          </div>
        </StageSection>
        <StageSection type="decision">
          <div className="space-y-1">
            {model && <KVRow label="模型" value={model.split('/').pop() ?? model} />}
            <KVRow
              label="個人化"
              value={g.personalized ? '是（注入攀登歷史）' : '否（通用回應）'}
            />
            {durationMs != null && <KVRow label="生成耗時" value={`${durationMs} ms`} />}
          </div>
        </StageSection>
        <StageSection type="output">
          <div className="space-y-1">
            {tokenCount != null && <KVRow label="Token 用量" value={`${tokenCount} tokens`} />}
            {suggestedQuestions.length > 0 && (
              <div>
                <p className="text-wb-40 mb-1">生成建議問題（{suggestedQuestions.length} 條）：</p>
                <ol className="space-y-0.5">
                  {suggestedQuestions.map((q, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="shrink-0 text-wb-40 tabular-nums">{i + 1}.</span>
                      <span className="text-wb-70">{q}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            {response && (
              <div>
                <p className="text-wb-40 mb-1">回答預覽：</p>
                <p className="text-wb-70 line-clamp-3 italic">{response}</p>
              </div>
            )}
          </div>
        </StageSection>
      </IOFlow>
    </div>
  )
}
