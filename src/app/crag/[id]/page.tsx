'use client'

import React, { useState, use, useMemo } from 'react'
import PlaceholderImage from '@/components/ui/placeholder-image'
import Link from 'next/link'
import { ArrowLeft, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import BackToTop from '@/components/ui/back-to-top'
import { CragAreaSection } from '@/components/crag/area-section'
import { CragRouteSection } from '@/components/crag/route-section'
import { WeatherDisplay } from '@/components/shared/weather-display'
import { TrafficCamerasCard } from '@/components/crag/traffic-cameras-card'
import { YouTubeLiveCard } from '@/components/crag/youtube-live-card'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import * as Tabs from '@radix-ui/react-tabs'
import { getCragDetailData } from '@/lib/crag-data'

export default function CragDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [activeTab, setActiveTab] = useState('intro')
  const [selectedAreaFilter] = useState<string>('all')

  // 從資料服務層讀取岩場資料
  const currentCrag = getCragDetailData(id)

  // 建立區域名稱到區域 ID 的對照表
  const areaIdMap = useMemo(() => {
    if (!currentCrag) return {}
    return currentCrag.areas.reduce(
      (acc, area) => {
        acc[area.name] = area.id
        return acc
      },
      {} as Record<string, string>
    )
  }, [currentCrag])

  if (!currentCrag) {
    return <div>Crag not found</div>
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container relative mx-auto px-4 pt-20">
        <div className="mb-8">
          <Breadcrumb
            items={[
              { label: '首頁', href: '/' },
              { label: '岩場', href: '/crag' },
              { label: currentCrag.name },
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
            <Link href="/crag">
              <Button
                variant="ghost"
                className="flex items-center gap-2 bg-white shadow-sm hover:bg-gray-200"
              >
                <ArrowLeft size={16} />
                <span>岩場列表</span>
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
              <PlaceholderImage
                text={`${currentCrag.name} 大型場景圖`}
                bgColor="#333"
                textColor="#fff"
              />
            </div>

            {/* 照片縮略圖區 */}
            <div className="flex flex-nowrap gap-2 overflow-x-auto pb-2">
              {currentCrag.images.map((photo, index) => (
                <div
                  key={index}
                  className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md"
                >
                  <PlaceholderImage text={`照片 ${index + 1}`} bgColor="#444" textColor="#fff" />
                </div>
              ))}
            </div>
          </div>

          {/* 標題與位置 */}
          <div className="mb-8">
            <h1 className="text-3xl font-medium">{currentCrag.name}</h1>
            <p className="mb-2 text-lg text-gray-600">{currentCrag.englishName}</p>
            <div className="flex items-center text-gray-500">
              <MapPin size={16} className="mr-1" />
              <span>{currentCrag.location}</span>
            </div>
          </div>

          {/* 岩場介紹 - 使用標籤頁 */}
          <div className="mb-8">
            <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="w-full">
              <Tabs.List className="mb-6 flex border-b border-gray-200">
                <Tabs.Trigger
                  value="intro"
                  className="relative px-8 py-3 text-sm font-medium text-gray-500 outline-none transition-colors hover:text-gray-700 data-[state=active]:font-semibold data-[state=active]:text-[#1B1A1A] data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:rounded-t-full data-[state=active]:after:bg-[#FFE70C]"
                >
                  岩場介紹
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="areas"
                  className="relative px-8 py-3 text-sm font-medium text-gray-500 outline-none transition-colors hover:text-gray-700 data-[state=active]:font-semibold data-[state=active]:text-[#1B1A1A] data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:rounded-t-full data-[state=active]:after:bg-[#FFE70C]"
                >
                  區域詳情
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="routes"
                  className="relative px-8 py-3 text-sm font-medium text-gray-500 outline-none transition-colors hover:text-gray-700 data-[state=active]:font-semibold data-[state=active]:text-[#1B1A1A] data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:rounded-t-full data-[state=active]:after:bg-[#FFE70C]"
                >
                  路線資訊
                </Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="intro">
                <div className="mb-6">
                  <div className="mb-1">
                    <h2 className="text-lg font-medium text-orange-500">岩場介紹</h2>
                    <div className="h-px w-full bg-gray-200"></div>
                  </div>
                  <div className="mt-4 whitespace-pre-line text-base">
                    {currentCrag.description}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div>
                    {/* 岩場基本資訊 */}
                    <div className="mb-6">
                      <div className="mb-1">
                        <h2 className="text-lg font-medium text-orange-500">岩場基本資訊</h2>
                        <div className="h-px w-full bg-gray-200"></div>
                      </div>
                      <div className="mt-4 space-y-3">
                        <div className="flex">
                          <span className="w-28 text-gray-500">岩場類型：</span>
                          <span>{currentCrag.type}</span>
                        </div>
                        <div className="flex">
                          <span className="w-28 text-gray-500">岩石類型：</span>
                          <span>{currentCrag.rockType}</span>
                        </div>
                        <div className="flex">
                          <span className="w-28 text-gray-500">路線數量：</span>
                          <span>~{currentCrag.routes}</span>
                        </div>
                        <div className="flex">
                          <span className="w-28 text-gray-500">難度範圍：</span>
                          <span>{currentCrag.difficulty}</span>
                        </div>
                        <div className="flex">
                          <span className="w-28 text-gray-500">岩壁高度：</span>
                          <span>{currentCrag.height}</span>
                        </div>
                        <div className="flex">
                          <span className="w-28 text-gray-500">步行時間：</span>
                          <span>{currentCrag.approach}</span>
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
                      <div className="mt-4 space-y-3">
                        {currentCrag.transportation.map((item, index) => (
                          <div key={index} className="flex">
                            <span className="w-20 text-gray-500">{item.type}：</span>
                            <span className="flex-1">{item.description}</span>
                          </div>
                        ))}
                        <div className="flex pt-2">
                          <span className="w-20 text-gray-500">停車：</span>
                          <span className="flex-1">{currentCrag.parking}</span>
                        </div>
                      </div>
                    </div>

                    {/* 岩場位置地圖 */}
                    <div className="mb-6">
                      <div className="mb-1">
                        <h2 className="text-lg font-medium text-orange-500">岩場位置</h2>
                        <div className="h-px w-full bg-gray-200"></div>
                      </div>
                      {currentCrag.geoCoordinates.latitude && currentCrag.geoCoordinates.longitude ? (
                        <div className="mt-4 overflow-hidden rounded-lg">
                          <iframe
                            src={`https://www.google.com/maps?q=${currentCrag.geoCoordinates.latitude},${currentCrag.geoCoordinates.longitude}&z=15&output=embed`}
                            width="100%"
                            height="250"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title={`${currentCrag.name} 地圖`}
                          />
                        </div>
                      ) : (
                        <div className="mt-4 flex h-48 items-center justify-center rounded-lg bg-gray-200">
                          <span className="text-gray-500">地圖資訊不可用</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 岩場設施 */}
                <div className="mb-6">
                  <div className="mb-1">
                    <h2 className="text-lg font-medium text-orange-500">岩場設施</h2>
                    <div className="h-px w-full bg-gray-200"></div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {currentCrag.amenities.map((item, index) => (
                      <span
                        key={index}
                        className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 天氣預報資訊 */}
                <div className="mb-6">
                  <div className="mb-1">
                    <h2 className="text-lg font-medium text-orange-500">天氣預報</h2>
                    <div className="h-px w-full bg-gray-200"></div>
                  </div>
                  <div className="mt-4">
                    <WeatherDisplay
                      location={currentCrag.weatherLocation}
                      latitude={currentCrag.geoCoordinates.latitude}
                      longitude={currentCrag.geoCoordinates.longitude}
                      showForecast={true}
                    />
                  </div>
                </div>

                {/* 即時路況與影像 - 路況攝影機基於經緯度，YouTube 直播需要有 liveVideoId */}
                <div className="mb-6">
                  <div className="mb-1">
                    <h2 className="text-lg font-medium text-orange-500">即時路況與影像</h2>
                    <div className="h-px w-full bg-gray-200"></div>
                  </div>
                  <div className={`mt-4 grid grid-cols-1 gap-6 ${currentCrag.liveVideoId ? 'lg:grid-cols-2' : ''}`}>
                    <TrafficCamerasCard
                      latitude={currentCrag.geoCoordinates.latitude}
                      longitude={currentCrag.geoCoordinates.longitude}
                    />
                    {currentCrag.liveVideoId && (
                      <YouTubeLiveCard
                        videoId={currentCrag.liveVideoId}
                        title={currentCrag.liveVideoTitle}
                        description={currentCrag.liveVideoDescription}
                      />
                    )}
                  </div>
                </div>
              </Tabs.Content>

              <Tabs.Content value="areas">
                <CragAreaSection cragId={id} areas={currentCrag.areas} />
              </Tabs.Content>

              <Tabs.Content value="routes">
                <CragRouteSection
                  routes={currentCrag.routes_details}
                  initialArea={selectedAreaFilter}
                  cragId={id}
                  areaIdMap={areaIdMap}
                />
              </Tabs.Content>
            </Tabs.Root>
          </div>

          {/* 使用相關岩場元件來替代上一篇/下一篇功能 */}
          <div className="mt-8 border-t border-gray-200 pt-8">
            <h2 className="mb-6 text-2xl font-medium">相關區域</h2>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {currentCrag.areas.slice(0, 3).map((area, index) => (
                <Link
                  key={area.id || index}
                  href={`/crag/${id}/area/${area.id}`}
                  className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:border-[#FFE70C] hover:shadow"
                >
                  <div className="relative h-48">
                    <PlaceholderImage text={area.name} bgColor="#f8f9fa" />
                  </div>
                  <div className="p-4">
                    <h3 className="text-base font-medium group-hover:text-[#1B1A1A]">{area.name}</h3>
                    <div className="mt-2 flex items-center">
                      <span className="text-sm text-gray-500">
                        {area.difficulty} · {area.routes}條路線
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 回到頂部按鈕 */}
      <BackToTop />
    </main>
  )
}
