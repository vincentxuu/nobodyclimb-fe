'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

// 定義導航鏈接 - 修正順序與 constants.ts 保持一致
const NAV_LINKS = [
  { key: 'biography', text: '人物誌', href: '/biography' },
  { key: 'crags', text: '岩場', href: '/crag' },
  { key: 'gyms', text: '岩館', href: '/gym' },
  { key: 'gallery', text: '攝影集', href: '/gallery' },
  { key: 'videos', text: '影片', href: '/videos' },
  { key: 'blog', text: '部落格', href: '/blog' },
]

/**
 * 桌面版導航組件
 * 只在桌面版顯示，顯示主要導航鏈接
 */
export default function DesktopNav() {
  const pathname = usePathname()

  return (
    <nav className="hidden flex-1 items-center justify-center lg:flex">
      <ul className="flex gap-12">
        {NAV_LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={`relative font-['Noto_Sans_TC'] text-base font-medium leading-6 tracking-[0.02em] text-[#1B1A1A] hover:text-[#1B1A1A] ${pathname.startsWith(link.href) ? 'text-[#1B1A1A]' : ''} group`}
            >
              <span className="relative">
                {pathname.startsWith(link.href) && (
                  <span className="absolute -bottom-2 left-0 h-0.5 w-full bg-[#1B1A1A]"></span>
                )}
                <span className="absolute -bottom-2 left-0 h-0.5 w-0 bg-[#1B1A1A] transition-all duration-300 group-hover:w-full"></span>
                {link.text}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
