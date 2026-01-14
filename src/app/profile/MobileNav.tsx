'use client'

import React, { useCallback, useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { UserCircle, FileText, Bookmark, Settings, Target, Image, MoreHorizontal, BarChart3 } from 'lucide-react'

// 主要導航項目（顯示在導航列上）
const mainMenuItems = [
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
    name: '照片',
    href: '/profile/photos',
    icon: Image,
  },
  {
    name: '文章',
    href: '/profile/articles',
    icon: FileText,
  },
]

// 更多選單項目
const moreMenuItems = [
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
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const moreMenuRef = useRef<HTMLDivElement>(null)

  // 點擊外部關閉選單
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 優化點擊處理函數
  const handleNavigate = useCallback(
    (href: string) => {
      if (pathname !== href) {
        router.push(href, { scroll: false })
      }
      setIsMoreOpen(false)
    },
    [pathname, router]
  )

  // 檢查是否在更多選單的頁面
  const isMoreActive = moreMenuItems.some((item) => pathname === item.href)

  return (
    <nav className="w-full bg-white shadow-md">
      <div className="flex w-full items-center justify-between px-4 py-3">
        {mainMenuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <div
              key={item.href}
              onClick={() => handleNavigate(item.href)}
              className={`flex cursor-pointer flex-col items-center text-xs ${
                isActive ? 'text-text-main' : 'text-text-subtle'
              }`}
            >
              <item.icon size={20} className="mb-1" />
              <span>{item.name}</span>
            </div>
          )
        })}

        {/* 更多選單 */}
        <div className="relative" ref={moreMenuRef}>
          <div
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className={`flex cursor-pointer flex-col items-center text-xs ${
              isMoreActive || isMoreOpen ? 'text-text-main' : 'text-text-subtle'
            }`}
          >
            <MoreHorizontal size={20} className="mb-1" />
            <span>更多</span>
          </div>

          {/* 下拉選單 */}
          {isMoreOpen && (
            <div className="absolute bottom-full right-0 mb-2 w-32 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              {moreMenuItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <div
                    key={item.href}
                    onClick={() => handleNavigate(item.href)}
                    className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm ${
                      isActive ? 'bg-gray-100 text-text-main' : 'text-text-subtle hover:bg-gray-50'
                    }`}
                  >
                    <item.icon size={16} />
                    <span>{item.name}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
