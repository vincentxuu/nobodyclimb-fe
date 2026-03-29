/* eslint-disable no-console */
/**
 * 伺服器端 API 資料取得工具
 * 用於 Server Components（metadata、layouts、sitemap 等）
 * 使用原生 fetch，不依賴瀏覽器環境的 axios client
 */

import { API_BASE_URL as DEFAULT_API_BASE_URL } from '../constants'
import type {
  ApiArea,
  ApiCrag,
  ApiCragAreasResponse,
  ApiCragDetailResponse,
  ApiCragListResponse,
  ApiCragRouteDetailResponse,
  ApiCragRoutesResponse,
  ApiRoute,
} from '../types/api-crag'
import type { ApiGym, ApiGymDetailResponse, ApiGymListResponse } from '../types/api-gym'

/**
 * 取得 API 基礎 URL
 * 在 Cloudflare Workers runtime 中動態讀取環境變數
 * 這樣 preview 和 production 可以使用同一個 build
 *
 * 注意：NEXT_PUBLIC_* 會在 build time 被替換，所以我們使用
 * SERVER_API_URL 作為 runtime 環境變數（用於 Server Components）
 */
async function getApiBaseUrl(): Promise<string> {
  try {
    // 在 Cloudflare Workers 環境中使用 getCloudflareContext 讀取 runtime 環境變數
    const { getCloudflareContext } = await import('@opennextjs/cloudflare')
    const { env } = getCloudflareContext()
    const serverApiUrl = (env as unknown as Record<string, string | undefined>)?.SERVER_API_URL

    if (serverApiUrl) {
      return serverApiUrl
    }
  } catch (_error) {}

  return DEFAULT_API_BASE_URL
}

/**
 * 伺服器端 fetch 封裝
 * 優先使用 Cloudflare Service Binding（零網路延遲），
 * 本地開發或 binding 不存在時 fallback 到 HTTP
 */
async function serverFetch<T>(path: string): Promise<T | null> {
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare')
    const { env } = getCloudflareContext()
    const backendApi = (env as unknown as Record<string, { fetch: typeof fetch } | undefined>)
      .BACKEND_API

    if (backendApi) {
      // 走 Service Binding，完全不走公開網路
      const url = `https://internal/api/v1${path}`

      const response = await backendApi.fetch(new Request(url))

      if (!response.ok) {
        console.error('[Server Fetch] Service Binding failed:', response.status, 'for', url)
        return null
      }
      return response.json()
    }
  } catch (_error) {}

  // HTTP fallback（本地開發用）
  const apiBaseUrl = await getApiBaseUrl()
  const fullUrl = `${apiBaseUrl}${path}`

  try {
    const response = await fetch(fullUrl, {
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error('[Server Fetch] HTTP failed:', response.status, 'for', fullUrl)
      return null
    }
    return response.json()
  } catch (error) {
    console.error(`[Server Fetch] HTTP failed to fetch ${path}:`, error)
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

/**
 * 取得單一路線詳情
 */
export async function fetchCragRouteById(
  cragId: string,
  routeId: string
): Promise<ApiRoute | null> {
  const response = await serverFetch<ApiCragRouteDetailResponse>(
    `/crags/${cragId}/routes/${routeId}`
  )
  return response?.data || null
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
