'use client'

import { PERSONALITY_COLORS } from '@nobodyclimb/constants'
import { Mountain } from 'lucide-react'

const TYPE_ORDER = ['PGB', 'PGS', 'PFB', 'PFS', 'TGB', 'TGS', 'TFB', 'TFS'] as const

export function QuizProgress({ current, total }: { current: number; total: number }) {
  const percent = (current / total) * 100
  const activeCount = Math.ceil((current / total) * 8)

  return (
    <div className="mb-10">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">
          {current} / {total}
        </span>
        <span className="text-sm font-medium text-gray-400">{Math.round(percent)}%</span>
      </div>

      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percent}%`,
            background: `linear-gradient(90deg, #E84545, #F7B731, #27AE60, #6C5CE7)`,
          }}
        />
      </div>

      <div className="mt-3 flex justify-between px-1">
        {TYPE_ORDER.map((code, i) => (
          <div
            key={code}
            className="flex flex-col items-center transition-all duration-300"
            style={{ opacity: i < activeCount ? 1 : 0.2 }}
          >
            <Mountain
              className="h-4 w-4"
              style={{ color: i < activeCount ? PERSONALITY_COLORS[code] : '#d1d5db' }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
