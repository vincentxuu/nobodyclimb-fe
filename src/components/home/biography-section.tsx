'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRightCircle, Loader2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { biographyService } from '@/lib/api/services'
import { Biography } from '@/lib/types'
import { isSvgUrl } from '@/lib/utils/image'

// 緩存配置
const CACHE_KEY = 'nobodyclimb_home_biographies'
const CACHE_TTL = 5 * 60 * 1000 // 5 分鐘

interface CachedData {
  data: Biography[]
  timestamp: number
}

/**
 * 從 localStorage 獲取緩存的人物誌數據
 */
function getCachedBiographies(): Biography[] | null {
  if (typeof window === 'undefined') return null

  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null

    const { data }: CachedData = JSON.parse(cached)

    // 即使過期也返回數據（作為 stale 數據顯示）
    return data
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
 * 緩存人物誌數據到 localStorage
 */
function cacheBiographies(data: Biography[]): void {
  if (typeof window === 'undefined') return

  try {
    const cacheData: CachedData = {
      data,
      timestamp: Date.now(),
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
  } catch {
    // 忽略緩存錯誤
  }
}

function ClimberCard({ person }: { person: Biography }) {
  const climbingYears = person.climbing_start_year
    ? new Date().getFullYear() - parseInt(person.climbing_start_year)
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-full"
    >
      <Link href={`/biography/profile/${person.id}`} className="block h-full">
        <Card className="h-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md">
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

export function BiographySection() {
  const [biographies, setBiographies] = useState<Biography[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadBiographies = useCallback(async (useCache: boolean = true) => {
    // 優先使用緩存數據（stale-while-revalidate 模式）
    if (useCache) {
      const cached = getCachedBiographies()
      if (cached && cached.length > 0) {
        setBiographies(cached)
        setLoading(false)

        // 如果緩存未過期，不需要重新請求
        if (!isCacheExpired()) {
          return
        }
        // 緩存過期，在背景靜默更新
      }
    }

    try {
      const response = await biographyService.getBiographies(1, 3)
      if (response.success && response.data) {
        setBiographies(response.data)
        cacheBiographies(response.data)
      } else if (biographies.length === 0) {
        // 只有在沒有緩存數據時才顯示空狀態
        setBiographies([])
      }
    } catch (err) {
      console.error('Failed to load biographies:', err)
      // 如果有緩存數據，使用緩存數據而不顯示錯誤
      const cached = getCachedBiographies()
      if (cached && cached.length > 0) {
        setBiographies(cached)
      } else {
        setError('載入人物誌時發生錯誤')
        setBiographies([])
      }
    } finally {
      setLoading(false)
    }
  }, [biographies.length])

  useEffect(() => {
    loadBiographies()
  }, [loadBiographies])

  return (
    <section className="pt-8 pb-16 md:pt-12 md:pb-20">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-[#1B1A1A] md:text-[40px]">人物誌</h2>
          <p className="mt-4 text-base text-[#6D6C6C]">認識這些熱愛攀岩的小人物們</p>
        </div>

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#1B1A1A]" />
          </div>
        ) : error ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <p className="text-lg text-red-600">{error}</p>
          </div>
        ) : biographies.length === 0 ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <p className="text-lg text-[#6D6C6C]">目前沒有精選人物誌</p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {biographies.map((person) => (
              <ClimberCard key={person.id} person={person} />
            ))}
          </div>
        )}

        <div className="mt-10 flex justify-center">
          <Link href="/biography">
            <Button
              variant="outline"
              className="h-11 border border-[#1B1A1A] px-8 text-base text-[#1B1A1A] hover:bg-[#DBD8D8]"
            >
              認識更多小人物
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
