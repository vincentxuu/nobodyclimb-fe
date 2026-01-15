import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/constants'
import { getAllCrags } from '@/lib/crag-data'
import { getAllGyms } from '@/lib/gym-data'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 靜態頁面
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/crag`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/gym`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/videos`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/gallery`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/biography`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // 動態頁面 - 岩場（從本地資料）
  const crags = getAllCrags()
  const cragPages: MetadataRoute.Sitemap = crags.map((crag) => ({
    url: `${SITE_URL}/crag/${crag.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  // 動態頁面 - 岩館（從本地資料）
  const gyms = getAllGyms()
  const gymPages: MetadataRoute.Sitemap = gyms.map((gym) => ({
    url: `${SITE_URL}/gym/${gym.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  // 動態頁面 - 部落格文章
  // TODO: 當有 API 時，可以從後端獲取所有文章 ID
  // const blogPosts = await fetch(`${API_BASE_URL}/posts`).then(res => res.json())
  // const blogPages = blogPosts.data?.map((post) => ({
  //   url: `${SITE_URL}/blog/${post.id}`,
  //   lastModified: new Date(post.updated_at),
  //   changeFrequency: 'weekly' as const,
  //   priority: 0.6,
  // })) || []

  return [
    ...staticPages,
    ...cragPages,
    ...gymPages,
    // ...blogPages,
  ]
}
