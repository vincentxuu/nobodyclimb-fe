import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('SearchPage')
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    robots: {
      index: false,
      follow: true,
    },
  }
}

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children
}
