'use client'

import { getTrainingPlan } from '@nobodyclimb/constants'
import type { PersonalityType } from '@nobodyclimb/types'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { ROUTES } from '@/lib/constants'
import { useAuth } from '@/lib/hooks/useAuth'
import { useTrainingProgress } from '@/lib/hooks/useTrainingProgress'
import { useUpdateProgress } from '@/lib/hooks/useUpdateProgress'
import { DayCard } from './DayCard'
import { GraduationBadge } from './GraduationBadge'
import { StartGuide } from './StartGuide'
import { TrainingHeader } from './TrainingHeader'
import { WeekTabs } from './WeekTabs'

export function TrainingPageClient({ personality }: { personality: PersonalityType }) {
  const { isSignedIn, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const plan = getTrainingPlan(personality.code)
  const { data: progress = [], isLoading: progressLoading } = useTrainingProgress(personality.code)
  const updateProgress = useUpdateProgress(personality.code)

  const completedDays = useMemo(() => progress.filter((p) => p.completed).length, [progress])
  const isGraduated = completedDays === 12

  const defaultWeek = useMemo(() => {
    if (completedDays === 0) return 1
    for (let w = 1; w <= 4; w++) {
      const weekCompleted = progress.filter((p) => p.week === w && p.completed).length
      if (weekCompleted < 3) return w
    }
    return 4
  }, [progress, completedDays])

  const [activeWeek, setActiveWeek] = useState<number | null>(null)
  const currentWeek = activeWeek ?? defaultWeek

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
      </div>
    )
  }

  useEffect(() => {
    if (!authLoading && !isSignedIn) {
      const returnPath = window.location.pathname
      router.push(`${ROUTES.LOGIN}?redirect=${encodeURIComponent(returnPath)}`)
    }
  }, [authLoading, isSignedIn, router])

  if (!isSignedIn) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500">正在導向登入頁面...</p>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-gray-500">此型態的訓練計畫尚未開放</p>
      </div>
    )
  }

  const activeWeekData = plan.weeks.find((w) => w.weekNumber === currentWeek)

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:py-12">
      <TrainingHeader personality={personality} completedDays={completedDays} totalDays={12} />

      <GraduationBadge
        isGraduated={isGraduated}
        accentColor={personality.color}
        personalityName={personality.nameZh}
      />

      {completedDays === 0 && !progressLoading && <StartGuide personality={personality} />}

      {progressLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
        </div>
      ) : (
        <>
          <WeekTabs
            weeks={plan.weeks}
            activeWeek={currentWeek}
            onWeekChange={setActiveWeek}
            progress={progress}
            accentColor={personality.color}
          />

          {activeWeekData && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Week {activeWeekData.weekNumber}：{activeWeekData.theme}
              </h2>
              {activeWeekData.days.map((day) => (
                <DayCard
                  key={`${activeWeekData.weekNumber}-${day.dayNumber}`}
                  day={day}
                  weekNumber={activeWeekData.weekNumber}
                  progressRecord={progress.find(
                    (p) => p.week === activeWeekData.weekNumber && p.day === day.dayNumber
                  )}
                  accentColor={personality.color}
                  onToggleComplete={(payload) => updateProgress.mutate(payload)}
                  personalityType={personality.code}
                />
              ))}
            </div>
          )}

          <p className="mt-6 text-center text-sm text-gray-400">已完成 {completedDays} / 12 天</p>
        </>
      )}
    </div>
  )
}
