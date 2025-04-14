'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Search, FileText, Bookmark, Settings, LogOut } from 'lucide-react'
import { NAV_LINKS, COLUMN_SUBMENU } from '@/lib/constants'
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
 * 顯示搜尋框和導航選單
 */
export default function MobileNav({ isDesktop }: MobileNavProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { 
    isNavbarOpen, 
    closeNavbar, 
    searchQuery, 
    setSearchQuery,
    closeSearch
  } = useUIStore()
  let { isAuthenticated, logout, user } = useAuthStore()
  isAuthenticated = true; // 臨時設置，實際應該使用後端驗證
  
  // 假設用戶數據中有 avatarStyle 屬性，否則使用默認頭像
  const avatarStyle = user?.avatarStyle || DEFAULT_AVATARS[0];
  
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({})

  // 處理子選單展開/收起
  const toggleSubmenu = (href: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [href]: !prev[href]
    }))
  }

  // 處理搜尋提交
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      closeSearch()
      closeNavbar()
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  if (isDesktop || !isNavbarOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
        className="lg:hidden bg-white border-t border-gray-200 shadow-lg"
      >
        <nav className="py-4">
          {/* 搜尋框 - 始終顯示在導航選單中 */}
          <div className="px-4 pb-4 mb-4 border-b border-gray-200">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="請輸入關鍵字"
                className="w-full h-[40px] px-4 py-3 bg-[#F5F5F5] rounded-[4px] text-base font-normal font-['Noto_Sans_CJK_TC'] leading-6 tracking-[0.01em] placeholder:text-[#B6B3B3] focus:outline-none"
                autoFocus
              />
              <button type="submit" className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Search className="h-5 w-5 text-[#1B1A1A] stroke-[1.5px]"/>
              </button>
            </form>
          </div>
          
          {/* 導航選單 */}
          <ul className="space-y-6 px-4">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                {link.hasSubmenu ? (
                  <div className="space-y-2">
                    <button 
                      onClick={() => toggleSubmenu(link.href)}
                      className="flex items-center justify-between w-full"
                    >
                      <span className="font-['Noto_Sans_TC'] text-base leading-6 tracking-[0.02em] font-medium text-[#1B1A1A]">
                        {link.label}
                      </span>
                      <ChevronDown 
                        className={`h-4 w-4 transition-transform duration-200 ${
                          expandedMenus[link.href] ? 'transform rotate-180' : ''
                        }`}
                      />
                    </button>
                    <AnimatePresence>
                      {expandedMenus[link.href] && (
                        <motion.ul
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="pl-4 space-y-2 overflow-hidden"
                        >
                          {COLUMN_SUBMENU.map((subItem) => (
                            <motion.li 
                              key={subItem.href}
                              initial={{ x: -10, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Link
                                href={subItem.href}
                                className="block py-2 text-sm font-medium text-[#3F3D3D] hover:text-[#8E8C8C]"
                                onClick={closeNavbar}
                              >
                                {subItem.label}
                              </Link>
                            </motion.li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link
                    href={link.href}
                    className={`block py-1 font-['Noto_Sans_TC'] text-base leading-6 tracking-[0.02em] font-medium hover:text-[#8E8C8C]
                      ${pathname === link.href ? 'text-[#8E8C8C]' : 'text-[#1B1A1A]'}
                    `}
                    onClick={closeNavbar}
                  >
                    {link.label}
                  </Link>
                )}
              </li>
            ))}

            <li className="pt-4 lg:hidden">
              {isAuthenticated ? (
                <div className="flex flex-col">
                  {/* 個人資料區塊 */}
                  <Link href="/profile" className="block">
                    <div className="flex items-center px-4 py-3 hover:bg-gray-50">
                      {user?.imageUrl ? (
                        <img 
                          src={user.imageUrl} 
                          alt="用戶頭像" 
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        generateAvatarElement(avatarStyle, 'w-10 h-10')
                      )}
                      <div className="ml-3">
                        <div className="font-['Noto_Sans_CJK_TC'] text-base font-medium text-[#1B1A1A]">{user?.name || '使用者名稱'}</div>
                        <div className="font-['Noto_Sans_CJK_TC'] text-sm text-[#8E8C8C]">查看個人檔案</div>
                      </div>
                    </div>
                  </Link>

                  {/* 主要功能區 */}
                  <div className="border-t border-[#EBEAEA] py-2">
                    <Link href="/blog/create" className="flex items-center px-4 py-3 hover:bg-gray-50">
                      <FileText className="w-5 h-5 text-[#3F3D3D]" />
                      <span className="ml-3 font-['Noto_Sans_CJK_TC'] text-sm font-medium text-[#3F3D3D]">發表文章</span>
                    </Link>
                    <Link href="/profile/articles" className="flex items-center px-4 py-3 hover:bg-gray-50">
                      <FileText className="w-5 h-5 text-[#3F3D3D]" />
                      <span className="ml-3 font-['Noto_Sans_CJK_TC'] text-sm font-medium text-[#3F3D3D]">我的文章</span>
                    </Link>
                    <Link href="/profile/bookmarks" className="flex items-center px-4 py-3 hover:bg-gray-50">
                      <Bookmark className="w-5 h-5 text-[#3F3D3D]" />
                      <span className="ml-3 font-['Noto_Sans_CJK_TC'] text-sm font-medium text-[#3F3D3D]">我的收藏</span>
                    </Link>
                  </div>

                  {/* 設定與登出區 */}
                  <div className="border-t border-[#EBEAEA]">
                    <Link href="/profile/settings" className="flex items-center px-4 py-3 hover:bg-gray-50">
                      <Settings className="w-5 h-5 text-[#3F3D3D]" />
                      <span className="ml-3 font-['Noto_Sans_CJK_TC'] text-sm font-medium text-[#3F3D3D]">帳號設定</span>
                    </Link>
                    <button 
                      onClick={() => logout()}
                      className="w-full flex items-center px-4 py-3 hover:bg-gray-50 text-[#D94A4A]"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="ml-3 font-['Noto_Sans_CJK_TC'] text-sm font-medium">登出</span>
                    </button>
                  </div>
                </div>
              ) : (
                <Link href="/auth/login" className="block w-full px-4">
                  <Button 
                    variant="outline"
                    size="lg"
                    className="border border-gray-300 text-[#1B1A1A] hover:bg-gray-100/80 w-full text-left rounded-md font-medium py-1"
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
