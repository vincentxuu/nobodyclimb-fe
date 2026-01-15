import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '部落格',
  description: '攀岩技術教學、心得分享、裝備評測、比賽資訊等攀岩相關文章，幫助你提升攀岩技巧與知識。',
  keywords: ['攀岩部落格', '攀岩技術', '攀岩教學', '攀岩心得', '攀岩裝備', '抱石技巧'],
  openGraph: {
    title: '部落格 | NobodyClimb',
    description: '攀岩技術教學、心得分享、裝備評測、比賽資訊等攀岩相關文章。',
    type: 'website',
  },
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children
}
