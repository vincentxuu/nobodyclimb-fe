'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useMobileNav } from './MobileNavContext'

interface MenuItem {
  name: string
  href: string
}

const menuItems: MenuItem[] = [
  { name: '人物誌', href: '/profile' },
  { name: '文章', href: '/profile/articles' },
  { name: '照片', href: '/profile/photos' },
  { name: '收藏', href: '/profile/bookmarks' },
  { name: '設定', href: '/profile/settings' },
]

export default function MobileNavigationBar() {
  const pathname = usePathname()
  const { isMobile } = useMobileNav()

  if (!isMobile) {
    return null
  }

  return (
    <div className="fixed left-0 right-0 top-14 z-50 w-full">
      <motion.div
        className="scrollbar-hide flex h-12 w-full items-center overflow-x-auto border-b border-[#DBD8D8] bg-white px-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-6">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={`relative whitespace-nowrap py-3 font-['Noto_Sans_TC'] text-sm transition-colors ${
                  isActive ? 'font-semibold text-[#1B1A1A]' : 'font-medium text-[#6D6C6C]'
                }`}
              >
                {item.name}
                {isActive && (
                  <span className="absolute bottom-0 left-0 h-0.5 w-full bg-[#1B1A1A]" />
                )}
              </Link>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
