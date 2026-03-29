'use client'

import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { IOFlow, KVRow, StageDesc, StageSection, TraceBadge } from '../shared'

export function GuardrailsInputTrace({
  query,
  pipelineStage,
}: {
  query: string
  pipelineStage: Record<string, unknown> | null
}) {
  const gi = pipelineStage as {
    checks_run?: string[]
    query_length?: number
    blocklist_size?: number
    triggered_check?: string | null
  } | null

  const checksRun = gi?.checks_run ?? []
  const checkLabels: Record<string, { label: string; desc: string }> = {
    prompt_injection: { label: 'Prompt Injection', desc: '偵測覆寫系統提示的惡意輸入' },
    jailbreak: { label: 'Jailbreak', desc: '偵測繞過安全限制的提示詞' },
    meaningless: { label: '無效輸入', desc: '純符號或連續重複字元' },
    blocklist: { label: '封鎖詞過濾', desc: `比對封鎖詞清單（${gi?.blocklist_size ?? 0} 筆）` },
  }

  return (
    <div>
      <StageDesc>
        查詢進入 Pipeline 的第一道安全關卡。對用戶輸入執行多重安全檢查，防範 Prompt
        Injection、越獄攻擊（Jailbreak）與無效輸入，確保後續 Pipeline
        只處理合法請求。任一檢查觸發即立即攔截，不進入後續流程。
      </StageDesc>
      <IOFlow>
        <StageSection type="input">
          <KVRow label="觸發條件" value="所有查詢強制執行（無條件觸發，任一檢查失敗即攔截）" />
          <p className="font-mono text-xs text-wb-80 bg-wb-5 rounded px-2 py-1.5 break-all mt-1">
            {query}
          </p>
          <p className="text-wb-40 mt-1">字元數：{gi?.query_length ?? query.length}</p>
        </StageSection>
        <StageSection type="decision">
          <div className="space-y-1.5">
            {(checksRun.length > 0
              ? checksRun
              : ['prompt_injection', 'jailbreak', 'meaningless', 'blocklist']
            ).map((key) => {
              const cfg = checkLabels[key] ?? { label: key, desc: '' }
              return (
                <div key={key} className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                  <TraceBadge text={cfg.label} color="blue" />
                  <span className="text-wb-50">{cfg.desc}</span>
                </div>
              )
            })}
          </div>
        </StageSection>
        <StageSection type="output">
          {gi?.triggered_check ? (
            <div className="flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
              <TraceBadge text={`攔截：${gi.triggered_check}`} color="red" />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span>全部 {checksRun.length || 4} 項檢查通過，查詢送入下一階段</span>
            </div>
          )}
        </StageSection>
      </IOFlow>
    </div>
  )
}
