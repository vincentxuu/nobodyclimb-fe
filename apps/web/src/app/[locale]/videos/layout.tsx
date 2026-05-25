import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('VideosPage')

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: ['攀岩影片', '攀岩教學影片', '抱石影片', '攀岩比賽', 'Adam Ondra', 'Janja Garnbret'],
    openGraph: {
      title: t('metaOgTitle'),
      description: t('metaOgDescription'),
      type: 'website',
    },
  }
}

export default function VideosLayout({ children }: { children: React.ReactNode }) {
  return children
}
