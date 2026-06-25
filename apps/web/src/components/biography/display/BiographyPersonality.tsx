'use client'

import { getPersonalityColor, getPersonalityType } from '@nobodyclimb/constants'
import type { PersonalityTypeCode } from '@nobodyclimb/types'
import lottie, { AnimationItem } from 'lottie-web'
import { Flame, Wind } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface BiographyPersonalityProps {
  personalityType: string
  powerPct: number
  goalPct: number
  boldPct: number
  className?: string
}

function RadarChart({
  power,
  goal,
  bold,
  color,
}: {
  power: number
  goal: number
  bold: number
  color: string
}) {
  const size = 160,
    cx = 80,
    cy = 80,
    r = 55
  const angles = [-Math.PI / 2, -Math.PI / 2 + (2 * Math.PI) / 3, -Math.PI / 2 + (4 * Math.PI) / 3]
  const values = [power / 100, goal / 100, bold / 100]
  const labels = ['Power', 'Goal', 'Bold']
  const pcts = [power, goal, bold]
  const pts = angles.map((a, i) => ({
    x: cx + r * values[i] * Math.cos(a),
    y: cy + r * values[i] * Math.sin(a),
  }))
  return (
    <svg width={size} height={size} viewBox={'0 0 ' + size + ' ' + size}>
      {[0.33, 0.66, 1].map((l) => (
        <polygon
          key={l}
          points={angles
            .map((a) => cx + r * l * Math.cos(a) + ',' + (cy + r * l * Math.sin(a)))
            .join(' ')}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="1"
        />
      ))}
      {angles.map((a, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={cx + r * Math.cos(a)}
          y2={cy + r * Math.sin(a)}
          stroke="#E5E7EB"
          strokeWidth="1"
        />
      ))}
      <polygon
        points={pts.map((p) => p.x + ',' + p.y).join(' ')}
        fill={color}
        fillOpacity="0.3"
        stroke={color}
        strokeOpacity="0.8"
        strokeWidth="2"
      />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} />
      ))}
      {angles.map((a, i) => {
        const lr = r + 20
        return (
          <g key={'l' + i}>
            <text
              x={cx + lr * Math.cos(a)}
              y={cy + lr * Math.sin(a) - 6}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-gray-500 text-[10px] font-medium"
            >
              {labels[i]}
            </text>
            <text
              x={cx + lr * Math.cos(a)}
              y={cy + lr * Math.sin(a) + 6}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[11px] font-bold"
              fill={color}
            >
              {pcts[i]}%
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function LottieAnim({ type, color }: { type: string; color: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const animRef = useRef<AnimationItem | null>(null)
  const [failed, setFailed] = useState(false)
  const onIntersect = useCallback((entries: IntersectionObserverEntry[]) => {
    const a = animRef.current
    if (!a) return
    entries.forEach((e) => {
      if (e.isIntersecting) a.play()
      else a.pause()
    })
  }, [])
  useEffect(() => {
    if (!ref.current) return
    try {
      const a = lottie.loadAnimation({
        container: ref.current,
        renderer: 'svg',
        loop: true,
        autoplay: false,
        path: '/quiz/lottie/' + type + '.json',
      })
      a.addEventListener('data_failed', () => setFailed(true))
      a.addEventListener('error', () => setFailed(true))
      animRef.current = a
      const obs = new IntersectionObserver(onIntersect, { threshold: 0.3 })
      obs.observe(ref.current)
      return () => {
        obs.disconnect()
        a.destroy()
        animRef.current = null
      }
    } catch {
      setFailed(true)
    }
  }, [type, onIntersect])
  if (failed)
    return (
      <div className="flex h-[120px] w-[120px] items-center justify-center">
        <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
          <circle cx="48" cy="48" r="44" stroke={color} strokeWidth="2" opacity="0.3" />
          <circle cx="48" cy="48" r="28" stroke={color} strokeWidth="2" opacity="0.5" />
          <circle cx="48" cy="48" r="14" fill={color} opacity="0.8" />
        </svg>
      </div>
    )
  return <div ref={ref} className="h-[120px] w-[120px]" />
}

export function BiographyPersonality({
  personalityType,
  powerPct,
  goalPct,
  boldPct,
  className,
}: BiographyPersonalityProps) {
  const t = getPersonalityType(personalityType as PersonalityTypeCode)
  const color = getPersonalityColor(personalityType as PersonalityTypeCode)
  if (!t) return null
  return (
    <section className={cn('py-6', className)}>
      <h3 className="mb-4 text-lg font-semibold text-brand-dark">攀岩人格</h3>
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
          <div className="flex flex-col items-center gap-4">
            <LottieAnim type={personalityType} color={color} />
            <RadarChart power={powerPct} goal={goalPct} bold={boldPct} color={color} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="mb-2">
              <span className="text-xl font-bold" style={{ color }}>
                {t.code} {t.nameZh}
              </span>
              <span className="ml-2 text-base text-gray-500">{t.nameEn}</span>
            </div>
            <p className="mb-4 text-sm italic text-gray-600">
              <span className="border-b-2 pb-0.5" style={{ borderColor: color + '40' }}>
                「{t.tagline}」
              </span>
            </p>
            <div className="mb-3">
              <span className="text-xs font-medium text-gray-500">優勢</span>
              <div className="mt-1 flex flex-wrap justify-center gap-1.5 md:justify-start">
                {t.strengths.map((s) => (
                  <span
                    key={s}
                    className="rounded-full px-2.5 py-1 text-xs font-medium"
                    style={{ backgroundColor: color + '15', color }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <span className="text-xs font-medium text-gray-500">盲點</span>
              <div className="mt-1 flex flex-wrap justify-center gap-1.5 md:justify-start">
                {t.blindSpots.map((w) => (
                  <span
                    key={w}
                    className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600"
                  >
                    {w}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 md:justify-start">
              <span className="text-xs font-medium text-gray-500">最佳狀態</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-3 py-1 text-sm font-medium text-cyan-700">
                <Wind className="h-4 w-4" />
                Flow
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-sm font-medium text-orange-700">
                <Flame className="h-4 w-4" />
                Clutch
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
