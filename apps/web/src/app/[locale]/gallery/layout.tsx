import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('GalleryUpload')

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: ['攀岩攝影', '攀岩照片', '戶外攀岩照片', '抱石攝影'],
    openGraph: {
      title: t('metaOgTitle'),
      description: t('metaOgDescription'),
      type: 'website',
    },
  }
}

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return children
}
