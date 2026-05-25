'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useMobileNav } from './MobileNavContext'

interface MenuItem {
  key: string
  href: string
}

const menuItems: MenuItem[] = [
  { key: 'navBiographyShort', href: '/profile' },
  { key: 'navRecommendationsShort', href: '/profile/recommendations' },
  { key: 'navAiMemory', href: '/profile/ai-memory' },
  { key: 'navBucketListShort', href: '/profile/bucket-list' },
  { key: 'navAscents', href: '/profile/ascents' },
  { key: 'navStatsShort', href: '/profile/stats' },
  { key: 'navArticlesShort', href: '/profile/articles' },
  { key: 'navPhotosShort', href: '/profile/photos' },
  { key: 'navBookmarksShort', href: '/profile/bookmarks' },
  { key: 'navSettingsShort', href: '/profile/settings' },
]

export default function MobileNavigationBar() {
  const pathname = usePathname()
  const { isMobile } = useMobileNav()
  const t = useTranslations('ProfileUI')

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
                {t(item.key)}
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
