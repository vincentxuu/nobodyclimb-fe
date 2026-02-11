/**
 * 伺服器端 API 資料取得工具
 * 用於 Server Components（metadata、layouts、sitemap 等）
 * 使用原生 fetch，不依賴瀏覽器環境的 axios client
 */

import { API_BASE_URL as DEFAULT_API_BASE_URL } from '../constants'
import type {
  ApiCrag,
  ApiArea,
  ApiRoute,
  ApiCragListResponse,
  ApiCragDetailResponse,
  ApiCragRoutesResponse,
  ApiCragAreasResponse,
} from '../types/api-crag'
import type {
  ApiGym,
  ApiGymListResponse,
  ApiGymDetailResponse,
} from '../types/api-gym'

/**
 * 取得 API 基礎 URL
 * 在 Cloudflare Workers runtime 中動態讀取環境變數
 * 這樣 preview 和 production 可以使用同一個 build
 *
 * 注意：NEXT_PUBLIC_* 會在 build time 被替換，所以我們使用
 * SERVER_API_URL 作為 runtime 環境變數（用於 Server Components）
 */
function getApiBaseUrl(): string {
  // 優先使用 runtime 環境變數（不帶 NEXT_PUBLIC_ 前綴）
  // 這些會在 Cloudflare Workers runtime 中正確讀取
  return process.env.SERVER_API_URL || DEFAULT_API_BASE_URL
}

/**
 * 伺服器端 fetch 封裝
 */
async function serverFetch<T>(path: string): Promise<T | null> {
  const apiBaseUrl = getApiBaseUrl()
  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
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

// ============ 岩館相關 ============

/**
 * 取得所有岩館列表（自動分頁取得全部資料）
 */
export async function fetchGyms(): Promise<ApiGym[]> {
  const allGyms: ApiGym[] = []
  let page = 1
  const limit = 100
  let totalPages = 1

  do {
    const response = await serverFetch<ApiGymListResponse>(`/gyms?page=${page}&limit=${limit}`)
    if (!response) break
    allGyms.push(...(response.data || []))
    totalPages = response.pagination?.total_pages || 1
    page++
  } while (page <= totalPages)

  return allGyms
}

/**
 * 取得岩館詳情（通過 ID）
 */
export async function fetchGymById(id: string): Promise<ApiGym | null> {
  const response = await serverFetch<ApiGymDetailResponse>(`/gyms/${id}`)
  return response?.data || null
}
