'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { NAV_LINKS } from '@/lib/constants'
import { X, Menu, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { generateAvatarElement, DEFAULT_AVATARS } from '@/components/shared/avatar-options'
import { AvatarWithFallback } from '@/components/ui/avatar-with-fallback'
import { Button } from '@/components/ui/button'

// 用戶選單項目
const userMenuItems = [
  { label: '人物誌', href: '/profile' },
  { label: '清單', href: '/profile/bucket-list' },
  { label: '文章', href: '/profile/articles' },
  { label: '照片', href: '/profile/photos' },
  { label: '收藏', href: '/profile/bookmarks' }
]

/**
 * 手機版選單組件
 * 提供漢堡選單按鈕和側邊滑動選單
 */
export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, logout, user } = useAuthStore()

  const toggleMenu = () => setIsOpen(!isOpen)
  const closeMenu = () => setIsOpen(false)

  // 獲取用戶頭像樣式
  const avatarStyle = user?.avatarStyle
    ? DEFAULT_AVATARS.find((a) => a.id === user.avatarStyle) || DEFAULT_AVATARS[0]
    : DEFAULT_AVATARS[0]

  const handleNavigation = (href: string) => {
    router.push(href)
    closeMenu()
  }

  const handleLogout = () => {
    logout()
    closeMenu()
  }

  return (
    <>
      {/* 漢堡選單按鈕 - 僅在手機版顯示 */}
      <button
        onClick={toggleMenu}
        className="flex items-center justify-center p-2 text-[#1B1A1A] transition-colors hover:text-[#1B1A1A]/80 md:hidden"
        aria-label="開啟選單"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* 背景遮罩 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[10000] bg-black/80 md:hidden"
            onClick={closeMenu}
          />
        )}
      </AnimatePresence>

      {/* 側邊選單 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-[10001] h-full w-[280px] bg-white shadow-xl md:hidden"
          >
            {/* 選單標題和關閉按鈕 */}
            <div className="flex flex-shrink-0 items-center justify-between bg-white px-3 py-2 xs:p-3">
              <h2 className="font-['Noto_Sans_TC'] text-sm font-bold text-[#1B1A1A] xs:text-base">選單</h2>
              <button
                onClick={closeMenu}
                className="flex items-center justify-center p-1 text-[#1B1A1A] transition-colors hover:text-[#1B1A1A]/80 xs:p-1.5"
                aria-label="關閉選單"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-1 flex-col overflow-y-auto bg-white">
              {/* 用戶資訊區域 */}
              {isAuthenticated ? (
                <div className="border-b border-gray-200 bg-white px-3 py-2 xs:p-3">
                  <div className="mb-1.5 flex items-center space-x-2 xs:mb-2">
                    <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full xs:h-10 xs:w-10">
                      <AvatarWithFallback
                        src={user?.avatar}
                        alt="用戶頭像"
                        size="w-8 h-8 xs:w-10 xs:h-10"
                        fallback={
                          <div role="img" aria-label="用戶頭像">
                            {generateAvatarElement(avatarStyle, 'w-8 h-8 xs:w-10 xs:h-10')}
                          </div>
                        }
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-['Noto_Sans_TC'] text-sm font-semibold text-[#1B1A1A]">
                        {user?.username || '用戶'}
                      </p>
                    </div>
                  </div>
                  {/* 創作按鈕 */}
                  <div className="flex gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 flex-1 rounded-md border border-[#1B1A1A] bg-white font-medium text-[#1B1A1A] hover:bg-gray-50 xs:h-8"
                      onClick={() => handleNavigation('/blog/create')}
                    >
                      <span className="font-['Noto_Sans_TC'] text-xs">發表文章</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 flex-1 rounded-md border border-[#1B1A1A] bg-white font-medium text-[#1B1A1A] hover:bg-gray-50 xs:h-8"
                      onClick={() => handleNavigation('/upload')}
                    >
                      <span className="font-['Noto_Sans_TC'] text-xs">上傳照片</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-b border-gray-200 bg-white px-3 py-2 xs:p-3">
                  <Button
                    variant="outline"
                    className="h-7 w-full rounded-md border border-[#1B1A1A] bg-white font-medium text-[#1B1A1A] hover:bg-gray-50 xs:h-8"
                    onClick={() => handleNavigation('/auth/login')}
                  >
                    <span className="font-['Noto_Sans_TC'] text-xs">登入</span>
                  </Button>
                </div>
              )}

              {/* 導航連結 */}
              <nav className="flex flex-col border-b border-gray-200 bg-white px-3 py-2 xs:p-3">
                <h3 className="mb-0.5 px-2 font-['Noto_Sans_TC'] text-[10px] font-semibold uppercase tracking-wider text-gray-500 xs:mb-1 xs:px-3 xs:text-xs">
                  探索
                </h3>
                {NAV_LINKS.map((link) => {
                  const isActive = pathname.startsWith(link.href)
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={closeMenu}
                      className={`relative rounded-md px-2 py-1.5 font-['Noto_Sans_TC'] text-xs font-medium transition-colors xs:px-3 xs:py-2 xs:text-sm ${isActive
                        ? 'bg-[#FFE70C]/10 text-[#1B1A1A]'
                        : 'text-[#1B1A1A]/70 hover:bg-gray-100 hover:text-[#1B1A1A]'
                        }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="mobile-nav-indicator"
                          className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-[#FFE70C] xs:h-6"
                          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        />
                      )}
                      <span className={isActive ? 'ml-1.5' : ''}>{link.label}</span>
                    </Link>
                  )
                })}
              </nav>

              {/* 用戶功能選單 - 僅登入時顯示 */}
              {isAuthenticated && (
                <nav className="flex flex-col bg-white px-3 py-2 xs:p-3">
                  <h3 className="mb-0.5 px-2 font-['Noto_Sans_TC'] text-[10px] font-semibold uppercase tracking-wider text-gray-500 xs:mb-1 xs:px-3 xs:text-xs">
                    個人
                  </h3>
                  {userMenuItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <button
                        key={item.href}
                        onClick={() => handleNavigation(item.href)}
                        className={`relative rounded-md px-2 py-1.5 text-left font-['Noto_Sans_TC'] text-xs font-medium transition-colors xs:px-3 xs:py-2 xs:text-sm ${isActive
                          ? 'bg-[#FFE70C]/10 text-[#1B1A1A]'
                          : 'text-[#1B1A1A]/70 hover:bg-gray-100 hover:text-[#1B1A1A]'
                          }`}
                      >
                        <span>{item.label}</span>
                      </button>
                    )
                  })}
                  {/* 登出按鈕 */}
                  <button
                    onClick={handleLogout}
                    className="mt-0.5 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-left font-['Noto_Sans_TC'] text-xs font-medium text-[#D94A4A] transition-colors hover:bg-red-50 xs:mt-1 xs:gap-2 xs:px-3 xs:py-2 xs:text-sm"
                  >
                    <LogOut className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                    <span>登出</span>
                  </button>
                </nav>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
