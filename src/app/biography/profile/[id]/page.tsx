'use client'

import React, { useState, useEffect, use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import BackToTop from '@/components/ui/back-to-top'
import { RecommendedProfiles } from '@/components/biography/recommended-profiles'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { BiographyBucketList } from '@/components/bucket-list'
import { biographyService } from '@/lib/api/services'
import { Biography, BiographyAdjacent } from '@/lib/types'

interface ProfilePageProps {
  params: Promise<{
    id: string
  }>
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const { id } = use(params)
  const [person, setPerson] = useState<Biography | null>(null)
  const [adjacent, setAdjacent] = useState<BiographyAdjacent | null>(null)
  const [loading, setLoading] = useState(true)

  // 從 API 加載人物資料
  useEffect(() => {
    const loadPerson = async () => {
      setLoading(true)

      try {
        // 從 API 獲取
        const response = await biographyService.getBiographyById(id)

        if (response.success && response.data) {
          setPerson(response.data)

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
          <h1 className="mb-2 text-3xl font-medium text-[#1B1A1A]">攀岩小人物—{person.name}</h1>
          <p className="mb-6 text-sm text-gray-500">更新日期 {publishedDate}</p>

          <div className="relative mb-8 h-[360px] overflow-hidden">
            <Image src={imageUrl} alt={person.name} fill className="object-cover" />
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="mb-4 border-b border-[#dbd8d8] pb-2 text-xl font-medium">
                哪一年開始攀岩
              </h2>
              <p className="text-base text-[#1B1A1A]">
                {person.climbing_start_year || '尚未填寫'}
              </p>
            </div>

            <div>
              <h2 className="mb-4 border-b border-[#dbd8d8] pb-2 text-xl font-medium">
                平常出沒岩場
              </h2>
              <p className="text-base text-[#1B1A1A]">
                {person.frequent_locations || '尚未填寫'}
              </p>
            </div>

            <div>
              <h2 className="mb-4 border-b border-[#dbd8d8] pb-2 text-xl font-medium">
                喜歡的路線型態
              </h2>
              <p className="text-base text-[#1B1A1A]">
                {person.favorite_route_type || '尚未填寫'}
              </p>
            </div>

            <div>
              <h2 className="mb-4 border-b border-[#dbd8d8] pb-2 text-xl font-medium">
                你與攀岩的相遇
              </h2>
              <p className="text-base text-[#1B1A1A]">{person.climbing_origin || '尚未填寫'}</p>
            </div>

            <div>
              <h2 className="mb-4 border-b border-[#dbd8d8] pb-2 text-xl font-medium">
                攀岩對你來說，是什麼樣的存在
              </h2>
              <p className="text-base text-[#1B1A1A]">{person.climbing_meaning || '尚未填寫'}</p>
            </div>

            <div>
              <h2 className="mb-4 border-b border-[#dbd8d8] pb-2 text-xl font-medium">
                在攀岩世界裡，想做的人生清單有什麼
              </h2>
              <div className="relative mb-4 h-[360px] overflow-hidden">
                <Image
                  src={coverImageUrl}
                  alt={`${person.name} 人生清單`}
                  fill
                  className="object-cover"
                />
              </div>
              {/* 人生清單故事文字（舊有內容） */}
              {person.bucket_list_story && (
                <p className="mb-6 text-base text-[#1B1A1A]">{person.bucket_list_story}</p>
              )}
              {/* 結構化人生清單 */}
              <BiographyBucketList biographyId={person.id} />
            </div>

            <div>
              <h2 className="mb-4 border-b border-[#dbd8d8] pb-2 text-xl font-medium">
                給剛開始攀岩的自己
              </h2>
              <p className="text-base text-[#1B1A1A]">{person.advice_to_self || '尚未填寫'}</p>
            </div>
          </div>

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
