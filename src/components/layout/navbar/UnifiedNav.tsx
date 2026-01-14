'use client'

import { useRef } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { NAV_LINKS } from '@/lib/constants'

/**
 * 統一導航組件
 * 桌機版居中顯示，手機版水平滑動（帶漸層提示）
 */
export default function UnifiedNav() {
  const pathname = usePathname()
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <nav className="relative flex-1 overflow-hidden">
      {/* 右側漸層提示 - 手機版顯示，提示可滑動 */}
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-8 bg-gradient-to-l from-white to-transparent md:hidden" />

      <div
        ref={scrollRef}
        className="scrollbar-hide flex items-center gap-4 overflow-x-auto px-2 md:gap-6 md:px-4 lg:justify-center lg:gap-12 lg:px-0"
      >
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`relative whitespace-nowrap py-1.5 font-['Noto_Sans_TC'] text-sm font-medium leading-5 tracking-[0.02em] text-[#1B1A1A] transition-colors hover:text-[#1B1A1A] md:py-2 md:text-base md:leading-6 ${pathname.startsWith(link.href) ? 'text-[#1B1A1A]' : ''} group`}
          >
            <span className="relative">
              {pathname.startsWith(link.href) && (
                <span className="absolute -bottom-1 left-0 h-0.5 w-full bg-[#1B1A1A]"></span>
              )}
              <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-[#1B1A1A] transition-all duration-300 group-hover:w-full"></span>
              {link.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
