'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { CollapsibleBreadcrumb } from '@/components/ui/collapsible-breadcrumb'
import BackToTop from '@/components/ui/back-to-top'
import { RouteBasicInfo } from '@/components/crag/RouteBasicInfo'
import { RouteHeader } from '@/components/crag/RouteHeader'
import { RouteContentSections } from '@/components/crag/RouteContentSections'
import { routeLoadingManager } from '@/lib/route-loading-manager'
import { useRouter, useSearchParams } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { RATE_LIMIT_TOAST } from '@/lib/constants'
import type { RouteDetailData } from '@/lib/crag-data'

interface RouteDetailClientProps {
  data: RouteDetailData
}

export default function RouteDetailClient({ data }: RouteDetailClientProps) {
  const { route, crag, area, relatedRoutes } = data
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  const hasImages = route.images && route.images.length > 0

  // 保留當前的篩選參數
  const searchParamsString = searchParams.toString()
  const queryString = searchParamsString ? `?${searchParamsString}` : ''

  // 處理相關路線點擊
  const handleRelatedRouteClick = (routeId: string, e: React.MouseEvent) => {
    e.preventDefault()

    if (!routeLoadingManager.canLoadRoute(routeId)) {
      console.warn('Related route loading rate limited:', routeId)
      toast(RATE_LIMIT_TOAST)
      return
    }

    routeLoadingManager.startLoadingRoute(routeId)
    router.push(`/crag/${crag.id}/route/${routeId}${queryString}`)
  }

  // 標記路線載入完成
  useEffect(() => {
    routeLoadingManager.finishLoadingRoute(route.id)
  }, [route.id])

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
          <RouteHeader
            route={{
              name: route.name,
              englishName: route.englishName,
              grade: route.grade,
              type: route.typeEn,
              sector: route.sector,
              areaName: area?.name,
              cragName: crag.name,
            }}
            headingLevel="h1"
            className="mb-8"
          />

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

          {/* 基本資訊區塊 */}
          <RouteBasicInfo route={route} />

          {/* 社群內容區塊 */}
          <RouteContentSections route={route} />

          {/* 同區域其他路線 - 放在最後 */}
          {relatedRoutes.length > 0 && (
            <div className="mt-12 border-t pt-8">
              <h2 className="mb-4 border-l-4 border-[#FFE70C] pl-3 text-lg font-bold text-[#1B1A1A]">
                同區域其他路線
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                {relatedRoutes.map((relRoute) => (
                  <Link
                    key={relRoute.id}
                    href={`/crag/${crag.id}/route/${relRoute.id}${queryString}`}
                    prefetch={false}
                    onClick={(e) => handleRelatedRouteClick(relRoute.id, e)}
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
