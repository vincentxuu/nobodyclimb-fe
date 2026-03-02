'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * 受保護路由組件
 * 確保只有已登入用戶可以訪問包裝的內容
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { status } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    // 只有在初始化完成後（非 idle）才進行重定向判斷
    // 避免在認證檢查完成前就錯誤重定向
    if (status === 'signOut') {
      router.push('/auth/login')
    }
  }, [status, router])

  // 如果尚未初始化，顯示載入中
  if (status === 'idle') {
    return (
      <div className="flex min-h-[calc(100vh-14rem)] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">載入中...</p>
        </div>
      </div>
    )
  }

  // 初始化完成但用戶未登入，等待重定向
  if (status !== 'signIn') {
    return (
      <div className="flex min-h-[calc(100vh-14rem)] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">重定向中...</p>
        </div>
      </div>
    )
  }

  // 如果用戶已登入，顯示子元素
  return <>{children}</>
}
