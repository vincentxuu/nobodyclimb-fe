/**
 * BiographyFootprints 組件
 *
 * 攀岩足跡展示，對應 apps/web/src/components/biography/display/BiographyFootprints.tsx
 */
import React, { useState, useEffect } from 'react'
import { StyleSheet, View, Pressable, ActivityIndicator } from 'react-native'
import { MapPin, Calendar, ChevronDown, ChevronUp } from 'lucide-react-native'
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated'

import { Text, Card } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

// 類型定義
interface ClimbingLocationRecord {
  id: string
  location: string
  country: string
  visit_year?: string
  notes?: string
}

interface BiographyV2 {
  id: string
  [key: string]: any
}

interface BiographyFootprintsProps {
  biography: BiographyV2
}

interface TimelineYear {
  year: string
  locations: ClimbingLocationRecord[]
}

// 國家 emoji 映射
function getCountryFlag(country: string): string {
  const flags: Record<string, string> = {
    台灣: '🇹🇼',
    美國: '🇺🇸',
    日本: '🇯🇵',
    法國: '🇫🇷',
    西班牙: '🇪🇸',
    泰國: '🇹🇭',
    希臘: '🇬🇷',
    德國: '🇩🇪',
    意大利: '🇮🇹',
  }
  return flags[country] || '🌍'
}

/**
 * 時間軸地點項目
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
    <Animated.View
      style={styles.locationItem}
      entering={FadeInDown.delay(index * 50).duration(300)}
    >
      {/* 連接線 */}
      {!isLast && <View style={styles.connectorLine} />}

      {/* 節點圓點 */}
      <View style={styles.dotContainer}>
        <View style={styles.dot} />
      </View>

      {/* 內容卡片 */}
      <View style={styles.locationContent}>
        <View style={styles.locationHeader}>
          <Text style={styles.flag}>{getCountryFlag(location.country)}</Text>
          <View style={styles.locationInfo}>
            <Text variant="body" fontWeight="600">
              {location.location}
            </Text>
            <Text variant="small" color="textMuted">
              {location.country}
            </Text>
          </View>
        </View>

        {/* 筆記內容 */}
        {hasNotes && (
          <View style={styles.notesContainer}>
            <Text
              variant="small"
              color="textSubtle"
              numberOfLines={isExpanded ? undefined : 2}
            >
              {location.notes}
            </Text>

            {shouldShowExpandButton && (
              <Pressable
                style={styles.expandButton}
                onPress={() => setIsExpanded(!isExpanded)}
              >
                <Text variant="small" fontWeight="500" color="textSubtle">
                  {isExpanded ? '收合' : '展開更多'}
                </Text>
                {isExpanded ? (
                  <ChevronUp size={16} color={SEMANTIC_COLORS.textSubtle} />
                ) : (
                  <ChevronDown size={16} color={SEMANTIC_COLORS.textSubtle} />
                )}
              </Pressable>
            )}
          </View>
        )}
      </View>
    </Animated.View>
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
    <Animated.View
      entering={FadeInDown.delay(index * 100).duration(400)}
      style={styles.yearSection}
    >
      {/* 年份標籤 */}
      <View style={styles.yearHeader}>
        <View style={styles.yearIcon}>
          <Calendar size={20} color={SEMANTIC_COLORS.textSubtle} />
        </View>
        <View style={styles.yearInfo}>
          <Text variant="h4" fontWeight="700">
            {yearData.year}
          </Text>
          <View style={styles.yearBadge}>
            <Text variant="small" fontWeight="500" color="textSubtle">
              {yearData.locations.length} 個地點
            </Text>
          </View>
        </View>
      </View>

      {/* 該年份的地點列表 */}
      <View style={styles.yearLocations}>
        {yearData.locations.map((location, locIndex) => (
          <TimelineLocationItem
            key={location.id}
            location={location}
            index={locIndex}
            isLast={locIndex === yearData.locations.length - 1}
          />
        ))}
      </View>
    </Animated.View>
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
    <Animated.View entering={FadeIn.duration(500).delay(200)} style={styles.statsRow}>
      <View style={styles.statItem}>
        <Text variant="h3" fontWeight="700">
          {totalLocations}
        </Text>
        <Text variant="small" color="textMuted">
          攀岩地點
        </Text>
      </View>
      <View style={styles.statItem}>
        <Text variant="h3" fontWeight="700">
          {countryCount}
        </Text>
        <Text variant="small" color="textMuted">
          個國家
        </Text>
      </View>
      <View style={styles.statItem}>
        <Text variant="h3" fontWeight="700">
          {yearRange}
        </Text>
        <Text variant="small" color="textMuted">
          時間跨度
        </Text>
      </View>
    </Animated.View>
  )
}

/**
 * 攀岩足跡展示組件
 */
export function BiographyFootprints({ biography }: BiographyFootprintsProps) {
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
        // TODO: 整合 climbingLocationService.getBiographyLocations(biography.id)
        await new Promise((resolve) => setTimeout(resolve, 500))

        // 模擬資料
        setLocations([
          { id: '1', location: '龍洞', country: '台灣', visit_year: '2024', notes: '第一次戶外攀岩的地方，感受到大自然的震撼。' },
          { id: '2', location: '大砲岩', country: '台灣', visit_year: '2024' },
          { id: '3', location: '關子嶺', country: '台灣', visit_year: '2023' },
          { id: '4', location: 'Fontainebleau', country: '法國', visit_year: '2023', notes: '夢想中的抱石聖地，終於踏上了這片土地。路線的多樣性讓人驚嘆，每一顆石頭都有它的故事。' },
          { id: '5', location: 'Yosemite', country: '美國', visit_year: '2022', notes: '站在 El Capitan 下方，感受到人類的渺小。' },
        ])
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
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={SEMANTIC_COLORS.textMuted} />
        </View>
      </View>
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
    <View style={styles.container}>
      {/* 標題 */}
      <View style={styles.header}>
        <MapPin size={18} color={SEMANTIC_COLORS.textSubtle} />
        <Text variant="body" fontWeight="600">
          攀岩足跡
        </Text>
      </View>

      {/* 統計摘要 */}
      <StatsSummary
        totalLocations={locations.length}
        countryCount={countryCount}
        yearRange={yearRange}
      />

      {/* 時間軸 */}
      <View style={styles.timeline}>
        {/* 主時間線 */}
        <View style={styles.mainLine} />

        {/* 年份區塊 */}
        <View style={styles.yearSections}>
          {timelineData.map((yearData, index) => (
            <TimelineYearSection key={yearData.year} yearData={yearData} index={index} />
          ))}
        </View>

        {/* 時間軸結尾 */}
        <Animated.View
          entering={FadeIn.delay(300)}
          style={styles.timelineEnd}
        >
          <View style={styles.endDot} />
          <Text variant="small" fontStyle="italic" color="textMuted">
            持續探索中...
          </Text>
        </Animated.View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  loadingContainer: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: '#F5F5F5',
    borderRadius: RADIUS.lg,
  },
  timeline: {
    position: 'relative',
  },
  mainLine: {
    position: 'absolute',
    left: 20,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#DBD8D8',
  },
  yearSections: {
    gap: SPACING.lg,
  },
  yearSection: {
    marginBottom: SPACING.md,
  },
  yearHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  yearIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBEAEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  yearBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  yearLocations: {
    marginLeft: 20,
  },
  locationItem: {
    position: 'relative',
    paddingLeft: 32,
    marginBottom: SPACING.md,
  },
  connectorLine: {
    position: 'absolute',
    left: 11,
    top: 24,
    bottom: -SPACING.md,
    width: 2,
    backgroundColor: '#EBEAEA',
  },
  dotContainer: {
    position: 'absolute',
    left: 0,
    top: 6,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: SEMANTIC_COLORS.textSubtle,
    backgroundColor: '#fff',
  },
  locationContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  flag: {
    fontSize: 24,
  },
  locationInfo: {
    flex: 1,
  },
  notesContainer: {
    marginTop: SPACING.sm,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.xs,
  },
  timelineEnd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginLeft: 20,
    paddingLeft: 32,
    marginTop: SPACING.md,
  },
  endDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DBD8D8',
    position: 'absolute',
    left: 8,
  },
})

export default BiographyFootprints
