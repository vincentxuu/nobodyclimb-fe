import { useQuery, useMutation } from '@tanstack/react-query'
import apiClient from './client'

// =============================================
// TypeScript 介面
// =============================================

export interface AISource {
  id: string
  type: 'route' | 'crag' | 'video'
  title: string
  excerpt: string
  url?: string
  score: number
}

export interface AIAskRequest {
  query: string
  limit?: number
  include_sources?: boolean
}

export interface AIAskResponse {
  answer: string
  sources: AISource[]
  query_id: string
}

export interface AISearchRequest {
  query: string
  type?: 'route' | 'crag' | 'video'
  limit?: number
  filters?: {
    region?: string
    grade_min?: number
    grade_max?: number
    route_type?: string
    crag_id?: string
  }
}

export interface AISearchResponse {
  results: AISource[]
  count: number
}

export interface AIFeedbackRequest {
  query_id: string
  score: 1 | 2 | 3 | 4 | 5
  text?: string
}

export interface AIHealthResponse {
  status: 'healthy' | 'unhealthy'
  ai: boolean
}

// =============================================
// API 函式
// =============================================

export async function askAI(request: AIAskRequest): Promise<AIAskResponse> {
  const response = await apiClient.post<{ success: boolean; data: AIAskResponse }>(
    '/ai/ask',
    request
  )
  return response.data.data
}

export async function searchAI(request: AISearchRequest): Promise<AISearchResponse> {
  const params = new URLSearchParams({ q: request.query })
  if (request.type) params.set('type', request.type)
  if (request.limit) params.set('limit', String(request.limit))
  if (request.filters?.region) params.set('region', request.filters.region)
  if (request.filters?.grade_min !== undefined)
    params.set('grade_min', String(request.filters.grade_min))
  if (request.filters?.grade_max !== undefined)
    params.set('grade_max', String(request.filters.grade_max))
  if (request.filters?.route_type) params.set('route_type', request.filters.route_type)
  if (request.filters?.crag_id) params.set('crag_id', request.filters.crag_id)

  const response = await apiClient.get<{ success: boolean; data: AISearchResponse }>(
    `/ai/search?${params.toString()}`
  )
  return response.data.data
}

export async function submitFeedback(request: AIFeedbackRequest): Promise<void> {
  await apiClient.post('/ai/feedback', request)
}

export async function checkAIHealth(): Promise<AIHealthResponse> {
  const response = await apiClient.get<{ success: boolean } & AIHealthResponse>('/ai/health')
  return response.data
}

// =============================================
// TanStack Query Hooks
// =============================================

export function useAskAI() {
  return useMutation({
    mutationFn: askAI,
  })
}

export function useSearchAI(request: AISearchRequest, enabled = true) {
  return useQuery({
    queryKey: ['ai-search', request],
    queryFn: () => searchAI(request),
    enabled: enabled && request.query.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 分鐘
    gcTime: 10 * 60 * 1000,
  })
}

export function useSubmitFeedback() {
  return useMutation({
    mutationFn: submitFeedback,
  })
}
