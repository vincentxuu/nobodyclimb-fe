/**
 * QuizRadarChart
 *
 * 三軸雷達圖，以 react-native-svg 繪製身體／動機／心態分佈
 */

import type { QuizResult } from '@nobodyclimb/types'
import { StyleSheet, View } from 'react-native'
import Svg, { Circle, G, Line, Polygon, Text as SvgText } from 'react-native-svg'

const AXIS_COLORS = {
  body: '#E84545',
  motive: '#F7B731',
  mind: '#27AE60',
}

const AXIS_LABELS = ['身體', '動機', '心態']

interface QuizRadarChartProps {
  /** 測驗結果 */
  result: QuizResult
  /** 圖表尺寸（預設 240） */
  size?: number
}

/**
 * 計算三角形頂點座標
 * 三軸以 120 度間隔排列，起始角度 -90 度（頂部）
 */
function getVertex(cx: number, cy: number, radius: number, index: number): [number, number] {
  const angle = (Math.PI * 2 * index) / 3 - Math.PI / 2
  return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]
}

function getTrianglePoints(cx: number, cy: number, radius: number): string {
  return [0, 1, 2]
    .map((i) => {
      const [x, y] = getVertex(cx, cy, radius, i)
      return `${x},${y}`
    })
    .join(' ')
}

export function QuizRadarChart({ result, size = 240 }: QuizRadarChartProps) {
  const cx = size / 2
  const cy = size / 2
  const maxRadius = size / 2 - 40
  const guideScales = [0.25, 0.5, 0.75, 1]

  // 取得百分比並限制在 0-100
  const values = [
    Math.min(100, Math.max(0, result.bodyPercent)),
    Math.min(100, Math.max(0, result.motivePercent)),
    Math.min(100, Math.max(0, result.mindPercent)),
  ]

  // 資料多邊形頂點
  const dataPoints = values
    .map((val, i) => {
      const r = (val / 100) * maxRadius
      const [x, y] = getVertex(cx, cy, r, i)
      return `${x},${y}`
    })
    .join(' ')

  // 標籤位置（稍微偏離頂點）
  const labelOffset = 22
  const labelPositions = [0, 1, 2].map((i) => {
    const [x, y] = getVertex(cx, cy, maxRadius + labelOffset, i)
    return { x, y }
  })

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* 同心三角導引線 */}
        {guideScales.map((scale) => (
          <Polygon
            key={scale}
            points={getTrianglePoints(cx, cy, maxRadius * scale)}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={1}
          />
        ))}

        {/* 軸線 */}
        {[0, 1, 2].map((i) => {
          const [vx, vy] = getVertex(cx, cy, maxRadius, i)
          return (
            <Line
              key={`axis-${i}`}
              x1={cx}
              y1={cy}
              x2={vx}
              y2={vy}
              stroke="#D1D5DB"
              strokeWidth={1}
            />
          )
        })}

        {/* 資料多邊形 */}
        <Polygon
          points={dataPoints}
          fill={AXIS_COLORS.body}
          fillOpacity={0.15}
          stroke={AXIS_COLORS.body}
          strokeWidth={2}
          strokeOpacity={0.8}
        />

        {/* 資料頂點圓點 */}
        {values.map((val, i) => {
          const r = (val / 100) * maxRadius
          const [x, y] = getVertex(cx, cy, r, i)
          const colors = [AXIS_COLORS.body, AXIS_COLORS.motive, AXIS_COLORS.mind]
          return <Circle key={`dot-${i}`} cx={x} cy={y} r={4} fill={colors[i]} />
        })}

        {/* 中心圓點 */}
        <Circle cx={cx} cy={cy} r={2} fill="#9CA3AF" />

        {/* 軸標籤與百分比 */}
        {AXIS_LABELS.map((label, i) => {
          const pos = labelPositions[i]
          const colors = [AXIS_COLORS.body, AXIS_COLORS.motive, AXIS_COLORS.mind]
          return (
            <G key={`label-${i}`}>
              <SvgText
                x={pos.x}
                y={pos.y - 6}
                textAnchor="middle"
                fontSize={12}
                fontWeight="600"
                fill={colors[i]}
              >
                {label}
              </SvgText>
              <SvgText x={pos.x} y={pos.y + 10} textAnchor="middle" fontSize={11} fill="#6B7280">
                {Math.round(values[i])}%
              </SvgText>
            </G>
          )
        })}
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
  },
})
