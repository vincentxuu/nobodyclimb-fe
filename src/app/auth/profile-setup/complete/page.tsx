'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { PageTransition } from '@/components/shared/page-transition'
import { Check, Edit3, Home, User } from 'lucide-react'

export default function CompletePage() {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()

  useEffect(() => {
    // 如果使用者未登入，重定向至登入頁面
    if (!loading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, loading, router])

  const handleGoToEditor = () => {
    // 導向人物誌編輯器（在 /profile 頁面）
    router.push('/profile')
  }

  const handleGoToProfile = () => {
    router.push('/profile')
  }

  const handleGoToHome = () => {
    router.push('/')
  }

  return (
    <PageTransition>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* 步驟指示器 */}
        <div className="mb-8">
          <div className="flex justify-center">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                  <Check size={16} />
                </div>
                <span className="mt-2 text-xs sm:text-sm">基本資料</span>
              </div>
              <div className="h-1 w-8 sm:w-12 bg-primary"></div>
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                  <Check size={16} />
                </div>
                <span className="mt-2 text-xs sm:text-sm">標籤</span>
              </div>
              <div className="h-1 w-8 sm:w-12 bg-primary"></div>
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                  <Check size={16} />
                </div>
                <span className="mt-2 text-xs sm:text-sm">一句話</span>
              </div>
              <div className="h-1 w-8 sm:w-12 bg-primary"></div>
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                  4
                </div>
                <span className="mt-2 text-xs sm:text-sm">完成</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-12 flex flex-col items-center justify-center space-y-6 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-white">
              <Check size={36} />
            </div>
          </div>

          <h1 className="text-3xl font-bold">註冊完成！</h1>

          <p className="max-w-md text-gray-600">
            你的攀岩人物誌已經建立，現在可以開始探索 NobodyClimb 平台，
            與其他岩友互動交流。
          </p>

          {/* 提示卡片 */}
          <div className="w-full max-w-md rounded-xl border border-primary/20 bg-primary/5 p-4 text-left">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <Edit3 size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">想讓人物誌更豐富？</h3>
                <p className="mt-1 text-sm text-gray-600">
                  你可以隨時到編輯器補充更多內容，包括深度故事、攀岩足跡等。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 按鈕區 */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            type="button"
            onClick={handleGoToEditor}
            className="rounded-lg px-6 py-3 text-white"
          >
            <Edit3 size={18} className="mr-2" />
            繼續編輯人物誌
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleGoToProfile}
            className="rounded-lg border-gray-300 px-6 py-3"
          >
            <User size={18} className="mr-2" />
            查看個人檔案
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={handleGoToHome}
            className="rounded-lg px-6 py-3"
          >
            <Home size={18} className="mr-2" />
            回到首頁
          </Button>
        </div>
      </div>
    </PageTransition>
  )
}
