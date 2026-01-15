import type { Metadata } from 'next'
import GymDetailClient from './GymDetailClient'
import { getGymById } from '@/lib/gym-data'

const SITE_URL = 'https://nobodyclimb.cc'

// 動態生成 metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const gym = getGymById(id)

  if (!gym) {
    return {
      title: '找不到岩館',
      description: '您要找的岩館不存在',
    }
  }

  const title = `${gym.name} - ${gym.typeLabel}`
  const description = gym.description?.substring(0, 160) || `${gym.name}位於${gym.location.address}，提供${gym.typeLabel}服務。`

  return {
    title: gym.name,
    description,
    keywords: [gym.name, gym.nameEn, '攀岩館', gym.typeLabel, gym.location.city, '室內攀岩'].filter(Boolean),
    openGraph: {
      title: `${title} | NobodyClimb`,
      description,
      type: 'website',
      url: `${SITE_URL}/gym/${id}`,
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
      canonical: `${SITE_URL}/gym/${id}`,
    },
  }
}

export default function GymDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <GymDetailClient params={params} />
}
