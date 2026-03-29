/**
 * 傳記探索 Layout
 */

import { SEMANTIC_COLORS } from '@nobodyclimb/constants'
import { Stack } from 'expo-router'

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
