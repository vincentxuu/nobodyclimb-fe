/**
 * QuizProgressBar
 *
 * 測驗進度指示器，顯示目前題號與進度條
 */

import { FONT_SIZE, FONT_WEIGHT, SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import { StyleSheet, View } from 'react-native'
import { ProgressBar, Text } from '@/components/ui'

interface QuizProgressBarProps {
  /** 目前題目索引（0-based） */
  current: number
  /** 總題數 */
  total: number
}

export function QuizProgressBar({ current, total }: QuizProgressBarProps) {
  const displayCurrent = current + 1
  const progressValue = (displayCurrent / total) * 100

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text
          style={{
            fontSize: FONT_SIZE.sm,
            fontWeight: FONT_WEIGHT.medium,
            color: WB_COLORS[50],
          }}
        >
          {displayCurrent} / {total}
        </Text>
      </View>
      <ProgressBar value={progressValue} color={SEMANTIC_COLORS.brand} height={6} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING[4],
    gap: SPACING[2],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
})
