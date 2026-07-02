/**
 * PushNotificationManager
 *
 * 掛載於 Providers，負責：
 * 1. 登入後自動註冊 push token 到後端
 * 2. 設定前景通知顯示行為
 * 3. 處理通知點擊的 deep link 導向
 */

import * as Notifications from 'expo-notifications'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { registerPushToken } from '@/lib/pushNotifications'
import { useAuthStore } from '@/store/authStore'

// 前景收到通知時仍顯示橫幅
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
})

export function PushNotificationManager() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  // 登入後註冊 push token
  useEffect(() => {
    if (isAuthenticated) {
      registerPushToken()
    }
  }, [isAuthenticated])

  // 通知點擊導向
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { url?: string } | undefined
      if (data?.url && typeof data.url === 'string') {
        router.push(data.url as any)
      }
    })

    // 處理 app 由通知冷啟動的情況
    Notifications.getLastNotificationResponseAsync().then((response) => {
      const data = response?.notification.request.content.data as { url?: string } | undefined
      if (data?.url && typeof data.url === 'string') {
        router.push(data.url as any)
      }
    })

    return () => subscription.remove()
  }, [router])

  return null
}
