/**
 * Biography 路由布局
 */
import { Stack } from 'expo-router'

export default function BiographyLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="[slug]" />
      <Stack.Screen name="explore/index" />
      <Stack.Screen name="community" />
    </Stack>
  )
}
