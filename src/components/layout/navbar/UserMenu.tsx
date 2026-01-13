'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'
import { generateAvatarElement, DEFAULT_AVATARS } from '@/components/shared/avatar-options'
import { AvatarWithFallback } from '@/components/ui/avatar-with-fallback'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

interface UserMenuProps {
  isDesktop: boolean
}

/**
 * 用戶選單組件
 * 只在桌面版顯示，提供用戶相關選項
 * 未登入時顯示登入按鈕，登入後顯示用戶頭像和下拉選單
 */
export default function UserMenu({ isDesktop }: UserMenuProps) {
  const router = useRouter()
  const { isAuthenticated, logout, user } = useAuthStore()

  // 假設用戶數據中有 avatarStyle 屬性，否則使用默認頭像
  const avatarStyle = user?.avatarStyle
    ? DEFAULT_AVATARS.find((a) => a.id === user.avatarStyle) || DEFAULT_AVATARS[0]
    : DEFAULT_AVATARS[0]

  if (!isDesktop) return null

  return (
    <div className="hidden px-6 lg:block">
      {isAuthenticated ? (
        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="lg"
                className="h-9 w-[100px] rounded-md border border-[#1B1A1A] font-medium text-[#1B1A1A] hover:bg-gray-100/80"
              >
                <span className="font-['Noto_Sans_CJK_TC'] text-sm font-medium leading-5 tracking-[0.01em]">
                  創作
                </span>
                <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[160px] rounded-lg border border-[#EBEAEA] bg-white p-2 shadow-md">
              <DropdownMenuItem
                className="cursor-pointer px-4 py-3 font-['Noto_Sans_CJK_TC'] text-sm font-medium leading-5 tracking-[0.01em] text-[#3F3D3D] hover:bg-gray-100"
                onClick={() => router.push('/blog/create')}
              >
                發表文章
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer px-4 py-3 font-['Noto_Sans_CJK_TC'] text-sm font-medium leading-5 tracking-[0.01em] text-[#3F3D3D] hover:bg-gray-100"
                onClick={() => router.push('/upload')}
              >
                上傳照片
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full transition-opacity duration-200 hover:opacity-80">
                <AvatarWithFallback
                  src={user?.avatar}
                  alt="用戶頭像"
                  size="w-10 h-10"
                  fallback={
                    <div role="img" aria-label="用戶頭像">
                      {generateAvatarElement(avatarStyle, 'w-10 h-10')}
                    </div>
                  }
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[200px] rounded-lg border border-[#EBEAEA] bg-white p-2 shadow-md">
              <DropdownMenuItem
                className="cursor-pointer px-8 py-3 font-['Noto_Sans_CJK_TC'] text-sm font-medium leading-5 tracking-[0.01em] text-[#3F3D3D] hover:bg-gray-100"
                onClick={() => router.push('/profile')}
              >
                我的人物誌
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer px-8 py-3 font-['Noto_Sans_CJK_TC'] text-sm font-medium leading-5 tracking-[0.01em] text-[#3F3D3D] hover:bg-gray-100"
                onClick={() => router.push('/profile/bucket-list')}
              >
                人生清單
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer px-8 py-3 font-['Noto_Sans_CJK_TC'] text-sm font-medium leading-5 tracking-[0.01em] text-[#3F3D3D] hover:bg-gray-100"
                onClick={() => router.push('/profile/photos')}
              >
                我的照片
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer px-8 py-3 font-['Noto_Sans_CJK_TC'] text-sm font-medium leading-5 tracking-[0.01em] text-[#3F3D3D] hover:bg-gray-100"
                onClick={() => router.push('/profile/articles')}
              >
                我的文章
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer px-8 py-3 font-['Noto_Sans_CJK_TC'] text-sm font-medium leading-5 tracking-[0.01em] text-[#3F3D3D] hover:bg-gray-100"
                onClick={() => router.push('/profile/bookmarks')}
              >
                我的收藏
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 bg-[#EBEAEA]" />
              <DropdownMenuItem
                className="cursor-pointer px-8 py-3 font-['Noto_Sans_CJK_TC'] text-sm font-medium leading-5 tracking-[0.01em] text-[#3F3D3D] hover:bg-gray-100"
                onClick={() => router.push('/profile/settings')}
              >
                帳號設定
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer px-8 py-3 font-['Noto_Sans_CJK_TC'] text-sm font-medium leading-5 tracking-[0.01em] text-[#D94A4A] hover:bg-gray-100"
                onClick={() => logout()}
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
            size="lg"
            className="h-9 w-[104px] rounded-md border border-[#1B1A1A] font-medium text-[#1B1A1A] hover:bg-gray-100/80"
          >
            <span className="font-['Noto_Sans_CJK_TC'] text-sm font-medium leading-5 tracking-[0.01em]">
              登入
            </span>
          </Button>
        </Link>
      )}
    </div>
  )
}
