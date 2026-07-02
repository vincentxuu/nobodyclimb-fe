/**
 * StartGuide
 *
 * 訓練計畫開始指引，對應 apps/web/src/components/quiz/training/StartGuide.tsx
 */

import { BORDER_RADIUS, SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import type { PersonalityType } from '@nobodyclimb/types'
import { Calendar, Clock, Sparkles, Target } from 'lucide-react-native'
import { StyleSheet, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { Text } from '@/components/ui'

interface StartGuideProps {
  personality: PersonalityType
}

const GUIDE_STATS = [
  { icon: Calendar, value: '4 週', label: '完整計畫' },
  { icon: Target, value: '12 天', label: '訓練天數' },
  { icon: Clock, value: '20-45 分', label: '每日時長' },
] as const

export function StartGuide({ personality }: StartGuideProps) {
  return (
    <Animated.View
      entering={FadeInDown.duration(400)}
      style={[styles.container, { borderColor: `${personality.color}40` }]}
    >
      <View style={styles.titleRow}>
        <Sparkles size={20} color={personality.color} />
        <Text variant="h4" fontWeight="700">
          開始你的訓練計畫
        </Text>
      </View>

      <Text variant="small" color="textSubtle" style={styles.intro}>
        這個計畫專為
        <Text variant="small" fontWeight="700">
          {personality.nameZh}
        </Text>
        設計，核心理念是「訓練你的反面」——透過強化你較少使用的面向，成為更全面的攀岩者。
      </Text>

      <View style={styles.statsRow}>
        {GUIDE_STATS.map(({ icon: Icon, value, label }) => (
          <View key={label} style={styles.statCell}>
            <Icon size={20} color={SEMANTIC_COLORS.textMuted} />
            <Text variant="small" fontWeight="600">
              {value}
            </Text>
            <Text variant="small" color="textMuted">
              {label}
            </Text>
          </View>
        ))}
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING[5],
    marginBottom: SPACING[6],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    marginBottom: SPACING[3],
  },
  intro: {
    marginBottom: SPACING[4],
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING[3],
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    gap: SPACING[1],
    backgroundColor: SEMANTIC_COLORS.pageBg,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING[3],
  },
})
