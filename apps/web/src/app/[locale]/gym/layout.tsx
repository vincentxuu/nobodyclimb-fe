import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('GymPage')

  return {
    title: t('metaListTitle'),
    description: t('metaListDescription'),
    keywords: ['攀岩館', '抱石館', '室內攀岩', '台北攀岩館', '台中攀岩館', '高雄攀岩館'],
    openGraph: {
      title: t('metaListOgTitle'),
      description: t('metaListOgDescription'),
      type: 'website',
    },
  }
}

export default function GymLayout({ children }: { children: React.ReactNode }) {
  return children
}
