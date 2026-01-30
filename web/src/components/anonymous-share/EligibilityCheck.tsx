'use client'

import { Lock, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { GuestSession } from '@/lib/hooks/useGuestSession'

interface EligibilityCheckProps {
  session: GuestSession
}

/**
 * 資格檢查組件
 * 當用戶未達到分享資格時顯示
 */
export function EligibilityCheck({ session }: EligibilityCheckProps) {
  const progress = Math.min((session.biographyViews / 3) * 100, 100)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
          <Lock className="h-8 w-8 text-yellow-600" />
        </div>
        <h1 className="mb-2 text-xl font-bold">再多看看別人的故事</h1>
        <p className="mb-4 text-gray-600">瀏覽更多攀岩者的故事後，就可以開始分享</p>
        <div className="mb-6 rounded-lg bg-gray-100 p-4">
          <p className="text-sm text-gray-500">已瀏覽 {session.biographyViews} 個故事</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-[#ffe70c] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <Link href="/biography">
          <Button className="w-full">探索攀岩者故事</Button>
        </Link>
      </div>
    </div>
  )
}

interface AlreadyAuthenticatedProps {}

/**
 * 已登入用戶提示組件
 */
export function AlreadyAuthenticated({}: AlreadyAuthenticatedProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <User className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="mb-2 text-xl font-bold">你已經登入了</h1>
        <p className="mb-6 text-gray-600">可以直接在個人頁面編輯你的故事</p>
        <Link href="/profile/edit">
          <Button className="w-full">前往編輯我的故事</Button>
        </Link>
      </div>
    </div>
  )
}
