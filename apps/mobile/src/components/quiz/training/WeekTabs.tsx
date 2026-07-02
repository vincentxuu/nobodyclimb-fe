/**
 * WeekTabs
 *
 * 訓練週次切換 tabs，對應 apps/web/src/components/quiz/training/WeekTabs.tsx
 */

import { BORDER_RADIUS, SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import type { TrainingProgressRecord, TrainingWeek } from '@nobodyclimb/types'
import { Check } from 'lucide-react-native'
import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from '@/components/ui'

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
    <View style={styles.container}>
      {weeks.map((week) => {
        const completed = progress.filter((p) => p.week === week.weekNumber && p.completed).length
        const isActive = activeWeek === week.weekNumber
        const isFullyComplete = completed === 3

        return (
          <Pressable
            key={week.weekNumber}
            onPress={() => onWeekChange(week.weekNumber)}
            style={[styles.tab, isActive && { borderColor: accentColor }]}
          >
            <View style={styles.tabTitleRow}>
              <Text
                variant="small"
                fontWeight="600"
                style={isActive ? { color: accentColor } : undefined}
              >
                W{week.weekNumber}
              </Text>
              {isFullyComplete && <Check size={12} color={SEMANTIC_COLORS.success} />}
            </View>
            <Text variant="small" color="textMuted" numberOfLines={1} style={styles.theme}>
              {week.theme}
            </Text>
            <View style={styles.dayDots}>
              {[1, 2, 3].map((day) => (
                <View
                  key={day}
                  style={[
                    styles.dayDot,
                    progress.some(
                      (p) => p.week === week.weekNumber && p.day === day && p.completed
                    ) && styles.dayDotDone,
                  ]}
                />
              ))}
            </View>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: SPACING[2],
    marginBottom: SPACING[5],
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: SPACING[1],
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[1],
    borderWidth: 2,
    borderColor: SEMANTIC_COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: SEMANTIC_COLORS.cardBg,
  },
  tabTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
  },
  theme: {
    maxWidth: '100%',
  },
  dayDots: {
    flexDirection: 'row',
    gap: SPACING[1],
  },
  dayDot: {
    width: 14,
    height: 6,
    borderRadius: 3,
    backgroundColor: SEMANTIC_COLORS.border,
  },
  dayDotDone: {
    backgroundColor: SEMANTIC_COLORS.success,
  },
})
