'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Facebook, Instagram, Mail } from 'lucide-react'
import { SOCIAL_LINKS } from '@/lib/constants'

/**
 * 頁腳組件
 * 包含網站 logo、版權信息和社交媒體連結
 */
export function Footer() {
  // 社群媒體圖標映射
  const socialIcons: Record<string, JSX.Element> = {
    instagram: <Instagram className="h-5 w-5" />,
    facebook: <Facebook className="h-5 w-5" />,
    mail: <Mail className="h-5 w-5" />,
  }
  
  return (
    <footer className="bg-[#1B1A1A] h-[160px] flex justify-between items-center px-4 md:px-20 lg:px-40 xl:px-[160px]">
      {/* Logo與版權資訊 */}
      <div className="flex items-center space-x-4">
        <img
          src="/logo/Nobodylimb-white.svg"
          alt="NobodyClimb Logo"
          className="h-8 w-auto"
        />
        <p className="text-[#8E8C8C] text-[14px] font-light">
          NobodyClimb © 2022.
        </p>
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
            className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[#DBD8D8] p-[5px] text-[#1B1A1A] hover:bg-white transition-colors"
          >
            {socialIcons[link.icon]}
          </a>
        ))}
      </div>
    </footer>
  )
}
