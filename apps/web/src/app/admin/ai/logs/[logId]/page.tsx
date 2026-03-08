'use client'

import { use, useState, useMemo } from 'react'
import { formatTaipei } from '@/lib/utils'
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
  Bot,
  Filter,
  Layers,
  ChevronUp,
  GitMerge,
  RotateCcw,
  ArrowUpDown,
} from 'lucide-react'
import { useAILogDetail, useAIConfig, DEFAULT_COST_PROVIDERS, type AILogDetail, type CostProvider } from '@/lib/api/admin-ai'
import { MarkdownContent } from '@/components/ai/ChatMessage'

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
    agentic: <Bot className={cls} />,
    filter: <Filter className={cls} />,
    embedding: <Cpu className={cls} />,
    retrieval: <Search className={cls} />,
    rrf_fusion: <GitMerge className={cls} />,
    crag_fallback: <RotateCcw className={cls} />,
    reranking: <ArrowUpDown className={cls} />,
    mmr_selection: <Layers className={cls} />,
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
  cache: 'KV / 語義快取',
  quota_check: '配額檢查',
  query_parsing: 'Adaptive Routing',
  hyde: 'HyDE 假設文件',
  multi_query: 'Multi-Query 擴展',
  agentic: 'Agentic 多步驟 RAG',
  filter: 'Metadata Filter 建構',
  embedding: '向量嵌入',
  retrieval: '多路向量搜尋 + BM25',
  rrf_fusion: 'RRF 合併（Reciprocal Rank Fusion）',
  crag_fallback: 'CRAG 放寬回退',
  reranking: 'Cross-encoder Reranking',
  mmr_selection: 'MMR + 熱門度加權',
  generation: 'LLM 生成回答',
  self_reflection: 'Judge 驅動重生成',
  judge: 'LLM Judge 品質評估',
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

function StageDesc({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] text-wb-50 leading-relaxed border-b border-wb-8 pb-2 mb-2">{children}</p>
  )
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
    <div>
      <StageDesc>查詢進入 Pipeline 的第一道安全關卡。對用戶輸入執行多重安全檢查，防範 Prompt Injection、越獄攻擊（Jailbreak）與無效輸入，確保後續 Pipeline 只處理合法請求。任一檢查觸發即立即攔截，不進入後續流程。</StageDesc>
    <IOFlow>
      <StageSection type="input">
        <KVRow label="觸發條件" value="所有查詢強制執行（無條件觸發，任一檢查失敗即攔截）" />
        <p className="font-mono text-xs text-wb-80 bg-wb-5 rounded px-2 py-1.5 break-all mt-1">{query}</p>
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
    </div>
  )
}

function CacheTrace({ pipelineStage, query, pipelineTrace }: { pipelineStage: Record<string, unknown> | null; query: string; pipelineTrace: PipelineTrace | null }) {
  const hit = pipelineStage?.hit as boolean | undefined
  const cacheType = (pipelineTrace?.cache as { type?: string } | undefined)?.type
  return (
    <div>
      <StageDesc>在執行完整 RAG Pipeline 之前先查詢快取，避免相同查詢重複運算。支援兩種命中模式：KV 精確快取（完全相同的查詢鍵）與語義相似度快取（向量餘弦相似度超過閾值的近似查詢）。命中時直接回傳結果，跳過後續所有 Pipeline 階段。</StageDesc>
    <IOFlow>
      <StageSection type="input">
        <KVRow label="觸發命中條件" value="KV 精確命中：Cache Key 完全相符 ／ 語義命中：向量餘弦相似度 ≥ 閾值" />
        <KVRow label="正規化查詢" value={<span className="italic">{query}</span>} />
        <KVRow label="Cache Key 組成" value="normalized query + chat_history_depth + user_id" />
      </StageSection>
      <StageSection type="decision">
        <div className="flex items-center gap-2">
          <span className="text-wb-50">KV 快取查詢：</span>
          {hit === true
            ? <TraceBadge text="命中 (HIT)" color="blue" />
            : <TraceBadge text="未命中 (MISS)" color="default" />}
          {hit === true && cacheType === 'kv' && <TraceBadge text="KV 精確命中" color="blue" />}
          {hit === true && cacheType === 'semantic' && <TraceBadge text="語義相似命中（向量）" color="violet" />}
        </div>
      </StageSection>
      <StageSection type="output">
        {hit === true ? (
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-sky-500 shrink-0" />
            <span>
              {cacheType === 'kv'
                ? '直接回傳精確快取，跳過剩餘 Pipeline'
                : cacheType === 'semantic'
                  ? '向量相似度命中語義快取，跳過剩餘 Pipeline'
                  : '直接回傳快取結果，跳過剩餘 Pipeline'}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <ArrowRight className="h-3.5 w-3.5 text-wb-40 shrink-0" />
            <span>快取未命中，繼續執行後續 Pipeline 階段</span>
          </div>
        )}
      </StageSection>
    </IOFlow>
    </div>
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
    <div>
      <StageDesc>依據用戶的 Climber Rank 等級確認今日剩餘 AI 查詢次數。使用原子性 SQL UPDATE 扣除配額（WHERE used &lt; limit），防止並發請求超額。配額用盡回傳 429；管理員帳號無限制直接通過。每日午夜 UTC 自動重置。</StageDesc>
    <IOFlow>
      <StageSection type="input">
        <div className="space-y-1">
          <KVRow label="觸發條件" value="所有非快取查詢強制執行；管理員帳號直接 bypass；配額耗盡回傳 429" />
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
    </div>
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
    <div>
      <StageDesc>使用 LLM 分析查詢意圖，決定呼叫哪個搜尋工具（路線搜尋 / 岩場搜尋 / 通識問答），同時抽取結構化過濾條件（地區、難度、路線類型等）。是後續 Metadata Filter 建構與搜尋策略（HyDE、Multi-Query、Agentic）選擇的依據。</StageDesc>
    <IOFlow>
      <StageSection type="input">
        <KVRow label="觸發條件" value="所有非快取查詢必經；輸出 tool / query_type / params 決定後續 Pipeline 路徑" />
        <p className="italic text-wb-60 line-clamp-2 mt-1">{query}</p>
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
            {f?.history_supplemented && (
              <div className="flex items-center gap-2 mt-1">
                <TraceBadge text="從對話歷史補充位置" color="amber" />
                <span className="text-wb-50">query 含指代詞，位置從近期對話記錄中提取</span>
              </div>
            )}
            <pre className="font-mono text-wb-70 bg-wb-5 rounded px-2 py-1.5 overflow-auto max-h-24 text-[10px]">
              {JSON.stringify(f.applied, null, 2)}
            </pre>
          </div>
        ) : (
          <p className="text-wb-40">無 Filter 套用（general-knowledge 或無結構化參數）</p>
        )}
      </StageSection>
    </IOFlow>
    </div>
  )
}

function FilterTrace({ trace }: { trace: PipelineTrace | null; pipelineStage: Record<string, unknown> | null }) {
  const f = trace?.filter
  const qp = trace?.query_parsing

  if (!f) return (
    <div>
      <StageDesc>將 query_parsing 抽取的結構化 params 轉換為 Vectorize 向量資料庫的 Metadata Filter，在向量搜尋時限縮候選範圍。支援 LLM 解析（llm_parsed）、Regex 降級（regex_fallback）、相似路線（sim_route）與對話歷史補充（history_supplemented）等來源。</StageDesc>
    <IOFlow>
      <StageSection type="input">
        <p className="text-wb-40">來自 query_parsing 抽取的 params</p>
      </StageSection>
      <StageSection type="decision">
        <p className="text-wb-40">無詳細資料（舊記錄或快取命中）</p>
      </StageSection>
      <StageSection type="output">
        <p className="text-wb-40">無套用 Filter（general-knowledge 或無結構化參數）</p>
      </StageSection>
    </IOFlow>
    </div>
  )

  const sourceColors: Record<string, 'emerald' | 'blue' | 'amber' | 'violet'> = {
    llm_parsed: 'emerald',
    regex_fallback: 'amber',
    sim_route: 'blue',
    history_supplemented: 'violet',
  }
  const params = qp?.params ?? {}
  const matchedTexts = f.matched_texts ?? {}
  const resolvedIds = f.resolved_ids ?? {}

  return (
    <div>
      <StageDesc>將 query_parsing 抽取的結構化 params 轉換為 Vectorize 向量資料庫的 Metadata Filter，在向量搜尋時限縮候選範圍。支援 LLM 解析（llm_parsed）、Regex 降級（regex_fallback）、相似路線（sim_route）與對話歷史補充（history_supplemented）等來源。</StageDesc>
    <IOFlow>
      <StageSection type="input">
        <div className="space-y-1">
          <KVRow label="觸發條件" value="tool = search_routes / search_crags 且 query_parsing 抽取到結構化 params；通識問答跳過" />
          <p className="text-wb-40 text-[10px] mt-0.5">LLM 抽取 Params（來自 query_parsing）：</p>
          {Object.keys(params).length > 0 ? (
            Object.entries(params).map(([k, v]) => (
              <KVRow key={k} label={k} value={JSON.stringify(v)} />
            ))
          ) : (
            <p className="text-wb-40">無結構化 params</p>
          )}
        </div>
      </StageSection>
      <StageSection type="decision">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-wb-40">Filter 來源：</span>
            <TraceBadge text={f.source} color={sourceColors[f.source] ?? 'default'} />
            {f.source === 'regex_fallback' && <span className="text-wb-50">LLM 解析失敗，降級為 Regex</span>}
          </div>
          {f.history_supplemented && (
            <div className="flex items-center gap-2">
              <TraceBadge text="對話歷史補充位置" color="violet" />
              <span className="text-wb-50">query 含指代詞，從近期對話補充 crag/region</span>
            </div>
          )}
          {Object.keys(matchedTexts).length > 0 && (
            <div>
              <p className="text-wb-40 mb-1">觸發各欄位的原始文字：</p>
              <div className="space-y-0.5">
                {Object.entries(matchedTexts).map(([field, text]) => (
                  <div key={field} className="flex items-start gap-2">
                    <TraceBadge text={field} color="blue" />
                    <span className="text-wb-70 italic">&ldquo;{text}&rdquo;</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {Object.keys(resolvedIds).length > 0 && (
            <div>
              <p className="text-wb-40 mb-1">DB 解析出的 ID：</p>
              <div className="space-y-0.5">
                {Object.entries(resolvedIds).map(([key, val]) => (
                  <KVRow key={key} label={key} value={Array.isArray(val) ? val.join(', ') : String(val ?? '—')} />
                ))}
              </div>
            </div>
          )}
        </div>
      </StageSection>
      <StageSection type="output">
        <div className="space-y-1">
          <p className="text-wb-40 text-[10px]">最終 Vectorize metadata filter：</p>
          <pre className="font-mono text-wb-70 bg-wb-5 rounded px-2 py-1.5 overflow-auto max-h-32 text-[10px]">
            {JSON.stringify(f.applied, null, 2)}
          </pre>
        </div>
      </StageSection>
    </IOFlow>
    </div>
  )
}

function MMRSelectionTrace({ trace, sources }: { trace: PipelineTrace | null; sources: Array<{ title?: string; type?: string; score?: number }> }) {
  const m = trace?.mmr_selection
  if (!m) return <p className="text-[11px] text-wb-40">無詳細資料（舊記錄）</p>

  return (
    <div>
      <StageDesc>從 Reranking 後的候選中，以 Maximal Marginal Relevance（MMR）迭代選出兼顧相關性與多樣性的文件組合：每輪選取「與查詢最相關，同時與已選集合相似度最低」的文件。並對攀登紀錄數多的熱門路線施以熱門度加成，確保回答覆蓋受歡迎的路線。</StageDesc>
    <IOFlow>
      <StageSection type="input">
        <div className="space-y-1.5">
          <KVRow label="觸發條件" value="所有向量搜尋路徑必經；Reranking 後執行多樣性選取" />
          {/* 輸入文件清單：優先用 reranker.top_scores */}
          {trace?.retrieval?.reranker?.top_scores && trace.retrieval.reranker.top_scores.length > 0 ? (
            <div>
              <p className="text-wb-40 text-[10px] mb-1">輸入文件（Reranker 輸出，{m.input_count} 筆）：</p>
              <div className="space-y-0.5">
                {trace.retrieval.reranker.top_scores.map((doc, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[10px] px-1">
                    <span className="text-wb-30 tabular-nums w-5 shrink-0">{i + 1}.</span>
                    <span className="flex-1 text-wb-70 truncate">{doc.title}</span>
                    <span className={`font-mono tabular-nums shrink-0 ${doc.score >= 0.5 ? 'text-emerald-600' : doc.score >= 0.2 ? 'text-amber-600' : 'text-wb-40'}`}>{doc.score.toFixed(3)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <KVRow label="輸入候選" value={`${m.input_count} 筆（Cross-encoder Reranking 後）`} />
          )}
          <KVRow label="lambda (λ)" value={
            <span>
              <span className="font-mono text-violet-600">{m.lambda}</span>
              <span className="ml-1.5 text-wb-30 text-[10px]">λ=1.0 純相關性 ／ λ=0.0 純多樣性 ／ 中間值平衡兩者</span>
            </span>
          } />
          <KVRow label="熱門度加權" value={
            <span>
              <span className="font-mono text-amber-600">{m.popularity_weight}</span>
              <span className="ml-1.5 text-wb-30 text-[10px]">依攀登紀錄數正規化的熱門度分（0–1）的加成係數</span>
            </span>
          } />
        </div>
      </StageSection>
      <StageSection type="decision">
        <div className="space-y-1.5">
          <KVRow label="MMR 公式" value={
            <span className="font-mono text-[10px]">
              score(d) = λ × rel(d,q) − (1−λ) × max_sim(d, selected)
            </span>
          } />
          <KVRow label="熱門度補正" value={
            <span className="font-mono text-[10px]">
              final(d) = score(d) + popularity_weight × popularity(d)
            </span>
          } />
          <p className="text-wb-30 text-[10px]">每輪迭代選出 final score 最高的未選文件，直到達到目標數量</p>
        </div>
      </StageSection>
      <StageSection type="output">
        <div className="space-y-2">
          <div className="flex gap-4">
            <div>
              <p className="text-wb-40">輸入</p>
              <p className="text-base font-bold text-wb-90 tabular-nums">{m.input_count} 筆</p>
            </div>
            <div>
              <p className="text-wb-40">MMR 選出</p>
              <p className="text-base font-bold text-emerald-600 tabular-nums">{m.selected_count} 筆</p>
            </div>
          </div>
          {m.top_selected && m.top_selected.length > 0 && (
            <div>
              <p className="text-wb-40 mb-1.5">MMR 選取明細（{m.top_selected.length} 筆）：</p>
              {/* header */}
              <div className="grid text-[10px] text-wb-30 mb-1 px-2" style={{ gridTemplateColumns: '1.2rem 1fr 3rem 3rem 3rem' }}>
                <span>#</span><span>文件</span>
                <span className="text-right" title="MMR 相關性分（0–1，越高越符合查詢）">相關性↑</span>
                <span className="text-right" title="影片數正規化熱門度（0–1，攀登紀錄越多越高）">熱門度↑</span>
                <span className="text-right" title="λ×相關性 + (1-λ)×熱門度 的加權組合分">最終分↑</span>
              </div>
              <div className="space-y-0.5">
                {m.top_selected.map((doc, i) => (
                  <div key={i} className="grid items-center gap-x-1.5 rounded px-2 py-1 hover:bg-wb-5 text-[11px]" style={{ gridTemplateColumns: '1.2rem 1fr 3rem 3rem 3rem' }}>
                    <span className="text-wb-30 tabular-nums">{i + 1}</span>
                    <span className="text-wb-80 truncate">{doc.title}</span>
                    <span className="text-right font-mono text-blue-600 tabular-nums">{doc.relevance_score.toFixed(3)}</span>
                    <span className="text-right font-mono text-amber-600 tabular-nums">{doc.popularity_score.toFixed(3)}</span>
                    <span className="text-right font-mono text-emerald-600 tabular-nums font-semibold">{doc.final_score.toFixed(3)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {sources.length > 0 && (
            <div>
              <p className="text-wb-40 mb-1">送入 LLM 的文件（{sources.length} 筆）：</p>
              <div className="space-y-1">
                {sources.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 rounded bg-wb-5 px-2 py-1">
                    <span className="shrink-0 rounded border border-wb-20 px-1 py-0.5 text-[10px] text-wb-60">{s.type}</span>
                    <span className="flex-1 text-wb-80 truncate">{s.title ?? '—'}</span>
                    {s.score != null && (
                      <span className={`tabular-nums shrink-0 text-[11px] ${s.score >= 0.7 ? 'text-emerald-600' : s.score >= 0.5 ? 'text-amber-600' : 'text-red-500'}`}>
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
    </div>
  )
}

function HydeTrace({ trace, pipelineStage }: { trace: PipelineTrace | null; pipelineStage?: Record<string, unknown> | null }) {
  const h = trace?.hyde
  const triggered = pipelineStage?.triggered as boolean | undefined
  const queryType = pipelineStage?.query_type as string | undefined

  return (
    <div>
      <StageDesc>Hypothetical Document Embedding。對 complex 類型查詢，先讓 LLM 生成一份「假設性的理想回答文件」，再對此文件進行向量化。用假設文件的向量而非查詢向量去搜尋，能找到在語意空間中更接近「答案形式」的文件，顯著提升複雜查詢的召回品質。</StageDesc>
    <IOFlow>
      <StageSection type="input">
        <div className="space-y-1">
          <KVRow label="觸發條件" value="query_type = complex 或相似路線搜尋意圖" />
          {queryType && <KVRow label="本次類型" value={<TraceBadge text={queryType} color={queryType === 'complex' ? 'violet' : queryType === 'simple' ? 'blue' : 'emerald'} />} />}
        </div>
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
        {h?.document ? (
          <div>
            <p className="text-wb-40 mb-1">假設性文件（前 300 字）：</p>
            <pre className="font-mono text-wb-70 bg-wb-5 rounded px-2 py-1.5 whitespace-pre-wrap leading-relaxed max-h-48 overflow-auto text-[10px]">
              {h.document}
            </pre>
          </div>
        ) : triggered === false ? (
          <p className="text-wb-40">跳過，不產生假設性文件</p>
        ) : triggered === true ? (
          <p className="text-wb-40">假設性文件未記錄（舊記錄不含此資料）</p>
        ) : (
          <p className="text-wb-40">無詳細資料</p>
        )}
      </StageSection>
    </IOFlow>
    </div>
  )
}

function MultiQueryTrace({ trace, query }: { trace: PipelineTrace; query: string }) {
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

function EmbeddingTrace({
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

  const inputs: string[] = []
  if (e) {
    inputs.push(e.early_vector_reused ? 'query 向量（復用早期向量）' : 'query 向量（新生成）')
    if (e.hyde_embedded) inputs.push('HyDE 假設文件向量')
    if (e.expanded_count > 0) inputs.push(`Multi-Query 擴展向量 ×${e.expanded_count}`)
  }

  return (
    <div>
      <StageDesc>將查詢文字（及 HyDE 假設文件、Multi-Query 擴展查詢）轉換為 1024 維稠密向量（@cf/baai/bge-m3），供向量資料庫執行餘弦相似度搜尋。若前序階段已生成 query 向量（early_vector），可直接復用以節省時間。</StageDesc>
    <IOFlow>
      <StageSection type="input">
        {e ? (
          <div className="space-y-2">
            <KVRow label="觸發條件" value="所有向量搜尋必經；若已有 early_vector 可直接復用，跳過重新 embedding" />
            {/* query */}
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
                <span>{e.early_vector_reused ? 'query 向量（復用早期向量）' : 'query 向量（新生成）'}</span>
              </div>
              {query && (
                <p className="ml-3 text-[10px] text-wb-60 font-mono border-l-2 border-blue-100 pl-2 line-clamp-2">{query}</p>
              )}
            </div>
            {/* HyDE */}
            {e.hyde_embedded && (
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shrink-0" />
                  <span>HyDE 假設文件向量</span>
                </div>
                {hydeDoc ? (
                  <p className="ml-3 text-[10px] text-wb-60 border-l-2 border-violet-100 pl-2 line-clamp-3">{hydeDoc}</p>
                ) : (
                  <p className="ml-3 text-[10px] text-wb-30 border-l-2 border-wb-10 pl-2">假設性文件未記錄（舊記錄）</p>
                )}
              </div>
            )}
            {/* expanded */}
            {e.expanded_count > 0 && (
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                  <span>Multi-Query 擴展向量 ×{e.expanded_count}</span>
                </div>
                {expandedQueries.length > 0 ? (
                  <div className="ml-3 border-l-2 border-amber-100 pl-2 space-y-0.5">
                    {expandedQueries.map((q, i) => (
                      <p key={i} className="text-[10px] text-wb-60 font-mono line-clamp-1">{i + 1}. {q}</p>
                    ))}
                  </div>
                ) : (
                  <p className="ml-3 text-[10px] text-wb-30 border-l-2 border-wb-10 pl-2">擴展查詢未記錄（舊記錄）</p>
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
          {e && <KVRow label="早期向量" value={e.early_vector_reused ? '已復用（節省 embedding 時間）' : '重新生成'} />}
          {durationMs != null && <KVRow label="耗時" value={`${durationMs} ms`} />}
        </div>
      </StageSection>
      <StageSection type="output">
        {e ? (
          <div className="space-y-2">
            {/* query vec */}
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <TraceBadge text={e.early_vector_reused ? 'query vec（復用）' : 'query vec'} color="blue" />
                <span className="text-[10px] text-wb-40">1024 維</span>
              </div>
              {query && (
                <p className="ml-1 text-[10px] text-wb-50 line-clamp-1 font-mono border-l border-wb-10 pl-2">{query}</p>
              )}
            </div>
            {/* HyDE vec */}
            {e.hyde_embedded && (
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <TraceBadge text="HyDE vec" color="violet" />
                  <span className="text-[10px] text-wb-40">1024 維</span>
                </div>
                {hydeDoc && (
                  <p className="ml-1 text-[10px] text-wb-50 line-clamp-2 border-l border-wb-10 pl-2">{hydeDoc}</p>
                )}
              </div>
            )}
            {/* expanded vecs */}
            {e.expanded_count > 0 && (
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <TraceBadge text={`擴展 vec ×${e.expanded_count}`} color="amber" />
                  <span className="text-[10px] text-wb-40">1024 維 × {e.expanded_count}</span>
                </div>
                {expandedQueries.length > 0 && (
                  <div className="ml-1 space-y-0.5 border-l border-wb-10 pl-2">
                    {expandedQueries.map((q, i) => (
                      <p key={i} className="text-[10px] text-wb-50 line-clamp-1 font-mono">{i + 1}. {q}</p>
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

function RRFFusionTrace({ trace }: { trace: PipelineTrace | null }) {
  const r = trace?.retrieval
  const [expandedInputPath, setExpandedInputPath] = useState<string | null>(null)
  const [showMerged, setShowMerged] = useState(false)
  const [showOutput, setShowOutput] = useState(false)

  if (!r) return <p className="text-[11px] text-wb-40">無詳細資料（舊記錄）</p>

  const pathLabelMap: Record<string, string> = {
    query_vec: 'Query 向量',
    hyde_vec: 'HyDE 向量',
    bm25: 'BM25 全文',
  }
  const pathLabel = (p: string) => pathLabelMap[p] ?? p
  const pathColor = (p: string): 'blue' | 'violet' | 'emerald' | 'amber' | 'default' =>
    p === 'query_vec' ? 'blue' : p === 'hyde_vec' ? 'violet' : p === 'bm25' ? 'emerald' : 'amber'

  const pathEntries = r.path_counts ? Object.entries(r.path_counts) : []
  const pathResults = r.path_results ?? {}

  // 從 path_results 重建 RRF 排序（k=60）
  const rrfResults = (() => {
    const k = 60
    const docMap = new Map<string, { id: string; name?: string; rrfScore: number; paths: string[]; pathRanks: Record<string, number> }>()
    for (const [path, docs] of Object.entries(pathResults)) {
      docs.forEach((doc, rank) => {
        const contrib = 1 / (k + rank + 1)
        const existing = docMap.get(doc.id)
        if (existing) {
          existing.rrfScore += contrib
          existing.paths.push(path)
          existing.pathRanks[path] = rank + 1
        } else {
          docMap.set(doc.id, { id: doc.id, name: doc.name, rrfScore: contrib, paths: [path], pathRanks: { [path]: rank + 1 } })
        }
      })
    }
    const sorted = Array.from(docMap.values()).sort((a, b) => b.rrfScore - a.rrfScore)
    // 後端 merged_count 是 cap 後的數量（排序後取前 N 筆），與此一致
    return r.rrf ? sorted.slice(0, r.rrf.merged_count) : sorted
  })()

  const threshold = r.rrf?.min_score_threshold ?? 0
  // 使用後端記錄的 after_threshold_count 保持一致
  const filtered = r.rrf ? rrfResults.slice(0, r.rrf.after_threshold_count) : rrfResults

  if (!r.rrf) return (
    <div>
      <StageDesc>將多路搜尋結果以 Reciprocal Rank Fusion 演算法融合：各文件的最終 RRF 分數為其在各路徑中倒排名的加總，跨路徑去重後依分數門檻過濾低質候選，產出一份統一有序清單。</StageDesc>
      <IOFlow>
        <StageSection type="input">
          <KVRow label="觸發條件" value="retrieval 執行後必然觸發（multi-path 搜尋完成即合併）" />
          <KVRow label="各路徑候選" value={`${r.candidates_before_filter} 筆（多路徑原始結果）`} />
        </StageSection>
        <StageSection type="decision">
          <p className="text-wb-50">無詳細 RRF 資料（舊記錄）</p>
        </StageSection>
        <StageSection type="output">
          <p className="text-wb-40">無詳細 RRF 資料（舊記錄）</p>
        </StageSection>
      </IOFlow>
    </div>
  )

  return (
    <div>
      <StageDesc>將多路搜尋結果以 Reciprocal Rank Fusion 演算法融合：各文件的最終 RRF 分數為其在各路徑中倒排名的加總（score = Σ 1/(k+rank)，k=60），跨路徑去重後依分數門檻過濾低質候選，產出一份統一有序清單。</StageDesc>
      <IOFlow>
        {/* INPUT：各路徑原始候選清單 */}
        <StageSection type="input">
          <div className="space-y-1.5">
            <KVRow label="觸發條件" value="retrieval 執行後必然觸發（multi-path 搜尋完成即合併）" />
            <KVRow label="輸入路徑" value={`${r.rrf.paths_count} 條獨立搜尋結果集`} />
            {pathEntries.length > 0 && (
              <div className="space-y-1">
                <p className="text-wb-30 text-[10px]">各路徑候選（點擊展開文件清單）：</p>
                {pathEntries.map(([path, count]) => {
                  const docs = pathResults[path] ?? []
                  const isExpanded = expandedInputPath === path
                  const hasData = docs.length > 0
                  return (
                    <div key={path} className="rounded border border-wb-10 overflow-hidden">
                      <button
                        onClick={() => hasData ? setExpandedInputPath(isExpanded ? null : path) : undefined}
                        className={`flex items-center gap-2 w-full px-2 py-1.5 bg-wb-3 text-left ${hasData ? 'cursor-pointer hover:bg-wb-5' : 'cursor-default'}`}
                      >
                        <TraceBadge text={pathLabel(path)} color={pathColor(path)} />
                        <span className={`text-[11px] font-semibold tabular-nums ${count > 0 ? 'text-wb-70' : 'text-wb-30'}`}>{count} 筆</span>
                        {hasData && <ChevronUp className={`h-3 w-3 text-wb-30 ml-auto shrink-0 transition-transform ${isExpanded ? '' : 'rotate-180'}`} />}
                      </button>
                      {isExpanded && docs.length > 0 && (
                        <div className="border-t border-wb-10 px-2 py-1.5 space-y-0.5">
                          {docs.map((doc, i) => (
                            <div key={doc.id} className="flex items-center gap-1.5 text-[10px]">
                              <span className="shrink-0 text-wb-30 tabular-nums w-5">{i + 1}.</span>
                              <span className="flex-1 text-wb-70 truncate">{doc.name ?? doc.id}</span>
                              <span className={`shrink-0 font-mono tabular-nums ${doc.score >= 0.5 ? 'text-emerald-600' : doc.score >= 0.2 ? 'text-amber-600' : 'text-wb-40'}`}>
                                {doc.score.toFixed(3)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </StageSection>

        {/* DECISION：合併去重 + 計算 RRF 分 */}
        <StageSection type="decision">
          <div className="space-y-1.5">
            <KVRow label="演算法" value={<span>RRF score = <span className="font-mono">Σ 1/(60 + rank)</span>（各路徑倒排名加總）</span>} />
            <KVRow label="跨路徑去重" value={`合併為 ${r.rrf.merged_count} 筆唯一文件`} />
            <KVRow label="分數門檻" value={
              <span>
                <span className="font-mono text-violet-600">{r.rrf.min_score_threshold.toFixed(4)}</span>
                <span className="ml-1.5 text-wb-30 text-[10px]">RRF 分低於此值的文件被過濾</span>
              </span>
            } />
            <KVRow label="過濾結果" value={
              <span>
                <span className="text-wb-50">{r.rrf.merged_count} 筆</span>
                <span className="mx-1 text-wb-30">→</span>
                <span className="text-emerald-600 font-semibold">{r.rrf.after_threshold_count} 筆</span>
                <span className="ml-1 text-wb-30 text-[10px]">通過門檻</span>
              </span>
            } />
            {rrfResults.length > 0 && (
              <div>
                <button
                  onClick={() => setShowMerged(v => !v)}
                  className="flex items-center gap-1 text-[10px] text-violet-600 hover:text-violet-700 mt-0.5"
                >
                  <ChevronUp className={`h-3 w-3 transition-transform ${showMerged ? '' : 'rotate-180'}`} />
                  {showMerged ? '收起' : `展開合併後 ${rrfResults.length} 筆文件（含 RRF 分 + 來源路徑）`}
                </button>
                {showMerged && (
                  <div className="mt-1.5 space-y-0.5">
                    <div className="grid grid-cols-[20px_1fr_56px_auto] gap-x-2 text-[9px] text-wb-30 px-1 pb-0.5 border-b border-wb-8">
                      <span>#</span><span>文件名稱</span><span className="text-right">RRF分</span><span>路徑</span>
                    </div>
                    {rrfResults.map((doc, i) => {
                      const passed = doc.rrfScore >= threshold
                      return (
                        <div key={doc.id} className={`grid grid-cols-[20px_1fr_56px_auto] gap-x-2 items-center text-[10px] px-1 py-0.5 rounded ${passed ? '' : 'opacity-40'}`}>
                          <span className="text-wb-30 tabular-nums">{i + 1}.</span>
                          <span className={`truncate ${passed ? 'text-wb-70' : 'text-wb-40 line-through'}`}>{doc.name ?? doc.id}</span>
                          <span className={`text-right font-mono tabular-nums ${passed ? 'text-violet-600' : 'text-wb-30'}`}>{doc.rrfScore.toFixed(4)}</span>
                          <div className="flex gap-0.5 flex-wrap">
                            {doc.paths.map(p => (
                              <TraceBadge key={p} text={p === 'query_vec' ? 'Q' : p === 'hyde_vec' ? 'H' : p === 'bm25' ? 'B' : p.replace('expanded_', 'E')} color={pathColor(p)} />
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </StageSection>

        {/* OUTPUT：通過門檻的最終排序清單 */}
        <StageSection type="output">
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-emerald-600 font-bold text-base tabular-nums">{r.rrf.after_threshold_count} 筆</span>
              <span className="text-wb-40">融合後有效候選，進入 CRAG 充足性判斷</span>
            </div>
            <p className="text-wb-30 text-[10px]">已按 RRF 分數降序排列，相同文件出現在越多路徑且排名越前則分數越高</p>
            {filtered.length > 0 && (
              <div>
                <button
                  onClick={() => setShowOutput(v => !v)}
                  className="flex items-center gap-1 text-[10px] text-emerald-600 hover:text-emerald-700 mt-0.5"
                >
                  <ChevronUp className={`h-3 w-3 transition-transform ${showOutput ? '' : 'rotate-180'}`} />
                  {showOutput ? '收起' : `展開最終 ${filtered.length} 筆排序清單`}
                </button>
                {showOutput && (
                  <div className="mt-1.5 space-y-0.5">
                    <div className="grid grid-cols-[20px_1fr_56px_auto] gap-x-2 text-[9px] text-wb-30 px-1 pb-0.5 border-b border-wb-8">
                      <span>#</span><span>文件名稱</span><span className="text-right">RRF分</span><span>出現路徑</span>
                    </div>
                    {filtered.map((doc, i) => (
                      <div key={doc.id} className="grid grid-cols-[20px_1fr_56px_auto] gap-x-2 items-center text-[10px] px-1 py-0.5 rounded hover:bg-wb-3">
                        <span className="text-wb-40 tabular-nums">{i + 1}.</span>
                        <span className="text-wb-80 truncate">{doc.name ?? doc.id}</span>
                        <span className="text-right font-mono tabular-nums text-emerald-600">{doc.rrfScore.toFixed(4)}</span>
                        <div className="flex gap-0.5 flex-wrap">
                          {doc.paths.map(p => (
                            <TraceBadge key={p} text={p === 'query_vec' ? 'Q' : p === 'hyde_vec' ? 'H' : p === 'bm25' ? 'B' : p.replace('expanded_', 'E')} color={pathColor(p)} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </StageSection>
      </IOFlow>
    </div>
  )
}

function CRAGFallbackTrace({ trace }: { trace: PipelineTrace | null }) {
  const r = trace?.retrieval
  if (!r) return <p className="text-[11px] text-wb-40">無詳細資料（舊記錄）</p>

  const postRrfCount = r.rrf?.after_threshold_count ?? r.candidates_before_filter
  const triggered = r.crag_fallback
  const hasDetail = !!r.crag_fallback_detail
  const finalCount = hasDetail
    ? (r.crag_fallback_detail!.retries.at(-1)?.candidates_after ?? postRrfCount)
    : postRrfCount

  return (
    <div>
      <StageDesc>判斷 RRF 後的有效候選是否足夠。若不足，逐步放寬 Metadata Filter 條件並重新搜尋：先移除難度（grade）限制，再移除類型（type）限制，每次重試後重新計算候選數，直到足夠或放無可放為止。</StageDesc>
      <IOFlow>
        <StageSection type="input">
          <div className="space-y-1">
            <KVRow label="RRF 後候選" value={`${postRrfCount} 筆`} />
            <KVRow label="觸發條件" value="candidates_after_filter = 0（過濾後無候選）" />
            {r.crag_fallback_stage && (
              <KVRow label="已放寬至" value={
                r.crag_fallback_stage === 'grade'
                  ? '移除 grade 難度過濾'
                  : '移除 grade + type 過濾'
              } />
            )}
          </div>
        </StageSection>
        <StageSection type="decision">
          <div className="space-y-1.5">
            {triggered ? (
              <>
                <div className="flex items-center gap-1.5">
                  <TraceBadge text="觸發回退" color="amber" />
                  {r.crag_fallback_detail?.trigger_reason && (
                    <span className="text-wb-50 text-[10px]">{r.crag_fallback_detail.trigger_reason}</span>
                  )}
                </div>
                {hasDetail && r.crag_fallback_detail!.retries.length > 0 ? (
                  <div className="space-y-1.5 pt-0.5">
                    <p className="text-wb-30 text-[10px]">放寬步驟：</p>
                    {r.crag_fallback_detail!.retries.map((retry, i) => (
                      <div key={i} className="rounded border border-amber-100 bg-amber-50/40 px-2 py-1.5 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-wb-30 text-[10px] tabular-nums">Step {i + 1}</span>
                          <span className="text-wb-40 text-[10px]">移除</span>
                          <TraceBadge text={retry.removed_filter} color="red" />
                          <span className="text-wb-30 text-[10px]">過濾條件</span>
                        </div>
                        <div className="flex items-center gap-1.5 pl-1">
                          <span className="text-wb-40 text-[10px]">重搜結果：</span>
                          <span className="text-amber-700 font-semibold text-[11px]">{retry.candidates_after} 筆</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : r.crag_fallback_stage ? (
                  <div className="space-y-1">
                    <TraceBadge
                      text={r.crag_fallback_stage === 'grade' ? '移除 grade 難度過濾後重搜' : '移除 grade + type 後重搜'}
                      color="amber"
                    />
                  </div>
                ) : null}
              </>
            ) : (
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span className="text-wb-50">candidates_after_filter &gt; 0，候選充足，跳過回退</span>
              </div>
            )}
          </div>
        </StageSection>
        <StageSection type="output">
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className={`font-bold text-base tabular-nums ${triggered ? 'text-amber-600' : 'text-emerald-600'}`}>{finalCount} 筆</span>
              <span className="text-wb-40">
                {triggered ? '放寬過濾後的候選，進入 Cross-encoder Reranking' : '原始有效候選，進入 Cross-encoder Reranking'}
              </span>
            </div>
            {triggered && (
              <p className="text-wb-30 text-[10px]">注意：放寬過濾可能引入相關性較低的文件，後續 Reranking 將依語意評分再次排序</p>
            )}
          </div>
        </StageSection>
      </IOFlow>
    </div>
  )
}

function RerankerTrace({ trace, query }: { trace: PipelineTrace | null; query: string }) {
  const r = trace?.retrieval
  const [showInput, setShowInput] = useState(false)
  if (!r) return <p className="text-[11px] text-wb-40">無詳細資料（舊記錄）</p>

  const skipped = r.reranker_used === false || !!r.reranker?.skipped_reason
  const inputCount = r.reranker?.input_count ?? (r.rrf?.after_threshold_count ?? r.candidates_before_filter)

  // 重建 RRF 排序後的文件清單作為 reranker input
  const rrfFilteredDocs = (() => {
    if (!r.path_results || !r.rrf) return []
    const k = 60
    const docMap = new Map<string, { id: string; name?: string; rrfScore: number }>()
    for (const [, docs] of Object.entries(r.path_results)) {
      docs.forEach((doc, rank) => {
        const contrib = 1 / (k + rank + 1)
        const ex = docMap.get(doc.id)
        if (ex) ex.rrfScore += contrib
        else docMap.set(doc.id, { id: doc.id, name: doc.name, rrfScore: contrib })
      })
    }
    const threshold = r.rrf.min_score_threshold
    return Array.from(docMap.values())
      .filter(d => d.rrfScore >= threshold)
      .sort((a, b) => b.rrfScore - a.rrfScore)
  })()

  return (
    <div>
      <StageDesc>使用 Cross-encoder 模型（BAAI/bge-reranker-base）對每份候選文件與查詢進行聯合編碼評分。相比 Bi-encoder 的獨立嵌入，Cross-encoder 直接對「查詢 + 文件」整體建模，能更精準捕捉語意相關性，產出 0–1 的信心度分數並重新排序。</StageDesc>
      <IOFlow>
        <StageSection type="input">
          <div className="space-y-1.5">
            <KVRow label="觸發條件" value="候選文件數 ≥ min_rerank_count（候選過少時跳過以節省時間）" />
            <div className="space-y-0.5">
              <p className="text-wb-40 text-[10px]">評分用查詢：</p>
              <p className="font-mono text-[11px] text-wb-70 bg-wb-5 rounded px-2 py-1.5 break-all line-clamp-2">{query}</p>
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-wb-50">候選文件（RRF 後）：</span>
                <span className="font-semibold text-wb-80 tabular-nums">{inputCount} 筆</span>
                {rrfFilteredDocs.length > 0 && (
                  <button onClick={() => setShowInput(v => !v)} className="flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-700">
                    <ChevronUp className={`h-3 w-3 transition-transform ${showInput ? '' : 'rotate-180'}`} />
                    {showInput ? '收起' : '展開清單'}
                  </button>
                )}
              </div>
              {showInput && rrfFilteredDocs.length > 0 && (
                <div className="space-y-0.5 mt-0.5">
                  {rrfFilteredDocs.map((doc, i) => (
                    <div key={doc.id} className="flex items-center gap-1.5 text-[10px] px-1">
                      <span className="text-wb-30 tabular-nums w-5 shrink-0">{i + 1}.</span>
                      <span className="flex-1 text-wb-70 truncate">{doc.name ?? doc.id}</span>
                      <span className="font-mono tabular-nums text-wb-40">{doc.rrfScore.toFixed(4)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <KVRow label="評分模型" value="BAAI/bge-reranker-base（Cross-encoder）" />
            <KVRow label="分數範圍" value="0–1（≥ 0.5 高相關 ／ 0.2–0.5 部分相關 ／ < 0.2 低相關）" />
          </div>
        </StageSection>
        <StageSection type="decision">
          {skipped ? (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <TraceBadge text="跳過 Reranking" color="default" />
              </div>
              <KVRow label="原因" value={r.reranker?.skipped_reason ?? '候選數過少，不值得執行 Cross-encoder'} />
              <p className="text-wb-30 text-[10px]">候選將以 RRF 原始分數排序直接進入 MMR</p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-wb-50">對每份文件與查詢的組合執行 Cross-encoder 推論，計算交叉注意力（cross-attention）語意相關分數</p>
              <p className="text-wb-30 text-[10px]">每次推論獨立輸入整段文件，比 Bi-encoder 計算量大但精準度更高</p>
            </div>
          )}
        </StageSection>
        <StageSection type="output">
          {skipped ? (
            <div className="flex items-baseline gap-2">
              <span className="text-wb-60 font-bold text-base tabular-nums">{inputCount} 筆</span>
              <span className="text-wb-40">維持 RRF 原排序，直接進入 MMR + 熱門度加權</span>
            </div>
          ) : r.reranker?.top_scores ? (
            <div className="space-y-1.5">
              <div className="flex items-baseline gap-2">
                <span className="text-violet-600 font-bold text-base tabular-nums">{r.reranker.top_scores.length} 筆</span>
                <span className="text-wb-40">重排後 Top 結果，進入 MMR + 熱門度加權</span>
              </div>
              <div className="space-y-0.5">
                <div className="grid text-[10px] text-wb-30 mb-0.5 px-1" style={{ gridTemplateColumns: '1.2rem 1fr 3.5rem' }}>
                  <span>#</span><span>文件</span><span className="text-right">信心度↑</span>
                </div>
                {r.reranker.top_scores.map((doc, i) => (
                  <div key={i} className="grid items-center gap-x-1.5 rounded px-1 py-0.5 hover:bg-wb-5 text-[11px]" style={{ gridTemplateColumns: '1.2rem 1fr 3.5rem' }}>
                    <span className="shrink-0 text-wb-30 tabular-nums">{i + 1}</span>
                    <span className="text-wb-70 truncate">{doc.title}</span>
                    <span className={`text-right tabular-nums font-mono font-semibold ${doc.score >= 0.5 ? 'text-emerald-600' : doc.score >= 0.2 ? 'text-amber-600' : 'text-wb-50'}`}>
                      {doc.score.toFixed(3)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <TraceBadge text="已重排" color="violet" />
              <span className="text-wb-40">進入 MMR + 熱門度加權</span>
            </div>
          )}
        </StageSection>
      </IOFlow>
    </div>
  )
}

function OutputPathList({
  r,
  totalRaw,
  pathColor,
}: {
  r: NonNullable<PipelineTrace['retrieval']>
  totalRaw: number
  pathColor: (_p: string) => 'blue' | 'violet' | 'emerald' | 'default'
}) {
  const [expandedPath, setExpandedPath] = useState<string | null>(null)
  const pathLabel = (p: string) =>
    p === 'query_vec' ? 'Query Vec' : p === 'hyde_vec' ? 'HyDE Vec' : p === 'bm25' ? 'BM25' : p
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline gap-2">
        <span className="text-wb-80 font-bold text-base tabular-nums">{totalRaw} 筆</span>
        <span className="text-wb-40">各路徑原始候選合計（含重複），送入 RRF 合併去重</span>
      </div>
      {r.path_counts && (
        <div className="space-y-1">
          {Object.entries(r.path_counts).map(([path, count]) => {
            const docs = r.path_results?.[path] ?? []
            const isExpanded = expandedPath === path
            const hasData = docs.length > 0
            return (
              <div key={path} className="rounded border border-wb-10 overflow-hidden">
                <button
                  onClick={() => hasData ? setExpandedPath(isExpanded ? null : path) : undefined}
                  className={`flex items-center gap-2 w-full px-2 py-1.5 bg-wb-3 text-left ${hasData ? 'cursor-pointer hover:bg-wb-5' : 'cursor-default'}`}
                >
                  <TraceBadge text={pathLabel(path)} color={pathColor(path)} />
                  <span className={`text-[11px] font-semibold tabular-nums ${count > 0 ? 'text-wb-70' : 'text-wb-30'}`}>{count} 筆</span>
                  {count !== docs.length && docs.length > 0 && (
                    <span className="text-[10px] text-wb-30">（顯示前 {docs.length} 筆）</span>
                  )}
                  {hasData && <ChevronUp className={`h-3 w-3 text-wb-30 ml-auto shrink-0 transition-transform ${isExpanded ? '' : 'rotate-180'}`} />}
                </button>
                {isExpanded && docs.length > 0 && (
                  <div className="border-t border-wb-10 px-2 py-1.5 space-y-0.5">
                    <p className="text-[9px] text-wb-25 mb-1">{path === 'bm25' ? 'BM25 相關分' : '向量餘弦相似度（0–1）'}</p>
                    {docs.map((doc, i) => (
                      <div key={doc.id} className="flex items-center gap-1.5 text-[10px]">
                        <span className="shrink-0 text-wb-30 tabular-nums w-5">{i + 1}.</span>
                        <span className="flex-1 text-wb-70 truncate">{doc.name ?? doc.id}</span>
                        <span className={`shrink-0 font-mono tabular-nums ${doc.score >= 0.5 ? 'text-emerald-600' : doc.score >= 0.2 ? 'text-amber-600' : 'text-wb-40'}`}>
                          {doc.score.toFixed(3)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function RetrievalTrace({
  trace,
  pipelineStage: _pipelineStage,
  query,
}: {
  trace: PipelineTrace
  pipelineStage: Record<string, unknown> | null
  query: string
}) {
  const r = trace.retrieval
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set())
  const togglePath = (p: string) =>
    setExpandedPaths((prev) => { const s = new Set(prev); s.has(p) ? s.delete(p) : s.add(p); return s })
  const pathColor = (p: string) =>
    p === 'query_vec' ? 'blue' : p === 'hyde_vec' ? 'violet' : p === 'bm25' ? 'emerald' : 'default'

  if (!r) return <p className="text-[11px] text-wb-40">無詳細資料（舊記錄）</p>

  // 各路徑原始候選合計（用於 OUTPUT）
  const totalRaw = r.path_counts
    ? Object.values(r.path_counts).reduce((a, b) => a + b, 0)
    : r.candidates_before_filter

  // 從 filter trace 取 applied filter（簡化顯示）
  const appliedFilter = trace.filter?.applied
  const filterKeys = appliedFilter ? Object.keys(appliedFilter) : []

  const hydeDoc = trace.hyde?.document
  const expandedQueries = trace.multi_query?.queries ?? []

  // 各路徑 input 說明
  const pathMeta: Record<string, { label: string; trigger: string; dotColor: string }> = {
    query_vec:  { label: 'Query Vec（原始查詢向量）',        trigger: '所有非快取查詢必經（原始查詢 embedding）', dotColor: 'bg-blue-400' },
    hyde_vec:   { label: 'HyDE Vec（假設文件向量）',         trigger: 'HyDE 啟用且 query_type = complex',          dotColor: 'bg-violet-400' },
    bm25:       { label: 'BM25（全文關鍵字搜尋）',           trigger: 'BM25 配置啟用時，與向量搜尋並行執行',        dotColor: 'bg-emerald-400' },
  }

  return (
    <div>
      <StageDesc>同時對向量資料庫發出多條獨立搜尋請求，各路徑使用不同策略：查詢向量（餘弦相似度）、HyDE 假設文件向量（語意擴展）、BM25 全文關鍵字搜尋。各路徑獨立執行後回傳候選文件，供後續 RRF 合併。</StageDesc>
    <IOFlow>
      <StageSection type="input">
        <div className="space-y-2">
          {r.paths.map((p) => {
            const meta = pathMeta[p]
            const isMQ = !meta
            const mqIndex = isMQ ? parseInt(p.replace(/^(expanded_|mq_)/, ''), 10) : -1
            const mqQuery = !isNaN(mqIndex) && mqIndex >= 0 ? expandedQueries[mqIndex] : undefined
            const dotColor = isMQ ? 'bg-amber-400' : meta.dotColor
            const label = isMQ ? `Multi-Query 擴展 #${mqIndex + 1}` : meta.label
            const trigger = isMQ ? 'Multi-Query 啟用，由 LLM 改寫原始查詢而來' : meta.trigger

            let inputText: string | null = null
            if (p === 'query_vec') inputText = query || null
            else if (p === 'hyde_vec') inputText = hydeDoc ?? null
            else if (p === 'bm25') inputText = r.bm25_fts_query ?? null
            else if (isMQ) inputText = mqQuery ?? null

            const borderColor = p === 'bm25' ? 'border-emerald-100' : p === 'hyde_vec' ? 'border-violet-100' : isMQ ? 'border-amber-100' : 'border-blue-100'
            // HyDE 文件可能很長，用 max-h + overflow-auto；其餘完整顯示
            const textCls = p === 'hyde_vec'
              ? `ml-3 text-[10px] text-wb-70 font-mono border-l-2 pl-2 max-h-40 overflow-auto whitespace-pre-wrap ${borderColor}`
              : `ml-3 text-[10px] text-wb-70 font-mono border-l-2 pl-2 whitespace-pre-wrap break-all ${borderColor}`

            return (
              <div key={p} className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColor}`} />
                  <span className="font-medium">{label}</span>
                </div>
                <p className="ml-3 text-[10px] text-wb-40 border-l-2 border-wb-8 pl-2">{trigger}</p>
                {inputText ? (
                  <p className={textCls}>{inputText}</p>
                ) : (
                  <p className="ml-3 text-[10px] text-wb-30 border-l-2 border-wb-8 pl-2 italic">
                    {p === 'bm25' ? 'BM25 查詢未記錄' : p === 'hyde_vec' ? '假設文件未記錄（舊記錄）' : isMQ ? '擴展查詢未記錄（舊記錄）' : '查詢文字未記錄'}
                  </p>
                )}
              </div>
            )
          })}
          <div className="pt-1 border-t border-wb-8 space-y-0.5">
            <p className="text-wb-30 text-[10px]">Metadata Filter：</p>
            {filterKeys.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {filterKeys.map((k) => (
                  <span key={k} className="rounded border border-wb-10 bg-wb-3 px-1.5 py-0.5 text-[10px] text-wb-60 font-mono">
                    {k}: {JSON.stringify((appliedFilter as Record<string, unknown>)[k])}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-wb-50 text-[10px]">無（搜尋全庫）</p>
            )}
          </div>
        </div>
      </StageSection>
      <StageSection type="decision">
        <div className="space-y-1">
          <p className="text-wb-30 text-[10px] mb-1">各路徑執行結果（點擊展開文件清單）</p>
          {r.paths.map((p) => {
            const docs = r.path_results?.[p]
            const count = r.path_counts?.[p]
            const expanded = expandedPaths.has(p)
            const hasData = (count ?? 0) > 0
            // 該路徑實際使用的查詢文字
            const isMQPath = p !== 'query_vec' && p !== 'hyde_vec' && p !== 'bm25'
            const mqIdx = isMQPath ? parseInt(p.replace(/^(expanded_|mq_)/, ''), 10) : -1
            const pathInputText =
              p === 'query_vec' ? query :
              p === 'hyde_vec' ? (hydeDoc ?? null) :
              p === 'bm25' ? (r.bm25_fts_query ?? null) :
              (!isNaN(mqIdx) && mqIdx >= 0 ? (expandedQueries[mqIdx] ?? null) : null)
            return (
              <div key={p} className="rounded border border-wb-10 overflow-hidden">
                <button
                  onClick={() => hasData ? togglePath(p) : undefined}
                  className={`flex items-start gap-2 w-full px-2 py-1.5 bg-wb-3 text-left ${hasData ? 'cursor-pointer hover:bg-wb-5' : 'cursor-default'}`}
                >
                  <TraceBadge text={p} color={pathColor(p)} />
                  <span className={`text-[11px] tabular-nums font-semibold shrink-0 ${hasData ? 'text-wb-70' : 'text-wb-30'}`}>
                    {count ?? 0} 筆
                  </span>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="text-[10px] text-wb-30">
                      {p === 'query_vec' ? '查詢向量搜尋（餘弦相似度）' :
                       p === 'hyde_vec' ? 'HyDE 假設文件向量搜尋（餘弦相似度）' :
                       p === 'bm25' ? 'BM25 全文關鍵字搜尋' :
                       'Multi-Query 擴展查詢向量搜尋'}
                    </p>
                    {pathInputText && (
                      <p className="text-[10px] text-wb-60 font-mono break-all whitespace-pre-wrap line-clamp-2">
                        {pathInputText}
                      </p>
                    )}
                  </div>
                  {hasData && (
                    <ChevronUp className={`h-3 w-3 text-wb-30 shrink-0 mt-0.5 transition-transform ${expanded ? '' : 'rotate-180'}`} />
                  )}
                </button>
                {!hasData && (
                  <div className="px-2 py-1 border-t border-wb-10">
                    {p === 'bm25' ? (
                      <p className="text-[10px] text-amber-600">關鍵字搜尋無匹配（需完整詞彙命中，中文常見）</p>
                    ) : (
                      <p className="text-[10px] text-wb-30">向量搜尋無結果（分數未達門檻或無相關文件）</p>
                    )}
                  </div>
                )}
                {expanded && docs && docs.length > 0 && (
                  <div className="border-t border-wb-10 px-2 py-1.5">
                    <p className="text-[9px] text-wb-25 mb-1">{p === 'bm25' ? 'BM25 相關分（越高越匹配關鍵字）' : '向量餘弦相似度（0–1，越高越相關）'}</p>
                    <div className="space-y-0.5">
                      {docs.map((doc, i) => (
                        <div key={doc.id} className="flex items-center gap-1.5 text-[10px]">
                          <span className="shrink-0 text-wb-30 tabular-nums w-4">{i + 1}.</span>
                          <span className="flex-1 text-wb-70 truncate">{doc.name ?? doc.id}</span>
                          <span className={`shrink-0 font-mono tabular-nums ${doc.score >= 0.5 ? 'text-emerald-600' : doc.score >= 0.2 ? 'text-amber-600' : 'text-wb-40'}`}>
                            {doc.score.toFixed(3)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </StageSection>
      <StageSection type="output">
        <OutputPathList r={r} totalRaw={totalRaw} pathColor={pathColor} />
      </StageSection>
    </IOFlow>
    </div>
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
  const [showMemoryPreview, setShowMemoryPreview] = useState(false)
  if (!g) return <p className="text-[11px] text-wb-40">無詳細資料（舊記錄）</p>
  const model = pipelineStage?.model as string | null | undefined
  const tokenCount = pipelineStage?.token_count as number | null | undefined
  const durationMs = pipelineStage?.duration_ms as number | null | undefined

  return (
    <div>
      <StageDesc>將 MMR 選出的文件作為 Context，連同用戶查詢和個人化資訊（攀登歷史、記憶摘要）注入 Prompt，呼叫 LLM（Gemma-3-12B）生成最終回答。依查詢類型選擇個人化或通用模板，並同時輸出建議追問問題。</StageDesc>
    <IOFlow>
      <StageSection type="input">
        <div className="space-y-1.5">
          <KVRow label="觸發條件" value="所有完整 Pipeline 查詢必經此階段（快取命中時跳過）" />
          <KVRow label="Context 文件" value={`${g.context_doc_count} 筆`} />
          <KVRow label="查詢" value={<span className="italic text-wb-60 line-clamp-1">{query}</span>} />
          {g.context_doc_titles && g.context_doc_titles.length > 0 && (
            <div>
              <p className="text-wb-40 text-[10px] mb-1">注入 Prompt 的文件（前 {g.context_doc_titles.length} 筆）：</p>
              <ol className="space-y-0.5">
                {g.context_doc_titles.map((title, i) => (
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
              text={g.prompt_template === 'personalized' ? '個人化模板' : g.prompt_template === 'default' ? '通用模板' : g.personalized ? '個人化模板' : '通用模板'}
              color={g.prompt_template === 'personalized' || g.personalized ? 'violet' : 'default'}
            />
          </div>
          {g.ability_level != null && (
            <KVRow label="能力等級" value={
              <TraceBadge
                text={g.ability_level >= 120 ? '高階（5.12+）' : g.ability_level >= 100 ? '中階（5.10-5.11）' : '入門'}
                color={g.ability_level >= 120 ? 'violet' : g.ability_level >= 100 ? 'blue' : 'default'}
              />
            } />
          )}
          {g.memory_summary_preview !== undefined && g.memory_summary_preview !== null && (
            <div>
              <button
                onClick={() => setShowMemoryPreview((v) => !v)}
                className="flex items-center gap-1 text-[11px] text-wb-50 hover:text-wb-70"
              >
                {showMemoryPreview ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                記憶摘要預覽
              </button>
              {showMemoryPreview && (
                <pre className="mt-1 font-sans text-wb-60 bg-wb-5 rounded px-2 py-1.5 text-[10px] whitespace-pre-wrap leading-relaxed max-h-24 overflow-auto">
                  {g.memory_summary_preview}
                </pre>
              )}
            </div>
          )}
          {g.memory_summary_length != null && g.memory_summary_length > 0 && !g.memory_summary_preview && (
            <KVRow label="記憶長度" value={`${g.memory_summary_length} 字元`} />
          )}
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
          {g.suggested_questions && g.suggested_questions.length > 0 && (
            <div>
              <p className="text-wb-40 mb-1">生成建議問題（{g.suggested_questions.length} 條）：</p>
              <ol className="space-y-0.5">
                {g.suggested_questions.map((q, i) => (
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

function SelfReflectionTrace({
  trace,
  pipelineStage,
}: {
  trace: PipelineTrace | null
  pipelineStage: Record<string, unknown> | null
}) {
  const sr = trace?.self_reflection
  const triggered = pipelineStage?.triggered as boolean | undefined

  const firstQuality = sr?.first_judge_quality ?? sr?.original_quality
  const firstGroundedness = sr?.first_judge_groundedness ?? sr?.original_groundedness
  const secondQuality = sr?.second_judge_quality ?? sr?.regen_quality
  const secondGroundedness = sr?.second_judge_groundedness ?? sr?.regen_groundedness
  const regenReason = sr?.regen_reason
  const acceptanceReason = sr?.acceptance_reason
  const regenAccepted = sr?.regen_accepted

  const regenReasonLabels: Record<string, string> = {
    quality_below_threshold: '品質分低於閾值',
    groundedness_below_threshold: 'Groundedness 低於閾值',
    both: '品質與 Groundedness 皆不足',
  }

  return (
    <div>
      <StageDesc>LLM Judge 對初次生成的回答評分後，若品質（Quality &lt; 2/4）或接地性（Groundedness &lt; 50%）低於閾值，自動觸發重新生成（Regen）。重生成後再次評判，比較兩版本分數，選出品質較佳者作為最終回答。觸發條件：query_type = complex 或 pipeline 設定允許。</StageDesc>
    <IOFlow>
      <StageSection type="input">
        <div className="space-y-1.5">
          <p className="text-wb-50">來自 LLM 生成的原始回答 + 初次 Judge 評分</p>
          <p className="text-[10px] text-wb-30">觸發重生成條件：Quality &lt; 2（滿分 4）或 Groundedness &lt; 50%</p>
          {firstQuality != null && (
            <div className="flex gap-6 pt-0.5">
              <div>
                <p className="text-wb-40 text-[10px]">第一次 Quality（1–4）</p>
                <p className={`font-bold tabular-nums ${firstQuality >= 3 ? 'text-emerald-600' : firstQuality >= 2 ? 'text-amber-600' : 'text-red-500'}`}>
                  {firstQuality} / 4
                </p>
              </div>
              {firstGroundedness != null && (
                <div>
                  <p className="text-wb-40 text-[10px]">第一次 Groundedness（0–1）</p>
                  <p className={`font-bold tabular-nums ${firstGroundedness >= 0.7 ? 'text-emerald-600' : firstGroundedness >= 0.5 ? 'text-amber-600' : 'text-red-500'}`}>
                    {(firstGroundedness * 100).toFixed(0)}%
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </StageSection>
      <StageSection type="decision">
        {!triggered ? (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <TraceBadge text="未觸發重生成" color="default" />
            </div>
            {firstQuality != null ? (
              <p className="text-wb-50">
                第一次 Judge Quality {firstQuality}/4 高於門檻，使用原始回答
              </p>
            ) : (
              <ul className="text-wb-50 space-y-0.5 list-disc list-inside">
                <li>非 complex 查詢（simple / general-knowledge 不觸發）</li>
                <li>初次 Quality 分已高於門檻</li>
              </ul>
            )}
          </div>
        ) : sr ? (
          <div className="space-y-2">
            {/* 因果鏈 */}
            <div className="space-y-1.5">
              {regenReason && (
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span className="text-wb-50">觸發原因：</span>
                  <TraceBadge text={regenReasonLabels[regenReason] ?? regenReason} color="amber" />
                </div>
              )}
              <div className="flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                <TraceBadge text="執行重生成" color="violet" />
              </div>
              {secondQuality != null && (
                <div className="flex gap-4 pl-5">
                  <div>
                    <p className="text-wb-40 text-[10px]">第二次 Judge Quality</p>
                    <p className={`font-bold tabular-nums ${secondQuality >= 3 ? 'text-emerald-600' : secondQuality >= 2 ? 'text-amber-600' : 'text-red-500'}`}>
                      {secondQuality} / 4
                    </p>
                  </div>
                  {secondGroundedness != null && (
                    <div>
                      <p className="text-wb-40 text-[10px]">第二次 Groundedness</p>
                      <p className={`font-bold tabular-nums ${secondGroundedness >= 0.7 ? 'text-emerald-600' : secondGroundedness >= 0.5 ? 'text-amber-600' : 'text-red-500'}`}>
                        {(secondGroundedness * 100).toFixed(0)}%
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-wb-40">無詳細 trace 資料（舊記錄）</p>
        )}
      </StageSection>
      <StageSection type="output">
        {!triggered ? (
          <p className="text-wb-50">保留原始生成答案</p>
        ) : sr ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TraceBadge
                text={
                  acceptanceReason === 'regen_accepted' ? '採用重生成答案'
                  : acceptanceReason === 'original_kept' ? '保留原始答案（重生成未改善）'
                  : regenAccepted ? '採用重生成答案' : '保留原始答案（重生成未改善）'
                }
                color={regenAccepted ? 'emerald' : 'amber'}
              />
            </div>
            {!regenAccepted && secondGroundedness != null && firstGroundedness != null && (
              <p className="text-wb-40 text-[10px]">
                比較 Groundedness：原始 {(firstGroundedness * 100).toFixed(0)}% vs 重生成 {(secondGroundedness * 100).toFixed(0)}%，保留較高者
              </p>
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

function JudgeTrace({ pipelineStage, response }: { pipelineStage: Record<string, unknown> | null; response: string | null }) {
  const groundedness = pipelineStage?.groundedness_score as number | null | undefined
  const quality = pipelineStage?.auto_score as number | null | undefined
  const judgeDetail = pipelineStage as Record<string, unknown> | null
  const rawLlmResponse = judgeDetail?.raw_llm_response as string | null | undefined
  const contextChars = judgeDetail?.context_chars as number | null | undefined
  const contextTruncated = judgeDetail?.context_truncated as boolean | undefined
  const responseChars = judgeDetail?.response_chars as number | null | undefined

  // groundedness 說明文字（對應 JUDGE_PROMPT 的評分標準）
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
    <div>
      <StageDesc>對話結束後，非同步萃取本次對話中用戶透露的個人資訊（攀登偏好、目標路線、能力等），存入 D1 user_memories 表供未來查詢個人化使用。使用 ctx.waitUntil() 確保不阻塞主回應，僅對已登入用戶執行，快取命中的查詢跳過此步驟。</StageDesc>
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

function AgenticTrace({ trace }: { trace: PipelineTrace }) {
  const a = trace.agentic
  if (!a) return <p className="text-[11px] text-wb-40">無詳細資料（舊記錄）</p>

  const stepColors: Record<string, 'emerald' | 'violet' | 'amber'> = {
    ANSWER: 'emerald',
    RETRIEVE: 'violet',
    BROADEN: 'amber',
  }

  const terminationLabels: Record<string, string> = {
    enough_docs: '文件已足夠',
    max_steps: '達到最大步數上限',
    no_improvement: '搜尋結果無改善',
  }

  return (
    <div>
      <StageDesc>多步驟 Agentic RAG 模式。LLM 自主規劃多輪搜尋：每步驟由 LLM 決策下一動作（RETRIEVE 繼續搜尋 / BROADEN 放寬條件 / ANSWER 已足夠回答），動態調整查詢直到累積足夠高品質文件或達到最大步數上限（max_steps）。觸發條件：query_type = complex 且 agentic_mode 已啟用。</StageDesc>
    <IOFlow>
      <StageSection type="input">
        <div className="space-y-1">
          <KVRow label="觸發條件" value="query_type = complex 且 agentic_mode = true" />
          <KVRow label="最大步數" value={`max_steps（每步 LLM 決策是否繼續搜尋）`} />
          <KVRow label="策略" value={<TraceBadge text="Agentic Multi-Step RAG" color="violet" />} />
          <KVRow label="搜尋路徑總數" value={`${a.total_paths} 路`} />
        </div>
      </StageSection>
      <StageSection type="decision">
        {a.steps.length > 0 ? (
          <div className="space-y-1.5">
            <p className="text-wb-40">LLM 決策步驟：</p>
            <ol className="space-y-1.5">
              {a.steps.map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="shrink-0 text-wb-40 tabular-nums text-[10px] mt-0.5">步驟 {s.step}</span>
                  <TraceBadge text={s.type} color={stepColors[s.type] ?? 'default'} />
                  {s.refinedQuery && (
                    <span className="text-wb-60 italic text-[11px] line-clamp-1">{s.refinedQuery}</span>
                  )}
                  {s.docs_retrieved != null && (
                    <span className="ml-auto shrink-0 text-[10px] text-wb-40 tabular-nums">{s.docs_retrieved} 筆</span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <p className="text-wb-40">LLM 首輪即決定回答（ANSWER），無額外搜尋步驟</p>
        )}
      </StageSection>
      <StageSection type="output">
        <div className="space-y-2">
          <div className="flex gap-4">
            <div>
              <p className="text-wb-40">最終文件數</p>
              <p className="text-base font-bold text-wb-90 tabular-nums">{a.final_doc_count} 筆</p>
            </div>
            <div>
              <p className="text-wb-40">搜尋總路徑</p>
              <p className="text-base font-bold text-wb-90 tabular-nums">{a.total_paths}</p>
            </div>
          </div>
          {a.termination_reason && (
            <div className="flex items-center gap-2">
              <span className="text-wb-40 text-[10px]">終止原因：</span>
              <TraceBadge
                text={terminationLabels[a.termination_reason] ?? a.termination_reason}
                color={a.termination_reason === 'enough_docs' ? 'emerald' : a.termination_reason === 'no_improvement' ? 'amber' : 'default'}
              />
            </div>
          )}
        </div>
      </StageSection>
    </IOFlow>
    </div>
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
  if (stageKey === 'cache') return <CacheTrace pipelineStage={pipelineStage ?? null} query={query} pipelineTrace={trace} />
  if (stageKey === 'quota_check') return <QuotaCheckTrace pipelineStage={pipelineStage ?? null} />
  if (stageKey === 'query_parsing') {
    if (!trace) return <p className="text-[11px] text-wb-40">無詳細資料（舊記錄）</p>
    return <QueryParsingTrace trace={trace} query={query} />
  }
  if (stageKey === 'hyde') return <HydeTrace trace={trace} pipelineStage={pipelineStage} />
  if (stageKey === 'multi_query') {
    if (!trace) return <p className="text-[11px] text-wb-40">無詳細資料（舊記錄）</p>
    return <MultiQueryTrace trace={trace} query={query} />
  }
  if (stageKey === 'agentic') {
    if (!trace) return <p className="text-[11px] text-wb-40">無詳細資料（舊記錄）</p>
    return <AgenticTrace trace={trace} />
  }
  if (stageKey === 'filter') return <FilterTrace trace={trace} pipelineStage={pipelineStage ?? null} />
  if (stageKey === 'embedding') return <EmbeddingTrace trace={trace} pipelineStage={pipelineStage ?? null} query={query} />
  if (stageKey === 'retrieval') {
    if (!trace) return <p className="text-[11px] text-wb-40">無詳細資料（舊記錄）</p>
    return <RetrievalTrace trace={trace} pipelineStage={pipelineStage ?? null} query={query} />
  }
  if (stageKey === 'rrf_fusion') return <RRFFusionTrace trace={trace} />
  if (stageKey === 'crag_fallback') return <CRAGFallbackTrace trace={trace} />
  if (stageKey === 'reranking') return <RerankerTrace trace={trace} query={query} />
  if (stageKey === 'mmr_selection') return <MMRSelectionTrace trace={trace} sources={sources} />
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
  const [allExpanded, setAllExpanded] = useState(false)
  const { data: aiConfig } = useAIConfig()
  const primaryProvider = useMemo<CostProvider | null>(() => {
    try {
      const raw = aiConfig?.['cost_providers']
      if (raw) {
        const parsed = JSON.parse(raw) as CostProvider[]
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0]
      }
    } catch { /* fallback */ }
    return DEFAULT_COST_PROVIDERS[0] ?? null
  }, [aiConfig])

  const toggleStage = (key: string) => {
    setExpandedStages((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
    setAllExpanded(false)
  }

  const pipelineStages: PipelineKey[] = [
    'guardrails_input',
    'cache',
    'quota_check',
    'query_parsing',
    'hyde',
    'filter',
    'embedding',
    'retrieval',
    'generation',
    'self_reflection',
    'judge',
    'guardrails_output',
    'memory_extraction',
  ]

  // agentic / multi_query 插在 hyde 後（純 trace，不在 pipeline 物件中）
  // mmr_selection 插在 retrieval 後（純 trace）
  type StageEntry = { key: string; isTraceOnly: boolean }
  const stages: StageEntry[] = []
  for (const key of pipelineStages) {
    stages.push({ key, isTraceOnly: false })
    if (key === 'hyde') {
      if (pipelineTrace?.agentic) {
        stages.push({ key: 'agentic', isTraceOnly: true })
      }
      if (pipelineTrace?.multi_query) {
        stages.push({ key: 'multi_query', isTraceOnly: true })
      }
    }
    if (key === 'retrieval') {
      // RRF、CRAG、Reranking 在 retrieval 執行後才有意義（有 trace 才顯示）
      if (!pipeline.retrieval.skipped && pipelineTrace?.retrieval) {
        stages.push({ key: 'rrf_fusion', isTraceOnly: true })
        stages.push({ key: 'crag_fallback', isTraceOnly: true })
        stages.push({ key: 'reranking', isTraceOnly: true })
      }
      if (pipelineTrace?.mmr_selection) {
        stages.push({ key: 'mmr_selection', isTraceOnly: true })
      }
    }
  }

  const expandableKeys = useMemo(() => {
    return stages
      .filter(({ key, isTraceOnly }) => {
        if (isTraceOnly) return true
        const ps = pipeline[key as PipelineKey] as unknown as Record<string, unknown>
        return !ps?.skipped
      })
      .map(({ key }) => key)
  }, [stages, pipeline])

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedStages(new Set())
    } else {
      setExpandedStages(new Set(expandableKeys))
    }
    setAllExpanded(!allExpanded)
  }

  return (
    <div className="rounded-xl border border-wb-20 bg-white p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-wb-100">RAG Pipeline 流程</h2>
        <button
          onClick={toggleAll}
          className="rounded border border-wb-15 bg-wb-5 px-2 py-0.5 text-[11px] text-wb-60 hover:bg-wb-10 transition-colors"
        >
          {allExpanded ? '全部收合' : '全部展開'}
        </button>
      </div>
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
          else if (isTraceOnly && key === 'crag_fallback')
            status = pipelineTrace?.retrieval?.crag_fallback ? 'triggered' : 'not-triggered'
          else if (isTraceOnly && key === 'reranking')
            status = pipelineTrace?.retrieval?.reranker_used === false ? 'skipped' : 'ran'
          else if (isTraceOnly) status = 'ran'

          // Build metrics pills
          const metrics: { label: string; value: string; highlight?: boolean; estimated?: boolean }[] = []
          const tb = pipelineTrace?.token_breakdown

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
              // 優先用 token_breakdown 的 main_generation（僅該階段），否則 fallback 總計
              const mg = tb?.main_generation
              if (mg) {
                metrics.push({ label: 'in', value: mg.prompt_tokens.toLocaleString(), estimated: mg.estimated })
                metrics.push({ label: 'out', value: mg.completion_tokens.toLocaleString(), estimated: mg.estimated })
                if (primaryProvider) {
                  const usd = calcCost(mg.prompt_tokens, mg.completion_tokens, primaryProvider)
                  metrics.push({ label: '$', value: usd.toFixed(6), estimated: mg.estimated })
                  metrics.push({ label: 'NT$', value: (usd * 32).toFixed(4), estimated: mg.estimated })
                }
              } else if (pipelineStage.token_count != null) {
                metrics.push({ label: 'Tokens', value: String(pipelineStage.token_count) })
              }
              if (pipelineStage.is_high_consumption) metrics.push({ label: '高消耗', value: '!', highlight: true })
            }
            if (key === 'judge') {
              if (pipelineStage.groundedness_score != null)
                metrics.push({ label: 'Groundedness', value: `${((pipelineStage.groundedness_score as number) * 100).toFixed(0)}%` })
              if (pipelineStage.auto_score != null)
                metrics.push({ label: 'Auto', value: `${pipelineStage.auto_score} / 4` })
            }
          }

          // 各 LLM stage 的 token 消耗（來自 token_breakdown）
          if (tb) {
            const singleStageTokenMap: Partial<Record<string, { prompt_tokens: number; completion_tokens: number; total_tokens: number; estimated: boolean } | undefined>> = {
              query_parsing: tb.tool_selection,
              hyde:          tb.hyde,
              self_reflection: tb.self_reflection_regen,
              judge:         tb.judge,
            }
            const stageUsage = singleStageTokenMap[key]
            if (stageUsage) {
              metrics.push({ label: 'in', value: stageUsage.prompt_tokens.toLocaleString(), estimated: stageUsage.estimated })
              metrics.push({ label: 'out', value: stageUsage.completion_tokens.toLocaleString(), estimated: stageUsage.estimated })
              if (primaryProvider) {
                const usd = calcCost(stageUsage.prompt_tokens, stageUsage.completion_tokens, primaryProvider)
                metrics.push({ label: '$', value: usd.toFixed(6), estimated: stageUsage.estimated })
                metrics.push({ label: 'NT$', value: (usd * 32).toFixed(4), estimated: stageUsage.estimated })
              }
            }
          }

          if (isTraceOnly && key === 'agentic' && pipelineTrace?.agentic) {
            const a = pipelineTrace.agentic as { steps: unknown[]; final_doc_count: number; total_paths: number }
            metrics.push({ label: '步驟', value: `${a.steps.length + 1}` })
            metrics.push({ label: '最終文件', value: `${a.final_doc_count} 筆` })
            // Agentic decisions token 加總
            if (tb?.agentic_decisions?.length) {
              const totalIn = tb.agentic_decisions.reduce((s, d) => s + d.prompt_tokens, 0)
              const totalOut = tb.agentic_decisions.reduce((s, d) => s + d.completion_tokens, 0)
              const anyEst = tb.agentic_decisions.some(d => d.estimated)
              metrics.push({ label: 'in', value: totalIn.toLocaleString(), estimated: anyEst })
              metrics.push({ label: 'out', value: totalOut.toLocaleString(), estimated: anyEst })
              if (primaryProvider) {
                const usd = calcCost(totalIn, totalOut, primaryProvider)
                metrics.push({ label: '$', value: usd.toFixed(6), estimated: anyEst })
                metrics.push({ label: 'NT$', value: (usd * 32).toFixed(4), estimated: anyEst })
              }
            }
          }
          if (isTraceOnly && key === 'multi_query' && pipelineTrace?.multi_query) {
            metrics.push({ label: '子查詢', value: `${pipelineTrace.multi_query.queries.length} 條` })
            if (tb?.multi_query) {
              const mq = tb.multi_query
              metrics.push({ label: 'in', value: mq.prompt_tokens.toLocaleString(), estimated: mq.estimated })
              metrics.push({ label: 'out', value: mq.completion_tokens.toLocaleString(), estimated: mq.estimated })
              if (primaryProvider) {
                const usd = calcCost(mq.prompt_tokens, mq.completion_tokens, primaryProvider)
                metrics.push({ label: '$', value: usd.toFixed(6), estimated: mq.estimated })
                metrics.push({ label: 'NT$', value: (usd * 32).toFixed(4), estimated: mq.estimated })
              }
            }
          }
          if (isTraceOnly && key === 'rrf_fusion' && pipelineTrace?.retrieval?.rrf) {
            const rrf = pipelineTrace.retrieval.rrf
            metrics.push({ label: '路徑', value: `${rrf.paths_count} 條` })
            metrics.push({ label: '通過門檻', value: `${rrf.after_threshold_count} 筆` })
          }
          if (isTraceOnly && key === 'crag_fallback' && pipelineTrace?.retrieval?.crag_fallback_detail) {
            metrics.push({ label: '重試', value: `${pipelineTrace.retrieval.crag_fallback_detail.retries.length} 次` })
          }
          if (isTraceOnly && key === 'reranking' && pipelineTrace?.retrieval?.reranker) {
            const re = pipelineTrace.retrieval.reranker
            if (re.input_count != null) metrics.push({ label: '輸入', value: `${re.input_count} 筆` })
            if (re.top_scores?.length) metrics.push({ label: '最高', value: re.top_scores[0].score.toFixed(3) })
          }
          if (isTraceOnly && key === 'mmr_selection' && pipelineTrace?.mmr_selection) {
            const mmr = pipelineTrace.mmr_selection
            metrics.push({ label: '輸入', value: `${mmr.input_count} 筆` })
            metrics.push({ label: '選出', value: `${mmr.selected_count} 筆` })
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
                          : m.estimated
                            ? 'border-amber-200 bg-amber-50 text-amber-700'
                            : 'border-wb-15 bg-wb-5 text-wb-60'
                      }`}
                    >
                      {m.label}: {m.estimated ? '~' : ''}{m.value}
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
          <p className="text-[11px] text-wb-50 mb-0.5">Groundedness</p>
          <p className="text-[10px] text-wb-30 mb-1">0–1，回答有多少來自文件</p>
          {groundedness_score != null ? (
            <p className={`text-lg font-bold tabular-nums ${groundedness_score >= 0.7 ? 'text-emerald-600' : groundedness_score >= 0.5 ? 'text-yellow-600' : 'text-red-500'}`}>
              {(groundedness_score * 100).toFixed(0)}%
            </p>
          ) : (
            <p className="text-wb-40 text-lg">—</p>
          )}
          <p className="text-[9px] text-wb-25 mt-0.5">≥70% 良好</p>
        </div>
        <div className="text-center border-x border-wb-10">
          <p className="text-[11px] text-wb-50 mb-0.5">Auto 評分</p>
          <p className="text-[10px] text-wb-30 mb-1">LLM Judge 1–4 分</p>
          {auto_score != null ? (
            <p className={`text-lg font-bold tabular-nums ${auto_score >= 3 ? 'text-emerald-600' : auto_score >= 2 ? 'text-yellow-600' : 'text-red-500'}`}>
              {auto_score} / 4
            </p>
          ) : (
            <p className="text-wb-40 text-lg">—</p>
          )}
          <p className="text-[9px] text-wb-25 mt-0.5">1=不佳 2=普通 3=良好 4=優秀</p>
        </div>
        <div className="text-center">
          <p className="text-[11px] text-wb-50 mb-0.5">使用者回饋</p>
          <p className="text-[10px] text-wb-30 mb-1">用戶評分 1–5 星</p>
          {feedback_score != null ? (
            <p className={`text-lg font-bold tabular-nums ${feedback_score >= 4 ? 'text-emerald-600' : feedback_score >= 3 ? 'text-yellow-600' : 'text-red-500'}`}>
              {feedback_score} / 5
            </p>
          ) : (
            <p className="text-wb-40 text-lg">—</p>
          )}
          <p className="text-[9px] text-wb-25 mt-0.5">≥4 良好</p>
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
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-amber-700">{f.type}</span>
                {f.is_reviewed && <span className="text-[10px] text-amber-500">已審閱</span>}
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
// Decision Narrative（頂部決策摘要）
// =============================================

function DecisionNarrative({
  pipeline,
  pipelineTrace,
  latency,
}: {
  pipeline: AILogDetail['pipeline']
  pipelineTrace: AILogDetail['pipeline_trace']
  latency: AILogDetail['latency']
}) {
  const pt = pipelineTrace
  const isCacheHit = pipeline?.cache?.hit
  const cacheType = pt?.cache?.type

  const parts: string[] = []

  if (isCacheHit) {
    if (cacheType === 'semantic') {
      parts.push('語義快取命中 → 直接回傳')
    } else {
      parts.push('KV 快取命中 → 直接回傳')
    }
    if (latency.total_ms != null) parts.push(`${latency.total_ms} ms`)
    return (
      <div className="rounded-xl border border-sky-200 bg-sky-50/60 px-4 py-3">
        <p className="text-[11px] font-medium text-sky-700 font-mono">{parts.join(' → ')}</p>
      </div>
    )
  }

  const queryType = pipeline?.query_parsing?.query_type
  const queryTypeMap: Record<string, string> = { simple: '簡單查詢', complex: '複雜查詢', 'general-knowledge': '通識查詢' }

  if (queryType === 'general-knowledge') {
    parts.push(queryTypeMap[queryType])
    parts.push('跳過向量搜尋')
    parts.push('LLM 直接生成')
    if (latency.total_ms != null) parts.push(`${latency.total_ms} ms`)
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
        <p className="text-[11px] font-medium text-emerald-700 font-mono">{parts.join(' → ')}</p>
      </div>
    )
  }

  // 完整 RAG 查詢
  if (queryType) parts.push(queryTypeMap[queryType] ?? queryType)

  // filter 關鍵詞
  const filterMatchedTexts = pt?.filter?.matched_texts
  if (filterMatchedTexts && Object.keys(filterMatchedTexts).length > 0) {
    const keywords = Object.values(filterMatchedTexts).slice(0, 2).join('/')
    parts.push(`filter:${keywords}`)
  }

  // 搜尋路徑數
  const retrieval = pt?.retrieval
  if (retrieval?.paths) {
    parts.push(`${retrieval.paths.length}路搜尋`)
  }

  // RRF 前後候選數
  if (retrieval?.rrf) {
    parts.push(`${retrieval.rrf.merged_count}→${retrieval.rrf.after_threshold_count}筆`)
  }

  // CRAG 狀態
  if (retrieval?.crag_fallback) {
    const retries = retrieval.crag_fallback_detail?.retries?.length ?? 0
    parts.push(`CRAG放寬${retries > 0 ? `×${retries}` : ''}`)
  }

  // cross-encoder
  if (retrieval?.reranker?.top_scores) {
    parts.push('cross-encoder重排')
  }

  // MMR 選取數
  const mmr = pt?.mmr_selection
  if (mmr) {
    parts.push(`MMR(${mmr.selected_count}筆)`)
  }

  // Judge 分數
  const judgeQuality = pipeline?.judge?.auto_score
  const judgeGroundedness = pipeline?.judge?.groundedness_score
  if (judgeQuality != null) parts.push(`Quality ${judgeQuality}/4`)

  // self_reflection
  const sr = pipeline?.self_reflection
  if (sr?.triggered) {
    const acceptReason = pt?.self_reflection?.acceptance_reason
    parts.push(acceptReason === 'regen_accepted' ? '觸發regen(採用)' : '觸發regen(保留原始)')
  }

  // groundedness
  if (judgeGroundedness != null) {
    parts.push(`groundedness ${(judgeGroundedness * 100).toFixed(0)}%`)
  }

  if (latency.total_ms != null) parts.push(`${latency.total_ms} ms`)

  if (parts.length === 0) return null

  return (
    <div className="rounded-xl border border-wb-20 bg-wb-3 px-4 py-3">
      <p className="text-[10px] text-wb-40 mb-1 uppercase tracking-wide font-semibold">決策摘要</p>
      <p className="text-[11px] font-medium text-wb-70 font-mono leading-relaxed">{parts.join(' → ')}</p>
    </div>
  )
}

// =============================================
// 費用分析卡片
// =============================================

type StageBreakdownItem = {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  model: string
  estimated: boolean
}

type TokenBreakdown = NonNullable<NonNullable<AILogDetail['pipeline_trace']>['token_breakdown']>

function calcCost(inputTokens: number, outputTokens: number, provider: CostProvider): number {
  return (inputTokens * provider.input_per_1m + outputTokens * provider.output_per_1m) / 1_000_000
}

function formatCost(cost: number): string {
  return `$${cost.toFixed(6)}`
}

function CostAnalysisCard({ pipelineTrace }: { pipelineTrace: AILogDetail['pipeline_trace'] }) {
  const { data: aiConfig } = useAIConfig()
  const [hiddenProviders, setHiddenProviders] = useState<Set<string>>(new Set())

  // 解析供應商設定（useMemo 須在 early return 之前）
  const providers = useMemo<CostProvider[]>(() => {
    try {
      const raw = aiConfig?.['cost_providers']
      if (raw) {
        const parsed = JSON.parse(raw) as CostProvider[]
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch { /* fallback */ }
    return DEFAULT_COST_PROVIDERS
  }, [aiConfig])

  const tb = pipelineTrace?.token_breakdown
  if (!tb) return null

  const visibleProviders = providers.filter((p) => !hiddenProviders.has(p.id))

  // 建立各 stage 列表
  const singleStages: Array<{ key: string; label: string; data: StageBreakdownItem }> = []
  const stageKeys: Array<[keyof TokenBreakdown, string]> = [
    ['tool_selection', 'Tool Selection（路由決策）'],
    ['text_to_sql', 'Text-to-SQL（SQL 組裝）'],
    ['hyde', 'HyDE（假設文件）'],
    ['multi_query', 'Multi-Query（查詢擴展）'],
    ['main_generation', 'Main Generation（主生成）'],
    ['self_reflection_regen', 'Self-Reflection Regen（重生成）'],
    ['judge', 'Judge（品質評估）'],
    ['judge_2nd', 'Judge 2nd（重生成評估）'],
  ]
  for (const [key, label] of stageKeys) {
    const data = tb[key] as StageBreakdownItem | undefined
    if (data) singleStages.push({ key, label, data })
  }

  const agenticDecisions = tb.agentic_decisions
  type AgenticDecisionItem = StageBreakdownItem & { step: number }

  // 計算各 stage 費用（用於找最貴 stage）
  const stageCosts = singleStages.map((s) =>
    visibleProviders.reduce((sum, p) => sum + calcCost(s.data.prompt_tokens, s.data.completion_tokens, p), 0)
  )
  const maxStageCost = Math.max(...stageCosts, 0)

  // 合計
  const totalInput = singleStages.reduce((s, r) => s + r.data.prompt_tokens, 0) +
    (agenticDecisions?.reduce((s, d) => s + d.prompt_tokens, 0) ?? 0)
  const totalOutput = singleStages.reduce((s, r) => s + r.data.completion_tokens, 0) +
    (agenticDecisions?.reduce((s, d) => s + d.completion_tokens, 0) ?? 0)

  const toggleProvider = (id: string) => {
    setHiddenProviders((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="rounded-xl border border-wb-20 bg-white overflow-hidden">
      <div className="border-b border-wb-10 px-5 py-4">
        <h2 className="text-sm font-semibold text-wb-100">費用分析</h2>
        <p className="mt-0.5 text-xs text-wb-50">各 stage token 消耗與不同供應商費用估算（USD / NT$，匯率 32）</p>
      </div>

      {/* 供應商切換 */}
      <div className="flex flex-wrap gap-1.5 px-5 py-3 border-b border-wb-10 bg-wb-05">
        {providers.map((p) => (
          <button
            key={p.id}
            onClick={() => toggleProvider(p.id)}
            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
              hiddenProviders.has(p.id)
                ? 'border-wb-20 text-wb-40 bg-white'
                : 'border-blue-300 text-blue-700 bg-blue-50'
            }`}
          >
            {p.name}
          </button>
        ))}
        <span className="ml-auto text-[10px] text-wb-40 self-center">點擊切換顯示</span>
      </div>

      {/* 費用表格 */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-wb-10 bg-wb-05">
              <th className="px-4 py-2 text-left font-semibold text-wb-60 w-48">Stage</th>
              <th className="px-3 py-2 text-right font-semibold text-wb-60">Input</th>
              <th className="px-3 py-2 text-right font-semibold text-wb-60">Output</th>
              {visibleProviders.map((p) => (
                <th key={p.id} className="px-3 py-2 text-right font-semibold text-wb-60 whitespace-nowrap">{p.name}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-wb-10">
            {singleStages.map((s, i) => {
              const isMaxCost = stageCosts[i] === maxStageCost && maxStageCost > 0
              return (
                <tr key={s.key} className={isMaxCost ? 'bg-orange-50/60' : 'hover:bg-wb-05'}>
                  <td className="px-4 py-2 text-wb-70 font-medium">
                    {s.data.estimated && <span className="text-wb-40 mr-1">~</span>}
                    {s.label}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-wb-70">{s.data.prompt_tokens.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right font-mono text-wb-70">{s.data.completion_tokens.toLocaleString()}</td>
                  {visibleProviders.map((p) => {
                    const usd = calcCost(s.data.prompt_tokens, s.data.completion_tokens, p)
                    return (
                      <td key={p.id} className="px-3 py-2 text-right font-mono">
                        <div className="text-wb-80">{formatCost(usd)}</div>
                        <div className="text-[10px] text-wb-50">NT${(usd * 32).toFixed(4)}</div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}

            {/* Agentic decisions 展開 */}
            {agenticDecisions && agenticDecisions.length > 0 && agenticDecisions.map((d: AgenticDecisionItem) => (
              <tr key={`agentic-${d.step}`} className="hover:bg-wb-05">
                <td className="px-4 py-2 text-wb-50">
                  {d.estimated && <span className="text-wb-40 mr-1">~</span>}
                  Agentic Decision（step {d.step}）
                </td>
                <td className="px-3 py-2 text-right font-mono text-wb-60">{d.prompt_tokens.toLocaleString()}</td>
                <td className="px-3 py-2 text-right font-mono text-wb-60">{d.completion_tokens.toLocaleString()}</td>
                {visibleProviders.map((p) => {
                  const usd = calcCost(d.prompt_tokens, d.completion_tokens, p)
                  return (
                    <td key={p.id} className="px-3 py-2 text-right font-mono">
                      <div className="text-wb-70">{formatCost(usd)}</div>
                      <div className="text-[10px] text-wb-50">NT${(usd * 32).toFixed(4)}</div>
                    </td>
                  )
                })}
              </tr>
            ))}

            {/* 合計列 */}
            <tr className="bg-wb-05 font-semibold border-t-2 border-wb-20">
              <td className="px-4 py-2.5 text-wb-80">合計</td>
              <td className="px-3 py-2.5 text-right font-mono text-wb-80">{totalInput.toLocaleString()}</td>
              <td className="px-3 py-2.5 text-right font-mono text-wb-80">{totalOutput.toLocaleString()}</td>
              {visibleProviders.map((p) => {
                const usd = calcCost(totalInput, totalOutput, p)
                return (
                  <td key={p.id} className="px-3 py-2.5 text-right font-mono">
                    <div className="text-wb-100">{formatCost(usd)}</div>
                    <div className="text-[10px] text-wb-60">NT${(usd * 32).toFixed(4)}</div>
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="px-5 py-2.5 bg-wb-05 border-t border-wb-10">
        <p className="text-[10px] text-wb-40">
          ~ 表示串流模式估算值（字元數 / 2）。供應商定價可在設定 → 費用模擬 Tab 調整。
        </p>
      </div>
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
            <p className="text-sm font-medium text-wb-100">{formatTaipei(log.created_at)}</p>
          </div>
        </div>
      </div>

      {/* 費用分析 */}
      {log.pipeline_trace?.token_breakdown && (
        <CostAnalysisCard pipelineTrace={log.pipeline_trace} />
      )}

      {/* 決策敘事摘要 */}
      {log.pipeline && (
        <DecisionNarrative
          pipeline={log.pipeline}
          pipelineTrace={log.pipeline_trace}
          latency={log.latency}
        />
      )}

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
          <div className="text-sm text-wb-80 leading-relaxed">
            <MarkdownContent text={log.response} />
          </div>
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
