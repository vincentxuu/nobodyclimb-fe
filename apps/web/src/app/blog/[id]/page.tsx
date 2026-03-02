import type { Metadata } from 'next'
import BlogDetailClient from './BlogDetailClient'
import { SITE_URL, SITE_NAME, SITE_LOGO, OG_IMAGE } from '@/lib/constants'

// 強制動態渲染，避免快取問題
export const dynamic = 'force-dynamic'

// Cloudflare KV 類型定義
interface KVNamespace {
  get(_key: string, _type: 'json'): Promise<unknown>
}

// 文章資料類型（用於 metadata，與後端 KV 快取結構一致）
interface PostMetadata {
  id: string
  title: string
  excerpt: string | null
  cover_image: string | null
  display_name: string | null
  username: string | null
  published_at: string | null
  updated_at: string | null
  tags: string[]
}

/**
 * 從 KV 快取獲取文章 metadata
 * 這是最快的方式，避免 Worker-to-Worker 522 超時問題
 */
async function getPostFromKV(id: string): Promise<PostMetadata | null> {
  try {
    // 動態載入以避免在非 Cloudflare 環境報錯
    const { getCloudflareContext } = await import('@opennextjs/cloudflare')
    const { env } = getCloudflareContext()

    // 使用 type assertion 因為 CACHE 綁定在 wrangler.json 中定義
    const cache = (env as unknown as Record<string, KVNamespace | undefined>)?.CACHE

    if (!cache) {
      console.warn('[getPostFromKV] CACHE KV not available')
      return null
    }

    const cacheKey = `post-meta:${id}`
    const cached = await cache.get(cacheKey, 'json')

    if (cached) {
      return cached as PostMetadata
    }

    return null
  } catch (error) {
    // 在本地開發環境會失敗，這是正常的
    console.warn('[getPostFromKV] Failed to access KV:', error)
    return null
  }
}

/**
 * 獲取文章資料用於 SEO
 * 優先從 KV 讀取，失敗則 fallback 到通用標題
 */
async function getPostMetadata(id: string): Promise<PostMetadata | null> {
  // 嘗試從 KV 快取讀取（最快）
  const kvData = await getPostFromKV(id)
  if (kvData) {
    return kvData
  }

  // KV 沒有資料時，直接返回 null，使用通用標題
  // 不再嘗試 API 呼叫，因為容易 522 超時
  // 頁面內容會由 client-side BlogDetailClient 正確載入
  console.warn(`[getPostMetadata] KV cache miss for id: ${id}, using fallback title`)
  return null
}

// 生成 Article JSON-LD 結構化數據
function generateArticleJsonLd(post: PostMetadata, id: string) {
  const description = post.excerpt || ''
  const image = post.cover_image?.startsWith('http')
    ? post.cover_image
    : `${SITE_URL}${post.cover_image || OG_IMAGE}`

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description,
    image,
    author: {
      '@type': 'Person',
      name: post.display_name || post.username || SITE_NAME,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}${SITE_LOGO}`,
      },
    },
    datePublished: post.published_at,
    dateModified: post.updated_at || post.published_at,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/blog/${id}`,
    },
    keywords: post.tags?.join(', '),
  }
}

// 動態生成 metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const post = await getPostMetadata(id)

  // Server-side fetch 可能因 Worker-to-Worker 522 超時而失敗
  // 使用通用標題，讓 client-side 正確顯示內容
  // 添加 noindex 防止搜尋引擎索引帶有通用 metadata 的頁面
  if (!post) {
    return {
      title: '部落格文章',
      description: '攀岩技術教學、心得分享、裝備評測、比賽資訊等攀岩相關文章。',
      robots: { index: false, follow: false },
    }
  }

  const title = post.title
  const description = post.excerpt || `${title} - 攀岩相關文章`
  const image = post.cover_image || OG_IMAGE
  const authorName = post.display_name || post.username

  return {
    title,
    description,
    keywords: post.tags || [],
    authors: authorName ? [{ name: authorName }] : undefined,
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      type: 'article',
      url: `${SITE_URL}/blog/${id}`,
      images: [
        {
          url: image.startsWith('http') ? image : `${SITE_URL}${image}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      publishedTime: post.published_at || undefined,
      modifiedTime: post.updated_at || undefined,
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [image.startsWith('http') ? image : `${SITE_URL}${image}`],
    },
    alternates: {
      canonical: `${SITE_URL}/blog/${id}`,
    },
  }
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const post = await getPostMetadata(id)

  return (
    <>
      {/* Article JSON-LD 結構化數據 */}
      {post && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateArticleJsonLd(post, id)),
          }}
        />
      )}
      <BlogDetailClient />
    </>
  )
}
