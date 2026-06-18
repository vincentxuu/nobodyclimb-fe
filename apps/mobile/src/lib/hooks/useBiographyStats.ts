import type {
  ApiResponse,
  BiographyStats,
  CommunityStats,
  LeaderboardItem,
  LeaderboardType,
  UserBadgesResponse,
} from '@nobodyclimb/types'
import { useMutation, useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

const BIOGRAPHY_ENDPOINTS = {
  STATS: (id: string) => `/biographies/${id}/stats`,
  BADGES: (id: string) => `/biographies/${id}/badges`,
  RECORD_VIEW: (id: string) => `/biographies/${id}/view`,
  COMMUNITY_STATS: '/biographies/community/stats',
  LEADERBOARD: (type: LeaderboardType) => `/biographies/leaderboard/${type}`,
} as const

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
    staleTime: 60 * 1000,
  })
}

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
    staleTime: 60 * 1000,
  })
}

export function useRecordBiographyView() {
  return useMutation({
    mutationFn: async (biographyId: string) => {
      const response = await apiClient.put<ApiResponse<{ message: string }>>(
        BIOGRAPHY_ENDPOINTS.RECORD_VIEW(biographyId)
      )
      return response.data
    },
  })
}

export function useCommunityStats() {
  return useQuery({
    queryKey: ['community-stats'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<CommunityStats>>(
        BIOGRAPHY_ENDPOINTS.COMMUNITY_STATS
      )
      return response.data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

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
    staleTime: 5 * 60 * 1000,
  })
}
