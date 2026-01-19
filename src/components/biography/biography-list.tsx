'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRightCircle, Loader2, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { biographyService } from '@/lib/api/services'
import { Biography, PaginationInfo } from '@/lib/types'
import { calculateClimbingYears } from '@/lib/utils/biography'
import { isSvgUrl } from '@/lib/utils/image'

// 緩存配置
const CACHE_KEY = 'nobodyclimb_biography_list'
const CACHE_TTL = 3 * 60 * 1000 // 3 分鐘

interface CachedData {
  data: Biography[]
  pagination: PaginationInfo
  timestamp: number
}

/**
 * 從 localStorage 獲取緩存的人物誌列表數據
 */
function getCachedBiographies(): { data: Biography[]; pagination: PaginationInfo } | null {
  if (typeof window === 'undefined') return null

  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null

    const { data, pagination }: CachedData = JSON.parse(cached)
    return { data, pagination }
  } catch {
    return null
  }
}

/**
 * 檢查緩存是否過期
 */
function isCacheExpired(): boolean {
  if (typeof window === 'undefined') return true

  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return true

    const { timestamp }: CachedData = JSON.parse(cached)
    return Date.now() - timestamp > CACHE_TTL
  } catch {
    return true
  }
}

/**
 * 緩存人物誌列表數據到 localStorage
 */
function cacheBiographies(data: Biography[], pagination: PaginationInfo): void {
  if (typeof window === 'undefined') return

  try {
    const cacheData: CachedData = {
      data,
      pagination,
      timestamp: Date.now(),
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
  } catch {
    // 忽略緩存錯誤
  }
}

// 卡片組件
interface BiographyCardProps {
  person: Biography
}

function BiographyCard({ person }: BiographyCardProps) {
  const climbingYears = calculateClimbingYears(person.climbing_start_year)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-full"
    >
      <Link href={`/biography/profile/${person.id}`} className="block h-full">
        <Card className="h-full overflow-hidden rounded-lg transition-shadow duration-300 hover:shadow-md">
          <CardContent className="p-6">
            <div className="mb-4 space-y-3">
              {person.climbing_meaning ? (
                <div className="relative">
                  <p className="line-clamp-3 text-base font-medium leading-relaxed text-[#1B1A1A]">
                    &ldquo;{person.climbing_meaning}&rdquo;
                  </p>
                </div>
              ) : (
                <p className="text-sm italic text-[#8E8C8C]">尚未分享故事</p>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-100">
                  {person.avatar_url ? (
                    isSvgUrl(person.avatar_url) ? (
                      <img src={person.avatar_url} alt={person.name} className="h-full w-full object-cover" />
                    ) : (
                      <Image
                        src={person.avatar_url}
                        alt={person.name}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    )
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <User size={20} className="text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-[#1B1A1A]">{person.name}</h3>
                  <p className="text-xs text-[#8E8C8C]">
                    攀岩 {climbingYears !== null ? `${climbingYears}年` : '年資未知'}
                  </p>
                </div>
              </div>
              <ArrowRightCircle size={18} className="flex-shrink-0 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}

interface BiographyListProps {
  searchTerm: string
  onLoadMore?: () => void
  // eslint-disable-next-line no-unused-vars
  onTotalChange?: (_total: number, _hasMore: boolean) => void
  // eslint-disable-next-line no-unused-vars
  onLoadMoreChange?: (_loadMore: () => void) => void
}

export function BiographyList({ searchTerm, onTotalChange, onLoadMoreChange }: BiographyListProps) {
  const [biographies, setBiographies] = useState<Biography[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const initialLoadDone = useRef(false)

  // 從 API 加載數據
  const loadBiographies = useCallback(async (page: number, append: boolean = false, useCache: boolean = false) => {
    // 僅在首次載入且沒有搜索詞時使用緩存
    if (useCache && page === 1 && !searchTerm && !initialLoadDone.current) {
      const cached = getCachedBiographies()
      if (cached && cached.data.length > 0) {
        setBiographies(cached.data)
        const hasMoreData = cached.pagination.page < cached.pagination.total_pages
        setHasMore(hasMoreData)
        setCurrentPage(1)
        onTotalChange?.(cached.pagination.total, hasMoreData)
        setLoading(false)

        // 如果緩存未過期，標記完成並返回
        if (!isCacheExpired()) {
          initialLoadDone.current = true
          return
        }
        // 緩存過期，在背景靜默更新
      }
    }

    if (append) {
      setLoadingMore(true)
    } else if (!useCache || biographies.length === 0) {
      setLoading(true)
    }
    setError(null)

    try {
      const response = await biographyService.getBiographies(page, 20, searchTerm || undefined)

      if (response.success) {
        setBiographies(prev => append ? [...prev, ...response.data] : response.data)
        const hasMoreData = response.pagination.page < response.pagination.total_pages
        setHasMore(hasMoreData)
        setCurrentPage(page)
        onTotalChange?.(response.pagination.total, hasMoreData)

        // 緩存首頁無搜索的數據
        if (page === 1 && !searchTerm) {
          cacheBiographies(response.data, response.pagination)
        }
      } else {
        // 如果有緩存數據且 API 失敗，使用緩存
        const cached = getCachedBiographies()
        if (cached && cached.data.length > 0 && !append && !searchTerm) {
          setBiographies(cached.data)
          const hasMoreData = cached.pagination.page < cached.pagination.total_pages
          setHasMore(hasMoreData)
          onTotalChange?.(cached.pagination.total, hasMoreData)
        } else {
          setError('無法載入人物誌資料')
          if (!append) {
            setBiographies([])
          }
          setHasMore(false)
          onTotalChange?.(0, false)
        }
      }
    } catch (err) {
      console.error('Failed to load biographies:', err)
      // 如果有緩存數據且 API 失敗，使用緩存
      const cached = getCachedBiographies()
      if (cached && cached.data.length > 0 && !append && !searchTerm) {
        setBiographies(cached.data)
        const hasMoreData = cached.pagination.page < cached.pagination.total_pages
        setHasMore(hasMoreData)
        onTotalChange?.(cached.pagination.total, hasMoreData)
      } else {
        setError('載入人物誌時發生錯誤')
        if (!append) {
          setBiographies([])
        }
        setHasMore(false)
        onTotalChange?.(0, false)
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
      initialLoadDone.current = true
    }
  }, [searchTerm, onTotalChange, biographies.length])

  // 加載更多
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadBiographies(currentPage + 1, true)
    }
  }, [currentPage, hasMore, loadingMore, loadBiographies])

  // 將 loadMore 函數傳遞給父組件
  useEffect(() => {
    onLoadMoreChange?.(loadMore)
  }, [loadMore, onLoadMoreChange])

  // 搜索時重新加載
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setCurrentPage(1)
      // 首次載入時使用緩存
      loadBiographies(1, false, !initialLoadDone.current)
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchTerm, loadBiographies])

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1B1A1A]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
        <p className="text-lg text-red-600">{error}</p>
      </div>
    )
  }

  if (biographies.length === 0) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
        <p className="text-lg text-[#6D6C6C]">
          {searchTerm ? `找不到符合「${searchTerm}」的人物` : '目前沒有人物誌'}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {biographies.map((person) => (
          <BiographyCard key={person.id} person={person} />
        ))}
      </div>
      {loadingMore && (
        <div className="mt-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#1B1A1A]" />
        </div>
      )}
    </>
  )
}
