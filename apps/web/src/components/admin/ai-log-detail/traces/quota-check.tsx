'use client'

import { CheckCircle2 } from 'lucide-react'
import { IOFlow, KVRow, StageDesc, StageSection, TraceBadge } from '../shared'

export function QuotaCheckTrace({
  pipelineStage,
}: {
  pipelineStage: Record<string, unknown> | null
}) {
  const qc = pipelineStage as {
    rank?: string
    daily_ai_used?: number
    daily_ai_limit?: number
    estimated_tokens?: number
    result?: string
  } | null

  const isAdminBypass = qc?.result === 'admin_bypass'
  const used = qc?.daily_ai_used
  const limit = qc?.daily_ai_limit

  return (
    <div>
      <StageDesc>
        依據用戶的 Climber Rank 等級確認今日剩餘 AI 查詢次數。使用原子性 SQL UPDATE 扣除配額（WHERE
        used &lt; limit），防止並發請求超額。配額用盡回傳 429；管理員帳號無限制直接通過。每日午夜
        UTC 自動重置。
      </StageDesc>
      <IOFlow>
        <StageSection type="input">
          <div className="space-y-1">
            <KVRow
              label="觸發條件"
              value="所有非快取查詢強制執行；管理員帳號直接 bypass；配額耗盡回傳 429"
            />
            <KVRow
              label="用戶等級"
              value={
                qc?.rank ? (
                  <TraceBadge
                    text={qc.rank}
                    color={
                      qc.rank === 'admin' ? 'violet' : qc.rank === 'summit' ? 'emerald' : 'blue'
                    }
                  />
                ) : (
                  '—'
                )
              }
            />
            {used != null && limit != null && (
              <KVRow label="今日使用" value={`${used} / ${limit === -1 ? '∞' : limit} 次`} />
            )}
            {qc?.estimated_tokens != null && (
              <KVRow label="預估 Token" value={`${qc.estimated_tokens} tokens`} />
            )}
          </div>
        </StageSection>
        <StageSection type="decision">
          {isAdminBypass ? (
            <div className="flex items-center gap-2">
              <TraceBadge text="管理員：跳過配額" color="violet" />
              <span className="text-wb-50">不扣除任何配額</span>
            </div>
          ) : (
            <div className="space-y-1.5">
              <code className="rounded bg-wb-10 px-1.5 py-0.5 text-[10px] text-wb-80 font-mono block whitespace-pre">
                {`UPDATE user_ranks\n  SET daily_ai_used = daily_ai_used + 1\n  WHERE user_id = ? AND daily_ai_used < daily_ai_limit`}
              </code>
              <p className="text-wb-50">原子性 SQL UPDATE，避免並發重複計算</p>
            </div>
          )}
        </StageSection>
        <StageSection type="output">
          {qc?.result ? (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <TraceBadge
                text={
                  qc.result === 'admin_bypass'
                    ? '管理員免配額'
                    : `通過（剩餘 ${limit != null && limit !== -1 ? Math.max(0, limit - ((used ?? 0) + 1)) : '∞'} 次）`
                }
                color="emerald"
              />
            </div>
          ) : (
            <div className="space-y-1">
              <KVRow label="成功" value="配額 -1，查詢繼續執行" />
              <KVRow label="超額" value="回傳 429 Too Many Requests" />
            </div>
          )}
        </StageSection>
      </IOFlow>
    </div>
  )
}
