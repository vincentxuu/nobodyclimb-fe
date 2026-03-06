'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Loader2,
  Clock,
  MessageSquare,
  ThumbsUp,
  User,
  CheckCircle2,
  AlertCircle,
  Zap,
  Database,
  Search,
  Cpu,
  RefreshCw,
  Shield,
  Brain,
  FileText,
  Archive,
  ChevronDown,
  ChevronRight,
  List,
  ArrowRight,
} from 'lucide-react'
import { useAILogDetail, type AILogDetail } from '@/lib/api/admin-ai'

// =============================================
// Sub-components
// =============================================

function StatusBadge({ status }: { status: 'ran' | 'skipped' | 'hit' | 'triggered' | 'not-triggered' }) {
  const map = {
    ran: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    skipped: 'bg-wb-10 text-wb-40 border-wb-20',
    hit: 'bg-sky-50 text-sky-600 border-sky-200',
    triggered: 'bg-violet-50 text-violet-600 border-violet-200',
    'not-triggered': 'bg-wb-10 text-wb-50 border-wb-20',
  }
  const label = {
    ran: '已執行',
    skipped: '已跳過',
    hit: '命中',
    triggered: '已觸發',
    'not-triggered': '未觸發',
  }
  return (
    <span className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${map[status]}`}>
      {label[status]}
    </span>
  )
}

function StageIcon({ name, skipped }: { name: string; skipped: boolean }) {
  const cls = `h-4 w-4 ${skipped ? 'text-wb-30' : 'text-wb-70'}`
  const icons: Record<string, React.ReactNode> = {
    guardrails_input: <Shield className={cls} />,
    cache: <Zap className={cls} />,
    quota_check: <Database className={cls} />,
    query_parsing: <MessageSquare className={cls} />,
    hyde: <Brain className={cls} />,
    multi_query: <List className={cls} />,
    embedding: <Cpu className={cls} />,
    retrieval: <Search className={cls} />,
    generation: <FileText className={cls} />,
    self_reflection: <RefreshCw className={cls} />,
    judge: <CheckCircle2 className={cls} />,
    guardrails_output: <Shield className={cls} />,
    memory_extraction: <Archive className={cls} />,
  }
  return <>{icons[name] ?? <AlertCircle className={cls} />}</>
}

const STAGE_LABELS: Record<string, string> = {
  guardrails_input: '輸入護欄',
  cache: '快取查詢',
  quota_check: '配額檢查',
  query_parsing: '查詢解析',
  hyde: 'HyDE 假設文件',
  multi_query: 'Multi-Query 擴展',
  embedding: '向量嵌入',
  retrieval: '向量檢索',
  generation: 'LLM 生成',
  self_reflection: 'Judge 驅動重生成',
  judge: '品質評判',
  guardrails_output: '輸出護欄',
  memory_extraction: '記憶萃取',
}

// =============================================
// Input / Decision / Output 三段式佈局
// =============================================

function StageSection({
  type,
  children,
}: {
  type: 'input' | 'decision' | 'output'
  children: React.ReactNode
}) {
  const config = {
    input: {
      label: 'Input',
      border: 'border-l-blue-300',
      bg: 'bg-blue-50/40',
      text: 'text-blue-600',
    },
    decision: {
      label: 'Decision',
      border: 'border-l-violet-300',
      bg: 'bg-violet-50/40',
      text: 'text-violet-600',
    },
    output: {
      label: 'Output',
      border: 'border-l-emerald-300',
      bg: 'bg-emerald-50/40',
      text: 'text-emerald-600',
    },
  }
  const { label, border, bg, text } = config[type]
  return (
    <div className={`rounded-r-md border-l-2 ${border} ${bg} px-3 py-2`}>
      <p className={`text-[10px] font-bold uppercase tracking-widest ${text} mb-1.5`}>{label}</p>
      <div className="space-y-1 text-[11px] text-wb-70">{children}</div>
    </div>
  )
}

function IOFlow({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2">{children}</div>
}

// =============================================
// 共用小工具
// =============================================

function TraceBadge({ text, color = 'default' }: { text: string; color?: 'default' | 'blue' | 'violet' | 'emerald' | 'amber' | 'red' }) {
  const colors = {
    default: 'border-wb-15 bg-wb-5 text-wb-60',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    violet: 'border-violet-200 bg-violet-50 text-violet-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    red: 'border-red-200 bg-red-50 text-red-700',
  }
  return (
    <span className={`rounded border px-1.5 py-0.5 text-[11px] font-medium ${colors[color]}`}>
      {text}
    </span>
  )
}

function KVRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="shrink-0 w-24 text-wb-40">{label}</span>
      <span className="text-wb-80 font-mono break-all">{value}</span>
    </div>
  )
}

// =============================================
// 各 Stage Trace 元件（Input / Decision / Output）
// =============================================

type PipelineTrace = NonNullable<AILogDetail['pipeline_trace']>

function GuardrailsInputTrace({ query, pipelineStage }: { query: string; pipelineStage: Record<string, unknown> | null }) {
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
    <IOFlow>
      <StageSection type="input">
        <p className="font-mono text-xs text-wb-80 bg-wb-5 rounded px-2 py-1.5 break-all">{query}</p>
        <p className="text-wb-40 mt-1">字元數：{gi?.query_length ?? query.length}</p>
      </StageSection>
      <StageSection type="decision">
        <div className="space-y-1.5">
          {(checksRun.length > 0 ? checksRun : ['prompt_injection', 'jailbreak', 'meaningless', 'blocklist']).map((key) => {
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
  )
}

function CacheTrace({ pipelineStage, query }: { pipelineStage: Record<string, unknown> | null; query: string }) {
  const hit = pipelineStage?.hit as boolean | undefined
  return (
    <IOFlow>
      <StageSection type="input">
        <KVRow label="正規化查詢" value={<span className="italic">{query}</span>} />
        <KVRow label="Cache Key 組成" value="normalized query + chat_history_depth + user_id" />
      </StageSection>
      <StageSection type="decision">
        <div className="flex items-center gap-2">
          <span className="text-wb-50">KV 快取查詢：</span>
          {hit === true
            ? <TraceBadge text="命中 (HIT)" color="blue" />
            : <TraceBadge text="未命中 (MISS)" color="default" />}
        </div>
      </StageSection>
      <StageSection type="output">
        {hit === true ? (
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-sky-500 shrink-0" />
            <span>直接回傳快取結果，跳過剩餘 Pipeline</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <ArrowRight className="h-3.5 w-3.5 text-wb-40 shrink-0" />
            <span>快取未命中，繼續執行後續 Pipeline 階段</span>
          </div>
        )}
      </StageSection>
    </IOFlow>
  )
}

function QuotaCheckTrace({ pipelineStage }: { pipelineStage: Record<string, unknown> | null }) {
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
    <IOFlow>
      <StageSection type="input">
        <div className="space-y-1">
          <KVRow label="用戶等級" value={qc?.rank ? <TraceBadge text={qc.rank} color={qc.rank === 'admin' ? 'violet' : qc.rank === 'summit' ? 'emerald' : 'blue'} /> : '—'} />
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
              text={qc.result === 'admin_bypass' ? '管理員免配額' : `通過（剩餘 ${limit != null && limit !== -1 ? Math.max(0, limit - ((used ?? 0) + 1)) : '∞'} 次）`}
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
  )
}

function QueryParsingTrace({
  trace,
  query,
}: {
  trace: PipelineTrace
  query: string
}) {
  const qp = trace.query_parsing
  const f = trace.filter

  const toolColors: Record<string, 'blue' | 'violet' | 'emerald'> = {
    search_routes: 'blue',
    search_crags: 'violet',
    general_knowledge: 'emerald',
  }
  const queryTypeColors: Record<string, 'blue' | 'violet' | 'emerald'> = {
    simple: 'blue',
    complex: 'violet',
    'general-knowledge': 'emerald',
  }
  const alternatives = qp?.alternatives ?? ['search_routes', 'search_crags', 'general_knowledge']

  return (
    <IOFlow>
      <StageSection type="input">
        <p className="italic text-wb-60 line-clamp-2">{query}</p>
      </StageSection>
      <StageSection type="decision">
        {qp ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-wb-40">工具選擇：</span>
              <div className="flex flex-wrap gap-1">
                {alternatives.map((alt) => (
                  <TraceBadge
                    key={alt}
                    text={alt === qp.tool ? `✓ ${alt}` : alt}
                    color={alt === qp.tool ? toolColors[alt] ?? 'blue' : 'default'}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-wb-40">查詢類型：</span>
              <TraceBadge
                text={qp.query_type}
                color={queryTypeColors[qp.query_type] ?? 'default'}
              />
            </div>
            {Object.keys(qp.params).length > 0 && (
              <div>
                <p className="text-wb-40 mb-1">LLM 抽取 Params：</p>
                <div className="space-y-0.5">
                  {Object.entries(qp.params).map(([k, v]) => (
                    <KVRow key={k} label={k} value={JSON.stringify(v)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-wb-40">無詳細 trace 資料（舊記錄）</p>
        )}
      </StageSection>
      <StageSection type="output">
        {f ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-wb-40">Filter 來源：</span>
              <TraceBadge
                text={f.source}
                color={f.source === 'llm_parsed' ? 'emerald' : f.source === 'sim_route' ? 'blue' : 'amber'}
              />
            </div>
            <pre className="font-mono text-wb-70 bg-wb-5 rounded px-2 py-1.5 overflow-auto max-h-24 text-[10px]">
              {JSON.stringify(f.applied, null, 2)}
            </pre>
          </div>
        ) : (
          <p className="text-wb-40">無 Filter 套用（general-knowledge 或無結構化參數）</p>
        )}
      </StageSection>
    </IOFlow>
  )
}

function HydeTrace({ trace, pipelineStage }: { trace: PipelineTrace | null; pipelineStage?: Record<string, unknown> | null }) {
  const h = trace?.hyde
  const triggered = pipelineStage?.triggered as boolean | undefined
  const queryType = pipelineStage?.query_type as string | undefined

  return (
    <IOFlow>
      <StageSection type="input">
        <KVRow label="觸發條件" value="query_type = complex" />
        {queryType && <KVRow label="本次類型" value={<TraceBadge text={queryType} color={queryType === 'complex' ? 'violet' : queryType === 'simple' ? 'blue' : 'emerald'} />} />}
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
        {h ? (
          <div>
            <p className="text-wb-40 mb-1">假設性文件（前 300 字）：</p>
            <pre className="font-mono text-wb-70 bg-wb-5 rounded px-2 py-1.5 whitespace-pre-wrap leading-relaxed max-h-40 overflow-auto text-[10px]">
              {h.document}
            </pre>
          </div>
        ) : triggered === false ? (
          <p className="text-wb-40">跳過，不產生假設性文件</p>
        ) : (
          <p className="text-wb-40">無詳細資料（舊記錄）</p>
        )}
      </StageSection>
    </IOFlow>
  )
}

function MultiQueryTrace({ trace }: { trace: PipelineTrace }) {
  const mq = trace.multi_query
  return (
    <IOFlow>
      <StageSection type="input">
        <p className="text-wb-50">原始查詢（來自 query_parsing 輸出）</p>
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
  )
}

function EmbeddingTrace({
  trace,
  pipelineStage,
}: {
  trace: PipelineTrace | null
  pipelineStage: Record<string, unknown> | null
}) {
  const e = trace?.embedding
  const durationMs = pipelineStage?.duration_ms as number | null | undefined

  const inputs: string[] = []
  if (e) {
    inputs.push(e.early_vector_reused ? 'query 向量（復用早期向量）' : 'query 向量（新生成）')
    if (e.hyde_embedded) inputs.push('HyDE 假設文件向量')
    if (e.expanded_count > 0) inputs.push(`Multi-Query 擴展向量 ×${e.expanded_count}`)
  }

  return (
    <IOFlow>
      <StageSection type="input">
        {e ? (
          <div className="space-y-1">
            {inputs.map((t) => (
              <div key={t} className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
                <span>{t}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-wb-40">無詳細資料（舊記錄）</p>
        )}
      </StageSection>
      <StageSection type="decision">
        <div className="space-y-1">
          <KVRow label="模型" value="@cf/baai/bge-m3（1024 維多語言嵌入）" />
          {e && <KVRow label="早期向量" value={e.early_vector_reused ? '已復用（節省 embedding 時間）' : '重新生成'} />}
          {durationMs != null && <KVRow label="耗時" value={`${durationMs} ms`} />}
        </div>
      </StageSection>
      <StageSection type="output">
        {e ? (
          <div className="flex flex-wrap gap-1.5">
            <TraceBadge text={e.early_vector_reused ? 'query vec（復用）' : 'query vec'} color="blue" />
            {e.hyde_embedded && <TraceBadge text="HyDE vec" color="violet" />}
            {e.expanded_count > 0 && <TraceBadge text={`擴展 vec ×${e.expanded_count}`} color="amber" />}
          </div>
        ) : (
          <p className="text-wb-40">無詳細資料（舊記錄）</p>
        )}
      </StageSection>
    </IOFlow>
  )
}

function RetrievalTrace({
  trace,
  pipelineStage,
  sources,
}: {
  trace: PipelineTrace
  pipelineStage: Record<string, unknown> | null
  sources: Array<{ title?: string; type?: string; score?: number }>
}) {
  const r = trace.retrieval
  const topScore = pipelineStage?.top_score as number | null | undefined
  const docCount = pipelineStage?.doc_count as number | null | undefined

  if (!r) return <p className="text-[11px] text-wb-40">無詳細資料（舊記錄）</p>
  return (
    <IOFlow>
      <StageSection type="input">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-wb-40 shrink-0">搜尋路徑：</span>
            <div className="flex flex-wrap gap-1">
              {r.paths.map((p) => (
                <TraceBadge
                  key={p}
                  text={p}
                  color={p === 'query_vec' ? 'blue' : p === 'hyde_vec' ? 'violet' : p === 'bm25' ? 'emerald' : 'default'}
                />
              ))}
            </div>
          </div>
          <KVRow label="原始候選" value={`${r.candidates_before_filter} 筆`} />
        </div>
      </StageSection>
      <StageSection type="decision">
        <div className="space-y-1.5">
          <KVRow label="RRF 融合" value="多路徑結果合併排序（Reciprocal Rank Fusion）" />
          <KVRow label="過濾策略" value="相似度閾值 + location / grade / type Filter" />
          <div className="flex items-center gap-2">
            <span className="text-wb-40">CRAG Fallback：</span>
            {r.crag_fallback
              ? <TraceBadge text="已觸發（相似度不足，改用通識回答）" color="amber" />
              : <TraceBadge text="未觸發（檢索品質足夠）" color="default" />}
          </div>
        </div>
      </StageSection>
      <StageSection type="output">
        <div className="space-y-2">
          <div className="flex gap-4">
            {docCount != null && (
              <div>
                <p className="text-wb-40">存活文件</p>
                <p className="text-base font-bold text-wb-90 tabular-nums">{docCount} 筆</p>
              </div>
            )}
            {topScore != null && (
              <div>
                <p className="text-wb-40">最高相似度</p>
                <p className={`text-base font-bold tabular-nums ${topScore >= 0.7 ? 'text-emerald-600' : topScore >= 0.5 ? 'text-amber-600' : 'text-red-500'}`}>
                  {(topScore * 100).toFixed(1)}%
                </p>
              </div>
            )}
          </div>
          {sources.length > 0 && (
            <div>
              <p className="text-wb-40 mb-1">檢索到的文件：</p>
              <div className="space-y-1">
                {sources.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 rounded bg-wb-5 px-2 py-1">
                    <span className="shrink-0 rounded border border-wb-20 px-1 py-0.5 text-[10px] text-wb-60">{s.type}</span>
                    <span className="flex-1 text-wb-80 truncate">{s.title ?? '—'}</span>
                    {s.score != null && (
                      <span className={`tabular-nums shrink-0 ${s.score >= 0.7 ? 'text-emerald-600' : s.score >= 0.5 ? 'text-amber-600' : 'text-red-500'}`}>
                        {(s.score * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </StageSection>
    </IOFlow>
  )
}

function GenerationTrace({
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
  if (!g) return <p className="text-[11px] text-wb-40">無詳細資料（舊記錄）</p>
  const model = pipelineStage?.model as string | null | undefined
  const tokenCount = pipelineStage?.token_count as number | null | undefined
  const durationMs = pipelineStage?.duration_ms as number | null | undefined

  return (
    <IOFlow>
      <StageSection type="input">
        <div className="space-y-1">
          <KVRow label="Context 文件" value={`${g.context_doc_count} 筆檢索結果`} />
          <KVRow label="個人化記憶" value={g.personalized ? '已注入用戶攀登記憶' : '未啟用'} />
          <KVRow label="查詢" value={<span className="italic text-wb-60 line-clamp-1">{query}</span>} />
        </div>
      </StageSection>
      <StageSection type="decision">
        <div className="space-y-1">
          {model && <KVRow label="模型" value={model.split('/').pop() ?? model} />}
          <KVRow label="個人化" value={g.personalized ? '是（注入攀登歷史）' : '否（通用回應）'} />
          {durationMs != null && <KVRow label="生成耗時" value={`${durationMs} ms`} />}
        </div>
      </StageSection>
      <StageSection type="output">
        <div className="space-y-1">
          {tokenCount != null && <KVRow label="Token 用量" value={`${tokenCount} tokens`} />}
          {response && (
            <div>
              <p className="text-wb-40 mb-1">回答預覽：</p>
              <p className="text-wb-70 line-clamp-3 italic">{response}</p>
            </div>
          )}
        </div>
      </StageSection>
    </IOFlow>
  )
}

function SelfReflectionTrace({
  trace,
  pipelineStage,
}: {
  trace: PipelineTrace | null
  pipelineStage: Record<string, unknown> | null
}) {
  const sr = trace?.self_reflection
  const triggered = pipelineStage?.triggered as boolean | undefined

  return (
    <IOFlow>
      <StageSection type="input">
        {sr ? (
          <div className="space-y-1">
            <KVRow label="原始 Quality" value={sr.original_quality != null ? `${sr.original_quality} / 4` : '—'} />
            <KVRow label="原始 Groundedness" value={sr.original_groundedness != null ? `${(sr.original_groundedness * 100).toFixed(0)}%` : '—'} />
          </div>
        ) : (
          <p className="text-wb-40">來自初次 Judge 評分結果</p>
        )}
      </StageSection>
      <StageSection type="decision">
        {!triggered ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TraceBadge text="未觸發" color="default" />
            </div>
            <ul className="text-wb-50 space-y-0.5 list-disc list-inside">
              <li>非 complex 查詢（simple / general-knowledge 不觸發）</li>
              <li>初次 Quality 分已高於門檻</li>
              <li>回答長度低於最小重生成閾值</li>
            </ul>
          </div>
        ) : sr ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TraceBadge text="已觸發重生成" color="violet" />
            </div>
            <KVRow label="重生成 Quality" value={sr.regen_quality != null ? `${sr.regen_quality} / 4` : '—'} />
            <KVRow label="重生成 Groundedness" value={sr.regen_groundedness != null ? `${(sr.regen_groundedness * 100).toFixed(0)}%` : '—'} />
          </div>
        ) : (
          <p className="text-wb-40">無詳細 trace 資料（舊記錄）</p>
        )}
      </StageSection>
      <StageSection type="output">
        {!triggered ? (
          <p className="text-wb-50">保留原始生成答案，進入 Judge 評判</p>
        ) : sr ? (
          <div className="flex items-center gap-2">
            <TraceBadge
              text={sr.regen_accepted ? '採用重生成答案' : '保留原始答案（重生成未改善）'}
              color={sr.regen_accepted ? 'emerald' : 'amber'}
            />
          </div>
        ) : (
          <p className="text-wb-40">無詳細資料（舊記錄）</p>
        )}
      </StageSection>
    </IOFlow>
  )
}

function JudgeTrace({ pipelineStage, response }: { pipelineStage: Record<string, unknown> | null; response: string | null }) {
  const groundedness = pipelineStage?.groundedness_score as number | null | undefined
  const quality = pipelineStage?.auto_score as number | null | undefined

  return (
    <IOFlow>
      <StageSection type="input">
        <div className="space-y-1">
          <p className="text-wb-50">AI 回答 + 檢索到的來源文件</p>
          {response && (
            <p className="italic text-wb-60 line-clamp-2">{response}</p>
          )}
        </div>
      </StageSection>
      <StageSection type="decision">
        <div className="space-y-1.5">
          <div>
            <p className="text-wb-40 mb-0.5">Groundedness 計算</p>
            <p className="text-wb-50">逐句比對回答與來源文件的接地性（0–1）</p>
          </div>
          <div>
            <p className="text-wb-40 mb-0.5">Quality 評分</p>
            <p className="text-wb-50">LLM Judge 對回答完整性、相關性進行 1–4 量表評分</p>
          </div>
        </div>
      </StageSection>
      <StageSection type="output">
        <div className="flex flex-wrap gap-4">
          <div>
            <p className="text-wb-40">Groundedness</p>
            {groundedness != null ? (
              <p className={`text-base font-bold tabular-nums mt-0.5 ${groundedness >= 0.7 ? 'text-emerald-600' : groundedness >= 0.5 ? 'text-amber-600' : 'text-red-500'}`}>
                {(groundedness * 100).toFixed(0)}%
              </p>
            ) : (
              <p className="text-wb-40 text-base">—</p>
            )}
          </div>
          <div>
            <p className="text-wb-40">Quality</p>
            {quality != null ? (
              <p className={`text-base font-bold tabular-nums mt-0.5 ${quality >= 3 ? 'text-emerald-600' : quality >= 2 ? 'text-amber-600' : 'text-red-500'}`}>
                {quality} / 4
              </p>
            ) : (
              <p className="text-wb-40 text-base">—</p>
            )}
          </div>
        </div>
      </StageSection>
    </IOFlow>
  )
}

function GuardrailsOutputTrace({ response, pipelineStage }: { response: string | null; pipelineStage: Record<string, unknown> | null }) {
  const go = pipelineStage as {
    original_length?: number
    output_length?: number
    system_prompt_leaked?: boolean
    pii_count?: number
    truncated?: boolean
  } | null

  const hasData = go?.original_length != null

  return (
    <IOFlow>
      <StageSection type="input">
        {response ? (
          <div>
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
  )
}

function MemoryExtractionTrace({ pipelineStage }: { pipelineStage: Record<string, unknown> | null }) {
  const me = pipelineStage as {
    triggered?: boolean
    async?: boolean
    reason?: string
    skipped?: boolean
  } | null

  const triggered = me?.triggered
  const reason = me?.reason

  return (
    <IOFlow>
      <StageSection type="input">
        <div className="space-y-1">
          <p className="text-wb-50">本次對話：查詢 + AI 回答</p>
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
  )
}

function StageTraceDetail({
  stageKey,
  trace,
  query,
  pipelineStage,
  response,
  sources,
}: {
  stageKey: string
  trace: PipelineTrace | null
  query: string
  pipelineStage?: Record<string, unknown> | null
  response: string | null
  sources: Array<{ title?: string; type?: string; score?: number }>
}) {
  if (stageKey === 'guardrails_input') return <GuardrailsInputTrace query={query} pipelineStage={pipelineStage ?? null} />
  if (stageKey === 'cache') return <CacheTrace pipelineStage={pipelineStage ?? null} query={query} />
  if (stageKey === 'quota_check') return <QuotaCheckTrace pipelineStage={pipelineStage ?? null} />
  if (stageKey === 'query_parsing') {
    if (!trace) return <p className="text-[11px] text-wb-40">無詳細資料（舊記錄）</p>
    return <QueryParsingTrace trace={trace} query={query} />
  }
  if (stageKey === 'hyde') return <HydeTrace trace={trace} pipelineStage={pipelineStage} />
  if (stageKey === 'multi_query') {
    if (!trace) return <p className="text-[11px] text-wb-40">無詳細資料（舊記錄）</p>
    return <MultiQueryTrace trace={trace} />
  }
  if (stageKey === 'embedding') return <EmbeddingTrace trace={trace} pipelineStage={pipelineStage ?? null} />
  if (stageKey === 'retrieval') {
    if (!trace) return <p className="text-[11px] text-wb-40">無詳細資料（舊記錄）</p>
    return <RetrievalTrace trace={trace} pipelineStage={pipelineStage ?? null} sources={sources} />
  }
  if (stageKey === 'generation') {
    if (!trace) return <p className="text-[11px] text-wb-40">無詳細資料（舊記錄）</p>
    return <GenerationTrace trace={trace} pipelineStage={pipelineStage ?? null} query={query} response={response} />
  }
  if (stageKey === 'self_reflection') return <SelfReflectionTrace trace={trace} pipelineStage={pipelineStage ?? null} />
  if (stageKey === 'judge') return <JudgeTrace pipelineStage={pipelineStage ?? null} response={response} />
  if (stageKey === 'guardrails_output') return <GuardrailsOutputTrace response={response} pipelineStage={pipelineStage ?? null} />
  if (stageKey === 'memory_extraction') return <MemoryExtractionTrace pipelineStage={pipelineStage ?? null} />
  return <p className="text-[11px] text-wb-40">此階段無額外詳細資料</p>
}

// =============================================
// Pipeline Timeline（支援 trace 展開）
// =============================================

type PipelineKey = keyof AILogDetail['pipeline']

function PipelineTimeline({
  pipeline,
  pipelineTrace,
  query,
  response,
  sources,
}: {
  pipeline: AILogDetail['pipeline']
  pipelineTrace: AILogDetail['pipeline_trace']
  query: string
  response: string | null
  sources: Array<{ title?: string; type?: string; score?: number }>
}) {
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set())

  const toggleStage = (key: string) => {
    setExpandedStages((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const pipelineStages: PipelineKey[] = [
    'guardrails_input',
    'cache',
    'quota_check',
    'query_parsing',
    'hyde',
    'embedding',
    'retrieval',
    'generation',
    'self_reflection',
    'judge',
    'guardrails_output',
    'memory_extraction',
  ]

  // multi_query 插在 hyde 後（純 trace，不在 pipeline 物件中）
  type StageEntry = { key: string; isTraceOnly: boolean }
  const stages: StageEntry[] = []
  for (const key of pipelineStages) {
    stages.push({ key, isTraceOnly: false })
    if (key === 'hyde') {
      if (pipelineTrace?.multi_query) {
        stages.push({ key: 'multi_query', isTraceOnly: true })
      }
    }
  }

  return (
    <div className="rounded-xl border border-wb-20 bg-white p-5">
      <h2 className="mb-1 text-sm font-semibold text-wb-100">RAG Pipeline 流程</h2>
      <p className="mb-4 text-[11px] text-wb-40">點擊各階段展開 Input → Decision → Output 詳情</p>
      <div className="space-y-0">
        {stages.map(({ key, isTraceOnly }, idx) => {
          const pipelineStage = isTraceOnly ? null : (pipeline[key as PipelineKey] as unknown as Record<string, unknown>)
          const skipped = isTraceOnly ? false : Boolean(pipelineStage?.skipped)
          const isLast = idx === stages.length - 1
          const isExpanded = expandedStages.has(key)
          const canExpand = !skipped

          // Determine status badge
          let status: 'ran' | 'skipped' | 'hit' | 'triggered' | 'not-triggered' = 'ran'
          if (skipped) status = 'skipped'
          else if (key === 'cache' && pipelineStage && 'hit' in pipelineStage) status = pipelineStage.hit ? 'hit' : 'ran'
          else if ((key === 'hyde' || key === 'self_reflection') && pipelineStage && 'triggered' in pipelineStage)
            status = pipelineStage.triggered ? 'triggered' : 'not-triggered'
          else if (isTraceOnly) status = 'ran'

          // Build metrics pills
          const metrics: { label: string; value: string; highlight?: boolean }[] = []

          if (!skipped && pipelineStage) {
            if (key === 'query_parsing' && pipelineStage.query_type) {
              const qmap: Record<string, string> = { simple: '簡單', complex: '複雜', 'general-knowledge': '通識' }
              metrics.push({ label: '類型', value: qmap[pipelineStage.query_type as string] ?? String(pipelineStage.query_type) })
            }
            if ((key === 'embedding' || key === 'retrieval' || key === 'generation') && pipelineStage.duration_ms != null) {
              metrics.push({ label: '耗時', value: `${pipelineStage.duration_ms} ms` })
            }
            if (key === 'retrieval') {
              if (pipelineStage.top_score != null) metrics.push({ label: '最高分', value: `${((pipelineStage.top_score as number) * 100).toFixed(1)}%` })
              if (pipelineStage.doc_count != null) metrics.push({ label: '文件', value: `${pipelineStage.doc_count} 筆` })
            }
            if (key === 'generation') {
              if (pipelineStage.model) metrics.push({ label: '模型', value: String(pipelineStage.model).split('/').pop() ?? '' })
              if (pipelineStage.token_count != null) metrics.push({ label: 'Tokens', value: String(pipelineStage.token_count) })
              if (pipelineStage.is_high_consumption) metrics.push({ label: '高消耗', value: '!', highlight: true })
            }
            if (key === 'judge') {
              if (pipelineStage.groundedness_score != null)
                metrics.push({ label: 'Groundedness', value: `${((pipelineStage.groundedness_score as number) * 100).toFixed(0)}%` })
              if (pipelineStage.auto_score != null)
                metrics.push({ label: 'Auto', value: `${pipelineStage.auto_score} / 4` })
            }
          }
          if (isTraceOnly && key === 'multi_query' && pipelineTrace?.multi_query) {
            metrics.push({ label: '子查詢', value: `${pipelineTrace.multi_query.queries.length} 條` })
          }

          return (
            <div key={`${key}-${idx}`} className="flex gap-3">
              {/* Timeline connector */}
              <div className="flex flex-col items-center">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 mt-2 ${
                  skipped
                    ? 'border-wb-15 bg-wb-5'
                    : key === 'cache' && pipelineStage?.hit
                      ? 'border-sky-300 bg-sky-50'
                      : 'border-wb-30 bg-white'
                }`}>
                  <StageIcon name={key} skipped={skipped} />
                </div>
                {!isLast && (
                  <div className={`w-px flex-1 my-1 ${skipped ? 'bg-wb-10' : 'bg-wb-20'}`} style={{ minHeight: 16 }} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-4 pt-1.5">
                <div
                  className={`flex flex-wrap items-center gap-2 ${canExpand ? 'cursor-pointer' : ''}`}
                  onClick={() => canExpand && toggleStage(key)}
                >
                  <span className={`text-sm font-medium ${skipped ? 'text-wb-40' : 'text-wb-90'}`}>
                    {STAGE_LABELS[key] ?? key}
                  </span>
                  <StatusBadge status={status} />
                  {metrics.map((m) => (
                    <span
                      key={m.label}
                      className={`rounded border px-1.5 py-0.5 text-[11px] tabular-nums ${
                        m.highlight
                          ? 'border-red-200 bg-red-50 text-red-600'
                          : 'border-wb-15 bg-wb-5 text-wb-60'
                      }`}
                    >
                      {m.label}: {m.value}
                    </span>
                  ))}
                  {canExpand && (
                    <span className="ml-auto text-wb-40">
                      {isExpanded
                        ? <ChevronDown className="h-3.5 w-3.5" />
                        : <ChevronRight className="h-3.5 w-3.5" />
                      }
                    </span>
                  )}
                </div>
                {!isTraceOnly && !!pipelineStage?.service && (
                  <p className={`mt-0.5 text-[11px] font-mono ${skipped ? 'text-wb-30' : 'text-wb-50'}`}>
                    {pipelineStage.service as string}
                  </p>
                )}
                {/* Trace 展開詳情 */}
                {canExpand && isExpanded && (
                  <div className="mt-2 rounded-lg border border-wb-10 bg-wb-3 px-3 py-3">
                    <StageTraceDetail
                      stageKey={key}
                      trace={pipelineTrace}
                      query={query}
                      pipelineStage={pipelineStage as Record<string, unknown> | null}
                      response={response}
                      sources={sources}
                    />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LatencyBreakdown({ latency }: { latency: AILogDetail['latency'] }) {
  const { total_ms, embedding_ms, retrieval_ms, generation_ms } = latency
  if (total_ms == null) return null

  const other =
    total_ms - (embedding_ms ?? 0) - (retrieval_ms ?? 0) - (generation_ms ?? 0)

  const bars: { label: string; ms: number | null; color: string }[] = [
    { label: '嵌入', ms: embedding_ms, color: 'bg-blue-400' },
    { label: '檢索', ms: retrieval_ms, color: 'bg-purple-400' },
    { label: '生成', ms: generation_ms, color: 'bg-emerald-400' },
    { label: '其他', ms: other > 0 ? other : null, color: 'bg-wb-30' },
  ]

  return (
    <div className="rounded-xl border border-wb-20 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-wb-100">延遲分解</h2>
      <div className="mb-3 flex h-4 w-full overflow-hidden rounded-full bg-wb-10">
        {bars.map(({ label, ms, color }) =>
          ms && ms > 0 ? (
            <div
              key={label}
              className={`${color} transition-all`}
              style={{ width: `${(ms / total_ms) * 100}%` }}
              title={`${label}: ${ms} ms`}
            />
          ) : null
        )}
      </div>
      <div className="flex flex-wrap gap-4">
        {bars.map(({ label, ms, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`h-2.5 w-2.5 rounded-sm ${color}`} />
            <span className="text-xs text-wb-60">{label}</span>
            <span className="text-xs font-medium tabular-nums text-wb-80">{ms != null && ms > 0 ? `${ms} ms` : '—'}</span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-wb-50" />
          <span className="text-xs text-wb-60">總計</span>
          <span className="text-xs font-semibold tabular-nums text-wb-100">{total_ms} ms</span>
        </div>
      </div>
    </div>
  )
}

function QualitySection({ quality }: { quality: AILogDetail['quality'] }) {
  const { groundedness_score, auto_score, feedback_score, feedback_text, flags } = quality

  return (
    <div className="rounded-xl border border-wb-20 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-wb-100">品質評估</h2>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-[11px] text-wb-50 mb-1">Groundedness</p>
          {groundedness_score != null ? (
            <p className={`text-lg font-bold tabular-nums ${groundedness_score >= 0.7 ? 'text-emerald-600' : groundedness_score >= 0.5 ? 'text-yellow-600' : 'text-red-500'}`}>
              {(groundedness_score * 100).toFixed(0)}%
            </p>
          ) : (
            <p className="text-wb-40 text-lg">—</p>
          )}
        </div>
        <div className="text-center border-x border-wb-10">
          <p className="text-[11px] text-wb-50 mb-1">Auto 評分</p>
          {auto_score != null ? (
            <p className={`text-lg font-bold tabular-nums ${auto_score >= 3 ? 'text-emerald-600' : auto_score >= 2 ? 'text-yellow-600' : 'text-red-500'}`}>
              {auto_score} / 4
            </p>
          ) : (
            <p className="text-wb-40 text-lg">—</p>
          )}
        </div>
        <div className="text-center">
          <p className="text-[11px] text-wb-50 mb-1">使用者回饋</p>
          {feedback_score != null ? (
            <p className={`text-lg font-bold tabular-nums ${feedback_score >= 4 ? 'text-emerald-600' : feedback_score >= 3 ? 'text-yellow-600' : 'text-red-500'}`}>
              {feedback_score} / 5
            </p>
          ) : (
            <p className="text-wb-40 text-lg">—</p>
          )}
        </div>
      </div>

      {feedback_text && (
        <div className="mb-3 rounded-lg bg-wb-5 px-4 py-3">
          <p className="text-xs text-wb-50 mb-1">回饋文字</p>
          <p className="text-sm text-wb-80">{feedback_text}</p>
        </div>
      )}

      {(flags?.length ?? 0) > 0 && (
        <div className="space-y-1.5">
          {flags.map((f, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
              <div>
                <span className="text-xs font-medium text-amber-700">{f.type}</span>
                <p className="text-xs text-amber-600">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {(flags?.length ?? 0) === 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-xs text-emerald-700">無品質告警</span>
        </div>
      )}
    </div>
  )
}

// =============================================
// Main Page
// =============================================

export default function AdminAILogDetailPage({ params }: { params: Promise<{ logId: string }> }) {
  const { logId } = use(params)
  const { data: log, isLoading, error } = useAILogDetail(logId)

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-wb-50" />
      </div>
    )
  }

  if (error || !log) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
        找不到此日誌記錄
      </div>
    )
  }

  const isCacheHit = log.pipeline?.cache?.hit
  const sources = Array.isArray(log.sources) ? log.sources : []

  return (
    <div className="space-y-6 max-w-3xl">
      {/* 麵包屑 */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/ai/logs"
          className="flex items-center gap-1 text-sm text-wb-70 hover:text-wb-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          返回日誌
        </Link>
        <span className="text-wb-30">/</span>
        <span className="text-sm text-wb-100 font-medium">日誌詳情</span>
        {isCacheHit && (
          <span className="rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-600">
            快取命中
          </span>
        )}
      </div>

      {/* 頂部統計 */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-wb-20 bg-white p-4 flex items-center gap-3">
          <User className="h-5 w-5 text-wb-50" />
          <div className="min-w-0">
            <p className="text-xs text-wb-50">使用者</p>
            {log.user?.id ? (
              <p className="font-medium text-wb-100 truncate" title={log.user.username ?? undefined}>
                {log.user.display_name || log.user.username}
              </p>
            ) : (
              <p className="text-sm text-wb-40">匿名</p>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-wb-20 bg-white p-4 flex items-center gap-3">
          <Clock className="h-5 w-5 text-wb-50" />
          <div>
            <p className="text-xs text-wb-50">總延遲</p>
            <p className="font-semibold text-wb-100">
              {log.latency?.total_ms != null ? `${log.latency.total_ms} ms` : '—'}
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-wb-20 bg-white p-4 flex items-center gap-3">
          <ThumbsUp className="h-5 w-5 text-wb-50" />
          <div>
            <p className="text-xs text-wb-50">時間</p>
            <p className="text-sm font-medium text-wb-100">{new Date(log.created_at).toLocaleString('zh-TW')}</p>
          </div>
        </div>
      </div>

      {/* 查詢內容 */}
      <div className="rounded-xl border border-wb-20 bg-white p-5">
        <h2 className="mb-2 text-sm font-semibold text-wb-100">使用者查詢</h2>
        <p className="text-sm text-wb-80 leading-relaxed">{log.query}</p>
      </div>

      {/* Pipeline 流程 */}
      {log.pipeline && (
        <PipelineTimeline
          pipeline={log.pipeline}
          pipelineTrace={log.pipeline_trace}
          query={log.query}
          response={log.response}
          sources={sources}
        />
      )}

      {/* 延遲分解 */}
      {!isCacheHit && log.latency && <LatencyBreakdown latency={log.latency} />}

      {/* 品質評估 */}
      {log.quality && <QualitySection quality={log.quality} />}

      {/* AI 回應 */}
      {log.response && (
        <div className="rounded-xl border border-wb-20 bg-white p-5">
          <h2 className="mb-2 text-sm font-semibold text-wb-100">AI 回答</h2>
          <p className="text-sm text-wb-80 leading-relaxed whitespace-pre-wrap">{log.response}</p>
        </div>
      )}

      {/* 來源 */}
      {sources.length > 0 && (
        <div className="rounded-xl border border-wb-20 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-wb-100">參考來源（{sources.length}）</h2>
          <div className="divide-y divide-wb-10">
            {sources.map((s, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 text-sm">
                <span className="shrink-0 rounded-md border border-wb-20 px-1.5 py-0.5 text-[10px] text-wb-60">
                  {s.type}
                </span>
                <span className="flex-1 text-wb-80">{s.title}</span>
                {s.score != null && (
                  <span className="text-xs text-wb-50">{(s.score * 100).toFixed(1)}%</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-wb-40">ID: {log.id}</p>
    </div>
  )
}
