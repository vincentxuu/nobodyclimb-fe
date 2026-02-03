/**
 * 位置詳情 Layout
 */
import { Stack } from 'expo-router'
import { SEMANTIC_COLORS } from '@nobodyclimb/constants'

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
