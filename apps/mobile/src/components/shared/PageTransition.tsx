/**
 * PageTransition 組件
 *
 * 頁面切換動畫，對應 apps/web/src/components/shared/page-transition.tsx
 */
import React from 'react'
import { StyleSheet, ViewStyle } from 'react-native'
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  Layout,
} from 'react-native-reanimated'

import { DURATION } from '@nobodyclimb/constants'

type TransitionType = 'fade' | 'slide' | 'scale' | 'none'

interface PageTransitionProps {
  children: React.ReactNode
  /** 轉場類型 */
  type?: TransitionType
  /** 動畫時長 (ms) */
  duration?: number
  /** 延遲時間 (ms) */
  delay?: number
  /** 自訂樣式 */
  style?: ViewStyle
}

export function PageTransition({
  children,
  type = 'fade',
  duration = DURATION.normal,
  delay = 0,
  style,
}: PageTransitionProps) {
  const getEnteringAnimation = () => {
    switch (type) {
      case 'fade':
        return FadeIn.duration(duration).delay(delay)
      case 'slide':
        return SlideInRight.duration(duration).delay(delay)
      case 'scale':
        return FadeIn.duration(duration).delay(delay)
      case 'none':
        return undefined
      default:
        return FadeIn.duration(duration).delay(delay)
    }
  }

  const getExitingAnimation = () => {
    switch (type) {
      case 'fade':
        return FadeOut.duration(duration)
      case 'slide':
        return SlideOutLeft.duration(duration)
      case 'scale':
        return FadeOut.duration(duration)
      case 'none':
        return undefined
      default:
        return FadeOut.duration(duration)
    }
  }

  if (type === 'none') {
    return <>{children}</>
  }

  return (
    <Animated.View
      style={[styles.container, style]}
      entering={getEnteringAnimation()}
      exiting={getExitingAnimation()}
      layout={Layout.duration(duration)}
    >
      {children}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})

export default PageTransition
