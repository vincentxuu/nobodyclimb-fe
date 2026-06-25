'use client'

import type { PersonalityTypeCode, TrainingDay, TrainingProgressRecord } from '@nobodyclimb/types'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, Clock, Dumbbell, StickyNote } from 'lucide-react'
import { useEffect, useState } from 'react'

interface DayCardProps {
  day: TrainingDay
  weekNumber: number
  progressRecord?: TrainingProgressRecord
  accentColor: string
  onToggleComplete: (payload: {
    personality_type: PersonalityTypeCode
    week: number
    day: number
    completed: boolean
    notes?: string | null
  }) => void
  personalityType: PersonalityTypeCode
}

export function DayCard({
  day,
  weekNumber,
  progressRecord,
  accentColor,
  onToggleComplete,
  personalityType,
}: DayCardProps) {
  const isCompleted = !!progressRecord?.completed
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState(progressRecord?.notes ?? '')
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const hasNotes = !!progressRecord?.notes

  useEffect(() => {
    setNotes(progressRecord?.notes ?? '')
  }, [progressRecord?.notes])

  const handleToggle = () => {
    onToggleComplete({
      personality_type: personalityType,
      week: weekNumber,
      day: day.dayNumber,
      completed: !isCompleted,
    })
  }

  const handleSaveNotes = () => {
    setIsSavingNotes(true)
    onToggleComplete({
      personality_type: personalityType,
      week: weekNumber,
      day: day.dayNumber,
      completed: isCompleted,
      notes: notes || null,
    })
    setTimeout(() => setIsSavingNotes(false), 500)
  }

  return (
    <motion.div
      layout
      className={`rounded-xl border-2 p-4 transition-colors ${
        isCompleted ? 'border-emerald-200 bg-emerald-50/50' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={handleToggle}
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-all ${
            isCompleted
              ? 'border-emerald-500 bg-emerald-500 text-white'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          {isCompleted && <Check className="h-4 w-4" />}
        </button>

        <div className={`min-w-0 flex-1 ${isCompleted ? 'opacity-60' : ''}`}>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">
              Day {day.dayNumber}：{day.title}
            </h3>
            {hasNotes && <StickyNote className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
          </div>

          <p className="mt-1 text-sm text-gray-600">{day.description}</p>

          <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
            <Clock className="h-3.5 w-3.5" />
            <span>{day.duration} 分鐘</span>
          </div>

          <div className="mt-3 space-y-2">
            {day.exercises.map((exercise, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <Dumbbell className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                <div>
                  <span className="font-medium text-gray-700">{exercise.name}</span>
                  <span className="text-gray-500"> — {exercise.description}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 border-t border-gray-100 pt-2">
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
            >
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${showNotes ? 'rotate-180' : ''}`}
              />
              {hasNotes ? '查看筆記' : '新增筆記'}
            </button>

            <AnimatePresence>
              {showNotes && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 space-y-2">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="記錄今天的訓練心得..."
                      className="w-full resize-none rounded-lg border border-gray-200 p-2 text-sm focus:border-gray-300 focus:outline-none"
                      rows={3}
                    />
                    <button
                      onClick={handleSaveNotes}
                      disabled={isSavingNotes}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors"
                      style={{ backgroundColor: accentColor }}
                    >
                      {isSavingNotes ? '儲存中...' : '儲存筆記'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
