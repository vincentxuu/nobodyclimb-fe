import { MetadataRoute } from 'next'

const SITE_URL = 'https://nobodyclimb.cc'

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

  // 動態頁面 - 部落格文章
  // TODO: 當有 API 時，可以從後端獲取所有文章 ID
  // const blogPosts = await fetch(`${API_URL}/blogs`).then(res => res.json())
  // const blogPages = blogPosts.map((post) => ({
  //   url: `${SITE_URL}/blog/${post.id}`,
  //   lastModified: new Date(post.updated_at),
  //   changeFrequency: 'weekly' as const,
  //   priority: 0.6,
  // }))

  // 動態頁面 - 岩場
  // TODO: 當有 API 時，可以從後端獲取所有岩場 ID
  // const crags = await fetch(`${API_URL}/crags`).then(res => res.json())
  // const cragPages = crags.map((crag) => ({
  //   url: `${SITE_URL}/crag/${crag.id}`,
  //   lastModified: new Date(crag.updated_at),
  //   changeFrequency: 'monthly' as const,
  //   priority: 0.6,
  // }))

  // 動態頁面 - 岩館
  // TODO: 當有 API 時，可以從後端獲取所有岩館 ID
  // const gyms = await fetch(`${API_URL}/gyms`).then(res => res.json())
  // const gymPages = gyms.map((gym) => ({
  //   url: `${SITE_URL}/gym/${gym.id}`,
  //   lastModified: new Date(gym.updated_at),
  //   changeFrequency: 'monthly' as const,
  //   priority: 0.6,
  // }))

  return [
    ...staticPages,
    // ...blogPages,
    // ...cragPages,
    // ...gymPages,
  ]
}
