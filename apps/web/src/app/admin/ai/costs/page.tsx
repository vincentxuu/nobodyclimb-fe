'use client'

import { useState, useMemo } from 'react'
import { todayTaipei } from '@/lib/utils'
import { Loader2, TrendingDown, Zap, Database, BarChart2, ChevronDown, ChevronUp, DollarSign, ArrowRight, Info } from 'lucide-react'
import { useAIStats, useAIConfig, DEFAULT_COST_PROVIDERS, type CostProvider } from '@/lib/api/admin-ai'

// =============================================
// 工具函式
// =============================================

function calcCost(inputTokens: number, outputTokens: number, provider: CostProvider): number {
  return (inputTokens * provider.input_per_1m + outputTokens * provider.output_per_1m) / 1_000_000
}

function formatUSD(val: number): string {
  if (val < 0.001) return `$${val.toFixed(6)}`
  if (val < 1) return `$${val.toFixed(4)}`
  return `$${val.toFixed(2)}`
}

function formatNTD(val: number): string {
  return `NT$${(val * 32).toFixed(2)}`
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}

// =============================================
// 日期工具
// =============================================

function todayStr(): string {
  return todayTaipei()
}

function daysAgoStr(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' })
}

type RangePreset = 'today' | '7d' | '30d' | '90d' | 'custom'

// =============================================
// 摘要卡片
// =============================================

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-wb-15 bg-wb-5 p-4 flex flex-col gap-1.5">
      <div className="flex items-center gap-2 text-wb-50">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-2xl font-semibold text-wb-90">{value}</div>
      {sub && <div className="text-xs text-wb-40">{sub}</div>}
    </div>
  )
}

// =============================================
// 供應商費用表格（使用實際 prompt/completion tokens）
// =============================================

function CostTable({
  providers,
  promptTokens,
  completionTokens,
}: {
  providers: CostProvider[]
  promptTokens: number
  completionTokens: number
}) {
  const rows = useMemo(() => {
    return providers
      .map((p) => ({ p, usd: calcCost(promptTokens, completionTokens, p) }))
      .sort((a, b) => a.usd - b.usd)
  }, [providers, promptTokens, completionTokens])

  const cheapest = rows[0]?.usd ?? Infinity

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-separate border-spacing-0">
        <thead>
          <tr className="text-wb-40 text-xs">
            <th className="text-left py-2 px-3 font-medium">供應商</th>
            <th className="text-right py-2 px-3 font-medium">Input /1M</th>
            <th className="text-right py-2 px-3 font-medium">Output /1M</th>
            <th className="text-right py-2 px-3 font-medium">合計 USD</th>
            <th className="text-right py-2 px-3 font-medium">合計 NT$</th>
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
                <td className={`py-2.5 px-3 font-medium ${isCheapest ? 'text-emerald-700' : 'text-wb-80'}`}>
                  {p.name}
                  {isCheapest && (
                    <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                      最便宜
                    </span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-right text-wb-60 font-mono text-xs">
                  ${p.input_per_1m}
                </td>
                <td className="py-2.5 px-3 text-right text-wb-60 font-mono text-xs">
                  ${p.output_per_1m}
                </td>
                <td className={`py-2.5 px-3 text-right font-mono font-medium ${isCheapest ? 'text-emerald-700' : 'text-wb-80'}`}>
                  {formatUSD(usd)}
                </td>
                <td className={`py-2.5 px-3 text-right font-mono text-xs ${isCheapest ? 'text-emerald-600' : 'text-wb-50'}`}>
                  {formatNTD(usd)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// =============================================
// 模擬計算區塊（分開輸入 input / output tokens）
// =============================================

function SimulationSection({
  providers,
  defaultInputTokens,
  defaultOutputTokens,
}: {
  providers: CostProvider[]
  defaultInputTokens: number
  defaultOutputTokens: number
}) {
  const [simInputTokens, setSimInputTokens] = useState<number>(defaultInputTokens)
  const [simOutputTokens, setSimOutputTokens] = useState<number>(defaultOutputTokens)

  const rows = useMemo(() => {
    return providers
      .map((p) => ({ p, usd: calcCost(simInputTokens, simOutputTokens, p) }))
      .sort((a, b) => a.usd - b.usd)
  }, [providers, simInputTokens, simOutputTokens])

  const cheapest = rows[0]?.usd ?? Infinity

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-wb-50 block mb-1.5">預計 Input tokens</label>
          <input
            type="number"
            min={0}
            value={simInputTokens}
            onChange={(e) => setSimInputTokens(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full rounded-lg border border-wb-20 bg-transparent px-3 py-2 text-sm text-wb-90 focus:outline-none focus:ring-1 focus:ring-wb-40"
          />
        </div>
        <div>
          <label className="text-xs text-wb-50 block mb-1.5">預計 Output tokens</label>
          <input
            type="number"
            min={0}
            value={simOutputTokens}
            onChange={(e) => setSimOutputTokens(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full rounded-lg border border-wb-20 bg-transparent px-3 py-2 text-sm text-wb-90 focus:outline-none focus:ring-1 focus:ring-wb-40"
          />
        </div>
      </div>

      <div className="text-xs text-wb-40">
        預估總 tokens：{formatNumber(simInputTokens + simOutputTokens)}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-separate border-spacing-0">
          <thead>
            <tr className="text-wb-40 text-xs">
              <th className="text-left py-2 px-3 font-medium">供應商</th>
              <th className="text-right py-2 px-3 font-medium">預估 USD</th>
              <th className="text-right py-2 px-3 font-medium">預估 NT$</th>
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
                  <td className={`py-2 px-3 font-medium ${isCheapest ? 'text-emerald-700' : 'text-wb-80'}`}>
                    {p.name}
                    {isCheapest && (
                      <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                        最便宜
                      </span>
                    )}
                  </td>
                  <td className={`py-2 px-3 text-right font-mono font-medium ${isCheapest ? 'text-emerald-700' : 'text-wb-80'}`}>
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
}

// =============================================
// 主頁面
// =============================================

export default function AICostsPage() {
  const [preset, setPreset] = useState<RangePreset>('30d')
  const [customFrom, setCustomFrom] = useState(daysAgoStr(30))
  const [customTo, setCustomTo] = useState(todayStr())
  const [showSim, setShowSim] = useState(false)

  // 計算實際的 from / to
  const { from, to } = useMemo(() => {
    if (preset === 'today') return { from: todayStr(), to: todayStr() }
    if (preset === '7d')    return { from: daysAgoStr(7), to: todayStr() }
    if (preset === '30d')   return { from: daysAgoStr(30), to: todayStr() }
    if (preset === '90d')   return { from: daysAgoStr(90), to: todayStr() }
    return { from: customFrom, to: customTo }
  }, [preset, customFrom, customTo])

  const { data: stats, isLoading: statsLoading } = useAIStats({ from, to })
  const { data: aiConfig } = useAIConfig()

  // 解析供應商
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

  const cacheHitRate = stats
    ? stats.total_queries > 0
      ? ((stats.cache_hits / stats.total_queries) * 100).toFixed(1) + '%'
      : '0%'
    : '–'

  // 精確 prompt / completion tokens（若無 trace 則回退到 total_tokens 的 40/60）
  const promptTokens = stats
    ? stats.trace_count > 0
      ? stats.total_prompt_tokens
      : Math.round(stats.total_tokens * 0.4)
    : 0

  const completionTokens = stats
    ? stats.trace_count > 0
      ? stats.total_completion_tokens
      : stats.total_tokens - Math.round(stats.total_tokens * 0.4)
    : 0

  const hasPartialTrace = stats
    ? stats.trace_count > 0 && stats.trace_count < stats.total_queries
    : false

  const PRESETS: { key: RangePreset; label: string }[] = [
    { key: 'today', label: '今日' },
    { key: '7d', label: '7 天' },
    { key: '30d', label: '30 天' },
    { key: '90d', label: '90 天' },
    { key: 'custom', label: '自訂' },
  ]

  return (
    <div className="space-y-6">
      {/* A. 時間區間選擇 */}
      <div className="rounded-xl border border-wb-15 bg-wb-3 p-4 space-y-3">
        <div className="text-sm font-medium text-wb-70">時間區間</div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPreset(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                preset === key
                  ? 'bg-wb-90 text-wb-5'
                  : 'bg-wb-8 text-wb-60 hover:bg-wb-12'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {preset === 'custom' && (
          <div className="flex gap-3 flex-wrap">
            <div>
              <label className="text-xs text-wb-40 block mb-1">開始日期</label>
              <input
                type="date"
                value={customFrom}
                max={customTo}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="rounded-lg border border-wb-20 bg-transparent px-3 py-1.5 text-sm text-wb-80 focus:outline-none focus:ring-1 focus:ring-wb-40"
              />
            </div>
            <div>
              <label className="text-xs text-wb-40 block mb-1">結束日期</label>
              <input
                type="date"
                value={customTo}
                min={customFrom}
                max={todayStr()}
                onChange={(e) => setCustomTo(e.target.value)}
                className="rounded-lg border border-wb-20 bg-transparent px-3 py-1.5 text-sm text-wb-80 focus:outline-none focus:ring-1 focus:ring-wb-40"
              />
            </div>
          </div>
        )}
        <div className="text-xs text-wb-40">
          {from} ～ {to}
        </div>
      </div>

      {/* B. 用量摘要卡片 */}
      {statsLoading ? (
        <div className="flex items-center gap-2 text-wb-40 text-sm py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          載入統計中...
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            icon={<BarChart2 className="h-4 w-4" />}
            label="查詢次數"
            value={formatNumber(stats.total_queries)}
          />
          <StatCard
            icon={<Zap className="h-4 w-4" />}
            label="Input tokens"
            value={formatNumber(promptTokens)}
            sub={stats.trace_count > 0 ? '實際數據' : '40% 估算'}
          />
          <StatCard
            icon={<ArrowRight className="h-4 w-4" />}
            label="Output tokens"
            value={formatNumber(completionTokens)}
            sub={stats.trace_count > 0 ? '實際數據' : '60% 估算'}
          />
          <StatCard
            icon={<Database className="h-4 w-4" />}
            label="快取命中率"
            value={cacheHitRate}
            sub={`${formatNumber(stats.cache_hits)} 次命中`}
          />
        </div>
      ) : (
        <div className="text-wb-40 text-sm py-4">無法取得統計資料</div>
      )}

      {/* B2. 平均每查詢 tokens（獨立顯示） */}
      {stats && (
        <div className="flex items-center gap-3 text-xs text-wb-40 -mt-3">
          <TrendingDown className="h-3.5 w-3.5" />
          平均每查詢 tokens：<span className="text-wb-60 font-medium">{formatNumber(stats.avg_tokens)}</span>
        </div>
      )}

      {/* B3. 部分舊記錄提示 */}
      {hasPartialTrace && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-700">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            部分舊記錄無詳細 token 分拆（共 {formatNumber(stats!.trace_count)} / {formatNumber(stats!.total_queries)} 筆有詳細資料），費用數據已略過無 trace 的記錄。
          </span>
        </div>
      )}

      {/* C. 供應商費用對照表 */}
      <div className="rounded-xl border border-wb-15 bg-wb-3 p-4 space-y-4">
        <div>
          <div className="text-sm font-medium text-wb-70">供應商費用對照</div>
          <div className="text-xs text-wb-40 mt-0.5">
            基於 {stats ? `Input ${formatNumber(promptTokens)} + Output ${formatNumber(completionTokens)}` : '–'} tokens
            {stats && stats.trace_count > 0 ? '（實際分拆）' : stats ? '（40/60 估算）' : ''}
          </div>
        </div>

        {stats && (promptTokens + completionTokens) > 0 ? (
          <CostTable
            providers={providers}
            promptTokens={promptTokens}
            completionTokens={completionTokens}
          />
        ) : (
          <div className="text-wb-40 text-sm py-4 text-center">
            {statsLoading ? '載入中...' : '此區間無 token 資料'}
          </div>
        )}
      </div>

      {/* D. 模擬計算（可 toggle） */}
      <div className="rounded-xl border border-wb-15 bg-wb-3 overflow-hidden">
        <button
          onClick={() => setShowSim((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-wb-70 hover:bg-wb-5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            未來費用模擬
          </div>
          {showSim ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {showSim && (
          <div className="px-4 pb-4 border-t border-wb-10">
            <div className="py-3 text-xs text-wb-40 mb-2">
              分別輸入預計 Input / Output tokens，即時試算各供應商費用。
            </div>
            <SimulationSection
              providers={providers}
              defaultInputTokens={promptTokens}
              defaultOutputTokens={completionTokens}
            />
          </div>
        )}
      </div>
    </div>
  )
}
