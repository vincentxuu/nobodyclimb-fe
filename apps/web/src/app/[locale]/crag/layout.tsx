import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('CragPage')

  return {
    title: t('title'),
    description: t('layoutDescription'),
    keywords: ['台灣岩場', '戶外攀岩', '龍洞攀岩', '大砲岩', '攀岩地點', '運動攀登'],
    openGraph: {
      title: t('layoutOgTitle'),
      description: t('layoutOgDescription'),
      type: 'website',
    },
  }
}

export default function CragLayout({ children }: { children: React.ReactNode }) {
  return children
}
