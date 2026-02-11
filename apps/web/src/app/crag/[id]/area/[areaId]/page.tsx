import type { Metadata } from 'next'
import AreaDetailClient from './AreaDetailClient'
import { fetchCragById, fetchCragAreas } from '@/lib/api/server-fetch'
import { SITE_URL, SITE_NAME, OG_IMAGE } from '@/lib/constants'

// 動態生成 metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; areaId: string }>
}): Promise<Metadata> {
  const { id, areaId } = await params

  const [apiCrag, apiAreas] = await Promise.all([
    fetchCragById(id),
    fetchCragAreas(id),
  ])

  if (!apiCrag) {
    return {
      title: '找不到岩場',
      description: '您要找的岩場不存在',
    }
  }

  const area = apiAreas.find(a => a.id === areaId)
  if (!area) {
    return {
      title: '找不到區域',
      description: '您要找的區域不存在',
    }
  }

  const title = `${area.name} - ${apiCrag.name}`
  const description = area.description
    ? area.description.substring(0, 160)
    : `${area.name}是${apiCrag.name}的攀岩區域，共有 ${area.route_count} 條路線。`

  return {
    title: area.name,
    description,
    keywords: [area.name, area.name_en, apiCrag.name, '攀岩區域', '岩場'].filter(Boolean) as string[],
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      type: 'website',
      url: `${SITE_URL}/crag/${id}/area/${areaId}`,
      images: [
        {
          url: `${SITE_URL}${OG_IMAGE}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [`${SITE_URL}${OG_IMAGE}`],
    },
    alternates: {
      canonical: `${SITE_URL}/crag/${id}/area/${areaId}`,
    },
  }
}

export default async function AreaDetailPage({
  params,
}: {
  params: Promise<{ id: string; areaId: string }>
}) {
  const { id, areaId } = await params

  return <AreaDetailClient cragId={id} areaId={areaId} />
}
