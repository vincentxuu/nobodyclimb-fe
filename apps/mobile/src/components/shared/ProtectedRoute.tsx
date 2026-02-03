/**
 * ProtectedRoute 組件
 *
 * 受保護路由，對應 apps/web/src/components/shared/protected-route.tsx
 */
import React, { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'

import { useAuthStore } from '@/store/authStore'
import { Text, Spinner } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'

interface ProtectedRouteProps {
  children: React.ReactNode
  /** 未登入時是否顯示載入畫面（而非空白） */
  showLoadingOnUnauthenticated?: boolean
}

/**
 * 受保護路由組件
 * 確保只有已登入用戶可以訪問包裝的內容
 */
export function ProtectedRoute({
  children,
  showLoadingOnUnauthenticated = true,
}: ProtectedRouteProps) {
  const { isAuthenticated, status } = useAuthStore()
  const isInitialized = status !== 'idle'
  const router = useRouter()

  useEffect(() => {
    // 只有在初始化完成後才進行重定向判斷
    // 避免在認證檢查完成前就錯誤重定向
    if (isInitialized && !isAuthenticated) {
      router.replace('/auth/login')
    }
  }, [isAuthenticated, isInitialized, router])

  // 如果尚未初始化，顯示載入中
  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <Spinner size="lg" />
        <Text color="textSubtle" style={styles.text}>
          載入中...
        </Text>
      </View>
    )
  }

  // 初始化完成但用戶未登入，等待重定向
  if (!isAuthenticated) {
    if (!showLoadingOnUnauthenticated) {
      return null
    }
    return (
      <View style={styles.container}>
        <Spinner size="lg" />
        <Text color="textSubtle" style={styles.text}>
          重定向中...
        </Text>
      </View>
    )
  }

  // 如果用戶已登入，顯示子元素
  return <>{children}</>
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: SEMANTIC_COLORS.pageBg,
    gap: SPACING.md,
  },
  text: {
    marginTop: SPACING.sm,
  },
})

export default ProtectedRoute
