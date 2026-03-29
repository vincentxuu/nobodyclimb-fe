/**
 * Mock for react-native-reanimated in Jest tests.
 * Provides stub implementations so components using Animated/hooks
 * can render in a test environment without native modules.
 */
import React from 'react'
import { FlatList, Image, ScrollView, Text, View } from 'react-native'

// Animated component stubs
const Animated = {
  View,
  Text,
  ScrollView,
  FlatList,
  Image,
  createAnimatedComponent: (component: React.ComponentType<any>) => component,
}

// Shared value stub
export function useSharedValue(initialValue: any) {
  return { value: initialValue }
}

// Animated style stub — returns empty style
export function useAnimatedStyle(_fn: () => object) {
  return {}
}

// Animation stubs
export function withSpring(value: any, _config?: object, _callback?: () => void) {
  return value
}
export function withTiming(value: any, _config?: object, _callback?: () => void) {
  return value
}
export function withDelay(delay: number, animation: any) {
  return animation
}
export function withSequence(...animations: any[]) {
  return animations[animations.length - 1]
}
export function withRepeat(animation: any) {
  return animation
}
export function cancelAnimation(_sharedValue: any) {}
export function runOnJS(fn: (...args: any[]) => any) {
  return fn
}
export function runOnUI(fn: (...args: any[]) => any) {
  return fn
}
export function interpolate(
  value: number,
  inputRange: number[],
  outputRange: number[],
  _extrapolation?: string
) {
  return outputRange[0]
}

// Easing stubs
export const Easing = {
  bezier: (_x1: number, _y1: number, _x2: number, _y2: number) => (_t: number) => _t,
  linear: (_t: number) => _t,
  bounce: (_t: number) => _t,
  ease: (_t: number) => _t,
  in: (easing: (t: number) => number) => easing,
  out: (easing: (t: number) => number) => easing,
  inOut: (easing: (t: number) => number) => easing,
}

// useAnimatedProps
export function useAnimatedProps(_fn: () => object) {
  return {}
}

// useAnimatedRef
export function useAnimatedRef() {
  return { current: null }
}

// useAnimatedScrollHandler
export function useAnimatedScrollHandler(_handler: object) {
  return () => {}
}

// useDerivedValue
export function useDerivedValue(fn: () => any) {
  return { value: fn() }
}

export default Animated
