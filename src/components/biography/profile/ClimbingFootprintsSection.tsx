'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { MapPin, Loader2 } from 'lucide-react'
import { Biography, ClimbingLocation, ClimbingLocationRecord } from '@/lib/types'
import { climbingLocationService } from '@/lib/api/services'

interface ClimbingFootprintsSectionProps {
  person: Biography
}

/**
 * 攀岩足跡地圖
 * 視覺化地點展示
 */
export function ClimbingFootprintsSection({ person }: ClimbingFootprintsSectionProps) {
  const [locations, setLocations] = useState<ClimbingLocation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadLocations = async () => {
      setLoading(true)
      try {
        // 優先從新的正規化表格 API 取得資料
        const response = await climbingLocationService.getBiographyLocations(person.id)
        if (response.success && response.data && response.data.length > 0) {
          // 將 ClimbingLocationRecord 轉換為 ClimbingLocation 格式
          const apiLocations: ClimbingLocation[] = response.data.map((record: ClimbingLocationRecord) => ({
            location: record.location,
            country: record.country,
            visit_year: record.visit_year,
            notes: record.notes,
            photos: record.photos,
            is_public: record.is_public,
          }))
          setLocations(apiLocations)
        } else {
          // 如果新 API 沒有資料，嘗試從舊的 JSON 欄位讀取（向後兼容）
          if (person.climbing_locations) {
            try {
              const jsonLocations = JSON.parse(person.climbing_locations)
              if (Array.isArray(jsonLocations)) {
                setLocations(jsonLocations)
              }
            } catch {
              // JSON 解析失敗，忽略
            }
          }
        }
      } catch (err) {
        // API 請求失敗，嘗試從舊的 JSON 欄位讀取
        console.error('Failed to load climbing locations from API:', err)
        if (person.climbing_locations) {
          try {
            const jsonLocations = JSON.parse(person.climbing_locations)
            if (Array.isArray(jsonLocations)) {
              setLocations(jsonLocations)
            }
          } catch {
            // JSON 解析失敗，忽略
          }
        }
      } finally {
        setLoading(false)
      }
    }

    loadLocations()
  }, [person.id, person.climbing_locations])

  if (loading) {
    return (
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto max-w-6xl px-4 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </section>
    )
  }

  if (locations.length === 0) return null

  // 按國家分組統計
  const locationsByCountry = locations.reduce((acc, loc) => {
    const country = loc.country || '未知'
    acc[country] = (acc[country] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <section className="bg-gray-50 py-16">
      <div className="container mx-auto max-w-6xl px-4">
        <h2 className="mb-2 flex items-center gap-3 text-2xl font-bold text-gray-900">
          攀岩足跡
          <span className="text-lg font-normal text-gray-500">
            {locations.length} 個地點
          </span>
        </h2>

        {/* 地點統計 */}
        <div className="mb-8 flex flex-wrap gap-6">
          {Object.entries(locationsByCountry).map(([country, count]) => (
            <div key={country} className="flex items-center gap-2 text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{country} ({count}個地點)</span>
            </div>
          ))}
        </div>

        {/* 橫向滾動地點卡片 */}
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
          {locations.map((location, index) => (
            <motion.div
              key={`${location.location}-${index}`}
              className="w-72 flex-shrink-0 snap-start"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="group relative cursor-pointer overflow-hidden rounded-lg bg-white shadow-sm transition-shadow hover:shadow-xl">
                {/* 照片 */}
                <div className="relative h-48 overflow-hidden bg-gray-200">
                  {location.photos && location.photos.length > 0 ? (
                    <Image
                      src={location.photos[0]}
                      alt={location.location}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <MapPin className="h-12 w-12 text-gray-300" />
                    </div>
                  )}
                  {/* 國家標籤 */}
                  <div className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-sm font-medium backdrop-blur-sm">
                    {location.country}
                  </div>
                </div>

                {/* 資訊 */}
                <div className="p-4">
                  <h3 className="mb-1 font-semibold text-gray-900">
                    {location.location}
                  </h3>
                  {location.visit_year && (
                    <p className="mb-3 text-sm text-gray-500">
                      {location.visit_year}
                    </p>
                  )}
                  {location.notes && (
                    <p className="line-clamp-2 text-sm text-gray-600">
                      {location.notes}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
