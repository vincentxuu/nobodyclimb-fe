'use client'

import type { PersonalityType } from '@nobodyclimb/types'
import { motion } from 'framer-motion'
import { useEffect, useMemo, useRef } from 'react'

interface Props {
  personality: PersonalityType
  bodyPercent?: number
  motivePercent?: number
  mindPercent?: number
}

const AXES = [
  { label: '力量/技巧', labelLeft: 'Power', labelRight: 'Technique' },
  { label: '目標/自由', labelLeft: 'Goal', labelRight: 'Free' },
  { label: '大膽/穩健', labelLeft: 'Bold', labelRight: 'Steady' },
]

function getDefaultPercents(code: string): [number, number, number] {
  const body = code[0] === 'P' ? 72 : 28
  const motive = code[1] === 'G' ? 72 : 28
  const mind = code[2] === 'B' ? 72 : 28
  return [body, motive, mind]
}

export function drawRadar(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  percents: [number, number, number],
  color: string
) {
  const cx = width / 2
  const cy = height / 2
  const radius = Math.min(cx, cy) * 0.75
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1

  ctx.clearRect(0, 0, width, height)
  ctx.save()

  const angleOffset = -Math.PI / 2
  const angles = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((a) => a + angleOffset)

  // Grid lines
  for (let ring = 1; ring <= 4; ring++) {
    const r = (radius * ring) / 4
    ctx.beginPath()
    for (let i = 0; i <= 3; i++) {
      const a = angles[i % 3]
      const x = cx + r * Math.cos(a)
      const y = cy + r * Math.sin(a)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    ctx.stroke()
  }

  // Axis lines
  for (const a of angles) {
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + radius * Math.cos(a), cy + radius * Math.sin(a))
    ctx.strokeStyle = '#d1d5db'
    ctx.lineWidth = 1
    ctx.stroke()
  }

  // Data polygon
  const values = percents.map((p) => (p / 100) * radius)
  ctx.beginPath()
  values.forEach((v, i) => {
    const x = cx + v * Math.cos(angles[i])
    const y = cy + v * Math.sin(angles[i])
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.closePath()
  ctx.fillStyle = color + '30'
  ctx.fill()
  ctx.strokeStyle = color
  ctx.lineWidth = 2.5
  ctx.stroke()

  // Data points
  values.forEach((v, i) => {
    const x = cx + v * Math.cos(angles[i])
    const y = cy + v * Math.sin(angles[i])
    ctx.beginPath()
    ctx.arc(x, y, 5, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()
  })

  // Labels
  const fontSize = 13 * dpr
  ctx.font = `500 ${fontSize}px "Noto Sans TC", sans-serif`
  ctx.textAlign = 'center'
  ctx.fillStyle = '#374151'

  const labelRadius = radius * 1.2
  AXES.forEach((axis, i) => {
    const x = cx + labelRadius * Math.cos(angles[i])
    const y = cy + labelRadius * Math.sin(angles[i])
    ctx.fillText(axis.label, x, y + 5)
  })

  ctx.restore()
}

export function ResultRadar({ personality, bodyPercent, motivePercent, mindPercent }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const defaults = getDefaultPercents(personality.code)
  const percents = useMemo<[number, number, number]>(
    () => [bodyPercent ?? defaults[0], motivePercent ?? defaults[1], mindPercent ?? defaults[2]],
    [bodyPercent, motivePercent, mindPercent, defaults]
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const size = 320
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    ctx.scale(dpr, dpr)

    drawRadar(ctx, size, size, percents, personality.color)
  }, [percents, personality.color])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="mb-10 flex flex-col items-center"
    >
      <h2 className="mb-4 text-lg font-semibold text-gray-900">性格雷達圖</h2>
      <canvas ref={canvasRef} className="max-w-full" />
      <div className="mt-4 flex gap-6 text-sm text-gray-500">
        {AXES.map((axis, i) => (
          <span key={axis.label}>
            {axis.label}: <strong className="text-gray-900">{percents[i]}%</strong>
          </span>
        ))}
      </div>
    </motion.div>
  )
}
