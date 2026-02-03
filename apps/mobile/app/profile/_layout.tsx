/**
 * Profile 路由布局
 */
import { Stack } from 'expo-router'

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="settings" />
      <Stack.Screen name="photos" />
      <Stack.Screen name="articles" />
      <Stack.Screen name="bookmarks" />
      <Stack.Screen name="bucket-list" />
      <Stack.Screen name="edit" />
    </Stack>
  )
}
