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
// Trace 詳情區塊
// =============================================

type PipelineTrace = NonNullable<AILogDetail['pipeline_trace']>

function TraceKV({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="shrink-0 text-[11px] text-wb-50 w-20">{label}</span>
      <span className="text-[11px] text-wb-80 font-mono break-all">{value}</span>
    </div>
  )
}

function TraceBadge({ text, color = 'default' }: { text: string; color?: 'default' | 'blue' | 'violet' | 'emerald' | 'amber' }) {
  const colors = {
    default: 'border-wb-15 bg-wb-5 text-wb-60',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    violet: 'border-violet-200 bg-violet-50 text-violet-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
  }
  return (
    <span className={`rounded border px-1.5 py-0.5 text-[11px] font-medium ${colors[color]}`}>
      {text}
    </span>
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
  if (!qp && !f) return <p className="text-[11px] text-wb-40">無詳細資料（舊記錄）</p>

  const toolColors: Record<string, 'blue' | 'violet' | 'emerald'> = {
    search_routes: 'blue',
    search_crags: 'violet',
    general_knowledge: 'emerald',
  }
  const alternatives = qp?.alternatives ?? ['search_routes', 'search_crags', 'general_knowledge']

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[11px] font-medium text-wb-60 mb-1">Input</p>
        <p className="text-xs text-wb-80 bg-wb-5 rounded px-2 py-1.5 italic">{query}</p>
      </div>
      {qp && (
        <>
          <div>
            <p className="text-[11px] font-medium text-wb-60 mb-1.5">工具選擇</p>
            <div className="flex flex-wrap gap-1.5">
              {alternatives.map((alt) => (
                <TraceBadge
                  key={alt}
                  text={alt === qp.tool ? `✓ ${alt}` : alt}
                  color={alt === qp.tool ? toolColors[alt] ?? 'blue' : 'default'}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-medium text-wb-60 mb-1.5">查詢類型</p>
            <TraceBadge
              text={qp.query_type}
              color={qp.query_type === 'complex' ? 'violet' : qp.query_type === 'simple' ? 'blue' : 'emerald'}
            />
          </div>
          {Object.keys(qp.params).length > 0 && (
            <div>
              <p className="text-[11px] font-medium text-wb-60 mb-1">LLM 抽取 Params</p>
              <div className="bg-wb-5 rounded px-2 py-1.5 space-y-1">
                {Object.entries(qp.params).map(([k, v]) => (
                  <TraceKV key={k} label={k} value={JSON.stringify(v)} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
      {f && (
        <div>
          <p className="text-[11px] font-medium text-wb-60 mb-1">
            Filter 來源：<TraceBadge text={f.source} color={f.source === 'llm_parsed' ? 'emerald' : f.source === 'sim_route' ? 'blue' : 'amber'} />
          </p>
          <pre className="text-[11px] font-mono text-wb-70 bg-wb-5 rounded px-2 py-1.5 overflow-auto max-h-24">
            {JSON.stringify(f.applied, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

function HydeTrace({ trace, pipelineStage }: { trace: PipelineTrace | null; pipelineStage?: Record<string, unknown> | null }) {
  const h = trace?.hyde
  const triggered = pipelineStage?.triggered as boolean | undefined
  if (!h) {
    if (triggered === false) {
      return (
        <div className="space-y-2">
          <p className="text-[11px] text-wb-50">此查詢未觸發 HyDE，可能原因：</p>
          <ul className="space-y-1.5">
            <li className="flex items-center gap-2">
              <TraceBadge text="simple 查詢" color="blue" />
              <span className="text-[11px] text-wb-60">簡單查詢不需要假設性文件擴展</span>
            </li>
            <li className="flex items-center gap-2">
              <TraceBadge text="general-knowledge" color="emerald" />
              <span className="text-[11px] text-wb-60">通識型查詢不依賴向量檢索</span>
            </li>
          </ul>
        </div>
      )
    }
    return <p className="text-[11px] text-wb-40">無詳細資料（舊記錄）</p>
  }
  return (
    <div>
      <p className="text-[11px] font-medium text-wb-60 mb-1">假設性文件（前 300 字）</p>
      <pre className="text-[11px] font-mono text-wb-70 bg-wb-5 rounded px-2 py-1.5 whitespace-pre-wrap leading-relaxed max-h-40 overflow-auto">
        {h.document}
      </pre>
    </div>
  )
}

function MultiQueryTrace({ trace }: { trace: PipelineTrace }) {
  const mq = trace.multi_query
  if (!mq) return <p className="text-[11px] text-wb-40">無詳細資料（舊記錄）</p>
  return (
    <div>
      <p className="text-[11px] font-medium text-wb-60 mb-1.5">擴展子查詢（{mq.queries.length} 條）</p>
      <ol className="space-y-1">
        {mq.queries.map((q, i) => (
          <li key={i} className="flex gap-2 text-xs">
            <span className="shrink-0 text-wb-40 tabular-nums">{i + 1}.</span>
            <span className="text-wb-80">{q}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function RetrievalTrace({ trace }: { trace: PipelineTrace }) {
  const r = trace.retrieval
  if (!r) return <p className="text-[11px] text-wb-40">無詳細資料（舊記錄）</p>
  return (
    <div className="space-y-3">
      <div>
        <p className="text-[11px] font-medium text-wb-60 mb-1.5">搜尋路徑</p>
        <div className="flex flex-wrap gap-1.5">
          {r.paths.map((p) => (
            <TraceBadge
              key={p}
              text={p}
              color={p === 'query_vec' ? 'blue' : p === 'hyde_vec' ? 'violet' : p === 'bm25' ? 'emerald' : 'default'}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-4">
        <div>
          <p className="text-[11px] text-wb-50">RRF 候選（前）</p>
          <p className="text-sm font-semibold tabular-nums text-wb-80">{r.candidates_before_filter}</p>
        </div>
        <div>
          <p className="text-[11px] text-wb-50">過濾後存活</p>
          <p className="text-sm font-semibold tabular-nums text-wb-80">{r.candidates_after_filter}</p>
        </div>
        <div>
          <p className="text-[11px] text-wb-50">CRAG Fallback</p>
          {r.crag_fallback
            ? <TraceBadge text="已觸發" color="amber" />
            : <p className="text-[11px] text-wb-40">否</p>
          }
        </div>
      </div>
    </div>
  )
}

function GenerationTrace({ trace }: { trace: PipelineTrace }) {
  const g = trace.generation
  if (!g) return <p className="text-[11px] text-wb-40">無詳細資料（舊記錄）</p>
  return (
    <div className="flex flex-wrap gap-4">
      <div>
        <p className="text-[11px] text-wb-50">Context 文件數</p>
        <p className="text-sm font-semibold tabular-nums text-wb-80">{g.context_doc_count}</p>
      </div>
      <div>
        <p className="text-[11px] text-wb-50">個人化</p>
        <TraceBadge text={g.personalized ? '是' : '否'} color={g.personalized ? 'emerald' : 'default'} />
      </div>
      <div>
        <p className="text-[11px] text-wb-50">重生成</p>
        <TraceBadge text={g.regen_triggered ? '已觸發' : '否'} color={g.regen_triggered ? 'violet' : 'default'} />
      </div>
    </div>
  )
}

function GuardrailsInputTrace() {
  const checks = [
    { label: 'Prompt Injection', desc: '偵測並攔截嘗試覆寫系統提示的惡意輸入' },
    { label: 'Jailbreak', desc: '偵測並攔截繞過安全限制的提示詞' },
    { label: '封鎖詞過濾', desc: '比對封鎖詞清單，攔截不允許的查詢內容' },
  ]
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium text-wb-60 mb-1.5">執行的防護項目</p>
      {checks.map((c) => (
        <div key={c.label} className="flex items-start gap-2">
          <TraceBadge text={c.label} color="emerald" />
          <span className="text-[11px] text-wb-60">{c.desc}</span>
        </div>
      ))}
    </div>
  )
}

function CacheTrace({ pipelineStage }: { pipelineStage: Record<string, unknown> | null }) {
  const hit = pipelineStage?.hit as boolean | undefined
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-wb-50">KV 快取狀態：</span>
        {hit === true ? <TraceBadge text="命中" color="blue" /> : <TraceBadge text="未命中" color="default" />}
      </div>
      <p className="text-[11px] text-wb-50">Cache Key 由以下組成：</p>
      <ul className="space-y-0.5 text-[11px] text-wb-60 list-disc list-inside">
        <li>正規化後的查詢文字（lowercased + 去頭尾空白）</li>
        <li>對話歷史深度（chat_history_depth 設定值）</li>
        <li>用戶 ID（匿名查詢排除）</li>
      </ul>
    </div>
  )
}

function QuotaCheckTrace() {
  return (
    <div className="space-y-1.5 text-[11px] text-wb-60">
      <p>依用戶等級（foothill / wall / ridge / summit）原子扣除一次配額。</p>
      <p>配額採 D1 原子 UPDATE，確保並發請求不重複計算。</p>
    </div>
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
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4">
        <div>
          <p className="text-[11px] text-wb-50">嵌入模型</p>
          <p className="text-xs font-mono text-wb-80">@cf/baai/bge-m3</p>
        </div>
        {durationMs != null && (
          <div>
            <p className="text-[11px] text-wb-50">耗時</p>
            <p className="text-sm font-semibold tabular-nums text-wb-80">{durationMs} ms</p>
          </div>
        )}
      </div>
      {e ? (
        <div>
          <p className="text-[11px] font-medium text-wb-60 mb-1.5">嵌入向量種類</p>
          <div className="flex flex-wrap gap-1.5">
            <TraceBadge text={e.early_vector_reused ? 'query（復用）' : 'query'} color="blue" />
            {e.hyde_embedded && <TraceBadge text="HyDE 文件" color="violet" />}
            {e.expanded_count > 0 && <TraceBadge text={`擴展查詢 ×${e.expanded_count}`} color="amber" />}
          </div>
        </div>
      ) : (
        <p className="text-[11px] text-wb-40">無詳細 trace 資料（舊記錄）</p>
      )}
    </div>
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
  if (!triggered) {
    return (
      <div className="space-y-1.5 text-[11px] text-wb-50">
        <p>此次查詢未觸發 Judge 驅動重生成，可能原因：</p>
        <ul className="list-disc list-inside space-y-0.5 text-wb-60">
          <li>查詢類型非 complex（simple / general-knowledge 不觸發）</li>
          <li>初次 Judge quality 分已高於門檻（judge_regen_quality_max）</li>
          <li>回答長度過短（低於 self_reflection_min_length）</li>
        </ul>
      </div>
    )
  }
  if (!sr) return <p className="text-[11px] text-wb-40">無詳細 trace 資料（舊記錄）</p>
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded border border-wb-10 bg-wb-5 px-3 py-2">
          <p className="text-[11px] text-wb-50 mb-1.5">原始 Judge 結果</p>
          <div className="flex gap-4">
            <div>
              <p className="text-[10px] text-wb-40">Quality</p>
              <p className="text-sm font-semibold tabular-nums text-wb-80">
                {sr.original_quality != null ? `${sr.original_quality} / 4` : '—'}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-wb-40">Groundedness</p>
              <p className="text-sm font-semibold tabular-nums text-wb-80">
                {sr.original_groundedness != null ? `${(sr.original_groundedness * 100).toFixed(0)}%` : '—'}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded border border-wb-10 bg-wb-5 px-3 py-2">
          <p className="text-[11px] text-wb-50 mb-1.5">重生成 Judge 結果</p>
          <div className="flex gap-4">
            <div>
              <p className="text-[10px] text-wb-40">Quality</p>
              <p className="text-sm font-semibold tabular-nums text-wb-80">
                {sr.regen_quality != null ? `${sr.regen_quality} / 4` : '—'}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-wb-40">Groundedness</p>
              <p className="text-sm font-semibold tabular-nums text-wb-80">
                {sr.regen_groundedness != null ? `${(sr.regen_groundedness * 100).toFixed(0)}%` : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-wb-50">採用結果：</span>
        <TraceBadge
          text={sr.regen_accepted ? '採用重生成答案' : '保留原始答案'}
          color={sr.regen_accepted ? 'emerald' : 'amber'}
        />
      </div>
    </div>
  )
}

function JudgeTrace({ pipelineStage }: { pipelineStage: Record<string, unknown> | null }) {
  const groundedness = pipelineStage?.groundedness_score as number | null | undefined
  const quality = pipelineStage?.auto_score as number | null | undefined
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-6">
        <div>
          <p className="text-[11px] text-wb-50">Groundedness</p>
          {groundedness != null ? (
            <p className={`text-lg font-bold tabular-nums ${groundedness >= 0.7 ? 'text-emerald-600' : groundedness >= 0.5 ? 'text-amber-600' : 'text-red-500'}`}>
              {(groundedness * 100).toFixed(0)}%
            </p>
          ) : (
            <p className="text-wb-40 text-lg">—</p>
          )}
          <p className="text-[10px] text-wb-40">回答與來源的接地性（0–1）</p>
        </div>
        <div>
          <p className="text-[11px] text-wb-50">Quality</p>
          {quality != null ? (
            <p className={`text-lg font-bold tabular-nums ${quality >= 3 ? 'text-emerald-600' : quality >= 2 ? 'text-amber-600' : 'text-red-500'}`}>
              {quality} / 4
            </p>
          ) : (
            <p className="text-wb-40 text-lg">—</p>
          )}
          <p className="text-[10px] text-wb-40">整體回答品質（1–4 量表）</p>
        </div>
      </div>
    </div>
  )
}

function GuardrailsOutputTrace() {
  const checks = [
    { label: 'System Prompt Leakage', desc: '偵測並移除系統提示詞洩漏的片段' },
    { label: 'PII 過濾', desc: '移除可識別個人身分的資訊（電話、Email 等）' },
    { label: '過長截斷', desc: '超過最大回應長度時截斷輸出，避免 token 浪費' },
  ]
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium text-wb-60 mb-1.5">執行的輸出過濾項目</p>
      {checks.map((c) => (
        <div key={c.label} className="flex items-start gap-2">
          <TraceBadge text={c.label} color="emerald" />
          <span className="text-[11px] text-wb-60">{c.desc}</span>
        </div>
      ))}
    </div>
  )
}

function MemoryExtractionTrace() {
  return (
    <div className="space-y-1.5 text-[11px] text-wb-60">
      <p>記憶萃取以非同步方式執行，不影響主要回應延遲。</p>
      <p>
        使用 Cloudflare Workers 的{' '}
        <code className="rounded bg-wb-10 px-1 text-wb-80 font-mono">ctx.waitUntil()</code>{' '}
        API，允許 Worker 在回應送出後繼續執行後台任務。
      </p>
      <p>萃取出的記憶存入 D1，供後續查詢的個人化上下文使用。</p>
    </div>
  )
}

function StageTraceDetail({
  stageKey,
  trace,
  query,
  pipelineStage,
}: {
  stageKey: string
  trace: PipelineTrace | null
  query: string
  pipelineStage?: Record<string, unknown> | null
}) {
  if (stageKey === 'guardrails_input') return <GuardrailsInputTrace />
  if (stageKey === 'cache') return <CacheTrace pipelineStage={pipelineStage ?? null} />
  if (stageKey === 'quota_check') return <QuotaCheckTrace />
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
    return <RetrievalTrace trace={trace} />
  }
  if (stageKey === 'generation') {
    if (!trace) return <p className="text-[11px] text-wb-40">無詳細資料（舊記錄）</p>
    return <GenerationTrace trace={trace} />
  }
  if (stageKey === 'self_reflection') return <SelfReflectionTrace trace={trace} pipelineStage={pipelineStage ?? null} />
  if (stageKey === 'judge') return <JudgeTrace pipelineStage={pipelineStage ?? null} />
  if (stageKey === 'guardrails_output') return <GuardrailsOutputTrace />
  if (stageKey === 'memory_extraction') return <MemoryExtractionTrace />
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
}: {
  pipeline: AILogDetail['pipeline']
  pipelineTrace: AILogDetail['pipeline_trace']
  query: string
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
      // 只有 trace 有 multi_query 資料時才顯示
      if (pipelineTrace?.multi_query) {
        stages.push({ key: 'multi_query', isTraceOnly: true })
      }
    }
  }

  return (
    <div className="rounded-xl border border-wb-20 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-wb-100">RAG Pipeline 流程</h2>
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
              <div className={`flex-1 pb-4 pt-1.5`}>
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
                  <div className="mt-2 rounded-lg border border-wb-10 bg-wb-3 px-3 py-2.5">
                    <StageTraceDetail
                      stageKey={key}
                      trace={pipelineTrace}
                      query={query}
                      pipelineStage={pipelineStage as Record<string, unknown> | null}
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
