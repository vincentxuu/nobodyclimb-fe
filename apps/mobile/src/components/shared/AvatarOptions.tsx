/**
 * AvatarOptions 組件
 *
 * 頭像選擇選項，對應 apps/web/src/components/shared/avatar-options.tsx
 */
import React from 'react'
import { StyleSheet, View, Pressable } from 'react-native'
import { Check } from 'lucide-react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'

import { SPACING } from '@nobodyclimb/constants'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// 定義預設頭像選項
export const DEFAULT_AVATARS = [
  {
    id: 'default1',
    bgColor: '#EBEAEA',
    fgColor: '#B6B3B3',
  },
  {
    id: 'default2',
    bgColor: '#FFE70C',
    fgColor: '#EBEAEA',
  },
  {
    id: 'default3',
    bgColor: '#1B1A1A',
    fgColor: '#FFE70C',
  },
  {
    id: 'default4',
    bgColor: '#78BE9D',
    fgColor: '#EBEAEA',
  },
  {
    id: 'default5',
    bgColor: '#8C54A4',
    fgColor: '#EBEAEA',
  },
  {
    id: 'default6',
    bgColor: '#E66060',
    fgColor: '#EBEAEA',
  },
] as const

export type AvatarStyle = (typeof DEFAULT_AVATARS)[number]

interface AvatarPreviewProps {
  avatarStyle: AvatarStyle
  size?: number
}

/**
 * 頭像預覽組件
 */
export function AvatarPreview({ avatarStyle, size = 40 }: AvatarPreviewProps) {
  return (
    <View
      style={[
        styles.avatarPreview,
        {
          width: size,
          height: size,
          backgroundColor: avatarStyle.bgColor,
        },
      ]}
    >
      <View style={styles.avatarInner}>
        <View
          style={[
            styles.avatarTop,
            { backgroundColor: avatarStyle.fgColor },
          ]}
        />
        <View
          style={[
            styles.avatarBottom,
            { backgroundColor: avatarStyle.fgColor },
          ]}
        />
      </View>
    </View>
  )
}

interface AvatarOptionItemProps {
  avatar: AvatarStyle
  isSelected: boolean
  onPress: () => void
}

function AvatarOptionItem({ avatar, isSelected, onPress }: AvatarOptionItemProps) {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15 })
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 })
  }

  return (
    <AnimatedPressable
      style={[styles.optionButton, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <AvatarPreview avatarStyle={avatar} size={64} />

      {isSelected && (
        <View style={styles.selectedOverlay}>
          <Check size={24} color="#FFFFFF" />
        </View>
      )}
    </AnimatedPressable>
  )
}

interface AvatarOptionsProps {
  /** 當前選中的頭像 ID */
  value: string
  /** 選擇變更回調 */
  onChange: (value: string) => void
}

/**
 * 頭像選項組件
 */
export function AvatarOptions({ value, onChange }: AvatarOptionsProps) {
  return (
    <View style={styles.container}>
      {DEFAULT_AVATARS.map((avatar) => (
        <AvatarOptionItem
          key={avatar.id}
          avatar={avatar}
          isSelected={value === avatar.id}
          onPress={() => onChange(avatar.id)}
        />
      ))}
    </View>
  )
}

/**
 * 透過 ID 獲取頭像樣式
 */
export function getAvatarStyleById(id: string): AvatarStyle {
  return DEFAULT_AVATARS.find((avatar) => avatar.id === id) || DEFAULT_AVATARS[0]
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
  },
  optionButton: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPreview: {
    borderRadius: 999,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    flexDirection: 'column',
  },
  avatarTop: {
    flex: 1,
    width: '100%',
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
  },
  avatarBottom: {
    flex: 1,
    width: '100%',
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export default AvatarOptions
