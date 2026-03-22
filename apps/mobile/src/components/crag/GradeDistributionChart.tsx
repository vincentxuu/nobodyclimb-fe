/**
 * 難度分佈圖表元件
 *
 * 水平長條圖顯示路線難度分佈
 * 對應 apps/web/src/components/crag/grade-distribution-chart.tsx
 */
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Text } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

// 難度範圍的顏色對應
const gradeColors: Record<string, string> = {
  '5.6-5.9': '#4ade80',
  '5.10a-5.10d': '#facc15',
  '5.11a-5.11d': '#fb923c',
  '5.12a-5.12d': '#f87171',
  '5.13a-5.13d': '#c084fc',
  '5.14+': '#60a5fa',
}

// 難度範圍的顯示名稱
const gradeLabels: Record<string, string> = {
  '5.6-5.9': '5.6 - 5.9',
  '5.10a-5.10d': '5.10a - 5.10d',
  '5.11a-5.11d': '5.11a - 5.11d',
  '5.12a-5.12d': '5.12a - 5.12d',
  '5.13a-5.13d': '5.13a - 5.13d',
  '5.14+': '5.14+',
}

// 難度對應到範圍的映射
const gradeToRange: Record<string, string> = {
  '5.6': '5.6-5.9',
  '5.7': '5.6-5.9',
  '5.8': '5.6-5.9',
  '5.9': '5.6-5.9',
  '5.10': '5.10a-5.10d',
  '5.11': '5.11a-5.11d',
  '5.12': '5.12a-5.12d',
  '5.13': '5.13a-5.13d',
  '5.14': '5.14+',
  '5.15': '5.14+',
}

// 所有範圍的順序
const allRanges = [
  '5.6-5.9',
  '5.10a-5.10d',
  '5.11a-5.11d',
  '5.12a-5.12d',
  '5.13a-5.13d',
  '5.14+',
]

/**
 * 從難度字串陣列計算各範圍的路線數量
 *
 * 例如 grade "5.10a" 會先取前綴 "5.10" 再對應到 "5.10a-5.10d"
 */
export function computeGradeRanges(grades: string[]): Record<string, number> {
  const result: Record<string, number> = {}
  for (const range of allRanges) {
    result[range] = 0
  }

  for (const grade of grades) {
    if (!grade) continue
    // 嘗試完整匹配（如 "5.6"）
    let range = gradeToRange[grade]
    if (!range) {
      // 取前綴匹配（如 "5.10a" → "5.10", "5.12c" → "5.12"）
      const match = grade.match(/^(5\.\d+)/)
      if (match) {
        range = gradeToRange[match[1]]
      }
    }
    if (range && result[range] !== undefined) {
      result[range]++
    }
  }

  return result
}

interface GradeDistributionChartProps {
  gradeRanges: Record<string, number>
  totalRoutes: number
}

export const GradeDistributionChart: React.FC<GradeDistributionChartProps> = ({
  gradeRanges,
  totalRoutes,
}) => {
  const maxCount = Math.max(...Object.values(gradeRanges), 1)
  const activeRanges = Object.entries(gradeRanges).filter(([, count]) => count > 0)

  if (activeRanges.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="body" color="textSubtle">
          尚無難度資料
        </Text>
      </View>
    )
  }

  return (
    <View>
      {/* 長條圖 */}
      <View style={styles.chartContainer}>
        {allRanges.map((range) => {
          const count = gradeRanges[range] || 0
          const percentage = totalRoutes > 0 ? (count / totalRoutes) * 100 : 0
          const barWidthPercent = (count / maxCount) * 100

          return (
            <View key={range} style={styles.barRow}>
              {/* 標籤 + 數量/百分比 */}
              <View style={styles.barLabelRow}>
                <Text variant="small" fontWeight="500" style={styles.barLabel}>
                  {gradeLabels[range] || range}
                </Text>
                <Text variant="small" color="textSubtle">
                  {count} 條（{percentage.toFixed(0)}%）
                </Text>
              </View>
              {/* 長條 */}
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${barWidthPercent}%` as any,
                      backgroundColor: gradeColors[range] || '#94a3b8',
                      minWidth: count > 0 ? 8 : 0,
                    },
                  ]}
                >
                  {count > 0 && (
                    <Text variant="small" fontWeight="600" style={styles.barCountText}>
                      {count}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )
        })}
      </View>

      {/* 圖例 */}
      <View style={styles.legendContainer}>
        {Object.entries(gradeColors).map(([range, color]) => (
          <View key={range} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text variant="small" color="textSubtle" style={styles.legendText}>
              {gradeLabels[range]}
            </Text>
          </View>
        ))}
      </View>

      {/* 統計摘要 */}
      <View style={styles.summaryContainer}>
        <Text variant="small" color="textSubtle">
          共 {totalRoutes} 條路線
        </Text>
        <Text variant="small" color="textSubtle">
          涵蓋 {activeRanges.length} 個難度範圍
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  emptyContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: SEMANTIC_COLORS.border,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  chartContainer: {
    gap: SPACING.md,
  },
  barRow: {
    gap: SPACING.xs,
  },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barLabel: {
    color: SEMANTIC_COLORS.textMain,
  },
  barTrack: {
    height: 32,
    backgroundColor: '#F3F4F6',
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  barCountText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    backgroundColor: '#F9FAFB',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
  },
})
