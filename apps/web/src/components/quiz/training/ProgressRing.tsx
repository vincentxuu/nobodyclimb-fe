'use client'

import { motion } from 'framer-motion'

interface ProgressRingProps {
  completed: number
  total: number
  size?: number
  strokeWidth?: number
  color?: string
}

export function ProgressRing({
  completed,
  total,
  size = 120,
  strokeWidth = 8,
  color = '#10b981',
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const percent = total > 0 ? completed / total : 0
  const offset = circumference * (1 - percent)

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-900">
          {completed}/{total}
        </span>
        <span className="text-xs text-gray-500">天</span>
      </div>
    </div>
  )
}
