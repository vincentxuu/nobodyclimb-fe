import type { Metadata } from 'next'
import ProfileClient from './ProfileClient'
import { SITE_URL, SITE_NAME } from '@/lib/constants'

// 強制動態渲染，避免快取問題
export const dynamic = 'force-dynamic'

// Cloudflare KV 類型定義
interface KVNamespace {
  get(_key: string, _type: 'json'): Promise<unknown>
}

// 人物資料類型（用於 metadata，與後端 KV 快取結構一致）
interface BiographyMetadata {
  id: string
  name: string
  avatar_url?: string | null
  bio?: string | null
  title?: string | null
  climbing_meaning?: string | null
}

/**
 * 從 KV 快取獲取人物誌 metadata
 * 這是最快的方式，避免 Worker-to-Worker 522 超時問題
 */
async function getBiographyFromKV(slug: string): Promise<BiographyMetadata | null> {
  try {
    // 動態載入以避免在非 Cloudflare 環境報錯
    const { getCloudflareContext } = await import('@opennextjs/cloudflare')
    const { env } = getCloudflareContext()

    // 使用 type assertion 因為 CACHE 綁定在 wrangler.json 中定義
    const cache = (env as unknown as Record<string, KVNamespace | undefined>)?.CACHE

    if (!cache) {
      console.warn('[getBiographyFromKV] CACHE KV not available')
      return null
    }

    const cacheKey = `bio-meta:${slug}`
    const cached = await cache.get(cacheKey, 'json')

    if (cached) {
      return cached as BiographyMetadata
    }

    return null
  } catch (error) {
    // 在本地開發環境會失敗，這是正常的
    console.warn('[getBiographyFromKV] Failed to access KV:', error)
    return null
  }
}

/**
 * 獲取人物資料用於 SEO
 * 優先從 KV 讀取，失敗則 fallback 到通用標題
 */
async function getBiographyMetadata(slug: string): Promise<BiographyMetadata | null> {
  // 嘗試從 KV 快取讀取（最快）
  const kvData = await getBiographyFromKV(slug)
  if (kvData) {
    return kvData
  }

  // KV 沒有資料時，直接返回 null，使用通用標題
  // 不再嘗試 API 呼叫，因為容易 522 超時
  // 頁面內容會由 client-side ProfileClient 正確載入
  console.warn(`[getBiographyMetadata] KV cache miss for slug: ${slug}, using fallback title`)
  return null
}

// 動態生成 metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const person = await getBiographyMetadata(slug)

  if (!person) {
    // Server-side fetch 可能因 Worker-to-Worker 522 超時而失敗
    // 使用通用標題，讓 client-side 正確顯示內容
    // 只設定 title 為頁面名稱，讓 root layout 的 template 自動加上 site name
    return {
      title: '人物誌',
      description: '探索攀岩人物的故事',
    }
  }

  const title = `${person.name} - 攀岩人物誌`
  const description = person.climbing_meaning?.substring(0, 160) || person.bio?.substring(0, 160) || `認識 ${person.name}，一位熱愛攀岩的攀岩愛好者。`
  // 使用動態 OG 圖片 API，生成品牌化的人物誌預覽圖
  const image = `${SITE_URL}/api/og/biography?slug=${encodeURIComponent(slug)}`

  return {
    title: person.name,
    description,
    keywords: [person.name, '攀岩人物', '人物誌', '攀岩社群'],
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      type: 'profile',
      url: `${SITE_URL}/biography/profile/${slug}`,
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
      canonical: `${SITE_URL}/biography/profile/${slug}`,
    },
  }
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  // JSON-LD 結構化數據由 ProfileClient 在客戶端生成
  // 因為需要完整人物資料，而 KV 只存 metadata
  return <ProfileClient params={params} />
}
