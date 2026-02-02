/**
 * Upload 路由佈局
 */
import { Stack } from 'expo-router'

export default function UploadLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  )
}
