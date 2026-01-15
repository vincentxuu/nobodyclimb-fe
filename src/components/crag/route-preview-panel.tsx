'use client'

import { Mountain, Ruler, User, Youtube } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface RoutePreviewData {
  id: string
  name: string
  englishName?: string
  grade: string
  type: string
  typeEn: string
  areaId: string
  areaName: string
  length?: string
  firstAscent?: string
  description?: string
  youtubeVideos?: string[]
  boltCount?: number
}

interface RoutePreviewPanelProps {
  route: RoutePreviewData
  cragName: string
  onClose?: () => void
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

export function RoutePreviewPanel({
  route,
  cragName,
  onClose,
}: RoutePreviewPanelProps) {
  const hasYoutubeVideos = route.youtubeVideos && route.youtubeVideos.length > 0

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="p-6 lg:p-8">
        {/* 標題區 */}
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
            <span>{cragName}</span>
            <span>/</span>
            <span>{route.areaName}</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1B1A1A]">{route.name}</h1>
          {route.englishName && route.englishName !== route.name && (
            <p className="mt-1 text-base text-gray-500">{route.englishName}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-yellow-100 px-4 py-1.5 text-sm font-semibold text-[#1B1A1A]">
              {route.grade}
            </span>
            <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
              <Mountain size={14} className="mr-1" />
              {route.typeEn || route.type}
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
                <Mountain size={14} />
                Bolt
              </div>
              <div className="mt-1 text-base font-semibold text-[#1B1A1A]">
                {route.boltCount}
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
            <h2 className="mb-2 text-sm font-medium text-gray-700">路線描述</h2>
            <p className="text-sm text-gray-600 whitespace-pre-line line-clamp-4">
              {route.description}
            </p>
          </div>
        )}

        {/* YouTube 影片預覽（只顯示第一個） */}
        {hasYoutubeVideos && (
          <div className="mb-6">
            <h2 className="mb-2 flex items-center text-sm font-medium text-gray-700">
              <Youtube size={16} className="mr-1.5 text-red-600" />
              攀登影片
            </h2>
            <div className="aspect-video w-full overflow-hidden rounded-lg">
              <iframe
                src={getYoutubeEmbedUrl(route.youtubeVideos![0])}
                className="h-full w-full"
                title={`${route.name} 攀登影片`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            {route.youtubeVideos!.length > 1 && (
              <p className="mt-2 text-xs text-gray-500">
                還有 {route.youtubeVideos!.length - 1} 部影片
              </p>
            )}
          </div>
        )}

        {/* 返回按鈕 */}
        {onClose && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={onClose}
            >
              返回岩場介紹
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
