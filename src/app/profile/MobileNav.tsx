'use client'

import React, { useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { UserCircle, FileText, Bookmark, Settings, ImagePlus, Image as ImageIcon } from 'lucide-react'

const menuItems = [
  {
    name: '我的人物誌',
    href: '/profile',
    icon: UserCircle,
  },
  {
    name: '上傳照片',
    href: '/upload',
    icon: ImagePlus,
  },
  {
    name: '我的照片',
    href: '/profile/photos',
    icon: ImageIcon,
  },
  {
    name: '我的文章',
    href: '/profile/articles',
    icon: FileText,
  },
  {
    name: '收藏文章',
    href: '/profile/bookmarks',
    icon: Bookmark,
  },
  {
    name: '帳號設定',
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
    <nav className="w-full bg-white shadow-md">
      <div className="flex w-full items-center justify-between px-4 py-3">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <div
              key={item.href}
              onClick={() => handleNavigate(item.href)}
              className={`flex cursor-pointer flex-col items-center text-xs ${
                isActive ? 'text-[#1B1A1A]' : 'text-[#6F6E77]'
              }`}
            >
              <item.icon size={20} className="mb-1" />
              <span>{item.name}</span>
            </div>
          )
        })}
      </div>
    </nav>
  )
}
