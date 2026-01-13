'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { NAV_LINKS } from '@/lib/constants'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { generateAvatarElement, DEFAULT_AVATARS } from '@/components/shared/avatar-options'

interface MobileNavProps {
  isDesktop: boolean
}

/**
 * 行動版導航組件
 * 只在手機版且導航欄打開時顯示
 */
export default function MobileNav({ isDesktop }: MobileNavProps) {
  const pathname = usePathname()
  const { isNavbarOpen, closeNavbar } = useUIStore()
  const { isAuthenticated, logout, user } = useAuthStore()
  const [avatarError, setAvatarError] = useState(false)

  // 當用戶頭像 URL 變更時重置錯誤狀態
  useEffect(() => {
    setAvatarError(false)
  }, [user?.avatar])

  // 假設用戶數據中有 avatarStyle 屬性，否則使用默認頭像
  const avatarStyle = user?.avatarStyle
    ? DEFAULT_AVATARS.find((a) => a.id === user.avatarStyle) || DEFAULT_AVATARS[0]
    : DEFAULT_AVATARS[0]

  // 檢查是否有有效的頭像 URL
  const hasValidAvatar = user?.avatar && user.avatar.trim() !== '' && !avatarError

  if (isDesktop || !isNavbarOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
        className="max-h-[calc(100dvh-var(--navbar-height))] overflow-y-auto overscroll-contain border-t border-gray-200 bg-white shadow-lg lg:hidden"
      >
        <nav className="mobile-nav-scroll py-4">
          {/* 導航選單 */}
          <ul className="space-y-6 px-4">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`block py-1 font-['Noto_Sans_TC'] text-base font-medium leading-6 tracking-[0.02em] hover:text-[#8E8C8C] ${pathname.startsWith(link.href) ? 'text-[#8E8C8C]' : 'text-[#1B1A1A]'} `}
                  onClick={closeNavbar}
                >
                  {link.label}
                </Link>
              </li>
            ))}

            <li className="pt-4 lg:hidden">
              {isAuthenticated ? (
                <div className="flex flex-col">
                  {/* 個人資料區塊 */}
                  <Link href="/profile" className="block">
                    <div className="flex items-center px-4 py-3 hover:bg-gray-50">
                      {hasValidAvatar ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={user.avatar}
                          alt="用戶頭像"
                          className="h-10 w-10 rounded-full object-cover"
                          onError={() => setAvatarError(true)}
                        />
                      ) : (
                        generateAvatarElement(avatarStyle, 'w-10 h-10')
                      )}
                      <div className="ml-3">
                        <div className="font-['Noto_Sans_CJK_TC'] text-base font-medium text-[#1B1A1A]">
                          {user?.displayName || user?.username || '使用者名稱'}
                        </div>
                        <div className="font-['Noto_Sans_CJK_TC'] text-sm text-[#8E8C8C]">
                          查看個人檔案
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* 主要功能區 */}
                  <div className="border-t border-[#EBEAEA] py-2">
                    <Link
                      href="/blog/create"
                      className="block px-4 py-3 hover:bg-gray-50"
                      onClick={closeNavbar}
                    >
                      <span className="font-['Noto_Sans_CJK_TC'] text-sm font-medium text-[#3F3D3D]">
                        發表文章
                      </span>
                    </Link>
                    <Link
                      href="/profile/photos"
                      className="block px-4 py-3 hover:bg-gray-50"
                      onClick={closeNavbar}
                    >
                      <span className="font-['Noto_Sans_CJK_TC'] text-sm font-medium text-[#3F3D3D]">
                        我的照片
                      </span>
                    </Link>
                    <Link
                      href="/profile/articles"
                      className="block px-4 py-3 hover:bg-gray-50"
                      onClick={closeNavbar}
                    >
                      <span className="font-['Noto_Sans_CJK_TC'] text-sm font-medium text-[#3F3D3D]">
                        我的文章
                      </span>
                    </Link>
                    <Link
                      href="/profile/bookmarks"
                      className="block px-4 py-3 hover:bg-gray-50"
                    >
                      <span className="font-['Noto_Sans_CJK_TC'] text-sm font-medium text-[#3F3D3D]">
                        我的收藏
                      </span>
                    </Link>
                  </div>

                  {/* 設定與登出區 */}
                  <div className="border-t border-[#EBEAEA]">
                    <Link
                      href="/profile/settings"
                      className="block px-4 py-3 hover:bg-gray-50"
                    >
                      <span className="font-['Noto_Sans_CJK_TC'] text-sm font-medium text-[#3F3D3D]">
                        帳號設定
                      </span>
                    </Link>
                    <button
                      onClick={() => logout()}
                      className="block w-full px-4 py-3 text-left hover:bg-gray-50"
                    >
                      <span className="font-['Noto_Sans_CJK_TC'] text-sm font-medium text-[#D94A4A]">
                        登出
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                <Link href="/auth/login" className="block w-full px-4">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full rounded-md border border-gray-300 py-1 text-left font-medium text-[#1B1A1A] hover:bg-gray-100/80"
                  >
                    登入
                  </Button>
                </Link>
              )}
            </li>
          </ul>
        </nav>
      </motion.div>
    </AnimatePresence>
  )
}
