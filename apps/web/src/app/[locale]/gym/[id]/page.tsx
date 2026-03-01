import type { Metadata } from 'next'
import GymDetailClient from './GymDetailClient'
import { fetchGymById } from '@/lib/api/server-fetch'
import { adaptGymToDetail } from '@/lib/adapters/gym-adapter'
import type { GymDetailData } from '@/lib/gym-data'
import { SITE_URL, SITE_NAME, OG_IMAGE } from '@/lib/constants'

// 生成 LocalBusiness JSON-LD 結構化數據
function generateGymJsonLd(gym: GymDetailData, id: string) {
  // 格式化營業時間為 schema.org 格式
  const openingHoursSpec = []
  const dayMap: Record<string, string> = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
  }

  for (const [day, hours] of Object.entries(gym.openingHours)) {
    if (hours && hours !== '公休' && hours !== '休息') {
      // 解析時間格式 "10:00-22:00"
      const timeParts = hours.split('-')
      if (timeParts.length === 2) {
        openingHoursSpec.push({
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: dayMap[day],
          opens: timeParts[0].trim(),
          closes: timeParts[1].trim(),
        })
      }
    }
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'SportsActivityLocation',
    '@id': `${SITE_URL}/gym/${id}`,
    name: gym.name,
    alternateName: gym.nameEn !== gym.name ? gym.nameEn : undefined,
    description: gym.description,
    url: `${SITE_URL}/gym/${id}`,
    image: `${SITE_URL}${OG_IMAGE}`,
    telephone: gym.contact.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: gym.location.address,
      addressLocality: gym.location.district || gym.location.city,
      addressRegion: gym.location.city,
      addressCountry: 'TW',
    },
    geo: gym.location.latitude && gym.location.longitude ? {
      '@type': 'GeoCoordinates',
      latitude: gym.location.latitude,
      longitude: gym.location.longitude,
    } : undefined,
    openingHoursSpecification: openingHoursSpec.length > 0 ? openingHoursSpec : undefined,
    priceRange: gym.pricing.singleEntry
      ? `$${gym.pricing.singleEntry.weekday}-$${gym.pricing.singleEntry.weekend}`
      : undefined,
    aggregateRating: gym.rating > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: gym.rating,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
    amenityFeature: gym.facilities.map(facility => ({
      '@type': 'LocationFeatureSpecification',
      name: facility,
      value: true,
    })),
    sameAs: [
      gym.contact.facebookUrl,
      gym.contact.instagramUrl,
      gym.contact.website,
    ].filter(Boolean),
  }
}

// 動態生成 metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const apiGym = await fetchGymById(id)
  const gym = apiGym ? adaptGymToDetail(apiGym) : null

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
      title: `${title} | ${SITE_NAME}`,
      description,
      type: 'website',
      url: `${SITE_URL}/gym/${id}`,
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
      canonical: `${SITE_URL}/gym/${id}`,
    },
  }
}

export default async function GymDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const apiGym = await fetchGymById(id)
  const gym = apiGym ? adaptGymToDetail(apiGym) : null

  return (
    <>
      {/* LocalBusiness JSON-LD 結構化數據 */}
      {gym && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateGymJsonLd(gym, id)),
          }}
        />
      )}
      <GymDetailClient params={params} />
    </>
  )
}
