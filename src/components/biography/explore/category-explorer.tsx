'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Lightbulb,
  Heart,
  Mountain,
  Target,
  Dumbbell,
  Trophy,
  Plane,
  BookOpen,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { bucketListService } from '@/lib/api/services'
import { BucketListCategory, BUCKET_LIST_CATEGORIES } from '@/lib/types'

interface CategoryCount {
  category: BucketListCategory
  count: number
}

// 定義各分類的圖標和顏色
const categoryConfig: Record<
  BucketListCategory,
  { icon: React.ElementType; color: string; bgColor: string }
> = {
  outdoor_route: { icon: Mountain, color: 'text-green-600', bgColor: 'bg-green-100' },
  indoor_grade: { icon: Target, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  competition: { icon: Trophy, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  training: { icon: Dumbbell, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  adventure: { icon: Plane, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  skill: { icon: BookOpen, color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  injury_recovery: { icon: Heart, color: 'text-red-600', bgColor: 'bg-red-100' },
  other: { icon: Lightbulb, color: 'text-gray-600', bgColor: 'bg-gray-100' },
}

// 技巧經驗分享主題
const experienceTopics = [
  {
    id: 'fear',
    title: '克服恐懼經驗',
    description: '分享如何面對和克服攀岩中的恐懼',
    icon: Heart,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
  },
  {
    id: 'recovery',
    title: '受傷復原故事',
    description: '受傷後的復健與重返岩壁的歷程',
    icon: Heart,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  {
    id: 'experience',
    title: '攀登經驗分享',
    description: '難忘的攀登經歷與心得',
    icon: Mountain,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    id: 'training',
    title: '訓練心得',
    description: '有效的訓練方法與技巧',
    icon: Dumbbell,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
]

export function CategoryExplorer() {
  const [categoryCounts, setCategoryCounts] = useState<CategoryCount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCategoryCounts = async () => {
      setLoading(true)
      try {
        // 為每個分類獲取數量
        const counts: CategoryCount[] = []
        for (const cat of BUCKET_LIST_CATEGORIES) {
          try {
            const response = await bucketListService.getByCategory(cat.value, 1)
            if (response.success && response.data) {
              counts.push({
                category: cat.value,
                count: response.data.length,
              })
            }
          } catch {
            counts.push({ category: cat.value, count: 0 })
          }
        }
        setCategoryCounts(counts)
      } catch (err) {
        console.error('Failed to load category counts:', err)
      } finally {
        setLoading(false)
      }
    }

    loadCategoryCounts()
  }, [])

  const getCategoryLabel = (category: BucketListCategory) => {
    return BUCKET_LIST_CATEGORIES.find((c) => c.value === category)?.label || category
  }

  const getCategoryConfig = (category: BucketListCategory) => {
    return categoryConfig[category] || categoryConfig.other
  }

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1B1A1A]" />
      </div>
    )
  }

  return (
    <div className="space-y-12">
      {/* 技巧與經驗分享 */}
      <div>
        <div className="mb-6 flex items-center gap-2">
          <Lightbulb className="h-6 w-6 text-amber-500" />
          <h2 className="text-xl font-bold text-[#1B1A1A]">技巧與經驗分享</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {experienceTopics.map((topic, index) => {
            const Icon = topic.icon
            return (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Link href={`/biography/explore/topic/${topic.id}`}>
                  <Card className="h-full cursor-pointer transition-shadow duration-300 hover:shadow-md">
                    <CardContent className="p-5">
                      <div className={`mb-3 inline-flex rounded-lg p-2 ${topic.bgColor}`}>
                        <Icon className={`h-5 w-5 ${topic.color}`} />
                      </div>
                      <h3 className="mb-1 font-semibold text-[#1B1A1A]">{topic.title}</h3>
                      <p className="text-sm text-gray-500">{topic.description}</p>
                      <div className="mt-3 flex items-center gap-1 text-sm text-gray-600">
                        探索
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* 依目標分類探索 */}
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-6 w-6 text-indigo-500" />
            <h2 className="text-xl font-bold text-[#1B1A1A]">依目標分類探索</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          {BUCKET_LIST_CATEGORIES.map((cat, index) => {
            const config = getCategoryConfig(cat.value)
            const Icon = config.icon
            const countData = categoryCounts.find((c) => c.category === cat.value)

            return (
              <motion.div
                key={cat.value}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
              >
                <Link href={`/biography/explore/category/${cat.value}`}>
                  <Card className="h-full cursor-pointer text-center transition-shadow duration-300 hover:shadow-md">
                    <CardContent className="p-4">
                      <div
                        className={`mx-auto mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full ${config.bgColor}`}
                      >
                        <Icon className={`h-6 w-6 ${config.color}`} />
                      </div>
                      <h4 className="text-sm font-medium text-[#1B1A1A]">
                        {getCategoryLabel(cat.value)}
                      </h4>
                      {countData && countData.count > 0 && (
                        <p className="mt-1 text-xs text-gray-500">{countData.count} 個目標</p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
