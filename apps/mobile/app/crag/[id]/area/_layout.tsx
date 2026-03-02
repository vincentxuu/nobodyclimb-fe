/**
 * 區域路由布局
 */
import { Stack } from 'expo-router'

export default function AreaLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="[areaId]" />
    </Stack>
  )
}
