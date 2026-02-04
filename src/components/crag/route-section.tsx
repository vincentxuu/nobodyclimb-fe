'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { Eye, Filter, X, Tag, Shield, Ruler, User, Youtube } from 'lucide-react'

interface RouteType {
  id: string
  name: string
  englishName: string
  grade: string
  length: string
  type: string
  firstAscent: string
  area: string
  areaId?: string
  description: string
  protection: string
  boltCount?: number
  popularity: number
  views: number
  images?: string[]
  videos?: string[]
  tips?: string
  instagramPosts?: string[]
  youtubeVideos?: string[]
}

interface CragRouteSectionProps {
  routes: RouteType[]
  initialArea?: string
  cragId?: string
  areaIdMap?: Record<string, string>
  searchQuery?: string
}

export const CragRouteSection: React.FC<CragRouteSectionProps> = ({
  routes,
  initialArea = 'all',
  cragId: _cragId,
  areaIdMap: _areaIdMap,
  searchQuery = '',
}) => {
  const [selectedArea, setSelectedArea] = useState<string>(initialArea)
  const [selectedGrade, setSelectedGrade] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedRoute, setSelectedRoute] = useState<RouteType | null>(null)

  // 當 initialArea 從外部改變時，同步更新 selectedArea
  useEffect(() => {
    setSelectedArea(initialArea)
  }, [initialArea])

  // 從路線資料中提取所有分區名稱
  const areaNames = useMemo(() => {
    const uniqueAreas = [...new Set(routes.map((r) => r.area))]
    return uniqueAreas.sort()
  }, [routes])

  // 從路線資料中提取所有類型
  const typeNames = useMemo(() => {
    const uniqueTypes = [...new Set(routes.map((r) => r.type))]
    return uniqueTypes.sort()
  }, [routes])

  // 難度範圍選項
  const gradeRanges = [
    { value: '5.0-5.7', label: '5.0-5.7' },
    { value: '5.8-5.9', label: '5.8-5.9' },
    { value: '5.10', label: '5.10' },
    { value: '5.11', label: '5.11' },
    { value: '5.12', label: '5.12' },
    { value: '5.13+', label: '5.13+' },
  ]

  // 根據搜尋字串和選擇的分區篩選路線
  const filteredRoutes = useMemo(() => {
    let result = routes

    // 根據區域篩選
    if (selectedArea !== 'all') {
      result = result.filter((route) => route.area === selectedArea)
    }

    // 根據難度篩選
    if (selectedGrade !== 'all') {
      result = result.filter((route) => {
        const grade = route.grade
        switch (selectedGrade) {
          case '5.0-5.7':
            return /^5\.[0-7](?![0-9])/.test(grade)
          case '5.8-5.9':
            return /^5\.[89](?![0-9])/.test(grade)
          case '5.10':
            return /^5\.10/.test(grade)
          case '5.11':
            return /^5\.11/.test(grade)
          case '5.12':
            return /^5\.12/.test(grade)
          case '5.13+':
            return /^5\.1[3-5]/.test(grade)
          default:
            return true
        }
      })
    }

    // 根據類型篩選
    if (selectedType !== 'all') {
      result = result.filter((route) => route.type === selectedType)
    }

    // 根據搜尋字串篩選
    const query = searchQuery.trim().toLowerCase()
    if (query) {
      result = result.filter(
        (route) =>
          route.name.toLowerCase().includes(query) ||
          route.englishName.toLowerCase().includes(query) ||
          route.grade.toLowerCase().includes(query) ||
          route.type.toLowerCase().includes(query)
      )
    }

    return result
  }, [routes, selectedArea, selectedGrade, selectedType, searchQuery])

  // 檢查是否有任何篩選條件
  const hasFilters = selectedArea !== 'all' || selectedGrade !== 'all' || selectedType !== 'all'

  // 清除所有篩選
  const clearFilters = () => {
    setSelectedArea('all')
    setSelectedGrade('all')
    setSelectedType('all')
  }

  return (
    <div>
      <h2 className="mb-4 border-l-4 border-[#FFE70C] pl-4 text-2xl font-bold">路線資訊</h2>

      {/* 篩選區 */}
      <div className="mb-6 space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">篩選條件</span>
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              清除全部
            </button>
          )}
        </div>

        {/* 分區篩選 */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500 w-12">分區：</span>
          <div className="flex flex-wrap gap-1.5">
            {areaNames.map((area) => (
              <button
                key={area}
                onClick={() => setSelectedArea(selectedArea === area ? 'all' : area)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  selectedArea === area
                    ? 'bg-[#FFE70C] text-[#1B1A1A]'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        {/* 難度篩選 */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500 w-12">難度：</span>
          <div className="flex flex-wrap gap-1.5">
            {gradeRanges.map((range) => (
              <button
                key={range.value}
                onClick={() => setSelectedGrade(selectedGrade === range.value ? 'all' : range.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  selectedGrade === range.value
                    ? 'bg-[#FFE70C] text-[#1B1A1A]'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* 類型篩選 */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500 w-12">類型：</span>
          <div className="flex flex-wrap gap-1.5">
            {typeNames.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(selectedType === type ? 'all' : type)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  selectedType === type
                    ? 'bg-[#FFE70C] text-[#1B1A1A]'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 顯示篩選結果數量 */}
      <div className="mb-4 text-sm text-gray-500">
        顯示 {filteredRoutes.length} / {routes.length} 條路線
      </div>

      {/* 路線列表 */}
      <div className="mb-8 space-y-2">
        {filteredRoutes.map((route) => (
          <button
            key={route.id}
            onClick={() => setSelectedRoute(route)}
            className="w-full flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 text-left transition-colors hover:bg-gray-50 hover:border-[#FFE70C] cursor-pointer"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-[#1B1A1A] truncate">
                  {route.name}
                </span>
                <span className="inline-flex rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-[#1B1A1A]">
                  {route.grade}
                </span>
                <span className="text-xs text-gray-500 hidden sm:inline">
                  {route.type}
                </span>
              </div>
              {route.englishName && route.englishName !== route.name && (
                <div className="text-xs text-gray-400 truncate mt-0.5">{route.englishName}</div>
              )}
            </div>
            <div className="flex items-center gap-4 ml-4 flex-shrink-0">
              {route.length && (
                <span className="text-xs text-gray-500 hidden md:inline">{route.length}</span>
              )}
              <Eye size={16} className="text-gray-400" />
            </div>
          </button>
        ))}
      </div>

      {/* 路線詳情彈窗 */}
      {selectedRoute && (
        <RouteDetailModal
          route={selectedRoute}
          onClose={() => setSelectedRoute(null)}
        />
      )}
    </div>
  )
}

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

function RouteDetailModal({
  route,
  onClose,
}: {
  route: RouteType
  onClose: () => void
}) {
  const hasYoutubeVideos = route.youtubeVideos && route.youtubeVideos.length > 0

  // 防止背景滾動
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-20">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-white/80 p-1.5 text-gray-500 hover:bg-white hover:text-gray-700 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-6">
          {/* 標題區 */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#1B1A1A] pr-8">{route.name}</h2>
            {route.englishName && route.englishName !== route.name && (
              <p className="mt-1 text-base text-gray-500">{route.englishName}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full bg-yellow-100 px-4 py-1.5 text-sm font-semibold text-[#1B1A1A]">
                {route.grade}
              </span>
              <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
                <Tag size={14} className="mr-1" />
                {route.type}
              </span>
              <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
                {route.area}
              </span>
            </div>
          </div>

          {/* 基本資訊卡片 */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {route.length && (
              <div className="rounded-lg bg-gray-50 p-3">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Ruler size={14} />
                  長度
                </div>
                <div className="mt-1 text-base font-semibold text-[#1B1A1A]">
                  {route.length}
                </div>
              </div>
            )}
            {route.boltCount !== undefined && route.boltCount > 0 && (
              <div className="rounded-lg bg-gray-50 p-3">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Shield size={14} />
                  Bolt 數量
                </div>
                <div className="mt-1 text-base font-semibold text-[#1B1A1A]">
                  {route.boltCount}
                </div>
              </div>
            )}
            {route.protection && (
              <div className="rounded-lg bg-gray-50 p-3">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Shield size={14} />
                  保護
                </div>
                <div className="mt-1 text-base font-semibold text-[#1B1A1A]">
                  {route.protection}
                </div>
              </div>
            )}
            {route.firstAscent && (
              <div className="rounded-lg bg-gray-50 p-3">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <User size={14} />
                  首攀
                </div>
                <div className="mt-1 text-base font-semibold text-[#1B1A1A] truncate">
                  {route.firstAscent}
                </div>
              </div>
            )}
          </div>

          {/* 路線描述 */}
          {route.description && (
            <div className="mb-6">
              <h3 className="mb-2 text-sm font-medium text-gray-700">路線描述</h3>
              <p className="text-sm text-gray-600 whitespace-pre-line">
                {route.description}
              </p>
            </div>
          )}

          {/* 攀爬小提示 */}
          {route.tips && (
            <div className="mb-6">
              <h3 className="mb-2 text-sm font-medium text-gray-700">攀爬小提示</h3>
              <p className="text-sm text-gray-600 whitespace-pre-line">
                {route.tips}
              </p>
            </div>
          )}

          {/* YouTube 影片 */}
          {hasYoutubeVideos && (
            <div>
              <h3 className="mb-2 flex items-center text-sm font-medium text-gray-700">
                <Youtube size={16} className="mr-1.5 text-red-600" />
                攀登影片
              </h3>
              <div className="space-y-3">
                {route.youtubeVideos!.map((videoUrl, index) => (
                  <div key={index} className="aspect-video w-full overflow-hidden rounded-lg">
                    <iframe
                      src={getYoutubeEmbedUrl(videoUrl)}
                      className="h-full w-full"
                      title={`${route.name} 攀登影片 ${index + 1}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
