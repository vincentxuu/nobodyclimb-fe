'use client'

import { useState, useEffect } from 'react'
// 使用 Next.js 原生的路由函數
import { usePathname } from 'next/navigation'
import { useUIStore } from '@/store/uiStore'
import { motion, useScroll, useSpring } from 'framer-motion'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'

// 導入導航組件
import Logo from './navbar/Logo'
import DesktopNav from './navbar/DesktopNav'
import MobileMenuButton from './navbar/MobileMenuButton'
import UserMenu from './navbar/UserMenu'
import MobileNav from './navbar/MobileNav'
// 移除 LanguageSwitcher
// import { LanguageSwitcher } from '@/components/shared/language-switcher'

/**
 * 主導航欄組件
 * 整合所有導航相關子組件，提供完整的網站導航功能
 */
export function Navbar() {
  const pathname = usePathname()
  const { closeNavbar } = useUIStore()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [isScrolled, setIsScrolled] = useState(false)
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 200,
    damping: 30,
  })

  // 監聽滾動，改變導航欄樣式
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // 路由變更時關閉導航欄
  useEffect(() => {
    closeNavbar()
  }, [pathname, closeNavbar])

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-[999] transition-all duration-300 ${
        isScrolled ? 'bg-white/95 shadow-sm backdrop-blur-sm' : 'bg-white backdrop-blur-sm'
      }`}
    >
      {/* 進度條 */}
      <motion.div
        className="fixed left-0 right-0 top-0 z-[9999] h-[3px] origin-left bg-[#FFE70C]"
        style={{ scaleX }}
      />

      <div className="flex items-center justify-between">
        {/* Logo 區域 */}
        <Logo />

        {/* 中間導航區域 - 只在桌面版顯示 */}
        <DesktopNav />

        {/* 右側功能區 */}
        <div className="flex items-center">
          <UserMenu isDesktop={isDesktop} />
          <MobileMenuButton isDesktop={isDesktop} />
        </div>
      </div>

      {/* 行動版導航菜單 */}
      <MobileNav isDesktop={isDesktop} />
    </header>
  )
}
