/**
 * 伺服器端 API 資料取得工具
 * 用於 Server Components（metadata、layouts、sitemap 等）
 * 使用原生 fetch，不依賴瀏覽器環境的 axios client
 */

import { API_BASE_URL } from '../constants'
import type {
  ApiCrag,
  ApiArea,
  ApiRoute,
  ApiCragListResponse,
  ApiCragDetailResponse,
  ApiCragRoutesResponse,
  ApiCragAreasResponse,
} from '../types/api-crag'

/**
 * 伺服器端 fetch 封裝
 */
async function serverFetch<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      next: { revalidate: 300 }, // 5 分鐘快取
    })
    if (!response.ok) return null
    return response.json()
  } catch (error) {
    console.error(`[Server Fetch] Failed to fetch ${path}:`, error)
    return null
  }
}

/**
 * 取得所有岩場列表（自動分頁取得全部資料）
 */
export async function fetchCrags(): Promise<ApiCrag[]> {
  const allCrags: ApiCrag[] = []
  let page = 1
  const limit = 100
  let totalPages = 1

  do {
    const response = await serverFetch<ApiCragListResponse>(`/crags?page=${page}&limit=${limit}`)
    if (!response) break
    allCrags.push(...(response.data || []))
    totalPages = response.pagination?.total_pages || 1
    page++
  } while (page <= totalPages)

  return allCrags
}

/**
 * 取得岩場詳情（通過 ID）
 */
export async function fetchCragById(id: string): Promise<ApiCrag | null> {
  const response = await serverFetch<ApiCragDetailResponse>(`/crags/${id}`)
  return response?.data || null
}

/**
 * 取得岩場區域列表
 */
export async function fetchCragAreas(cragId: string): Promise<ApiArea[]> {
  const response = await serverFetch<ApiCragAreasResponse>(`/crags/${cragId}/areas`)
  return response?.data || []
}

/**
 * 取得岩場路線列表
 */
export async function fetchCragRoutes(cragId: string): Promise<ApiRoute[]> {
  const response = await serverFetch<ApiCragRoutesResponse>(`/crags/${cragId}/routes`)
  return response?.data || []
}
