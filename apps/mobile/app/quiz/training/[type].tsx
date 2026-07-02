/**
 * 攀岩人格訓練計畫頁
 *
 * 對應 apps/web/src/app/[locale]/quiz/training/[type]/page.tsx
 */

import {
  getPersonalityType,
  getTrainingPlan,
  SEMANTIC_COLORS,
  SPACING,
} from '@nobodyclimb/constants'
import type { PersonalityTypeCode } from '@nobodyclimb/types'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ChevronLeft } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  DayCard,
  GraduationBadge,
  StartGuide,
  TrainingHeader,
  WeekTabs,
} from '@/components/quiz/training'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'
import { Button, IconButton, Spinner, Text, useToast } from '@/components/ui'
import { useTrainingProgress, useUpdateTrainingProgress } from '@/lib/hooks/useTraining'

const TOTAL_DAYS = 12

function TrainingScreen() {
  const { type } = useLocalSearchParams<{ type: string }>()
  const router = useRouter()
  const toast = useToast()

  const code = (type ?? '').toUpperCase() as PersonalityTypeCode
  const personality = getPersonalityType(code)
  const plan = personality ? getTrainingPlan(personality.code) : null

  const { data: progress = [], isLoading: progressLoading } = useTrainingProgress(code)
  const updateProgress = useUpdateTrainingProgress(code, () =>
    toast.show({ message: '訓練進度更新失敗，請稍後再試', variant: 'error' })
  )

  const completedDays = useMemo(() => progress.filter((p) => p.completed).length, [progress])
  const isGraduated = completedDays === TOTAL_DAYS

  // 預設顯示第一個未完成的週次
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

  if (!personality || !plan || plan.weeks.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text variant="h4" fontWeight="600">
            此型態的訓練計畫尚未開放
          </Text>
          <Button variant="primary" size="md" onPress={() => router.replace('/quiz' as any)}>
            回到測驗首頁
          </Button>
        </View>
      </SafeAreaView>
    )
  }

  const activeWeekData = plan.weeks.find((w) => w.weekNumber === currentWeek)

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <IconButton
            icon={ChevronLeft}
            variant="ghost"
            onPress={() => router.back()}
            accessibilityLabel="返回"
          />
        </View>

        <View style={styles.body}>
          <TrainingHeader
            personality={personality}
            completedDays={completedDays}
            totalDays={TOTAL_DAYS}
          />

          <GraduationBadge
            isGraduated={isGraduated}
            accentColor={personality.color}
            personalityName={personality.nameZh}
          />

          {completedDays === 0 && !progressLoading && <StartGuide personality={personality} />}

          {progressLoading ? (
            <Spinner size="lg" />
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
                <View style={styles.dayList}>
                  <Text variant="h4" fontWeight="600">
                    Week {activeWeekData.weekNumber}：{activeWeekData.theme}
                  </Text>
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
                </View>
              )}

              <Text variant="small" color="textMuted" style={styles.footer}>
                已完成 {completedDays} / {TOTAL_DAYS} 天
              </Text>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default function TrainingPage() {
  return (
    <ProtectedRoute>
      <TrainingScreen />
    </ProtectedRoute>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SEMANTIC_COLORS.pageBg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING[10],
  },
  header: {
    paddingHorizontal: SPACING[2],
    paddingVertical: SPACING[2],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING[4],
    padding: SPACING[6],
  },
  body: {
    paddingHorizontal: SPACING[4],
  },
  dayList: {
    gap: SPACING[3],
  },
  footer: {
    textAlign: 'center',
    marginTop: SPACING[5],
  },
})
