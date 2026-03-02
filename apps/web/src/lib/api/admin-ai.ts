import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from './client'

// =============================================
// 型別定義
// =============================================

export interface AIDashboardData {
  total_queries: number
  queries_today: number
  avg_latency_ms: number | null
  success_rate: number | null
  total_tokens: number
  tokens_today: number
  queries_weekly: { day: string; count: number }[]
  tokens_weekly: { day: string; tokens: number }[]
  top_queries: { query: string; count: number }[]
  health: { status: 'healthy' | 'unhealthy' | 'unknown' }
}

export interface AIQueryLog {
  id: string
  query: string
  response?: string
  sources?: string
  latency_ms: number | null
  feedback_score: number | null
  created_at: string
}

export interface AILogsResponse {
  logs: AIQueryLog[]
  total: number
  page: number
  limit: number
}

export interface AIKnowledgeSource {
  type: 'route' | 'crag'
  label: string
  total: number
  indexed: number
  last_indexed_at: string | null
}

export interface AIPrompt {
  id: string
  name: string
  version: number
  content?: string
  variables?: string
  status: 'draft' | 'active' | 'archived'
  created_at: string
  updated_at: string
}

// =============================================
// API 函式
// =============================================

export async function getAIDashboard(): Promise<AIDashboardData> {
  const res = await apiClient.get<{ success: boolean; data: AIDashboardData }>('/admin/ai/dashboard')
  return res.data.data
}

export async function getAILogs(params: {
  page?: number
  limit?: number
  from?: string
  to?: string
  feedback_min?: number
  feedback_max?: number
}): Promise<AILogsResponse> {
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))
  if (params.from) query.set('from', params.from)
  if (params.to) query.set('to', params.to)
  if (params.feedback_min !== undefined) query.set('feedback_min', String(params.feedback_min))
  if (params.feedback_max !== undefined) query.set('feedback_max', String(params.feedback_max))
  const res = await apiClient.get<{ success: boolean; data: AILogsResponse }>(
    `/admin/ai/logs?${query.toString()}`
  )
  return res.data.data
}

export async function getAILogDetail(id: string): Promise<AIQueryLog> {
  const res = await apiClient.get<{ success: boolean; data: AIQueryLog }>(`/admin/ai/logs/${id}`)
  return res.data.data
}

export async function getAIKnowledge(): Promise<{ sources: AIKnowledgeSource[] }> {
  const res = await apiClient.get<{ success: boolean; data: { sources: AIKnowledgeSource[] } }>(
    '/admin/ai/knowledge'
  )
  return res.data.data
}

export async function getAIPrompts(): Promise<AIPrompt[]> {
  const res = await apiClient.get<{ success: boolean; data: AIPrompt[] }>('/admin/ai/prompts')
  return res.data.data
}

export async function getAIPrompt(id: string): Promise<AIPrompt> {
  const res = await apiClient.get<{ success: boolean; data: AIPrompt }>(`/admin/ai/prompts/${id}`)
  return res.data.data
}

export async function createAIPrompt(data: {
  name: string
  content: string
  variables?: string[]
  status?: 'draft' | 'active' | 'archived'
}): Promise<{ id: string }> {
  const res = await apiClient.post<{ success: boolean; data: { id: string } }>(
    '/admin/ai/prompts',
    data
  )
  return res.data.data
}

export async function updateAIPrompt(
  id: string,
  data: { content?: string; variables?: string[]; status?: 'draft' | 'active' | 'archived' }
): Promise<void> {
  await apiClient.put(`/admin/ai/prompts/${id}`, data)
}

export async function deleteAIPrompt(id: string): Promise<void> {
  await apiClient.delete(`/admin/ai/prompts/${id}`)
}

export async function getAIConfig(): Promise<Record<string, string>> {
  const res = await apiClient.get<{ success: boolean; data: Record<string, string> }>(
    '/admin/ai/config'
  )
  return res.data.data
}

export async function updateAIConfig(config: Record<string, string>): Promise<void> {
  await apiClient.put('/admin/ai/config', config)
}

// =============================================
// TanStack Query Hooks
// =============================================

export function useAIDashboard() {
  return useQuery({
    queryKey: ['admin-ai-dashboard'],
    queryFn: getAIDashboard,
    staleTime: 60 * 1000,
  })
}

export function useAILogs(params: Parameters<typeof getAILogs>[0]) {
  return useQuery({
    queryKey: ['admin-ai-logs', params],
    queryFn: () => getAILogs(params),
    staleTime: 30 * 1000,
  })
}

export function useAILogDetail(id: string) {
  return useQuery({
    queryKey: ['admin-ai-log', id],
    queryFn: () => getAILogDetail(id),
    enabled: !!id,
  })
}

export function useAIKnowledge() {
  return useQuery({
    queryKey: ['admin-ai-knowledge'],
    queryFn: getAIKnowledge,
    staleTime: 60 * 1000,
  })
}

export function useAIPrompts() {
  return useQuery({
    queryKey: ['admin-ai-prompts'],
    queryFn: getAIPrompts,
    staleTime: 60 * 1000,
  })
}

export function useAIPrompt(id: string) {
  return useQuery({
    queryKey: ['admin-ai-prompt', id],
    queryFn: () => getAIPrompt(id),
    enabled: !!id,
  })
}

export function useUpdateAIPrompt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateAIPrompt>[1] }) =>
      updateAIPrompt(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-prompts'] })
    },
  })
}

export function useDeleteAIPrompt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteAIPrompt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-prompts'] })
    },
  })
}

export function useAIConfig() {
  return useQuery({
    queryKey: ['admin-ai-config'],
    queryFn: getAIConfig,
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateAIConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateAIConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-config'] })
    },
  })
}
