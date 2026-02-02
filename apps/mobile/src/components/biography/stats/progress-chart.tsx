/**
 * 進度圖表組件
 *
 * 對應 apps/web/src/components/biography/stats/progress-chart.tsx
 */
import React, { useEffect } from 'react'
import { View, StyleSheet, type ViewStyle } from 'react-native'
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import Svg, { Circle } from 'react-native-svg'
import { SEMANTIC_COLORS, WB_COLORS, BRAND_YELLOW, DURATION } from '@nobodyclimb/constants'
import { Text } from '../../ui/Text'
import { ProgressBar as BaseProgressBar } from '../../ui/ProgressBar'

// 動畫 Circle
const AnimatedCircle = Animated.createAnimatedComponent(Circle)

// ============================================
// CircularProgress 組件
// ============================================

export interface CircularProgressProps {
  /** 進度值 (0-100) */
  value: number
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** 線條寬度 */
  strokeWidth?: number
  /** 進度顏色 */
  color?: string
  /** 背景顏色 */
  bgColor?: string
  /** 是否顯示數值 */
  showValue?: boolean
  /** 標籤 */
  label?: string
  /** 自定義樣式 */
  style?: ViewStyle
}

const sizeMap = {
  sm: 60,
  md: 80,
  lg: 100,
  xl: 120,
}

export function CircularProgress({
  value,
  size = 'md',
  strokeWidth = 8,
  color = BRAND_YELLOW[100],
  bgColor = WB_COLORS[20],
  showValue = true,
  label,
  style,
}: CircularProgressProps) {
  const sizePx = sizeMap[size]
  const radius = (sizePx - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI

  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withTiming(value, { duration: DURATION.normal })
  }, [value, progress])

  const animatedProps = useAnimatedProps(() => {
    const offset = circumference - (progress.value / 100) * circumference
    return {
      strokeDashoffset: offset,
    }
  })

  return (
    <View style={[styles.circularContainer, style]}>
      <Svg width={sizePx} height={sizePx} style={{ transform: [{ rotate: '-90deg' }] }}>
        {/* 背景圓 */}
        <Circle
          cx={sizePx / 2}
          cy={sizePx / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        {/* 進度圓 */}
        <AnimatedCircle
          cx={sizePx / 2}
          cy={sizePx / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
        />
      </Svg>
      {showValue && (
        <View style={[styles.circularValue, { width: sizePx, height: sizePx }]}>
          <Text variant="bodyBold" style={styles.circularValueText}>
            {Math.round(value)}%
          </Text>
        </View>
      )}
      {label && (
        <Text variant="caption" color="subtle" style={styles.circularLabel}>
          {label}
        </Text>
      )}
    </View>
  )
}

// ============================================
// ProgressBar 組件 (擴展版本)
// ============================================

export interface ProgressBarProps {
  /** 當前值 */
  value: number
  /** 最大值 */
  max?: number
  /** 進度顏色 */
  color?: string
  /** 背景顏色 */
  bgColor?: string
  /** 是否顯示標籤 */
  showLabel?: boolean
  /** 標籤文字 */
  label?: string
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg'
  /** 自定義樣式 */
  style?: ViewStyle
}

const barHeightMap = {
  sm: 6,
  md: 8,
  lg: 12,
}

export function ProgressBar({
  value,
  max = 100,
  color = BRAND_YELLOW[100],
  bgColor = WB_COLORS[20],
  showLabel = false,
  label,
  size = 'md',
  style,
}: ProgressBarProps) {
  const percentage = Math.min(100, (value / max) * 100)

  return (
    <View style={[styles.progressBarContainer, style]}>
      {(showLabel || label) && (
        <View style={styles.progressBarHeader}>
          {label && (
            <Text variant="caption" color="subtle">
              {label}
            </Text>
          )}
          {showLabel && (
            <Text variant="caption" color="muted">
              {value}/{max}
            </Text>
          )}
        </View>
      )}
      <BaseProgressBar
        value={percentage}
        height={barHeightMap[size]}
        color={color}
        backgroundColor={bgColor}
      />
    </View>
  )
}

// ============================================
// StatCard 組件
// ============================================

export interface StatCardProps {
  /** 數值 */
  value: number | string
  /** 標籤 */
  label: string
  /** 圖標 */
  icon?: React.ReactNode
  /** 趨勢 */
  trend?: {
    value: number
    isPositive: boolean
  }
  /** 背景顏色 */
  color?: string
  /** 自定義樣式 */
  style?: ViewStyle
}

export function StatCard({
  value,
  label,
  icon,
  trend,
  color = WB_COLORS[10],
  style,
}: StatCardProps) {
  return (
    <View style={[styles.statCard, style]}>
      <View style={styles.statCardHeader}>
        {icon && (
          <View style={[styles.statCardIcon, { backgroundColor: color }]}>
            {icon}
          </View>
        )}
        {trend && (
          <Text
            variant="caption"
            style={{
              color: trend.isPositive ? '#16a34a' : '#dc2626',
            }}
          >
            {trend.isPositive ? '+' : ''}
            {trend.value}%
          </Text>
        )}
      </View>
      <Text variant="h2" style={styles.statCardValue}>
        {value}
      </Text>
      <Text variant="caption" color="subtle">
        {label}
      </Text>
    </View>
  )
}

// ============================================
// BarChart 組件
// ============================================

export interface BarChartProps {
  /** 資料 */
  data: Array<{
    label: string
    value: number
    color?: string
  }>
  /** 最大值 */
  maxValue?: number
  /** 是否顯示數值 */
  showValues?: boolean
  /** 方向 */
  orientation?: 'horizontal' | 'vertical'
  /** 自定義樣式 */
  style?: ViewStyle
}

export function BarChart({
  data,
  maxValue,
  showValues = true,
  orientation = 'horizontal',
  style,
}: BarChartProps) {
  const max = maxValue || Math.max(...data.map((d) => d.value))

  if (orientation === 'vertical') {
    return (
      <View style={[styles.barChartVertical, style]}>
        {data.map((item, index) => {
          const height = max > 0 ? (item.value / max) * 100 : 0
          return (
            <View key={index} style={styles.barChartVerticalItem}>
              {showValues && (
                <Text variant="caption" color="muted" style={styles.barChartValue}>
                  {item.value}
                </Text>
              )}
              <View style={styles.barChartVerticalBarContainer}>
                <View
                  style={[
                    styles.barChartVerticalBar,
                    {
                      height: `${height}%`,
                      backgroundColor: item.color || BRAND_YELLOW[100],
                      minHeight: item.value > 0 ? 4 : 0,
                    },
                  ]}
                />
              </View>
              <Text variant="caption" color="subtle" style={styles.barChartLabel}>
                {item.label}
              </Text>
            </View>
          )
        })}
      </View>
    )
  }

  return (
    <View style={[styles.barChartHorizontal, style]}>
      {data.map((item, index) => (
        <View key={index} style={styles.barChartHorizontalItem}>
          <Text variant="caption" color="subtle" style={styles.barChartHorizontalLabel}>
            {item.label}
          </Text>
          <View style={styles.barChartHorizontalBarContainer}>
            <View
              style={[
                styles.barChartHorizontalBar,
                {
                  width: max > 0 ? `${(item.value / max) * 100}%` : '0%',
                  backgroundColor: item.color || BRAND_YELLOW[100],
                },
              ]}
            />
          </View>
          {showValues && (
            <Text variant="caption" color="muted" style={styles.barChartHorizontalValue}>
              {item.value}
            </Text>
          )}
        </View>
      ))}
    </View>
  )
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  // CircularProgress
  circularContainer: {
    alignItems: 'center',
  },
  circularValue: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularValueText: {
    fontSize: 18,
  },
  circularLabel: {
    marginTop: 8,
  },

  // ProgressBar
  progressBarContainer: {
    width: '100%',
  },
  progressBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },

  // StatCard
  statCard: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: WB_COLORS[0],
    borderWidth: 1,
    borderColor: WB_COLORS[20],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statCardIcon: {
    padding: 8,
    borderRadius: 8,
  },
  statCardValue: {
    fontSize: 24,
    fontWeight: '700',
    color: SEMANTIC_COLORS.textMain,
    marginBottom: 4,
  },

  // BarChart Vertical
  barChartVertical: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 160,
  },
  barChartVerticalItem: {
    alignItems: 'center',
    gap: 4,
  },
  barChartVerticalBarContainer: {
    height: 120,
    width: 32,
    justifyContent: 'flex-end',
  },
  barChartVerticalBar: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barChartValue: {
    marginBottom: 4,
  },
  barChartLabel: {
    marginTop: 4,
  },

  // BarChart Horizontal
  barChartHorizontal: {
    gap: 12,
  },
  barChartHorizontalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  barChartHorizontalLabel: {
    width: 80,
  },
  barChartHorizontalBarContainer: {
    flex: 1,
    height: 16,
    backgroundColor: WB_COLORS[20],
    borderRadius: 9999,
    overflow: 'hidden',
  },
  barChartHorizontalBar: {
    height: '100%',
    borderRadius: 9999,
  },
  barChartHorizontalValue: {
    width: 40,
    textAlign: 'right',
  },
})
