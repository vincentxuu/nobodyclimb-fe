'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { TrendingUp, Plus, X } from 'lucide-react'
import { GRADE_TARGET_OPTIONS, CLIMBING_TYPES } from '@nobodyclimb/constants'
import type { GradeTarget } from '@/lib/types/biography-v2'

interface GradeTargetsSectionProps {
  /** 年度目標列表 */
  gradeTargets: GradeTarget[]
  /** 目標變更回調 */
  onGradeTargetsChange: (_targets: GradeTarget[]) => void
  /** 自訂樣式 */
  className?: string
}

const currentYear = new Date().getFullYear()

const GRADE_SYSTEM_LABELS: Record<string, string> = {
  boulder: '抱石',
  sport: '運動攀登',
  trad: '傳統攀登',
}

/**
 * 年度攀爬目標編輯區塊
 */
export function GradeTargetsSection({
  gradeTargets,
  onGradeTargetsChange,
  className,
}: GradeTargetsSectionProps) {
  const [selectedYear, setSelectedYear] = useState(currentYear)

  // 篩選當前年份的目標
  const currentYearTargets = gradeTargets.filter((t) => t.year === selectedYear)
  const otherYearTargets = gradeTargets.filter((t) => t.year !== selectedYear)

  // 年份選項（前後各 2 年）
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1]

  const handleAddTarget = () => {
    // 找出尚未使用的級數系統
    const usedSystems = currentYearTargets.map((t) => `${t.grade_system}-${t.grade}`)
    const defaultSystem = 'boulder'
    const defaultGrade = 'V4'

    const newTarget: GradeTarget = {
      year: selectedYear,
      grade_system: defaultSystem,
      grade: defaultGrade,
      target_count: 10,
    }

    onGradeTargetsChange([...gradeTargets, newTarget])
  }

  const handleRemoveTarget = (index: number) => {
    const targetToRemove = currentYearTargets[index]
    onGradeTargetsChange(
      gradeTargets.filter((t) => t !== targetToRemove)
    )
  }

  const handleUpdateTarget = (index: number, updates: Partial<GradeTarget>) => {
    const targetToUpdate = currentYearTargets[index]
    const newTargets = gradeTargets.map((t) => {
      if (t === targetToUpdate) {
        return { ...t, ...updates }
      }
      return t
    })
    onGradeTargetsChange(newTargets)
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <TrendingUp size={18} className="text-[#3F3D3D]" />
        <h4 className="font-medium text-[#1B1A1A]">年度攀爬目標</h4>
      </div>
      <p className="text-sm text-[#6D6C6C]">
        設定每年想要完攀的級數與數量，記錄攀爬後會自動追蹤進度
      </p>

      {/* Year Selector */}
      <div className="flex items-center gap-2">
        {yearOptions.map((year) => (
          <button
            key={year}
            type="button"
            onClick={() => setSelectedYear(year)}
            className={cn(
              'px-3 py-1.5 text-sm rounded-full border transition-colors',
              selectedYear === year
                ? 'bg-brand-dark text-white border-brand-dark'
                : 'bg-white text-[#3F3D3D] border-[#B6B3B3] hover:border-brand-dark'
            )}
          >
            {year}
          </button>
        ))}
      </div>

      {/* Targets List */}
      <div className="space-y-3">
        {currentYearTargets.map((target, index) => (
          <div
            key={`${target.grade_system}-${target.grade}-${index}`}
            className="flex items-center gap-2 p-3 bg-[#F5F5F5] rounded-lg"
          >
            {/* Grade System Select */}
            <select
              value={target.grade_system}
              onChange={(e) => {
                const newSystem = e.target.value as GradeTarget['grade_system']
                const options = GRADE_TARGET_OPTIONS[newSystem]
                handleUpdateTarget(index, {
                  grade_system: newSystem,
                  grade: options[Math.floor(options.length / 2)],
                })
              }}
              className="px-2 py-1.5 text-sm bg-white border border-[#B6B3B3] rounded-lg text-[#1B1A1A] focus:outline-none focus:ring-2 focus:ring-brand-accent/50 appearance-none cursor-pointer"
            >
              {CLIMBING_TYPES.filter((t) => t.value !== 'mixed').map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            {/* Grade Select */}
            <select
              value={target.grade}
              onChange={(e) => handleUpdateTarget(index, { grade: e.target.value })}
              className="px-2 py-1.5 text-sm bg-white border border-[#B6B3B3] rounded-lg text-[#1B1A1A] focus:outline-none focus:ring-2 focus:ring-brand-accent/50 appearance-none cursor-pointer"
            >
              {GRADE_TARGET_OPTIONS[target.grade_system]?.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>

            {/* Target Count */}
            <div className="flex items-center gap-1">
              <span className="text-sm text-[#6D6C6C]">目標</span>
              <input
                type="number"
                min={1}
                max={100}
                value={target.target_count}
                onChange={(e) =>
                  handleUpdateTarget(index, {
                    target_count: Math.max(1, parseInt(e.target.value) || 1),
                  })
                }
                className="w-14 px-2 py-1.5 text-sm text-center bg-white border border-[#B6B3B3] rounded-lg text-[#1B1A1A] focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
              />
              <span className="text-sm text-[#6D6C6C]">條</span>
            </div>

            {/* Remove Button */}
            <button
              type="button"
              onClick={() => handleRemoveTarget(index)}
              className="ml-auto p-1 text-[#8E8C8C] hover:text-red-500 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ))}

        {/* Add Target Button */}
        <button
          type="button"
          onClick={handleAddTarget}
          className="flex items-center gap-2 w-full p-3 text-sm text-[#6D6C6C] border border-dashed border-[#B6B3B3] rounded-lg hover:border-brand-dark hover:text-brand-dark transition-colors"
        >
          <Plus size={16} />
          新增 {selectedYear} 年目標
        </button>
      </div>
    </div>
  )
}

export default GradeTargetsSection
