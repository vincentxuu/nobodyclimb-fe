'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRightCircle, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { biographyService } from '@/lib/api/services'
import { Biography } from '@/lib/types'
import { calculateClimbingYears } from '@/lib/utils/biography'

// 卡片組件
interface BiographyCardProps {
  person: Biography
}

function BiographyCard({ person }: BiographyCardProps) {
  const imageUrl = person.avatar_url || '/photo/blog-right.jpg'
  const climbingYears = calculateClimbingYears(person.climbing_start_year)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-full"
    >
      <Link href={`/biography/profile/${person.id}`} className="block h-full">
        <Card className="h-full overflow-hidden transition-shadow duration-300 hover:shadow-md">
          <div className="relative h-[248px] overflow-hidden">
            <Image
              src={imageUrl}
              alt={person.name}
              fill
              className="object-cover transition-transform duration-500 hover:scale-105"
            />
          </div>

          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-medium text-[#1B1A1A]">{person.name}</h3>
                <p className="text-sm text-[#8E8C8C]">
                  攀岩年資 | {climbingYears !== null ? `${climbingYears}年` : '未知'}
                </p>
              </div>
              <ArrowRightCircle size={22} className="text-gray-400" />
            </div>

            <div className="space-y-2">
              <h4 className="text-base font-medium text-[#1B1A1A]">攀岩對你來說，是什麼樣的存在</h4>
              <p className="line-clamp-2 text-sm text-[#1B1A1A]">
                {person.climbing_meaning || '尚未填寫'}
              </p>
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
}

export function BiographyList({ searchTerm, onTotalChange }: BiographyListProps) {
  const [biographies, setBiographies] = useState<Biography[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 從 API 加載數據
  const loadBiographies = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await biographyService.getBiographies(1, 20, searchTerm || undefined)

      if (response.success) {
        setBiographies(response.data)
        onTotalChange?.(response.pagination.total, response.pagination.page < response.pagination.total_pages)
      } else {
        setError('無法載入人物誌資料')
        setBiographies([])
        onTotalChange?.(0, false)
      }
    } catch (err) {
      console.error('Failed to load biographies:', err)
      setError('載入人物誌時發生錯誤')
      setBiographies([])
      onTotalChange?.(0, false)
    } finally {
      setLoading(false)
    }
  }, [searchTerm, onTotalChange])

  // 搜索時重新加載
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadBiographies()
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [loadBiographies])

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
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {biographies.map((person) => (
        <BiographyCard key={person.id} person={person} />
      ))}
    </div>
  )
}
