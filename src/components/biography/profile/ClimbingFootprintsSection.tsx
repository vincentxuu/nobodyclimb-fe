'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { Biography, ClimbingLocation, ClimbingLocationRecord } from '@/lib/types'
import { climbingLocationService } from '@/lib/api/services'
import { getCountryFlag } from '@/lib/utils/country'

interface ClimbingFootprintsSectionProps {
  person: Biography
}

interface LocationsByCountry {
  country: string
  flag: string
  locations: ClimbingLocation[]
}

/**
 * 單一地點卡片元件
 */
function LocationCard({ location }: { location: ClimbingLocation }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasNotes = location.notes && location.notes.trim().length > 0
  const notesLength = location.notes?.length || 0
  // 超過 100 字元才顯示展開按鈕
  const shouldShowExpandButton = hasNotes && notesLength > 100

  return (
    <motion.div
      className="rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-md"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* 標題列：地點名稱 + 年份 */}
      <div className="flex items-center justify-between px-4 py-3">
        <h4 className="font-semibold text-gray-900">{location.location}</h4>
        {location.visit_year && (
          <span className="text-sm text-gray-400">{location.visit_year}</span>
        )}
      </div>

      {/* 筆記內容 */}
      {hasNotes && (
        <>
          <div className="border-t border-gray-100" />
          <div className="px-4 py-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={isExpanded ? 'expanded' : 'collapsed'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <p
                  className={`text-sm leading-relaxed text-gray-600 ${
                    !isExpanded && shouldShowExpandButton ? 'line-clamp-3' : ''
                  }`}
                >
                  {location.notes}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* 展開/收合按鈕 */}
            {shouldShowExpandButton && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 flex items-center gap-1 text-sm font-medium text-emerald-600 transition-colors hover:text-emerald-700"
              >
                {isExpanded ? (
                  <>
                    收合 <ChevronUp className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    展開更多 <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </>
      )}
    </motion.div>
  )
}

/**
 * 國家分組區塊元件
 */
function CountryGroup({
  group,
  index,
}: {
  group: LocationsByCountry
  index: number
}) {
  return (
    <motion.div
      className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      viewport={{ once: true }}
    >
      {/* 國家標題 */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl sm:text-3xl">{group.flag}</span>
          <span className="text-lg font-semibold text-gray-900">
            {group.country}
          </span>
        </div>
        <span className="text-sm text-gray-400">
          {group.locations.length} 個地點
        </span>
      </div>

      {/* 地點列表 */}
      <div className="space-y-3 p-4 sm:p-6">
        {group.locations.map((location, locIndex) => (
          <motion.div
            key={`${location.location}-${locIndex}`}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: locIndex * 0.05 }}
            viewport={{ once: true }}
          >
            <LocationCard location={location} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

/**
 * 攀岩足跡區塊
 * 時間軸分組式設計 - 按國家分組顯示
 */
export function ClimbingFootprintsSection({
  person,
}: ClimbingFootprintsSectionProps) {
  const [locations, setLocations] = useState<ClimbingLocation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadLocations = async () => {
      setLoading(true)
      try {
        const response = await climbingLocationService.getBiographyLocations(
          person.id
        )
        if (response.success && response.data) {
          const apiLocations: ClimbingLocation[] = response.data.map(
            (record: ClimbingLocationRecord) => ({
              location: record.location,
              country: record.country,
              visit_year: record.visit_year,
              notes: record.notes,
              photos: record.photos,
              is_public: record.is_public,
            })
          )
          setLocations(apiLocations)
        }
      } catch (err) {
        console.error('Failed to load climbing locations:', err)
      } finally {
        setLoading(false)
      }
    }

    loadLocations()
  }, [person.id])

  if (loading) {
    return (
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto flex max-w-4xl justify-center px-4">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </section>
    )
  }

  if (locations.length === 0) return null

  // 按國家分組
  const groupedByCountry: LocationsByCountry[] = Object.entries(
    locations.reduce(
      (acc, loc) => {
        const country = loc.country || '未知'
        if (!acc[country]) {
          acc[country] = []
        }
        acc[country].push(loc)
        return acc
      },
      {} as Record<string, ClimbingLocation[]>
    )
  ).map(([country, locs]) => ({
    country,
    flag: getCountryFlag(country),
    locations: locs,
  }))

  // 排序：台灣優先，其他按地點數量排序
  groupedByCountry.sort((a, b) => {
    if (a.country === '台灣') return -1
    if (b.country === '台灣') return 1
    return b.locations.length - a.locations.length
  })

  return (
    <section className="bg-gray-50 py-16">
      <div className="container mx-auto max-w-4xl px-4">
        {/* 標題 */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-900">
            攀岩足跡
            <span className="text-lg font-normal text-gray-500">
              {locations.length} 個地點
            </span>
          </h2>
        </motion.div>

        {/* 國家分組列表 */}
        <div className="space-y-6">
          {groupedByCountry.map((group, index) => (
            <CountryGroup key={group.country} group={group} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
