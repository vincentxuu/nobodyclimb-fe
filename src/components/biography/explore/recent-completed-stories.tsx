'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Sparkles,
  Heart,
  MessageCircle,
  Link as LinkIcon,
  Clock,
  Brain,
  Mountain,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { bucketListService } from '@/lib/api/services'
import { BucketListItem, BUCKET_LIST_CATEGORIES } from '@/lib/types'

interface RecentCompletedStoriesProps {
  searchTerm?: string
  filter?: string
}

interface CompletedItem extends BucketListItem {
  author_name?: string
  author_avatar?: string | null
  author_slug?: string
}

export function RecentCompletedStories({ searchTerm, filter }: RecentCompletedStoriesProps) {
  const [items, setItems] = useState<CompletedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadRecentCompleted = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await bucketListService.getRecentCompleted(10)
      if (response.success && response.data) {
        let filteredData = response.data as CompletedItem[]

        // 依搜尋詞過濾
        if (searchTerm) {
          const search = searchTerm.toLowerCase()
          filteredData = filteredData.filter(
            (item) =>
              item.title.toLowerCase().includes(search) ||
              item.completion_story?.toLowerCase().includes(search) ||
              item.author_name?.toLowerCase().includes(search)
          )
        }

        // 依分類過濾
        if (filter && filter !== 'all') {
          const categoryMap: Record<string, string[]> = {
            growth: ['training', 'skill'],
            experience: ['outdoor_route', 'indoor_grade', 'adventure'],
            recovery: ['injury_recovery'],
            footprint: ['adventure'],
          }
          const categories = categoryMap[filter] || []
          if (categories.length > 0) {
            filteredData = filteredData.filter((item) => categories.includes(item.category))
          }
        }

        setItems(filteredData)
      }
    } catch (err) {
      console.error('Failed to load recent completed:', err)
      setError('載入最新完成故事時發生錯誤')
    } finally {
      setLoading(false)
    }
  }, [searchTerm, filter])

  useEffect(() => {
    loadRecentCompleted()
  }, [loadRecentCompleted])

  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins} 分鐘前`
    if (diffHours < 24) return `${diffHours} 小時前`
    if (diffDays < 7) return `${diffDays} 天前`
    return date.toLocaleDateString('zh-TW')
  }

  const getCategoryLabel = (category: string) => {
    return BUCKET_LIST_CATEGORIES.find((c) => c.value === category)?.label || category
  }

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1B1A1A]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-red-500">{error}</div>
    )
  }

  return (
    <div>
      {/* 標題 */}
      <div className="mb-6 flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-yellow-500" />
        <h2 className="text-xl font-bold text-[#1B1A1A]">最新完成故事</h2>
      </div>

      {items.length === 0 ? (
        <div className="flex min-h-[150px] items-center justify-center text-gray-500">
          {searchTerm ? `找不到符合「${searchTerm}」的完成故事` : '目前沒有完成故事'}
        </div>
      ) : (
        <div className="space-y-6">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="overflow-hidden transition-shadow duration-300 hover:shadow-md">
                <CardContent className="p-5">
                  {/* 作者與時間 */}
                  <div className="mb-4 flex items-center justify-between">
                    <Link
                      href={`/biography/profile/${item.biography_id}`}
                      className="flex items-center gap-3"
                    >
                      <div className="relative h-10 w-10 overflow-hidden rounded-full bg-gray-200">
                        {item.author_avatar ? (
                          <Image
                            src={item.author_avatar}
                            alt={item.author_name || ''}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-500">
                            {item.author_name?.charAt(0) || '?'}
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="font-medium text-[#1B1A1A]">{item.author_name}</span>
                        <span className="text-gray-600"> 完成了「{item.title}」</span>
                      </div>
                    </Link>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      {formatTimeAgo(item.completed_at)}
                    </div>
                  </div>

                  {/* 分類標籤 */}
                  <div className="mb-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
                      <Mountain className="h-3 w-3" />
                      {getCategoryLabel(item.category)}
                      {item.target_location && ` · ${item.target_location}`}
                    </span>
                  </div>

                  {/* 完成故事內容 */}
                  {(item.psychological_insights || item.technical_insights) && (
                    <div className="mb-4 space-y-3">
                      {item.psychological_insights && (
                        <div className="rounded-lg bg-blue-50 p-4">
                          <div className="mb-1 flex items-center gap-2 text-sm font-medium text-blue-700">
                            <Brain className="h-4 w-4" />
                            心理層面
                          </div>
                          <p className="line-clamp-3 text-sm text-gray-700">
                            {item.psychological_insights}
                          </p>
                        </div>
                      )}
                      {item.technical_insights && (
                        <div className="rounded-lg bg-green-50 p-4">
                          <div className="mb-1 flex items-center gap-2 text-sm font-medium text-green-700">
                            <Mountain className="h-4 w-4" />
                            技術層面
                          </div>
                          <p className="line-clamp-3 text-sm text-gray-700">
                            {item.technical_insights}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 完成故事摘要 */}
                  {item.completion_story && !item.psychological_insights && !item.technical_insights && (
                    <div className="mb-4">
                      <p className="line-clamp-3 text-gray-700">{item.completion_story}</p>
                    </div>
                  )}

                  {/* 互動資訊 */}
                  <div className="flex items-center justify-between border-t pt-4">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        {item.likes_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        {item.comments_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <LinkIcon className="h-4 w-4" />
                        {item.inspired_count || 0} 人也加入
                      </span>
                    </div>
                    <Link href={`/biography/profile/${item.biography_id}`}>
                      <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                        查看完整故事
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
