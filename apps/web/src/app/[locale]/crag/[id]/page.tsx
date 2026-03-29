import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { assembleCragMetadata, type CragMetadata } from '@/lib/adapters/crag-adapter'
import { fetchCragById } from '@/lib/api/server-fetch'
import { OG_IMAGE, SITE_NAME, SITE_URL } from '@/lib/constants'
import { buildHreflangAlternates, buildOgLocale } from '@/lib/i18n-metadata'
import CragDetailClient from './CragDetailClient'

// 強制動態渲染，確保在 runtime 取得正確的 API URL
export const dynamic = 'force-dynamic'

// 根據岩場資料自動生成 FAQ
function generateCragFaqs(crag: CragMetadata) {
  const faqs: { question: string; answer: string }[] = []

  // Q1: 怎麼去
  if (crag.location) {
    const approachText = crag.approach ? `步行約需 ${crag.approach}。` : ''
    faqs.push({
      question: `${crag.name}攀岩怎麼去？`,
      answer: `${crag.name}位於${crag.location}。${approachText}${crag.parking ? `停車資訊：${crag.parking}` : ''}`,
    })
  }

  // Q2: 適合初學者嗎（解析難度範圍中的最低難度，支援 5.6、5.10a 等格式）
  if (crag.difficulty && crag.routes) {
    const lowestGradeMatch = crag.difficulty.match(/5\.(\d+)/)
    const isBeginnerFriendly = lowestGradeMatch ? parseInt(lowestGradeMatch[1], 10) <= 7 : false
    faqs.push({
      question: `${crag.name}適合攀岩初學者嗎？`,
      answer: `${crag.name}共有 ${crag.routes} 條攀岩路線，難度範圍從 ${crag.difficulty}。${isBeginnerFriendly ? '有適合初學者的簡單路線。' : '建議有基礎攀岩經驗再前往。'}`,
    })
  }

  // Q3: 最佳季節
  if (crag.seasons.length > 0) {
    faqs.push({
      question: `${crag.name}最佳攀岩季節是什麼時候？`,
      answer: `${crag.name}最適合攀岩的季節為${crag.seasons.join('、')}。建議避開雨季與極端天氣前往。`,
    })
  }

  // Q4: 岩質與類型
  if (crag.rockType) {
    faqs.push({
      question: `${crag.name}的岩質是什麼？`,
      answer: `${crag.name}的岩石類型為${crag.rockType}，攀登類型為${crag.type}。${crag.height ? `岩壁高度約 ${crag.height}。` : ''}`,
    })
  }

  // Q5: 需要什麼裝備
  faqs.push({
    question: `去${crag.name}攀岩需要帶什麼裝備？`,
    answer: `前往${crag.name}攀岩建議攜帶：攀岩鞋、安全吊帶、確保器、頭盔${crag.type.includes('傳統攀登') || crag.type.includes('mixed') ? '、岩楔與凸輪等傳統攀登裝備' : '、快扣組'}。也建議攜帶足夠的水和防曬用品。`,
  })

  return faqs
}

// 生成 FAQPage JSON-LD
function generateFaqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

// 生成 BreadcrumbList JSON-LD
function generateBreadcrumbJsonLd(crag: CragMetadata, id: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'NobodyClimb',
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
        item: `${SITE_URL}/crag/${id}`,
      },
    ],
  }
}

// 生成 VideoObject JSON-LD（即時影像）
function generateVideoJsonLd(
  crag: CragMetadata,
  id: string,
  liveVideoId: string,
  liveVideoTitle?: string,
  liveVideoDescription?: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: liveVideoTitle || `${crag.name}即時影像`,
    description: liveVideoDescription || `${crag.name}岩場周邊即時影像，可了解當地天氣狀況`,
    thumbnailUrl: `https://img.youtube.com/vi/${liveVideoId}/maxresdefault.jpg`,
    contentUrl: `https://www.youtube.com/watch?v=${liveVideoId}`,
    embedUrl: `https://www.youtube.com/embed/${liveVideoId}`,
    publication: {
      '@type': 'BroadcastEvent',
      isLiveBroadcast: true,
    },
  }
}

// 生成 Place JSON-LD 結構化數據
function generateCragJsonLd(crag: CragMetadata, id: string) {
  return {
    '@context': 'https://schema.org',
    '@type': ['Place', 'TouristAttraction', 'SportsActivityLocation'],
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
    // 地理座標 - 幫助 Google 地圖和本地搜尋
    ...(crag.latitude && crag.longitude
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: crag.latitude,
            longitude: crag.longitude,
          },
        }
      : {}),
    hasMap: crag.googleMapsUrl,
    amenityFeature: crag.amenities?.map((amenity) => ({
      '@type': 'LocationFeatureSpecification',
      name: amenity,
      value: true,
    })),
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
    sport: '攀岩',
  }
}

// 動態生成 metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; locale: string }>
}): Promise<Metadata> {
  const { id, locale } = await params
  const apiCrag = await fetchCragById(id)

  const t = await getTranslations({ locale, namespace: 'CragPage' })

  if (!apiCrag) {
    return {
      title: t('metaNotFound'),
      description: t('metaNotFoundDesc'),
    }
  }

  const crag = assembleCragMetadata(apiCrag)
  const title = `${crag.name} - ${t('metaTitleSuffix')}`
  const description =
    crag.description?.substring(0, 160) ||
    `${crag.name}攀岩岩場位於${crag.location}，提供${crag.routes}條攀岩路線，難度範圍${crag.difficulty}，岩質為${crag.rockType}。完整路線資訊、交通方式與最佳攀岩季節。`
  const ogLocale = buildOgLocale(locale)

  // Title 模板：包含關鍵資訊提升點擊率
  const pageTitle = crag.routes
    ? `${crag.name}攀岩 | ${crag.routes} 條路線・${crag.difficulty}`
    : `${crag.name}攀岩 | ${t('metaTitleSuffix')}`

  return {
    title: pageTitle,
    description,
    keywords: [
      crag.name,
      crag.englishName,
      `${crag.name}攀岩`,
      `${crag.name}攀岩路線`,
      t('metaKeyword1'),
      t('metaKeyword2'),
      crag.type,
      crag.rockType,
      crag.location,
      '台灣攀岩',
      '戶外攀岩',
    ].filter(Boolean),
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
      locale: ogLocale.locale,
      alternateLocale: ogLocale.alternateLocale,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [`${SITE_URL}${OG_IMAGE}`],
    },
    alternates: {
      canonical: `${SITE_URL}/crag/${id}`,
      languages: buildHreflangAlternates(`/crag/${id}`),
    },
  }
}

export default async function CragDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const apiCrag = await fetchCragById(id)
  const crag = apiCrag ? assembleCragMetadata(apiCrag) : null
  const faqs = crag ? generateCragFaqs(crag) : []

  return (
    <>
      {/* Place JSON-LD 結構化數據 */}
      {crag && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateCragJsonLd(crag, id)),
          }}
        />
      )}
      {/* BreadcrumbList JSON-LD */}
      {crag && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateBreadcrumbJsonLd(crag, id)),
          }}
        />
      )}
      {/* VideoObject JSON-LD（即時影像） */}
      {crag?.liveVideoId && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              generateVideoJsonLd(
                crag,
                id,
                crag.liveVideoId,
                crag.liveVideoTitle ?? undefined,
                crag.liveVideoDescription ?? undefined
              )
            ),
          }}
        />
      )}
      {/* FAQPage JSON-LD 結構化數據 */}
      {faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateFaqJsonLd(faqs)),
          }}
        />
      )}
      <CragDetailClient params={params} />
      {/* FAQ 區塊 - 頁面上可見的問答內容（Google 要求 FAQ Schema 對應的內容必須可見） */}
      {faqs.length > 0 && crag && (
        <section className="container mx-auto px-4 pb-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-6 text-xl font-medium text-[#1B1A1A]">{crag.name}常見問題</h2>
            <div className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
              {faqs.map((faq, index) => (
                <details key={index} className="group">
                  <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-medium text-[#1B1A1A] hover:bg-gray-50">
                    {faq.question}
                    <span className="ml-2 shrink-0 text-gray-400 transition-transform group-open:rotate-180">
                      ▼
                    </span>
                  </summary>
                  <p className="px-5 pb-4 text-sm leading-relaxed text-[#6D6C6C]">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
