'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRightCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { biographyService } from '@/lib/api/services'
import { Biography } from '@/lib/types'
import { useAuthStore } from '@/store/authStore'
import { isSvgUrl, getDefaultAvatarUrl } from '@/lib/utils/image'
import { getDisplayTags } from '@/lib/utils/biography'
import {
  getCachedHomeBiographies,
  cacheHomeBiographies,
  isHomeBiographiesCacheExpired,
  getDefaultQuote,
  selectCardContent,
  SelectedCardContent,
} from '@/lib/utils/biography-cache'

interface ClimberCardProps {
  person: Biography
  selectedContent: SelectedCardContent | null
}

// 卡片網格組件，預先計算每張卡片的內容
function BiographyGrid({ biographies }: { biographies: Biography[] }) {
  // 使用 reduce 避免 mutation，確保純函數
  const biographiesWithContent = useMemo(() => {
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

  return (
    <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
      {biographiesWithContent.map(({ person, content }) => (
        <ClimberCard key={person.id} person={person} selectedContent={content} />
      ))}
    </div>
  )
}

function ClimberCard({ person, selectedContent }: ClimberCardProps) {
  const climbingYears = person.climbing_start_year
    ? new Date().getFullYear() - parseInt(person.climbing_start_year)
    : null
  // 取得展示標籤
  const displayTags = getDisplayTags(person.tags_data)
  // 匿名人物誌顯示「匿名岩友」
  const isAnonymous = person.visibility === 'anonymous'
  const displayName = isAnonymous ? '匿名岩友' : person.name

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-full"
    >
      <Link href={`/biography/profile/${person.slug}`} className="block h-full">
        <Card className="h-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md">
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
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {displayTags.map((tag, index) => (
                        <span key={tag.id} className="text-xs text-[#6D6C6C] truncate">
                          {tag.label}{index < displayTags.length - 1 && <span className="mx-0.5">·</span>}
                        </span>
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

export function BiographySection() {
  const [biographies, setBiographies] = useState<Biography[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasFetched = useRef(false)
  const { isAuthenticated } = useAuthStore()

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
          <BiographyGrid biographies={biographies} />
        )}

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Link href="/biography" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="h-11 w-full border border-[#1B1A1A] px-8 text-base text-[#1B1A1A] hover:bg-[#DBD8D8] sm:w-auto"
            >
              認識更多小人物
            </Button>
          </Link>
          {!isAuthenticated && (
            <Link href="/auth/register" className="w-full sm:w-auto">
              <Button
                className="h-11 w-full bg-brand-accent/70 px-8 text-base text-[#1B1A1A] hover:bg-brand-accent sm:w-auto"
              >
                成為小人物
              </Button>
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
