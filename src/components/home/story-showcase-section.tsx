'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { HandMetal, Loader2, MapPin, Users, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { statsService, CommunityStats } from '@/lib/api/services'

/**
 * 首頁故事展示區
 * 設計目標：讓用戶覺得「原來我也可以寫」
 */
export function StoryShowcaseSection() {
  const [data, setData] = useState<CommunityStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasFetched = useRef(false)

  const loadCommunityStats = useCallback(async () => {
    if (hasFetched.current) return
    hasFetched.current = true

    try {
      const response = await statsService.getCommunityStats()
      if (response.success && response.data) {
        setData(response.data)
      }
    } catch (err) {
      console.error('Failed to load community stats:', err)
      setError('載入社群統計時發生錯誤')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCommunityStats()
  }, [loadCommunityStats])

  // 如果沒有資料，不顯示此區塊
  if (!loading && !data?.featuredStory && !data?.stats.totalStories) {
    return null
  }

  return (
    <section className="bg-white py-16 md:py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl"
        >
          {/* 區塊標題 */}
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-[#1B1A1A] md:text-3xl">
              他們也曾經覺得自己「沒什麼特別」
            </h2>
          </div>

          {loading ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#1B1A1A]" />
            </div>
          ) : error ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <p className="text-base text-[#8E8C8C]">{error}</p>
            </div>
          ) : (
            <>
              {/* 精選故事引言 */}
              {data?.featuredStory && (
                <div className="mb-8 rounded-xl bg-[#F5F4F4] p-6 md:p-8">
                  <blockquote className="mb-4 text-lg leading-relaxed text-[#1B1A1A] md:text-xl">
                    「{data.featuredStory.content}」
                  </blockquote>
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/biography/profile/${data.featuredStory.author.slug}`}
                      className="text-sm text-[#6D6C6C] hover:text-[#1B1A1A]"
                    >
                      — @{data.featuredStory.author.displayName}
                    </Link>
                    <div className="flex items-center gap-1 text-sm text-amber-600">
                      <HandMetal size={16} />
                      <span>我也是 {data.featuredStory.reactions.me_too}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 分隔線 */}
              <div className="mb-8 border-t border-gray-200" />

              {/* 社群統計 */}
              <div className="mb-8 space-y-3">
                <h3 className="mb-4 text-base font-medium text-[#1B1A1A]">這裡的岩友們</h3>
                <ul className="space-y-2 text-[#6D6C6C]">
                  {data?.stats.friendInvited && data.stats.friendInvited > 0 && (
                    <li className="flex items-center gap-2">
                      <Users size={16} className="text-[#8E8C8C]" />
                      <span>{data.stats.friendInvited} 人被朋友拉進攀岩坑</span>
                    </li>
                  )}
                  {data?.stats.topLocations && data.stats.topLocations.length > 0 && (
                    <li className="flex items-center gap-2">
                      <MapPin size={16} className="text-[#8E8C8C]" />
                      <span>最常出沒：{data.stats.topLocations.join('、')}</span>
                    </li>
                  )}
                  {data?.stats.totalStories && data.stats.totalStories > 0 && (
                    <li className="flex items-center gap-2">
                      <BookOpen size={16} className="text-[#8E8C8C]" />
                      <span>{data.stats.totalStories} 個攀岩故事正在累積中</span>
                    </li>
                  )}
                </ul>
              </div>

              {/* CTA 按鈕 */}
              <div className="text-center">
                <Link href="/auth/register">
                  <Button className="h-12 bg-[#1B1A1A] px-8 text-base text-white hover:bg-[#333]">
                    我也想分享我的故事
                  </Button>
                </Link>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </section>
  )
}
