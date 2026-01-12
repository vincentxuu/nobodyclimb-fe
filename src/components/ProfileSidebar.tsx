'use client'

import { UserCircle, FileText, Bookmark, Settings } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { AvatarWithFallback } from '@/components/ui/avatar-with-fallback'

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

const ProfileSidebar = () => {
  const router = useRouter()
  const pathname = usePathname()
  const user = useAuthStore((state) => state.user)

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
  const displayName = user?.displayName || user?.username || '用戶'
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
              <span className="text-[16px] font-medium tracking-[0.02em]">{item.name}</span>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

export default ProfileSidebar
