'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { biographyService } from '@/lib/api/services'
import { Biography } from '@/lib/types'
import { isSvgUrl, getDefaultAvatarUrl, getDefaultCoverUrl } from '@/lib/utils/image'
import { getDisplayTags, getDisplayNameForVisibility } from '@/lib/utils/biography'
import {
  getCachedHomeBiographies,
  cacheHomeBiographies,
  isHomeBiographiesCacheExpired,
  ONE_LINER_QUESTIONS,
} from '@/lib/utils/biography-cache'

interface ClimberCardProps {
  person: Biography
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

// 卡片網格組件
function BiographyGrid({ biographies }: { biographies: Biography[] }) {
  return (
    <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
      {biographies.map((person) => (
        <ClimberCard key={person.id} person={person} />
      ))}
    </div>
  )
}

function ClimberCard({ person }: ClimberCardProps) {
  // 取得展示標籤（最多 3 個）
  const displayTags = getDisplayTags(person.tags_data, 3)
  const displayName = getDisplayNameForVisibility(person.visibility, person.name)

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
            {person.title && (
              <p className="text-sm text-[#6D6C6C] line-clamp-1">「{person.title}」</p>
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
                  className={`inline-flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full ${tag.isCustom
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

export function BiographySection() {
  const [biographies, setBiographies] = useState<Biography[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasFetched = useRef(false)

  const loadBiographies = useCallback(async () => {
    // 防止重複請求
    if (hasFetched.current) return
    hasFetched.current = true

    // 優先使用緩存數據（stale-while-revalidate 模式）
    const cached = getCachedHomeBiographies()
    if (cached && cached.length > 0) {
      setBiographies(cached)
      setLoading(false)

      // 如果緩存未過期，不需要重新請求
      if (!isHomeBiographiesCacheExpired()) {
        return
      }
      // 緩存過期，在背景靜默更新
    }

    try {
      const response = await biographyService.getFeaturedBiographies(3)
      if (response.success && response.data) {
        setBiographies(response.data)
        cacheHomeBiographies(response.data)
      }
    } catch (err) {
      console.error('Failed to load biographies:', err)
      // 如果有緩存數據，使用緩存數據而不顯示錯誤
      if (!cached || cached.length === 0) {
        setError('載入人物誌時發生錯誤')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBiographies()
  }, [loadBiographies])

  return (
    <section className="pt-8 pb-16 md:pt-12 md:pb-20">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-[#1B1A1A] md:text-[40px]">寫紀錄</h2>
          <p className="mt-4 text-base text-[#6D6C6C]">建立你的攀岩人物誌，分享你的攀岩旅程</p>
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
          <BiographyGrid biographies={biographies} />
        )}

        {/* 雙重 CTA */}
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
          <Link href="/auth/register">
            <Button className="h-11 px-8 text-base bg-brand-accent/70 text-brand-dark hover:bg-brand-accent">
              建立我的人物誌
            </Button>
          </Link>
          <Link href="/biography?tab=people">
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
