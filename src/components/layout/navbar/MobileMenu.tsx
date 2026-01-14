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
            <div className="flex items-center justify-between bg-white p-4">
              <h2 className="font-['Noto_Sans_TC'] text-lg font-bold text-[#1B1A1A]">選單</h2>
              <button
                onClick={closeMenu}
                className="flex items-center justify-center p-2 text-[#1B1A1A] transition-colors hover:text-[#1B1A1A]/80"
                aria-label="關閉選單"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex flex-col overflow-y-auto bg-white">
              {/* 用戶資訊區域 */}
              {isAuthenticated ? (
                <div className="border-b border-gray-200 bg-white p-4">
                  <div className="mb-4 flex items-center space-x-3">
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full">
                      <AvatarWithFallback
                        src={user?.avatar}
                        alt="用戶頭像"
                        size="w-12 h-12"
                        fallback={
                          <div role="img" aria-label="用戶頭像">
                            {generateAvatarElement(avatarStyle, 'w-12 h-12')}
                          </div>
                        }
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-['Noto_Sans_TC'] text-base font-semibold text-[#1B1A1A]">
                        {user?.username || '用戶'}
                      </p>
                    </div>
                  </div>
                  {/* 創作按鈕 */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-md border border-[#1B1A1A] bg-white font-medium text-[#1B1A1A] hover:bg-gray-50"
                      onClick={() => handleNavigation('/blog/create')}
                    >
                      <span className="font-['Noto_Sans_TC'] text-sm">發表文章</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-md border border-[#1B1A1A] bg-white font-medium text-[#1B1A1A] hover:bg-gray-50"
                      onClick={() => handleNavigation('/upload')}
                    >
                      <span className="font-['Noto_Sans_TC'] text-sm">上傳照片</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-b border-gray-200 bg-white p-4">
                  <Button
                    variant="outline"
                    className="w-full rounded-md border border-[#1B1A1A] bg-white font-medium text-[#1B1A1A] hover:bg-gray-50"
                    onClick={() => handleNavigation('/auth/login')}
                  >
                    <span className="font-['Noto_Sans_TC'] text-sm">登入</span>
                  </Button>
                </div>
              )}

              {/* 導航連結 */}
              <nav className="flex flex-col border-b border-gray-200 bg-white p-4">
                <h3 className="mb-2 px-4 font-['Noto_Sans_TC'] text-xs font-semibold uppercase tracking-wider text-gray-500">
                  探索
                </h3>
                {NAV_LINKS.map((link) => {
                  const isActive = pathname.startsWith(link.href)
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={closeMenu}
                      className={`relative rounded-lg px-4 py-3 font-['Noto_Sans_TC'] text-base font-medium transition-colors ${isActive
                        ? 'bg-[#FFE70C]/10 text-[#1B1A1A]'
                        : 'text-[#1B1A1A]/70 hover:bg-gray-100 hover:text-[#1B1A1A]'
                        }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="mobile-nav-indicator"
                          className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-[#FFE70C]"
                          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        />
                      )}
                      <span className={isActive ? 'ml-2' : ''}>{link.label}</span>
                    </Link>
                  )
                })}
              </nav>

              {/* 用戶功能選單 - 僅登入時顯示 */}
              {isAuthenticated && (
                <nav className="flex flex-col bg-white p-4">
                  <h3 className="mb-2 px-4 font-['Noto_Sans_TC'] text-xs font-semibold uppercase tracking-wider text-gray-500">
                    個人
                  </h3>
                  {userMenuItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <button
                        key={item.href}
                        onClick={() => handleNavigation(item.href)}
                        className={`relative rounded-lg px-4 py-3 text-left font-['Noto_Sans_TC'] text-base font-medium transition-colors ${isActive
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
                    className="mt-2 flex items-center gap-3 rounded-lg px-4 py-3 text-left font-['Noto_Sans_TC'] text-base font-medium text-[#D94A4A] transition-colors hover:bg-red-50"
                  >
                    <LogOut className="h-5 w-5" />
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
