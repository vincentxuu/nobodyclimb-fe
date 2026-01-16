'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, ChevronDown, ChevronUp, MapPin, Calendar } from 'lucide-react'
import { Biography, ClimbingLocationRecord } from '@/lib/types'
import { climbingLocationService } from '@/lib/api/services'
import { getCountryFlag } from '@/lib/utils/country'

interface ClimbingFootprintsSectionProps {
  person: Biography
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
        <div className="absolute left-[11px] top-6 h-full w-0.5 bg-gradient-to-b from-brand-light to-transparent" />
      )}

      {/* 節點圓點 */}
      <div className="absolute left-0 top-1.5 flex h-6 w-6 items-center justify-center">
        <div className="h-3 w-3 rounded-full border-2 border-brand-dark bg-white shadow-sm" />
      </div>

      {/* 內容卡片 */}
      <div className="group mb-4 overflow-hidden rounded-lg bg-white/60 px-1 transition-all duration-300 hover:bg-white">
        {/* 標題區 */}
        <div className="flex items-start justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getCountryFlag(location.country)}</span>
            <div>
              <h4 className="font-semibold text-brand-dark transition-colors group-hover:text-brand-dark-hover">
                {location.location}
              </h4>
              <p className="text-sm text-text-subtle">{location.country}</p>
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
                  className={`text-sm leading-relaxed text-text-subtle ${!isExpanded && shouldShowExpandButton ? 'line-clamp-2' : ''
                    }`}
                >
                  {location.notes}
                </p>
              </motion.div>
            </AnimatePresence>

            {shouldShowExpandButton && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 flex items-center gap-1 text-sm font-medium text-brand-dark transition-colors hover:text-brand-dark-hover"
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
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-accent shadow-lg">
          <Calendar className="h-5 w-5 text-brand-dark" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-brand-dark">{yearData.year}</span>
          <span className="rounded-full bg-brand-light px-2.5 py-0.5 text-sm font-medium text-brand-dark">
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
      <div className="rounded-xl bg-brand-light p-4 text-center">
        <div className="text-2xl font-bold text-brand-dark">{totalLocations}</div>
        <div className="text-sm text-text-subtle">攀岩地點</div>
      </div>
      <div className="rounded-xl bg-brand-light p-4 text-center">
        <div className="text-2xl font-bold text-brand-dark">{countryCount}</div>
        <div className="text-sm text-text-subtle">個國家</div>
      </div>
      <div className="rounded-xl bg-brand-light p-4 text-center">
        <div className="text-2xl font-bold text-brand-dark">{yearRange}</div>
        <div className="text-sm text-text-subtle">時間跨度</div>
      </div>
    </motion.div>
  )
}

/**
 * 攀岩足跡區塊
 * 時間軸設計 - 按年份分組，展示攀岩旅程
 */
export function ClimbingFootprintsSection({
  person,
}: ClimbingFootprintsSectionProps) {
  const [locations, setLocations] = useState<ClimbingLocationRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadLocations = async () => {
      setLoading(true)
      try {
        const response = await climbingLocationService.getBiographyLocations(
          person.id
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
  }, [person.id])

  if (loading) {
    return (
      <section className="bg-gradient-to-b from-page-bg to-white py-16">
        <div className="container mx-auto flex max-w-3xl justify-center px-4">
          <Loader2 className="h-8 w-8 animate-spin text-brand-dark" />
        </div>
      </section>
    )
  }

  if (locations.length === 0) return null

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
      year: '其他足跡',
      locations: locationsWithoutYear,
    })
  }

  // 計算統計數據
  const countrySet = new Set(locations.map((loc) => loc.country))
  const countryCount = countrySet.size
  const years = Object.keys(locationsByYear).map((y) => parseInt(y)).filter((y) => !isNaN(y))
  const yearRange = years.length > 0
    ? years.length === 1
      ? `${Math.min(...years)}`
      : `${Math.max(...years) - Math.min(...years) + 1} 年`
    : '-'

  return (
    <section className="bg-gradient-to-b from-page-bg to-white py-16">
      <div className="container mx-auto max-w-3xl px-4">
        {/* 標題 */}
        <motion.div
          className="mb-6 text-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-brand-dark px-4 py-1.5">
            <MapPin className="h-4 w-4 text-white" />
            <span className="text-sm font-medium text-white">攀岩足跡</span>
          </div>
        </motion.div>

        {/* 統計摘要 */}
        <StatsSummary
          totalLocations={locations.length}
          countryCount={countryCount}
          yearRange={yearRange}
        />

        {/* 時間軸 */}
        <div className="relative">
          {/* 主時間線 */}
          <div className="absolute left-5 top-0 h-full w-0.5 bg-gradient-to-b from-brand-dark via-brand-light to-transparent" />

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
              <div className="h-2 w-2 rounded-full bg-brand-light" />
            </div>
            <p className="text-sm italic text-text-subtle">持續探索中...</p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
