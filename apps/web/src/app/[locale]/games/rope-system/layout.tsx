import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('GamesPage')
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: ['攀岩', '繩索系統', '確保', '先鋒', '頂繩', '垂降', '固定點'],
  }
}

interface RopeSystemLayoutProps {
  children: React.ReactNode
}

export default function RopeSystemLayout({ children }: RopeSystemLayoutProps) {
  return <div className="min-h-screen bg-[#F5F5F5]">{children}</div>
}
