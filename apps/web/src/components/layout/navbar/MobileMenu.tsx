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

const personalMenuItems = [
  { label: '人物誌', href: '/profile' },
  { label: '推薦', href: '/profile/recommendations' },
  { label: '記憶', href: '/profile/ai-memory' },
  { label: '清單', href: '/profile/bucket-list' },
  { label: '攀爬紀錄', href: '/profile/ascents' },
  { label: '成就', href: '/profile/stats' },
  { label: '文章', href: '/profile/articles' },
  { label: '照片', href: '/profile/photos' },
  { label: '收藏', href: '/profile/bookmarks' },
  { label: '設定', href: '/profile/settings' },
]

/**
 * 手機版選單組件
 * 提供漢堡選單按鈕和側邊滑動選單
 */
export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'explore' | 'personal'>('explore')
  const pathname = usePathname()
  const router = useRouter()
  const { status, signOut, user } = useAuthStore()

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
    signOut()
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
            className="fixed right-0 top-0 z-[10001] flex h-[100dvh] max-h-[100dvh] w-[280px] flex-col bg-white shadow-xl md:hidden"
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

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-white">
              {/* 用戶資訊區域 */}
              {status === 'signIn' ? (
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
                      className="h-7 flex-1 rounded-lg border border-[#1B1A1A] bg-white font-medium text-[#1B1A1A] hover:bg-gray-50 xs:h-8"
                      onClick={() => handleNavigation('/blog/create')}
                    >
                      <span className="font-['Noto_Sans_TC'] text-xs">發表文章</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 flex-1 rounded-lg border border-[#1B1A1A] bg-white font-medium text-[#1B1A1A] hover:bg-gray-50 xs:h-8"
                      onClick={() => handleNavigation('/upload')}
                    >
                      <span className="font-['Noto_Sans_TC'] text-xs">上傳照片</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-b border-gray-200 bg-white px-3 py-2 xs:p-3">
                  <div className="mb-2 text-center">
                    <p className="text-xs text-gray-500">也是攀岩人？加入寫下你的故事</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="h-7 flex-1 rounded-lg border border-[#1B1A1A] bg-white font-medium text-[#1B1A1A] hover:bg-gray-50 xs:h-8"
                      onClick={() => handleNavigation('/auth/login')}
                    >
                      <span className="font-['Noto_Sans_TC'] text-xs">登入</span>
                    </Button>
                    <Button
                      className="h-7 flex-1 rounded-lg bg-brand-accent/70 font-medium text-[#1B1A1A] hover:bg-brand-accent xs:h-8"
                      onClick={() => handleNavigation('/auth/register')}
                    >
                      <span className="font-['Noto_Sans_TC'] text-xs">註冊</span>
                    </Button>
                  </div>
                </div>
              )}

              <div className="px-3 py-2 xs:p-3">
                {status === 'signIn' && (
                  <div className="mb-2 grid grid-cols-2 rounded-lg bg-[#F5F5F5] p-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('explore')}
                      className={`rounded-md px-2 py-1.5 text-sm font-medium transition-colors ${
                        activeTab === 'explore'
                          ? 'bg-white text-[#1B1A1A] shadow-sm'
                          : 'text-[#6D6C6C] hover:text-[#1B1A1A]'
                      }`}
                    >
                      探索
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('personal')}
                      className={`rounded-md px-2 py-1.5 text-sm font-medium transition-colors ${
                        activeTab === 'personal'
                          ? 'bg-white text-[#1B1A1A] shadow-sm'
                          : 'text-[#6D6C6C] hover:text-[#1B1A1A]'
                      }`}
                    >
                      個人
                    </button>
                  </div>
                )}

                {(status !== 'signIn' || activeTab === 'explore') &&
                  NAV_LINKS.map((link) => {
                    const isActive = pathname.startsWith(link.href)
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={closeMenu}
                        className={`relative block rounded-lg px-2 py-1.5 font-['Noto_Sans_TC'] text-xs font-medium transition-colors xs:px-3 xs:py-2 xs:text-sm ${
                          isActive
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

                {status === 'signIn' && activeTab === 'personal' && (
                  <>
                    {personalMenuItems.map((item) => {
                      const isActive = pathname === item.href
                      return (
                        <button
                          key={item.href}
                          onClick={() => handleNavigation(item.href)}
                          className={`relative block w-full rounded-lg px-2 py-1.5 text-left font-['Noto_Sans_TC'] text-xs font-medium transition-colors xs:px-3 xs:py-2 xs:text-sm ${
                            isActive
                              ? 'bg-[#FFE70C]/10 text-[#1B1A1A]'
                              : 'text-[#1B1A1A]/70 hover:bg-gray-100 hover:text-[#1B1A1A]'
                          }`}
                        >
                          <span>{item.label}</span>
                        </button>
                      )
                    })}
                    <button
                      onClick={handleLogout}
                      className="mt-1 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-left font-['Noto_Sans_TC'] text-xs font-medium text-[#D94A4A] transition-colors hover:bg-red-50 xs:gap-2 xs:px-3 xs:py-2 xs:text-sm"
                    >
                      <LogOut className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                      <span>登出</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
