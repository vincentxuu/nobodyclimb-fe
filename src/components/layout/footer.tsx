'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Mail } from 'lucide-react'
import { SOCIAL_LINKS } from '@/lib/constants'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'

/**
 * 頁腳組件
 * 包含網站 logo、版權信息和社交媒體連結
 */
export function Footer() {
  const { isAuthenticated } = useAuthStore()

  // 社群媒體圖標映射
  const socialIcons: Record<string, React.JSX.Element> = {
    mail: <Mail className="h-5 w-5" />,
  }

  return (
    <footer className="bg-[#1B1A1A]">
      {/* 訪客註冊引導 - 僅未登入時顯示 */}
      {!isAuthenticated && (
        <div className="border-b border-[#333] px-4 py-8 text-center md:px-20">
          <p className="mb-4 text-sm text-gray-300 md:text-base">
            加入我們，寫下你的攀岩故事
          </p>
          <Link href="/auth/register">
            <Button className="h-10 bg-brand-accent/70 px-6 text-sm text-[#1B1A1A] hover:bg-brand-accent">
              立即加入
            </Button>
          </Link>
        </div>
      )}

      <div className="flex h-[160px] items-center justify-between px-4 md:px-20 lg:px-40 xl:px-[160px]">
        {/* Logo與版權資訊 */}
        <div className="flex items-center space-x-4">
          <Image
            src="/logo/Nobodylimb-white.svg"
            alt="NobodyClimb Logo"
            width={120}
            height={32}
            className="h-8 w-auto"
          />
          <p className="text-[14px] font-light text-[#8E8C8C]">NobodyClimb © 2022.</p>
        </div>

        {/* 社交媒體圖標 */}
        <div className="flex items-center space-x-3">
          {SOCIAL_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.label}
              className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[#DBD8D8] p-[5px] text-[#1B1A1A] transition-colors hover:bg-white"
            >
              {socialIcons[link.icon]}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
