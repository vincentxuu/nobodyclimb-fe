/**
 * 岩場詳情路由布局
 */
import { Stack } from 'expo-router'

export default function CragDetailLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="route" />
      <Stack.Screen name="area" />
    </Stack>
  )
}
