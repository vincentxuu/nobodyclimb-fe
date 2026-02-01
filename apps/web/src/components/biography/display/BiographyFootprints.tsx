'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Loader2, ChevronDown, ChevronUp, MapPin, Calendar } from 'lucide-react'
import type { BiographyV2 } from '@/lib/types/biography-v2'
import { climbingLocationService } from '@/lib/api/services'
import { ClimbingLocationRecord } from '@/lib/types'
import { getCountryFlag } from '@/lib/utils/country'

interface BiographyFootprintsProps {
  /** 人物誌資料 */
  biography: BiographyV2
  /** 自訂樣式 */
  className?: string
}

interface TimelineYear {
  year: string
  locations: ClimbingLocationRecord[]
}

/**
 * 時間軸上的單一地點項目
 */
function TimelineLocationItem({
  location,
  index,
  isLast,
}: {
  location: ClimbingLocationRecord
  index: number
  isLast: boolean
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasNotes = location.notes && location.notes.trim().length > 0
  const notesLength = location.notes?.length || 0
  const shouldShowExpandButton = hasNotes && notesLength > 100

  return (
    <motion.div
      className="relative pl-8"
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      viewport={{ once: true, margin: '-50px' }}
    >
      {/* 連接線 */}
      {!isLast && (
        <div className="absolute left-[11px] top-6 h-full w-0.5 bg-gradient-to-b from-[#DBD8D8] to-transparent" />
      )}

      {/* 節點圓點 */}
      <div className="absolute left-0 top-1.5 flex h-6 w-6 items-center justify-center">
        <div className="h-3 w-3 rounded-full border-2 border-[#3F3D3D] bg-white shadow-sm" />
      </div>

      {/* 內容卡片 */}
      <div className="group mb-4 overflow-hidden rounded-lg bg-white/60 px-1 transition-all duration-300 hover:bg-white">
        {/* 標題區 */}
        <div className="flex items-start justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getCountryFlag(location.country)}</span>
            <div>
              <h4 className="font-semibold text-[#1B1A1A] transition-colors group-hover:text-[#3F3D3D]">
                {location.location}
              </h4>
              <p className="text-sm text-[#6D6C6C]">{location.country}</p>
            </div>
          </div>
        </div>

        {/* 筆記內容 */}
        {hasNotes && (
          <div className="px-4 pb-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={isExpanded ? 'expanded' : 'collapsed'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <p
                  className={cn(
                    'text-sm leading-relaxed text-[#6D6C6C]',
                    !isExpanded && shouldShowExpandButton && 'line-clamp-2'
                  )}
                >
                  {location.notes}
                </p>
              </motion.div>
            </AnimatePresence>

            {shouldShowExpandButton && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 flex items-center gap-1 text-sm font-medium text-[#3F3D3D] transition-colors hover:text-[#1B1A1A]"
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
        )}
      </div>
    </motion.div>
  )
}

/**
 * 時間軸年份區塊
 */
function TimelineYearSection({
  yearData,
  index,
}: {
  yearData: TimelineYear
  index: number
}) {
  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      viewport={{ once: true, margin: '-50px' }}
    >
      {/* 年份標籤 */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EBEAEA] shadow-lg">
          <Calendar className="h-5 w-5 text-[#3F3D3D]" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-[#1B1A1A]">{yearData.year}</span>
          <span className="rounded-full bg-[#F5F5F5] px-2.5 py-0.5 text-sm font-medium text-[#3F3D3D]">
            {yearData.locations.length} 個地點
          </span>
        </div>
      </div>

      {/* 該年份的地點列表 */}
      <div className="ml-5">
        {yearData.locations.map((location, locIndex) => (
          <TimelineLocationItem
            key={location.id}
            location={location}
            index={locIndex}
            isLast={locIndex === yearData.locations.length - 1}
          />
        ))}
      </div>
    </motion.div>
  )
}

/**
 * 統計摘要卡片
 */
function StatsSummary({
  totalLocations,
  countryCount,
  yearRange,
}: {
  totalLocations: number
  countryCount: number
  yearRange: string
}) {
  return (
    <motion.div
      className="mb-8 grid grid-cols-3 gap-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="rounded-xl bg-[#F5F5F5] p-4 text-center">
        <div className="text-2xl font-bold text-[#1B1A1A]">{totalLocations}</div>
        <div className="text-sm text-[#6D6C6C]">攀岩地點</div>
      </div>
      <div className="rounded-xl bg-[#F5F5F5] p-4 text-center">
        <div className="text-2xl font-bold text-[#1B1A1A]">{countryCount}</div>
        <div className="text-sm text-[#6D6C6C]">個國家</div>
      </div>
      <div className="rounded-xl bg-[#F5F5F5] p-4 text-center">
        <div className="text-2xl font-bold text-[#1B1A1A]">{yearRange}</div>
        <div className="text-sm text-[#6D6C6C]">時間跨度</div>
      </div>
    </motion.div>
  )
}

/**
 * 攀岩足跡展示組件
 *
 * 時間軸設計 - 按年份分組，展示攀岩旅程
 * 使用 BiographyV2 類型，符合新的展示頁面規格
 */
export function BiographyFootprints({
  biography,
  className,
}: BiographyFootprintsProps) {
  const [locations, setLocations] = useState<ClimbingLocationRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadLocations = async () => {
      if (!biography.id) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const response = await climbingLocationService.getBiographyLocations(
          biography.id
        )
        if (response.success && response.data) {
          setLocations(response.data)
        }
      } catch (err) {
        console.error('Failed to load climbing locations:', err)
      } finally {
        setLoading(false)
      }
    }

    loadLocations()
  }, [biography.id])

  if (loading) {
    return (
      <section className={cn('py-6', className)}>
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-[#6D6C6C]" />
        </div>
      </section>
    )
  }

  if (locations.length === 0) {
    return null
  }

  // 按年份分組
  const locationsByYear: Record<string, ClimbingLocationRecord[]> = {}
  const locationsWithoutYear: ClimbingLocationRecord[] = []

  locations.forEach((loc) => {
    if (loc.visit_year) {
      if (!locationsByYear[loc.visit_year]) {
        locationsByYear[loc.visit_year] = []
      }
      locationsByYear[loc.visit_year].push(loc)
    } else {
      locationsWithoutYear.push(loc)
    }
  })

  // 轉換為陣列並按年份降序排序
  const timelineData: TimelineYear[] = Object.entries(locationsByYear)
    .map(([year, locs]) => ({
      year,
      locations: locs,
    }))
    .sort((a, b) => parseInt(b.year) - parseInt(a.year))

  // 如果有無年份的地點，加到最後
  if (locationsWithoutYear.length > 0) {
    timelineData.push({
      year: '那些年的足跡',
      locations: locationsWithoutYear,
    })
  }

  // 計算統計數據
  const countrySet = new Set(locations.map((loc) => loc.country))
  const countryCount = countrySet.size
  const years = Object.keys(locationsByYear)
    .map((y) => parseInt(y))
    .filter((y) => !isNaN(y))
  const yearRange =
    years.length > 0
      ? years.length === 1
        ? `${Math.min(...years)}`
        : `${Math.max(...years) - Math.min(...years) + 1} 年`
      : '-'

  return (
    <section className={cn('py-6', className)}>
      {/* 標題 */}
      <div className="flex items-center gap-2 mb-4">
        <MapPin size={18} className="text-[#3F3D3D]" />
        <h2 className="text-lg font-semibold text-[#1B1A1A]">攀岩足跡</h2>
      </div>

      {/* 統計摘要 */}
      <StatsSummary
        totalLocations={locations.length}
        countryCount={countryCount}
        yearRange={yearRange}
      />

      {/* 時間軸 */}
      <div className="relative">
        {/* 主時間線 */}
        <div className="absolute left-5 top-0 h-full w-0.5 bg-gradient-to-b from-[#3F3D3D] via-[#DBD8D8] to-transparent" />

        {/* 年份區塊 */}
        <div className="space-y-8">
          {timelineData.map((yearData, index) => (
            <TimelineYearSection
              key={yearData.year}
              yearData={yearData}
              index={index}
            />
          ))}
        </div>

        {/* 時間軸結尾 */}
        <motion.div
          className="relative ml-5 mt-6 flex items-center gap-3 pl-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          viewport={{ once: true }}
        >
          <div className="absolute left-0 flex h-6 w-6 items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-[#DBD8D8]" />
          </div>
          <p className="text-sm italic text-[#6D6C6C]">持續探索中...</p>
        </motion.div>
      </div>
    </section>
  )
}

export default BiographyFootprints
