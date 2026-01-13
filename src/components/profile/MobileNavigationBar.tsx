'use client'

import React from 'react'
import { UserCircle, FileText, Bookmark, Settings, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useMobileNav } from './MobileNavContext'

interface MenuItem {
  name: string
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { size?: number | string }>
}

const menuItems: MenuItem[] = [
  {
    name: '我的人物誌',
    href: '/profile',
    icon: UserCircle,
  },
  {
    name: '我的文章',
    href: '/profile/articles',
    icon: FileText,
  },
  {
    name: '我的照片',
    href: '/profile/photos',
    icon: ImageIcon,
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

export default function MobileNavigationBar() {
  const pathname = usePathname()
  const { isMobile } = useMobileNav()

  if (!isMobile) {
    return null
  }

  return (
    <div className="fixed left-0 right-0 top-0 z-50 w-full">
      <motion.div
        className="flex h-14 w-full items-center justify-center space-x-6 border-b border-[#DBD8D8] bg-white"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={`flex flex-col items-center ${isActive ? 'font-medium text-[#1B1A1A]' : 'text-[#6D6C6C]'}`}
            >
              <item.icon className="h-5 w-5" />
              <span className="mt-0.5 text-[10px]">{item.name}</span>
            </Link>
          )
        })}
      </motion.div>
    </div>
  )
}
