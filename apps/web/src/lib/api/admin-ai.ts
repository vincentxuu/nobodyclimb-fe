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
  user_id: string | null
  username: string | null
  display_name: string | null
  query: string
  latency_ms: number | null
  feedback_score: number | null
  created_at: string
  query_type: 'simple' | 'complex' | 'general-knowledge' | null
  groundedness_score: number | null
  auto_score: number | null
  embedding_ms: number | null
  retrieval_ms: number | null
  generation_ms: number | null
  token_count: number | null
  is_high_consumption: number | null
  cache_hit: number | null
  hyde_triggered: number | null
}

export interface AILogsResponse {
  logs: AIQueryLog[]
  total: number
  page: number
  limit: number
}

// =============================================
// AI Log Detail (structured pipeline view)
// =============================================

interface PipelineStageBase {
  service: string
  description?: string
  skipped: boolean
}

export interface AILogDetail {
  id: string
  query: string
  response: string | null
  sources: Array<{ title?: string; type?: string; score?: number }>
  user: { id: string | null; username: string | null; display_name: string | null }
  created_at: string
  latency: {
    total_ms: number | null
    embedding_ms: number | null
    retrieval_ms: number | null
    generation_ms: number | null
  }
  quality: {
    groundedness_score: number | null
    auto_score: number | null
    feedback_score: number | null
    feedback_text: string | null
    flags: Array<{ type: string; description: string }>
  }
  pipeline: {
    guardrails_input: PipelineStageBase
    cache: PipelineStageBase & { hit: boolean }
    quota_check: PipelineStageBase
    query_parsing: PipelineStageBase & { query_type: string | null }
    hyde: PipelineStageBase & { triggered: boolean }
    embedding: PipelineStageBase & { duration_ms: number | null }
    retrieval: PipelineStageBase & { duration_ms: number | null; top_score: number | null; doc_count: number | null }
    generation: PipelineStageBase & { model: string | null; duration_ms: number | null; token_count: number | null; is_high_consumption: boolean }
    self_reflection: PipelineStageBase & { triggered: boolean }
    judge: PipelineStageBase & { groundedness_score: number | null; auto_score: number | null }
    guardrails_output: PipelineStageBase
    memory_extraction: PipelineStageBase
  }
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

export async function getAILogDetail(id: string): Promise<AILogDetail> {
  const res = await apiClient.get<{ success: boolean; data: AILogDetail }>(`/admin/ai/logs/${id}`)
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
  return useQuery<AILogDetail>({
    queryKey: ['admin-ai-log', id],
    queryFn: () => getAILogDetail(id),
    enabled: !!id,
    refetchInterval: 5000,
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

// =============================================
// 用戶等級管理
// =============================================

export interface UserRankDetail {
  user_id: string
  score: number
  rank_id: string
  rank_display_name: string
  rank_override_id: string | null
  daily_ai_used: number
  daily_ai_limit: number
  last_reset_date: string
  last_score_calculated_at: string | null
  updated_at: string
  score_breakdown: {
    biography_fields: number
    biography_bucket_list: number
    biography_public: number
    core_stories: number
    one_liners: number
    stories: number
    route_ascents: number
    bucket_list_items: number
    bucket_list_completed: number
    total: number
  }
}

export type RankId = 'foothill' | 'wall' | 'ridge' | 'summit'

export async function getUserRankDetail(userId: string): Promise<UserRankDetail> {
  const res = await apiClient.get<{ success: boolean; data: UserRankDetail }>(
    `/admin/ai/users/${userId}/rank`
  )
  return res.data.data
}

export async function recalculateUserRank(userId: string): Promise<void> {
  await apiClient.post('/admin/ai/recalculate-ranks', { user_id: userId })
}

export async function overrideUserRank(userId: string, rank: RankId | null): Promise<void> {
  await apiClient.put(`/admin/ai/users/${userId}/rank-override`, { rank })
}

export function useUserRankDetail(userId: string | null) {
  return useQuery({
    queryKey: ['admin-user-rank', userId],
    queryFn: () => getUserRankDetail(userId!),
    enabled: !!userId,
    staleTime: 30 * 1000,
  })
}

export function useRecalculateRank() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: recalculateUserRank,
    onSuccess: (_data, userId) => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-rank', userId] })
    },
  })
}

export function useOverrideUserRank() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, rank }: { userId: string; rank: RankId | null }) =>
      overrideUserRank(userId, rank),
    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-rank', userId] })
    },
  })
}
