import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from './client'
import type { AiQuota } from '@nobodyclimb/types'

export type { AiQuota }

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
  latestVideoUrl?: string // 路線最新影片 YouTube URL（僅 route 類型）
}

export interface AIChatHistoryMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AIAskRequest {
  query: string
  limit?: number
  include_sources?: boolean
  chat_history?: AIChatHistoryMessage[]
  no_cache?: boolean
}

export interface AIAskResponse {
  answer: string
  sources: AISource[]
  query_id: string
  suggested_questions: string[]
  quota?: AiQuota
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

export interface RecommendationPayload {
  answer: string
  sources: AISource[]
  query: string
  context_ascents: Array<{ route_name: string; grade: string; crag_name: string }>
}

export interface Recommendation {
  id: string
  triggered_by: 'ascent' | 'manual'
  status: 'success' | 'failed'
  recommendation: RecommendationPayload
  created_at: string
}

export interface RecommendationsResponse {
  data: Recommendation[]
  total: number
}

export interface ChatSession {
  id: string
  title: string
  created_at: number
  updated_at: number
}

export interface ChatMessage {
  id: string
  session_id?: string
  role: 'user' | 'assistant'
  content: string
  suggested_questions?: string[]
  query_id?: string
  created_at: number
}

export interface SaveMessageRequest {
  role: 'user' | 'assistant'
  content: string
  suggested_questions?: string[]
  query_id?: string
}

// =============================================
// API 函式
// =============================================

export interface AIStreamDoneEvent {
  query_id: string
  answer?: string
  sources: AISource[]
  suggested_questions: string[]
  quota_remaining: number
}

// SSE 串流問答：使用 fetch + ReadableStream 接收，支援 AbortController 取消
export async function askAIStream(
  request: AIAskRequest,
  onToken: (token: string) => void,
  onDone: (event: AIStreamDoneEvent) => void,
  onError: (message: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const { API_BASE_URL } = await import('../constants')
  const { getAccessToken } = await import('@nobodyclimb/api-client/web')
  const token = getAccessToken()

  const response = await fetch(`${API_BASE_URL}/ai/ask?stream=true`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(request),
    signal,
  })

  if (!response.ok || !response.body) {
    // 嘗試讀取後端回傳的錯誤訊息（如 guardrails 攔截、配額耗盡等）
    try {
      const errJson = await response.json() as { message?: string; error?: string }
      const errMsg = errJson.message ?? '抱歉，AI 服務暫時無法使用，請稍後再試。'
      onError(errMsg)
    } catch {
      onError('抱歉，AI 服務暫時無法使用，請稍後再試。')
    }
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const jsonStr = line.slice(6).trim()
        if (!jsonStr) continue
        try {
          const event = JSON.parse(jsonStr) as { type: string; token?: string } & Partial<AIStreamDoneEvent> & { message?: string }
          if (event.type === 'token' && event.token !== undefined) {
            onToken(event.token)
          } else if (event.type === 'done') {
            onDone(event as AIStreamDoneEvent)
          } else if (event.type === 'error') {
            onError(event.message ?? '抱歉，AI 服務暫時無法使用，請稍後再試。')
          }
        } catch {
          // 忽略無法解析的行
        }
      }
    }
  } catch (err) {
    // AbortError 是用戶主動取消，靜默結束；其他錯誤呼叫 onError
    if (err instanceof Error && err.name !== 'AbortError') {
      onError('⚠ 生成中斷，請重試')
    }
  } finally {
    reader.releaseLock()
  }
}

export async function askAI(request: AIAskRequest): Promise<AIAskResponse> {
  // AI 推理包含 embedding + 向量搜尋 + 多次 LLM，最多需要 60 秒
  const response = await apiClient.post<{ success: boolean; data: AIAskResponse }>(
    '/ai/ask',
    request,
    { timeout: 60000 }
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

export async function getMyQuota(): Promise<AiQuota> {
  const response = await apiClient.get<{ success: boolean; data: AiQuota }>('/ai/quota/me')
  return response.data.data
}

export function useMyQuota() {
  return useQuery({
    queryKey: ['ai-quota-me'],
    queryFn: getMyQuota,
    staleTime: 30 * 1000,
    retry: false,
  })
}

// =============================================
// Chat Session API 函式
// =============================================

export async function createChatSession(): Promise<ChatSession> {
  const response = await apiClient.post<{ success: boolean; data: ChatSession }>('/ai/sessions')
  return response.data.data
}

export async function getChatSessions(): Promise<ChatSession[]> {
  const response = await apiClient.get<{ success: boolean; data: ChatSession[] }>('/ai/sessions')
  return response.data.data
}

export async function getChatMessages(sessionId: string): Promise<ChatMessage[]> {
  const response = await apiClient.get<{ success: boolean; data: ChatMessage[] }>(
    `/ai/sessions/${sessionId}/messages`
  )
  return response.data.data
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  await apiClient.delete(`/ai/sessions/${sessionId}`)
}

export async function saveMessage(
  sessionId: string,
  message: SaveMessageRequest
): Promise<{ id: string }> {
  const response = await apiClient.post<{ success: boolean; data: { id: string } }>(
    `/ai/sessions/${sessionId}/messages`,
    message
  )
  return response.data.data
}

export function useCreateChatSession() {
  return useMutation({ mutationFn: createChatSession })
}

export function useGetChatSessions() {
  return useQuery({
    queryKey: ['chat-sessions'],
    queryFn: getChatSessions,
    staleTime: 30 * 1000,
  })
}

export function useDeleteChatSession() {
  return useMutation({ mutationFn: deleteChatSession })
}

export function useSaveMessage(sessionId: string) {
  return useMutation({
    mutationFn: (message: SaveMessageRequest) => saveMessage(sessionId, message),
  })
}

// =============================================
// Recommendations API 函式
// =============================================

export async function fetchRecommendations(params: {
  limit?: number
  offset?: number
}): Promise<RecommendationsResponse> {
  const { limit = 10, offset = 0 } = params
  const response = await apiClient.get<{ success: boolean; data: Recommendation[]; total: number }>(
    `/ai/recommendations?limit=${limit}&offset=${offset}`
  )
  return { data: response.data.data, total: response.data.total }
}

export async function triggerManualRecommendation(): Promise<Recommendation> {
  // AI 推薦包含完整 RAG pipeline，最多需要 60 秒
  const response = await apiClient.post<{ success: boolean; data: Recommendation }>(
    '/ai/recommendations',
    undefined,
    { timeout: 60000 }
  )
  return response.data.data
}

export function useRecommendations(params: { limit?: number; offset?: number } = {}) {
  return useQuery({
    queryKey: ['ai-recommendations', params],
    queryFn: () => fetchRecommendations(params),
    staleTime: 30 * 1000,
  })
}

export function useTriggerRecommendation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: triggerManualRecommendation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-recommendations'] })
    },
  })
}
