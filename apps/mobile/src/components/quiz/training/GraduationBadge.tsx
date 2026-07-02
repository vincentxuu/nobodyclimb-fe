/**
 * GraduationBadge
 *
 * 完訓徽章，對應 apps/web/src/components/quiz/training/GraduationBadge.tsx
 * （web 版的 confetti 粒子動畫在 RN 以 ZoomIn 入場動畫簡化呈現）
 */

import { BORDER_RADIUS, SPACING } from '@nobodyclimb/constants'
import { Trophy } from 'lucide-react-native'
import { StyleSheet, View } from 'react-native'
import Animated, { ZoomIn } from 'react-native-reanimated'
import { Text } from '@/components/ui'

interface GraduationBadgeProps {
  isGraduated: boolean
  accentColor: string
  personalityName: string
}

export function GraduationBadge({
  isGraduated,
  accentColor,
  personalityName,
}: GraduationBadgeProps) {
  if (!isGraduated) return null

  return (
    <Animated.View
      entering={ZoomIn.duration(500)}
      style={[styles.container, { borderColor: accentColor, backgroundColor: `${accentColor}08` }]}
    >
      <View style={[styles.iconBox, { backgroundColor: `${accentColor}20` }]}>
        <Trophy size={28} color={accentColor} />
      </View>
      <View style={styles.textBlock}>
        <Text variant="bodyBold">訓練計畫完成！</Text>
        <Text variant="small" color="textSubtle">
          恭喜你完成 {personalityName} 的 4 週訓練計畫
        </Text>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[4],
    borderWidth: 2,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING[4],
    marginBottom: SPACING[5],
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
    gap: SPACING[1],
  },
})
