'use client'

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRightCircle, Loader2, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { biographyService } from '@/lib/api/services'
import { Biography } from '@/lib/types'
import { calculateClimbingYears, getDisplayTags } from '@/lib/utils/biography'
import { isSvgUrl, getDefaultAvatarUrl } from '@/lib/utils/image'
import {
  getCachedBiographyList,
  cacheBiographyList,
  isBiographyListCacheExpired,
  getDefaultQuote,
  selectCardContent,
  SelectedCardContent,
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

// 卡片組件
interface BiographyCardProps {
  person: Biography
  selectedContent: SelectedCardContent | null
}

function BiographyCard({ person, selectedContent }: BiographyCardProps) {
  // 優先使用 basic_info_data 中的資料
  const basicInfo = parseBasicInfoData(person.basic_info_data)
  const displayName = basicInfo?.name || person.name
  const climbingStartYear = basicInfo?.climbing_start_year ?? person.climbing_start_year
  const climbingYears = calculateClimbingYears(
    climbingStartYear != null ? String(climbingStartYear) : null
  )
  // 取得展示標籤
  const displayTags = getDisplayTags(person.tags_data)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-full"
    >
      <Link href={`/biography/profile/${person.slug}`} className="block h-full">
        <Card className="h-full overflow-hidden rounded-lg transition-shadow duration-300 hover:shadow-md">
          <CardContent className="p-6">
            <div className="mb-4 space-y-2">
              <p className="text-xs text-[#8E8C8C]">
                {selectedContent?.question || '攀岩對你來說是什麼？'}
              </p>
              <div className="relative">
                <p className={`line-clamp-3 text-base leading-relaxed ${
                  selectedContent
                    ? 'font-medium text-[#1B1A1A]'
                    : 'italic text-[#8E8C8C]'
                }`}>
                  {selectedContent
                    ? `"${selectedContent.answer}"`
                    : getDefaultQuote(person.id)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-100">
                  {person.avatar_url ? (
                    isSvgUrl(person.avatar_url) ? (
                      <img src={person.avatar_url} alt={displayName} className="h-full w-full object-cover" />
                    ) : (
                      <Image
                        src={person.avatar_url}
                        alt={displayName}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    )
                  ) : (
                    <img
                      src={getDefaultAvatarUrl(displayName || 'anonymous', 40)}
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-[#1B1A1A]">{displayName}</h3>
                  {displayTags.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1 mt-0.5">
                      {displayTags.map((tag, index) => (
                        <React.Fragment key={tag.id}>
                          {tag.isCustom ? (
                            <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded bg-brand-accent/10 text-[#1B1A1A] border border-brand-accent/30">
                              <Sparkles size={10} className="text-brand-accent" />
                              {tag.label}
                            </span>
                          ) : (
                            <span className="text-xs text-[#6D6C6C]">
                              {tag.label}
                            </span>
                          )}
                          {index < displayTags.length - 1 && !tag.isCustom && !displayTags[index + 1]?.isCustom && (
                            <span className="text-xs text-[#6D6C6C]">·</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#8E8C8C]">
                      {climbingYears !== null ? `攀岩 ${climbingYears}年` : '從入坑那天起算'}
                    </p>
                  )}
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

  // 預先計算每張卡片的內容，確保問題不重複（使用 reduce 避免 mutation）
  // 必須在所有 early return 之前調用 useMemo
  const biographiesWithContent = useMemo(() => {
    if (biographies.length === 0) return []
    const result = biographies.reduce<{
      items: Array<{ person: Biography; content: ReturnType<typeof selectCardContent> }>
      usedIds: string[]
    }>(
      (acc, person) => {
        const usedQuestionIds = new Set(acc.usedIds)
        const content = selectCardContent(
          person.id,
          person.one_liners_data,
          person.stories_data,
          usedQuestionIds,
          person.climbing_meaning
        )
        return {
          items: [...acc.items, { person, content }],
          usedIds: content?.questionId ? [...acc.usedIds, content.questionId] : acc.usedIds,
        }
      },
      { items: [], usedIds: [] }
    )
    return result.items
  }, [biographies])

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
        {biographiesWithContent.map(({ person, content }) => (
          <BiographyCard key={person.id} person={person} selectedContent={content} />
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
