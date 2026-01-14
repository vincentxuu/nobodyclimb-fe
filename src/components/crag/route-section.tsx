'use client'

import React, { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { Eye, ExternalLink, X, ChevronLeft, ChevronRight, Info, Filter } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'

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
  popularity: number
  views: number
  // 新增欄位
  images?: string[]
  videos?: string[]
  tips?: string
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
  cragId,
  areaIdMap,
  searchQuery = '',
}) => {
  const [selectedRoute, setSelectedRoute] = useState<RouteType | null>(null)
  const [showRouteDetail, setShowRouteDetail] = useState(false)
  const [showPhotos, setShowPhotos] = useState(false)
  const [showTips, setShowTips] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [selectedArea, setSelectedArea] = useState<string>(initialArea)

  // 當 initialArea 從外部改變時，同步更新 selectedArea
  useEffect(() => {
    setSelectedArea(initialArea)
  }, [initialArea])

  // 從路線資料中提取所有分區名稱
  const areaNames = useMemo(() => {
    const uniqueAreas = [...new Set(routes.map((r) => r.area))]
    return uniqueAreas.sort()
  }, [routes])

  // 根據搜尋字串和選擇的分區篩選路線
  const filteredRoutes = useMemo(() => {
    let result = routes

    // 先根據區域篩選
    if (selectedArea !== 'all') {
      result = result.filter((route) => route.area === selectedArea)
    }

    // 再根據搜尋字串篩選
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
  }, [routes, selectedArea, searchQuery])

  // 路線點擊處理 - 改為打開彈窗
  const handleRouteClick = (route: RouteType) => {
    setSelectedRoute(route)
    setShowRouteDetail(true)
    setCurrentPhotoIndex(0)
  }

  return (
    <div>
      <h2 className="mb-4 border-l-4 border-[#FFE70C] pl-4 text-2xl font-bold">路線資訊</h2>

      <div className="mb-6 flex items-center rounded-lg border-l-4 border-[#FFE70C] bg-yellow-50 p-4">
        <div className="mr-2 text-[#1B1A1A]">
          <Info size={20} />
        </div>
        <p className="text-sm text-[#1B1A1A]">
          選擇分區來篩選路線，點擊「查看詳情」按鈕可查看路線完整資訊。
        </p>
      </div>

      {/* 分區篩選 */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">篩選分區：</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedArea('all')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              selectedArea === 'all'
                ? 'bg-[#FFE70C] text-[#1B1A1A]'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            全部 ({routes.length})
          </button>
          {areaNames.map((area) => {
            const count = routes.filter((r) => r.area === area).length
            return (
              <button
                key={area}
                onClick={() => setSelectedArea(area)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  selectedArea === area
                    ? 'bg-[#FFE70C] text-[#1B1A1A]'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {area} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* 顯示篩選結果數量 */}
      <div className="mb-4 text-sm text-gray-500">
        顯示 {filteredRoutes.length} 條路線
        {selectedArea !== 'all' && ` - ${selectedArea}`}
      </div>

      {/* 路線表格 */}
      <div className="mb-8 overflow-x-auto">
        <table className="min-w-full border-collapse overflow-hidden rounded-lg border-gray-200">
          <thead className="bg-white">
            <tr className="border-b border-t border-gray-200">
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                路線名稱
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                難度
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                長度
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                類型
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                區域
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                人氣
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {filteredRoutes.map((route) => (
              <tr
                key={route.id}
                className="relative border-b border-gray-200 transition-colors hover:bg-gray-100 cursor-pointer"
                onClick={() => handleRouteClick(route)}
                role="button"
                aria-label={`查看 ${route.name} 路線詳情`}
              >
                <td className="relative whitespace-nowrap py-4 pl-6">
                  <div className="flex items-center">
                    <div className="group text-sm font-medium">
                      <span className="flex items-center text-[#1B1A1A] transition-colors group-hover:text-[#FFE70C]">
                        {route.name}
                        <ExternalLink
                          size={14}
                          className="ml-1 text-gray-400 transition-colors group-hover:text-[#FFE70C]"
                        />
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">{route.englishName}</div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium leading-5 text-[#1B1A1A]">
                    {route.grade}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {route.length}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{route.type}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {cragId && areaIdMap && areaIdMap[route.area] ? (
                    <Link
                      href={`/crag/${cragId}/area/${areaIdMap[route.area]}`}
                      className="text-gray-600 underline decoration-gray-300 underline-offset-2 transition-colors hover:text-[#1B1A1A] hover:decoration-[#FFE70C]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {route.area}
                    </Link>
                  ) : (
                    route.area
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Eye size={16} className="mr-1 text-gray-400" />
                    <span>{route.views}</span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  <button
                    className="flex items-center rounded-full bg-[#FFE70C] px-4 py-1 text-xs font-medium text-[#1B1A1A] shadow-sm transition-colors hover:bg-[#FFE70C]/80"
                    onClick={(e) => {
                      e.stopPropagation() // 防止觸發行點擊事件
                      handleRouteClick(route)
                    }}
                  >
                    <Eye size={14} className="mr-1" />
                    查看詳情
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 路線詳細資訊彈窗 */}
      <Dialog.Root open={showRouteDetail} onOpenChange={setShowRouteDetail}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[95vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-lg bg-white shadow-xl">
            {selectedRoute && (
              <>
                <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-4">
                  <Dialog.Title className="text-lg font-bold text-[#1B1A1A]">
                    路線詳情
                  </Dialog.Title>
                  <Dialog.Close className="rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-[#1B1A1A]">
                    <X size={20} />
                  </Dialog.Close>
                </div>

                <div className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold">{selectedRoute.name}</h3>
                      <p className="text-gray-500">{selectedRoute.englishName}</p>
                    </div>
                    <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-[#1B1A1A]">
                      {selectedRoute.grade}
                    </span>
                  </div>

                  <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <h4 className="mb-2 border-l-2 border-[#FFE70C] pl-2 font-medium text-gray-800">
                        路線資訊
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">長度:</span>
                          <span className="font-medium">{selectedRoute.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">類型:</span>
                          <span className="font-medium">{selectedRoute.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">首登:</span>
                          <span className="font-medium">{selectedRoute.firstAscent}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">區域:</span>
                          <span className="font-medium">{selectedRoute.area}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="mb-2 border-l-2 border-[#FFE70C] pl-2 font-medium text-gray-800">
                        保護裝備
                      </h4>
                      <p className="text-gray-700">{selectedRoute.protection}</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="mb-2 border-l-2 border-[#FFE70C] pl-2 font-medium text-gray-800">
                      路線描述
                    </h4>
                    <p className="text-gray-700">{selectedRoute.description}</p>
                  </div>

                  {/* 攀登攻略 (如果有) */}
                  {selectedRoute.tips && (
                    <div className="mb-6">
                      <h4 className="mb-2 border-l-2 border-[#FFE70C] pl-2 font-medium text-gray-800">
                        攀登攻略
                      </h4>
                      <p className="text-gray-700">{selectedRoute.tips}</p>
                    </div>
                  )}

                  {/* 攀登影片 (如果有) */}
                  {selectedRoute.videos && selectedRoute.videos.length > 0 && (
                    <div className="mb-6">
                      <h4 className="mb-2 border-l-2 border-[#FFE70C] pl-2 font-medium text-gray-800">
                        攀登影片
                      </h4>
                      <div className="space-y-4">
                        {selectedRoute.videos.map((videoUrl, index) => (
                          <div key={index} className="aspect-video w-full">
                            <iframe
                              src={videoUrl}
                              className="h-full w-full rounded-lg"
                              title={`${selectedRoute.name} 攀登影片 ${index + 1}`}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            ></iframe>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap justify-end gap-3">
                    <button
                      className="flex items-center rounded-md bg-gray-200 px-4 py-2 text-[#1B1A1A] transition hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => setShowPhotos(true)}
                      disabled={!selectedRoute?.images?.length}
                    >
                      <ExternalLink size={16} className="mr-2" />
                      查看路線照片
                    </button>
                    <button
                      className="flex items-center rounded-md bg-[#1B1A1A] px-4 py-2 text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => setShowTips(true)}
                      disabled={!selectedRoute?.tips && !(selectedRoute?.videos && selectedRoute.videos.length > 0)}
                    >
                      <ExternalLink size={16} className="mr-2" />
                      攻略與影片
                    </button>
                  </div>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* 路線照片彈窗 */}
      {selectedRoute && (
        <Dialog.Root open={showPhotos} onOpenChange={setShowPhotos}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/70" />
            <Dialog.Content className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-xl">
                <div className="flex items-center justify-between border-b p-4">
                  <Dialog.Title className="text-lg font-bold text-[#1B1A1A]">
                    {selectedRoute.name} 路線照片
                  </Dialog.Title>
                  <Dialog.Close className="rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-[#1B1A1A]">
                    <X size={20} />
                  </Dialog.Close>
                </div>

                {selectedRoute.images && selectedRoute.images.length > 0 ? (
                  <div className="relative">
                    <div className="relative h-[60vh] w-full">
                      <div className="flex h-full w-full items-center justify-center bg-gray-200">
                        <div className="p-8 text-center text-gray-600">
                          [{selectedRoute.name} 路線照片 {currentPhotoIndex + 1}/
                          {selectedRoute.images.length}]
                        </div>
                      </div>
                    </div>

                    {/* 導航按鈕 */}
                    {selectedRoute.images.length > 1 && (
                      <div className="absolute inset-0 flex items-center justify-between px-4">
                        <button
                          onClick={() =>
                            setCurrentPhotoIndex((prev) =>
                              prev === 0 ? selectedRoute.images!.length - 1 : prev - 1
                            )
                          }
                          className="rounded-full bg-white/80 p-2 shadow-md transition-colors hover:bg-white"
                        >
                          <ChevronLeft size={24} />
                        </button>
                        <button
                          onClick={() =>
                            setCurrentPhotoIndex((prev) =>
                              prev === selectedRoute.images!.length - 1 ? 0 : prev + 1
                            )
                          }
                          className="rounded-full bg-white/80 p-2 shadow-md transition-colors hover:bg-white"
                        >
                          <ChevronRight size={24} />
                        </button>
                      </div>
                    )}

                    {/* 縮圖導航 */}
                    {selectedRoute.images.length > 1 && (
                      <div className="flex justify-center space-x-2 bg-gray-100 p-4">
                        {selectedRoute.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentPhotoIndex(index)}
                            className={`h-3 w-3 rounded-full ${currentPhotoIndex === index ? 'bg-[#FFE70C]' : 'bg-gray-300'}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">暫無路線照片</div>
                )}
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}

      {/* 攀登攻略彈窗 */}
      {selectedRoute && (
        <Dialog.Root open={showTips} onOpenChange={setShowTips}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/70" />
            <Dialog.Content className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-lg bg-white shadow-xl">
                <div className="flex items-center justify-between border-b p-4">
                  <Dialog.Title className="text-lg font-bold text-[#1B1A1A]">
                    {selectedRoute.name} 攀登攻略
                  </Dialog.Title>
                  <Dialog.Close className="rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-[#1B1A1A]">
                    <X size={20} />
                  </Dialog.Close>
                </div>

                <div className="p-6">
                  <h3 className="mb-4 border-l-4 border-[#FFE70C] pl-3 text-xl font-bold">
                    攀登技巧
                  </h3>
                  <p className="mb-6 leading-relaxed text-gray-700">
                    {selectedRoute.tips || '暫無攀登攻略'}
                  </p>

                  <h3 className="mb-4 border-l-4 border-[#FFE70C] pl-3 text-xl font-bold">
                    攀登影片
                  </h3>

                  {selectedRoute.videos && selectedRoute.videos.length > 0 ? (
                    <div className="space-y-6">
                      {selectedRoute.videos.map((videoUrl, index) => (
                        <div key={index} className="aspect-video w-full">
                          <iframe
                            src={videoUrl}
                            className="h-full w-full rounded-lg"
                            title={`${selectedRoute.name} 攀登影片 ${index + 1}`}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-gray-500">暫無攀登影片</div>
                  )}
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </div>
  )
}
