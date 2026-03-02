import React from 'react'
import { View, Pressable } from 'react-native'
import { YStack, XStack, Text } from 'tamagui'
import { Tag, ChevronRight } from 'lucide-react-native'
import { SEMANTIC_COLORS, COLORS } from '@nobodyclimb/constants'
import type { TagDimension } from '@nobodyclimb/types'
import { TagSelectorGroup } from '../shared/TagSelector'

interface TagsSectionProps {
  /** 標籤維度列表 */
  dimensions: TagDimension[]
  /** 已選中的標籤，按維度分組 */
  selections: Record<string, string[]>
  /** 選擇變更回調 */
  onSelectionChange: (dimensionId: string, selectedIds: string[]) => void
  /** 新增自訂標籤回調 */
  onAddCustomTag?: (dimensionId: string) => void
  /** 新增自訂維度回調 */
  onAddCustomDimension?: () => void
  /** 打開 BottomSheet 編輯 */
  onOpenBottomSheet?: () => void
}

/**
 * 標籤編輯區塊
 *
 * 用於編輯用戶的身份標籤
 * 在 Mobile 上顯示摘要模式，點擊後打開 BottomSheet 編輯
 */
export function TagsSection({
  dimensions,
  selections,
  onSelectionChange,
  onAddCustomTag,
  onAddCustomDimension,
  onOpenBottomSheet,
}: TagsSectionProps) {
  // 計算已選標籤總數
  const totalSelected = Object.values(selections).reduce(
    (sum, ids) => sum + ids.length,
    0
  )

  // 獲取已選標籤的名稱（用於摘要）
  const selectedTagLabels = dimensions.flatMap((dim) =>
    (selections[dim.id] || [])
      .map((tagId) => dim.options.find((o) => o.id === tagId)?.label)
      .filter(Boolean)
  ).slice(0, 6) // 最多顯示 6 個

  return (
    <YStack gap="$4">
      {/* Header */}
      <XStack alignItems="center" justifyContent="space-between">
        <XStack alignItems="center" gap="$2">
          <Tag size={18} color={SEMANTIC_COLORS.textSubtle} />
          <Text fontSize={16} fontWeight="600" color={SEMANTIC_COLORS.textMain}>
            身份標籤
          </Text>
          {totalSelected > 0 && (
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 2,
                backgroundColor: COLORS.background.subtle,
                borderRadius: 12,
              }}
            >
              <Text fontSize={12} color={COLORS.text.muted}>
                已選 {totalSelected} 個
              </Text>
            </View>
          )}
        </XStack>
      </XStack>

      {/* Selected Tags Summary */}
      {selectedTagLabels.length > 0 ? (
        <XStack flexWrap="wrap" gap="$2">
          {selectedTagLabels.map((label, index) => (
            <View
              key={index}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor: COLORS.background.subtle,
                borderRadius: 16,
              }}
            >
              <Text fontSize={14} color={SEMANTIC_COLORS.textSubtle}>
                {label}
              </Text>
            </View>
          ))}
          {totalSelected > 6 && (
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor: COLORS.background.subtle,
                borderRadius: 16,
              }}
            >
              <Text fontSize={14} color={COLORS.text.muted}>
                +{totalSelected - 6} 個
              </Text>
            </View>
          )}
        </XStack>
      ) : (
        <Text fontSize={14} color={COLORS.text.muted}>
          還沒有選擇任何標籤
        </Text>
      )}

      {/* Edit Button */}
      <Pressable
        onPress={onOpenBottomSheet}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderWidth: 1,
          borderColor: COLORS.border.light,
          borderRadius: 12,
          backgroundColor: pressed ? COLORS.background.subtle : 'transparent',
        })}
      >
        <Text fontSize={14} fontWeight="500" color={SEMANTIC_COLORS.textSubtle}>
          編輯標籤
        </Text>
        <ChevronRight size={16} color={SEMANTIC_COLORS.textSubtle} />
      </Pressable>
    </YStack>
  )
}

export default TagsSection
