/**
 * 原生推播通知
 *
 * 處理 Expo push token 的取得、註冊與解除註冊。
 * 對應後端 POST/DELETE /notifications/device-token。
 */

import Constants from 'expo-constants'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { apiClient } from '@/lib/api'

// 目前裝置已註冊的 token（登出解除註冊時使用）
let registeredToken: string | null = null

/**
 * 取得 Expo push token
 *
 * 模擬器、未授權、缺少 EAS projectId 時回傳 null（靜默降級，不影響 app 使用）
 */
export async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) {
    return null
  }

  // Android 需要先建立 notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: '預設',
      importance: Notifications.AndroidImportance.DEFAULT,
    })
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }
  if (finalStatus !== 'granted') {
    return null
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId
  if (!projectId) {
    console.warn('[push] 缺少 EAS projectId，無法取得 push token')
    return null
  }

  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId })
    return data
  } catch (err) {
    console.warn('[push] 取得 push token 失敗:', err)
    return null
  }
}

/**
 * 註冊 push token 到後端（登入後呼叫）
 */
export async function registerPushToken(): Promise<void> {
  const token = await getExpoPushToken()
  if (!token) return

  try {
    await apiClient.post('/notifications/device-token', {
      token,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
    })
    registeredToken = token
  } catch (err) {
    console.warn('[push] 註冊 device token 失敗:', err)
  }
}

/**
 * 解除註冊 push token（必須在登出「前」呼叫，此時仍有認證）
 */
export async function unregisterPushToken(): Promise<void> {
  const token = registeredToken ?? (await getExpoPushToken())
  if (!token) return

  try {
    await apiClient.delete('/notifications/device-token', { data: { token } })
  } catch (err) {
    console.warn('[push] 解除註冊 device token 失敗:', err)
  } finally {
    registeredToken = null
  }
}
