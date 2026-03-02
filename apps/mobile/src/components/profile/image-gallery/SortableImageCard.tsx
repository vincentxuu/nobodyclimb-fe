import React from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { Icon } from '../../ui/Icon'
import { Text } from '../../ui/Text'
import { ProfileImage } from '../types'
import { COLORS, SEMANTIC_COLORS } from '@nobodyclimb/constants'

interface SortableImageCardProps {
  image: ProfileImage
  onDelete?: () => void
  onPress?: () => void
  isDragging?: boolean
}

export default function SortableImageCard({
  image,
  onDelete,
  onPress,
  isDragging = false,
}: SortableImageCardProps) {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: isDragging ? 0.8 : 1,
  }))

  const handlePressIn = () => {
    scale.value = withSpring(0.95)
  }

  const handlePressOut = () => {
    scale.value = withSpring(1)
  }

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.pressable}
      >
        <Image
          source={{ uri: image.url }}
          style={styles.image}
          contentFit="cover"
        />

        {/* Drag Handle */}
        <View style={styles.dragHandle}>
          <Icon name="GripVertical" size="sm" color={COLORS.white} />
        </View>

        {/* Delete Button */}
        {onDelete && (
          <Pressable
            onPress={onDelete}
            style={styles.deleteButton}
            hitSlop={8}
          >
            <Icon name="X" size="xs" color={COLORS.white} />
          </Pressable>
        )}

        {/* Order Badge */}
        <View style={styles.orderBadge}>
          <Text variant="caption" style={{ color: COLORS.white }}>
            {image.order + 1}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  pressable: {
    aspectRatio: 1,
    backgroundColor: COLORS.gray[100],
  },
  image: {
    width: '100%',
    height: '100%',
  },
  dragHandle: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(220,38,38,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
})
