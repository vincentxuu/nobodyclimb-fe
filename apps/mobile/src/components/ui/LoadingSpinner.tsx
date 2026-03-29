/**
 * LoadingSpinner 組件
 *
 * 簡單的載入指示器
 */

import { SEMANTIC_COLORS } from '@nobodyclimb/constants'
import { ActivityIndicator, StyleSheet, View, ViewStyle } from 'react-native'

export interface LoadingSpinnerProps {
  /** 尺寸 */
  size?: 'small' | 'large'
  /** 顏色 */
  color?: string
  /** 容器樣式 */
  style?: ViewStyle
}

export function LoadingSpinner({
  size = 'small',
  color = SEMANTIC_COLORS.textMuted,
  style,
}: LoadingSpinnerProps) {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default LoadingSpinner
