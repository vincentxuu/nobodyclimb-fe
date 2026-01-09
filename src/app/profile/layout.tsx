'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ProfileProvider } from '@/components/profile/ProfileContext'
import { AnimatePresence, motion } from 'framer-motion'
import MobileNav from './MobileNav'

// 模擬用戶身份驗證檢查 - 在實際環境中，這裡會使用你的認證系統
const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    // 這裡簡單模擬一個已登入狀態
    // 實際應用中，應該檢查 localStorage、cookie 或其他身份驗證狀態
    const checkAuth = async () => {
      // 假設用戶已登入 - 在實際應用中，這裡會有真實的身份驗證檢查
      // 例如：const isLoggedIn = localStorage.getItem('token') !== null;
      const isLoggedIn = true // 暫時設為 true 以便開發

      setIsAuthenticated(isLoggedIn)
    }

    checkAuth()
  }, [])

  return { isAuthenticated, isLoading: isAuthenticated === null }
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isPageChanging, setIsPageChanging] = useState(false)

  // 設置頁面轉換狀態的函數
  const handleRouteChange = useCallback(() => {
    setIsPageChanging(true)

    // 短暫延遲後重設狀態，讓頁面可以重新顯示動畫效果
    setTimeout(() => {
      setIsPageChanging(false)
    }, 50)
  }, [])

  // 監聽路由變化
  useEffect(() => {
    // 此處不能再添加事件監聽器，因為 Next.js 的 App Router 沒有 routeChangeStart 事件
    // 但當 pathname 變化時，此 effect 會觸發
    handleRouteChange()
  }, [pathname, handleRouteChange])

  // 檢查使用者是否已登入
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login?callbackUrl=' + encodeURIComponent(pathname || '/profile'))
    }
  }, [isAuthenticated, isLoading, router, pathname])

  // 如果正在驗證中，顯示載入中
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F5F5]">
        <AnimatePresence>
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-t-2 border-[#1B1A1A]"></div>
            <p className="text-[#3F3D3D]">載入中...</p>
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  // 已登入時顯示內容，並使用 ProfileProvider
  return (
    <ProfileProvider>
      <div className="min-h-screen bg-[#F5F5F5] pb-16 md:pb-0">
        {/* 手機版導航列 */}
        <div className="sticky top-0 z-50 block md:hidden">
          <MobileNav />
        </div>

        {/* 頁面內容區域 - 增加手機版 padding */}
        <div className="pt-2 md:py-6">{!isPageChanging && children}</div>
      </div>
    </ProfileProvider>
  )
}
