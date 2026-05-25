import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('BiographyPage')

  return {
    title: t('metaListTitle'),
    description: t('metaListDescription'),
    keywords: ['攀岩人物', '攀岩社群', '攀岩故事', '攀岩夥伴'],
    openGraph: {
      title: t('metaListOgTitle'),
      description: t('metaListOgDescription'),
      type: 'website',
    },
  }
}

export default function BiographyLayout({ children }: { children: React.ReactNode }) {
  return children
}
