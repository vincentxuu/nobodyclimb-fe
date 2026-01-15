import type { Metadata } from 'next'
import CragDetailClient from './CragDetailClient'
import { getCragDetailData } from '@/lib/crag-data'

const SITE_URL = 'https://nobodyclimb.cc'

// 動態生成 metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const crag = getCragDetailData(id)

  if (!crag) {
    return {
      title: '找不到岩場',
      description: '您要找的岩場不存在',
    }
  }

  const title = `${crag.name} - 戶外攀岩岩場`
  const description = crag.description?.substring(0, 160) || `${crag.name}位於${crag.location}，提供${crag.routes}條攀岩路線，難度範圍${crag.difficulty}。`

  return {
    title: crag.name,
    description,
    keywords: [crag.name, crag.englishName, '戶外攀岩', '岩場', crag.type, crag.location].filter(Boolean),
    openGraph: {
      title: `${title} | NobodyClimb`,
      description,
      type: 'website',
      url: `${SITE_URL}/crag/${id}`,
      images: [
        {
          url: `${SITE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | NobodyClimb`,
      description,
      images: [`${SITE_URL}/og-image.png`],
    },
    alternates: {
      canonical: `${SITE_URL}/crag/${id}`,
    },
  }
}

export default function CragDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <CragDetailClient params={params} />
}
