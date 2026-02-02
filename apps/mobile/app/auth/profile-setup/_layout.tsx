/**
 * Profile Setup Layout
 *
 * Profile 設定流程的共用佈局
 */
import { Stack } from 'expo-router'

export default function ProfileSetupLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: false, // 防止用戶在設定流程中返回
      }}
    >
      <Stack.Screen name="basic-info" />
      <Stack.Screen name="tags" />
      <Stack.Screen name="self-intro" />
      <Stack.Screen name="complete" />
    </Stack>
  )
}
