'use client'

import React, { useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

export default function MobileNav() {
  const t = useTranslations('ProfilePage')
  const router = useRouter()
  const pathname = usePathname()

  // 所有導航項目（水平滾動）
  const menuItems = [
    { name: t('navBiography'), href: '/profile' },
    { name: t('navRecommendations'), href: '/profile/recommendations' },
    { name: t('navAiMemory'), href: '/profile/ai-memory' },
    { name: t('navBucketList'), href: '/profile/bucket-list' },
    { name: t('navAscents'), href: '/profile/ascents' },
    { name: t('navStats'), href: '/profile/stats' },
    { name: t('navArticles'), href: '/profile/articles' },
    { name: t('navPhotos'), href: '/profile/photos' },
    { name: t('navBookmarks'), href: '/profile/bookmarks' },
    { name: t('navSettings'), href: '/profile/settings' },
  ]

  // 優化點擊處理函數
  const handleNavigate = useCallback(
    (href: string) => {
      if (pathname !== href) {
        router.push(href, { scroll: false })
      }
    },
    [pathname, router]
  )

  return (
    <nav className="h-16 w-full border-t border-gray-200 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      {/* 水平滾動容器 */}
      <div className="scrollbar-hide flex h-full w-full flex-nowrap items-center gap-6 overflow-x-auto px-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <div
              key={item.href}
              onClick={() => handleNavigate(item.href)}
              className={`shrink-0 cursor-pointer whitespace-nowrap px-2 text-base ${isActive ? 'font-semibold text-text-main' : 'font-medium text-text-subtle'
                }`}
            >
              {item.name}
            </div>
          )
        })}
      </div>
    </nav>
  )
}
