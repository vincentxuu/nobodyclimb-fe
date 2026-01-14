'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ProfileProvider } from '@/components/profile/ProfileContext'
import { AnimatePresence, motion } from 'framer-motion'
import MobileNav from './MobileNav'
import { useAuthStore } from '@/store/authStore'

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isStoreLoading = useAuthStore((state) => state.isLoading)
  const router = useRouter()
  const pathname = usePathname()
  const [isPageChanging, setIsPageChanging] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  // 處理 Zustand persist hydration
  useEffect(() => {
    setIsHydrated(true)
  }, [])

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

  // 檢查使用者是否已登入（等待 hydration 完成後再檢查）
  useEffect(() => {
    if (isHydrated && !isStoreLoading && !isAuthenticated) {
      router.push('/auth/login?callbackUrl=' + encodeURIComponent(pathname || '/profile'))
    }
  }, [isAuthenticated, isStoreLoading, isHydrated, router, pathname])

  // 如果還在 hydration 或正在載入中，顯示載入畫面
  if (!isHydrated || isStoreLoading) {
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
      <div className="min-h-screen bg-[#F5F5F5] pb-20 md:pb-0">
        {/* 頁面內容區域 */}
        <div className="pt-2 md:py-6">{!isPageChanging && children}</div>

        {/* 手機版底部導航列 - 固定在螢幕底部 */}
        <div className="fixed bottom-0 left-0 right-0 z-50 block md:hidden">
          <MobileNav />
        </div>
      </div>
    </ProfileProvider>
  )
}
