import type { Metadata } from 'next'
import ProfileClient from './ProfileClient'
import { SITE_URL, SITE_NAME, OG_IMAGE, API_BASE_URL } from '@/lib/constants'

// 強制動態渲染，避免快取問題
export const dynamic = 'force-dynamic'

// 人物資料類型
interface BiographyData {
  id: string
  name: string
  avatar_url?: string | null
  bio?: string | null
  title?: string | null
  climbing_meaning?: string | null
  frequent_locations?: string | null
  climbing_style?: string[]
  climbing_start_year?: string | null
  social_links?: {
    instagram?: string
    facebook?: string
    youtube?: string
  } | null
}

// API 回應類型
interface ApiResponse {
  success: boolean
  data?: BiographyData
}

// 獲取人物資料用於 SEO
async function getBiography(id: string): Promise<BiographyData | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/biographies/${id}`, {
      cache: 'no-store',
    })
    if (!res.ok) {
      console.error(`[getBiography] API returned ${res.status} for id: ${id}`)
      return null
    }
    const data: ApiResponse = await res.json()
    if (!data.success || !data.data) {
      console.error(`[getBiography] API returned success=false for id: ${id}`)
      return null
    }
    return data.data
  } catch (error) {
    console.error(`[getBiography] Failed to fetch biography for id: ${id}`, error)
    return null
  }
}

// 生成 Person JSON-LD 結構化數據
function generatePersonJsonLd(person: BiographyData) {
  const sameAs = []
  if (person.social_links?.instagram) {
    sameAs.push(`https://instagram.com/${person.social_links.instagram}`)
  }
  if (person.social_links?.facebook) {
    sameAs.push(person.social_links.facebook)
  }
  if (person.social_links?.youtube) {
    sameAs.push(person.social_links.youtube)
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${SITE_URL}/biography/profile/${person.id}`,
    name: person.name,
    description: person.bio,
    image: person.avatar_url
      ? (person.avatar_url.startsWith('http') ? person.avatar_url : `${SITE_URL}${person.avatar_url}`)
      : `${SITE_URL}${OG_IMAGE}`,
    url: `${SITE_URL}/biography/profile/${person.id}`,
    // 地點
    homeLocation: person.frequent_locations ? {
      '@type': 'Place',
      name: person.frequent_locations,
    } : undefined,
    // 興趣/專長
    knowsAbout: person.climbing_style || ['攀岩'],
    // 社群連結
    sameAs: sameAs.length > 0 ? sameAs : undefined,
    // 成為會員的組織
    memberOf: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  }
}

// 動態生成 metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const person = await getBiography(id)

  if (!person) {
    return {
      title: '找不到人物',
      description: '您要找的人物資料不存在',
    }
  }

  const title = `${person.name} - 攀岩人物誌`
  const description = person.climbing_meaning?.substring(0, 160) || person.bio?.substring(0, 160) || `認識 ${person.name}，一位熱愛攀岩的攀岩愛好者。`
  const image = person.avatar_url
    ? (person.avatar_url.startsWith('http') ? person.avatar_url : `${SITE_URL}${person.avatar_url}`)
    : `${SITE_URL}${OG_IMAGE}`

  return {
    title: person.name,
    description,
    keywords: [person.name, '攀岩人物', '人物誌', '攀岩社群', ...(person.climbing_style || [])],
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      type: 'profile',
      url: `${SITE_URL}/biography/profile/${id}`,
      images: [
        {
          url: image,
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
      images: [image],
    },
    alternates: {
      canonical: `${SITE_URL}/biography/profile/${id}`,
    },
  }
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const person = await getBiography(id)

  return (
    <>
      {/* Person JSON-LD 結構化數據 */}
      {person && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generatePersonJsonLd(person)),
          }}
        />
      )}
      <ProfileClient params={params} />
    </>
  )
}
