'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { MapPin, Users, Calendar } from 'lucide-react'
import { ClimbingLocation, LocationStat } from '@/lib/types'

// 取得國旗 emoji
const getCountryFlag = (country: string) => {
  const flagMap: Record<string, string> = {
    台灣: '🇹🇼',
    泰國: '🇹🇭',
    越南: '🇻🇳',
    中國: '🇨🇳',
    日本: '🇯🇵',
    韓國: '🇰🇷',
    美國: '🇺🇸',
    西班牙: '🇪🇸',
    法國: '🇫🇷',
    義大利: '🇮🇹',
    希臘: '🇬🇷',
    土耳其: '🇹🇷',
    馬來西亞: '🇲🇾',
    印尼: '🇮🇩',
    菲律賓: '🇵🇭',
    澳洲: '🇦🇺',
    紐西蘭: '🇳🇿',
    英國: '🇬🇧',
    德國: '🇩🇪',
    瑞士: '🇨🇭',
  }
  return flagMap[country] || '🌍'
}

interface ClimbingLocationCardProps {
  location: ClimbingLocation
  index?: number
}

/**
 * 個人攀岩足跡卡片（用於人物誌頁面）
 */
export function ClimbingLocationCard({ location, index = 0 }: ClimbingLocationCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getCountryFlag(location.country)}</span>
          <div>
            <h4 className="font-medium text-gray-900">{location.location}</h4>
            <p className="text-sm text-gray-500">{location.country}</p>
          </div>
        </div>
        {location.visit_year && (
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Calendar className="h-3.5 w-3.5" />
            <span>{location.visit_year}</span>
          </div>
        )}
      </div>
      {location.notes && (
        <p className="mt-3 text-sm text-gray-600 leading-relaxed">{location.notes}</p>
      )}
    </motion.div>
  )
}

interface ClimbingLocationListProps {
  locations: ClimbingLocation[]
  maxDisplay?: number
  showViewMore?: boolean
}

/**
 * 攀岩足跡列表（用於人物誌頁面）
 */
export function ClimbingLocationList({
  locations,
  maxDisplay = 6,
  showViewMore = true,
}: ClimbingLocationListProps) {
  const publicLocations = locations.filter((loc) => loc.is_public)
  const displayLocations = publicLocations.slice(0, maxDisplay)
  const hasMore = publicLocations.length > maxDisplay

  if (publicLocations.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-medium">
          <MapPin className="h-5 w-5 text-emerald-500" />
          攀岩足跡
        </h3>
        <span className="text-sm text-gray-500">
          去過 {publicLocations.length} 個地方
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {displayLocations.map((location, index) => (
          <ClimbingLocationCard key={`${location.location}-${index}`} location={location} index={index} />
        ))}
      </div>

      {showViewMore && hasMore && (
        <p className="text-center text-sm text-gray-500">
          還有 {publicLocations.length - maxDisplay} 個地點...
        </p>
      )}
    </div>
  )
}

interface LocationExploreCardProps {
  location: LocationStat
  index?: number
}

/**
 * 探索頁面的地點卡片（含訪客統計）
 */
export function LocationExploreCard({ location, index = 0 }: LocationExploreCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative overflow-hidden rounded-lg border bg-white p-4 shadow-sm transition-all hover:shadow-md"
    >
      <Link href={`/biography/explore/location/${encodeURIComponent(location.location)}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{getCountryFlag(location.country)}</span>
            <div>
              <h4 className="font-medium text-gray-900 group-hover:text-emerald-600">
                {location.location}
              </h4>
              <p className="text-sm text-gray-500">{location.country}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-sm text-emerald-600">
            <Users className="h-3.5 w-3.5" />
            <span>{location.visitor_count} 人去過</span>
          </div>
        </div>

        {/* 訪客頭像預覽 */}
        {location.visitors.length > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex -space-x-2">
              {location.visitors.slice(0, 4).map((visitor, i) => (
                <div
                  key={visitor.biography_id}
                  className="relative h-8 w-8 overflow-hidden rounded-full border-2 border-white bg-gray-100"
                  style={{ zIndex: 4 - i }}
                >
                  {visitor.avatar_url ? (
                    <img
                      src={visitor.avatar_url}
                      alt={visitor.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-medium text-gray-500">
                      {visitor.name.charAt(0)}
                    </div>
                  )}
                </div>
              ))}
              {location.visitors.length > 4 && (
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-xs font-medium text-gray-500">
                  +{location.visitors.length - 4}
                </div>
              )}
            </div>
            <span className="text-sm text-gray-500">
              {location.visitors
                .slice(0, 2)
                .map((v) => v.name)
                .join('、')}
              {location.visitors.length > 2 && '...'}
            </span>
          </div>
        )}
      </Link>
    </motion.div>
  )
}

interface CountryCardProps {
  country: string
  locationCount: number
  visitorCount: number
  onClick?: () => void
  isSelected?: boolean
}

/**
 * 國家篩選卡片
 */
export function CountryCard({
  country,
  locationCount,
  visitorCount,
  onClick,
  isSelected = false,
}: CountryCardProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-all ${
        isSelected
          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      <span className="text-xl">{getCountryFlag(country)}</span>
      <div>
        <span className="block text-sm font-medium">{country}</span>
        <span className="text-xs text-gray-500">
          {locationCount} 地點 · {visitorCount} 人
        </span>
      </div>
    </button>
  )
}
