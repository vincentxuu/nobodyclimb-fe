'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { MapPin, ArrowLeft, Clock, Phone, CloudRain, ChevronUp, Loader2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PlaceholderImage from '@/components/ui/placeholder-image'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import {
  getGymById,
  getAdjacentGyms,
  getRelatedGyms,
  type GymDetailData,
  type GymListItem,
} from '@/lib/gym-data'

export default function GymDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [gym, setGym] = useState<GymDetailData | null>(null)
  const [adjacentGyms, setAdjacentGyms] = useState<{ prev: GymListItem | null; next: GymListItem | null }>({
    prev: null,
    next: null,
  })
  const [relatedGyms, setRelatedGyms] = useState<GymListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 載入岩館資料
  useEffect(() => {
    const fetchGymData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [gymData, adjacent, related] = await Promise.all([
          getGymById(id),
          getAdjacentGyms(id),
          getRelatedGyms(id, 3),
        ])

        if (!gymData) {
          setError('找不到這間岩館')
          return
        }

        setGym(gymData)
        setAdjacentGyms(adjacent)
        setRelatedGyms(related)
      } catch (err) {
        console.error('Error fetching gym data:', err)
        setError('無法載入岩館資料，請稍後再試')
      } finally {
        setLoading(false)
      }
    }

    fetchGymData()
  }, [id])

  // 監聽滾動事件
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setShowBackToTop(true)
      } else {
        setShowBackToTop(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility)
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  // 回到頂部
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  // 格式化營業時間顯示
  const formatOpeningHours = (hours: GymDetailData['openingHours']) => {
    const days = [
      { key: 'monday', label: '週一' },
      { key: 'tuesday', label: '週二' },
      { key: 'wednesday', label: '週三' },
      { key: 'thursday', label: '週四' },
      { key: 'friday', label: '週五' },
      { key: 'saturday', label: '週六' },
      { key: 'sunday', label: '週日' },
    ]

    return days.map((day) => ({
      label: day.label,
      time: hours[day.key as keyof typeof hours] || '休息',
    }))
  }

  // 格式化價格顯示
  const formatPricing = (pricing: GymDetailData['pricing']) => {
    const items: string[] = []

    if (pricing.singleEntry) {
      items.push(`平日 $${pricing.singleEntry.weekday}`)
      items.push(`假日 $${pricing.singleEntry.weekend}`)
      if (pricing.singleEntry.twilight) {
        items.push(`星光票 $${pricing.singleEntry.twilight}`)
      }
      if (pricing.singleEntry.student) {
        items.push(`學生 $${pricing.singleEntry.student}`)
      }
    }

    return items.join('\n')
  }

  // 格式化租借價格
  const formatRental = (rental: GymDetailData['pricing']['rental']) => {
    const items: string[] = []
    items.push(`岩鞋租借 $${rental.shoes}`)
    items.push(`粉袋租借 $${rental.chalkBag}`)
    if (rental.harness) {
      items.push(`吊帶租借 $${rental.harness}`)
    }
    return items.join('\n')
  }

  // 載入中狀態
  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto flex items-center justify-center px-4 py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">載入中...</span>
        </div>
      </main>
    )
  }

  // 錯誤狀態
  if (error || !gym) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="mb-4 text-lg text-red-500">{error || '找不到這間岩館'}</p>
          <Link href="/gym">
            <Button variant="outline">返回岩館列表</Button>
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container relative mx-auto px-4 pt-20">
        <div className="mb-8">
          <Breadcrumb
            items={[
              { label: '首頁', href: '/' },
              { label: '岩館', href: '/gym' },
              { label: gym.name },
            ]}
          />
        </div>
        <div className="sticky left-0 top-0 z-30 mb-4 w-full bg-gray-50 py-3">
          <motion.div
            className="w-fit"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Link href="/gym">
              <Button
                variant="ghost"
                className="flex items-center gap-2 bg-white shadow-sm hover:bg-gray-200"
              >
                <ArrowLeft size={16} />
                <span>岩場介紹</span>
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* 主要內容區 */}
        <div className="mb-12 mt-4 rounded-lg bg-white p-8 shadow-sm">
          {/* 照片展示區 */}
          <div className="mb-8">
            {/* 大圖 */}
            <div className="relative mb-2 h-96 w-full overflow-hidden rounded-lg">
              <PlaceholderImage text={gym.name} bgColor="#f8f9fa" />
            </div>

            {/* 照片縮略圖區 */}
            {gym.images && gym.images.length > 0 && (
              <div className="flex flex-nowrap gap-2 overflow-x-auto pb-2">
                {gym.images.map((photo, index) => (
                  <div
                    key={index}
                    className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md"
                  >
                    <PlaceholderImage
                      text={`照片 ${index + 1}`}
                      bgColor="#f0f1f3"
                      textColor="#6c757d"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 標題和類型 */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-medium">{gym.name}</h1>
              {gym.nameEn && gym.nameEn !== gym.name && (
                <p className="mt-1 text-lg text-gray-500">{gym.nameEn}</p>
              )}
            </div>
            <span className="rounded bg-orange-100 px-3 py-1 text-sm text-orange-600">
              {gym.typeLabel}
            </span>
          </div>

          {/* 評分和設施 */}
          <div className="mb-8 flex flex-wrap items-center gap-4">
            {gym.rating > 0 && (
              <span className="text-lg text-yellow-500">★ {gym.rating.toFixed(1)}</span>
            )}
            <div className="flex flex-wrap gap-2">
              {gym.facilities.map((facility, index) => (
                <span
                  key={index}
                  className="rounded bg-gray-100 px-2 py-1 text-sm text-gray-600"
                >
                  {facility}
                </span>
              ))}
            </div>
          </div>

          {/* 場地介紹 */}
          <div className="mb-8">
            <div className="mb-1">
              <h2 className="text-lg font-medium text-orange-500">場地介紹</h2>
              <div className="h-px w-full bg-gray-200"></div>
            </div>
            <div className="mt-4 whitespace-pre-line text-base">{gym.description}</div>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              {/* 收費方式 */}
              <div className="mb-8">
                <div className="mb-1">
                  <h2 className="text-lg font-medium text-orange-500">收費方式</h2>
                  <div className="h-px w-full bg-gray-200"></div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="text-base font-medium">入場費</div>
                  <div className="whitespace-pre-line text-base text-gray-700">
                    {formatPricing(gym.pricing)}
                  </div>
                  {gym.pricing.notes && (
                    <div className="text-sm text-gray-500">{gym.pricing.notes}</div>
                  )}
                  <div className="mt-4 text-base font-medium">裝備租借</div>
                  <div className="whitespace-pre-line text-base text-gray-700">
                    {formatRental(gym.pricing.rental)}
                  </div>
                </div>
              </div>
            </div>

            <div>
              {/* 交通方式 */}
              <div className="mb-6">
                <div className="mb-1">
                  <h2 className="text-lg font-medium text-orange-500">交通方式</h2>
                  <div className="h-px w-full bg-gray-200"></div>
                </div>
                <div className="mt-4">
                  <div className="mb-2 flex items-center">
                    <MapPin size={16} className="mr-2 text-gray-500" />
                    <p className="text-base text-gray-500">{gym.location.address}</p>
                  </div>
                  <div className="space-y-1 text-base">
                    {gym.transportation.mrt && <p>🚇 {gym.transportation.mrt}</p>}
                    {gym.transportation.train && <p>🚃 {gym.transportation.train}</p>}
                    {gym.transportation.bus && <p>🚌 {gym.transportation.bus}</p>}
                    {gym.transportation.parking && <p>🅿️ {gym.transportation.parking}</p>}
                  </div>
                </div>
              </div>

              {/* 營業時間 */}
              <div className="mb-6">
                <div className="mb-1">
                  <h2 className="text-lg font-medium text-orange-500">營業時間</h2>
                  <div className="h-px w-full bg-gray-200"></div>
                </div>
                <div className="mt-4 space-y-1">
                  {formatOpeningHours(gym.openingHours).map((day, index) => (
                    <div key={index} className="flex justify-between text-base">
                      <span className="text-gray-600">{day.label}</span>
                      <span className={day.time === '公休' ? 'text-red-500' : 'text-gray-900'}>
                        {day.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 社群平台 */}
              <div className="mb-6">
                <div className="mb-1">
                  <h2 className="text-lg font-medium text-orange-500">聯絡資訊</h2>
                  <div className="h-px w-full bg-gray-200"></div>
                </div>
                <div className="mt-4 space-y-2 text-base">
                  {gym.contact.phone && (
                    <div className="flex items-center">
                      <Phone size={16} className="mr-2 text-gray-500" />
                      <a href={`tel:${gym.contact.phone}`} className="text-blue-600 hover:underline">
                        {gym.contact.phone}
                      </a>
                    </div>
                  )}
                  {gym.contact.facebook && (
                    <div className="flex items-center text-gray-600">
                      <span className="mr-2">📘</span>
                      {gym.contact.facebookUrl ? (
                        <a
                          href={gym.contact.facebookUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {gym.contact.facebook}
                        </a>
                      ) : (
                        <span>{gym.contact.facebook}</span>
                      )}
                    </div>
                  )}
                  {gym.contact.instagram && (
                    <div className="flex items-center text-gray-600">
                      <span className="mr-2">📷</span>
                      {gym.contact.instagramUrl ? (
                        <a
                          href={gym.contact.instagramUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          @{gym.contact.instagram}
                        </a>
                      ) : (
                        <span>@{gym.contact.instagram}</span>
                      )}
                    </div>
                  )}
                  {gym.contact.youtube && (
                    <div className="flex items-center">
                      <span className="mr-2">🎬</span>
                      <a
                        href={gym.contact.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        YouTube 影片介紹
                      </a>
                    </div>
                  )}
                  {gym.contact.website && (
                    <div className="flex items-center">
                      <ExternalLink size={16} className="mr-2 text-gray-500" />
                      <a
                        href={gym.contact.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        官方網站
                      </a>
                    </div>
                  )}
                  {gym.contact.line && (
                    <div className="flex items-center text-gray-600">
                      <span className="mr-2">💬</span>
                      <span>LINE: {gym.contact.line}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 注意事項 */}
          {gym.notes && (
            <div className="mb-10">
              <div className="mb-1">
                <h2 className="text-lg font-medium text-orange-500">注意事項</h2>
                <div className="h-px w-full bg-gray-200"></div>
              </div>
              <div className="mt-4 whitespace-pre-line text-base">{gym.notes}</div>
            </div>
          )}

          {/* 上一篇/下一篇 */}
          <div className="grid grid-cols-1 gap-8 border-t border-gray-200 pt-6 md:grid-cols-2">
            {adjacentGyms.prev && (
              <Link
                href={`/gym/${adjacentGyms.prev.id}`}
                className="block rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
              >
                <div className="mb-3 flex items-center">
                  <ArrowLeft size={16} className="mr-2 text-gray-500" />
                  <span className="text-lg text-gray-500">上一篇</span>
                </div>
                <div>
                  <p className="text-base text-gray-700">{adjacentGyms.prev.name}</p>
                  {adjacentGyms.prev.nameEn && adjacentGyms.prev.nameEn !== adjacentGyms.prev.name && (
                    <p className="text-sm text-gray-500">{adjacentGyms.prev.nameEn}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-400">{adjacentGyms.prev.location}</p>
                </div>
              </Link>
            )}

            {adjacentGyms.next && (
              <Link
                href={`/gym/${adjacentGyms.next.id}`}
                className="block rounded-lg border border-gray-200 p-4 text-right hover:bg-gray-50"
              >
                <div className="mb-3 flex items-center justify-end">
                  <span className="text-lg text-gray-500">下一篇</span>
                  <ArrowLeft size={16} className="ml-2 rotate-180 transform text-gray-500" />
                </div>
                <div>
                  <p className="text-base text-gray-700">{adjacentGyms.next.name}</p>
                  {adjacentGyms.next.nameEn && adjacentGyms.next.nameEn !== adjacentGyms.next.name && (
                    <p className="text-sm text-gray-500">{adjacentGyms.next.nameEn}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-400">{adjacentGyms.next.location}</p>
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* 其他岩場 */}
        {relatedGyms.length > 0 && (
          <div className="mb-12">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-medium">其他岩場</h2>
              <Link
                href="/gym"
                className="rounded border border-gray-800 px-8 py-2 text-gray-800 transition hover:bg-gray-100"
              >
                更多岩場
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {relatedGyms.map((relatedGym) => (
                <Link
                  href={`/gym/${relatedGym.id}`}
                  key={relatedGym.id}
                  className="overflow-hidden rounded-lg bg-white shadow-sm transition-shadow hover:shadow"
                >
                  <div className="relative h-48">
                    <PlaceholderImage text={relatedGym.name} bgColor="#f8f9fa" />
                  </div>
                  <div className="p-4">
                    <h3 className="text-base font-medium">{relatedGym.name}</h3>
                    {relatedGym.nameEn && relatedGym.nameEn !== relatedGym.name && (
                      <p className="text-sm text-gray-500">{relatedGym.nameEn}</p>
                    )}
                    <div className="mt-2 flex items-center">
                      <MapPin size={14} className="mr-1 text-gray-500" />
                      <span className="text-sm text-gray-500">{relatedGym.location}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 回到頂部按鈕 */}
      {showBackToTop && (
        <motion.button
          className="fixed bottom-6 right-4 z-20 rounded-full bg-white p-2 shadow-md hover:bg-gray-200 md:bottom-10 md:right-8 md:p-3"
          onClick={scrollToTop}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          aria-label="回到頂部"
        >
          <ChevronUp size={20} className="md:h-6 md:w-6" />
        </motion.button>
      )}
    </main>
  )
}
