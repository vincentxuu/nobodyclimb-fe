'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import BackToTop from '@/components/ui/back-to-top'
import { RecommendedProfiles } from '@/components/biography/recommended-profiles'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { biographyService } from '@/lib/api/services'
import { Biography, BiographyAdjacent } from '@/lib/types'
import { useAuthStore } from '@/store/authStore'

// 新的章節式組件
import {
  HeroSection,
  FeaturedStoriesSection,
  ChapterMeeting,
  ChapterMeaning,
  QuickFactsSection,
  ChapterBucketList,
  ClimbingFootprintsSection,
  CompleteStoriesSection,
  ChapterAdvice,
} from '@/components/biography/profile'

interface ProfileClientProps {
  params: Promise<{
    id: string
  }>
}

/**
 * 人物誌詳情頁 - 章節式故事設計
 */
export default function ProfileClient({ params }: ProfileClientProps) {
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
          setLoading(false)

          // 次要請求：非阻塞執行，不影響主要內容顯示
          // 記錄瀏覽次數
          biographyService.recordView(id).catch((err) => {
            console.error('Failed to record view:', err)
          })

          // 獲取相鄰人物（用於上下篇導航）
          biographyService
            .getAdjacentBiographies(id)
            .then((adjacentResponse) => {
              if (adjacentResponse.success && adjacentResponse.data) {
                setAdjacent(adjacentResponse.data)
              }
            })
            .catch((err) => {
              console.error('Failed to load adjacent biographies:', err)
            })
        } else {
          setPerson(null)
          setLoading(false)
        }
      } catch (err) {
        console.error('Failed to load biography:', err)
        setPerson(null)
        setLoading(false)
      }
    }

    loadPerson()
  }, [id])

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

  return (
    <div className="min-h-screen bg-page-content-bg">
      {/* 頂部導航區 */}
      <div className="container relative mx-auto px-4 pb-4 pt-4 md:pt-8">
        {/* 麵包屑導航 - 手機版隱藏 */}
        <div className="mb-4 md:mb-8">
          <Breadcrumb
            items={[
              { label: '首頁', href: '/' },
              { label: '人物誌', href: '/biography' },
              { label: person.name },
            ]}
            hideOnMobile
          />
        </div>

        {/* 返回按鈕 */}
        <div className="mb-4">
          <motion.div
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
      </div>

      {/* 1. Hero Section - 極簡標題區 */}
      <HeroSection
        person={person}
        followerCount={followerCount}
        isOwner={isOwner}
        onFollowChange={(isFollowing) => {
          setFollowerCount((prev) => (isFollowing ? prev + 1 : Math.max(0, prev - 1)))
        }}
      />

      {/* 2. 精選故事 */}
      <FeaturedStoriesSection person={person} />

      {/* 3. Chapter 1: 相遇篇 */}
      <ChapterMeeting person={person} />

      {/* 4. Chapter 2: 意義篇 */}
      <ChapterMeaning person={person} />

      {/* 5. Quick Facts - 快速了解 */}
      <QuickFactsSection person={person} />

      {/* 6. Chapter 3: 人生清單 */}
      <ChapterBucketList person={person} isOwner={isOwner} />

      {/* 7. Gallery: 攀岩足跡地圖 */}
      <ClimbingFootprintsSection person={person} />

      {/* 8. 小故事（完整版） */}
      <CompleteStoriesSection person={person} isOwner={isOwner} />

      {/* 9. Chapter 4: 給新手的話 */}
      <ChapterAdvice person={person} />

      {/* 上下篇導航 */}
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="flex justify-between">
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
      </div>

      {/* 推薦其他人物誌 */}
      <div className="bg-[#dbd8d8] py-10">
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
