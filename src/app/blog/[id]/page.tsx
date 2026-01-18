import type { Metadata } from 'next'
import BlogDetailClient from './BlogDetailClient'
import { SITE_URL, SITE_NAME, SITE_LOGO, OG_IMAGE, API_BASE_URL } from '@/lib/constants'

// 文章資料類型
interface PostData {
  title: string
  excerpt?: string
  content?: string
  cover_image?: string
  author_name?: string
  published_at?: string
  updated_at?: string
  tags?: string[]
}

// API 回應類型
interface ApiResponse {
  success: boolean
  data?: PostData
}

// 獲取文章資料用於 SEO
async function getPost(id: string): Promise<PostData | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/posts/${id}`, {
      next: { revalidate: 60 }, // 快取 60 秒
    })
    if (!res.ok) {
      console.error(`[getPost] API returned ${res.status} for id: ${id}`)
      return null
    }
    const data: ApiResponse = await res.json()
    if (!data.success || !data.data) {
      console.error(`[getPost] API returned success=false for id: ${id}`)
      return null
    }
    return data.data
  } catch (error) {
    console.error(`[getPost] Failed to fetch post for id: ${id}`, error)
    return null
  }
}

// 生成 Article JSON-LD 結構化數據
function generateArticleJsonLd(post: PostData, id: string) {
  const description = post.excerpt || post.content?.substring(0, 160).replace(/<[^>]*>/g, '') || ''
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
      name: post.author_name || SITE_NAME,
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
  const post = await getPost(id)

  if (!post) {
    return {
      title: '找不到文章',
      description: '您要找的文章不存在或已被刪除',
    }
  }

  const title = post.title
  const description = post.excerpt || post.content?.substring(0, 160).replace(/<[^>]*>/g, '') || ''
  const image = post.cover_image || OG_IMAGE

  return {
    title,
    description,
    keywords: post.tags || [],
    authors: post.author_name ? [{ name: post.author_name }] : undefined,
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
      publishedTime: post.published_at,
      modifiedTime: post.updated_at,
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
  const post = await getPost(id)

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
