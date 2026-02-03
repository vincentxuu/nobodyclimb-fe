/**
 * Games 路由布局
 */
import { Stack } from 'expo-router'

export default function GamesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="rope-system/index" />
      <Stack.Screen name="rope-system/learn/[categoryId]" />
    </Stack>
  )
}
