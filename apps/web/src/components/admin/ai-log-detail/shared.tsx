import {
  Shield,
  Zap,
  Database,
  MessageSquare,
  Brain,
  List,
  Bot,
  Filter,
  Cpu,
  Search,
  GitMerge,
  RotateCcw,
  ArrowUpDown,
  Layers,
  FileText,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Archive,
  ListChecks,
} from 'lucide-react'

export const STAGE_LABELS: Record<string, string> = {
  guardrails_input: '輸入護欄',
  cache: 'KV / 語義快取',
  quota_check: '配額檢查',
  query_parsing: 'Adaptive Routing',
  hyde: 'HyDE 假設文件',
  multi_query: 'Multi-Query 擴展',
  agentic: 'Agentic 多步驟 RAG',
  plan_execute: 'Plan-and-Execute 規劃執行',
  filter: 'Metadata Filter 建構',
  embedding: '向量嵌入',
  retrieval: '多路向量搜尋 + BM25',
  rrf_fusion: 'RRF 合併（Reciprocal Rank Fusion）',
  crag_fallback: 'CRAG 放寬回退',
  reranking: 'Cross-encoder Reranking',
  multi_tool: '多工具組合執行',
  mmr_selection: 'MMR + 熱門度加權',
  generation: 'LLM 生成回答',
  self_reflection: 'Judge 驅動重生成',
  judge: 'LLM Judge 品質評估',
  guardrails_output: '輸出護欄',
  memory_extraction: '記憶萃取',
}

export function StatusBadge({ status }: { status: 'ran' | 'skipped' | 'hit' | 'triggered' | 'not-triggered' | 'timeout' | 'degraded' }) {
  const map = {
    ran: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    skipped: 'bg-wb-10 text-wb-40 border-wb-20',
    hit: 'bg-sky-50 text-sky-600 border-sky-200',
    triggered: 'bg-violet-50 text-violet-600 border-violet-200',
    'not-triggered': 'bg-wb-10 text-wb-50 border-wb-20',
    timeout: 'bg-red-50 text-red-600 border-red-200',
    degraded: 'bg-amber-50 text-amber-600 border-amber-200',
  }
  const label = {
    ran: '已執行',
    skipped: '已跳過',
    hit: '命中',
    triggered: '已觸發',
    'not-triggered': '未觸發',
    timeout: '超時',
    degraded: '降級',
  }
  return (
    <span className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${map[status]}`}>
      {label[status]}
    </span>
  )
}

export function StageIcon({ name, skipped }: { name: string; skipped: boolean }) {
  const cls = `h-4 w-4 ${skipped ? 'text-wb-30' : 'text-wb-70'}`
  const icons: Record<string, React.ReactNode> = {
    guardrails_input: <Shield className={cls} />,
    cache: <Zap className={cls} />,
    quota_check: <Database className={cls} />,
    query_parsing: <MessageSquare className={cls} />,
    hyde: <Brain className={cls} />,
    multi_query: <List className={cls} />,
    agentic: <Bot className={cls} />,
    plan_execute: <ListChecks className={cls} />,
    filter: <Filter className={cls} />,
    embedding: <Cpu className={cls} />,
    retrieval: <Search className={cls} />,
    rrf_fusion: <GitMerge className={cls} />,
    crag_fallback: <RotateCcw className={cls} />,
    reranking: <ArrowUpDown className={cls} />,
    multi_tool: <Layers className={cls} />,
    mmr_selection: <Layers className={cls} />,
    generation: <FileText className={cls} />,
    self_reflection: <RefreshCw className={cls} />,
    judge: <CheckCircle2 className={cls} />,
    guardrails_output: <Shield className={cls} />,
    memory_extraction: <Archive className={cls} />,
  }
  return <>{icons[name] ?? <AlertCircle className={cls} />}</>
}

export function StageSection({
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

export function IOFlow({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2">{children}</div>
}

export function StageDesc({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] text-wb-50 leading-relaxed border-b border-wb-8 pb-2 mb-2">{children}</p>
  )
}

export function TraceBadge({ text, color = 'default' }: { text: string; color?: 'default' | 'blue' | 'violet' | 'emerald' | 'amber' | 'red' }) {
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

export function KVRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="shrink-0 w-24 text-wb-40">{label}</span>
      <span className="text-wb-80 font-mono break-all">{value}</span>
    </div>
  )
}
