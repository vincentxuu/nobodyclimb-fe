'use client'

import React from 'react'

interface GradeDistributionChartProps {
  gradeRanges: Record<string, number>
  totalRoutes: number
}

// 難度範圍的顏色對應
const gradeColors: Record<string, string> = {
  '5.6-5.9': '#4ade80', // 綠色 - 初學者
  '5.10a-5.10d': '#facc15', // 黃色 - 中級
  '5.11a-5.11d': '#fb923c', // 橘色 - 進階
  '5.12a-5.12d': '#f87171', // 紅色 - 困難
  '5.13a-5.13d': '#c084fc', // 紫色 - 專家
  '5.14+': '#60a5fa', // 藍色 - 精英
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

export const GradeDistributionChart: React.FC<GradeDistributionChartProps> = ({
  gradeRanges,
  totalRoutes,
}) => {
  // 計算最大值用於比例縮放
  const maxCount = Math.max(...Object.values(gradeRanges), 1)

  // 過濾出有路線的難度範圍
  const activeRanges = Object.entries(gradeRanges).filter(([, count]) => count > 0)

  if (activeRanges.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center text-gray-500">
        暫無路線難度資料
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      {/* 長條圖 */}
      <div className="space-y-4">
        {Object.entries(gradeRanges).map(([range, count]) => {
          const percentage = totalRoutes > 0 ? (count / totalRoutes) * 100 : 0
          const barWidth = (count / maxCount) * 100

          return (
            <div key={range} className="group">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">
                  {gradeLabels[range] || range}
                </span>
                <span className="text-gray-500">
                  {count} 條 ({percentage.toFixed(0)}%)
                </span>
              </div>
              <div className="relative h-8 w-full overflow-hidden rounded-md bg-gray-100">
                <div
                  className="absolute left-0 top-0 h-full rounded-md transition-all duration-500 ease-out"
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: gradeColors[range] || '#94a3b8',
                    minWidth: count > 0 ? '8px' : '0',
                  }}
                />
                {count > 0 && (
                  <div className="absolute inset-0 flex items-center px-3">
                    <span className="text-xs font-semibold text-white drop-shadow-sm">
                      {count}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* 圖例 */}
      <div className="mt-6 flex flex-wrap gap-4 border-t border-gray-100 pt-4">
        {Object.entries(gradeColors).map(([range, color]) => (
          <div key={range} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs text-gray-600">{gradeLabels[range]}</span>
          </div>
        ))}
      </div>

      {/* 統計摘要 */}
      <div className="mt-4 rounded-md bg-gray-50 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-gray-600">
            共 <span className="font-semibold text-[#1B1A1A]">{totalRoutes}</span> 條路線
          </span>
          <span className="text-gray-600">
            涵蓋 <span className="font-semibold text-[#1B1A1A]">{activeRanges.length}</span> 個難度區間
          </span>
        </div>
      </div>
    </div>
  )
}
