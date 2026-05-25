import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('BlogPage')

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: ['攀岩部落格', '攀岩技術', '攀岩教學', '攀岩心得', '攀岩裝備', '抱石技巧'],
    openGraph: {
      title: t('metaOgTitle'),
      description: t('metaOgDescription'),
      type: 'website',
    },
  }
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children
}
