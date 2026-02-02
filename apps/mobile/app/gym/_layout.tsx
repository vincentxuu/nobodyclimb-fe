/**
 * Gym 路由布局
 */
import { Stack } from 'expo-router'

export default function GymLayout() {
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
