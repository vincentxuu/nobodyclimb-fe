'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'
import { generateAvatarElement, DEFAULT_AVATARS } from '@/components/shared/avatar-options'
import { AvatarWithFallback } from '@/components/ui/avatar-with-fallback'
import { NotificationCenter } from '@/components/shared/notification-center'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

// 共用的選單項目樣式
const menuItemBaseClass =
  "cursor-pointer font-['Noto_Sans_CJK_TC'] text-sm font-medium leading-5 tracking-[0.01em] hover:bg-gray-100"
const createMenuItemClass = `${menuItemBaseClass} px-4 py-3 text-[#3F3D3D]`
const userMenuItemClass = `${menuItemBaseClass} px-8 py-3 text-[#3F3D3D]`
const logoutMenuItemClass = `${menuItemBaseClass} px-8 py-3 text-[#D94A4A]`

/**
 * 用戶選單組件
 * 手機和桌機統一設計
 * 未登入時顯示登入按鈕，登入後顯示用戶頭像和下拉選單
 */
export default function UserMenu() {
  const router = useRouter()
  const { status, signOut, user } = useAuthStore()

  // 假設用戶數據中有 avatarStyle 屬性，否則使用默認頭像
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
                  創作
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[160px] rounded-lg border border-[#EBEAEA] bg-white p-2 shadow-md">
              <DropdownMenuItem
                className={createMenuItemClass}
                onClick={() => router.push('/blog/create')}
              >
                發表文章
              </DropdownMenuItem>
              <DropdownMenuItem
                className={createMenuItemClass}
                onClick={() => router.push('/upload')}
              >
                上傳照片
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
            <DropdownMenuContent className="w-[200px] rounded-lg border border-[#EBEAEA] bg-white p-2 shadow-md">
              <DropdownMenuItem
                className={userMenuItemClass}
                onClick={() => router.push('/profile')}
              >
                我的人物誌
              </DropdownMenuItem>
              <DropdownMenuItem
                className={userMenuItemClass}
                onClick={() => router.push('/profile/bucket-list')}
              >
                人生清單
              </DropdownMenuItem>
              <DropdownMenuItem
                className={userMenuItemClass}
                onClick={() => router.push('/profile/photos')}
              >
                我的照片
              </DropdownMenuItem>
              <DropdownMenuItem
                className={userMenuItemClass}
                onClick={() => router.push('/profile/articles')}
              >
                我的文章
              </DropdownMenuItem>
              <DropdownMenuItem
                className={userMenuItemClass}
                onClick={() => router.push('/profile/bookmarks')}
              >
                我的收藏
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 bg-[#EBEAEA]" />
              <DropdownMenuItem
                className={userMenuItemClass}
                onClick={() => router.push('/profile/settings')}
              >
                帳號設定
              </DropdownMenuItem>
              <DropdownMenuItem
                className={logoutMenuItemClass}
                onClick={() => signOut()}
              >
                登出
              </DropdownMenuItem>
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
              登入
            </span>
          </Button>
        </Link>
      )}
    </div>
  )
}
