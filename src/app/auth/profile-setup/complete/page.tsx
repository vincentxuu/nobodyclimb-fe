'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { PageTransition } from '@/components/shared/page-transition'
import { Check } from 'lucide-react'

export default function CompletePage() {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()

  useEffect(() => {
    // 如果使用者未登入，重定向至登入頁面
    // if (!loading && !isAuthenticated) {
    //   router.push('/auth/login')
    // }
  }, [isAuthenticated, loading, router])

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
            <div className="flex items-center space-x-4">
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                  1
                </div>
                <span className="mt-2 text-sm">基本資料</span>
              </div>
              <div className="h-1 w-16 bg-gray-300"></div>
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                  2
                </div>
                <span className="mt-2 text-sm">自我介紹</span>
              </div>
              <div className="h-1 w-16 bg-gray-300"></div>
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                  3
                </div>
                <span className="mt-2 text-sm">完成</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-12 flex flex-col items-center justify-center space-y-6 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-200">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white">
              <Check size={36} />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold">註冊完成！</h1>
          
          <p className="max-w-md text-gray-600">
            感謝您完成資料填寫，現在您可以開始探索 NobodyClimb 平台，
            與其他攀岩愛好者互動交流，查看最新攀岩資訊。
          </p>
        </div>

        {/* 按鈕區 */}
        <div className="flex justify-center space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleGoToProfile}
            className="border-gray-700 px-6 py-3 rounded-lg"
          >
            查看個人檔案
          </Button>
          <Button
            type="button"
            onClick={handleGoToHome}
            className="px-6 py-3 text-white rounded-lg"
          >
            回到首頁
          </Button>
        </div>
      </div>
    </PageTransition>
  )
}
