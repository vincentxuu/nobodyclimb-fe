/**
 * 位置詳情 Layout
 */

import { SEMANTIC_COLORS } from '@nobodyclimb/constants'
import { Stack } from 'expo-router'

export default function LocationLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: SEMANTIC_COLORS.pageBg },
      }}
    />
  )
}
