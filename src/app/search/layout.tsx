import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '搜尋',
  description: '在 NobodyClimb 搜尋攀岩相關內容',
  robots: {
    index: false,
    follow: true,
  },
}

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children
}
