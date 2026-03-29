import { MetadataRoute } from 'next'
import { fetchCrags, fetchGyms } from '@/lib/api/server-fetch'
import { SITE_URL } from '@/lib/constants'

const locales = ['zh', 'en', 'ja'] as const

// 將單一路徑展開成三語言 URL 陣列
function expandToLocaleUrls(
  pathname: string,
  options: {
    lastModified?: Date
    changeFrequency?: MetadataRoute.Sitemap[number]['changeFrequency']
    priority?: number
  } = {}
): MetadataRoute.Sitemap {
  return locales.map((locale) => ({
    url: locale === 'zh' ? `${SITE_URL}${pathname}` : `${SITE_URL}/${locale}${pathname}`,
    lastModified: options.lastModified ?? new Date(),
    changeFrequency: options.changeFrequency,
    priority: options.priority,
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 靜態頁面（每個路徑展開為三語言）
  const staticPages: MetadataRoute.Sitemap = [
    ...expandToLocaleUrls('/', { changeFrequency: 'daily', priority: 1 }),
    ...expandToLocaleUrls('/blog', { changeFrequency: 'daily', priority: 0.9 }),
    ...expandToLocaleUrls('/crag', { changeFrequency: 'daily', priority: 0.9 }),
    ...expandToLocaleUrls('/gym', { changeFrequency: 'weekly', priority: 0.8 }),
    ...expandToLocaleUrls('/videos', { changeFrequency: 'daily', priority: 0.8 }),
    ...expandToLocaleUrls('/gallery', { changeFrequency: 'weekly', priority: 0.7 }),
    ...expandToLocaleUrls('/biography', { changeFrequency: 'weekly', priority: 0.7 }),
    ...expandToLocaleUrls('/about', { changeFrequency: 'monthly', priority: 0.5 }),
  ]

  // 動態頁面 - 岩場（從 API 取得）
  const apiCrags = await fetchCrags()
  const cragPages: MetadataRoute.Sitemap = apiCrags.flatMap((crag) =>
    expandToLocaleUrls(`/crag/${crag.id}`, {
      lastModified: crag.updated_at ? new Date(crag.updated_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    })
  )

  // 動態頁面 - 岩館（從 API 取得）
  const apiGyms = await fetchGyms()
  const gymPages: MetadataRoute.Sitemap = apiGyms.flatMap((gym) =>
    expandToLocaleUrls(`/gym/${gym.id}`, {
      lastModified: gym.updated_at ? new Date(gym.updated_at) : new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    })
  )

  return [...staticPages, ...cragPages, ...gymPages]
}
