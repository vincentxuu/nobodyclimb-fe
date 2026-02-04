'use client'

import { useState, useCallback } from 'react'
import apiClient from '@/lib/api/client'
import type {
  RouteStory,
  RouteStoryFormData,
  RouteStoryComment,
} from '@/lib/types/route-story'

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
 * 路線故事 Hook
 */
export function useRouteStories() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * 取得路線故事列表
   */
  const getStories = useCallback(
    async (params?: {
      page?: number
      limit?: number
      route_id?: string
      crag_id?: string
      story_type?: string
      featured?: boolean
    }) => {
      setIsLoading(true)
      setError(null)
      try {
        const queryParams = new URLSearchParams()
        if (params?.page) queryParams.set('page', params.page.toString())
        if (params?.limit) queryParams.set('limit', params.limit.toString())
        if (params?.route_id) queryParams.set('route_id', params.route_id)
        if (params?.crag_id) queryParams.set('crag_id', params.crag_id)
        if (params?.story_type) queryParams.set('story_type', params.story_type)
        if (params?.featured) queryParams.set('featured', 'true')

        const response = await apiClient.get<PaginatedResponse<RouteStory>>(
          `/route-stories?${queryParams.toString()}`
        )
        return response.data
      } catch (err) {
        const message = err instanceof Error ? err.message : '取得路線故事失敗'
        setError(message)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  /**
   * 取得單筆路線故事
   */
  const getStory = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiClient.get<ApiResponse<RouteStory>>(`/route-stories/${id}`)
      return response.data.data
    } catch (err) {
      const message = err instanceof Error ? err.message : '取得路線故事失敗'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * 新增路線故事
   */
  const createStory = useCallback(async (data: RouteStoryFormData) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiClient.post<ApiResponse<RouteStory>>('/route-stories', data)
      return response.data.data
    } catch (err) {
      const message = err instanceof Error ? err.message : '新增路線故事失敗'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * 更新路線故事
   */
  const updateStory = useCallback(async (id: string, data: Partial<RouteStoryFormData>) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiClient.put<ApiResponse<RouteStory>>(`/route-stories/${id}`, data)
      return response.data.data
    } catch (err) {
      const message = err instanceof Error ? err.message : '更新路線故事失敗'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * 刪除路線故事
   */
  const deleteStory = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      await apiClient.delete(`/route-stories/${id}`)
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : '刪除路線故事失敗'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * 按讚/取消按讚
   */
  const toggleLike = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiClient.post<ApiResponse<{ is_liked: boolean }>>(
        `/route-stories/${id}/like`
      )
      return response.data.data.is_liked
    } catch (err) {
      const message = err instanceof Error ? err.message : '操作失敗'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * 標記有幫助
   */
  const toggleHelpful = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiClient.post<ApiResponse<{ is_helpful: boolean }>>(
        `/route-stories/${id}/helpful`
      )
      return response.data.data.is_helpful
    } catch (err) {
      const message = err instanceof Error ? err.message : '操作失敗'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * 取得故事留言
   */
  const getComments = useCallback(
    async (storyId: string, params?: { page?: number; limit?: number }) => {
      setIsLoading(true)
      setError(null)
      try {
        const queryParams = new URLSearchParams()
        if (params?.page) queryParams.set('page', params.page.toString())
        if (params?.limit) queryParams.set('limit', params.limit.toString())

        const response = await apiClient.get<PaginatedResponse<RouteStoryComment>>(
          `/route-stories/${storyId}/comments?${queryParams.toString()}`
        )
        return response.data
      } catch (err) {
        const message = err instanceof Error ? err.message : '取得留言失敗'
        setError(message)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  /**
   * 新增留言
   */
  const addComment = useCallback(
    async (storyId: string, content: string, parentId?: string) => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await apiClient.post<ApiResponse<RouteStoryComment>>(
          `/route-stories/${storyId}/comments`,
          { content, parent_id: parentId }
        )
        return response.data.data
      } catch (err) {
        const message = err instanceof Error ? err.message : '新增留言失敗'
        setError(message)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  /**
   * 取得路線的故事
   */
  const getRouteStories = useCallback(
    async (
      routeId: string,
      params?: { page?: number; limit?: number; story_type?: string }
    ) => {
      setIsLoading(true)
      setError(null)
      try {
        const queryParams = new URLSearchParams()
        if (params?.page) queryParams.set('page', params.page.toString())
        if (params?.limit) queryParams.set('limit', params.limit.toString())
        if (params?.story_type) queryParams.set('story_type', params.story_type)

        const response = await apiClient.get<PaginatedResponse<RouteStory>>(
          `/route-stories/route/${routeId}?${queryParams.toString()}`
        )
        return response.data
      } catch (err) {
        const message = err instanceof Error ? err.message : '取得路線故事失敗'
        setError(message)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  return {
    isLoading,
    error,
    getStories,
    getStory,
    createStory,
    updateStory,
    deleteStory,
    toggleLike,
    toggleHelpful,
    getComments,
    addComment,
    getRouteStories,
  }
}
