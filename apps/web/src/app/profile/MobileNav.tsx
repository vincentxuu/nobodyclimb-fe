'use client'

import React, { useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'

// 所有導航項目（水平滾動）
const menuItems = [
  { name: '人物誌', href: '/profile' },
  { name: '推薦', href: '/profile/recommendations' },
  { name: 'AI 記憶', href: '/profile/ai-memory' },
  { name: '清單', href: '/profile/bucket-list' },
  { name: '攀爬紀錄', href: '/profile/ascents' },
  { name: '成就', href: '/profile/stats' },
  { name: '文章', href: '/profile/articles' },
  { name: '照片', href: '/profile/photos' },
  { name: '收藏', href: '/profile/bookmarks' },
  { name: '設定', href: '/profile/settings' },
]

export default function MobileNav() {
  const router = useRouter()
  const pathname = usePathname()

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
