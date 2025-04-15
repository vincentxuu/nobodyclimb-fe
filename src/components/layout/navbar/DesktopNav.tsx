'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover/index'

// 定義導航鏈接 - 修正順序與 constants.ts 保持一致
const NAV_LINKS = [
  { key: 'biography', text: '人物誌', href: '/biography', hasSubmenu: false },
  { key: 'crags', text: '岩場', href: '/crag', hasSubmenu: false },
  { key: 'gyms', text: '岩館', href: '/gym', hasSubmenu: false },
  { key: 'gallery', text: '攝影集', href: '/gallery', hasSubmenu: false },
  { key: 'blog', text: '部落格', href: '/blog', hasSubmenu: true },
]

// 定義專欄子菜單
const COLUMN_SUBMENU = [
  { key: 'equipment', text: '裝備介紹', href: '/blog?category=equipment' },
  { key: 'technique', text: '技巧介紹', href: '/blog?category=technique' },
  { key: 'research', text: '技術研究', href: '/blog?category=research' },
  { key: 'competition', text: '比賽介紹', href: '/blog?category=competition' },
]

/**
 * 桌面版導航組件
 * 只在桌面版顯示，顯示主要導航鏈接
 */
export default function DesktopNav() {
  const pathname = usePathname()
  const [expandedColumn, setExpandedColumn] = useState(false)
  
  // 處理專欄展開狀態
  const handleColumnToggle = (isOpen: boolean) => {
    setExpandedColumn(isOpen)
  }
  
  // 確定目前頁面是否在專欄分類中
  const isInColumnSection = pathname.startsWith('/blog') && pathname !== '/blog/create' && !pathname.startsWith('/blog/edit/')

  return (
    <nav className="hidden lg:flex flex-1 items-center justify-center">
      <ul className="flex gap-12">
        {NAV_LINKS.map((link) => (
          <li key={link.href}>
            {link.hasSubmenu ? (
              <Popover closeOnClick={true} onOpenChange={handleColumnToggle}>
                <PopoverTrigger>
                  <button
                    className="flex items-center font-['Noto_Sans_TC'] text-base leading-6 tracking-[0.02em] font-medium text-[#1B1A1A] hover:text-[#1B1A1A] relative group"
                    id="column-article-button"
                  >
                    <span className="relative">
                      {(pathname.startsWith(link.href) && pathname !== '/blog/create' && !pathname.startsWith('/blog/edit/')) && (
                        <span className="absolute -bottom-2 left-0 w-full h-0.5 bg-[#1B1A1A]"></span>
                      )}
                      <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-[#1B1A1A] transition-all duration-300 group-hover:w-full"></span>
                      {link.text}
                    </span>
                    <ChevronDown className="ml-1 h-4 w-4 transition-transform duration-200" style={{ transform: expandedColumn || isInColumnSection ? 'rotate(180deg)' : 'none' }} />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[160px] p-0 mt-3 bg-white shadow-lg border border-[#EBEAEA] rounded-lg overflow-hidden">
                  <ul className="py-2">
                    <AnimatePresence>
                      {COLUMN_SUBMENU.map((subItem, index) => (
                        <motion.li 
                          key={subItem.href}
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ 
                            duration: 0.3, 
                            delay: index * 0.05,
                            ease: [0.16, 1, 0.3, 1]
                          }}
                        >
                          <Link
                            href={subItem.href}
                            className="block px-6 py-3 text-base font-medium text-[#3F3D3D] hover:bg-gray-100"
                          >
                            {subItem.text}
                          </Link>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                </PopoverContent>
              </Popover>
            ) : (
              <Link
                href={link.href}
                className={`font-['Noto_Sans_TC'] text-base leading-6 tracking-[0.02em] font-medium text-[#1B1A1A] hover:text-[#1B1A1A] relative
                  ${pathname === link.href ? 'text-[#1B1A1A]' : ''}
                  group
                `}
              >
                <span className="relative">
                  {pathname === link.href && (
                    <span className="absolute -bottom-2 left-0 w-full h-0.5 bg-[#1B1A1A]"></span>
                  )}
                  <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-[#1B1A1A] transition-all duration-300 group-hover:w-full"></span>
                
                  {link.text}
                </span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}
