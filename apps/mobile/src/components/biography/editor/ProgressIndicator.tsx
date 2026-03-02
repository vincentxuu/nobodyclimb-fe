import React from 'react'
import { View, Pressable } from 'react-native'
import { YStack, XStack, Text } from 'tamagui'
import { Check, ChevronRight, BarChart3 } from 'lucide-react-native'
import { SEMANTIC_COLORS, COLORS } from '@nobodyclimb/constants'
import type { LucideIcon } from 'lucide-react-native'

interface ProgressSection {
  id: string
  label: string
  icon: LucideIcon
  isCompleted: boolean
  progress?: {
    completed: number
    total: number
  }
}

interface ProgressIndicatorProps {
  /** 各區塊的完成狀態 */
  sections: ProgressSection[]
  /** 當前活動區塊 ID */
  activeSection?: string
  /** 區塊點擊回調 */
  onSectionClick?: (sectionId: string) => void
}

/**
 * 進度指示器
 *
 * 顯示人物誌的填寫進度
 */
export function ProgressIndicator({
  sections,
  activeSection,
  onSectionClick,
}: ProgressIndicatorProps) {
  const completedCount = sections.filter((s) => s.isCompleted).length
  const totalCount = sections.length
  const overallProgress = Math.round((completedCount / totalCount) * 100)

  return (
    <YStack
      backgroundColor="white"
      borderRadius="$4"
      borderWidth={1}
      borderColor={COLORS.border.light}
      padding="$4"
    >
      {/* Header */}
      <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
        <XStack alignItems="center" gap="$2">
          <BarChart3 size={18} color={SEMANTIC_COLORS.textSubtle} />
          <Text fontSize={14} fontWeight="500" color={SEMANTIC_COLORS.textMain}>
            完成進度
          </Text>
        </XStack>
        <View
          style={{
            backgroundColor: overallProgress === 100 ? `${COLORS.brand.accent}33` : COLORS.background.subtle,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
          }}
        >
          <Text
            fontSize={13}
            fontWeight="500"
            color={overallProgress === 100 ? SEMANTIC_COLORS.textMain : COLORS.text.muted}
          >
            {overallProgress}%
          </Text>
        </View>
      </XStack>

      {/* Progress Bar */}
      <View
        style={{
          height: 8,
          backgroundColor: COLORS.background.muted,
          borderRadius: 4,
          marginBottom: 16,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            height: '100%',
            width: `${overallProgress}%`,
            backgroundColor: overallProgress === 100 ? COLORS.brand.accent : COLORS.brand.dark,
            borderRadius: 4,
          }}
        />
      </View>

      {/* Sections */}
      <YStack gap="$2">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <Pressable
              key={section.id}
              onPress={() => onSectionClick?.(section.id)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor:
                  activeSection === section.id
                    ? `${COLORS.brand.accent}1A`
                    : pressed
                      ? COLORS.background.subtle
                      : 'transparent',
              })}
            >
              {/* Status Icon */}
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: section.isCompleted ? COLORS.brand.accent : COLORS.background.muted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {section.isCompleted ? (
                  <Check size={14} color={COLORS.brand.dark} />
                ) : (
                  <Icon size={14} color={COLORS.text.muted} />
                )}
              </View>

              {/* Label & Progress */}
              <View style={{ flex: 1 }}>
                <XStack alignItems="center">
                  <Text
                    fontSize={14}
                    color={section.isCompleted ? SEMANTIC_COLORS.textMain : COLORS.text.muted}
                  >
                    {section.label}
                  </Text>
                  {section.progress && (
                    <Text fontSize={12} color={COLORS.text.muted} marginLeft="$2">
                      {section.progress.completed}/{section.progress.total}
                    </Text>
                  )}
                </XStack>
              </View>

              {/* Arrow */}
              {onSectionClick && (
                <ChevronRight size={16} color={COLORS.border.default} />
              )}
            </Pressable>
          )
        })}
      </YStack>

      {/* Completion Message */}
      {overallProgress === 100 && (
        <View
          style={{
            marginTop: 16,
            padding: 12,
            backgroundColor: `${COLORS.brand.accent}33`,
            borderRadius: 8,
          }}
        >
          <Text fontSize={14} color={SEMANTIC_COLORS.textMain} textAlign="center">
            太棒了！你的人物誌已經完成！
          </Text>
        </View>
      )}
    </YStack>
  )
}

/**
 * 簡易進度條
 *
 * 用於顯示單一區塊的完成進度
 */
interface SimpleProgressBarProps {
  /** 完成數量 */
  completed: number
  /** 總數量 */
  total: number
  /** 顯示文字 */
  showLabel?: boolean
}

export function SimpleProgressBar({
  completed,
  total,
  showLabel = true,
}: SimpleProgressBarProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <XStack alignItems="center" gap="$2">
      <View
        style={{
          flex: 1,
          height: 6,
          backgroundColor: COLORS.background.muted,
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            height: '100%',
            width: `${percentage}%`,
            backgroundColor: percentage === 100 ? COLORS.brand.accent : COLORS.brand.dark,
            borderRadius: 3,
          }}
        />
      </View>
      {showLabel && (
        <Text fontSize={12} color={COLORS.text.muted}>
          {completed}/{total}
        </Text>
      )}
    </XStack>
  )
}

export default ProgressIndicator
