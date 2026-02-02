/**
 * 路線路由布局
 */
import { Stack } from 'expo-router'

export default function RouteLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="[routeId]" />
    </Stack>
  )
}
