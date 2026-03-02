/**
 * 影片功能 Layout
 */
import { Stack } from 'expo-router'

export default function VideosLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  )
}
