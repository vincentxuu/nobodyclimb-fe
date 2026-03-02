import React, { useState } from 'react'
import { View, Pressable } from 'react-native'
import { YStack, XStack, Text } from 'tamagui'
import { Shuffle, X, ChevronRight } from 'lucide-react-native'
import { SEMANTIC_COLORS, COLORS } from '@nobodyclimb/constants'
import type { StoryQuestion, OneLinerQuestion } from '@nobodyclimb/types'

interface RandomRecommendProps {
  /** 未填寫的問題列表 */
  unfilledQuestions: (StoryQuestion | OneLinerQuestion)[]
  /** 點擊問題回調 */
  onQuestionClick: (questionId: string, type?: 'story' | 'oneliner') => void
  /** 關閉回調 */
  onClose?: () => void
}

/**
 * 隨機推薦組件
 *
 * 隨機推薦未填寫的問題
 */
export function RandomRecommend({
  unfilledQuestions,
  onQuestionClick,
  onClose,
}: RandomRecommendProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (unfilledQuestions.length === 0) {
    return (
      <View
        style={{
          backgroundColor: `${COLORS.brand.accent}33`,
          borderRadius: 12,
          padding: 16,
        }}
      >
        <Text fontSize={14} fontWeight="500" color={SEMANTIC_COLORS.textMain} textAlign="center">
          太棒了！你已經回答了所有問題！
        </Text>
      </View>
    )
  }

  const shuffleQuestion = () => {
    const newIndex = Math.floor(Math.random() * unfilledQuestions.length)
    setCurrentIndex(newIndex)
  }

  const currentQuestion = unfilledQuestions[currentIndex]
  const isStory = 'category_id' in currentQuestion || 'category' in currentQuestion
  const questionType = isStory ? 'story' : 'oneliner'

  return (
    <View
      style={{
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: COLORS.border.light,
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <XStack
        alignItems="center"
        justifyContent="space-between"
        paddingHorizontal="$4"
        paddingVertical="$3"
        backgroundColor={COLORS.background.subtle}
      >
        <XStack alignItems="center" gap="$2">
          <Shuffle size={16} color={SEMANTIC_COLORS.textSubtle} />
          <Text fontSize={14} fontWeight="500" color={SEMANTIC_COLORS.textMain}>
            隨機推薦問題
          </Text>
        </XStack>
        {onClose && (
          <Pressable
            onPress={onClose}
            style={({ pressed }) => ({
              padding: 4,
              borderRadius: 4,
              backgroundColor: pressed ? COLORS.background.muted : 'transparent',
            })}
          >
            <X size={16} color={COLORS.text.muted} />
          </Pressable>
        )}
      </XStack>

      {/* Question */}
      <YStack padding="$4">
        <Text fontSize={15} fontWeight="500" color={SEMANTIC_COLORS.textMain} marginBottom="$2">
          {'question' in currentQuestion ? currentQuestion.question : currentQuestion.title}
        </Text>
        {'subtitle' in currentQuestion && currentQuestion.subtitle && (
          <Text fontSize={14} color={COLORS.text.muted} marginBottom="$4">
            {currentQuestion.subtitle}
          </Text>
        )}
        {'format_hint' in currentQuestion && currentQuestion.format_hint && (
          <Text fontSize={14} color={COLORS.text.muted} marginBottom="$4">
            {currentQuestion.format_hint}
          </Text>
        )}

        {/* Actions */}
        <XStack gap="$2">
          <Pressable
            onPress={shuffleQuestion}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: 12,
              paddingVertical: 8,
              backgroundColor: COLORS.background.subtle,
              borderRadius: 8,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Shuffle size={14} color={COLORS.text.muted} />
            <Text fontSize={14} color={COLORS.text.muted}>
              換一題
            </Text>
          </Pressable>
          <Pressable
            onPress={() => onQuestionClick(currentQuestion.id, questionType)}
            style={({ pressed }) => ({
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              paddingHorizontal: 12,
              paddingVertical: 8,
              backgroundColor: pressed ? '#333' : COLORS.brand.dark,
              borderRadius: 8,
            })}
          >
            <Text fontSize={14} fontWeight="500" color="white">
              開始回答
            </Text>
            <ChevronRight size={14} color="white" />
          </Pressable>
        </XStack>
      </YStack>

      {/* Counter */}
      <YStack paddingHorizontal="$4" paddingBottom="$4">
        <Text fontSize={12} color={COLORS.text.muted} textAlign="center">
          還有 {unfilledQuestions.length} 題未回答
        </Text>
      </YStack>
    </View>
  )
}

export default RandomRecommend
