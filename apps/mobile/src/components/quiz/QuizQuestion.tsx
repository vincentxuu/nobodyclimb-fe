/**
 * QuizQuestion
 *
 * 測驗題目顯示與 5 點 Likert 量表選項
 */

import {
  BORDER_RADIUS,
  FONT_SIZE,
  FONT_WEIGHT,
  SEMANTIC_COLORS,
  SPACING,
  WB_COLORS,
} from '@nobodyclimb/constants'
import type { QuizAxis } from '@nobodyclimb/types'
import { Pressable, StyleSheet, View } from 'react-native'

import { Text } from '@/components/ui'

const AXIS_COLORS: Record<QuizAxis, string> = {
  body: '#E84545',
  motive: '#F7B731',
  mind: '#27AE60',
}

const AXIS_LABELS: Record<QuizAxis, string> = {
  body: '身體',
  motive: '動機',
  mind: '心態',
}

const LIKERT_LABELS = ['非常不同意', '不同意', '普通', '同意', '非常同意']
const LIKERT_EMOJIS = ['😤', '🤔', '😐', '😊', '🔥']

interface QuizQuestionProps {
  /** 題目文字 */
  questionText: string
  /** 題目所屬軸向 */
  axis: QuizAxis
  /** 已選取的值（1-5），null 為未選 */
  selectedValue: number | null
  /** 選取回調 */
  onSelect: (value: 1 | 2 | 3 | 4 | 5) => void
}

export function QuizQuestion({ questionText, axis, selectedValue, onSelect }: QuizQuestionProps) {
  const axisColor = AXIS_COLORS[axis]

  return (
    <View style={styles.container}>
      {/* 軸向標籤 */}
      <View style={styles.badgeRow}>
        <View style={[styles.axisBadge, { backgroundColor: axisColor + '26' }]}>
          <Text
            style={{
              fontSize: FONT_SIZE.xs,
              fontWeight: FONT_WEIGHT.semibold,
              color: axisColor,
            }}
          >
            {AXIS_LABELS[axis]}
          </Text>
        </View>
      </View>

      {/* 題目文字 */}
      <Text variant="h3" align="center" style={styles.questionText}>
        {questionText}
      </Text>

      {/* Likert 選項 */}
      <View style={styles.optionsContainer}>
        {LIKERT_LABELS.map((label, index) => {
          const value = (index + 1) as 1 | 2 | 3 | 4 | 5
          const isSelected = selectedValue === value

          return (
            <Pressable
              key={value}
              style={({ pressed }) => [
                styles.optionButton,
                {
                  backgroundColor: isSelected ? axisColor : WB_COLORS[10],
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              onPress={() => onSelect(value)}
            >
              <Text style={styles.optionEmoji}>{LIKERT_EMOJIS[index]}</Text>
              <Text
                style={{
                  fontSize: FONT_SIZE.base,
                  fontWeight: isSelected ? FONT_WEIGHT.semibold : FONT_WEIGHT.normal,
                  color: isSelected ? WB_COLORS[100] : SEMANTIC_COLORS.textMain,
                }}
              >
                {label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING[4],
    gap: SPACING[6],
  },
  badgeRow: {
    alignItems: 'center',
  },
  axisBadge: {
    paddingVertical: SPACING[1],
    paddingHorizontal: SPACING[3],
    borderRadius: BORDER_RADIUS.full,
    alignSelf: 'center',
  },
  questionText: {
    fontWeight: FONT_WEIGHT.semibold,
  },
  optionsContainer: {
    gap: SPACING[2],
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING[4],
    gap: SPACING[3],
  },
  optionEmoji: {
    fontSize: FONT_SIZE.xl,
  },
})
