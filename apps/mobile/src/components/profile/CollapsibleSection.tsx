import React, { useState } from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { Text } from '../ui/Text'
import { Icon } from '../ui/Icon'
import { SEMANTIC_COLORS, COLORS } from '@nobodyclimb/constants'

interface CollapsibleSectionProps {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
  defaultExpanded?: boolean
  badge?: React.ReactNode
}

export default function CollapsibleSection({
  title,
  icon,
  children,
  defaultExpanded = true,
  badge,
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const rotation = useSharedValue(defaultExpanded ? 180 : 0)
  const contentHeight = useSharedValue(defaultExpanded ? 1 : 0)
  const opacity = useSharedValue(defaultExpanded ? 1 : 0)

  const toggleExpanded = () => {
    const newExpanded = !isExpanded
    setIsExpanded(newExpanded)
    rotation.value = withTiming(newExpanded ? 180 : 0, {
      duration: 200,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    })
    contentHeight.value = withTiming(newExpanded ? 1 : 0, {
      duration: 200,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    })
    opacity.value = withTiming(newExpanded ? 1 : 0, {
      duration: 200,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    })
  }

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }))

  const contentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    maxHeight: contentHeight.value === 1 ? 9999 : 0,
    overflow: 'hidden',
  }))

  return (
    <View style={styles.container}>
      {/* Header */}
      <Pressable onPress={toggleExpanded} style={styles.header}>
        <View style={styles.headerLeft}>
          {icon && <View style={styles.iconWrapper}>{icon}</View>}
          <Text variant="bodyBold" style={{ color: SEMANTIC_COLORS.textMain }}>
            {title}
          </Text>
          {badge}
        </View>
        <Animated.View style={chevronStyle}>
          <Icon name="ChevronDown" size="sm" color={COLORS.gray[500]} />
        </Animated.View>
      </Pressable>

      {/* Content */}
      <Animated.View style={contentStyle}>
        <View style={styles.content}>{children}</View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrapper: {
    opacity: 0.7,
  },
  content: {
    gap: 16,
  },
})
