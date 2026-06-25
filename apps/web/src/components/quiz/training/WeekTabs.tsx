'use client'

import type { TrainingProgressRecord, TrainingWeek } from '@nobodyclimb/types'
import { Check } from 'lucide-react'

interface WeekTabsProps {
  weeks: TrainingWeek[]
  activeWeek: number
  onWeekChange: (week: number) => void
  progress: TrainingProgressRecord[]
  accentColor: string
}

export function WeekTabs({
  weeks,
  activeWeek,
  onWeekChange,
  progress,
  accentColor,
}: WeekTabsProps) {
  return (
    <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
      {weeks.map((week) => {
        const completed = progress.filter((p) => p.week === week.weekNumber && p.completed).length
        const isActive = activeWeek === week.weekNumber
        const isFullyComplete = completed === 3

        return (
          <button
            key={week.weekNumber}
            onClick={() => onWeekChange(week.weekNumber)}
            className={`flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 transition-all ${
              isActive ? 'shadow-sm' : 'border-gray-200 hover:border-gray-300'
            }`}
            style={isActive ? { borderColor: accentColor, color: accentColor } : undefined}
          >
            <div className="flex items-center gap-1">
              <span className={`text-sm font-semibold ${isActive ? '' : 'text-gray-700'}`}>
                Week {week.weekNumber}
              </span>
              {isFullyComplete && <Check className="h-3.5 w-3.5 text-emerald-500" />}
            </div>
            <span className="truncate text-xs text-gray-500">{week.theme}</span>
            <div className="flex gap-1">
              {[1, 2, 3].map((day) => (
                <div
                  key={day}
                  className={`h-1.5 w-4 rounded-full ${
                    progress.some((p) => p.week === week.weekNumber && p.day === day && p.completed)
                      ? 'bg-emerald-500'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </button>
        )
      })}
    </div>
  )
}
