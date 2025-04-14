'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * 受保護路由組件
 * 確保只有已登入用戶可以訪問包裝的內容
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    // 如果認證狀態已加載完成並且用戶未登入，則重定向到登入頁面
    if (!loading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, loading, router])
  
  // 如果仍在加載或用戶未登入，不顯示內容
  if (loading || !isAuthenticated) {
    return (
      <div className="flex min-h-[calc(100vh-14rem)] items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">載入中...</p>
        </div>
      </div>
    )
  }
  
  // 如果用戶已登入，顯示子元素
  return <>{children}</>
}
