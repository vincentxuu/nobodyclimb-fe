'use client'

import React from 'react'
import {
  Ruler,
  CircleDot,
  Shield,
  User,
  FileText,
  Lightbulb,
} from 'lucide-react'

export interface RouteBasicInfoData {
  length?: string
  boltCount?: number
  protection?: string
  firstAscent?: string
  firstAscentDate?: string
  description?: string
  tips?: string
}

interface RouteBasicInfoProps {
  route: RouteBasicInfoData
  showTitle?: boolean
}

export function RouteBasicInfo({ route, showTitle = true }: RouteBasicInfoProps) {
  const hasContent =
    route.length ||
    (route.boltCount !== undefined && route.boltCount > 0) ||
    route.protection ||
    route.firstAscent ||
    route.description ||
    route.tips

  if (!hasContent) return null

  return (
    <div className="mb-6">
      {showTitle && (
        <h3 className="mb-4 border-l-4 border-[#FFE70C] pl-4 text-lg font-bold text-[#1B1A1A]">
          基本資訊
        </h3>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {route.length && (
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Ruler size={16} />
              長度
            </div>
            <div className="mt-1 text-lg font-semibold text-[#1B1A1A]">
              {route.length}
            </div>
          </div>
        )}
        {route.boltCount !== undefined && route.boltCount > 0 && (
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <CircleDot size={16} />
              Bolt 數量
            </div>
            <div className="mt-1 text-lg font-semibold text-[#1B1A1A]">
              {route.boltCount}
            </div>
          </div>
        )}
        {route.protection && (
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Shield size={16} />
              保護裝備
            </div>
            <div className="mt-1 text-lg font-semibold text-[#1B1A1A]">
              {route.protection}
            </div>
          </div>
        )}
        {route.firstAscent && (
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <User size={16} />
              首攀者
            </div>
            <div className="mt-1 text-lg font-semibold text-[#1B1A1A]">
              {route.firstAscent}
              {route.firstAscentDate && (
                <span className="ml-2 text-sm font-normal text-gray-500 whitespace-nowrap">
                  ({route.firstAscentDate})
                </span>
              )}
            </div>
          </div>
        )}
        {route.description && (
          <div className="rounded-lg bg-gray-50 p-4 col-span-2 sm:col-span-3 lg:col-span-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <FileText size={16} />
              路線描述
            </div>
            <div className="mt-1 text-lg font-semibold text-[#1B1A1A] whitespace-pre-line">
              {route.description}
            </div>
          </div>
        )}
        {route.tips && (
          <div className="rounded-lg bg-gray-50 p-4 col-span-2 sm:col-span-3 lg:col-span-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Lightbulb size={16} />
              攀登攻略
            </div>
            <div className="mt-1 text-lg font-semibold text-[#1B1A1A] whitespace-pre-line">
              {route.tips}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
