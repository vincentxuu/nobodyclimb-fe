import { useState, useEffect, useCallback, RefObject } from 'react'
import { DEFAULT_PAGE } from '@/lib/constants'

interface UseInfiniteScrollProps {
  /** 觀察的DOM元素參考，當此元素進入視口時觸發加載 */
  targetRef: RefObject<HTMLElement>
  /** 是否有更多數據可加載 */
  hasMore: boolean
  /** 是否正在加載 */
  isLoading: boolean
  /** 頁面變更時的回調函數 */
  onLoadMore: (page: number) => void
  /** 觀察者選項 */
  options?: IntersectionObserverInit
  /** 初始頁碼，默認為1 */
  initialPage?: number
}

/**
 * 無限捲動 hook
 * 當指定的目標元素進入視口時自動加載更多內容
 */
export function useInfiniteScroll({
  targetRef,
  hasMore,
  isLoading,
  onLoadMore,
  options = {
    root: null,
    rootMargin: '0px 0px 200px 0px', // 提前200px觸發
    threshold: 0.1,
  },
  initialPage = DEFAULT_PAGE,
}: UseInfiniteScrollProps): { page: number; resetPage: () => void } {
  // 當前頁碼
  const [page, setPage] = useState<number>(initialPage)
  
  // 重置頁碼的函數
  const resetPage = useCallback(() => {
    setPage(initialPage)
  }, [initialPage])
  
  // 加載更多數據的回調
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      onLoadMore(nextPage)
    }
  }, [page, isLoading, hasMore, onLoadMore])
  
  useEffect(() => {
    // 檢查目標元素和IntersectionObserver API的可用性
    if (!targetRef?.current || typeof IntersectionObserver !== 'function') {
      return
    }
    
    // 創建交叉觀察器
    const observer = new IntersectionObserver((entries) => {
      // 當目標元素進入視口時
      if (entries[0].isIntersecting) {
        loadMore()
      }
    }, options)
    
    // 開始觀察目標元素
    observer.observe(targetRef.current)
    
    // 清理函數
    return () => {
      if (targetRef.current) {
        observer.unobserve(targetRef.current)
      }
      observer.disconnect()
    }
  }, [targetRef, options, loadMore])
  
  return { page, resetPage }
}
