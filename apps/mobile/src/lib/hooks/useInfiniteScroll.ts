/**
 * useInfiniteScroll Hook
 *
 * 對應 apps/web/src/lib/hooks/useInfiniteScroll.ts
 * React Native 版本使用 FlatList 的 onEndReached
 */
import { useState, useCallback, useRef } from 'react'

interface UseInfiniteScrollOptions {
  threshold?: number
  initialPage?: number
}

interface UseInfiniteScrollResult<T> {
  items: T[]
  isLoading: boolean
  hasMore: boolean
  error: Error | null
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  reset: () => void
  onEndReached: () => void
  onEndReachedThreshold: number
  isRefreshing: boolean
  onRefresh: () => Promise<void>
}

export function useInfiniteScroll<T>(
  fetchFn: (page: number) => Promise<{ data: T[]; hasMore: boolean }>,
  options: UseInfiniteScrollOptions = {}
): UseInfiniteScrollResult<T> {
  const { threshold = 0.5, initialPage = 1 } = options

  const [items, setItems] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const pageRef = useRef(initialPage)
  const isLoadingRef = useRef(false)

  const loadMore = useCallback(async () => {
    if (isLoadingRef.current || !hasMore) return

    isLoadingRef.current = true
    setIsLoading(true)
    setError(null)

    try {
      const result = await fetchFn(pageRef.current)
      setItems((prev) => [...prev, ...result.data])
      setHasMore(result.hasMore)
      pageRef.current += 1
    } catch (err) {
      setError(err instanceof Error ? err : new Error('載入失敗'))
    } finally {
      setIsLoading(false)
      isLoadingRef.current = false
    }
  }, [fetchFn, hasMore])

  const refresh = useCallback(async () => {
    isLoadingRef.current = true
    setIsRefreshing(true)
    setError(null)
    pageRef.current = initialPage

    try {
      const result = await fetchFn(initialPage)
      setItems(result.data)
      setHasMore(result.hasMore)
      pageRef.current = initialPage + 1
    } catch (err) {
      setError(err instanceof Error ? err : new Error('重新整理失敗'))
    } finally {
      setIsRefreshing(false)
      isLoadingRef.current = false
    }
  }, [fetchFn, initialPage])

  const reset = useCallback(() => {
    setItems([])
    setIsLoading(false)
    setIsRefreshing(false)
    setHasMore(true)
    setError(null)
    pageRef.current = initialPage
    isLoadingRef.current = false
  }, [initialPage])

  const onEndReached = useCallback(() => {
    if (!isLoadingRef.current && hasMore) {
      loadMore()
    }
  }, [loadMore, hasMore])

  const onRefresh = useCallback(async () => {
    await refresh()
  }, [refresh])

  return {
    items,
    isLoading,
    hasMore,
    error,
    loadMore,
    refresh,
    reset,
    onEndReached,
    onEndReachedThreshold: threshold,
    isRefreshing,
    onRefresh,
  }
}
