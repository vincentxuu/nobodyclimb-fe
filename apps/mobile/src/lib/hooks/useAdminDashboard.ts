import type { ApiResponse } from '@nobodyclimb/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export interface SiteStats {
  crags: number
  routes: number
  biographies: number
  videos: number
  posts: number
  gyms: number
  updatedAt: string
}

export interface AdminNotificationStats {
  period: string
  overview: {
    total: number
    unread: number
    usersWithNotifications: number
  }
  byType: Array<{ type: string; count: number }>
  hourlyTrend: Array<{ hour: string; count: number }>
  topRecipients: Array<{
    user_id: string
    username: string
    display_name: string | null
    notification_count: number
  }>
}

export interface AdminUser {
  id: string
  email: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  role: 'user' | 'admin' | 'moderator'
  is_active: number
  email_verified: number
  auth_provider: 'local' | 'google'
  created_at: string
  updated_at: string
  last_active_at: string | null
  rank_id: string | null
  rank_score: number | null
}

export interface AdminUserStats {
  total: number
  active: number
  inactive: number
  newThisWeek: number
  newThisMonth: number
  byRole: Array<{ role: string; count: number }>
  byAuthProvider: Array<{ auth_provider: string; count: number }>
}

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

export interface AdminUsersOptions {
  page?: number
  limit?: number
  search?: string
  role?: string
  status?: string
  sort?: 'created_at' | 'last_active_at'
  activity?: 'recent_7d' | 'recent_30d' | 'inactive_30d'
}

export interface AdminCrag {
  id: string
  name: string
  slug: string
  description: string | null
  location: string | null
  region: string | null
  latitude: number | null
  longitude: number | null
  altitude: number | null
  rock_type: string | null
  climbing_types: string[] | null
  difficulty_range: string | null
  route_count: number
  bolt_count: number
  cover_image: string | null
  images: string[] | null
  is_featured: number
  access_info: string | null
  parking_info: string | null
  approach_time: number | null
  best_seasons: string[] | null
  restrictions: string | null
  rating_avg: number
  review_count: number
  created_at: string
  updated_at: string
}

export interface AdminCragStats {
  total_crags: number
  total_routes: number
  total_bolts: number
  featured_count: number
  new_this_month: number
  regions: Array<{ region: string; count: number }>
}

export interface AdminCragsOptions {
  page?: number
  limit?: number
  search?: string
  region?: string
}

export interface AdminCragPayload {
  name: string
  slug?: string
  description?: string | null
  location?: string | null
  region?: string | null
  latitude?: number | null
  longitude?: number | null
  altitude?: number | null
  rock_type?: string | null
  climbing_types?: string[]
  difficulty_range?: string | null
  is_featured?: number
  access_info?: string | null
  parking_info?: string | null
  approach_time?: number | null
  best_seasons?: string[]
  restrictions?: string | null
}

export interface AdminArea {
  id: string
  crag_id: string
  name: string
  name_en: string | null
  slug: string | null
  description: string | null
  description_en: string | null
  image: string | null
  bolt_count: number
  route_count: number
  sort_order: number
  created_at: string
  updated_at: string
}

export interface AdminSector {
  id: string
  area_id: string
  name: string
  name_en: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface AdminRoute {
  id: string
  crag_id: string
  area_id: string | null
  sector_id: string | null
  name: string
  grade: string | null
  grade_system: string
  height: number | null
  bolt_count: number | null
  route_type: 'sport' | 'trad' | 'boulder' | 'mixed'
  description: string | null
  first_ascent: string | null
  created_at: string
}

export interface AdminAreaPayload {
  name: string
  name_en?: string | null
  description?: string | null
}

export interface AdminSectorPayload {
  name: string
  name_en?: string | null
}

export interface AdminRoutePayload {
  name: string
  grade?: string | null
  grade_system?: string
  height?: number | null
  bolt_count?: number | null
  route_type?: 'sport' | 'trad' | 'boulder' | 'mixed'
  description?: string | null
  first_ascent?: string | null
  area_id?: string | null
  sector_id?: string | null
}

export interface RouteVideoItem {
  id: string
  title: string
  youtubeId: string | null
  thumbnailUrl: string | null
  duration: number | null
  channel: string | null
  channelId: string | null
  publishedAt: string | null
  viewCount?: number | null
  sortOrder?: number
}

export interface RouteVideoPayload {
  youtubeId: string
  title?: string
  channel?: string
  channelId?: string
  thumbnailUrl?: string
  duration?: number
  publishedAt?: string
  viewCount?: number
  sortOrder?: number
}

export interface BatchImportResult {
  imported: number
  skipped: number
  errors: string[]
}

export interface AdminGym {
  id: string
  name: string
  slug: string
  description: string | null
  address: string | null
  city: string | null
  region: string | null
  latitude: number | null
  longitude: number | null
  phone: string | null
  email: string | null
  website: string | null
  cover_image: string | null
  is_featured: number
  opening_hours: Record<string, string> | null
  facilities: string[] | null
  price_info: Record<string, unknown> | null
  rating_avg: number
  review_count: number
  created_at: string
  updated_at: string
}

export interface AdminGymsOptions {
  page?: number
  limit?: number
  search?: string
  city?: string
}

export interface AdminGymPayload {
  name: string
  description?: string | null
  address?: string | null
  city?: string | null
  region?: string | null
  latitude?: number | null
  longitude?: number | null
  phone?: string | null
  email?: string | null
  website?: string | null
  is_featured?: number
  facilities?: string[]
  opening_hours?: Record<string, string> | null
  price_info?: Record<string, unknown> | null
}

export interface BroadcastRecord {
  id: string
  title: string
  message: string
  actor_id: string
  actor_name: string
  created_at: string
  recipient_count: number
  read_count: number
}

export type BroadcastTargetRole = 'all' | 'user' | 'moderator' | 'admin'

export interface BroadcastPayload {
  title: string
  message: string
  targetRole?: BroadcastTargetRole
}

export interface AIDashboardData {
  total_queries: number
  queries_today: number
  avg_latency_ms: number | null
  success_rate: number | null
  total_tokens: number
  tokens_today: number
  queries_weekly: Array<{ day: string; count: number }>
  tokens_weekly: Array<{ day: string; tokens: number }>
  top_queries: Array<{ query: string; count: number }>
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
  query_type:
    | 'simple'
    | 'complex'
    | 'general-knowledge'
    | 'guardrails_blocked'
    | 'pipeline_timeout'
    | 'circuit_breaker_rejected'
    | null
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
    flags: Array<{ type: string; is_reviewed: boolean; created_at: string }>
  }
  pipeline: Record<
    string,
    {
      service?: string
      description?: string
      skipped?: boolean
      [key: string]: unknown
    }
  >
  pipeline_trace?: {
    token_breakdown?: {
      total?: {
        prompt_tokens: number
        completion_tokens: number
        total_tokens: number
        cost_usd?: number
        cost_twd?: number
      }
      by_stage?: Record<
        string,
        {
          prompt_tokens: number
          completion_tokens: number
          total_tokens: number
          model?: string
          estimated?: boolean
        }
      >
    }
    [key: string]: unknown
  } | null
}

export interface AILogsOptions {
  page?: number
  limit?: number
  from?: string
  to?: string
  feedback_min?: number
  feedback_max?: number
  query_type?: string
  search?: string
  user_id?: string
}

export interface AIStats {
  total_queries: number
  total_tokens: number
  cache_hits: number
  avg_tokens: number
  total_prompt_tokens: number
  total_completion_tokens: number
  trace_count: number
  by_type: { simple: number; complex: number; general: number; blocked: number }
  successful_queries?: number
  failed_queries?: number
  avg_latency_ms?: number | null
  total_cost_usd?: number
  total_cost_twd?: number
}

export interface AIAskRequest {
  query: string
  limit?: number
  include_sources?: boolean
  no_cache?: boolean
}

export interface AIAskResponse {
  answer: string
  sources: Array<{ id: string; type: string; title: string; excerpt?: string; score?: number }>
  query_id: string | null
  suggested_questions: string[]
  clarification_needed?: boolean
  clarification_options?: string[]
  query_route?: string
}

export interface CostProvider {
  id: string
  name: string
  input_per_1m: number
  output_per_1m: number
}

export const DEFAULT_COST_PROVIDERS: CostProvider[] = [
  {
    id: 'cf-gemma-3-12b',
    name: 'Cloudflare Gemma 3 12B',
    input_per_1m: 0.345,
    output_per_1m: 0.556,
  },
  { id: 'openai-gpt-5-4', name: 'OpenAI GPT-5.4', input_per_1m: 2.5, output_per_1m: 15 },
  { id: 'openai-gpt-5', name: 'OpenAI GPT-5', input_per_1m: 1.25, output_per_1m: 10 },
  { id: 'openai-gpt-5-mini', name: 'OpenAI GPT-5 mini', input_per_1m: 0.25, output_per_1m: 2 },
  { id: 'openai-gpt-5-nano', name: 'OpenAI GPT-5 nano', input_per_1m: 0.05, output_per_1m: 0.4 },
  { id: 'google-gemini-31-pro', name: 'Google Gemini 3.1 Pro', input_per_1m: 2, output_per_1m: 12 },
  {
    id: 'google-gemini-3-flash',
    name: 'Google Gemini 3 Flash',
    input_per_1m: 0.5,
    output_per_1m: 3,
  },
  {
    id: 'anthropic-claude-sonnet-45',
    name: 'Anthropic Claude Sonnet 4.5',
    input_per_1m: 3,
    output_per_1m: 15,
  },
  {
    id: 'anthropic-claude-haiku-45',
    name: 'Anthropic Claude Haiku 4.5',
    input_per_1m: 1,
    output_per_1m: 5,
  },
]

export interface PipelineStepInfo {
  id: string
  name: string
  description: string
  phase: 'pre-retrieval' | 'retrieval' | 'post-retrieval' | 'generation' | 'evaluation'
  enabled: boolean
  order: number
  requires: string[]
  provides: string[]
  skipWhen: Array<{ field: string; operator: string; value: unknown }>
}

export interface PipelineStepUpdate {
  id: string
  enabled: boolean
  order: number
}

export interface MetricsDailyLatency {
  embedding_p50: number | null
  embedding_p95: number | null
  retrieval_p50: number | null
  retrieval_p95: number | null
  generation_p50: number | null
  generation_p95: number | null
  total_p50: number | null
  total_p95: number | null
}

export interface MetricsDailyQuality {
  avg_groundedness: number | null
  avg_auto_score: number | null
  avg_feedback_score: number | null
}

export interface MetricsDailyCache {
  hit_rate: number
  kv_hits: number
  semantic_hits: number
  misses: number
}

export interface MetricsDaily {
  date: string
  query_count: number
  latency: MetricsDailyLatency
  quality: MetricsDailyQuality
  cache: MetricsDailyCache
  query_types: Record<string, number>
  anomalies: string[]
}

export interface MetricsResponse {
  range: MetricsRange
  daily: MetricsDaily[]
  summary: {
    total_queries: number
    avg_latency_ms: number | null
    avg_groundedness: number | null
    cache_hit_rate: number | null
  }
}

export type MetricsRange = '7d' | '30d' | '90d'

export interface AIKnowledgeSource {
  type: 'route' | 'crag'
  label: string
  total: number
  indexed: number
  last_indexed_at: string | null
}

export interface AIIndexPayload {
  type: 'route' | 'crag'
  offset?: number
  limit?: number
}

export interface AIIndexResult {
  indexed: number
  failed: number
  hasMore: boolean
  nextOffset: number
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

export interface AIPromptDefault {
  name: string
  label: string
  content: string
  variables: string[]
}

export interface AIPromptPayload {
  name: string
  content: string
  variables?: string[]
  status?: 'draft' | 'active' | 'archived'
}

export interface AccessLogEntry {
  timestamp: string
  method: string
  path: string
  userAgent: string
  country: string
  userId: string
  ip: string
  statusCode: string
  errorMessage: string
  responseTime: number
  statusCodeNum: number
}

export interface AccessLogSummary {
  summary: {
    totalRequests: number
    avgResponseTime: number
    successCount: number
    clientErrorCount: number
    serverErrorCount: number
  }
  topPaths: Array<{ path: string; count: number; avgResponseTime: number }>
  hourlyRequests: Array<{ hour: string; count: number }>
  countryDistribution: Array<{ country: string; count: number }>
  methodDistribution: Array<{ method: string; count: number }>
}

export interface AccessLogError {
  timestamp: string
  method: string
  path: string
  userId: string
  ip: string
  statusCode: string
  errorMessage: string
  responseTime: number
}

export interface AccessLogSlow {
  timestamp: string
  method: string
  path: string
  userId: string
  statusCode: string
  responseTime: number
}

export interface FollowAnalytics {
  summary: {
    totalFollows: number
    uniqueFollowers: number
    uniqueFollowing: number
    mutualFollows: number
    followsToday: number
    followsWeek: number
    followsMonth: number
  }
  dailyTrend: Array<{ date: string; count: number }>
  topFollowed: Array<{
    id: string
    username: string
    display_name: string | null
    avatar: string | null
    biography_id: string
    follower_count: number
  }>
  topFollowers: Array<{
    id: string
    username: string
    display_name: string | null
    avatar: string | null
    following_count: number
  }>
}

export interface ActivityAnalytics {
  summary: {
    dau: number
    wau: number
    mau: number
    totalUsers: number
    activeUsers: number
    newUsersToday: number
    newUsersWeek: number
    newUsersMonth: number
    retentionRate: number
  }
  dailyActiveUsers: Array<{ date: string; count: number }>
  dailyNewUsers: Array<{ date: string; count: number }>
  activityBreakdown: {
    postsWeek: number
    goalsWeek: number
    likesWeek: number
    commentsWeek: number
    followsWeek: number
  }
}

export interface ContentAnalytics {
  summary: {
    totalPosts: number
    publishedPosts: number
    draftPosts: number
    postsWeek: number
    totalBiographies: number
    publicBiographies: number
    biographiesWeek: number
    totalVideos: number
    totalViews: number
    totalLikes: number
  }
  dailyPosts: Array<{ date: string; count: number }>
  dailyBiographies: Array<{ date: string; count: number }>
  topBiographies: Array<{
    id: string
    username: string
    display_name: string | null
    avatar: string | null
    total_views: number
    total_likes: number
    follower_count: number
  }>
  topPosts: Array<{
    id: string
    title: string
    slug: string
    author_name: string
    views: number
    created_at: string
  }>
  categoryDistribution: Array<{ category: string; count: number }>
}

export function useAdminSiteStats() {
  return useQuery({
    queryKey: ['admin-site-stats'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<SiteStats> & { cached?: boolean }>('/stats')
      return response.data.data
    },
    staleTime: 60 * 1000,
  })
}

export function useAdminNotificationStats() {
  return useQuery({
    queryKey: ['admin-notification-stats'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<AdminNotificationStats>>(
        '/notifications/admin/stats'
      )
      return response.data.data
    },
    staleTime: 60 * 1000,
  })
}

export function useAdminUsers(options: AdminUsersOptions) {
  return useQuery({
    queryKey: ['admin-users', options],
    queryFn: async () => {
      const response = await apiClient.get<
        ApiResponse<AdminUser[]> & {
          pagination: { page: number; limit: number; total: number; total_pages: number }
        }
      >('/users/admin/list', { params: options })
      return {
        users: response.data.data ?? [],
        pagination: response.data.pagination,
      }
    },
    staleTime: 30 * 1000,
  })
}

export function useAdminUserStats() {
  return useQuery({
    queryKey: ['admin-user-stats'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<AdminUserStats>>('/users/admin/stats')
      return response.data.data
    },
    staleTime: 60 * 1000,
  })
}

export function useUpdateAdminUserStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await apiClient.put<ApiResponse<{ id: string; is_active: number }>>(
        `/users/admin/${id}/status`,
        { is_active: isActive }
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] })
    },
  })
}

export function useUpdateAdminUserRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: 'user' | 'admin' | 'moderator' }) => {
      const response = await apiClient.put<ApiResponse<{ id: string; role: string }>>(
        `/users/admin/${id}/role`,
        { role }
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] })
    },
  })
}

export function useAdminUserRankDetail(userId: string | null) {
  return useQuery({
    queryKey: ['admin-user-rank', userId],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<UserRankDetail>>(
        `/admin/ai/users/${userId}/rank`
      )
      return response.data.data
    },
    enabled: Boolean(userId),
    staleTime: 30 * 1000,
  })
}

export function useRecalculateAdminUserRank() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      await apiClient.post('/admin/ai/recalculate-ranks', { user_id: userId })
    },
    onSuccess: (_data, userId) => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-rank', userId] })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })
}

export function useOverrideAdminUserRank() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, rank }: { userId: string; rank: RankId | null }) => {
      await apiClient.put(`/admin/ai/users/${userId}/rank-override`, { rank })
    },
    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-rank', userId] })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })
}

export function useAdminCrags(options: AdminCragsOptions) {
  return useQuery({
    queryKey: ['admin-crags', options],
    queryFn: async () => {
      const response = await apiClient.get<
        ApiResponse<AdminCrag[]> & {
          pagination: { page: number; limit: number; total: number; total_pages: number }
        }
      >('/admin/crags', { params: options })
      return {
        crags: response.data.data ?? [],
        pagination: response.data.pagination,
      }
    },
    staleTime: 30 * 1000,
  })
}

export function useAdminCragStats() {
  return useQuery({
    queryKey: ['admin-crag-stats'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<AdminCragStats>>('/admin/crags/stats')
      return response.data.data
    },
    staleTime: 60 * 1000,
  })
}

export function useUpdateAdminCragCounts() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post<
        ApiResponse<{ route_count: number; bolt_count: number }>
      >(`/admin/crags/${id}/update-counts`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-crags'] })
      queryClient.invalidateQueries({ queryKey: ['admin-crag-stats'] })
    },
  })
}

export function useCreateAdminCrag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: AdminCragPayload) => {
      const response = await apiClient.post<ApiResponse<AdminCrag>>('/crags', payload)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-crags'] })
      queryClient.invalidateQueries({ queryKey: ['admin-crag-stats'] })
      queryClient.invalidateQueries({ queryKey: ['admin-site-stats'] })
    },
  })
}

export function useUpdateAdminCrag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: AdminCragPayload }) => {
      const response = await apiClient.put<ApiResponse<AdminCrag>>(`/crags/${id}`, payload)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-crags'] })
      queryClient.invalidateQueries({ queryKey: ['admin-crag-stats'] })
      queryClient.invalidateQueries({ queryKey: ['admin-site-stats'] })
    },
  })
}

export function useDeleteAdminCrag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete<ApiResponse<{ message: string }>>(`/crags/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-crags'] })
      queryClient.invalidateQueries({ queryKey: ['admin-crag-stats'] })
      queryClient.invalidateQueries({ queryKey: ['admin-site-stats'] })
    },
  })
}

export function useBatchImportAdminCrags() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      crags,
      skipExisting,
    }: {
      crags: Partial<AdminCragPayload>[]
      skipExisting: boolean
    }) => {
      const response = await apiClient.post<ApiResponse<BatchImportResult>>(
        '/admin/crags/batch-import',
        { crags, skipExisting }
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-crags'] })
      queryClient.invalidateQueries({ queryKey: ['admin-crag-stats'] })
      queryClient.invalidateQueries({ queryKey: ['admin-site-stats'] })
    },
  })
}

export function useAdminAreas(cragId: string) {
  return useQuery({
    queryKey: ['admin-crag-areas', cragId],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<AdminArea[]>>(`/admin/crags/${cragId}/areas`)
      return response.data.data ?? []
    },
    enabled: Boolean(cragId),
    staleTime: 30 * 1000,
  })
}

export function useAdminSectors(cragId: string, areaId: string) {
  return useQuery({
    queryKey: ['admin-crag-sectors', cragId, areaId],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<AdminSector[]>>(
        `/admin/crags/${cragId}/areas/${areaId}/sectors`
      )
      return response.data.data ?? []
    },
    enabled: Boolean(cragId && areaId),
    staleTime: 30 * 1000,
  })
}

export function useAdminRoutes(
  cragId: string,
  options: { area_id?: string; sector_id?: string; page?: number; limit?: number }
) {
  return useQuery({
    queryKey: ['admin-crag-routes', cragId, options],
    queryFn: async () => {
      const response = await apiClient.get<
        ApiResponse<AdminRoute[]> & {
          pagination?: { page: number; limit: number; total: number; total_pages: number }
        }
      >(`/admin/crags/${cragId}/routes`, { params: options })
      return {
        routes: response.data.data ?? [],
        pagination: response.data.pagination,
      }
    },
    enabled: Boolean(cragId),
    staleTime: 30 * 1000,
  })
}

export function useCreateAdminArea() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ cragId, payload }: { cragId: string; payload: AdminAreaPayload }) => {
      const response = await apiClient.post<ApiResponse<AdminArea>>(
        `/admin/crags/${cragId}/areas`,
        payload
      )
      return response.data.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-crag-areas', variables.cragId] })
      queryClient.invalidateQueries({ queryKey: ['admin-crags'] })
      queryClient.invalidateQueries({ queryKey: ['admin-crag-stats'] })
    },
  })
}

export function useUpdateAdminArea() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      cragId,
      areaId,
      payload,
    }: {
      cragId: string
      areaId: string
      payload: AdminAreaPayload
    }) => {
      const response = await apiClient.put<ApiResponse<AdminArea>>(
        `/admin/crags/${cragId}/areas/${areaId}`,
        payload
      )
      return response.data.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-crag-areas', variables.cragId] })
    },
  })
}

export function useDeleteAdminArea() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ cragId, areaId }: { cragId: string; areaId: string }) => {
      const response = await apiClient.delete<ApiResponse<{ message: string }>>(
        `/admin/crags/${cragId}/areas/${areaId}`
      )
      return response.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-crag-areas', variables.cragId] })
      queryClient.invalidateQueries({ queryKey: ['admin-crags'] })
      queryClient.invalidateQueries({ queryKey: ['admin-crag-stats'] })
    },
  })
}

export function useCreateAdminSector() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      cragId,
      areaId,
      payload,
    }: {
      cragId: string
      areaId: string
      payload: AdminSectorPayload
    }) => {
      const response = await apiClient.post<ApiResponse<AdminSector>>(
        `/admin/crags/${cragId}/areas/${areaId}/sectors`,
        payload
      )
      return response.data.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['admin-crag-sectors', variables.cragId, variables.areaId],
      })
    },
  })
}

export function useUpdateAdminSector() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      cragId,
      areaId,
      sectorId,
      payload,
    }: {
      cragId: string
      areaId: string
      sectorId: string
      payload: AdminSectorPayload
    }) => {
      const response = await apiClient.put<ApiResponse<AdminSector>>(
        `/admin/crags/${cragId}/areas/${areaId}/sectors/${sectorId}`,
        payload
      )
      return response.data.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['admin-crag-sectors', variables.cragId, variables.areaId],
      })
    },
  })
}

export function useDeleteAdminSector() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      cragId,
      areaId,
      sectorId,
    }: {
      cragId: string
      areaId: string
      sectorId: string
    }) => {
      const response = await apiClient.delete<ApiResponse<{ message: string }>>(
        `/admin/crags/${cragId}/areas/${areaId}/sectors/${sectorId}`
      )
      return response.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['admin-crag-sectors', variables.cragId, variables.areaId],
      })
      queryClient.invalidateQueries({ queryKey: ['admin-crag-routes'] })
    },
  })
}

export function useCreateAdminRoute() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ cragId, payload }: { cragId: string; payload: AdminRoutePayload }) => {
      const response = await apiClient.post<ApiResponse<AdminRoute>>(
        `/admin/crags/${cragId}/routes`,
        payload
      )
      return response.data.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-crag-routes', variables.cragId] })
      queryClient.invalidateQueries({ queryKey: ['admin-crags'] })
      queryClient.invalidateQueries({ queryKey: ['admin-crag-stats'] })
    },
  })
}

export function useUpdateAdminRoute() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      cragId,
      routeId,
      payload,
    }: {
      cragId: string
      routeId: string
      payload: AdminRoutePayload
    }) => {
      const response = await apiClient.put<ApiResponse<AdminRoute>>(
        `/admin/crags/${cragId}/routes/${routeId}`,
        payload
      )
      return response.data.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-crag-routes', variables.cragId] })
    },
  })
}

export function useDeleteAdminRoute() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ cragId, routeId }: { cragId: string; routeId: string }) => {
      const response = await apiClient.delete<ApiResponse<{ message: string }>>(
        `/admin/crags/${cragId}/routes/${routeId}`
      )
      return response.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-crag-routes', variables.cragId] })
      queryClient.invalidateQueries({ queryKey: ['admin-crags'] })
      queryClient.invalidateQueries({ queryKey: ['admin-crag-stats'] })
    },
  })
}

export function useBatchImportAdminRoutes() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      cragId,
      routes,
      skipExisting,
    }: {
      cragId: string
      routes: Partial<AdminRoutePayload>[]
      skipExisting: boolean
    }) => {
      const response = await apiClient.post<ApiResponse<BatchImportResult>>(
        `/admin/crags/${cragId}/routes/batch-import`,
        { routes, skipExisting }
      )
      return response.data.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-crag-routes', variables.cragId] })
      queryClient.invalidateQueries({ queryKey: ['admin-crags'] })
      queryClient.invalidateQueries({ queryKey: ['admin-crag-stats'] })
    },
  })
}

export function useAdminRouteVideos(cragId: string, routeId: string) {
  return useQuery({
    queryKey: ['admin-route-videos', cragId, routeId],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<RouteVideoItem[]>>(
        `/admin/crags/${cragId}/routes/${routeId}/videos`
      )
      return response.data.data ?? []
    },
    enabled: Boolean(cragId && routeId),
    staleTime: 30 * 1000,
  })
}

export function useSearchAdminVideos(query: string, limit = 10, enabled = false) {
  return useQuery({
    queryKey: ['admin-crag-video-search', query, limit],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<RouteVideoItem[]>>(
        '/admin/crags/videos/search',
        { params: { q: query, limit } }
      )
      return response.data.data ?? []
    },
    enabled: enabled && Boolean(query.trim()),
    staleTime: 30 * 1000,
  })
}

export function useAddAdminRouteVideo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      cragId,
      routeId,
      payload,
    }: {
      cragId: string
      routeId: string
      payload: RouteVideoPayload
    }) => {
      const response = await apiClient.post<ApiResponse<RouteVideoItem>>(
        `/admin/crags/${cragId}/routes/${routeId}/videos`,
        payload
      )
      return response.data.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['admin-route-videos', variables.cragId, variables.routeId],
      })
    },
  })
}

export function useRemoveAdminRouteVideo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      cragId,
      routeId,
      videoId,
    }: {
      cragId: string
      routeId: string
      videoId: string
    }) => {
      const response = await apiClient.delete<ApiResponse<{ message: string }>>(
        `/admin/crags/${cragId}/routes/${routeId}/videos/${videoId}`
      )
      return response.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['admin-route-videos', variables.cragId, variables.routeId],
      })
    },
  })
}

export function useAdminGyms(options: AdminGymsOptions) {
  return useQuery({
    queryKey: ['admin-gyms', options],
    queryFn: async () => {
      const response = await apiClient.get<
        ApiResponse<AdminGym[]> & {
          pagination: { page: number; limit: number; total: number; total_pages: number }
        }
      >('/gyms', { params: options })
      return {
        gyms: response.data.data ?? [],
        pagination: response.data.pagination,
      }
    },
    staleTime: 30 * 1000,
  })
}

export function useDeleteAdminGym() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete<ApiResponse<{ message: string }>>(`/gyms/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gyms'] })
      queryClient.invalidateQueries({ queryKey: ['admin-site-stats'] })
    },
  })
}

export function useCreateAdminGym() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: AdminGymPayload) => {
      const response = await apiClient.post<ApiResponse<AdminGym>>('/gyms', payload)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gyms'] })
      queryClient.invalidateQueries({ queryKey: ['admin-site-stats'] })
    },
  })
}

export function useUpdateAdminGym() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: AdminGymPayload }) => {
      const response = await apiClient.put<ApiResponse<AdminGym>>(`/gyms/${id}`, payload)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gyms'] })
      queryClient.invalidateQueries({ queryKey: ['admin-site-stats'] })
    },
  })
}

export function useAdminBroadcasts(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['admin-broadcasts', page, limit],
    queryFn: async () => {
      const response = await apiClient.get<
        ApiResponse<BroadcastRecord[]> & {
          pagination: { page: number; limit: number; total: number; total_pages: number }
        }
      >('/notifications/admin/broadcasts', { params: { page, limit } })
      return {
        broadcasts: response.data.data ?? [],
        pagination: response.data.pagination,
      }
    },
    staleTime: 30 * 1000,
  })
}

export function useSendAdminBroadcast() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: BroadcastPayload) => {
      const response = await apiClient.post<
        ApiResponse<{
          totalUsers: number
          successCount: number
          failedCount: number
        }>
      >('/notifications/admin/broadcast', payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-broadcasts'] })
      queryClient.invalidateQueries({ queryKey: ['admin-notification-stats'] })
    },
  })
}

export function useAIDashboard() {
  return useQuery({
    queryKey: ['admin-ai-dashboard'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<AIDashboardData>>('/admin/ai/dashboard')
      return response.data.data
    },
    staleTime: 60 * 1000,
  })
}

export function useAILogs(options: AILogsOptions) {
  return useQuery({
    queryKey: ['admin-ai-logs', options],
    queryFn: async () => {
      const response = await apiClient.get<
        ApiResponse<{
          logs: AIQueryLog[]
          total: number
          page: number
          limit: number
        }>
      >('/admin/ai/logs', { params: options })
      return response.data.data
    },
    staleTime: 30 * 1000,
  })
}

export function useAILogDetail(id: string) {
  return useQuery({
    queryKey: ['admin-ai-log', id],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<AILogDetail>>(`/admin/ai/logs/${id}`)
      return response.data.data
    },
    enabled: Boolean(id),
    staleTime: 30 * 1000,
  })
}

export function useAIStats(options: { from: string; to: string } | null) {
  return useQuery({
    queryKey: ['admin-ai-stats', options],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<AIStats>>('/admin/ai/stats', {
        params: options,
      })
      return response.data.data
    },
    enabled: Boolean(options),
    staleTime: 60 * 1000,
  })
}

export function useAIConfig() {
  return useQuery({
    queryKey: ['admin-ai-config'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<Record<string, string>>>('/admin/ai/config')
      return response.data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateAIConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (config: Record<string, string>) => {
      await apiClient.put('/admin/ai/config', config)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-config'] })
    },
  })
}

export function useAskAdminAI() {
  return useMutation({
    mutationFn: async (request: AIAskRequest) => {
      const response = await apiClient.post<ApiResponse<AIAskResponse>>('/ai/ask', request, {
        timeout: 60000,
      })
      if (!response.data.data) {
        throw new Error('AI response is empty')
      }
      return response.data.data
    },
  })
}

export function usePipelineSteps() {
  return useQuery({
    queryKey: ['admin-ai-pipeline-steps'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<PipelineStepInfo[]>>(
        '/admin/ai/pipeline-steps'
      )
      return response.data.data ?? []
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdatePipelineSteps() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (steps: PipelineStepUpdate[]) => {
      await apiClient.put('/admin/ai/pipeline-steps', { steps })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-pipeline-steps'] })
    },
  })
}

export function useAIMetrics(range: MetricsRange) {
  return useQuery({
    queryKey: ['admin-ai-metrics', range],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<MetricsResponse>>('/admin/ai/metrics', {
        params: { range },
      })
      return response.data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useAIKnowledge() {
  return useQuery({
    queryKey: ['admin-ai-knowledge'],
    queryFn: async () => {
      const response =
        await apiClient.get<ApiResponse<{ sources: AIKnowledgeSource[] }>>('/admin/ai/knowledge')
      return response.data.data
    },
    staleTime: 60 * 1000,
  })
}

export function useReindexAIKnowledge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: AIIndexPayload) => {
      const response = await apiClient.post<ApiResponse<AIIndexResult>>('/ai/index', payload)
      return (
        response.data.data ?? {
          indexed: 0,
          failed: 0,
          hasMore: false,
          nextOffset: payload.offset ?? 0,
        }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-knowledge'] })
    },
  })
}

export function useAIPromptDefaults() {
  return useQuery({
    queryKey: ['admin-ai-prompt-defaults'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<AIPromptDefault[]>>(
        '/admin/ai/prompts/defaults'
      )
      return response.data.data ?? []
    },
    staleTime: 10 * 60 * 1000,
  })
}

export function useAIPrompts() {
  return useQuery({
    queryKey: ['admin-ai-prompts'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<AIPrompt[]>>('/admin/ai/prompts')
      return response.data.data ?? []
    },
    staleTime: 60 * 1000,
  })
}

export function useAIPromptsByName(name: string) {
  return useQuery({
    queryKey: ['admin-ai-prompts', name],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<AIPrompt[]>>('/admin/ai/prompts', {
        params: { name },
      })
      return response.data.data ?? []
    },
    enabled: Boolean(name),
    staleTime: 30 * 1000,
  })
}

export function useCreateAIPrompt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: AIPromptPayload) => {
      const response = await apiClient.post<ApiResponse<{ id: string }>>(
        '/admin/ai/prompts',
        payload
      )
      return response.data.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-prompts'] })
      queryClient.invalidateQueries({ queryKey: ['admin-ai-prompts', variables.name] })
    },
  })
}

export function useAccessLogSummary(hours = 24) {
  return useQuery({
    queryKey: ['admin-access-log-summary', hours],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<AccessLogSummary>>('/access-logs/summary', {
        params: { hours },
      })
      return response.data.data
    },
    staleTime: 60 * 1000,
  })
}

export function useAccessLogs(options: {
  limit?: number
  offset?: number
  path?: string
  method?: string
  status?: string
}) {
  return useQuery({
    queryKey: ['admin-access-logs', options],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<AccessLogEntry[]>>('/access-logs', {
        params: options,
      })
      return response.data.data ?? []
    },
    staleTime: 30 * 1000,
  })
}

export function useAccessLogErrors(options: { hours?: number; limit?: number }) {
  return useQuery({
    queryKey: ['admin-access-log-errors', options],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<AccessLogError[]>>('/access-logs/errors', {
        params: options,
      })
      return response.data.data ?? []
    },
    staleTime: 30 * 1000,
  })
}

export function useAccessLogSlowRequests(options: {
  hours?: number
  threshold?: number
  limit?: number
}) {
  return useQuery({
    queryKey: ['admin-access-log-slow', options],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<AccessLogSlow[]>>('/access-logs/slow', {
        params: options,
      })
      return response.data.data ?? []
    },
    staleTime: 30 * 1000,
  })
}

export function useFollowAnalytics() {
  return useQuery({
    queryKey: ['admin-analytics', 'follows'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<FollowAnalytics>>('/stats/admin/follows')
      return response.data.data
    },
    staleTime: 60 * 1000,
  })
}

export function useActivityAnalytics() {
  return useQuery({
    queryKey: ['admin-analytics', 'activity'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ActivityAnalytics>>('/stats/admin/activity')
      return response.data.data
    },
    staleTime: 60 * 1000,
  })
}

export function useContentAnalytics() {
  return useQuery({
    queryKey: ['admin-analytics', 'content'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ContentAnalytics>>('/stats/admin/content')
      return response.data.data
    },
    staleTime: 60 * 1000,
  })
}
