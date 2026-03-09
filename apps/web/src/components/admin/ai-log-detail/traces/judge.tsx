'use client'

import { StageDesc, StageSection, IOFlow, KVRow } from '../shared'

export function JudgeTrace({ pipelineStage, response }: { pipelineStage: Record<string, unknown> | null; response: string | null }) {
  const groundedness = pipelineStage?.groundedness_score as number | null | undefined
  const quality = pipelineStage?.auto_score as number | null | undefined
  const judgeDetail = pipelineStage as Record<string, unknown> | null
  const rawLlmResponse = judgeDetail?.raw_llm_response as string | null | undefined
  const contextChars = judgeDetail?.context_chars as number | null | undefined
  const contextTruncated = judgeDetail?.context_truncated as boolean | undefined
  const responseChars = judgeDetail?.response_chars as number | null | undefined

  const groundednessLabel = groundedness == null ? null
    : groundedness >= 0.9 ? '所有陳述都有明確依據'
    : groundedness >= 0.7 ? '大部分有依據，少量推斷'
    : groundedness >= 0.5 ? '約一半有依據，一半是推斷'
    : groundedness >= 0.3 ? '少量有依據，大部分是推斷'
    : '幾乎沒有依據或大量推斷'

  const qualityLabel = quality == null ? null
    : quality === 4 ? '直接相關、完整、格式正確'
    : quality === 3 ? '大致相關，有小缺失'
    : quality === 2 ? '部分相關或不完整'
    : '不相關或嚴重錯誤'

  return (
    <div>
      <StageDesc>使用獨立的 LLM Judge 對生成回答進行品質評估。Groundedness 衡量回答有多少內容有文件支撐（防止幻覺）；Quality 衡量回答的完整性與相關性。兩項分數供 Self-Reflection 決策重生成，並永久記錄供管理員監控。</StageDesc>
    <IOFlow>
      <StageSection type="input">
        <div className="space-y-1.5">
          <KVRow label="觸發條件" value="所有 LLM 生成的回答皆執行；提供 Groundedness 與 Quality 評分給 Self-Reflection 使用" />
          <div className="flex flex-wrap gap-4 text-[11px]">
            {contextChars != null && (
              <span className="text-wb-50">
                來源文件：<span className="font-mono text-wb-80">{contextChars.toLocaleString()} 字元</span>
                {contextTruncated && <span className="text-amber-600 ml-1">（已截斷）</span>}
              </span>
            )}
            {responseChars != null && (
              <span className="text-wb-50">
                待評回答：<span className="font-mono text-wb-80">{responseChars.toLocaleString()} 字元</span>
              </span>
            )}
          </div>
          {response && (
            <p className="italic text-wb-60 line-clamp-2 text-[11px]">{response}</p>
          )}
        </div>
      </StageSection>
      <StageSection type="decision">
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border border-wb-15 bg-wb-03 p-2">
              <p className="text-[10px] font-medium text-wb-60 mb-1">Groundedness 評分標準（0–1）</p>
              <div className="space-y-0.5 text-[10px] text-wb-50">
                <p><span className="font-mono text-emerald-600">1.0</span>　所有陳述都有明確依據</p>
                <p><span className="font-mono text-emerald-600">0.75</span>　大部分有依據，少量推斷</p>
                <p><span className="font-mono text-amber-600">0.5</span>　約一半有依據，一半是推斷</p>
                <p><span className="font-mono text-amber-600">0.25</span>　少量有依據，大部分推斷</p>
                <p><span className="font-mono text-red-500">0.0</span>　完全沒有依據或純粹捏造</p>
              </div>
            </div>
            <div className="rounded-md border border-wb-15 bg-wb-03 p-2">
              <p className="text-[10px] font-medium text-wb-60 mb-1">Quality 評分標準（1–4）</p>
              <div className="space-y-0.5 text-[10px] text-wb-50">
                <p><span className="font-mono text-emerald-600">4</span>　直接相關、完整、格式正確</p>
                <p><span className="font-mono text-emerald-600">3</span>　大致相關，有小缺失</p>
                <p><span className="font-mono text-amber-600">2</span>　部分相關或不完整</p>
                <p><span className="font-mono text-red-500">1</span>　不相關或嚴重錯誤</p>
              </div>
            </div>
          </div>
          {rawLlmResponse != null && (
            <div>
              <p className="text-[10px] text-wb-40 mb-0.5">Judge LLM 原始回覆</p>
              <pre className="rounded bg-wb-05 border border-wb-15 px-2.5 py-1.5 text-[11px] font-mono text-wb-80 whitespace-pre-wrap break-all">{rawLlmResponse}</pre>
            </div>
          )}
        </div>
      </StageSection>
      <StageSection type="output">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-wb-40 text-[10px]">Groundedness</p>
              <p className="text-[9px] text-wb-25 mb-0.5">回答有多少來自文件（0–1，≥70% 良好）</p>
              {groundedness != null ? (
                <div>
                  <p className={`text-base font-bold tabular-nums ${groundedness >= 0.7 ? 'text-emerald-600' : groundedness >= 0.5 ? 'text-amber-600' : 'text-red-500'}`}>
                    {(groundedness * 100).toFixed(0)}%
                  </p>
                  {groundednessLabel && <p className="text-[10px] text-wb-40 mt-0.5">{groundednessLabel}</p>}
                </div>
              ) : (
                <p className="text-wb-40 text-base">—</p>
              )}
            </div>
            <div>
              <p className="text-wb-40 text-[10px]">Quality</p>
              <p className="text-[9px] text-wb-25 mb-0.5">回答完整性與相關性（1–4，≥3 良好）</p>
              {quality != null ? (
                <div>
                  <p className={`text-base font-bold tabular-nums ${quality >= 3 ? 'text-emerald-600' : quality >= 2 ? 'text-amber-600' : 'text-red-500'}`}>
                    {quality} / 4
                  </p>
                  {qualityLabel && <p className="text-[10px] text-wb-40 mt-0.5">{qualityLabel}</p>}
                </div>
              ) : (
                <p className="text-wb-40 text-base">—</p>
              )}
            </div>
          </div>
        </div>
      </StageSection>
    </IOFlow>
    </div>
  )
}
