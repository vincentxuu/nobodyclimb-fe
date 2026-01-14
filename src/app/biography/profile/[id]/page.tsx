'use client'

import React, { useState, useEffect, use, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Calendar,
  MapPin,
  Layers,
  TrendingUp,
  Brain,
  Users,
  Lightbulb,
  Compass,
  Heart,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import BackToTop from '@/components/ui/back-to-top'
import { RecommendedProfiles } from '@/components/biography/recommended-profiles'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { FollowButton } from '@/components/biography/follow-button'
import { BiographyLikeButton } from '@/components/biography/biography-like-button'
import { BiographyBucketList } from '@/components/bucket-list'
import { MediaSection } from '@/components/biography/media'
import { ClimbingLocationList } from '@/components/biography/climbing-location-card'
import { biographyService } from '@/lib/api/services'
import { Biography, BiographyAdjacent, ClimbingLocation } from '@/lib/types'
import { useAuthStore } from '@/store/authStore'
import {
  STORY_CATEGORIES,
  ADVANCED_STORY_QUESTIONS,
  calculateStoryProgress,
  StoryCategory,
} from '@/lib/constants/biography-stories'
import { cn } from '@/lib/utils'
import { calculateClimbingYears } from '@/lib/utils/biography'

interface ProfilePageProps {
  params: Promise<{
    id: string
  }>
}

/**
 * 分類圖標映射
 */
const CATEGORY_ICONS: Record<StoryCategory, React.ComponentType<{ className?: string }>> = {
  growth: TrendingUp,
  psychology: Brain,
  community: Users,
  practical: Lightbulb,
  dreams: Compass,
  life: Heart,
}

/**
 * 第一層：基本資訊區塊
 */
function BasicInfoSection({ person }: { person: Biography }) {
  const climbingYears = calculateClimbingYears(person.climbing_start_year)
  const locations = person.frequent_locations?.split(',').filter((l) => l.trim()) || []
  const routeTypes = person.favorite_route_type?.split(',').filter((t) => t.trim()) || []

  return (
    <div className="mb-8 rounded-xl bg-gray-50 p-6">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
        <Layers className="h-5 w-5 text-gray-500" />
        基本資訊
      </h2>
      <div className="grid gap-4 md:grid-cols-3">
        {/* 攀岩年資 */}
        <div className="flex items-start gap-3">
          <Calendar className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400" />
          <div>
            <p className="text-sm text-gray-500">開始攀岩</p>
            <p className="font-medium text-gray-900">
              {person.climbing_start_year ? (
                <>
                  {person.climbing_start_year} 年
                  {climbingYears !== null && (
                    <span className="ml-1 text-gray-500">（{climbingYears} 年）</span>
                  )}
                </>
              ) : (
                '尚未填寫'
              )}
            </p>
          </div>
        </div>

        {/* 常出沒地點 */}
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400" />
          <div>
            <p className="text-sm text-gray-500">平常出沒</p>
            {locations.length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-1">
                {locations.map((loc, i) => (
                  <span
                    key={`${loc.trim()}-${i}`}
                    className="rounded-full bg-white px-2 py-0.5 text-sm text-gray-700 shadow-sm"
                  >
                    {loc.trim()}
                  </span>
                ))}
              </div>
            ) : (
              <p className="font-medium text-gray-900">尚未填寫</p>
            )}
          </div>
        </div>

        {/* 路線型態 */}
        <div className="flex items-start gap-3">
          <Layers className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400" />
          <div>
            <p className="text-sm text-gray-500">喜歡的路線</p>
            {routeTypes.length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-1">
                {routeTypes.map((type, i) => (
                  <span
                    key={`${type.trim()}-${i}`}
                    className="rounded-full bg-white px-2 py-0.5 text-sm text-gray-700 shadow-sm"
                  >
                    {type.trim()}
                  </span>
                ))}
              </div>
            ) : (
              <p className="font-medium text-gray-900">尚未填寫</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * 單一故事項目（用於區塊內）
 */
function StoryItem({
  title,
  content,
}: {
  title: string
  content: string | null
}) {
  if (!content) return null

  return (
    <div className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0">
      <h3 className="mb-2 text-base font-medium text-[#1B1A1A]">{title}</h3>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">{content}</p>
    </div>
  )
}

/**
 * 進階故事分類區塊 - 直接顯示所有故事
 */
function AdvancedStoriesSection({ person }: { person: Biography }) {
  // 整理有內容的進階故事
  const storiesByCategory = useMemo(() => {
    const result: Record<StoryCategory, Array<{ field: string; title: string; content: string }>> =
      {
        growth: [],
        psychology: [],
        community: [],
        practical: [],
        dreams: [],
        life: [],
      }

    ADVANCED_STORY_QUESTIONS.forEach((question) => {
      const content = person[question.field as keyof Biography] as string | null
      if (content && content.trim()) {
        result[question.category].push({
          field: question.field,
          title: question.title,
          content: content,
        })
      }
    })

    return result
  }, [person])

  // 計算有內容的分類
  const categoriesWithContent = useMemo(() => {
    return STORY_CATEGORIES.filter((cat) => storiesByCategory[cat.id].length > 0)
  }, [storiesByCategory])

  if (categoriesWithContent.length === 0) return null

  return (
    <div className="space-y-6">
      {categoriesWithContent.map((category) => {
        const Icon = CATEGORY_ICONS[category.id]
        const stories = storiesByCategory[category.id]

        return (
          <div key={category.id} className="rounded-xl bg-gray-50 p-6">
            {/* 分類標題 */}
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Icon className={cn('h-5 w-5', category.color)} />
              {category.name}
            </h2>

            {/* 故事內容 */}
            <div className="space-y-4">
              {stories.map((story) => (
                <div
                  key={story.field}
                  className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0"
                >
                  <h3 className="mb-2 text-base font-medium text-[#1B1A1A]">{story.title}</h3>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
                    {story.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const { id } = use(params)
  const [person, setPerson] = useState<Biography | null>(null)
  const [adjacent, setAdjacent] = useState<BiographyAdjacent | null>(null)
  const [loading, setLoading] = useState(true)
  const [followerCount, setFollowerCount] = useState(0)
  const { user } = useAuthStore()
  const isOwner = user?.id === person?.user_id

  // 從 API 加載人物資料
  useEffect(() => {
    const loadPerson = async () => {
      setLoading(true)

      try {
        // 從 API 獲取
        const response = await biographyService.getBiographyById(id)

        if (response.success && response.data) {
          setPerson(response.data)
          setFollowerCount(response.data.follower_count || 0)

          // 獲取相鄰人物
          try {
            const adjacentResponse = await biographyService.getAdjacentBiographies(id)
            if (adjacentResponse.success && adjacentResponse.data) {
              setAdjacent(adjacentResponse.data)
            }
          } catch (err) {
            console.error('Failed to load adjacent biographies:', err)
            // 相鄰人物獲取失敗不影響主要內容
          }
        } else {
          setPerson(null)
        }
      } catch (err) {
        console.error('Failed to load biography:', err)
        setPerson(null)
      } finally {
        setLoading(false)
      }
    }

    loadPerson()
  }, [id])

  // 記錄瀏覽次數
  useEffect(() => {
    if (id) {
      biographyService.recordView(id).catch((err) => {
        console.error('Failed to record view:', err)
      })
    }
  }, [id])

  // 計算故事進度
  const storyProgress = useMemo(() => {
    if (!person) return null
    return calculateStoryProgress(person as unknown as Record<string, unknown>)
  }, [person])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page-content-bg">
        <Loader2 className="h-8 w-8 animate-spin text-[#1B1A1A]" />
      </div>
    )
  }

  if (!person) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-lg text-[#6D6C6C]">人物資料不存在</p>
        <Link href="/biography">
          <Button variant="outline" className="mt-4">
            返回人物誌
          </Button>
        </Link>
      </div>
    )
  }

  const imageUrl = person.avatar_url || '/photo/personleft.jpeg'
  const coverImageUrl = person.cover_image || '/photo/person-poto.jpg'
  const publishedDate = person.published_at
    ? new Date(person.published_at).toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    : person.created_at
      ? new Date(person.created_at).toLocaleDateString('zh-TW', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        })
      : '未知日期'

  return (
    <div className="min-h-screen bg-page-content-bg">
      <div className="container relative mx-auto px-4 pb-4 pt-20">
        <div className="mb-8">
          <Breadcrumb
            items={[
              { label: '首頁', href: '/' },
              { label: '人物誌', href: '/biography' },
              { label: person.name },
            ]}
          />
        </div>
        <div className="sticky left-0 top-0 z-30 mb-4 flex w-full items-center justify-between bg-page-content-bg py-3">
          <motion.div
            className="w-fit"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Link href="/biography">
              <Button
                variant="ghost"
                className="flex items-center gap-2 bg-white shadow-sm hover:bg-[#dbd8d8]"
              >
                <ArrowLeft size={16} />
                <span>人物誌</span>
              </Button>
            </Link>
          </motion.div>
        </div>

        <motion.div
          className="mx-auto mt-8 max-w-3xl bg-white p-6 md:p-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* 標題、統計與追蹤按鈕 */}
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h1 className="mb-2 text-3xl font-medium text-[#1B1A1A]">攀岩小人物—{person.name}</h1>
              <p className="text-sm text-gray-500">更新日期 {publishedDate}</p>
              <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {person.total_views || 0} 次瀏覽
                </span>
                {person.id && (
                  <BiographyLikeButton
                    biographyId={person.id}
                    initialCount={person.total_likes || 0}
                  />
                )}
                <span className="inline-flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {followerCount} 追蹤者
                </span>
              </div>
            </div>
            {!isOwner && person.id && (
              <FollowButton
                biographyId={person.id}
                onFollowChange={(isFollowing) => {
                  setFollowerCount((prev) => (isFollowing ? prev + 1 : Math.max(0, prev - 1)))
                }}
              />
            )}
          </div>

          {/* 大頭照 */}
          <div className="relative mb-8 h-[360px] overflow-hidden rounded-lg">
            <Image src={imageUrl} alt={person.name} fill className="object-cover" />
          </div>

          {/* 第一層：基本資訊 */}
          <BasicInfoSection person={person} />

          {/* 第二層：核心故事區塊 */}
          {(person.climbing_origin || person.climbing_meaning || person.advice_to_self) && (
            <div className="mb-6 rounded-xl bg-gray-50 p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Heart className="h-5 w-5 text-[#1B1A1A]" />
                攀岩故事
              </h2>
              <div className="space-y-4">
                <StoryItem title="你與攀岩的相遇" content={person.climbing_origin} />
                <StoryItem title="攀岩對你來說，是什麼樣的存在" content={person.climbing_meaning} />
                <StoryItem title="給剛開始攀岩的自己" content={person.advice_to_self} />
              </div>
            </div>
          )}

          {/* 進階故事（緊接在攀岩故事下方） */}
          <AdvancedStoriesSection person={person} />

          {/* 人生清單區塊 */}
          <div className="mb-6 rounded-xl bg-gray-50 p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Compass className="h-5 w-5 text-[#1B1A1A]" />
              攀岩人生清單
            </h2>
            {person.bucket_list_story && (
              <>
                <div className="relative mb-4 h-[280px] overflow-hidden rounded-lg">
                  <Image
                    src={coverImageUrl}
                    alt={`${person.name} 人生清單`}
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="mb-6 whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
                  {person.bucket_list_story}
                </p>
              </>
            )}
            {/* 結構化人生清單 */}
            <BiographyBucketList biographyId={person.id} />
          </div>

          {/* 攀岩足跡區塊 */}
          {person.climbing_locations && (() => {
            try {
              const locations: ClimbingLocation[] = JSON.parse(person.climbing_locations)
              if (locations.length > 0) {
                return (
                  <div className="mb-6 rounded-xl bg-gray-50 p-6">
                    <ClimbingLocationList locations={locations} maxDisplay={6} />
                  </div>
                )
              }
              return null
            } catch {
              return null
            }
          })()}

          {/* 媒體區塊 */}
          <MediaSection biographyId={id} isOwner={false} className="mb-6 rounded-xl bg-gray-50 p-6" />

          {/* 上下篇導航 */}
          <div className="mb-6 mt-12 flex justify-between">
            {adjacent?.previous ? (
              <Link href={`/biography/profile/${adjacent.previous.id}`}>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 border border-[#1B1A1A] text-[#1B1A1A] hover:bg-[#dbd8d8]"
                >
                  <ArrowLeft size={16} />
                  <span>上一篇</span>
                </Button>
              </Link>
            ) : (
              <div />
            )}

            {adjacent?.next ? (
              <Link href={`/biography/profile/${adjacent.next.id}`}>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 border border-[#1B1A1A] text-[#1B1A1A] hover:bg-[#dbd8d8]"
                >
                  <span>下一篇</span>
                  <ArrowRight size={16} />
                </Button>
              </Link>
            ) : (
              <div />
            )}
          </div>
        </motion.div>
      </div>

      <div className="mt-10 bg-[#dbd8d8] py-10">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-center text-2xl font-medium">推薦其他人物誌</h2>
          <RecommendedProfiles currentId={id} />

          <div className="mt-10 flex justify-center">
            <Link href="/biography">
              <Button
                variant="outline"
                className="h-11 border border-[#1B1A1A] px-8 text-[#1B1A1A] hover:bg-[#dbd8d8] hover:text-[#1B1A1A]"
              >
                更多小人物
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 回到頂部按鈕 */}
      <BackToTop />
    </div>
  )
}
