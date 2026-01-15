import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '人物誌',
  description: '認識台灣攀岩社群中的攀岩愛好者，分享他們的攀岩故事與經驗，找到志同道合的攀岩夥伴。',
  keywords: ['攀岩人物', '攀岩社群', '攀岩故事', '攀岩夥伴'],
  openGraph: {
    title: '人物誌 | NobodyClimb',
    description: '認識台灣攀岩社群中的攀岩愛好者，分享攀岩故事。',
    type: 'website',
  },
}

export default function BiographyLayout({ children }: { children: React.ReactNode }) {
  return children
}
