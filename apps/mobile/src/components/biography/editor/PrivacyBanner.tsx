import React, { useState } from 'react'
import { View, Pressable } from 'react-native'
import { YStack, XStack, Text } from 'tamagui'
import { ChevronDown, Check, Globe, Users, Lock, Glasses } from 'lucide-react-native'
import { SEMANTIC_COLORS, COLORS } from '@nobodyclimb/constants'
import type { VisibilityLevel } from '@nobodyclimb/types'
import type { LucideIcon } from 'lucide-react-native'

interface PrivacyBannerProps {
  /** 當前可見性設定 */
  visibility: VisibilityLevel
  /** 可見性變更回調 */
  onVisibilityChange: (visibility: VisibilityLevel) => void
  /** 是否可以編輯 */
  editable?: boolean
}

interface VisibilityOption {
  value: VisibilityLevel
  icon: LucideIcon
  label: string
  description: string
}

const visibilityOptions: VisibilityOption[] = [
  {
    value: 'public',
    icon: Globe,
    label: '公開',
    description: '所有人都可以看到',
  },
  {
    value: 'community',
    icon: Users,
    label: '社群',
    description: '只有社群成員可以看到',
  },
  {
    value: 'private',
    icon: Lock,
    label: '私密',
    description: '只有自己可以看到',
  },
  {
    value: 'anonymous',
    icon: Glasses,
    label: '匿名公開',
    description: '公開但不顯示你的名字',
  },
]

/**
 * 隱私設定橫幅
 *
 * 讓用戶設定人物誌的可見性
 */
export function PrivacyBanner({
  visibility,
  onVisibilityChange,
  editable = true,
}: PrivacyBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const currentOption = visibilityOptions.find((opt) => opt.value === visibility)
  const CurrentIcon = currentOption?.icon || Globe

  if (!editable) {
    return (
      <XStack
        alignItems="center"
        gap="$2"
        paddingHorizontal="$4"
        paddingVertical="$3"
        backgroundColor={COLORS.background.subtle}
        borderRadius="$4"
      >
        <CurrentIcon size={18} color={SEMANTIC_COLORS.textSubtle} />
        <Text fontSize={14} color={COLORS.text.muted}>
          目前設定：{currentOption?.label}
        </Text>
      </XStack>
    )
  }

  return (
    <YStack backgroundColor={COLORS.background.subtle} borderRadius="$4" overflow="hidden">
      {/* Header */}
      <Pressable
        onPress={() => setIsExpanded(!isExpanded)}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: pressed ? COLORS.background.muted : 'transparent',
        })}
      >
        <XStack alignItems="center" gap="$2" flex={1}>
          <CurrentIcon size={18} color={SEMANTIC_COLORS.textSubtle} />
          <View style={{ flex: 1 }}>
            <XStack alignItems="center" gap="$2">
              <Text fontSize={14} fontWeight="500" color={SEMANTIC_COLORS.textMain}>
                {currentOption?.label}
              </Text>
              <Text fontSize={14} color={COLORS.text.muted}>
                {currentOption?.description}
              </Text>
            </XStack>
          </View>
        </XStack>
        <ChevronDown
          size={20}
          color={COLORS.text.muted}
          style={{
            transform: [{ rotate: isExpanded ? '180deg' : '0deg' }],
          }}
        />
      </Pressable>

      {/* Options */}
      {isExpanded && (
        <YStack paddingHorizontal="$4" paddingBottom="$4" gap="$2">
          {visibilityOptions.map((option) => {
            const Icon = option.icon
            const isSelected = visibility === option.value
            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  onVisibilityChange(option.value)
                  setIsExpanded(false)
                }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 8,
                  backgroundColor: isSelected ? `${COLORS.brand.accent}33` : 'white',
                  borderWidth: isSelected ? 2 : 1,
                  borderColor: isSelected ? COLORS.brand.accent : COLORS.border.default,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Icon size={20} color={SEMANTIC_COLORS.textSubtle} />
                <View style={{ flex: 1 }}>
                  <Text
                    fontSize={14}
                    fontWeight="500"
                    color={isSelected ? SEMANTIC_COLORS.textMain : SEMANTIC_COLORS.textSubtle}
                  >
                    {option.label}
                  </Text>
                  <Text fontSize={13} color={COLORS.text.muted}>
                    {option.description}
                  </Text>
                </View>
                {isSelected && <Check size={20} color={SEMANTIC_COLORS.textMain} />}
              </Pressable>
            )
          })}
        </YStack>
      )}
    </YStack>
  )
}

export default PrivacyBanner
