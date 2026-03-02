/**
 * SlideUp 動畫包裝組件
 */
import React, { ReactNode } from 'react'
import Animated, {
  SlideInUp,
  SlideInDown,
  SlideInLeft,
  SlideInRight,
} from 'react-native-reanimated'

type SlideDirection = 'up' | 'down' | 'left' | 'right'

interface SlideUpProps {
  children: ReactNode
  direction?: SlideDirection
  duration?: number
  delay?: number
}

export function SlideUp({
  children,
  direction = 'up',
  duration = 300,
  delay = 0,
}: SlideUpProps) {
  const getEnteringAnimation = () => {
    const baseAnimation = (() => {
      switch (direction) {
        case 'up':
          return SlideInUp
        case 'down':
          return SlideInDown
        case 'left':
          return SlideInLeft
        case 'right':
          return SlideInRight
        default:
          return SlideInUp
      }
    })()

    return baseAnimation.duration(duration).delay(delay)
  }

  return (
    <Animated.View entering={getEnteringAnimation()}>
      {children}
    </Animated.View>
  )
}
