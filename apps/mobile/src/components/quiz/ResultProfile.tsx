/**
 * ResultProfile
 *
 * 測驗結果的個性分析區塊，含恆毅力／心流指數與狀態描述
 */

import {
  BORDER_RADIUS,
  FONT_SIZE,
  FONT_WEIGHT,
  SEMANTIC_COLORS,
  SPACING,
  WB_COLORS,
} from '@nobodyclimb/constants'
import type { PersonalityType, QuizResult } from '@nobodyclimb/types'
import { StyleSheet, View } from 'react-native'

import { ProgressBar, Text } from '@/components/ui'

interface ResultProfileProps {
  /** 測驗結果 */
  result: QuizResult
  /** 人格類型資料 */
  personalityType: PersonalityType
}

export function ResultProfile({ result, personalityType }: ResultProfileProps) {
  return (
    <View style={styles.card}>
      {/* 標題 */}
      <Text variant="h4">個性分析</Text>

      {/* 描述 */}
      <Text variant="body" color="subtle" style={styles.description}>
        {personalityType.description}
      </Text>

      {/* 恆毅力指數 */}
      <View style={styles.metricRow}>
        <View style={styles.metricHeader}>
          <Text
            style={{
              fontSize: FONT_SIZE.sm,
              fontWeight: FONT_WEIGHT.semibold,
              color: SEMANTIC_COLORS.textMain,
            }}
          >
            恆毅力指數 (Grit)
          </Text>
          <Text
            style={{
              fontSize: FONT_SIZE.sm,
              fontWeight: FONT_WEIGHT.semibold,
              color: '#F59E0B',
            }}
          >
            {Math.round(result.gritIndex)}%
          </Text>
        </View>
        <ProgressBar value={result.gritIndex} color="#F59E0B" height={8} />
      </View>

      {/* 心流指數 */}
      <View style={styles.metricRow}>
        <View style={styles.metricHeader}>
          <Text
            style={{
              fontSize: FONT_SIZE.sm,
              fontWeight: FONT_WEIGHT.semibold,
              color: SEMANTIC_COLORS.textMain,
            }}
          >
            心流指數 (Flow)
          </Text>
          <Text
            style={{
              fontSize: FONT_SIZE.sm,
              fontWeight: FONT_WEIGHT.semibold,
              color: '#8B5CF6',
            }}
          >
            {Math.round(result.flowIndex)}%
          </Text>
        </View>
        <ProgressBar value={result.flowIndex} color="#8B5CF6" height={8} />
      </View>

      {/* Flow 與 Clutch 狀態 */}
      <View style={styles.stateSection}>
        <View style={styles.stateBlock}>
          <Text
            style={{
              fontSize: FONT_SIZE.xs,
              fontWeight: FONT_WEIGHT.semibold,
              color: WB_COLORS[50],
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            Flow 狀態
          </Text>
          <Text variant="body" color="subtle">
            {personalityType.flowState}
          </Text>
        </View>
        <View style={styles.stateBlock}>
          <Text
            style={{
              fontSize: FONT_SIZE.xs,
              fontWeight: FONT_WEIGHT.semibold,
              color: WB_COLORS[50],
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            Clutch 狀態
          </Text>
          <Text variant="body" color="subtle">
            {personalityType.clutchState}
          </Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: SEMANTIC_COLORS.border,
    padding: SPACING[4],
    gap: SPACING[4],
  },
  description: {
    lineHeight: 22,
  },
  metricRow: {
    gap: SPACING[2],
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stateSection: {
    gap: SPACING[4],
    paddingTop: SPACING[2],
    borderTopWidth: 1,
    borderTopColor: SEMANTIC_COLORS.border,
  },
  stateBlock: {
    gap: SPACING[1],
  },
})
