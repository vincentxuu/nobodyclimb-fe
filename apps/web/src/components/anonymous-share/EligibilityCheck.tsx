'use client'

import { Lock, User } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import type { GuestSession } from '@/lib/hooks/useGuestSession'

interface EligibilityCheckProps {
  session: GuestSession
}

/**
 * 資格檢查組件
 * 當用戶未達到分享資格時顯示
 */
export function EligibilityCheck({ session }: EligibilityCheckProps) {
  const t = useTranslations('AnonShare')
  const progress = Math.min((session.biographyViews / 3) * 100, 100)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
          <Lock className="h-8 w-8 text-yellow-600" />
        </div>
        <h1 className="mb-2 text-xl font-bold">{t('eligibilityTitle')}</h1>
        <p className="mb-4 text-gray-600">{t('eligibilityDescription')}</p>
        <div className="mb-6 rounded-lg bg-gray-100 p-4">
          <p className="text-sm text-gray-500">
            {t('viewedCount', { count: session.biographyViews })}
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
            <div className="h-full bg-[#ffe70c] transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <Link href="/biography">
          <Button className="w-full">{t('exploreStories')}</Button>
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
  const t = useTranslations('AnonShare')

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <User className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="mb-2 text-xl font-bold">{t('alreadyAuthTitle')}</h1>
        <p className="mb-6 text-gray-600">{t('alreadyAuthDescription')}</p>
        <Link href="/profile/edit">
          <Button className="w-full">{t('goToEditStory')}</Button>
        </Link>
      </div>
    </div>
  )
}
