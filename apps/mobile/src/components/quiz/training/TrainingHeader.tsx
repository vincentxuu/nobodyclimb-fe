/**
 * TrainingHeader
 *
 * 訓練計畫頁標題區，對應 apps/web/src/components/quiz/training/TrainingHeader.tsx
 */

import { BORDER_RADIUS, SPACING } from '@nobodyclimb/constants'
import type { PersonalityType } from '@nobodyclimb/types'
import { Mountain } from 'lucide-react-native'
import { StyleSheet, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { Text } from '@/components/ui'
import { ProgressRing } from './ProgressRing'

interface TrainingHeaderProps {
  personality: PersonalityType
  completedDays: number
  totalDays: number
}

export function TrainingHeader({ personality, completedDays, totalDays }: TrainingHeaderProps) {
  return (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.container}>
      <View style={styles.titleBlock}>
        <View style={[styles.iconBox, { backgroundColor: `${personality.color}15` }]}>
          <Mountain size={32} color={personality.color} />
        </View>
        <Text variant="h3" fontWeight="700">
          {personality.nameZh} 訓練計畫
        </Text>
        <Text variant="small" color="textMuted" style={styles.subtitle}>
          {personality.nameEn} Training Plan
        </Text>
      </View>
      <ProgressRing completed={completedDays} total={totalDays} color={personality.color} />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: SPACING[5],
    marginBottom: SPACING[6],
  },
  titleBlock: {
    alignItems: 'center',
    gap: SPACING[3],
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    marginTop: -SPACING[2],
  },
})
