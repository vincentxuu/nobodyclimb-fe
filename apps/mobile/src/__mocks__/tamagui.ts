/**
 * Mock for @tamagui/core and tamagui in Jest tests.
 * Replaces Tamagui components with React Native primitives so tests
 * can run without a real Tamagui theme/config.
 */
import React from 'react'
import { Text, View } from 'react-native'

// Export as both TamaguiText and Text so imports like `{ Text as TamaguiText }` work
export { Text, View }
export const TamaguiText = Text
export const TamaguiView = View

// styled() — returns the base component unchanged (style props are applied inline by consumers)
export function styled(Component: React.ComponentType<any>, _config?: object) {
  return Component
}

// GetProps — type-only helper, no runtime value needed
export type GetProps<T> = T extends React.ComponentType<infer P> ? P : never

// Stack / XStack / YStack
export const Stack = View
export const XStack = View
export const YStack = View

// Separator
export const Separator = View

// Spinner
export const Spinner = View

// Theme / TamaguiProvider
export function Theme({ children }: { children: React.ReactNode }) {
  return React.createElement(React.Fragment, null, children)
}
export function TamaguiProvider({ children }: { children: React.ReactNode }) {
  return React.createElement(React.Fragment, null, children)
}

// createTamagui / createTokens / createTheme — return identity objects
export function createTamagui(config: object) {
  return config
}
export function createTokens(tokens: object) {
  return tokens
}
export function createTheme(theme: object) {
  return theme
}

export default {}
