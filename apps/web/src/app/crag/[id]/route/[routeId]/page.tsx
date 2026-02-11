import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import RouteDetailClient from './RouteDetailClient'
import { fetchCragById, fetchCragRoutes, fetchCragAreas } from '@/lib/api/server-fetch'
import { assembleRouteDetailData } from '@/lib/adapters/crag-adapter'
import type { RouteDetailData } from '@/lib/crag-data'
import { SITE_URL, SITE_NAME, OG_IMAGE } from '@/lib/constants'

/**
 * 從 API 取得路線詳情資料（Server Component 用）
 */
async function getRouteData(cragId: string, routeId: string): Promise<RouteDetailData | null> {
  const [apiCrag, apiRoutes, apiAreas] = await Promise.all([
    fetchCragById(cragId),
    fetchCragRoutes(cragId),
    fetchCragAreas(cragId),
  ])

  if (!apiCrag) return null

  return assembleRouteDetailData(apiCrag, apiRoutes, apiAreas, routeId)
}

// 生成 TouristAttraction JSON-LD 結構化數據
function generateRouteJsonLd(data: RouteDetailData) {
  const { route, crag, area } = data

  return {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    '@id': `${SITE_URL}/crag/${crag.id}/route/${route.id}`,
    name: route.name,
    alternateName: route.englishName !== route.name ? route.englishName : undefined,
    description: route.description || `${route.name} 是位於${crag.name}的攀岩路線，難度 ${route.grade}`,
    url: `${SITE_URL}/crag/${crag.id}/route/${route.id}`,
    image: route.images?.[0] || `${SITE_URL}${OG_IMAGE}`,
    containedInPlace: {
      '@type': 'Place',
      '@id': `${SITE_URL}/crag/${crag.id}`,
      name: crag.name,
      address: {
        '@type': 'PostalAddress',
        addressLocality: crag.location,
        addressCountry: 'TW',
      },
    },
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: '難度',
        value: route.grade,
      },
      route.length && {
        '@type': 'PropertyValue',
        name: '長度',
        value: route.length,
      },
      {
        '@type': 'PropertyValue',
        name: '類型',
        value: route.typeEn,
      },
      route.boltCount > 0 && {
        '@type': 'PropertyValue',
        name: 'Bolt 數量',
        value: route.boltCount,
      },
      route.firstAscent && {
        '@type': 'PropertyValue',
        name: '首攀者',
        value: route.firstAscent,
      },
      area && {
        '@type': 'PropertyValue',
        name: '區域',
        value: area.name,
      },
    ].filter(Boolean),
    isAccessibleForFree: true,
    publicAccess: true,
  }
}

// 生成 BreadcrumbList JSON-LD
function generateBreadcrumbJsonLd(data: RouteDetailData) {
  const { route, crag, area } = data
  const items = [
    {
      '@type': 'ListItem',
      position: 1,
      name: '首頁',
      item: SITE_URL,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: '岩場',
      item: `${SITE_URL}/crag`,
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: crag.name,
      item: `${SITE_URL}/crag/${crag.id}`,
    },
  ]

  if (area) {
    items.push({
      '@type': 'ListItem',
      position: 4,
      name: area.name,
      item: `${SITE_URL}/crag/${crag.id}/area/${area.id}`,
    })
    items.push({
      '@type': 'ListItem',
      position: 5,
      name: route.name,
      item: `${SITE_URL}/crag/${crag.id}/route/${route.id}`,
    })
  } else {
    items.push({
      '@type': 'ListItem',
      position: 4,
      name: route.name,
      item: `${SITE_URL}/crag/${crag.id}/route/${route.id}`,
    })
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  }
}

// 動態生成 metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; routeId: string }>
}): Promise<Metadata> {
  const { id, routeId } = await params
  const data = await getRouteData(id, routeId)

  if (!data) {
    return {
      title: '找不到路線',
      description: '您要找的攀岩路線不存在',
    }
  }

  const { route, crag, area } = data
  const title = `${route.name} (${route.grade}) - ${crag.name}`
  const description =
    route.description?.substring(0, 160) ||
    `${route.name} 是位於${crag.name}${area ? `${area.name}區` : ''}的${route.typeEn}路線，難度 ${route.grade}${route.length ? `，長度 ${route.length}` : ''}。`

  const imageUrl = route.images?.[0] || `${SITE_URL}${OG_IMAGE}`

  return {
    title: `${route.name} (${route.grade})`,
    description,
    keywords: [
      route.name,
      route.englishName,
      route.grade,
      crag.name,
      crag.nameEn,
      area?.name,
      '攀岩路線',
      route.typeEn,
      '戶外攀岩',
    ].filter(Boolean) as string[],
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      type: 'website',
      url: `${SITE_URL}/crag/${id}/route/${routeId}`,
      images: [
        {
          url: imageUrl,
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
      images: [imageUrl],
    },
    alternates: {
      canonical: `${SITE_URL}/crag/${id}/route/${routeId}`,
    },
  }
}

export default async function RouteDetailPage({
  params,
}: {
  params: Promise<{ id: string; routeId: string }>
}) {
  const { id, routeId } = await params
  const data = await getRouteData(id, routeId)

  if (!data) {
    notFound()
  }

  return (
    <>
      {/* TouristAttraction JSON-LD 結構化數據 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateRouteJsonLd(data)),
        }}
      />
      {/* BreadcrumbList JSON-LD 結構化數據 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateBreadcrumbJsonLd(data)),
        }}
      />
      <RouteDetailClient data={data} />
    </>
  )
}
