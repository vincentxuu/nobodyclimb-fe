/**
 * 傳記探索 Layout
 */
import { Stack } from 'expo-router'
import { SEMANTIC_COLORS } from '@nobodyclimb/constants'

export default function ExploreLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: SEMANTIC_COLORS.pageBg },
      }}
    />
  )
}
