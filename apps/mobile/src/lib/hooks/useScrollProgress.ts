/**
 * useScrollProgress Hook
 *
 * 對應 apps/web/src/lib/hooks/useScrollProgress.ts
 * React Native 版本使用 Animated.event 或 onScroll
 */
import { useState, useCallback, useRef } from 'react'
import { NativeSyntheticEvent, NativeScrollEvent, LayoutChangeEvent } from 'react-native'

interface UseScrollProgressOptions {
  threshold?: number
}

interface UseScrollProgressResult {
  progress: number
  isScrolled: boolean
  scrollY: number
  contentHeight: number
  containerHeight: number
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onContentSizeChange: (w: number, h: number) => void
  onLayout: (event: LayoutChangeEvent) => void
}

export function useScrollProgress(
  options: UseScrollProgressOptions = {}
): UseScrollProgressResult {
  const { threshold = 10 } = options

  const [scrollY, setScrollY] = useState(0)
  const [contentHeight, setContentHeight] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)

  const progress = useCallback(() => {
    if (contentHeight <= containerHeight) return 0
    const maxScroll = contentHeight - containerHeight
    return Math.min(Math.max(scrollY / maxScroll, 0), 1)
  }, [scrollY, contentHeight, containerHeight])

  const isScrolled = scrollY > threshold

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrollY(event.nativeEvent.contentOffset.y)
  }, [])

  const onContentSizeChange = useCallback((w: number, h: number) => {
    setContentHeight(h)
  }, [])

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setContainerHeight(event.nativeEvent.layout.height)
  }, [])

  return {
    progress: progress(),
    isScrolled,
    scrollY,
    contentHeight,
    containerHeight,
    onScroll,
    onContentSizeChange,
    onLayout,
  }
}
