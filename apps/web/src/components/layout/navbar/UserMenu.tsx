'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { DEFAULT_AVATARS, generateAvatarElement } from '@/components/shared/avatar-options'
import { NotificationCenter } from '@/components/shared/notification-center'
import { AvatarWithFallback } from '@/components/ui/avatar-with-fallback'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Link, useRouter } from '@/i18n/navigation'
import { useAuthStore } from '@/store/authStore'

const menuItemBaseClass =
  "cursor-pointer font-['Noto_Sans_CJK_TC'] text-sm font-medium leading-5 tracking-[0.01em] hover:bg-gray-100"
const createMenuItemClass = `${menuItemBaseClass} px-4 py-3 text-[#3F3D3D]`
const userMenuItemClass = `${menuItemBaseClass} px-3 py-2.5 text-[#3F3D3D]`
const logoutMenuItemClass = `${menuItemBaseClass} px-3 py-2.5 text-[#D94A4A]`

const NAV_ITEMS = [
  { href: '/biography', key: 'biography' },
  { href: '/crag', key: 'crag' },
  { href: '/gym', key: 'gym' },
  { href: '/gallery', key: 'gallery' },
  { href: '/videos', key: 'videos' },
  { href: '/blog', key: 'blog' },
] as const

const PERSONAL_ITEMS = [
  { href: '/profile', key: 'myProfile' },
  { href: '/profile/bucket-list', key: 'bucketList' },
  { href: '/profile/ascents', key: 'ascents' },
  { href: '/profile/recommendations', key: 'recommendations' },
  { href: '/profile/stats', key: 'stats' },
  { href: '/profile/photos', key: 'photos' },
  { href: '/profile/articles', key: 'articles' },
  { href: '/profile/bookmarks', key: 'bookmarks' },
  { href: '/profile/settings', key: 'settings' },
] as const

/**
 * 用戶選單組件
 * 未登入時顯示登入按鈕，登入後顯示用戶頭像和下拉選單
 */
export default function UserMenu() {
  const router = useRouter()
  const { status, signOut, user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'explore' | 'personal'>('personal')
  const t = useTranslations('UserMenu')
  const tNav = useTranslations('Navbar')
  const tAuth = useTranslations('AuthPage')

  const avatarStyle = user?.avatarStyle
    ? DEFAULT_AVATARS.find((a) => a.id === user.avatarStyle) || DEFAULT_AVATARS[0]
    : DEFAULT_AVATARS[0]

  return (
    <div className="flex h-full shrink-0 items-center pl-2 pr-2 md:pl-4 md:pr-4 lg:pl-6 lg:pr-6">
      {status === 'signIn' ? (
        <div className="flex items-center space-x-1.5 md:space-x-2 lg:space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 rounded-lg border border-[#1B1A1A] px-2 font-medium text-[#1B1A1A] hover:bg-gray-100/80 md:h-8 md:px-3 lg:h-9 lg:px-4"
              >
                <span className="font-['Noto_Sans_CJK_TC'] text-xs font-medium leading-5 tracking-[0.01em] md:text-sm">
                  {t('create')}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[160px] rounded-lg border border-[#EBEAEA] bg-white p-2 shadow-md">
              <DropdownMenuItem
                className={createMenuItemClass}
                onClick={() => router.push('/blog/create')}
              >
                {t('writeArticle')}
              </DropdownMenuItem>
              <DropdownMenuItem
                className={createMenuItemClass}
                onClick={() => router.push('/upload')}
              >
                {t('uploadPhoto')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <NotificationCenter />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full transition-opacity duration-200 hover:opacity-80 md:h-8 md:w-8 lg:h-10 lg:w-10">
                <AvatarWithFallback
                  src={user?.avatar}
                  alt="用戶頭像"
                  size="w-7 h-7 md:w-8 md:h-8 lg:w-10 lg:h-10"
                  fallback={
                    <div role="img" aria-label="用戶頭像">
                      {generateAvatarElement(avatarStyle, 'w-7 h-7 md:w-8 md:h-8 lg:w-10 lg:h-10')}
                    </div>
                  }
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              sideOffset={8}
              className="w-[240px] overflow-visible rounded-lg border border-[#EBEAEA] bg-white p-2 shadow-md"
            >
              <div className="mb-2 grid grid-cols-2 rounded-lg bg-[#F5F5F5] p-1">
                <button
                  type="button"
                  className={`rounded-md px-2 py-1.5 text-sm font-medium transition-colors ${
                    activeTab === 'explore'
                      ? 'bg-white text-[#1B1A1A] shadow-sm'
                      : 'text-[#6D6C6C] hover:text-[#1B1A1A]'
                  }`}
                  onClick={() => setActiveTab('explore')}
                >
                  {t('exploreTab')}
                </button>
                <button
                  type="button"
                  className={`rounded-md px-2 py-1.5 text-sm font-medium transition-colors ${
                    activeTab === 'personal'
                      ? 'bg-white text-[#1B1A1A] shadow-sm'
                      : 'text-[#6D6C6C] hover:text-[#1B1A1A]'
                  }`}
                  onClick={() => setActiveTab('personal')}
                >
                  {t('personalTab')}
                </button>
              </div>

              <div className="max-h-[320px] overflow-y-auto md:max-h-none md:min-h-[320px] md:overflow-visible">
                {activeTab === 'explore' &&
                  NAV_ITEMS.map((item) => (
                    <DropdownMenuItem
                      key={item.href}
                      className={userMenuItemClass}
                      onClick={() => router.push(item.href)}
                    >
                      {tNav(item.key)}
                    </DropdownMenuItem>
                  ))}

                {activeTab === 'personal' && (
                  <>
                    {PERSONAL_ITEMS.map((item) => (
                      <DropdownMenuItem
                        key={item.href}
                        className={userMenuItemClass}
                        onClick={() => router.push(item.href)}
                      >
                        {t(item.key)}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator className="my-1 bg-[#EBEAEA]" />
                    <DropdownMenuItem className={logoutMenuItemClass} onClick={() => signOut()}>
                      {t('logout')}
                    </DropdownMenuItem>
                  </>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <Link href="/auth/login">
          <Button
            variant="outline"
            size="sm"
            className="h-7 rounded-lg border border-[#1B1A1A] px-2 font-medium text-[#1B1A1A] hover:bg-gray-100/80 md:h-8 md:px-3 lg:h-9 lg:px-4"
          >
            <span className="font-['Noto_Sans_CJK_TC'] text-xs font-medium leading-5 tracking-[0.01em] md:text-sm">
              {tAuth('login')}
            </span>
          </Button>
        </Link>
      )}
    </div>
  )
}
