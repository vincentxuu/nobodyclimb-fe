import type { Metadata } from 'next'
import StoryDetailClient from './StoryDetailClient'
import { SITE_URL, SITE_NAME } from '@/lib/constants'

// 強制動態渲染
export const dynamic = 'force-dynamic'

// 生成 metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string; id: string }>
}): Promise<Metadata> {
  const { type, id } = await params

  // 故事類型標籤
  const typeLabels: Record<string, string> = {
    'core-stories': '核心故事',
    'one-liners': '一句話',
    'stories': '小故事',
  }

  const typeLabel = typeLabels[type] || '故事'

  return {
    title: `${typeLabel}`,
    description: `閱讀這則${typeLabel}，來自攀岩社群的真實故事`,
    openGraph: {
      title: `${typeLabel} | ${SITE_NAME}`,
      description: `閱讀這則${typeLabel}，來自攀岩社群的真實故事`,
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
