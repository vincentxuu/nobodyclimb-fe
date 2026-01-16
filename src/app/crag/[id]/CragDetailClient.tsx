'use client'

import React, { use, useState, useMemo } from 'react'
import Link from 'next/link'
import { MapPin, ArrowLeft, List, X, ExternalLink } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import PlaceholderImage from '@/components/ui/placeholder-image'
import BackToTop from '@/components/ui/back-to-top'
import { WeatherDisplay } from '@/components/shared/weather-display'
import { TrafficCamerasCard } from '@/components/crag/traffic-cameras-card'
import { YouTubeLiveCard } from '@/components/crag/youtube-live-card'
import { CollapsibleBreadcrumb } from '@/components/ui/collapsible-breadcrumb'
import { RouteListFilter } from '@/components/crag/route-list-filter'
import { getCragDetailData, getCragRoutesForSidebar, getCragAreasForFilter, getSectorsForArea } from '@/lib/crag-data'

export default function CragDetailClient({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedArea, setSelectedArea] = useState('all')
  const [selectedSector, setSelectedSector] = useState('all')
  const [selectedGrade, setSelectedGrade] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // 從資料服務層讀取岩場資料
  const currentCrag = getCragDetailData(id)
  const routes = getCragRoutesForSidebar(id)
  const areas = getCragAreasForFilter(id)

  // 根據選擇的區域獲取 sectors
  const sectors = useMemo(() => {
    if (selectedArea === 'all') return []
    return getSectorsForArea(id, selectedArea)
  }, [id, selectedArea])

  // 篩選路線
  const filteredRoutes = useMemo(() => {
    return routes.filter((route) => {
      // 文字搜尋
      const matchesSearch =
        !searchQuery ||
        route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        route.grade.toLowerCase().includes(searchQuery.toLowerCase()) ||
        route.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (route.sector && route.sector.toLowerCase().includes(searchQuery.toLowerCase()))

      // 區域篩選
      const matchesArea = selectedArea === 'all' || route.areaId === selectedArea

      // Sector 篩選
      const matchesSector = selectedSector === 'all' || route.sector === selectedSector

      // 難度篩選
      let matchesGrade = true
      if (selectedGrade !== 'all') {
        const grade = route.grade
        switch (selectedGrade) {
          case '5.0-5.7':
            // 使用負向前瞻確保 5.1 後面沒有數字（排除 5.10, 5.11 等）
            matchesGrade = /^5\.[0-7](?![0-9])/.test(grade)
            break
          case '5.8-5.9':
            matchesGrade = /^5\.[89](?![0-9])/.test(grade)
            break
          case '5.10':
            matchesGrade = /^5\.10/.test(grade)
            break
          case '5.11':
            matchesGrade = /^5\.11/.test(grade)
            break
          case '5.12':
            matchesGrade = /^5\.12/.test(grade)
            break
          case '5.13+':
            matchesGrade = /^5\.1[3-5]/.test(grade)
            break
        }
      }

      // 類型篩選
      const matchesType = selectedType === 'all' || route.type === selectedType

      return matchesSearch && matchesArea && matchesSector && matchesGrade && matchesType
    })
  }, [routes, searchQuery, selectedArea, selectedSector, selectedGrade, selectedType])

  if (!currentCrag) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">找不到岩場資料</p>
      </div>
    )
  }

  const breadcrumbItems = [
    { label: '首頁', href: '/' },
    { label: '岩場', href: '/crag' },
    { label: currentCrag.name },
  ]

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="lg:flex lg:h-[calc(100vh-70px)] lg:overflow-hidden">
        {/* 桌面版 Sidebar */}
        <aside className="hidden lg:flex lg:w-80 lg:flex-shrink-0 lg:flex-col border-r border-gray-200 bg-white">
          {/* 標題區 */}
          <div className="flex-shrink-0 border-b border-gray-200 p-4">
            <Link
              href="/crag"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#1B1A1A] transition-colors"
            >
              <ArrowLeft size={16} />
              <span>岩場列表</span>
            </Link>
            <h2 className="mt-3 text-lg font-semibold text-[#1B1A1A]">{currentCrag.name}</h2>
            <p className="text-sm text-gray-500">
              {filteredRoutes.length === routes.length
                ? `${routes.length} 條路線`
                : `${filteredRoutes.length} / ${routes.length} 條路線`}
            </p>
          </div>

          {/* 篩選區 */}
          <div className="flex-shrink-0 border-b border-gray-200 p-4">
            <RouteListFilter
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedArea={selectedArea}
              onAreaChange={setSelectedArea}
              selectedSector={selectedSector}
              onSectorChange={setSelectedSector}
              selectedGrade={selectedGrade}
              onGradeChange={setSelectedGrade}
              selectedType={selectedType}
              onTypeChange={setSelectedType}
              areas={areas}
              sectors={sectors}
            />
          </div>

          {/* 路線列表 */}
          <div className="flex-1 overflow-y-auto p-2">
            {filteredRoutes.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-gray-500">
                沒有符合條件的路線
              </div>
            ) : (
              <div className="space-y-1">
                {filteredRoutes.map((route) => (
                  <Link
                    key={route.id}
                    href={`/crag/${id}/route/${route.id}`}
                    className="block w-full rounded-lg p-3 text-left transition-colors border-2 border-transparent hover:bg-gray-50 hover:border-gray-200"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-[#1B1A1A]">
                          {route.name}
                        </div>
                        <div className="mt-0.5 text-xs text-gray-500">{route.areaName}</div>
                      </div>
                      <span className="flex-shrink-0 rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-[#1B1A1A]">
                        {route.grade}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* 主內容區 */}
        <div className="lg:flex-1 lg:min-h-0 lg:overflow-y-auto">
          <div className="p-4 lg:p-8">
            {/* 隱藏式麵包屑 */}
            <div className="mb-4">
              <CollapsibleBreadcrumb items={breadcrumbItems} />
            </div>

            {/* 主要內容區 */}
            <div className="rounded-lg bg-white p-6 shadow-sm lg:p-8">
              {/* 照片展示區 */}
              <div className="mb-8">
                <div className="relative mb-2 h-64 w-full overflow-hidden rounded-lg lg:h-80">
                  <PlaceholderImage
                    text={`${currentCrag.name} 場景圖`}
                    bgColor="#333"
                    textColor="#fff"
                  />
                </div>
                <div className="flex flex-nowrap gap-2 overflow-x-auto pb-2">
                  {currentCrag.images.slice(0, 5).map((photo, index) => (
                    <div
                      key={index}
                      className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md lg:h-20 lg:w-20"
                    >
                      <PlaceholderImage text={`${index + 1}`} bgColor="#444" textColor="#fff" />
                    </div>
                  ))}
                </div>
              </div>

              {/* 標題與位置 */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#1B1A1A] lg:text-3xl">{currentCrag.name}</h1>
                <p className="mb-2 text-base text-gray-500 lg:text-lg">{currentCrag.englishName}</p>
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin size={14} className="mr-1" />
                  <span>{currentCrag.location}</span>
                </div>
              </div>

              {/* 岩場介紹 */}
              <div className="mb-8">
                <div className="mb-1">
                  <h2 className="text-lg font-medium text-orange-500">岩場介紹</h2>
                  <div className="h-px w-full bg-gray-200"></div>
                </div>
                <div className="mt-4 whitespace-pre-line text-base text-gray-700">
                  {currentCrag.description}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* 岩場基本資訊 */}
                <div className="mb-6">
                  <div className="mb-1">
                    <h2 className="text-lg font-medium text-orange-500">岩場基本資訊</h2>
                    <div className="h-px w-full bg-gray-200"></div>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="flex">
                      <span className="w-28 flex-shrink-0 text-gray-500">岩場類型：</span>
                      <span>{currentCrag.type}</span>
                    </div>
                    <div className="flex">
                      <span className="w-28 flex-shrink-0 text-gray-500">岩石類型：</span>
                      <span>{currentCrag.rockType}</span>
                    </div>
                    <div className="flex">
                      <span className="w-28 flex-shrink-0 text-gray-500">路線數量：</span>
                      <span>~{currentCrag.routes}</span>
                    </div>
                    <div className="flex">
                      <span className="w-28 flex-shrink-0 text-gray-500">難度範圍：</span>
                      <span>{currentCrag.difficulty}</span>
                    </div>
                    <div className="flex">
                      <span className="w-28 flex-shrink-0 text-gray-500">岩壁高度：</span>
                      <span>{currentCrag.height}</span>
                    </div>
                    <div className="flex">
                      <span className="w-28 flex-shrink-0 text-gray-500">步行時間：</span>
                      <span>{currentCrag.approach}</span>
                    </div>
                  </div>
                </div>

                {/* 交通方式 */}
                <div className="mb-6">
                  <div className="mb-1">
                    <h2 className="text-lg font-medium text-orange-500">交通方式</h2>
                    <div className="h-px w-full bg-gray-200"></div>
                  </div>
                  <div className="mt-4 space-y-3">
                    {currentCrag.transportation.map((item, index) => (
                      <div key={index} className="flex">
                        <span className="w-20 flex-shrink-0 text-gray-500">{item.type}：</span>
                        <span className="flex-1">{item.description}</span>
                      </div>
                    ))}
                    <div className="flex pt-2">
                      <span className="w-20 flex-shrink-0 text-gray-500">停車：</span>
                      <span className="flex-1">{currentCrag.parking}</span>
                    </div>
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
                  <div className="mt-4">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${currentCrag.geoCoordinates.latitude},${currentCrag.geoCoordinates.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mb-2 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                    >
                      <MapPin size={14} />
                      在 Google Maps 開啟
                      <ExternalLink size={12} />
                    </a>
                    <div className="overflow-hidden rounded-lg">
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
                  </div>
                ) : (
                  <div className="mt-4 flex h-48 items-center justify-center rounded-lg bg-gray-200">
                    <span className="text-gray-500">地圖資訊不可用</span>
                  </div>
                )}
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

              {/* 即時路況與影像 */}
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

              {/* 攀岩區域 */}
              {currentCrag.areas.length > 0 && (
                <div className="mt-8 border-t border-gray-200 pt-8">
                  <h2 className="mb-6 text-xl font-medium">攀岩區域</h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {currentCrag.areas.map((area, index) => (
                      <Link
                        key={area.id || index}
                        href={`/crag/${id}/area/${area.id}`}
                        className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:border-[#FFE70C] hover:shadow"
                      >
                        <div className="relative h-32">
                          <PlaceholderImage text={area.name} bgColor="#f8f9fa" />
                        </div>
                        <div className="p-3">
                          <h3 className="text-sm font-medium group-hover:text-[#1B1A1A]">
                            {area.name}
                          </h3>
                          <div className="mt-1 text-xs text-gray-500">
                            {area.difficulty} · {area.routes}條路線
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 手機版浮動按鈕 */}
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#1B1A1A] text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        aria-label="開啟路線列表"
      >
        <List size={24} />
      </button>

      {/* 手機版抽屜 */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* 遮罩 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="lg:hidden fixed inset-0 z-50 bg-black/50"
            />

            {/* 抽屜內容 */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex max-h-[80vh] flex-col rounded-t-2xl bg-white shadow-xl"
            >
              {/* 拖曳把手 */}
              <div className="flex justify-center py-2">
                <div className="h-1 w-12 rounded-full bg-gray-300" />
              </div>

              {/* 標題列 */}
              <div className="flex items-center justify-between border-b border-gray-200 px-4 pb-3">
                <div>
                  <h2 className="text-lg font-semibold text-[#1B1A1A]">{currentCrag.name}</h2>
                  <p className="text-xs text-gray-500">
                    {filteredRoutes.length === routes.length
                      ? `${routes.length} 條路線`
                      : `${filteredRoutes.length} / ${routes.length} 條路線`}
                  </p>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="rounded-full p-2 hover:bg-gray-100"
                  aria-label="關閉"
                >
                  <X size={20} />
                </button>
              </div>

              {/* 篩選區 */}
              <div className="flex-shrink-0 border-b border-gray-200 p-4">
                <RouteListFilter
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  selectedArea={selectedArea}
                  onAreaChange={setSelectedArea}
                  selectedSector={selectedSector}
                  onSectorChange={setSelectedSector}
                  selectedGrade={selectedGrade}
                  onGradeChange={setSelectedGrade}
                  selectedType={selectedType}
                  onTypeChange={setSelectedType}
                  areas={areas}
                  sectors={sectors}
                />
              </div>

              {/* 路線列表 */}
              <div className="flex-1 overflow-y-auto p-2">
                {filteredRoutes.length === 0 ? (
                  <div className="flex h-32 items-center justify-center text-sm text-gray-500">
                    沒有符合條件的路線
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredRoutes.map((route) => (
                      <Link
                        key={route.id}
                        href={`/crag/${id}/route/${route.id}`}
                        onClick={() => setIsDrawerOpen(false)}
                        className="block w-full rounded-lg p-3 text-left transition-colors border-2 border-transparent hover:bg-gray-50"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium text-[#1B1A1A]">
                              {route.name}
                            </div>
                            <div className="mt-0.5 text-xs text-gray-500">{route.areaName}</div>
                          </div>
                          <span className="flex-shrink-0 rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-[#1B1A1A]">
                            {route.grade}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <BackToTop />
    </main>
  )
}
