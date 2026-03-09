'use client'

import { CheckCircle2, AlertCircle } from 'lucide-react'
import { StageDesc, StageSection, IOFlow, TraceBadge, KVRow } from '../shared'

export function GuardrailsOutputTrace({ response, pipelineStage }: { response: string | null; pipelineStage: Record<string, unknown> | null }) {
  const go = pipelineStage as {
    original_length?: number
    output_length?: number
    system_prompt_leaked?: boolean
    pii_count?: number
    truncated?: boolean
  } | null

  const hasData = go?.original_length != null

  return (
    <div>
      <StageDesc>回答送達用戶前的最後安全關卡。偵測系統提示洩漏（System Prompt Leakage）、遮蓋個人識別資訊（PII：電話、Email 等），並在回答超過最大長度時截斷，確保輸出安全合規。</StageDesc>
    <IOFlow>
      <StageSection type="input">
        <KVRow label="觸發條件" value="所有 LLM 回應強制執行（無條件觸發）；洩漏或違規時替換回應內容" />
        {response ? (
          <div className="mt-1">
            <p className="text-wb-40 mb-1">LLM 原始回應（前 200 字）：</p>
            <p className="italic text-wb-70 bg-wb-5 rounded px-2 py-1.5 text-xs line-clamp-4 leading-relaxed">
              {response.slice(0, 200)}{response.length > 200 ? '…' : ''}
            </p>
            <p className="text-wb-40 mt-1">原始長度：{go?.original_length ?? response.length} 字元</p>
          </div>
        ) : (
          <p className="text-wb-40">LLM 原始回應</p>
        )}
      </StageSection>
      <StageSection type="decision">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            {go?.system_prompt_leaked
              ? <AlertCircle className="h-3 w-3 text-red-500 shrink-0" />
              : <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />}
            <TraceBadge text="System Prompt Leakage" color={go?.system_prompt_leaked ? 'red' : 'blue'} />
            <span className="text-wb-50">{go?.system_prompt_leaked ? '偵測到洩漏，回應已替換' : '無洩漏'}</span>
          </div>
          <div className="flex items-center gap-2">
            {go?.pii_count && go.pii_count > 0
              ? <AlertCircle className="h-3 w-3 text-amber-500 shrink-0" />
              : <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />}
            <TraceBadge text="PII 過濾" color={go?.pii_count && go.pii_count > 0 ? 'amber' : 'blue'} />
            <span className="text-wb-50">{hasData ? `發現 ${go?.pii_count ?? 0} 筆 PII 並遮蓋` : '移除電話、Email 等個人識別資訊'}</span>
          </div>
          <div className="flex items-center gap-2">
            {go?.truncated
              ? <AlertCircle className="h-3 w-3 text-amber-500 shrink-0" />
              : <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />}
            <TraceBadge text="長度截斷" color={go?.truncated ? 'amber' : 'blue'} />
            <span className="text-wb-50">{hasData ? (go?.truncated ? '已截斷（超過 3000 字）' : '未超過上限') : '超過最大長度時截斷'}</span>
          </div>
        </div>
      </StageSection>
      <StageSection type="output">
        <div className="space-y-1">
          {hasData ? (
            <>
              <KVRow label="輸出長度" value={`${go?.output_length} 字元`} />
              {go?.original_length != null && go?.output_length != null && go.original_length !== go.output_length && (
                <KVRow label="縮減" value={`${go.original_length - go.output_length} 字元`} />
              )}
            </>
          ) : null}
          <div className="flex items-center gap-2 mt-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span>安全過濾後的回應送達用戶端</span>
          </div>
        </div>
      </StageSection>
    </IOFlow>
    </div>
  )
}
