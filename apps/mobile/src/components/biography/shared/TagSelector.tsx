import React, { useState } from 'react'
import { View, Pressable } from 'react-native'
import { YStack, XStack, Text } from 'tamagui'
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Tag,
  Clock,
  Lightbulb,
  Sparkles,
  HeartPulse,
  Footprints,
  Tent,
  Music,
  Target,
  Users,
  Hand,
  Dumbbell,
  MapPin,
  Check,
} from 'lucide-react-native'
import type { LucideIcon } from 'lucide-react-native'
import { SEMANTIC_COLORS, COLORS } from '@nobodyclimb/constants'
import type { TagDimension, TagOption } from '@nobodyclimb/types'

// Icon mapping for dynamic rendering
const iconMap: Record<string, LucideIcon> = {
  Sparkles,
  HeartPulse,
  Footprints,
  Clock,
  Tent,
  Music,
  Target,
  Users,
  Hand,
  Dumbbell,
  MapPin,
}

interface TagCardProps {
  tag: TagOption
  selected: boolean
  onClick: () => void
  multiSelect?: boolean
}

/**
 * 標籤卡片
 */
function TagCard({ tag, selected, onClick, multiSelect = true }: TagCardProps) {
  return (
    <Pressable
      onPress={onClick}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: selected ? COLORS.brand.accent : COLORS.border.light,
        backgroundColor: selected ? `${COLORS.brand.accent}1A` : pressed ? COLORS.background.subtle : 'white',
      })}
    >
      {/* Selection indicator */}
      <View
        style={{
          width: 18,
          height: 18,
          borderRadius: multiSelect ? 4 : 9,
          borderWidth: selected ? 0 : 2,
          borderColor: COLORS.border.default,
          backgroundColor: selected ? COLORS.brand.accent : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selected && <Check size={12} color={COLORS.brand.dark} />}
      </View>

      {/* Label */}
      <View style={{ flex: 1 }}>
        <XStack alignItems="center" gap="$1">
          {tag.source === 'user' && <Sparkles size={12} color={COLORS.brand.accent} />}
          <Text
            fontSize={14}
            color={selected ? SEMANTIC_COLORS.textMain : SEMANTIC_COLORS.textSubtle}
          >
            {tag.label}
          </Text>
        </XStack>
        {tag.description && (
          <Text fontSize={12} color={COLORS.text.muted} numberOfLines={1}>
            {tag.description}
          </Text>
        )}
      </View>
    </Pressable>
  )
}

interface TagSelectorProps {
  /** 標籤維度資料 */
  dimension: TagDimension
  /** 已選中的標籤 ID 列表 */
  selectedIds: string[]
  /** 選擇變更回調 */
  onSelectionChange: (selectedIds: string[]) => void
  /** 是否預設展開 */
  defaultExpanded?: boolean
  /** 是否顯示新增自訂標籤按鈕 */
  showAddCustom?: boolean
  /** 新增自訂標籤回調 */
  onAddCustom?: () => void
}

/**
 * 標籤選擇器組件
 *
 * 用於編輯器中選擇某個維度的標籤
 */
export function TagSelector({
  dimension,
  selectedIds,
  onSelectionChange,
  defaultExpanded = true,
  showAddCustom = true,
  onAddCustom,
}: TagSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const isMultiSelect = dimension.selection_mode === 'multiple'

  const handleTagClick = (tagId: string) => {
    if (isMultiSelect) {
      // 複選：toggle 選擇
      if (selectedIds.includes(tagId)) {
        onSelectionChange(selectedIds.filter((id) => id !== tagId))
      } else {
        onSelectionChange([...selectedIds, tagId])
      }
    } else {
      // 單選：替換選擇
      if (selectedIds.includes(tagId)) {
        onSelectionChange([])
      } else {
        onSelectionChange([tagId])
      }
    }
  }

  const selectedCount = selectedIds.filter((id) =>
    dimension.options.some((opt) => opt.id === id)
  ).length

  const IconComponent = iconMap[dimension.icon] || Tag

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: COLORS.border.light,
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Pressable
        onPress={() => setIsExpanded(!isExpanded)}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 16,
          backgroundColor: pressed ? COLORS.background.muted : COLORS.background.subtle,
        })}
      >
        <XStack alignItems="center" gap="$2">
          <IconComponent size={20} color={SEMANTIC_COLORS.textSubtle} />
          <Text fontSize={14} fontWeight="500" color={SEMANTIC_COLORS.textMain}>
            {dimension.name}
          </Text>
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 2,
              backgroundColor: COLORS.background.muted,
              borderRadius: 12,
            }}
          >
            <Text fontSize={12} color={COLORS.text.muted}>
              {isMultiSelect ? '可複選' : '單選'}
            </Text>
          </View>
        </XStack>
        <XStack alignItems="center" gap="$2">
          {selectedCount > 0 && (
            <Text fontSize={14} fontWeight="500" color={SEMANTIC_COLORS.textMain}>
              已選 {selectedCount} 個
            </Text>
          )}
          <ChevronDown
            size={20}
            color={COLORS.text.muted}
            style={{
              transform: [{ rotate: isExpanded ? '180deg' : '0deg' }],
            }}
          />
        </XStack>
      </Pressable>

      {/* Content */}
      {isExpanded && (
        <YStack padding="$4" gap="$3">
          {dimension.description && (
            <Text fontSize={14} color={COLORS.text.muted} marginBottom="$2">
              {dimension.description}
            </Text>
          )}

          {/* Tags Grid */}
          <YStack gap="$2">
            {dimension.options.map((option) => (
              <TagCard
                key={option.id}
                tag={option}
                selected={selectedIds.includes(option.id)}
                onClick={() => handleTagClick(option.id)}
                multiSelect={isMultiSelect}
              />
            ))}
          </YStack>

          {/* Add Custom Button */}
          {showAddCustom && onAddCustom && (
            <Pressable
              onPress={onAddCustom}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                marginTop: 8,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Plus size={16} color={COLORS.text.muted} />
              <Text fontSize={14} color={COLORS.text.muted}>
                自訂標籤
              </Text>
            </Pressable>
          )}
        </YStack>
      )}
    </View>
  )
}

/**
 * 標籤選擇器群組
 *
 * 用於顯示多個維度的標籤選擇器
 */
interface TagSelectorGroupProps {
  /** 標籤維度列表 */
  dimensions: TagDimension[]
  /** 已選中的標籤，按維度分組 */
  selections: Record<string, string[]>
  /** 選擇變更回調 */
  onSelectionChange: (dimensionId: string, selectedIds: string[]) => void
  /** 顯示的維度數量（剩餘會收合） */
  visibleCount?: number
  /** 是否顯示新增自訂標籤按鈕 */
  showAddCustom?: boolean
  /** 新增自訂標籤回調 */
  onAddCustomTag?: (dimensionId: string) => void
  /** 新增自訂維度回調 */
  onAddCustomDimension?: () => void
}

export function TagSelectorGroup({
  dimensions,
  selections,
  onSelectionChange,
  visibleCount = 4,
  showAddCustom = true,
  onAddCustomTag,
  onAddCustomDimension,
}: TagSelectorGroupProps) {
  const [showAll, setShowAll] = useState(false)

  const visibleDimensions = showAll
    ? dimensions
    : dimensions.slice(0, visibleCount)
  const hiddenCount = dimensions.length - visibleCount

  const totalSelected = Object.values(selections).reduce(
    (sum, ids) => sum + ids.length,
    0
  )

  return (
    <YStack gap="$4">
      {/* Header */}
      <XStack alignItems="center" justifyContent="space-between">
        <XStack alignItems="center" gap="$2">
          <Tag size={18} color={SEMANTIC_COLORS.textSubtle} />
          <Text fontSize={16} fontWeight="600" color={SEMANTIC_COLORS.textMain}>
            幫自己貼標籤
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
              30 秒
            </Text>
          </XStack>
        </XStack>
        {totalSelected > 0 && (
          <Text fontSize={14} fontWeight="500" color={SEMANTIC_COLORS.textMain}>
            已選 {totalSelected} 個標籤
          </Text>
        )}
      </XStack>

      <XStack alignItems="center" gap="$1">
        <Lightbulb size={14} color={COLORS.text.muted} />
        <Text fontSize={14} color={COLORS.text.muted}>
          選一選就完成了，不用打字
        </Text>
      </XStack>

      {/* Dimension Selectors */}
      <YStack gap="$4">
        {visibleDimensions.map((dimension, index) => (
          <TagSelector
            key={dimension.id}
            dimension={dimension}
            selectedIds={selections[dimension.id] || []}
            onSelectionChange={(ids) => onSelectionChange(dimension.id, ids)}
            defaultExpanded={index < 2}
            showAddCustom={showAddCustom}
            onAddCustom={
              onAddCustomTag ? () => onAddCustomTag(dimension.id) : undefined
            }
          />
        ))}
      </YStack>

      {/* Show More / Show Less */}
      {hiddenCount > 0 && (
        <Pressable
          onPress={() => setShowAll(!showAll)}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          {showAll ? (
            <>
              <Text fontSize={14} color={COLORS.text.muted}>
                收合更多標籤
              </Text>
              <ChevronUp size={16} color={COLORS.text.muted} />
            </>
          ) : (
            <>
              <Text fontSize={14} color={COLORS.text.muted}>
                展開更多標籤 ({hiddenCount} 個類別)
              </Text>
              <ChevronDown size={16} color={COLORS.text.muted} />
            </>
          )}
        </Pressable>
      )}

      {/* Add Custom Dimension */}
      {showAddCustom && onAddCustomDimension && (
        <Pressable
          onPress={onAddCustomDimension}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Plus size={16} color={COLORS.text.muted} />
          <Text fontSize={14} color={COLORS.text.muted}>
            新增標籤類別
          </Text>
        </Pressable>
      )}
    </YStack>
  )
}

export default TagSelector
