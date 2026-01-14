'use client'

import { useState, useEffect } from 'react'
import { motion, useScroll, useSpring } from 'framer-motion'

// 導入導航組件
import Logo from './navbar/Logo'
import UnifiedNav from './navbar/UnifiedNav'
import UserMenu from './navbar/UserMenu'

/**
 * 主導航欄組件
 * 整合所有導航相關子組件，提供完整的網站導航功能
 * 手機和桌機統一設計，手機版使用水平滑動導航
 */
export function Navbar() {
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

      <div className="flex items-center">
        {/* Logo 區域 */}
        <Logo />

        {/* 統一導航區域 - 手機可滑動，桌機居中 */}
        <UnifiedNav />

        {/* 右側功能區 - 手機桌機統一 */}
        <UserMenu />
      </div>
    </header>
  )
}
