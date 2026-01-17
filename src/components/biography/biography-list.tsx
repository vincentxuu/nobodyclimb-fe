'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRightCircle, Loader2, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { biographyService } from '@/lib/api/services'
import { Biography } from '@/lib/types'
import { calculateClimbingYears } from '@/lib/utils/biography'

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
                    <Image
                      src={person.avatar_url}
                      alt={person.name}
                      fill
                      className="object-cover"
                      sizes="40px"
                      unoptimized
                    />
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

  // 從 API 加載數據
  const loadBiographies = useCallback(async (page: number, append: boolean = false) => {
    if (append) {
      setLoadingMore(true)
    } else {
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
      } else {
        setError('無法載入人物誌資料')
        if (!append) {
          setBiographies([])
        }
        setHasMore(false)
        onTotalChange?.(0, false)
      }
    } catch (err) {
      console.error('Failed to load biographies:', err)
      setError('載入人物誌時發生錯誤')
      if (!append) {
        setBiographies([])
      }
      setHasMore(false)
      onTotalChange?.(0, false)
    } finally {
      setLoading(false)
      setLoadingMore(false)
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
      setCurrentPage(1)
      loadBiographies(1, false)
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
