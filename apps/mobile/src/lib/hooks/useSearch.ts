/**
 * useSearch Hook
 *
 * 全站搜尋的 TanStack Query hook
 * 對應後端 GET /search 端點
 */
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type { SearchResultItem, SearchType } from '@/components/search'

/**
 * 後端搜尋 type 參數對照
 * 前端 SearchType → 後端 type 參數
 */
const SEARCH_TYPE_MAP: Record<Exclude<SearchType, 'all'>, string> = {
  biography: 'posts', // biography 搜尋用 posts 類型
  crag: 'crags',
  gym: 'gyms',
  blog: 'posts',
}

interface SearchResultRaw {
  id: string
  title?: string
  name?: string
  slug?: string
  excerpt?: string
  description?: string
  cover_image?: string
  thumbnail_url?: string
  type?: string
  region?: string
  city?: string
  author_username?: string
  author_name?: string
  category?: string
}

/**
 * 將後端搜尋結果轉換為前端 SearchResultItem
 */
function toSearchResultItem(raw: SearchResultRaw, category: string): SearchResultItem {
  const typeMap: Record<string, Exclude<SearchType, 'all'>> = {
    posts: 'blog',
    crags: 'crag',
    gyms: 'gym',
    galleries: 'blog', // fallback
    videos: 'blog', // fallback
  }

  const itemType = typeMap[category] ?? 'blog'
  const title = raw.title || raw.name || ''

  let subtitle: string | undefined
  if (category === 'crags') {
    subtitle = raw.region || raw.description?.slice(0, 30)
  } else if (category === 'gyms') {
    subtitle = raw.city || raw.description?.slice(0, 30)
  } else if (category === 'posts') {
    subtitle = raw.excerpt?.slice(0, 40) || raw.author_name || raw.author_username
  } else {
    subtitle = raw.description?.slice(0, 40)
  }

  return {
    id: raw.id,
    type: itemType,
    title,
    subtitle,
    image: raw.cover_image || raw.thumbnail_url,
    slug: raw.slug,
  }
}

/**
 * 全站搜尋
 */
export function useSearch(query: string, type: SearchType = 'all') {
  return useQuery<SearchResultItem[]>({
    queryKey: ['search', query, type],
    queryFn: async () => {
      const params: Record<string, string> = { q: query }

      // 如果指定了類型，加上 type 參數
      if (type !== 'all') {
        const backendType = SEARCH_TYPE_MAP[type]
        if (backendType) {
          params.type = backendType
        }
      }

      const response = await apiClient.get('/search', { params })
      const responseData = response.data

      if (!responseData?.success) return []

      const data = responseData.data

      // 如果有指定 type，data 是陣列
      if (type !== 'all' && Array.isArray(data)) {
        const backendType = SEARCH_TYPE_MAP[type] || 'posts'
        return data.map((item: SearchResultRaw) => toSearchResultItem(item, backendType))
      }

      // 沒有指定 type，data 是 { posts, crags, gyms, galleries, videos }
      const results: SearchResultItem[] = []
      const categories = ['posts', 'crags', 'gyms', 'galleries', 'videos'] as const
      for (const cat of categories) {
        const items = (data as Record<string, SearchResultRaw[]>)?.[cat]
        if (Array.isArray(items)) {
          results.push(...items.map((item) => toSearchResultItem(item, cat)))
        }
      }

      return results
    },
    enabled: query.trim().length >= 2,
  })
}
