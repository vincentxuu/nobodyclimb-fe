/**
 * FadeIn 動畫包裝組件
 */
import React, { ReactNode } from 'react'
import Animated, {
  FadeIn as ReanimatedFadeIn,
  FadeInDown,
  FadeInUp,
  FadeInLeft,
  FadeInRight,
} from 'react-native-reanimated'

type FadeDirection = 'none' | 'up' | 'down' | 'left' | 'right'

interface FadeInProps {
  children: ReactNode
  direction?: FadeDirection
  duration?: number
  delay?: number
}

export function FadeIn({
  children,
  direction = 'none',
  duration = 300,
  delay = 0,
}: FadeInProps) {
  const getEnteringAnimation = () => {
    const baseAnimation = (() => {
      switch (direction) {
        case 'up':
          return FadeInUp
        case 'down':
          return FadeInDown
        case 'left':
          return FadeInLeft
        case 'right':
          return FadeInRight
        default:
          return ReanimatedFadeIn
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
