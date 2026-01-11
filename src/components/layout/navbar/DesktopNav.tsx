'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { NAV_LINKS } from '@/lib/constants'

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
                {link.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
