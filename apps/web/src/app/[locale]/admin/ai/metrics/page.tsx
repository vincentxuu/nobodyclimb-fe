'use client'

import { AlertTriangle, Clock, Database, Loader2, Shield, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { type MetricsDaily, type MetricsRange, useAIMetrics } from '@/lib/api/admin-ai'

// =============================================
// 常數
// =============================================

const RANGE_OPTIONS: { value: MetricsRange; label: string }[] = [
  { value: '7d', label: '7 天' },
  { value: '30d', label: '30 天' },
  { value: '90d', label: '90 天' },
]

const LATENCY_COLORS: Record<string, string> = {
  embedding_p50: '#10b981',
  embedding_p95: '#6ee7b4',
  retrieval_p50: '#3b82f6',
  retrieval_p95: '#93c5fd',
  generation_p50: '#f59e0b',
  generation_p95: '#fcd34d',
}

const QUALITY_COLORS: Record<string, string> = {
  avg_groundedness: '#10b981',
  avg_auto_score: '#3b82f6',
  avg_feedback_score: '#f59e0b',
}

const QUERY_TYPE_COLORS: Record<string, string> = {
  simple: '#10b981',
  complex: '#3b82f6',
  'general-knowledge': '#f59e0b',
  guardrails_blocked: '#ef4444',
}

const QUERY_TYPE_LABELS: Record<string, string> = {
  simple: '簡單',
  complex: '複雜',
  'general-knowledge': '通識',
  guardrails_blocked: '攔截',
}

// =============================================
// SVG 圖表元件
// =============================================

function MiniLineChart({
  data,
  lines,
  colors,
  labels,
  yDomain,
  height = 200,
  anomalyPrefix,
  formatY = (v: number) => String(Math.round(v)),
}: {
  data: MetricsDaily[]
  lines: string[]
  colors: Record<string, string>
  labels: Record<string, string>
  yDomain?: [number, number]
  height?: number
  anomalyPrefix?: string
  formatY?: (_v: number) => string
}) {
  const W = 600
  const H = height
  const PAD = { top: 20, right: 20, bottom: 40, left: 50 }
  const cw = W - PAD.left - PAD.right
  const ch = H - PAD.top - PAD.bottom

  // 取值函式
  const getValue = (d: MetricsDaily, key: string): number | null => {
    const parts = key.split('.')
    let obj: Record<string, unknown> = d as unknown as Record<string, unknown>
    for (const p of parts) {
      if (obj == null || typeof obj !== 'object') return null
      obj = (obj as Record<string, unknown>)[p] as Record<string, unknown>
    }
    return typeof obj === 'number' ? obj : null
  }

  // 計算 Y 軸範圍
  let yMin = yDomain?.[0] ?? Infinity
  let yMax = yDomain?.[1] ?? -Infinity
  if (!yDomain) {
    for (const d of data) {
      for (const key of lines) {
        const v = getValue(d, key)
        if (v != null) {
          yMin = Math.min(yMin, v)
          yMax = Math.max(yMax, v)
        }
      }
    }
    if (yMin === Infinity) {
      yMin = 0
      yMax = 1
    }
    const pad = (yMax - yMin) * 0.1 || 1
    yMin = Math.max(0, yMin - pad)
    yMax = yMax + pad
  }

  const xScale = (i: number) => PAD.left + (data.length > 1 ? (i / (data.length - 1)) * cw : cw / 2)
  const yScale = (v: number) => PAD.top + ch - ((v - yMin) / (yMax - yMin)) * ch

  // 生成折線 path
  const buildPath = (key: string) => {
    const segments: string[] = []
    let drawing = false
    for (let i = 0; i < data.length; i++) {
      const v = getValue(data[i], key)
      if (v == null) {
        drawing = false
        continue
      }
      const x = xScale(i)
      const y = yScale(v)
      segments.push(drawing ? `L${x},${y}` : `M${x},${y}`)
      drawing = true
    }
    return segments.join(' ')
  }

  // X 軸標籤（最多顯示 7 個）
  const step = Math.max(1, Math.floor(data.length / 7))
  const xLabels = data.filter((_, i) => i % step === 0 || i === data.length - 1)

  // Y 軸刻度（5 格）
  const yTicks = Array.from({ length: 5 }, (_, i) => yMin + ((yMax - yMin) * i) / 4)

  // 異常點
  const anomalyDots = anomalyPrefix
    ? data.flatMap(
        (d, i) =>
          d.anomalies
            .filter((a) => a.startsWith(anomalyPrefix))
            .map((a) => {
              const matchedLine = lines.find((l) => a.endsWith(l.split('.').pop() ?? ''))
              const v = matchedLine ? getValue(d, matchedLine) : null
              return v != null ? { x: xScale(i), y: yScale(v), label: a } : null
            })
            .filter(Boolean) as Array<{ x: number; y: number; label: string }>
      )
    : []

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[400px]">
        {/* Y 軸刻度 */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line
              x1={PAD.left}
              y1={yScale(t)}
              x2={W - PAD.right}
              y2={yScale(t)}
              stroke="currentColor"
              className="text-wb-10"
              strokeDasharray="4 4"
            />
            <text
              x={PAD.left - 6}
              y={yScale(t) + 4}
              textAnchor="end"
              className="text-wb-40 fill-current"
              fontSize={10}
            >
              {formatY(t)}
            </text>
          </g>
        ))}

        {/* 折線 */}
        {lines.map((key) => (
          <path
            key={key}
            d={buildPath(key)}
            fill="none"
            stroke={colors[key.split('.').pop() ?? key] ?? '#888'}
            strokeWidth={1.5}
          />
        ))}

        {/* 異常標記 */}
        {anomalyDots.map((dot, i) => (
          <circle key={i} cx={dot.x} cy={dot.y} r={4} fill="#ef4444" opacity={0.8}>
            <title>{dot.label}</title>
          </circle>
        ))}

        {/* X 軸標籤 */}
        {xLabels.map((d) => {
          const idx = data.indexOf(d)
          return (
            <text
              key={d.date}
              x={xScale(idx)}
              y={H - 8}
              textAnchor="middle"
              className="text-wb-40 fill-current"
              fontSize={9}
            >
              {d.date.slice(5)}
            </text>
          )
        })}
      </svg>

      {/* 圖例 */}
      <div className="flex flex-wrap gap-3 mt-2 px-2">
        {lines.map((key) => {
          const shortKey = key.split('.').pop() ?? key
          return (
            <div key={key} className="flex items-center gap-1.5 text-xs text-wb-50">
              <span
                className="w-3 h-0.5 rounded"
                style={{ backgroundColor: colors[shortKey] ?? '#888' }}
              />
              {labels[shortKey] ?? shortKey}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StackedBarChart({
  data,
  keys,
  colors,
  labels,
  height = 200,
}: {
  data: MetricsDaily[]
  keys: string[]
  colors: Record<string, string>
  labels: Record<string, string>
  height?: number
}) {
  const W = 600
  const H = height
  const PAD = { top: 20, right: 20, bottom: 40, left: 50 }
  const cw = W - PAD.left - PAD.right
  const ch = H - PAD.top - PAD.bottom

  const totals = data.map((d) => keys.reduce((s, k) => s + (d.query_types[k] ?? 0), 0))
  const maxTotal = Math.max(...totals, 1)

  const barW = Math.max(4, Math.min(20, cw / data.length - 2))

  const step = Math.max(1, Math.floor(data.length / 7))

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[400px]">
        {/* Y 軸 */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
          const y = PAD.top + ch * (1 - pct)
          return (
            <g key={i}>
              <line
                x1={PAD.left}
                y1={y}
                x2={W - PAD.right}
                y2={y}
                stroke="currentColor"
                className="text-wb-10"
                strokeDasharray="4 4"
              />
              <text
                x={PAD.left - 6}
                y={y + 4}
                textAnchor="end"
                className="text-wb-40 fill-current"
                fontSize={10}
              >
                {Math.round(maxTotal * pct)}
              </text>
            </g>
          )
        })}

        {/* 堆疊柱子 */}
        {data.map((d, i) => {
          const x = PAD.left + (i + 0.5) * (cw / data.length) - barW / 2
          let y = PAD.top + ch
          return (
            <g key={d.date}>
              {keys.map((k) => {
                const val = d.query_types[k] ?? 0
                const h = (val / maxTotal) * ch
                y -= h
                return (
                  <rect key={k} x={x} y={y} width={barW} height={h} fill={colors[k]} rx={1}>
                    <title>{`${d.date} ${labels[k]}: ${val}`}</title>
                  </rect>
                )
              })}
            </g>
          )
        })}

        {/* X 軸標籤 */}
        {data.map((d, i) => {
          if (i % step !== 0 && i !== data.length - 1) return null
          const x = PAD.left + (i + 0.5) * (cw / data.length)
          return (
            <text
              key={d.date}
              x={x}
              y={H - 8}
              textAnchor="middle"
              className="text-wb-40 fill-current"
              fontSize={9}
            >
              {d.date.slice(5)}
            </text>
          )
        })}
      </svg>

      <div className="flex flex-wrap gap-3 mt-2 px-2">
        {keys.map((k) => (
          <div key={k} className="flex items-center gap-1.5 text-xs text-wb-50">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: colors[k] }} />
            {labels[k]}
          </div>
        ))}
      </div>
    </div>
  )
}

function AreaChart({
  data,
  valueKey,
  color = '#10b981',
  height = 200,
  anomalyPrefix,
  formatY = (v: number) => `${Math.round(v * 100)}%`,
}: {
  data: MetricsDaily[]
  valueKey: string
  color?: string
  height?: number
  anomalyPrefix?: string
  formatY?: (_v: number) => string
}) {
  const W = 600
  const H = height
  const PAD = { top: 20, right: 20, bottom: 40, left: 50 }
  const cw = W - PAD.left - PAD.right
  const ch = H - PAD.top - PAD.bottom

  const getValue = (d: MetricsDaily): number | null => {
    const parts = valueKey.split('.')
    let obj: Record<string, unknown> = d as unknown as Record<string, unknown>
    for (const p of parts) {
      if (obj == null || typeof obj !== 'object') return null
      obj = (obj as Record<string, unknown>)[p] as Record<string, unknown>
    }
    return typeof obj === 'number' ? obj : null
  }

  const xScale = (i: number) => PAD.left + (data.length > 1 ? (i / (data.length - 1)) * cw : cw / 2)
  const yScale = (v: number) => PAD.top + ch - v * ch

  // 折線 + 面積
  const linePoints: string[] = []
  const areaDown: string[] = []
  let started = false
  for (let i = 0; i < data.length; i++) {
    const v = getValue(data[i])
    if (v == null) {
      started = false
      continue
    }
    const x = xScale(i)
    const y = yScale(v)
    linePoints.push(started ? `L${x},${y}` : `M${x},${y}`)
    areaDown.push(started ? `L${x},${y}` : `M${x},${y}`)
    started = true
  }

  // 面積底部
  let areaPath = ''
  if (areaDown.length > 0) {
    const lastValidIdx = data.length - 1 - [...data].reverse().findIndex((d) => getValue(d) != null)
    const firstValidIdx = data.findIndex((d) => getValue(d) != null)
    areaPath =
      areaDown.join(' ') +
      `L${xScale(lastValidIdx)},${PAD.top + ch}` +
      `L${xScale(firstValidIdx)},${PAD.top + ch}Z`
  }

  const step = Math.max(1, Math.floor(data.length / 7))

  // 異常點
  const anomalyDots = anomalyPrefix
    ? data.flatMap((d, i) => {
        if (!d.anomalies.some((a) => a.startsWith(anomalyPrefix))) return []
        const v = getValue(d)
        return v != null ? [{ x: xScale(i), y: yScale(v), date: d.date }] : []
      })
    : []

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[400px]">
        {/* Y 軸 */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
          const y = PAD.top + ch * (1 - pct)
          return (
            <g key={i}>
              <line
                x1={PAD.left}
                y1={y}
                x2={W - PAD.right}
                y2={y}
                stroke="currentColor"
                className="text-wb-10"
                strokeDasharray="4 4"
              />
              <text
                x={PAD.left - 6}
                y={y + 4}
                textAnchor="end"
                className="text-wb-40 fill-current"
                fontSize={10}
              >
                {formatY(pct)}
              </text>
            </g>
          )
        })}

        {/* 面積 */}
        {areaPath && <path d={areaPath} fill={color} opacity={0.15} />}

        {/* 折線 */}
        <path d={linePoints.join(' ')} fill="none" stroke={color} strokeWidth={1.5} />

        {/* 異常 */}
        {anomalyDots.map((dot, i) => (
          <circle key={i} cx={dot.x} cy={dot.y} r={4} fill="#ef4444" opacity={0.8}>
            <title>{`${dot.date} 異常`}</title>
          </circle>
        ))}

        {/* X 軸 */}
        {data.map((d, i) => {
          if (i % step !== 0 && i !== data.length - 1) return null
          return (
            <text
              key={d.date}
              x={xScale(i)}
              y={H - 8}
              textAnchor="middle"
              className="text-wb-40 fill-current"
              fontSize={9}
            >
              {d.date.slice(5)}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

// =============================================
// Summary 卡片
// =============================================

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
}) {
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
// 主頁面
// =============================================

export default function MetricsPage() {
  const [range, setRange] = useState<MetricsRange>('30d')
  const { data, isLoading, error } = useAIMetrics(range)

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-red-400 text-center">
        載入趨勢資料失敗
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 標題 + 時間範圍 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-wb-90">趨勢分析</h2>
        <div className="flex gap-1 rounded-lg border border-wb-15 p-0.5">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                range === opt.value ? 'bg-wb-15 text-wb-90' : 'text-wb-50 hover:text-wb-70'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading || !data ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-wb-40" />
        </div>
      ) : (
        <>
          {/* Summary 卡片 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<TrendingUp className="h-4 w-4" />}
              label="總查詢數"
              value={data.summary.total_queries.toLocaleString()}
              sub={`過去 ${range.replace('d', ' 天')}`}
            />
            <StatCard
              icon={<Clock className="h-4 w-4" />}
              label="平均延遲"
              value={data.summary.avg_latency_ms != null ? `${data.summary.avg_latency_ms}ms` : '-'}
            />
            <StatCard
              icon={<Shield className="h-4 w-4" />}
              label="平均 Groundedness"
              value={
                data.summary.avg_groundedness != null
                  ? data.summary.avg_groundedness.toFixed(2)
                  : '-'
              }
            />
            <StatCard
              icon={<Database className="h-4 w-4" />}
              label="快取命中率"
              value={
                data.summary.cache_hit_rate != null
                  ? `${(data.summary.cache_hit_rate * 100).toFixed(0)}%`
                  : '-'
              }
            />
          </div>

          {/* 圖表 2x2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 延遲趨勢 */}
            <div className="rounded-xl border border-wb-15 bg-wb-5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-wb-50" />
                <span className="text-sm font-medium text-wb-80">延遲趨勢</span>
                {data.daily.some((d) => d.anomalies.some((a) => a.startsWith('latency'))) && (
                  <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                )}
              </div>
              <MiniLineChart
                data={data.daily}
                lines={[
                  'latency.embedding_p50',
                  'latency.embedding_p95',
                  'latency.retrieval_p50',
                  'latency.retrieval_p95',
                  'latency.generation_p50',
                  'latency.generation_p95',
                ]}
                colors={LATENCY_COLORS}
                labels={{
                  embedding_p50: 'Embed P50',
                  embedding_p95: 'Embed P95',
                  retrieval_p50: 'Retrieval P50',
                  retrieval_p95: 'Retrieval P95',
                  generation_p50: 'Gen P50',
                  generation_p95: 'Gen P95',
                }}
                anomalyPrefix="latency"
                formatY={(v) => `${Math.round(v)}ms`}
              />
            </div>

            {/* 品質趨勢 */}
            <div className="rounded-xl border border-wb-15 bg-wb-5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-wb-50" />
                <span className="text-sm font-medium text-wb-80">品質趨勢</span>
                {data.daily.some((d) => d.anomalies.some((a) => a.startsWith('quality'))) && (
                  <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                )}
              </div>
              <MiniLineChart
                data={data.daily}
                lines={[
                  'quality.avg_groundedness',
                  'quality.avg_auto_score',
                  'quality.avg_feedback_score',
                ]}
                colors={QUALITY_COLORS}
                labels={{
                  avg_groundedness: 'Groundedness',
                  avg_auto_score: 'Auto Score',
                  avg_feedback_score: 'Feedback',
                }}
                yDomain={[0, 5]}
                anomalyPrefix="quality"
                formatY={(v) => v.toFixed(1)}
              />
            </div>

            {/* 快取效率 */}
            <div className="rounded-xl border border-wb-15 bg-wb-5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-wb-50" />
                <span className="text-sm font-medium text-wb-80">快取效率</span>
              </div>
              <AreaChart
                data={data.daily}
                valueKey="cache.hit_rate"
                color="#10b981"
                anomalyPrefix="cache"
              />
            </div>

            {/* 查詢類型分佈 */}
            <div className="rounded-xl border border-wb-15 bg-wb-5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-wb-50" />
                <span className="text-sm font-medium text-wb-80">查詢類型分佈</span>
              </div>
              <StackedBarChart
                data={data.daily}
                keys={['simple', 'complex', 'general-knowledge', 'guardrails_blocked']}
                colors={QUERY_TYPE_COLORS}
                labels={QUERY_TYPE_LABELS}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
