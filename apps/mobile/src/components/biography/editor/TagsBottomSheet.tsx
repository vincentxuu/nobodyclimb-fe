import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  View,
  Pressable,
  Modal,
  Animated,
  Dimensions,
  ScrollView,
  PanResponder,
} from 'react-native'
import { YStack, XStack, Text } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  Check,
  Tag,
  ChevronDown,
  Plus,
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
  X,
} from 'lucide-react-native'
import type { LucideIcon } from 'lucide-react-native'
import { SEMANTIC_COLORS, COLORS } from '@nobodyclimb/constants'
import type { TagDimension, TagOption } from '@nobodyclimb/types'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.85

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
  onPress: () => void
  multiSelect?: boolean
}

function TagCard({ tag, selected, onPress, multiSelect = true }: TagCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: selected ? COLORS.brand.dark : COLORS.border.light,
        backgroundColor: selected
          ? `${COLORS.brand.accent}1A`
          : pressed
            ? COLORS.background.subtle
            : 'white',
      })}
    >
      {tag.source === 'user' && <Sparkles size={12} color={COLORS.brand.accent} />}
      <Text
        fontSize={14}
        fontWeight={selected ? '500' : '400'}
        color={selected ? COLORS.brand.dark : SEMANTIC_COLORS.textSubtle}
      >
        {tag.label}
      </Text>
      {selected && <Check size={14} color={COLORS.brand.dark} />}
    </Pressable>
  )
}

interface TagsBottomSheetProps {
  /** 是否開啟 */
  isOpen: boolean
  /** 關閉回調 */
  onClose: () => void
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
  /** 完成回調 */
  onComplete?: () => void
}

/**
 * 標籤編輯 Bottom Sheet
 *
 * 手機版專用的標籤編輯介面，使用底部滑出動畫
 */
export function TagsBottomSheet({
  isOpen,
  onClose,
  dimensions,
  selections,
  onSelectionChange,
  onAddCustomTag,
  onAddCustomDimension,
  onComplete,
}: TagsBottomSheetProps) {
  const insets = useSafeAreaInsets()
  const [expandedDimensions, setExpandedDimensions] = useState<Set<string>>(new Set())
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current
  const backdropAnim = useRef(new Animated.Value(0)).current

  // Pan responder for drag to dismiss
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 0
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy)
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          onClose()
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start()
        }
      },
    })
  ).current

  // 處理開啟/關閉動畫
  useEffect(() => {
    if (isOpen) {
      // 預設展開前兩個維度
      const defaultExpanded = new Set(dimensions.slice(0, 2).map((d) => d.id))
      setExpandedDimensions(defaultExpanded)

      // 滑入動畫
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      // 滑出動畫
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SHEET_HEIGHT,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [isOpen, dimensions, slideAnim, backdropAnim])

  // 處理標籤點擊
  const handleTagClick = useCallback(
    (dimension: TagDimension, tagId: string) => {
      const currentSelection = selections[dimension.id] || []
      const isMultiSelect = dimension.selection_mode === 'multiple'

      if (isMultiSelect) {
        if (currentSelection.includes(tagId)) {
          onSelectionChange(
            dimension.id,
            currentSelection.filter((id) => id !== tagId)
          )
        } else {
          onSelectionChange(dimension.id, [...currentSelection, tagId])
        }
      } else {
        if (currentSelection.includes(tagId)) {
          onSelectionChange(dimension.id, [])
        } else {
          onSelectionChange(dimension.id, [tagId])
        }
      }
    },
    [selections, onSelectionChange]
  )

  // 切換維度展開狀態
  const toggleDimension = useCallback((dimensionId: string) => {
    setExpandedDimensions((prev) => {
      const next = new Set(prev)
      if (next.has(dimensionId)) {
        next.delete(dimensionId)
      } else {
        next.add(dimensionId)
      }
      return next
    })
  }, [])

  // 計算總選中數量
  const totalSelected = Object.values(selections).reduce((sum, ids) => sum + ids.length, 0)

  // 處理完成
  const handleComplete = () => {
    if (onComplete) {
      onComplete()
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <Modal visible={isOpen} animationType="none" transparent statusBarTranslucent onRequestClose={onClose}>
      {/* Backdrop */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: `${COLORS.brand.dark}4D`,
          opacity: backdropAnim,
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      {/* Bottom Sheet */}
      <Animated.View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: SHEET_HEIGHT,
          backgroundColor: 'white',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          transform: [{ translateY: slideAnim }],
        }}
      >
        {/* Drag Handle */}
        <View {...panResponder.panHandlers} style={{ paddingTop: 12, paddingBottom: 8, alignItems: 'center' }}>
          <View
            style={{
              width: 40,
              height: 4,
              backgroundColor: COLORS.border.default,
              borderRadius: 2,
            }}
          />
        </View>

        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.border.light,
          }}
        >
          <XStack alignItems="center" gap="$2">
            <Pressable
              onPress={onClose}
              style={{
                padding: 6,
                marginLeft: -6,
                borderRadius: 20,
              }}
            >
              <X size={20} color={COLORS.text.muted} />
            </Pressable>
            <Tag size={20} color={SEMANTIC_COLORS.textSubtle} />
            <Text fontSize={16} fontWeight="600" color={SEMANTIC_COLORS.textMain}>
              幫自己貼標籤
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
          <Pressable
            onPress={handleComplete}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: pressed ? COLORS.brand.darkHover : COLORS.brand.dark,
              borderRadius: 20,
            })}
          >
            <Check size={16} color="white" />
            <Text fontSize={14} fontWeight="500" color="white">
              完成
            </Text>
          </Pressable>
        </View>

        {/* Content */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          <YStack gap="$3">
            {dimensions.map((dimension) => {
              const isExpanded = expandedDimensions.has(dimension.id)
              const selectedCount = (selections[dimension.id] || []).length
              const IconComponent = iconMap[dimension.icon] || Tag

              return (
                <View
                  key={dimension.id}
                  style={{
                    borderWidth: 1,
                    borderColor: COLORS.border.light,
                    borderRadius: 12,
                    overflow: 'hidden',
                  }}
                >
                  {/* Dimension Header */}
                  <Pressable
                    onPress={() => toggleDimension(dimension.id)}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 12,
                      backgroundColor: pressed ? COLORS.background.muted : COLORS.background.subtle,
                    })}
                  >
                    <XStack alignItems="center" gap="$2">
                      <IconComponent size={18} color={SEMANTIC_COLORS.textSubtle} />
                      <Text fontSize={14} fontWeight="500" color={SEMANTIC_COLORS.textMain}>
                        {dimension.name}
                      </Text>
                      {selectedCount > 0 && (
                        <Text fontSize={14} fontWeight="500" color={COLORS.brand.dark}>
                          ({selectedCount})
                        </Text>
                      )}
                    </XStack>
                    <ChevronDown
                      size={18}
                      color={COLORS.text.muted}
                      style={{
                        transform: [{ rotate: isExpanded ? '180deg' : '0deg' }],
                      }}
                    />
                  </Pressable>

                  {/* Tags */}
                  {isExpanded && (
                    <YStack padding="$3" gap="$2">
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {dimension.options.map((option) => (
                          <TagCard
                            key={option.id}
                            tag={option}
                            selected={(selections[dimension.id] || []).includes(option.id)}
                            onPress={() => handleTagClick(dimension, option.id)}
                            multiSelect={dimension.selection_mode === 'multiple'}
                          />
                        ))}
                        {/* 新增自訂標籤按鈕 */}
                        {onAddCustomTag && (
                          <Pressable
                            onPress={() => onAddCustomTag(dimension.id)}
                            style={({ pressed }) => ({
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 4,
                              paddingHorizontal: 12,
                              paddingVertical: 8,
                              borderRadius: 20,
                              borderWidth: 1,
                              borderStyle: 'dashed',
                              borderColor: COLORS.border.default,
                              opacity: pressed ? 0.7 : 1,
                            })}
                          >
                            <Plus size={14} color={COLORS.text.muted} />
                            <Text fontSize={14} color={COLORS.text.muted}>
                              新增
                            </Text>
                          </Pressable>
                        )}
                      </View>
                      <Text fontSize={12} color={COLORS.text.muted}>
                        {dimension.selection_mode === 'multiple' ? '可複選' : '單選'}
                        {dimension.description && ` · ${dimension.description}`}
                      </Text>
                    </YStack>
                  )}
                </View>
              )
            })}

            {/* 新增標籤類別按鈕 */}
            {onAddCustomDimension && (
              <Pressable
                onPress={onAddCustomDimension}
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
                  新增標籤類別
                </Text>
              </Pressable>
            )}
          </YStack>
        </ScrollView>
      </Animated.View>
    </Modal>
  )
}

export default TagsBottomSheet
