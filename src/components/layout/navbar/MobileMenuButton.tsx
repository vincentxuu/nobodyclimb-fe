'use client'

import { Menu, X } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'

interface MobileMenuButtonProps {
  isDesktop: boolean
}

/**
 * 行動版選單按鈕組件
 * 只在行動版顯示，控制導航選單的開關
 */
export default function MobileMenuButton({ isDesktop }: MobileMenuButtonProps) {
  const { isNavbarOpen, toggleNavbar } = useUIStore()

  if (isDesktop) return null;

  return (
    <button
      onClick={toggleNavbar}
      className="px-4 text-black lg:hidden"
      aria-label={isNavbarOpen ? '關閉選單' : '開啟選單'}
    >
      {isNavbarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
    </button>
  )
}
