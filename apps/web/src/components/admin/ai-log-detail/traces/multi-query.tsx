'use client'

import { StageDesc, StageSection, IOFlow, KVRow } from '../shared'
import type { PipelineTrace } from '../types'

export function MultiQueryTrace({ trace, query }: { trace: PipelineTrace; query: string }) {
  const mq = trace.multi_query
  return (
    <div>
      <StageDesc>使用 LLM 將原始查詢改寫為多個語義不同但意圖相同的子查詢，各子查詢分別在 retrieval 階段執行獨立的向量搜尋。透過多角度表述提升向量召回率，最終在 RRF 合併時整合各路徑結果。觸發條件：query_type = complex 且配置允許。</StageDesc>
    <IOFlow>
      <StageSection type="input">
        <div className="space-y-1">
          <KVRow label="觸發條件" value="query_type = complex 且 multi_query 配置已啟用" />
          <div className="space-y-0.5">
            <p className="text-wb-40 text-[10px]">原始查詢（來自 query_parsing 輸出）：</p>
            <p className="font-mono text-[11px] text-wb-70 bg-wb-5 rounded px-2 py-1.5 break-all">{query}</p>
          </div>
        </div>
      </StageSection>
      <StageSection type="decision">
        {mq ? (
          <KVRow label="擴展策略" value={`LLM 重寫為 ${mq.queries.length} 條語義不同的子查詢，提升向量召回率`} />
        ) : (
          <p className="text-wb-40">無詳細資料（舊記錄）</p>
        )}
      </StageSection>
      <StageSection type="output">
        {mq ? (
          <ol className="space-y-1">
            {mq.queries.map((q, i) => (
              <li key={i} className="flex gap-2">
                <span className="shrink-0 text-wb-40 tabular-nums">{i + 1}.</span>
                <span className="text-wb-80">{q}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-wb-40">無詳細資料（舊記錄）</p>
        )}
      </StageSection>
    </IOFlow>
    </div>
  )
}
