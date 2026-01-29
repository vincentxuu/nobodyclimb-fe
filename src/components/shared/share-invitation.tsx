'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Pen, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useGuestSession } from '@/lib/hooks/useGuestSession'
import { useAuthStore } from '@/store/authStore'
import Link from 'next/link'

interface ShareInvitationProps {
  onStartShare?: () => void
}

/**
 * 分享邀請組件
 * 當訪客達到分享資格時，顯示底部浮動提示邀請分享故事
 */
export function ShareInvitation({ onStartShare }: ShareInvitationProps) {
  const { isAuthenticated } = useAuthStore()
  const { isEligibleToShare, justBecameEligible, session } = useGuestSession()
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  // 檢查是否已經關閉過（這次 session）
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = sessionStorage.getItem('share_invitation_dismissed')
      if (dismissed === 'true') {
        setIsDismissed(true)
      }
    }
  }, [])

  // 當達到資格時顯示
  useEffect(() => {
    if (isEligibleToShare && !isAuthenticated && !isDismissed) {
      // 延遲顯示，避免太突兀
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, justBecameEligible ? 500 : 2000)
      return () => clearTimeout(timer)
    }
  }, [isEligibleToShare, isAuthenticated, isDismissed, justBecameEligible])

  // 關閉邀請
  const handleDismiss = () => {
    setIsVisible(false)
    setIsDismissed(true)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('share_invitation_dismissed', 'true')
    }
  }

  // 已登入或未達資格不顯示
  if (isAuthenticated || !isEligibleToShare || isDismissed) {
    return null
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-6 md:max-w-md"
        >
          <div className="relative rounded-2xl bg-white p-4 shadow-2xl">
            {/* 關閉按鈕 */}
            <button
              onClick={handleDismiss}
              className="absolute right-3 top-3 rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
              aria-label="關閉"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-4">
              {/* 圖示 */}
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#ffe70c]">
                <Pen className="h-6 w-6 text-[#1B1A1A]" />
              </div>

              {/* 內容 */}
              <div className="flex-1 pr-6">
                <h3 className="text-lg font-bold text-gray-900">
                  想分享你的攀岩故事嗎？
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  每個攀岩者都有獨特的故事，匿名分享也可以
                </p>

                {/* 按鈕 */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href="/share/anonymous">
                    <Button
                      variant="primary"
                      size="sm"
                      className="bg-[#ffe70c] text-[#1B1A1A] hover:bg-[#e6d00b]"
                      onClick={() => {
                        handleDismiss()
                        onStartShare?.()
                      }}
                    >
                      開始分享
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/auth/login">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="border-gray-300 text-gray-700 hover:bg-gray-100"
                      onClick={handleDismiss}
                    >
                      登入後分享
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* 進度指示（可選） */}
            {session && (
              <div className="mt-3 border-t border-gray-200 pt-3">
                <p className="text-xs text-gray-500">
                  你已瀏覽 {session.biographyViews} 個攀岩者故事
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
