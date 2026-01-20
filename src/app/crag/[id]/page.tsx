import type { Metadata } from 'next'
import CragDetailClient from './CragDetailClient'
import { getCragDetailData } from '@/lib/crag-data'
import { SITE_URL, SITE_NAME, OG_IMAGE } from '@/lib/constants'

// 定義岩場詳情資料類型
interface CragDetail {
  name: string
  englishName?: string
  description?: string
  location: string
  type: string
  rockType?: string
  routes: string | number
  difficulty: string
  height?: string
  approach?: string
  parking?: string
  amenities?: string[]
  googleMapsUrl?: string
}

// 生成 Place JSON-LD 結構化數據
function generateCragJsonLd(crag: CragDetail, id: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Place',
    '@id': `${SITE_URL}/crag/${id}`,
    name: crag.name,
    alternateName: crag.englishName !== crag.name ? crag.englishName : undefined,
    description: crag.description,
    url: `${SITE_URL}/crag/${id}`,
    image: `${SITE_URL}${OG_IMAGE}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: crag.location,
      addressCountry: 'TW',
    },
    // Google Maps URL available at crag.googleMapsUrl
    hasMap: crag.googleMapsUrl,
    additionalType: 'https://schema.org/TouristAttraction',
    amenityFeature: crag.amenities?.map(amenity => ({
      '@type': 'LocationFeatureSpecification',
      name: amenity,
      value: true,
    })),
    // 自定義屬性（非標準 schema.org 但有助於理解）
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: '岩場類型',
        value: crag.type,
      },
      {
        '@type': 'PropertyValue',
        name: '岩石類型',
        value: crag.rockType,
      },
      {
        '@type': 'PropertyValue',
        name: '路線數量',
        value: crag.routes,
      },
      {
        '@type': 'PropertyValue',
        name: '難度範圍',
        value: crag.difficulty,
      },
      crag.height && {
        '@type': 'PropertyValue',
        name: '岩壁高度',
        value: crag.height,
      },
      crag.approach && {
        '@type': 'PropertyValue',
        name: '步行時間',
        value: crag.approach,
      },
    ].filter(Boolean),
    isAccessibleForFree: true,
    publicAccess: true,
  }
}

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
      title: `${title} | ${SITE_NAME}`,
      description,
      type: 'website',
      url: `${SITE_URL}/crag/${id}`,
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
      canonical: `${SITE_URL}/crag/${id}`,
    },
  }
}

export default async function CragDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const crag = getCragDetailData(id)

  return (
    <>
      {/* Place JSON-LD 結構化數據 */}
      {crag && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateCragJsonLd(crag as CragDetail, id)),
          }}
        />
      )}
      <CragDetailClient params={params} />
    </>
  )
}
