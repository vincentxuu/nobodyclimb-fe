'use client'

import {
  Bookmark,
  FileText,
  Image as ImageIcon,
  type LucideIcon,
  Settings,
  UserCircle,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

interface MenuItem {
  name: string
  href: string
  icon: LucideIcon
}

export default function MobileNav() {
  const t = useTranslations('ProfilePage')
  const pathname = usePathname()

  const menuItems: MenuItem[] = [
    {
      name: t('navMyBiography'),
      href: '/profile',
      icon: UserCircle,
    },
    {
      name: t('navArticles'),
      href: '/profile/articles',
      icon: FileText,
    },
    {
      name: t('navPhotos'),
      href: '/profile/photos',
      icon: ImageIcon,
    },
    {
      name: t('navBookmarks'),
      href: '/profile/bookmarks',
      icon: Bookmark,
    },
    {
      name: t('navSettings'),
      href: '/profile/settings',
      icon: Settings,
    },
  ]

  return (
    <div className="fixed left-0 right-0 top-0 z-50 flex h-14 w-full items-center justify-center space-x-6 border-b border-[#DBD8D8] bg-white">
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
    </div>
  )
}
