'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import Image from 'next/image'

/**
 * Logo 組件
 * 顯示網站 Logo，並支援點擊回到首頁
 */
export default function Logo() {
  const router = useRouter()
  const t = useTranslations('common')

  return (
    <div className="flex h-full items-center bg-[#FFE70C] px-3 md:px-6">
      <div
        className="flex cursor-pointer items-center"
        onClick={() => router.push('/')}
        role="button"
        aria-label={t('nav.goHome')}
      >
        <Image
          src="/logo/Nobodylimb-black.svg"
          alt="NobodyClimb Logo"
          width={120}
          height={32}
          priority
          className="h-6 w-auto md:h-8"
        />
      </div>
    </div>
  )
}
