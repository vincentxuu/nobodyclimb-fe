'use client'

import React, { useState, useEffect, use, useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Loader2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import BackToTop from '@/components/ui/back-to-top'
import { RecommendedProfiles } from '@/components/biography/recommended-profiles'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { biographyService } from '@/lib/api/services'
import { Biography, BiographyAdjacent } from '@/lib/types'
import { useAuthStore } from '@/store/authStore'
import {
  BiographyV2,
  BiographyBackend,
  transformBackendToBiographyV2,
} from '@/lib/types/biography-v2'

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

// V2 展示組件
import { BiographyOneLiners } from '@/components/biography/display/BiographyOneLiners'
// TODO: 待開發相簿編輯功能後再啟用
// import { BiographyGallery } from '@/components/biography/display/BiographyGallery'

interface ProfileClientProps {
  params: Promise<{
    slug: string
  }>
}

/**
 * 人物誌詳情頁 - 章節式故事設計
 */
export default function ProfileClient({ params }: ProfileClientProps) {
  const { slug } = use(params)
  const [person, setPerson] = useState<Biography | null>(null)
  const [adjacent, setAdjacent] = useState<BiographyAdjacent | null>(null)
  const [loading, setLoading] = useState(true)
  const [followerCount, setFollowerCount] = useState(0)
  const { user } = useAuthStore()
  const isOwner = user?.id === person?.user_id

  // 將 person 轉換為 BiographyV2 格式，供新的展示組件使用
  const personV2: BiographyV2 | null = useMemo(() => {
    if (!person) return null
    try {
      // 後端 API 返回的資料實際上包含 V2 欄位（tags_data, one_liners_data 等）
      // 只是前端 Biography 類型沒有定義它們，所以需要強制轉換
      return transformBackendToBiographyV2(person as unknown as BiographyBackend)
    } catch (error) {
      console.error('Failed to transform biography to V2:', error)
      return null
    }
  }, [person])

  // 從 API 加載人物資料
  useEffect(() => {
    const loadPerson = async () => {
      setLoading(true)

      try {
        // 從 API 獲取（使用 slug）
        const response = await biographyService.getBiographyBySlug(slug)

        if (response.success && response.data) {
          const biographyData = response.data
          setPerson(biographyData)
          setFollowerCount(biographyData.follower_count || 0)
          setLoading(false)

          // 次要請求：非阻塞執行，不影響主要內容顯示
          // 記錄瀏覽次數（使用 id）
          biographyService.recordView(biographyData.id).catch((err) => {
            console.error('Failed to record view:', err)
          })

          // 獲取相鄰人物（用於上下篇導航，使用 id）
          biographyService
            .getAdjacentBiographies(biographyData.id)
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
  }, [slug])

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
        <div className="mb-4 flex items-center gap-2">
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

          {/* 返回編輯按鈕 - 僅本人可見 */}
          {isOwner && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Link href="/profile">
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 bg-brand-accent shadow-sm hover:bg-brand-accent/80"
                >
                  <Pencil size={16} />
                  <span>返回編輯</span>
                </Button>
              </Link>
            </motion.div>
          )}
        </div>
      </div>

      {/* 1. Hero Section - 封面與基本資訊 */}
      <HeroSection
        person={person}
        followerCount={followerCount}
        isOwner={isOwner}
        onFollowChange={(isFollowing) => {
          setFollowerCount((prev) => (isFollowing ? prev + 1 : Math.max(0, prev - 1)))
        }}
      />

      {/* 2. 快速了解 - 基本資訊卡片 + 關鍵字標籤 */}
      <QuickFactsSection person={personV2} />

      {/* 3. 關於我 - 一句話系列 */}
      {personV2 && personV2.id && (
        <section className="bg-[#F5F5F5]">
          <div className="container mx-auto max-w-5xl px-4">
            <BiographyOneLiners biographyId={personV2.id} />
          </div>
        </section>
      )}

      {/* 4. 精選故事 */}
      <FeaturedStoriesSection person={person} />

      {/* 5. Chapter 1: 相遇篇 */}
      {personV2?.id && <ChapterMeeting biographyId={personV2.id} />}

      {/* 6. Chapter 2: 意義篇 */}
      {personV2?.id && <ChapterMeaning biographyId={personV2.id} />}

      {/* 7. Chapter 3: 人生清單 */}
      <ChapterBucketList person={personV2} isOwner={isOwner} />

      {/* 8. Chapter 4: 給新手的話 */}
      {personV2?.id && <ChapterAdvice biographyId={personV2.id} />}

      {/* 9. 小故事（完整版） */}
      <CompleteStoriesSection person={person} isOwner={isOwner} />

      {/* 10. 攀岩足跡地圖 */}
      <ClimbingFootprintsSection person={person} />

      {/* TODO: 11. 攀岩日常 - 相簿展示（待開發相簿編輯功能後啟用）*/}

      {/* 上下篇導航 */}
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="flex justify-between">
          {adjacent?.previous ? (
            <Link href={`/biography/profile/${adjacent.previous.slug || adjacent.previous.id}`}>
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
            <Link href={`/biography/profile/${adjacent.next.slug || adjacent.next.id}`}>
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
          <RecommendedProfiles currentId={person.id} />

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

      {/* 訪客註冊引導 CTA - 僅未登入時顯示 */}
      {!user && (
        <div className="bg-[#1B1A1A] py-12">
          <div className="container mx-auto max-w-2xl px-4 text-center">
            <h3 className="mb-3 text-xl font-medium text-white md:text-2xl">
              你也有攀岩故事嗎？
            </h3>
            <p className="mb-6 text-sm text-gray-300 md:text-base">
              來寫寫你的小人物誌吧
            </p>
            <Link href="/auth/register">
              <Button className="h-11 bg-white px-8 text-[#1B1A1A] hover:bg-gray-100">
                立即註冊加入
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* 回到頂部按鈕 */}
      <BackToTop />
    </div>
  )
}
