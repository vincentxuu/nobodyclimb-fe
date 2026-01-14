'use client'

import { useRef } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { NAV_LINKS } from '@/lib/constants'

/**
 * 統一導航組件
 * 桌機版居中顯示，手機版水平滑動
 */
export default function UnifiedNav() {
  const pathname = usePathname()
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <nav className="flex-1 overflow-hidden">
      <div
        ref={scrollRef}
        className="scrollbar-hide flex items-center gap-6 overflow-x-auto px-4 lg:justify-center lg:gap-12 lg:px-0"
      >
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`relative whitespace-nowrap py-2 font-['Noto_Sans_TC'] text-base font-medium leading-6 tracking-[0.02em] text-[#1B1A1A] transition-colors hover:text-[#1B1A1A] ${pathname.startsWith(link.href) ? 'text-[#1B1A1A]' : ''} group`}
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
