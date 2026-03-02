/**
 * Crag 路由布局
 */
import { Stack } from 'expo-router'

export default function CragLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
    </Stack>
  )
}
