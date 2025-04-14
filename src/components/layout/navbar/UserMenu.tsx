'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'
import { generateAvatarElement, DEFAULT_AVATARS } from '@/components/shared/avatar-options'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"

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
  let { isAuthenticated, logout, user } = useAuthStore()
  isAuthenticated = true; // 臨時設置，實際應該使用後端驗證
  
  // 假設用戶數據中有 avatarStyle 屬性，否則使用默認頭像
  const avatarStyle = user?.avatarStyle ? DEFAULT_AVATARS.find(a => a.id === user.avatarStyle) || DEFAULT_AVATARS[0] : DEFAULT_AVATARS[0];

  if (!isDesktop) return null;

  return (
    <div className="px-6 hidden lg:block">
      {isAuthenticated ? (
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => router.push('/blog/create')}
            className="border border-[#1B1A1A] text-[#1B1A1A] hover:bg-gray-100/80 rounded-md font-medium w-[120px] h-9"
          >
            <span className="font-['Noto_Sans_CJK_TC'] text-sm leading-5 tracking-[0.01em] font-medium">發表文章</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center hover:opacity-80 transition-opacity duration-200">
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt="用戶頭像" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  generateAvatarElement(avatarStyle, 'w-10 h-10')
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[200px] p-2 bg-white border border-[#EBEAEA] rounded-lg shadow-md">
              <DropdownMenuItem className="px-8 py-3 text-sm font-medium text-[#3F3D3D] hover:bg-gray-100 cursor-pointer font-['Noto_Sans_CJK_TC'] leading-5 tracking-[0.01em]" onClick={() => router.push('/profile')}>
                我的人物誌
              </DropdownMenuItem>
              <DropdownMenuItem className="px-8 py-3 text-sm font-medium text-[#3F3D3D] hover:bg-gray-100 cursor-pointer font-['Noto_Sans_CJK_TC'] leading-5 tracking-[0.01em]" onClick={() => router.push('/profile/articles')}>
                我的文章
              </DropdownMenuItem>
              <DropdownMenuItem className="px-8 py-3 text-sm font-medium text-[#3F3D3D] hover:bg-gray-100 cursor-pointer font-['Noto_Sans_CJK_TC'] leading-5 tracking-[0.01em]" onClick={() => router.push('/profile/bookmarks')}>
                我的收藏
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#EBEAEA] my-1" />
              <DropdownMenuItem className="px-8 py-3 text-sm font-medium text-[#3F3D3D] hover:bg-gray-100 cursor-pointer font-['Noto_Sans_CJK_TC'] leading-5 tracking-[0.01em]" onClick={() => router.push('/profile/settings')}>
                帳號設定
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="px-8 py-3 text-sm font-medium text-[#D94A4A] hover:bg-gray-100 cursor-pointer font-['Noto_Sans_CJK_TC'] leading-5 tracking-[0.01em]"
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
            className="border border-[#1B1A1A] text-[#1B1A1A] hover:bg-gray-100/80 rounded-md font-medium w-[104px] h-9"
          >
            <span className="font-['Noto_Sans_CJK_TC'] text-sm leading-5 tracking-[0.01em] font-medium">登入</span>
          </Button>
        </Link>
      )}
    </div>
  )
}
