'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight, Loader2, Sparkles } from 'lucide-react'
import { biographyService } from '@/lib/api/services'
import { Biography } from '@/lib/types'
import { getDisplayTags, getDisplayNameForVisibility } from '@/lib/utils/biography'
import { isSvgUrl, getDefaultAvatarUrl, getDefaultCoverUrl } from '@/lib/utils/image'
import {
  getCachedBiographyList,
  cacheBiographyList,
  isBiographyListCacheExpired,
  ONE_LINER_QUESTIONS,
} from '@/lib/utils/biography-cache'

// 解析 basic_info_data JSON，優先使用其中的值
interface BasicInfoData {
  name?: string
  title?: string
  bio?: string
  climbing_start_year?: number | string
  frequent_locations?: string
  home_gym?: string
}

function parseBasicInfoData(json: string | null | undefined): BasicInfoData | null {
  if (!json) return null
  try {
    return JSON.parse(json) as BasicInfoData
  } catch {
    return null
  }
}

/**
 * 從 one_liners_data 取得最多 3 個一句話用於顯示
 */
function getDisplayOneLiners(
  oneLinersJson: string | null | undefined,
  maxCount = 3
): Array<{ question: string; answer: string }> {
  if (!oneLinersJson) return []

  try {
    const parsed = JSON.parse(oneLinersJson) as Record<
      string,
      { answer: string; visibility?: string } | undefined
    >

    const result: Array<{ question: string; answer: string }> = []

    // 按優先順序取得一句話
    const priorityKeys = [
      'climbing_meaning',
      'climbing_origin',
      'advice_to_self',
      'best_moment',
      'favorite_place',
      'current_goal',
    ]

    // 先處理優先的問題
    for (const key of priorityKeys) {
      if (result.length >= maxCount) break
      const data = parsed[key]
      if (data?.answer && data.answer.trim() && data.visibility === 'public') {
        result.push({
          question: ONE_LINER_QUESTIONS[key] || key,
          answer: data.answer.length > 30 ? data.answer.slice(0, 30) + '...' : data.answer,
        })
      }
    }

    // 如果不夠，從其他問題補充
    const prioritySet = new Set(priorityKeys)
    for (const [key, data] of Object.entries(parsed)) {
      if (result.length >= maxCount) break
      if (prioritySet.has(key)) continue
      if (data?.answer && data.answer.trim() && data.visibility === 'public') {
        result.push({
          question: ONE_LINER_QUESTIONS[key] || key,
          answer: data.answer.length > 30 ? data.answer.slice(0, 30) + '...' : data.answer,
        })
      }
    }

    return result
  } catch {
    return []
  }
}

// 卡片組件 - Mini Profile Card 風格
interface BiographyCardProps {
  person: Biography
}

function BiographyCard({ person }: BiographyCardProps) {
  // 優先使用 basic_info_data 中的資料
  const basicInfo = parseBasicInfoData(person.basic_info_data)
  const displayName = getDisplayNameForVisibility(person.visibility, basicInfo?.name || person.name)
  const title = basicInfo?.title || person.title

  // 取得展示標籤（最多 3 個）
  const displayTags = getDisplayTags(person.tags_data, 3)

  // 取得展示的一句話（最多 3 個）
  const displayOneLiners = getDisplayOneLiners(person.one_liners_data, 3)

  // 封面圖 URL
  const coverUrl = person.cover_image || getDefaultCoverUrl(person.id || person.name || 'default', 600, 200)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-full"
    >
      <div className="h-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md">
        {/* 封面圖 */}
        <div className="relative aspect-[3/1] w-full overflow-hidden bg-gradient-to-br from-[#EBEAEA] to-[#DBD8D8]">
          <Image
            src={coverUrl}
            alt={`${displayName} 封面`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          {/* 漸層遮罩 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        {/* 內容區 */}
        <div className="relative px-4 pb-4">
          {/* 頭像 - 與封面重疊 */}
          <div className="absolute -top-6 left-4">
            <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-white bg-gray-100 shadow-md">
              {person.avatar_url ? (
                isSvgUrl(person.avatar_url) ? (
                  <img src={person.avatar_url} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  <Image
                    src={person.avatar_url}
                    alt={displayName}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                )
              ) : (
                <img
                  src={getDefaultAvatarUrl(displayName || 'anonymous', 48)}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          </div>

          {/* 姓名 + 標語 */}
          <div className="pt-8 space-y-1">
            <h3 className="text-base font-semibold text-[#1B1A1A]">{displayName}</h3>
            {title && (
              <p className="text-sm text-[#6D6C6C] line-clamp-1">「{title}」</p>
            )}
          </div>

          {/* 三個一句話 */}
          {displayOneLiners.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {displayOneLiners.map((item, index) => (
                <div key={index} className="text-xs">
                  <span className="text-[#8E8C8C]">{item.question}：</span>
                  <span className="text-[#3F3D3D]">{item.answer}</span>
                </div>
              ))}
            </div>
          )}

          {/* 三個標籤 */}
          {displayTags.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {displayTags.map((tag) => (
                <span
                  key={tag.id}
                  className={`inline-flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full ${
                    tag.isCustom
                      ? 'bg-brand-accent/10 text-[#1B1A1A] border border-brand-accent/30'
                      : 'bg-gray-100 text-[#6D6C6C]'
                  }`}
                >
                  {tag.isCustom && <Sparkles size={10} className="text-brand-accent" />}
                  {tag.label}
                </span>
              ))}
            </div>
          )}

          {/* CTA 按鈕 */}
          <Link
            href={`/biography/profile/${person.slug}`}
            className="flex items-center justify-center w-full h-9 mt-4 text-sm border border-[#1B1A1A] text-[#1B1A1A] hover:bg-[#F5F4F4] rounded-lg transition-colors group"
          >
            看看 {displayName} 的故事
            <ArrowRight size={14} className="ml-1 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
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
  const prevSearchTerm = useRef(searchTerm)

  // 從 API 加載數據
  const loadBiographies = useCallback(async (page: number, append: boolean = false, useCache: boolean = false) => {
    // 僅在首次載入且沒有搜索詞時使用緩存
    if (useCache && page === 1 && !searchTerm && !initialLoadDone.current) {
      const cached = getCachedBiographyList()
      if (cached && cached.data.length > 0) {
        setBiographies(cached.data)
        const hasMoreData = cached.pagination.page < cached.pagination.total_pages
        setHasMore(hasMoreData)
        setCurrentPage(1)
        onTotalChange?.(cached.pagination.total, hasMoreData)
        setLoading(false)

        // 如果緩存未過期，標記完成並返回
        if (!isBiographyListCacheExpired()) {
          initialLoadDone.current = true
          return
        }
        // 緩存過期，在背景靜默更新
      }
    }

    if (append) {
      setLoadingMore(true)
    } else if (!useCache) {
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
          cacheBiographyList(response.data, response.pagination)
        }
      } else {
        // 如果有緩存數據且 API 失敗，使用緩存
        const cached = getCachedBiographyList()
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
      const cached = getCachedBiographyList()
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
  }, [searchTerm, onTotalChange])

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
      // 檢查搜索詞是否真的改變了，避免重複請求
      const isSearchTermChanged = prevSearchTerm.current !== searchTerm
      prevSearchTerm.current = searchTerm

      if (isSearchTermChanged || !initialLoadDone.current) {
        setCurrentPage(1)
        // 首次載入時使用緩存
        loadBiographies(1, false, !initialLoadDone.current && !searchTerm)
      }
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
