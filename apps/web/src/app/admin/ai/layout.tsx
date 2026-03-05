'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/admin/ai', label: '儀表板', exact: true },
  { href: '/admin/ai/logs', label: '查詢日誌', exact: false },
  { href: '/admin/ai/knowledge', label: '知識庫', exact: false },
  { href: '/admin/ai/settings', label: '設定', exact: false },
]

export default function AdminAILayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  return (
    <div className="space-y-5">
      {/* 子導覽頁籤 */}
      <div className="flex gap-1 border-b border-wb-20 bg-transparent">
        {tabs.map((tab) => {
          const active = isActive(tab.href, tab.exact)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                active
                  ? 'border-wb-100 text-wb-100'
                  : 'border-transparent text-wb-50 hover:text-wb-80 hover:border-wb-30'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      {children}
    </div>
  )
}
