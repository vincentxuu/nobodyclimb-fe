import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { SITE_NAME, SITE_URL } from '@/lib/constants'
import StoryDetailClient from './StoryDetailClient'

// 強制動態渲染
export const dynamic = 'force-dynamic'

// 生成 metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string; id: string; locale: string }>
}): Promise<Metadata> {
  const { type, id, locale } = await params
  const t = await getTranslations({ locale, namespace: 'StoryPage' })

  // 故事類型標籤
  const typeLabels: Record<string, string> = {
    'core-stories': t('typeLabels.coreStories'),
    'one-liners': t('typeLabels.oneLiners'),
    stories: t('typeLabels.stories'),
  }

  const typeLabel = typeLabels[type] || t('typeLabels.default')

  return {
    title: `${typeLabel}`,
    description: t('metaDescription', { typeLabel }),
    openGraph: {
      title: `${typeLabel} | ${SITE_NAME}`,
      description: t('metaDescription', { typeLabel }),
      type: 'article',
      url: `${SITE_URL}/story/${type}/${id}`,
    },
    alternates: {
      canonical: `${SITE_URL}/story/${type}/${id}`,
    },
  }
}

export default async function StoryDetailPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>
}) {
  return <StoryDetailClient params={params} />
}
