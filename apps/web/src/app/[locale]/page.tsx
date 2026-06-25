import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { OG_IMAGE, SITE_NAME, SITE_URL } from '@/lib/constants'
import { buildHreflangAlternates, buildOgLocale } from '@/lib/i18n-metadata'
import HomeClient from './HomeClient'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Home' })
  const ogLocale = buildOgLocale(locale)

  return {
    title: `${SITE_NAME} - ${t('meta.title')}`,
    description: t('meta.description'),
    alternates: {
      languages: buildHreflangAlternates('/'),
    },
    openGraph: {
      title: `${SITE_NAME} - ${t('meta.title')}`,
      description: t('meta.description'),
      url: SITE_URL,
      siteName: SITE_NAME,
      locale: ogLocale.locale,
      alternateLocale: ogLocale.alternateLocale,
      images: [
        {
          url: `${SITE_URL}${OG_IMAGE}`,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} - ${t('meta.title')}`,
        },
      ],
      type: 'website',
    },
  }
}

export default function HomePage() {
  return <HomeClient />
}
