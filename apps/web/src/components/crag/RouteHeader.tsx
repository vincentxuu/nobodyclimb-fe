'use client'

import React from 'react'
import { Tag, MapPin } from 'lucide-react'

export interface RouteHeaderData {
  name: string
  englishName?: string
  grade: string
  type: string
  // 區域層級：子區域 | 區域 | 岩場
  sector?: string
  areaName?: string
  cragName?: string
}

interface RouteHeaderProps {
  route: RouteHeaderData
  /** 標題層級：h1 用於獨立頁面，h2 用於彈窗 */
  headingLevel?: 'h1' | 'h2'
  className?: string
}

export function RouteHeader({
  route,
  headingLevel = 'h2',
  className = '',
}: RouteHeaderProps) {
  const HeadingTag = headingLevel
  const headingClassName =
    headingLevel === 'h1'
      ? 'text-2xl font-bold text-[#1B1A1A] md:text-3xl'
      : 'text-2xl font-bold text-[#1B1A1A] pr-8'

  const locationParts = [route.sector, route.areaName, route.cragName].filter(Boolean)

  return (
    <div className={`mb-6 ${className}`}>
      <HeadingTag className={headingClassName}>{route.name}</HeadingTag>
      {route.englishName && route.englishName !== route.name && (
        <p className="mt-1 text-base text-gray-500 md:text-lg">{route.englishName}</p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex rounded-full bg-yellow-100 px-4 py-1.5 text-sm font-semibold text-[#1B1A1A]">
          {route.grade}
        </span>
        <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
          <Tag size={14} className="mr-1" />
          {route.type}
        </span>
        {locationParts.length > 0 && (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
            <MapPin size={14} className="mr-1" />
            {locationParts.join(' | ')}
          </span>
        )}
      </div>
    </div>
  )
}
