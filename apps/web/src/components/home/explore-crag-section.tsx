'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CragCoverGenerator } from '@/components/shared/CragCoverGenerator'
import { useCrags, useFeaturedRoutes, type FeaturedRouteItem } from '@/hooks/api/useCrags'
import type { CragListItem } from '@/lib/crag-data'

// 台灣地圖上的岩場標記位置（百分比，基於 taiwan.svg 437x555）
const cragMapPositions: Record<string, { top: string; left: string }> = {
  longdong: { top: '26%', left: '90%' },      // 龍洞（東北角）
  defulan: { top: '42%', left: '68%' },       // 德芙蘭（台中）
  guanziling: { top: '58%', left: '58%' },    // 關子嶺（台南）
  shoushan: { top: '75%', left: '54%' },      // 壽山（高雄）
  kenting: { top: '90%', left: '60%' },       // 墾丁（屏東最南端）
}

// 岩場卡片組件（水平滑動版）
function CragCard({ crag, index }: { crag: CragListItem; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="flex-shrink-0"
    >
      <Link
        href={`/crag/${crag.id}`}
        prefetch={false}
        className="group block w-[240px] overflow-hidden rounded-lg bg-white shadow-sm transition-shadow hover:shadow-md sm:w-[280px]"
      >
        {/* 岩場封面 */}
        <div className="relative aspect-[16/9] overflow-hidden">
          <CragCoverGenerator
            rockType={crag.rockType}
            name={crag.name}
            showName={false}
            showTypeLabel={false}
            className="absolute inset-0 transition-transform duration-300 group-hover:scale-[1.02]"
          />
          {/* 岩石類型標籤 */}
          <div className="absolute left-2 top-2 rounded bg-[#1B1A1A]/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
            {crag.type}
          </div>
        </div>

        {/* 岩場資訊 */}
        <div className="p-3">
          <h3 className="mb-1 truncate text-base font-medium text-[#1B1A1A] group-hover:text-[#3F3D3D]">
            {crag.name}
          </h3>
          <p className="mb-2 truncate text-xs text-[#8E8C8C]">{crag.nameEn}</p>

          <div className="mb-2 flex items-center gap-1.5 text-xs text-[#6D6C6C]">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{crag.location}</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-[#FFE70C] px-2 py-0.5 text-xs font-medium text-[#1B1A1A]">
              {crag.routes} 條路線
            </span>
            <span className="rounded-full bg-[#F5F5F5] px-2 py-0.5 text-xs text-[#6D6C6C]">
              {crag.difficulty}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

// 岩場水平滑動區塊
function CragsCarousel({ crags }: { crags: CragListItem[] }) {
  return (
    <div>
      {/* 小標題 */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium text-[#1B1A1A]">熱門岩場</h3>
        <Link
          href="/crag"
          className="flex items-center gap-1 text-sm text-[#6D6C6C] transition-colors hover:text-[#1B1A1A]"
        >
          查看全部
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* 水平滑動容器 */}
      <div className="-mx-4 px-4">
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {crags.map((crag, index) => (
            <CragCard key={crag.id} crag={crag} index={index} />
          ))}
        </div>
      </div>
    </div>
  )
}

// 路線卡片組件
function RouteCard({ route, index }: { route: FeaturedRouteItem; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="flex-shrink-0"
    >
      <Link
        href={`/crag/${route.cragId}/route/${route.id}`}
        prefetch={false}
        className="group block w-[260px] overflow-hidden rounded-lg bg-white shadow-sm transition-shadow hover:shadow-md sm:w-[300px]"
      >
        {/* YouTube 縮圖 */}
        {route.youtubeThumbnail && (
          <div className="relative aspect-video overflow-hidden">
            <Image
              src={route.youtubeThumbnail}
              alt={route.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {/* 難度標籤（覆蓋在圖片上） */}
            <div className="absolute bottom-2 left-2">
              <span className="rounded-full bg-[#FFE70C] px-2.5 py-1 text-sm font-medium text-[#1B1A1A] shadow-sm">
                {route.grade}
              </span>
            </div>
          </div>
        )}

        <div className="p-4">
          {/* 路線名稱 */}
          <h4 className="mb-1 truncate text-base font-semibold text-[#1B1A1A] group-hover:text-[#3F3D3D]">
            {route.name}
          </h4>
          {route.nameEn && (
            <p className="mb-2 truncate text-xs text-[#8E8C8C]">{route.nameEn}</p>
          )}

          {/* 所屬岩場・區域 */}
          <div className="mb-3 flex items-center gap-1.5 text-xs text-[#6D6C6C]">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">
              {route.cragName}・{route.areaName}
            </span>
          </div>

          {/* 標籤區 */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* 類型標籤 */}
            <span className="rounded-full bg-[#F5F5F5] px-2.5 py-0.5 text-xs text-[#6D6C6C]">
              {route.type}
            </span>
            {/* 長度 */}
            {route.length && (
              <span className="rounded-full bg-[#F5F5F5] px-2.5 py-0.5 text-xs text-[#6D6C6C]">
                {route.length}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

// 熱門路線水平滑動區塊
function FeaturedRoutesCarousel({ routes }: { routes: FeaturedRouteItem[] }) {
  return (
    <div className="mt-10">
      {/* 小標題 */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium text-[#1B1A1A]">熱門路線</h3>
        <Link
          href="/crag"
          className="flex items-center gap-1 text-sm text-[#6D6C6C] transition-colors hover:text-[#1B1A1A]"
        >
          查看全部
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* 水平滑動容器 */}
      <div className="-mx-4 px-4">
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {routes.map((route, index) => (
            <RouteCard key={`${route.cragId}-${route.id}`} route={route} index={index} />
          ))}
        </div>
      </div>
    </div>
  )
}

// 台灣地圖組件（SVG 風格）
export function TaiwanMap({
  crags,
  compact = false,
  clickable = false,
}: {
  crags: CragListItem[]
  compact?: boolean
  clickable?: boolean
}) {
  const [hoveredCrag, setHoveredCrag] = useState<string | null>(null)

  return (
    <div
      className={`relative aspect-[437/555] w-full overflow-visible ${compact ? 'max-w-[120px]' : 'max-w-[320px]'}`}
    >
      {/* 台灣島輪廓 SVG */}
      <Image
        src="/taiwan.svg"
        alt="台灣地圖"
        fill
        className="object-cover brightness-[0.85] contrast-[0.9] sepia-[0.1]"
        style={{ filter: 'invert(0.85) sepia(0.05) brightness(1.05)' }}
        priority
      />

      {/* 岩場標記點 */}
      {crags.map((crag) => {
        const position = cragMapPositions[crag.id]
        if (!position) return null

        const markerContent = (
          <>
            {/* 標記點 */}
            <motion.div
              className={`relative flex items-center justify-center rounded-full ${compact ? 'h-1.5 w-1.5' : 'h-6 w-6'
                } ${hoveredCrag === crag.id ? 'bg-brand-accent' : 'bg-brand-dark'}`}
              whileHover={{ scale: 1.2 }}
              transition={{ duration: 0.2 }}
            >
              {!compact && (
                <MapPin
                  className={`h-3.5 w-3.5 ${hoveredCrag === crag.id ? 'text-brand-dark' : 'text-white'}`}
                />
              )}
            </motion.div>

            {/* 懸停提示 */}
            {hoveredCrag === crag.id && !compact && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded bg-brand-dark px-3 py-1.5 text-sm text-white shadow-lg"
              >
                {crag.name}
                <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-brand-dark" />
              </motion.div>
            )}
          </>
        )

        const commonProps = {
          className: 'absolute cursor-pointer',
          style: { top: position.top, left: position.left },
          onMouseEnter: () => setHoveredCrag(crag.id),
          onMouseLeave: () => setHoveredCrag(null),
        }

        return clickable ? (
          <Link key={crag.id} href={`/crag/${crag.id}`} prefetch={false} {...commonProps}>
            {markerContent}
          </Link>
        ) : (
          <div key={crag.id} {...commonProps}>
            {markerContent}
          </div>
        )
      })}
    </div>
  )
}

// 手機版可展開的迷你地圖
function ExpandableMap({ crags }: { crags: CragListItem[] }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="mb-6 lg:hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between rounded-lg bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
      >
        <div className="flex items-center gap-4">
          {/* 迷你地圖預覽 */}
          <div className="relative h-16 w-12 flex-shrink-0">
            <TaiwanMap crags={crags} compact />
          </div>
          <div className="text-left">
            <p className="font-medium text-[#1B1A1A]">查看岩場分佈</p>
            <p className="text-sm text-[#6D6C6C]">{crags.length} 個岩場</p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-5 w-5 text-[#6D6C6C]" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="flex justify-center bg-white px-4 pb-6 pt-2">
              <TaiwanMap crags={crags} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * 探索岩場區組件
 * 包含台灣地圖視覺化和熱門岩場卡片
 */
export function ExploreCragSection() {
  const { data } = useCrags({ limit: 5 })
  const crags = data?.crags || []

  // 獲取熱門路線
  const { data: featuredRoutes = [] } = useFeaturedRoutes(8)

  if (crags.length === 0) {
    return null
  }

  return (
    <section className="border-t border-[#D2D2D2] bg-[#FAFAFA] py-16 md:py-20">
      <div className="container mx-auto px-4">
        {/* 標題區 */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-[#1B1A1A] md:text-[40px]">查路線</h2>
            <p className="mt-2 text-base text-[#6D6C6C]">探索台灣岩場，找到你的下一條路線</p>
          </div>
        </div>

        {/* 岩場水平滑動區塊 */}
        <CragsCarousel crags={crags} />

        {/* 熱門路線區塊 */}
        {featuredRoutes.length > 0 && (
          <FeaturedRoutesCarousel routes={featuredRoutes} />
        )}

        {/* 查看全部按鈕 */}
        <div className="mt-10 flex justify-center">
          <Link href="/crag">
            <Button
              variant="outline"
              className="h-11 border border-[#1B1A1A] px-8 text-base text-[#1B1A1A] hover:bg-[#DBD8D8]"
            >
              探索更多岩場
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
