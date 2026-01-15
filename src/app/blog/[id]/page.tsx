import type { Metadata } from 'next'
import BlogDetailClient from './BlogDetailClient'

const SITE_URL = 'https://nobodyclimb.cc'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.nobodyclimb.cc/api/v1'

// 獲取文章資料用於 SEO
async function getPost(id: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/posts/${id}`, {
      next: { revalidate: 60 }, // 快取 60 秒
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.success ? data.data : null
  } catch {
    return null
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
  const image = post.cover_image || '/og-image.png'

  return {
    title,
    description,
    keywords: post.tags || [],
    authors: post.author_name ? [{ name: post.author_name }] : undefined,
    openGraph: {
      title: `${title} | NobodyClimb`,
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
      title: `${title} | NobodyClimb`,
      description,
      images: [image.startsWith('http') ? image : `${SITE_URL}${image}`],
    },
    alternates: {
      canonical: `${SITE_URL}/blog/${id}`,
    },
  }
}

export default function BlogDetailPage() {
  return <BlogDetailClient />
}
