'use client'

import { cn } from '@/lib/utils'

interface CircularProgressProps {
  value: number // 0-100
  size?: 'sm' | 'md' | 'lg' | 'xl'
  strokeWidth?: number
  color?: string
  bgColor?: string
  showValue?: boolean
  label?: string
  className?: string
}

const sizeMap = {
  sm: 60,
  md: 80,
  lg: 100,
  xl: 120,
}

export function CircularProgress({
  value,
  size = 'md',
  strokeWidth = 8,
  color = 'stroke-primary',
  bgColor = 'stroke-brand-light',
  showValue = true,
  label,
  className,
}: CircularProgressProps) {
  const sizePx = sizeMap[size]
  const radius = (sizePx - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference

  return (
    <div className={cn('relative inline-flex flex-col items-center', className)}>
      <svg width={sizePx} height={sizePx} className="-rotate-90">
        {/* 背景圓 */}
        <circle
          cx={sizePx / 2}
          cy={sizePx / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={bgColor}
        />
        {/* 進度圓 */}
        <circle
          cx={sizePx / 2}
          cy={sizePx / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={cn(color, 'transition-all duration-500')}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-semibold text-text-main">{Math.round(value)}%</span>
        </div>
      )}
      {label && <span className="mt-2 text-sm text-strong">{label}</span>}
    </div>
  )
}

interface ProgressBarProps {
  value: number
  max?: number
  color?: string
  bgColor?: string
  showLabel?: boolean
  label?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const barHeightMap = {
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
}

export function ProgressBar({
  value,
  max = 100,
  color = 'bg-primary',
  bgColor = 'bg-brand-light',
  showLabel = false,
  label,
  size = 'md',
  className,
}: ProgressBarProps) {
  const percentage = Math.min(100, (value / max) * 100)

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex justify-between text-sm mb-1">
          {label && <span className="text-strong">{label}</span>}
          {showLabel && (
            <span className="text-text-subtle">
              {value}/{max}
            </span>
          )}
        </div>
      )}
      <div className={cn('w-full rounded-full overflow-hidden', bgColor, barHeightMap[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

interface StatCardProps {
  value: number | string
  label: string
  icon?: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: string
  className?: string
}

export function StatCard({ value, label, icon, trend, color, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col p-4 rounded-xl bg-white border border-subtle/50 shadow-sm',
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        {icon && (
          <div className={cn('p-2 rounded-lg', color || 'bg-brand-light')}>{icon}</div>
        )}
        {trend && (
          <span
            className={cn(
              'text-xs font-medium',
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            )}
          >
            {trend.isPositive ? '+' : ''}
            {trend.value}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-text-main">{value}</p>
      <p className="text-sm text-text-subtle">{label}</p>
    </div>
  )
}

interface BarChartProps {
  data: Array<{
    label: string
    value: number
    color?: string
  }>
  maxValue?: number
  showValues?: boolean
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

export function BarChart({
  data,
  maxValue,
  showValues = true,
  orientation = 'horizontal',
  className,
}: BarChartProps) {
  const max = maxValue || Math.max(...data.map((d) => d.value))

  if (orientation === 'vertical') {
    return (
      <div className={cn('flex items-end justify-around gap-2 h-40', className)}>
        {data.map((item, index) => {
          const height = max > 0 ? (item.value / max) * 100 : 0
          return (
            <div key={index} className="flex flex-col items-center gap-1">
              {showValues && (
                <span className="text-xs text-text-subtle">{item.value}</span>
              )}
              <div
                className={cn(
                  'w-8 rounded-t transition-all duration-500',
                  item.color || 'bg-primary'
                )}
                style={{ height: `${height}%`, minHeight: item.value > 0 ? '4px' : '0' }}
              />
              <span className="text-xs text-strong mt-1">{item.label}</span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {data.map((item, index) => (
        <div key={index} className="flex items-center gap-3">
          <span className="text-sm text-strong w-20 truncate">{item.label}</span>
          <div className="flex-1 h-4 bg-brand-light rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                item.color || 'bg-primary'
              )}
              style={{ width: max > 0 ? `${(item.value / max) * 100}%` : '0%' }}
            />
          </div>
          {showValues && <span className="text-sm text-text-subtle w-10 text-right">{item.value}</span>}
        </div>
      ))}
    </div>
  )
}
