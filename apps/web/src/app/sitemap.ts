import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/constants'
import { fetchCrags, fetchGyms } from '@/lib/api/server-fetch'

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

  // 動態頁面 - 岩場（從 API 取得）
  const apiCrags = await fetchCrags()
  const cragPages: MetadataRoute.Sitemap = apiCrags.map((crag) => ({
    url: `${SITE_URL}/crag/${crag.id}`,
    lastModified: crag.updated_at ? new Date(crag.updated_at) : new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  // 動態頁面 - 岩館（從 API 取得）
  const apiGyms = await fetchGyms()
  const gymPages: MetadataRoute.Sitemap = apiGyms.map((gym) => ({
    url: `${SITE_URL}/gym/${gym.id}`,
    lastModified: gym.updated_at ? new Date(gym.updated_at) : new Date(),
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
