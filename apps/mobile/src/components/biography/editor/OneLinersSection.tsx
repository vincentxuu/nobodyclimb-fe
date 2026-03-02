import React, { useState } from 'react'
import { View, Pressable, TextInput } from 'react-native'
import { YStack, XStack, Text } from 'tamagui'
import {
  MessageCircle,
  Check,
  ChevronDown,
  RefreshCw,
  Plus,
  Clock,
  Lightbulb,
  Sparkles,
} from 'lucide-react-native'
import { SEMANTIC_COLORS, COLORS } from '@nobodyclimb/constants'
import type { OneLinerQuestion, OneLiner } from '@nobodyclimb/types'

interface OneLinersSectionProps {
  /** 問題列表 */
  questions: OneLinerQuestion[]
  /** 已填寫的答案 */
  answers: OneLiner[]
  /** 答案變更回調 */
  onAnswerChange: (questionId: string, answer: string | null) => void
  /** 新增自訂問題回調 */
  onAddCustomQuestion?: () => void
  /** 隨機推薦回調 */
  onRandomRecommend?: () => void
}

/**
 * 快問快答編輯區塊
 *
 * 用於編輯用戶的一句話回答
 */
export function OneLinersSection({
  questions,
  answers,
  onAnswerChange,
  onAddCustomQuestion,
  onRandomRecommend,
}: OneLinersSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const getAnswer = (questionId: string): string | undefined => {
    return answers.find((a) => a.question_id === questionId)?.answer
  }

  const filledCount = answers.filter((a) => a.answer?.trim()).length
  const totalCount = questions.length

  return (
    <YStack gap="$4">
      {/* Header */}
      <XStack alignItems="center" justifyContent="space-between">
        <XStack alignItems="center" gap="$2">
          <MessageCircle size={18} color={SEMANTIC_COLORS.textSubtle} />
          <Text fontSize={16} fontWeight="600" color={SEMANTIC_COLORS.textMain}>
            快問快答
          </Text>
          <XStack
            alignItems="center"
            gap="$1"
            paddingHorizontal="$2"
            paddingVertical="$1"
            backgroundColor={COLORS.background.subtle}
            borderRadius="$6"
          >
            <Clock size={12} color={COLORS.text.muted} />
            <Text fontSize={12} color={COLORS.text.muted}>
              2 分鐘
            </Text>
          </XStack>
        </XStack>
        <Text fontSize={14} color={COLORS.text.muted}>
          {filledCount}/{totalCount} 已填寫
        </Text>
      </XStack>

      <XStack alignItems="center" gap="$1">
        <Lightbulb size={14} color={COLORS.text.muted} />
        <Text fontSize={14} color={COLORS.text.muted}>
          選幾題回答就好，不用全部填
        </Text>
      </XStack>

      {/* Questions List */}
      <YStack gap="$3">
        {questions.map((question) => {
          const answer = getAnswer(question.id)
          const isFilled = !!answer?.trim()
          const isExpanded = expandedId === question.id

          return (
            <View
              key={question.id}
              style={{
                borderWidth: 1,
                borderColor: isFilled ? COLORS.brand.accent : COLORS.border.light,
                backgroundColor: isFilled ? `${COLORS.brand.accent}1A` : 'white',
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              {/* Question Header */}
              <Pressable
                onPress={() => setExpandedId(isExpanded ? null : question.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 16,
                }}
              >
                <XStack alignItems="center" gap="$3" flex={1}>
                  {/* Status Icon */}
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: isFilled ? COLORS.brand.accent : 'transparent',
                      borderWidth: isFilled ? 0 : 2,
                      borderColor: COLORS.border.default,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isFilled && <Check size={12} color={COLORS.brand.dark} />}
                  </View>

                  {/* Question Text */}
                  <View style={{ flex: 1 }}>
                    <XStack alignItems="center" gap="$1">
                      {question.source === 'user' && (
                        <Sparkles size={14} color={COLORS.brand.accent} />
                      )}
                      <Text
                        fontSize={14}
                        fontWeight="500"
                        color={isFilled ? SEMANTIC_COLORS.textMain : SEMANTIC_COLORS.textSubtle}
                        numberOfLines={2}
                      >
                        {question.question}
                      </Text>
                    </XStack>
                    {isFilled && !isExpanded && (
                      <Text
                        fontSize={13}
                        color={COLORS.text.muted}
                        marginTop="$1"
                        numberOfLines={1}
                      >
                        {answer}
                      </Text>
                    )}
                  </View>
                </XStack>

                {/* Expand Icon */}
                <ChevronDown
                  size={20}
                  color={COLORS.border.default}
                  style={{
                    transform: [{ rotate: isExpanded ? '180deg' : '0deg' }],
                  }}
                />
              </Pressable>

              {/* Answer Input */}
              {isExpanded && (
                <YStack paddingHorizontal="$4" paddingBottom="$4" gap="$3">
                  {question.format_hint && (
                    <XStack
                      alignItems="center"
                      gap="$1"
                      paddingHorizontal="$3"
                      paddingVertical="$2"
                      backgroundColor={COLORS.background.subtle}
                      borderRadius="$3"
                    >
                      <Lightbulb size={14} color={COLORS.text.muted} />
                      <Text fontSize={13} color={COLORS.text.muted}>
                        {question.format_hint}
                      </Text>
                    </XStack>
                  )}
                  <TextInput
                    value={answer || ''}
                    onChangeText={(text) => onAnswerChange(question.id, text || null)}
                    placeholder="輸入你的答案..."
                    placeholderTextColor={COLORS.text.placeholder}
                    maxLength={200}
                    style={{
                      width: '100%',
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      backgroundColor: 'white',
                      borderWidth: 1,
                      borderColor: COLORS.border.default,
                      borderRadius: 12,
                      color: SEMANTIC_COLORS.textMain,
                      fontSize: 14,
                    }}
                  />
                  <XStack justifyContent="space-between" alignItems="center">
                    <Text fontSize={12} color={COLORS.text.muted}>
                      {(answer?.length || 0)}/200
                    </Text>
                    {isFilled && (
                      <Pressable onPress={() => onAnswerChange(question.id, null)}>
                        <Text fontSize={12} color={COLORS.text.muted}>
                          清除回答
                        </Text>
                      </Pressable>
                    )}
                  </XStack>
                </YStack>
              )}
            </View>
          )
        })}
      </YStack>

      {/* Actions */}
      <XStack gap="$2" flexWrap="wrap">
        {onRandomRecommend && (
          <Pressable
            onPress={onRandomRecommend}
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
            <RefreshCw size={16} color={COLORS.text.muted} />
            <Text fontSize={14} color={COLORS.text.muted}>
              隨機推薦問題
            </Text>
          </Pressable>
        )}

        {onAddCustomQuestion && (
          <Pressable
            onPress={onAddCustomQuestion}
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
            <Plus size={16} color={COLORS.text.muted} />
            <Text fontSize={14} color={COLORS.text.muted}>
              自訂問題
            </Text>
          </Pressable>
        )}
      </XStack>
    </YStack>
  )
}

export default OneLinersSection
