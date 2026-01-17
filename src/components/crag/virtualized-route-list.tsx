'use client'

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import type { RouteSidebarItem } from '@/lib/crag-data'

interface VirtualizedRouteListProps {
  routes: RouteSidebarItem[]
  cragId: string
  currentRouteId?: string
  itemHeight?: number
  overscan?: number
  onRouteClick?: (routeId: string, e: React.MouseEvent) => void
  onItemClick?: () => void
}

interface RouteItemProps {
  route: RouteSidebarItem
  cragId: string
  isActive: boolean
  style: React.CSSProperties
  searchParamsString: string
  onClick?: (_routeId: string, _e: React.MouseEvent) => void
  onItemClick?: () => void
}

const RouteItem = React.memo(function RouteItem({
  route,
  cragId,
  isActive,
  style,
  searchParamsString,
  onClick,
  onItemClick,
}: RouteItemProps) {
  const handleClick = (e: React.MouseEvent) => {
    onClick?.(route.id, e)
    onItemClick?.()
  }

  const href = `/crag/${cragId}/route/${route.id}${searchParamsString}`

  return (
    <div style={style} className="px-1">
      <Link
        href={href}
        prefetch={false}
        onClick={handleClick}
        className={`block w-full rounded-lg p-3 text-left transition-colors border-2 ${
          isActive
            ? 'border-[#FFE70C] bg-yellow-50'
            : 'border-transparent hover:bg-gray-50 hover:border-gray-200'
        }`}
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
    </div>
  )
})

/**
 * 虛擬化路線列表組件
 * 只渲染可見區域內的路線項目，大幅減少 DOM 節點數量
 */
export function VirtualizedRouteList({
  routes,
  cragId,
  currentRouteId,
  itemHeight = 66, // p-3 (24px) + border-2 (4px) + text-sm (20px) + mt-0.5 (2px) + text-xs (16px) = 66px
  overscan = 5,
  onRouteClick,
  onItemClick,
}: VirtualizedRouteListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)
  const searchParams = useSearchParams()

  // 保留當前的篩選參數
  const searchParamsString = useMemo(() => {
    const paramsStr = searchParams.toString()
    return paramsStr ? `?${paramsStr}` : ''
  }, [searchParams])

  // 計算可見範圍
  const { startIndex, visibleItems, totalHeight } = useMemo(() => {
    const total = routes.length
    const totalH = total * itemHeight

    if (containerHeight === 0) {
      return {
        startIndex: 0,
        visibleItems: routes.slice(0, Math.min(20, total)),
        totalHeight: totalH,
      }
    }

    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const visibleCount = Math.ceil(containerHeight / itemHeight)
    const end = Math.min(total, start + visibleCount + overscan * 2)

    return {
      startIndex: start,
      visibleItems: routes.slice(start, end),
      totalHeight: totalH,
    }
  }, [routes, scrollTop, containerHeight, itemHeight, overscan])

  // 監聽容器大小變化
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateHeight = () => {
      setContainerHeight(container.clientHeight)
    }

    updateHeight()

    const resizeObserver = new ResizeObserver(updateHeight)
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  // 滾動處理（使用 requestAnimationFrame 節流）
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    requestAnimationFrame(() => {
      setScrollTop(target.scrollTop)
    })
  }, [])

  if (routes.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-gray-500">
        沒有符合條件的路線
      </div>
    )
  }

  // 路線數量少於 50 時，直接渲染全部（避免虛擬化的 overhead）
  if (routes.length < 50) {
    return (
      <div className="h-full overflow-y-auto touch-pan-y [-webkit-overflow-scrolling:touch]">
        <div className="space-y-1">
          {routes.map((route) => (
            <RouteItem
              key={route.id}
              route={route}
              cragId={cragId}
              isActive={route.id === currentRouteId}
              style={{}}
              searchParamsString={searchParamsString}
              onClick={onRouteClick}
              onItemClick={onItemClick}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto touch-pan-y [-webkit-overflow-scrolling:touch]"
      onScroll={handleScroll}
    >
      <div
        style={{
          height: totalHeight,
          position: 'relative',
        }}
      >
        {visibleItems.map((route, index) => {
          const actualIndex = startIndex + index
          return (
            <RouteItem
              key={route.id}
              route={route}
              cragId={cragId}
              isActive={route.id === currentRouteId}
              style={{
                position: 'absolute',
                top: actualIndex * itemHeight,
                left: 0,
                right: 0,
                height: itemHeight,
              }}
              searchParamsString={searchParamsString}
              onClick={onRouteClick}
              onItemClick={onItemClick}
            />
          )
        })}
      </div>
    </div>
  )
}
