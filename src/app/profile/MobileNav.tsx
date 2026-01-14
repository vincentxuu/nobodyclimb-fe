'use client'

import React, { useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { UserCircle, FileText, Bookmark, Settings, Target, Image, BarChart3 } from 'lucide-react'

// 所有導航項目（水平滾動）
const menuItems = [
  {
    name: '人物誌',
    href: '/profile',
    icon: UserCircle,
  },
  {
    name: '清單',
    href: '/profile/bucket-list',
    icon: Target,
  },

  {
    name: '文章',
    href: '/profile/articles',
    icon: FileText,
  },
  {
    name: '照片',
    href: '/profile/photos',
    icon: Image,
  },
  {
    name: '成就',
    href: '/profile/stats',
    icon: BarChart3,
  },
  {
    name: '收藏',
    href: '/profile/bookmarks',
    icon: Bookmark,
  },
  {
    name: '設定',
    href: '/profile/settings',
    icon: Settings,
  },
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
    <nav className="w-full border-t border-gray-200 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      {/* 水平滾動容器 */}
      <div className="scrollbar-hide flex w-full flex-nowrap items-center gap-4 overflow-x-auto px-4 py-2.5">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <div
              key={item.href}
              onClick={() => handleNavigate(item.href)}
              className={`shrink-0 cursor-pointer whitespace-nowrap px-1 text-sm ${isActive ? 'font-semibold text-text-main' : 'font-medium text-text-subtle'
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
