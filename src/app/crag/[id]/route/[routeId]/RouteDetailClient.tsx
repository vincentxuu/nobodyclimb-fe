'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Instagram,
  Youtube,
  MapPin,
  Shield,
  Ruler,
  Mountain,
  User,
} from 'lucide-react'
import { CollapsibleBreadcrumb } from '@/components/ui/collapsible-breadcrumb'
import BackToTop from '@/components/ui/back-to-top'
import type { RouteDetailData } from '@/lib/crag-data'

interface RouteDetailClientProps {
  data: RouteDetailData
}

// 將 YouTube URL 轉換為嵌入 URL
function getYoutubeEmbedUrl(url: string): string {
  if (url.includes('youtube.com/embed/')) {
    return url
  }

  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/)
  if (shortMatch) {
    return `https://www.youtube.com/embed/${shortMatch[1]}`
  }

  const standardMatch = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/)
  if (standardMatch) {
    return `https://www.youtube.com/embed/${standardMatch[1]}`
  }

  return url
}

// 從 Instagram URL 提取貼文 ID
function getInstagramPostId(url: string): string | null {
  const match = url.match(/instagram\.com\/(?:p|reel)\/([a-zA-Z0-9_-]+)/)
  return match ? match[1] : null
}

export default function RouteDetailClient({ data }: RouteDetailClientProps) {
  const { route, crag, area, relatedRoutes } = data
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  const hasImages = route.images && route.images.length > 0
  const hasVideos = route.videos && route.videos.length > 0
  const hasYoutubeVideos = route.youtubeVideos && route.youtubeVideos.length > 0
  const hasInstagramPosts = route.instagramPosts && route.instagramPosts.length > 0

  // 建立麵包屑項目
  const breadcrumbItems: Array<{ label: string; href?: string }> = [
    { label: '首頁', href: '/' },
    { label: '岩場', href: '/crag' },
    { label: crag.name, href: `/crag/${crag.id}` },
  ]

  if (area) {
    breadcrumbItems.push({
      label: area.name,
      href: `/crag/${crag.id}/area/${area.id}`,
    })
  }

  breadcrumbItems.push({ label: route.name })

  return (
    <main className="min-h-full bg-gray-50">
      <div className="relative mx-auto px-4 py-4 lg:px-8 lg:py-8">
        {/* 隱藏式麵包屑導航 */}
        <div className="mb-4">
          <CollapsibleBreadcrumb items={breadcrumbItems} />
        </div>

        {/* 主要內容區 */}
        <div className="mb-12 rounded-lg bg-white p-6 shadow-sm md:p-8">
          {/* 標題區 */}
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#1B1A1A] md:text-3xl">{route.name}</h1>
              {route.englishName && route.englishName !== route.name && (
                <p className="mt-1 text-lg text-gray-500">{route.englishName}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full bg-yellow-100 px-4 py-1.5 text-sm font-semibold text-[#1B1A1A]">
                  {route.grade}
                </span>
                <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
                  <Mountain size={14} className="mr-1" />
                  {route.typeEn}
                </span>
              </div>
            </div>
            {area && (
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <MapPin size={14} />
                <Link
                  href={`/crag/${crag.id}/area/${area.id}`}
                  className="hover:text-[#1B1A1A] hover:underline"
                >
                  {area.name}
                </Link>
              </div>
            )}
          </div>

          {/* 照片輪播區 */}
          {hasImages && (
            <div className="mb-8">
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-200">
                <img
                  src={route.images[currentPhotoIndex]}
                  alt={`${route.name} 照片 ${currentPhotoIndex + 1}`}
                  className="h-full w-full object-cover"
                />
                {route.images.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setCurrentPhotoIndex((prev) =>
                          prev === 0 ? route.images.length - 1 : prev - 1
                        )
                      }
                      className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
                      aria-label="上一張照片"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPhotoIndex((prev) =>
                          prev === route.images.length - 1 ? 0 : prev + 1
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
                      aria-label="下一張照片"
                    >
                      <ChevronRight size={24} />
                    </button>
                    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                      {route.images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentPhotoIndex(index)}
                          className={`h-2.5 w-2.5 rounded-full transition ${
                            currentPhotoIndex === index
                              ? 'bg-[#FFE70C]'
                              : 'bg-white/60 hover:bg-white'
                          }`}
                          aria-label={`前往照片 ${index + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
              {route.images.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                  {route.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPhotoIndex(index)}
                      className={`h-16 w-24 flex-shrink-0 overflow-hidden rounded-md border-2 transition ${
                        currentPhotoIndex === index
                          ? 'border-[#FFE70C]'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${route.name} 縮圖 ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 基本資訊卡片 */}
          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {route.length && (
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Ruler size={16} />
                  長度
                </div>
                <div className="mt-1 text-lg font-semibold text-[#1B1A1A]">{route.length}</div>
              </div>
            )}
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Mountain size={16} />
                類型
              </div>
              <div className="mt-1 text-lg font-semibold text-[#1B1A1A]">{route.typeEn}</div>
            </div>
            {route.boltCount > 0 && (
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Shield size={16} />
                  Bolt 數量
                </div>
                <div className="mt-1 text-lg font-semibold text-[#1B1A1A]">{route.boltCount}</div>
              </div>
            )}
            {route.firstAscent && (
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <User size={16} />
                  首攀者
                </div>
                <div className="mt-1 text-lg font-semibold text-[#1B1A1A]">{route.firstAscent}</div>
                {route.firstAscentDate && (
                  <div className="text-xs text-gray-500">{route.firstAscentDate}</div>
                )}
              </div>
            )}
          </div>

          {/* 路線描述 */}
          {route.description && (
            <div className="mb-8">
              <h2 className="mb-3 border-l-4 border-[#FFE70C] pl-3 text-lg font-bold text-[#1B1A1A]">
                路線描述
              </h2>
              <p className="whitespace-pre-line text-gray-700">{route.description}</p>
            </div>
          )}

          {/* 保護裝備資訊 */}
          {route.protection && (
            <div className="mb-8">
              <h2 className="mb-3 border-l-4 border-[#FFE70C] pl-3 text-lg font-bold text-[#1B1A1A]">
                保護裝備
              </h2>
              <p className="whitespace-pre-line text-gray-700">{route.protection}</p>
            </div>
          )}

          {/* 攀登攻略/技巧 */}
          {route.tips && (
            <div className="mb-8">
              <h2 className="mb-3 border-l-4 border-[#FFE70C] pl-3 text-lg font-bold text-[#1B1A1A]">
                攀登攻略
              </h2>
              <p className="whitespace-pre-line text-gray-700">{route.tips}</p>
            </div>
          )}

          {/* 攀登影片 */}
          {hasVideos && (
            <div className="mb-8">
              <h2 className="mb-3 border-l-4 border-[#FFE70C] pl-3 text-lg font-bold text-[#1B1A1A]">
                攀登影片
              </h2>
              <div className="space-y-4">
                {route.videos.map((videoUrl, index) => (
                  <div key={index} className="aspect-video w-full">
                    <iframe
                      src={videoUrl}
                      className="h-full w-full rounded-lg"
                      title={`${route.name} 攀登影片 ${index + 1}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* YouTube 影片 */}
          {hasYoutubeVideos && (
            <div className="mb-8">
              <h2 className="mb-3 flex items-center border-l-4 border-[#FFE70C] pl-3 text-lg font-bold text-[#1B1A1A]">
                <Youtube size={20} className="mr-2 text-red-600" />
                YouTube 影片
              </h2>
              <div className="space-y-4">
                {route.youtubeVideos.map((videoUrl, index) => (
                  <div key={index} className="aspect-video w-full">
                    <iframe
                      src={getYoutubeEmbedUrl(videoUrl)}
                      className="h-full w-full rounded-lg"
                      title={`${route.name} YouTube 影片 ${index + 1}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instagram 貼文 */}
          {hasInstagramPosts && (
            <div className="mb-8">
              <h2 className="mb-3 flex items-center border-l-4 border-[#FFE70C] pl-3 text-lg font-bold text-[#1B1A1A]">
                <Instagram size={20} className="mr-2 text-pink-600" />
                Instagram 貼文
              </h2>
              <div className="space-y-4">
                {route.instagramPosts.map((postUrl, index) => {
                  const postId = getInstagramPostId(postUrl)
                  return (
                    <div
                      key={index}
                      className="overflow-hidden rounded-lg border border-gray-200"
                    >
                      {postId ? (
                        <iframe
                          src={`https://www.instagram.com/p/${postId}/embed`}
                          className="h-[500px] w-full"
                          title={`${route.name} Instagram 貼文 ${index + 1}`}
                          scrolling="no"
                          allowFullScreen
                        />
                      ) : (
                        <a
                          href={postUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center p-4 text-pink-600 hover:text-pink-700"
                        >
                          <Instagram size={20} className="mr-2" />
                          查看 Instagram 貼文
                          <ExternalLink size={14} className="ml-1" />
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 相關路線推薦 */}
          {relatedRoutes.length > 0 && (
            <div className="mt-12 border-t pt-8">
              <h2 className="mb-4 border-l-4 border-[#FFE70C] pl-3 text-lg font-bold text-[#1B1A1A]">
                同區域其他路線
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                {relatedRoutes.map((relRoute) => (
                  <Link
                    key={relRoute.id}
                    href={`/crag/${crag.id}/route/${relRoute.id}`}
                    prefetch={false}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition hover:border-[#FFE70C] hover:bg-gray-50"
                  >
                    <div>
                      <div className="font-medium text-[#1B1A1A]">{relRoute.name}</div>
                      <div className="text-sm text-gray-500">{relRoute.type}</div>
                    </div>
                    <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-[#1B1A1A]">
                      {relRoute.grade}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <BackToTop />
    </main>
  )
}
