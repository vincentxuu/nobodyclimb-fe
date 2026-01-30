/**
 * 人物誌統計與徽章 Hooks
 * Phase 8: 統計與徽章
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api/client'
import { BIOGRAPHY_ENDPOINTS } from '@/lib/api/endpoints'
import type {
  ApiResponse,
  BiographyStats,
  CommunityStats,
  UserBadgesResponse,
  LeaderboardItem,
  LeaderboardType,
} from '@/lib/types'

// ═══════════════════════════════════════════════════════════
// 個人統計
// ═══════════════════════════════════════════════════════════

/**
 * 獲取人物誌統計數據
 */
export function useBiographyStats(biographyId: string | undefined) {
  return useQuery({
    queryKey: ['biography-stats', biographyId],
    queryFn: async () => {
      if (!biographyId) throw new Error('Biography ID is required')
      const response = await apiClient.get<ApiResponse<BiographyStats>>(
        BIOGRAPHY_ENDPOINTS.STATS(biographyId)
      )
      return response.data.data
    },
    enabled: !!biographyId,
    staleTime: 60 * 1000, // 1 minute
  })
}

/**
 * 獲取人物誌徽章進度
 */
export function useBiographyBadges(biographyId: string | undefined) {
  return useQuery({
    queryKey: ['biography-badges', biographyId],
    queryFn: async () => {
      if (!biographyId) throw new Error('Biography ID is required')
      const response = await apiClient.get<ApiResponse<UserBadgesResponse>>(
        BIOGRAPHY_ENDPOINTS.BADGES(biographyId)
      )
      return response.data.data
    },
    enabled: !!biographyId,
    staleTime: 60 * 1000, // 1 minute
  })
}

/**
 * 記錄瀏覽次數
 */
export function useRecordView() {
  return useMutation({
    mutationFn: async (biographyId: string) => {
      const response = await apiClient.put<ApiResponse<{ message: string }>>(
        BIOGRAPHY_ENDPOINTS.RECORD_VIEW(biographyId)
      )
      return response.data
    },
  })
}

// ═══════════════════════════════════════════════════════════
// 社群統計
// ═══════════════════════════════════════════════════════════

/**
 * 獲取社群統計數據
 */
export function useCommunityStats() {
  return useQuery({
    queryKey: ['community-stats'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<CommunityStats>>(
        BIOGRAPHY_ENDPOINTS.COMMUNITY_STATS
      )
      return response.data.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * 獲取排行榜
 */
export function useLeaderboard(type: LeaderboardType, limit = 10) {
  return useQuery({
    queryKey: ['leaderboard', type, limit],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<LeaderboardItem[]>>(
        BIOGRAPHY_ENDPOINTS.LEADERBOARD(type),
        { params: { limit } }
      )
      return response.data.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// ═══════════════════════════════════════════════════════════
// 追蹤系統
// ═══════════════════════════════════════════════════════════

/**
 * 追蹤人物誌
 */
export function useFollowBiography() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (biographyId: string) => {
      const response = await apiClient.post<ApiResponse<{ message: string }>>(
        BIOGRAPHY_ENDPOINTS.FOLLOW(biographyId)
      )
      return response.data
    },
    onSuccess: (_, biographyId) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['biography-stats', biographyId] })
      queryClient.invalidateQueries({ queryKey: ['biography', biographyId] })
    },
  })
}

/**
 * 取消追蹤人物誌
 */
export function useUnfollowBiography() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (biographyId: string) => {
      const response = await apiClient.delete<ApiResponse<{ message: string }>>(
        BIOGRAPHY_ENDPOINTS.FOLLOW(biographyId)
      )
      return response.data
    },
    onSuccess: (_, biographyId) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['biography-stats', biographyId] })
      queryClient.invalidateQueries({ queryKey: ['biography', biographyId] })
    },
  })
}

/**
 * 獲取追蹤者列表
 */
export function useFollowers(biographyId: string | undefined, limit = 20, offset = 0) {
  return useQuery({
    queryKey: ['biography-followers', biographyId, limit, offset],
    queryFn: async () => {
      if (!biographyId) throw new Error('Biography ID is required')
      const response = await apiClient.get(BIOGRAPHY_ENDPOINTS.FOLLOWERS(biographyId), {
        params: { limit, offset },
      })
      return response.data
    },
    enabled: !!biographyId,
  })
}

/**
 * 獲取追蹤中列表
 */
export function useFollowing(biographyId: string | undefined, limit = 20, offset = 0) {
  return useQuery({
    queryKey: ['biography-following', biographyId, limit, offset],
    queryFn: async () => {
      if (!biographyId) throw new Error('Biography ID is required')
      const response = await apiClient.get(BIOGRAPHY_ENDPOINTS.FOLLOWING(biographyId), {
        params: { limit, offset },
      })
      return response.data
    },
    enabled: !!biographyId,
  })
}
