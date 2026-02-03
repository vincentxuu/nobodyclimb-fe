/**
 * ScaleIn 動畫包裝組件
 */
import React, { ReactNode } from 'react'
import Animated, {
  ZoomIn,
  ZoomInDown,
  ZoomInUp,
  BounceIn,
} from 'react-native-reanimated'

type ScaleType = 'zoom' | 'bounce' | 'zoomUp' | 'zoomDown'

interface ScaleInProps {
  children: ReactNode
  type?: ScaleType
  duration?: number
  delay?: number
}

export function ScaleIn({
  children,
  type = 'zoom',
  duration = 300,
  delay = 0,
}: ScaleInProps) {
  const getEnteringAnimation = () => {
    const baseAnimation = (() => {
      switch (type) {
        case 'bounce':
          return BounceIn
        case 'zoomUp':
          return ZoomInUp
        case 'zoomDown':
          return ZoomInDown
        default:
          return ZoomIn
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
