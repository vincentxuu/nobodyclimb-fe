'use client'

import { Database } from 'lucide-react'
import { IOFlow, KVRow, StageDesc, StageSection, TraceBadge } from '../shared'

export function MemoryExtractionTrace({
  pipelineStage,
}: {
  pipelineStage: Record<string, unknown> | null
}) {
  const me = pipelineStage as {
    triggered?: boolean
    async?: boolean
    reason?: string
    skipped?: boolean
  } | null

  const triggered = me?.triggered
  const reason = me?.reason

  return (
    <div>
      <StageDesc>
        對話結束後，非同步萃取本次對話中用戶透露的個人資訊（攀登偏好、目標路線、能力等），存入 D1
        user_memories 表供未來查詢個人化使用。使用 ctx.waitUntil()
        確保不阻塞主回應，僅對已登入用戶執行，快取命中的查詢跳過此步驟。
      </StageDesc>
      <IOFlow>
        <StageSection type="input">
          <div className="space-y-1">
            <KVRow label="觸發條件" value="用戶已登入 且 本次非快取命中（快取命中時跳過）" />
            <p className="text-wb-50 mt-0.5">本次對話：查詢 + AI 回答</p>
            <p className="text-wb-40">搭配用戶既有記憶上下文進行萃取判斷</p>
          </div>
        </StageSection>
        <StageSection type="decision">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              {triggered === false ? (
                <TraceBadge text={`未執行（${reason ?? '匿名用戶'}）`} color="default" />
              ) : triggered === true ? (
                <TraceBadge text="排入非同步執行" color="violet" />
              ) : (
                <TraceBadge text="已跳過（快取命中或匿名用戶）" color="default" />
              )}
            </div>
            {triggered === true && (
              <code className="rounded bg-wb-10 px-1.5 py-0.5 text-[10px] text-wb-80 font-mono block">
                ctx.waitUntil(extractMemory(conversation))
              </code>
            )}
            <p className="text-wb-40">不阻塞主要回應，Worker 回應後繼續執行</p>
          </div>
        </StageSection>
        <StageSection type="output">
          {triggered === true ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Database className="h-3.5 w-3.5 text-wb-50 shrink-0" />
                <span>非同步萃取，結果存入 D1 user_memories 表</span>
              </div>
              <p className="text-wb-40">供後續查詢個人化使用</p>
            </div>
          ) : (
            <p className="text-wb-40">未執行記憶萃取</p>
          )}
        </StageSection>
      </IOFlow>
    </div>
  )
}
