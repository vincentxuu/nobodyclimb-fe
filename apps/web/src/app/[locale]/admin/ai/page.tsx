'use client'

import { useEffect, useMemo, useState } from 'react'
import { todayTaipei } from '@/lib/utils'
import {
  Clock,
  ThumbsUp,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Loader2,
  Zap,
  RefreshCw,
} from 'lucide-react'
import { useAIDashboard, useAIConfig, useAIStats, DEFAULT_COST_PROVIDERS, type CostProvider } from '@/lib/api/admin-ai'

// Cloudflare Workers AI 定價（gemma-3-12b-it）
// 31,371 input + 50,560 output Neurons / 百萬 tokens
// 假設 input:output ≈ 40:60
const NEURONS_PER_TOKEN = (0.4 * 31.371 + 0.6 * 50.560) / 1000 // ≈ 0.0429
const FREE_TIER_NEURONS = 10_000
const COST_PER_1K_NEURONS = 0.011 // USD
// 儀表板費用對照使用固定 40:60 比例（與 Neurons 估算一致）
const DASHBOARD_INPUT_RATIO = 0.4

function estimateNeurons(tokens: number) {
  return Math.round(tokens * NEURONS_PER_TOKEN)
}

function formatTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

function useResetCountdown() {
  const [countdown, setCountdown] = useState('')

  useEffect(() => {
    const update = () => {
      const now = new Date()
      const reset = new Date()
      reset.setUTCHours(24, 0, 0, 0)
      const diff = reset.getTime() - now.getTime()
      const h = Math.floor(diff / 3_600_000)
      const m = Math.floor((diff % 3_600_000) / 60_000)
      const s = Math.floor((diff % 60_000) / 1_000)
      setCountdown(`${h}h ${m}m ${s}s`)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  return countdown
}

function KPICard({
  title,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  title: string
  value: string
  sub?: string
  icon: React.ElementType
  accent?: string
}) {
  return (
    <div className="rounded-xl border border-wb-20 bg-white p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm text-wb-60">{title}</p>
        <span className={`rounded-lg p-1.5 ${accent ?? 'bg-wb-10'}`}>
          <Icon className="h-4 w-4 text-wb-60" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-wb-100">{value}</p>
      {sub && <p className="mt-1 text-xs text-wb-50">{sub}</p>}
    </div>
  )
}

function MiniChart({
  title,
  bars,
  color,
}: {
  title: string
  bars: { label: string; value: number; display: string }[]
  color: string
}) {
  const max = Math.max(...bars.map((b) => b.value), 1)
  return (
    <div className="rounded-xl border border-wb-20 bg-white p-5">
      <h2 className="mb-5 text-sm font-semibold text-wb-100">{title}</h2>
      {bars.length > 0 ? (
        <div className="flex items-end gap-2 h-32">
          {bars.map((b) => (
            <div key={b.label} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="text-xs font-medium text-wb-60">{b.display}</span>
              <div
                className={`w-full rounded-t-md min-h-[4px] transition-all ${color}`}
                style={{ height: `${Math.max(4, (b.value / max) * 96)}px` }}
              />
              <span className="text-[10px] text-wb-50 truncate w-full text-center">{b.label}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-32 text-sm text-wb-50">尚無資料</div>
      )}
    </div>
  )
}

function calcProviderCost(inputTokens: number, outputTokens: number, provider: CostProvider): number {
  return (inputTokens * provider.input_per_1m + outputTokens * provider.output_per_1m) / 1_000_000
}

function formatUSD(val: number): string {
  if (val < 0.000001) return '$0.000000'
  if (val < 0.001) return `$${val.toFixed(6)}`
  if (val < 1) return `$${val.toFixed(4)}`
  return `$${val.toFixed(2)}`
}

function formatNTD(val: number): string {
  return `NT$${(val * 32).toFixed(2)}`
}

export default function AdminAIPage() {
  const { data, isLoading, error } = useAIDashboard()
  const { data: aiConfig } = useAIConfig()
  const countdown = useResetCountdown()
  const today = useMemo(() => todayTaipei(), [])
  const { data: todayStats } = useAIStats({ from: today, to: today })

  const providers = useMemo<CostProvider[]>(() => {
    try {
      const raw = aiConfig?.['cost_providers']
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch { /* ignore */ }
    return DEFAULT_COST_PROVIDERS
  }, [aiConfig])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-wb-40" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
        載入 KPI 資料失敗，請稍後再試。
      </div>
    )
  }

  const neuronsToday = estimateNeurons(data.tokens_today ?? 0)
  const neuronsTotal = estimateNeurons(data.total_tokens ?? 0)
  const usageRatio = Math.min(neuronsToday / FREE_TIER_NEURONS, 1)
  const remaining = Math.max(FREE_TIER_NEURONS - neuronsToday, 0)
  const estimatedCostToday = (neuronsToday / 1000) * COST_PER_1K_NEURONS

  const isWarning = usageRatio >= 0.7
  const isDanger = usageRatio >= 0.9

  const barColor = isDanger
    ? 'bg-red-500'
    : isWarning
    ? 'bg-amber-400'
    : 'bg-emerald-400'

  const textColor = isDanger
    ? 'text-red-600'
    : isWarning
    ? 'text-amber-600'
    : 'text-emerald-600'

  const queryBars = (data.queries_weekly ?? []).map((d) => ({
    label: d.day.slice(5),
    value: d.count,
    display: String(d.count),
  }))

  const neuronBars = (data.tokens_weekly ?? []).map((d) => ({
    label: d.day.slice(5),
    value: estimateNeurons(d.tokens),
    display: formatTokens(estimateNeurons(d.tokens)),
  }))

  return (
    <div className="space-y-6">
      {/* 頁首 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-wb-100">AI 助理儀表板</h1>
          <p className="mt-1 text-sm text-wb-60">查詢統計、Neurons 用量與費用估算</p>
        </div>
        {data.health.status === 'healthy' ? (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 border border-emerald-200">
            <CheckCircle className="h-3.5 w-3.5" />
            服務正常
          </span>
        ) : (
          <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200">
            <AlertCircle className="h-3.5 w-3.5" />
            服務異常
          </span>
        )}
      </div>

      {/* 今日免費額度 */}
      <div className="rounded-xl border border-wb-20 bg-white p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-wb-100">今日免費額度（10,000 Neurons / 天）</h2>
            <p className="mt-0.5 text-xs text-wb-50">每日 UTC 00:00 重置・基於 gemma-3-12b-it 費率估算，以 AI Gateway 為準</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-wb-50">
            <RefreshCw className="h-3 w-3" />
            {countdown} 後重置
          </div>
        </div>

        {/* 進度條 */}
        <div className="h-3 w-full rounded-full bg-wb-10 overflow-hidden mb-3">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${usageRatio * 100}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5">
            <Zap className={`h-4 w-4 ${textColor}`} />
            <span className={`font-semibold ${textColor}`}>
              {neuronsToday.toLocaleString()} Neurons 已用
            </span>
            <span className="text-wb-50">（{(usageRatio * 100).toFixed(1)}%）</span>
          </div>
          <span className="text-wb-60">
            剩餘 <span className="font-medium text-wb-100">{remaining.toLocaleString()}</span> Neurons
          </span>
        </div>

        {/* 費用估算 */}
        <div className="mt-4 flex flex-wrap gap-4 border-t border-wb-10 pt-4 text-xs text-wb-60">
          <span>
            今日估算費用：
            <span className="font-medium text-wb-90 ml-1">
              {estimatedCostToday < 0.001 ? '< $0.001' : `$${estimatedCostToday.toFixed(4)}`} USD
            </span>
          </span>
          <span>
            累計 Neurons：
            <span className="font-medium text-wb-90 ml-1">{neuronsTotal.toLocaleString()}</span>
          </span>
          <span>
            累計 Token：
            <span className="font-medium text-wb-90 ml-1">{formatTokens(data.total_tokens ?? 0)}</span>
          </span>
        </div>

        {isDanger && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            今日用量已達 90%，超出後每 1,000 Neurons 收費 $0.011 USD（需 Workers Paid 方案）
          </div>
        )}
        {isWarning && !isDanger && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            今日用量已達 70%，請留意剩餘額度
          </div>
        )}
      </div>

      {/* 今日費用對照（各供應商） */}
      {(() => {
        const todayTokens = data.tokens_today ?? 0
        const useExact = todayStats && todayStats.trace_count > 0
        const inputTokens = useExact
          ? todayStats.total_prompt_tokens
          : Math.round(todayTokens * DASHBOARD_INPUT_RATIO)
        const outputTokens = useExact
          ? todayStats.total_completion_tokens
          : todayTokens - Math.round(todayTokens * DASHBOARD_INPUT_RATIO)
        const rows = providers
          .map((p) => ({ p, usd: calcProviderCost(inputTokens, outputTokens, p) }))
          .sort((a, b) => a.usd - b.usd)
        const cheapest = rows[0]?.usd ?? Infinity

        return (
          <div className="rounded-xl border border-wb-20 bg-white p-5">
            <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
              <div>
                <h2 className="text-sm font-semibold text-wb-100">今日費用對照</h2>
                <p className="mt-0.5 text-xs text-wb-50">
                  {useExact
                    ? `Input ${inputTokens.toLocaleString()} / Output ${outputTokens.toLocaleString()} tokens（實際分拆）`
                    : '基於 40% input / 60% output 估算，詳細分拆請見費用估算頁'}
                </p>
              </div>
              <span className="text-xs text-wb-40">
                今日 {todayTokens.toLocaleString()} tokens
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-separate border-spacing-0">
                <thead>
                  <tr className="text-wb-40 text-xs">
                    <th className="text-left py-2 px-3 font-medium">供應商</th>
                    <th className="text-right py-2 px-3 font-medium">今日 USD</th>
                    <th className="text-right py-2 px-3 font-medium">今日 NT$</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ p, usd }) => {
                    const isCheapest = usd <= cheapest
                    return (
                      <tr
                        key={p.id}
                        className={`border-t border-wb-10 ${isCheapest ? 'bg-emerald-50/50' : 'hover:bg-wb-5'}`}
                      >
                        <td className={`py-2 px-3 font-medium text-sm ${isCheapest ? 'text-emerald-700' : 'text-wb-70'}`}>
                          {p.name}
                          {isCheapest && (
                            <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                              最便宜
                            </span>
                          )}
                        </td>
                        <td className={`py-2 px-3 text-right font-mono text-sm ${isCheapest ? 'text-emerald-700 font-medium' : 'text-wb-70'}`}>
                          {formatUSD(usd)}
                        </td>
                        <td className={`py-2 px-3 text-right font-mono text-xs ${isCheapest ? 'text-emerald-600' : 'text-wb-50'}`}>
                          {formatNTD(usd)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      })()}

      {/* KPI 卡片 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KPICard
          title="總查詢次數"
          value={data.total_queries.toLocaleString()}
          sub={`今日 ${data.queries_today} 次`}
          icon={MessageSquare}
          accent="bg-blue-50"
        />
        <KPICard
          title="平均延遲"
          value={data.avg_latency_ms != null ? `${data.avg_latency_ms} ms` : '—'}
          sub="過去 7 天"
          icon={Clock}
          accent="bg-amber-50"
        />
        <KPICard
          title="正向回饋率"
          value={data.success_rate != null ? `${(data.success_rate * 100).toFixed(1)}%` : '—'}
          sub="評分 ≥ 4 / 總回饋"
          icon={ThumbsUp}
          accent="bg-emerald-50"
        />
      </div>

      {/* 趨勢圖 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MiniChart title="過去 7 天查詢量" bars={queryBars} color="bg-blue-400" />
        <MiniChart title="過去 7 天 Neurons 用量（估算）" bars={neuronBars} color="bg-purple-400" />
      </div>

      {/* 熱門查詢 */}
      <div className="rounded-xl border border-wb-20 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-wb-100">熱門查詢（過去 7 天）</h2>
        {data.top_queries && data.top_queries.length > 0 ? (
          <ol className="divide-y divide-wb-10">
            {data.top_queries.slice(0, 8).map((item, idx) => (
              <li key={idx} className="flex items-center gap-3 py-2.5 text-sm">
                <span className="w-5 shrink-0 text-right text-xs font-medium text-wb-40">
                  {idx + 1}
                </span>
                <span className="flex-1 truncate text-wb-80">{item.query}</span>
                <span className="shrink-0 rounded-md bg-wb-10 px-2 py-0.5 text-xs text-wb-60">
                  {item.count} 次
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <div className="flex items-center justify-center h-16 text-sm text-wb-50">尚無資料</div>
        )}
      </div>
    </div>
  )
}
