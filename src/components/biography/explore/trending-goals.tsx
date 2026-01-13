'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Flame, Users, Target, MapPin, Plus, Mountain, Home, Loader2, Check } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { bucketListService } from '@/lib/api/services'
import { BucketListItem, BUCKET_LIST_CATEGORIES } from '@/lib/types'
import { useAuthStore } from '@/store/authStore'

interface TrendingGoalsProps {
  searchTerm?: string
  filter?: string
}

interface TrendingItem extends BucketListItem {
  author_name?: string
  author_avatar?: string | null
  author_slug?: string
}

export function TrendingGoals({ searchTerm, filter }: TrendingGoalsProps) {
  const [items, setItems] = useState<TrendingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set())
  const [addingItems, setAddingItems] = useState<Set<string>>(new Set())
  const { isAuthenticated } = useAuthStore()

  const loadTrendingItems = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await bucketListService.getTrending(10)
      if (response.success && response.data) {
        let filteredData = response.data as TrendingItem[]

        // 依搜尋詞過濾
        if (searchTerm) {
          const search = searchTerm.toLowerCase()
          filteredData = filteredData.filter(
            (item) =>
              item.title.toLowerCase().includes(search) ||
              item.target_location?.toLowerCase().includes(search) ||
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
      console.error('Failed to load trending items:', err)
      setError('載入熱門目標時發生錯誤')
    } finally {
      setLoading(false)
    }
  }, [searchTerm, filter])

  useEffect(() => {
    loadTrendingItems()
  }, [loadTrendingItems])

  const handleAddToList = async (itemId: string) => {
    if (!isAuthenticated) {
      // 導向登入頁
      window.location.href = '/auth/login?redirect=/biography/explore'
      return
    }

    // 設置為正在加入狀態
    setAddingItems((prev) => new Set(prev).add(itemId))

    try {
      await bucketListService.referenceItem(itemId)
      // 成功後標記為已加入，並更新項目的 inspired_count
      setAddedItems((prev) => new Set(prev).add(itemId))
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, inspired_count: (item.inspired_count || 0) + 1 }
            : item
        )
      )
    } catch (err) {
      console.error('Failed to add to list:', err)
    } finally {
      // 移除正在加入狀態
      setAddingItems((prev) => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
    }
  }

  const getCategoryLabel = (category: string) => {
    return BUCKET_LIST_CATEGORIES.find((c) => c.value === category)?.label || category
  }

  const getCategoryIcon = (category: string) => {
    if (category === 'outdoor_route' || category === 'adventure') {
      return <Mountain className="h-3 w-3" />
    }
    return <Home className="h-3 w-3" />
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
        <Flame className="h-6 w-6 text-orange-500" />
        <h2 className="text-xl font-bold text-[#1B1A1A]">本週熱門目標</h2>
      </div>

      {items.length === 0 ? (
        <div className="flex min-h-[150px] items-center justify-center text-gray-500">
          {searchTerm ? `找不到符合「${searchTerm}」的熱門目標` : '目前沒有熱門目標'}
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="overflow-hidden transition-shadow duration-300 hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* 排名與標題 */}
                      <div className="mb-2 flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <h3 className="font-semibold text-[#1B1A1A]">{item.title}</h3>
                          {item.target_grade && (
                            <span className="text-sm text-gray-500">{item.target_grade}</span>
                          )}
                        </div>
                        {/* 分類標籤 */}
                        <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                          {getCategoryIcon(item.category)}
                          {getCategoryLabel(item.category)}
                        </span>
                      </div>

                      {/* 統計資訊 */}
                      <div className="mb-3 flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          被 {item.inspired_count || 0} 人加入清單
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          {item.likes_count || 0} 人已完成
                        </span>
                        {item.target_location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {item.target_location}
                          </span>
                        )}
                      </div>

                      {/* 作者資訊 */}
                      {item.author_name && (
                        <Link
                          href={`/biography/profile/${item.biography_id}`}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                        >
                          <div className="relative h-6 w-6 overflow-hidden rounded-full bg-gray-200">
                            {item.author_avatar ? (
                              <Image
                                src={item.author_avatar}
                                alt={item.author_name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">
                                {item.author_name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <span>
                            由 <span className="font-medium">{item.author_name}</span> 設立
                          </span>
                        </Link>
                      )}
                    </div>

                    {/* 加入按鈕 - 即時 UI 反饋 */}
                    <Button
                      variant={addedItems.has(item.id) ? 'primary' : 'outline'}
                      size="sm"
                      className={`ml-4 flex items-center gap-1 ${
                        addedItems.has(item.id)
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : ''
                      }`}
                      onClick={() => handleAddToList(item.id)}
                      disabled={addingItems.has(item.id) || addedItems.has(item.id)}
                    >
                      {addingItems.has(item.id) ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          加入中...
                        </>
                      ) : addedItems.has(item.id) ? (
                        <>
                          <Check className="h-4 w-4" />
                          已加入
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          加入我的清單
                        </>
                      )}
                    </Button>
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
