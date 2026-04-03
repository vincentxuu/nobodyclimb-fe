'use client'

import {
  Bot,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Loader2,
  Play,
  Power,
  RotateCcw,
  Zap,
} from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { useAIConfig, useAILogDetail, useUpdateAIConfig } from '@/lib/api/admin-ai'
import { askAI } from '@/lib/api/ai'

// =============================================
// 狀態面板
// =============================================

function StatusPanel() {
  const { data: config, isLoading } = useAIConfig()
  const { mutate: updateConfig, isPending } = useUpdateAIConfig()
  const [saved, setSaved] = useState(false)

  const isReact = config?.['rag_strategy'] === 'react'

  const toggle = useCallback(() => {
    const next = isReact ? 'baseline' : 'react'
    updateConfig(
      { rag_strategy: next },
      {
        onSuccess: () => {
          setSaved(true)
          setTimeout(() => setSaved(false), 2500)
        },
      }
    )
  }, [isReact, updateConfig])

  // 解析 orchestrator 模型
  let orchestratorModel = '@cf/meta/llama-4-scout-17b-16e-instruct'
  try {
    const models = JSON.parse(config?.['react_models'] ?? '{}') as Record<
      string,
      { model?: string }
    >
    if (models.orchestrator?.model) orchestratorModel = models.orchestrator.model
  } catch {
    /* fallback */
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-wb-20 bg-white px-5 py-4">
        <Loader2 className="h-4 w-4 animate-spin text-wb-40" />
        <span className="text-sm text-wb-50">載入設定中…</span>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-wb-20 bg-white overflow-hidden">
      <div className="border-b border-wb-10 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot className="h-5 w-5 text-wb-60" />
          <div>
            <h2 className="text-sm font-semibold text-wb-100">React Agent 狀態</h2>
            <p className="mt-0.5 text-xs text-wb-50">當前 RAG 策略設定</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600">
              <CheckCircle className="h-4 w-4" />
              已套用
            </span>
          )}
          <button
            onClick={toggle}
            disabled={isPending}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
              isReact
                ? 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-100'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Power className="h-4 w-4" />
            )}
            {isReact ? '停用 React Agent' : '啟用 React Agent'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 divide-x divide-wb-10">
        <StatCell
          label="目前策略"
          value={config?.['rag_strategy'] ?? 'baseline'}
          accent={isReact ? 'emerald' : 'gray'}
        />
        <StatCell label="最大 Turn 數" value={config?.['react_max_turns'] ?? '3'} mono />
        <StatCell label="Token 預算" value={config?.['react_token_budget'] ?? '8000'} mono />
        <StatCell
          label="Orchestrator 模型"
          value={orchestratorModel.split('/').pop() ?? orchestratorModel}
          mono
          title={orchestratorModel}
        />
      </div>
    </div>
  )
}

function StatCell({
  label,
  value,
  accent,
  mono,
  title,
}: {
  label: string
  value: string
  accent?: 'emerald' | 'gray'
  mono?: boolean
  title?: string
}) {
  return (
    <div className="px-5 py-4">
      <p className="text-xs text-wb-50">{label}</p>
      <p
        className={`mt-1 text-sm font-semibold truncate ${
          accent === 'emerald'
            ? 'text-emerald-600'
            : accent === 'gray'
              ? 'text-wb-50'
              : 'text-wb-100'
        } ${mono ? 'font-mono' : ''}`}
        title={title}
      >
        {value}
      </p>
    </div>
  )
}

// =============================================
// React Trace 顯示
// =============================================

interface ReactTraceProps {
  logId: string
}

function ReactTrace({ logId }: ReactTraceProps) {
  const { data: log, isLoading } = useAILogDetail(logId)
  const [expanded, setExpanded] = useState(true)

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-wb-50">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        載入 trace…
      </div>
    )
  }

  const pt = log?.pipeline_trace
  const isReact = pt?.strategy === 'react'
  const strategy = pt?.strategy ?? log?.pipeline?.query_parsing?.query_type ?? '—'

  return (
    <div className="rounded-xl border border-wb-20 bg-white overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-wb-05 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-wb-50" />
          <span className="text-sm font-medium text-wb-80">執行 Trace</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              isReact ? 'bg-emerald-100 text-emerald-700' : 'bg-wb-10 text-wb-60'
            }`}
          >
            {strategy}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/admin/ai/logs/${logId}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-xs text-wb-50 hover:text-wb-80 transition-colors"
          >
            完整日誌
            <ExternalLink className="h-3 w-3" />
          </a>
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-wb-40" />
          ) : (
            <ChevronRight className="h-4 w-4 text-wb-40" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-wb-10 px-5 py-4 space-y-4">
          {isReact ? (
            <>
              {/* ReAct 核心指標 */}
              <div className="grid grid-cols-3 gap-3">
                <TraceMetric
                  label="Turn 數"
                  value={String(pt?.turn_count ?? '—')}
                  desc="orchestrator 呼叫次數"
                />
                <TraceMetric
                  label="Tool 呼叫"
                  value={String(pt?.tool_call_count ?? '—')}
                  desc="工具執行次數"
                />
                <TraceMetric
                  label="總延遲"
                  value={log?.latency?.total_ms ? `${log.latency.total_ms}ms` : '—'}
                  desc="end-to-end"
                />
              </div>

              {/* Per Model Stats */}
              {pt?.per_model_stats && pt.per_model_stats.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium text-wb-60">各模型用量</p>
                  <div className="rounded-lg border border-wb-15 overflow-hidden">
                    <div className="grid grid-cols-[1fr_80px_80px_90px_90px] gap-0 bg-wb-05 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-wb-50">
                      <span>模型</span>
                      <span className="text-right">Input</span>
                      <span className="text-right">Output</span>
                      <span className="text-right">USD</span>
                      <span className="text-right">TWD</span>
                    </div>
                    <div className="divide-y divide-wb-10">
                      {pt.per_model_stats.map((s, i) => (
                        <div
                          key={i}
                          className="grid grid-cols-[1fr_80px_80px_90px_90px] gap-0 px-4 py-2.5 text-xs items-center"
                        >
                          <div>
                            <p className="font-mono text-wb-80 truncate" title={s.model}>
                              {s.model.split('/').pop() ?? s.model}
                            </p>
                            <p className="text-[10px] text-wb-40">{s.provider}</p>
                          </div>
                          <span className="text-right font-mono text-wb-70">
                            {s.prompt_tokens.toLocaleString()}
                          </span>
                          <span className="text-right font-mono text-wb-70">
                            {s.completion_tokens.toLocaleString()}
                          </span>
                          <span className="text-right font-mono text-wb-70">
                            ${s.cost_usd.toFixed(6)}
                          </span>
                          <span className="text-right font-mono text-wb-70">
                            NT${s.cost_twd.toFixed(4)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            // 非 react 策略
            <div className="grid grid-cols-3 gap-3">
              <TraceMetric
                label="查詢類型"
                value={log?.pipeline?.query_parsing?.query_type ?? '—'}
                desc="query type"
              />
              <TraceMetric
                label="Token"
                value={log?.pipeline?.generation?.token_count?.toLocaleString() ?? '—'}
                desc="total tokens"
              />
              <TraceMetric
                label="延遲"
                value={log?.latency?.total_ms ? `${log.latency.total_ms}ms` : '—'}
                desc="end-to-end"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TraceMetric({ label, value, desc }: { label: string; value: string; desc: string }) {
  return (
    <div className="rounded-lg border border-wb-10 bg-wb-05 px-4 py-3">
      <p className="text-xs text-wb-50">{label}</p>
      <p className="mt-1 text-base font-bold font-mono text-wb-100">{value}</p>
      <p className="mt-0.5 text-[10px] text-wb-40">{desc}</p>
    </div>
  )
}

// =============================================
// 測試查詢面板
// =============================================

interface QueryResult {
  answer: string
  logId: string | null
}

function TestQueryPanel() {
  const [query, setQuery] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<QueryResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleRun = useCallback(async () => {
    if (!query.trim() || isRunning) return
    setIsRunning(true)
    setResult(null)
    setError(null)

    try {
      const res = await askAI({ query: query.trim(), no_cache: true })
      setResult({
        answer: res.answer,
        logId: res.query_id ?? null,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '查詢失敗，請稍後再試')
    } finally {
      setIsRunning(false)
    }
  }, [query, isRunning])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      void handleRun()
    }
  }

  const handleReset = () => {
    setQuery('')
    setResult(null)
    setError(null)
    textareaRef.current?.focus()
  }

  return (
    <div className="space-y-4">
      {/* 輸入區 */}
      <div className="rounded-xl border border-wb-20 bg-white overflow-hidden">
        <div className="border-b border-wb-10 px-5 py-4">
          <h2 className="text-sm font-semibold text-wb-100">測試查詢</h2>
          <p className="mt-0.5 text-xs text-wb-50">
            以管理員身份直接呼叫 AI 問答 API，不受配額限制。按 ⌘Enter 送出。
          </p>
        </div>
        <div className="px-5 py-4 space-y-3">
          <textarea
            ref={textareaRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="例如：台灣有哪些適合初學者的攀岩路線？"
            rows={3}
            className="w-full rounded-lg border border-wb-20 bg-white px-3 py-2.5 text-sm text-wb-100 placeholder:text-wb-40 outline-none focus:border-wb-50 focus:ring-1 focus:ring-wb-50 transition-colors resize-none"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-wb-40">{query.length > 0 && `${query.length} 字元`}</p>
            <div className="flex items-center gap-2">
              {(result || error) && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 rounded-lg border border-wb-20 px-3 py-2 text-sm text-wb-60 hover:bg-wb-05 transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  重置
                </button>
              )}
              <button
                onClick={handleRun}
                disabled={!query.trim() || isRunning}
                className="flex items-center gap-2 rounded-xl bg-wb-100 px-5 py-2 text-sm font-medium text-white hover:bg-wb-90 disabled:opacity-40 transition-colors"
              >
                {isRunning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {isRunning ? '執行中…' : '執行查詢'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 錯誤 */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm font-medium text-red-700">查詢失敗</p>
          <p className="mt-1 text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* 結果 */}
      {result && (
        <div className="space-y-4">
          {/* 回答 */}
          <div className="rounded-xl border border-wb-20 bg-white overflow-hidden">
            <div className="border-b border-wb-10 px-5 py-3 flex items-center gap-2">
              <Bot className="h-4 w-4 text-wb-50" />
              <span className="text-sm font-medium text-wb-80">回答</span>
            </div>
            <div className="px-5 py-4">
              <p className="whitespace-pre-wrap text-sm text-wb-90 leading-relaxed">
                {result.answer}
              </p>
            </div>
          </div>

          {/* Trace */}
          {result.logId && <ReactTrace logId={result.logId} />}
        </div>
      )}
    </div>
  )
}

// =============================================
// Main Page
// =============================================

export default function ReactAgentPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-wb-100">React Agent</h1>
        <p className="mt-1 text-sm text-wb-60">
          啟用 / 停用 React Agent 策略，並在此直接測試查詢效果
        </p>
      </div>

      <StatusPanel />
      <TestQueryPanel />
    </div>
  )
}
