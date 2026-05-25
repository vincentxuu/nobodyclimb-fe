'use client'

import { motion } from 'framer-motion'
import {
  BarChart3,
  Bookmark,
  Brain,
  FileText,
  Image as ImageIcon,
  MountainSnow,
  Settings,
  Sparkles,
  Target,
  UserCircle,
} from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCallback } from 'react'
import { RankBadge } from '@/components/rank/RankBadge'
import { AvatarWithFallback } from '@/components/ui/avatar-with-fallback'
import { useMyQuota } from '@/lib/api/ai'
import { useAuthStore } from '@/store/authStore'

interface MenuItem {
  key: string
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { size?: number | string }>
}

const menuItems: MenuItem[] = [
  {
    key: 'navMyBiography',
    href: '/profile',
    icon: UserCircle,
  },
  {
    key: 'navAiRecommendations',
    href: '/profile/recommendations',
    icon: Sparkles,
  },
  {
    key: 'navAiMemory',
    href: '/profile/ai-memory',
    icon: Brain,
  },
  {
    key: 'navBucketList',
    href: '/profile/bucket-list',
    icon: Target,
  },
  {
    key: 'navAscents',
    href: '/profile/ascents',
    icon: MountainSnow,
  },
  {
    key: 'navMyStats',
    href: '/profile/stats',
    icon: BarChart3,
  },
  {
    key: 'navMyArticles',
    href: '/profile/articles',
    icon: FileText,
  },
  {
    key: 'navMyPhotos',
    href: '/profile/photos',
    icon: ImageIcon,
  },
  {
    key: 'navBookmarks',
    href: '/profile/bookmarks',
    icon: Bookmark,
  },
  {
    key: 'navAccountSettings',
    href: '/profile/settings',
    icon: Settings,
  },
]

const ProfileSidebar = () => {
  const router = useRouter()
  const pathname = usePathname()
  const user = useAuthStore((state) => state.user)
  const { data: quota } = useMyQuota()
  const t = useTranslations('ProfileUI')

  // 優化點擊處理函數
  const handleNavigate = useCallback(
    (href: string) => {
      if (pathname !== href) {
        router.push(href, { scroll: false })
      }
    },
    [pathname, router]
  )

  // 取得顯示名稱（優先使用 displayName，其次 username）
  const displayName = user?.displayName || user?.username || t('defaultUserName')
  const email = user?.email || ''
  const avatarUrl = user?.avatar

  // 桌面版返回完整側邊欄
  return (
    <motion.div
      className="flex w-64 flex-col bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* User Card */}
      <div className="flex flex-col items-center p-6">
        <div className="mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-[#F5F5F5]">
          <AvatarWithFallback
            src={avatarUrl}
            alt={displayName}
            size="h-24 w-24"
            fallback={
              <div role="img" aria-label={displayName}>
                <UserCircle className="h-20 w-20 text-[#3F3D3D]" />
              </div>
            }
          />
        </div>
        <h2 className="mb-1 text-[16px] font-medium text-[#1B1A1A]">{displayName}</h2>
        {quota && <RankBadge tier={quota.tier} size="md" className="mb-1" />}
        <p className="text-[14px] font-light text-[#8E8C8C]">{email}</p>
      </div>

      <hr className="border-[#DBD8D8]" />

      {/* Navigation Menu */}
      <div className="p-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <div
              key={item.href}
              onClick={() => handleNavigate(item.href)}
              className={`flex cursor-pointer items-center gap-3 rounded-[4px] px-5 py-3 transition-colors ${
                isActive ? 'bg-[#F5F5F5] text-[#3F3D3D]' : 'text-[#6D6C6C] hover:bg-gray-50'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[16px] font-medium tracking-[0.02em]">{t(item.key)}</span>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

export default ProfileSidebar
