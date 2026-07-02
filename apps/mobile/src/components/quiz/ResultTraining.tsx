/**
 * ResultTraining
 *
 * 結果頁的專屬訓練計畫預覽，對應 apps/web/src/components/quiz/ResultTraining.tsx
 */

import { BORDER_RADIUS, getTrainingPlan, SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import type { PersonalityType } from '@nobodyclimb/types'
import { useRouter } from 'expo-router'
import { ArrowRight, Dumbbell, Lock } from 'lucide-react-native'
import { StyleSheet, View } from 'react-native'
import { Button, Text } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'

export function ResultTraining({ personality }: { personality: PersonalityType }) {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const plan = getTrainingPlan(personality.code)
  if (!plan || plan.weeks.length === 0) return null

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Dumbbell size={20} color={personality.color} />
        <Text variant="h4" fontWeight="600">
          專屬訓練計畫
        </Text>
      </View>

      <View style={styles.weekList}>
        {plan.weeks.map((week) => {
          const isLocked = !isAuthenticated && week.weekNumber > 1

          return (
            <View key={week.weekNumber} style={styles.weekCard}>
              <Text variant="small" fontWeight="600" style={styles.weekTitle}>
                Week {week.weekNumber}：{week.theme}
              </Text>
              <View style={styles.dayList}>
                {week.days.map((day) => (
                  <View key={day.dayNumber} style={styles.dayRow}>
                    <View style={styles.dayDot} />
                    <Text variant="small" color="textSubtle" style={styles.dayTitle}>
                      Day {day.dayNumber}：{day.title}
                    </Text>
                    <Text variant="small" color="textMuted">
                      {day.duration} 分鐘
                    </Text>
                  </View>
                ))}
              </View>
              {isLocked && (
                <View style={styles.lockOverlay}>
                  <Lock size={18} color={SEMANTIC_COLORS.textMuted} />
                </View>
              )}
            </View>
          )
        })}
      </View>

      {isAuthenticated ? (
        <Button
          variant="primary"
          size="lg"
          fullWidth
          rightIcon={ArrowRight}
          onPress={() => router.push(`/quiz/training/${personality.code.toLowerCase()}` as any)}
          style={{ backgroundColor: personality.color }}
        >
          前往訓練計畫
        </Button>
      ) : (
        <Button
          variant="primary"
          size="lg"
          fullWidth
          leftIcon={Lock}
          onPress={() => router.push('/auth/login' as any)}
        >
          登入解鎖完整訓練計畫
        </Button>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING[4],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  weekList: {
    gap: SPACING[3],
  },
  weekCard: {
    borderWidth: 1,
    borderColor: SEMANTIC_COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    padding: SPACING[4],
    overflow: 'hidden',
  },
  weekTitle: {
    marginBottom: SPACING[2],
  },
  dayList: {
    gap: SPACING[2],
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  dayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: SEMANTIC_COLORS.borderSubtle,
  },
  dayTitle: {
    flex: 1,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${SEMANTIC_COLORS.cardBg}CC`,
  },
})
