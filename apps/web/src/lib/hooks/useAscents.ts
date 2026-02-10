'use client'

import { useState, useCallback } from 'react'
import apiClient from '@/lib/api/client'
import type {
  UserRouteAscent,
  AscentFormData,
  UserClimbingStats,
  RouteAscentSummary,
} from '@/lib/types/ascent'

interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
  message?: string
}

/**
 * 攀爬記錄 Hook
 */
export function useAscents() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * 取得使用者的攀爬記錄
   */
  const getMyAscents = useCallback(
    async (params?: {
      page?: number
      limit?: number
      route_id?: string
      crag_id?: string
      ascent_type?: string
      date_from?: string
      date_to?: string
    }) => {
      setIsLoading(true)
      setError(null)
      try {
        const queryParams = new URLSearchParams()
        if (params?.page) queryParams.set('page', params.page.toString())
        if (params?.limit) queryParams.set('limit', params.limit.toString())
        if (params?.route_id) queryParams.set('route_id', params.route_id)
        if (params?.crag_id) queryParams.set('crag_id', params.crag_id)
        if (params?.ascent_type) queryParams.set('ascent_type', params.ascent_type)
        if (params?.date_from) queryParams.set('date_from', params.date_from)
        if (params?.date_to) queryParams.set('date_to', params.date_to)

        const response = await apiClient.get<PaginatedResponse<UserRouteAscent>>(
          `/ascents?${queryParams.toString()}`
        )
        return response.data
      } catch (err) {
        const message = err instanceof Error ? err.message : '取得攀爬記錄失敗'
        setError(message)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  /**
   * 取得攀爬統計
   */
  const getMyStats = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiClient.get<ApiResponse<UserClimbingStats>>('/ascents/stats')
      return response.data.data
    } catch (err) {
      const message = err instanceof Error ? err.message : '取得攀爬統計失敗'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * 新增攀爬記錄
   */
  const createAscent = useCallback(async (data: AscentFormData) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiClient.post<ApiResponse<UserRouteAscent>>('/ascents', data)
      return response.data.data
    } catch (err) {
      const message = err instanceof Error ? err.message : '新增攀爬記錄失敗'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * 更新攀爬記錄
   */
  const updateAscent = useCallback(async (id: string, data: Partial<AscentFormData>) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiClient.put<ApiResponse<UserRouteAscent>>(`/ascents/${id}`, data)
      return response.data.data
    } catch (err) {
      const message = err instanceof Error ? err.message : '更新攀爬記錄失敗'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * 刪除攀爬記錄
   */
  const deleteAscent = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      await apiClient.delete(`/ascents/${id}`)
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : '刪除攀爬記錄失敗'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * 取得路線的公開攀爬記錄
   */
  const getRouteAscents = useCallback(
    async (routeId: string, params?: { page?: number; limit?: number }) => {
      setIsLoading(true)
      setError(null)
      try {
        const queryParams = new URLSearchParams()
        if (params?.page) queryParams.set('page', params.page.toString())
        if (params?.limit) queryParams.set('limit', params.limit.toString())

        const response = await apiClient.get<PaginatedResponse<UserRouteAscent>>(
          `/ascents/route/${routeId}?${queryParams.toString()}`
        )
        return response.data
      } catch (err) {
        const message = err instanceof Error ? err.message : '取得路線攀爬記錄失敗'
        setError(message)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  /**
   * 取得路線攀爬摘要
   */
  const getRouteAscentSummary = useCallback(async (routeId: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiClient.get<ApiResponse<RouteAscentSummary>>(
        `/ascents/route/${routeId}/summary`
      )
      return response.data.data
    } catch (err) {
      const message = err instanceof Error ? err.message : '取得路線攀爬摘要失敗'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    isLoading,
    error,
    getMyAscents,
    getMyStats,
    createAscent,
    updateAscent,
    deleteAscent,
    getRouteAscents,
    getRouteAscentSummary,
  }
}
