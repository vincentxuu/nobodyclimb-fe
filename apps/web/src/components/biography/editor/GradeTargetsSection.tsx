'use client'

import { CLIMBING_TYPES, GRADE_TARGET_OPTIONS } from '@nobodyclimb/constants'
import { Plus, TrendingUp, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import type { GradeTarget } from '@/lib/types/biography-v2'
import { cn } from '@/lib/utils'

interface GradeTargetsSectionProps {
  /** 年度目標列表 */
  gradeTargets: GradeTarget[]
  /** 目標變更回調 */
  onGradeTargetsChange: (_targets: GradeTarget[]) => void
  /** 自訂樣式 */
  className?: string
}

const currentYear = new Date().getFullYear()

/**
 * 年度攀爬目標編輯區塊
 */
export function GradeTargetsSection({
  gradeTargets,
  onGradeTargetsChange,
  className,
}: GradeTargetsSectionProps) {
  const t = useTranslations('BiographyEditor')
  const [selectedYear, setSelectedYear] = useState(currentYear)

  // 篩選當前年份的目標
  const currentYearTargets = gradeTargets.filter((t) => t.year === selectedYear)

  // 年份選項（前後各 1 年）
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1]

  const handleAddTarget = () => {
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
    onGradeTargetsChange(gradeTargets.filter((t) => t !== targetToRemove))
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
        <h4 className="font-medium text-[#1B1A1A]">{t('gradeTargetsTitle')}</h4>
      </div>
      <p className="text-sm text-[#6D6C6C]">{t('gradeTargetsHint')}</p>

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
            className="flex items-center justify-between gap-2 rounded-lg bg-[#F5F5F5] p-3"
          >
            <div className="scrollbar-hide flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
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
                className="w-[104px] shrink-0 rounded-lg border border-[#B6B3B3] bg-white px-2 py-1.5 text-sm text-[#1B1A1A] appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
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
                className="w-20 shrink-0 rounded-lg border border-[#B6B3B3] bg-white px-2 py-1.5 text-sm text-[#1B1A1A] appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
              >
                {GRADE_TARGET_OPTIONS[target.grade_system]?.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>

              {/* Completed / Target Count */}
              <div className="flex shrink-0 items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={target.target_count}
                  value={target.completed_count ?? 0}
                  onChange={(e) =>
                    handleUpdateTarget(index, {
                      completed_count: Math.max(0, parseInt(e.target.value) || 0),
                    })
                  }
                  className="w-14 rounded-lg border border-[#B6B3B3] bg-white px-2 py-1.5 text-center text-sm text-[#1B1A1A] focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
                />
                <span className="text-sm text-[#6D6C6C]">/</span>
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
                  className="w-14 rounded-lg border border-[#B6B3B3] bg-white px-2 py-1.5 text-center text-sm text-[#1B1A1A] focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
                />
                <span className="text-sm text-[#6D6C6C]">{t('gradeTargetsCountUnit')}</span>
              </div>
            </div>

            {/* Remove Button */}
            <button
              type="button"
              onClick={() => handleRemoveTarget(index)}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#8E8C8C] transition-colors hover:bg-white hover:text-red-500"
              {...{ 'aria-label': t('gradeTargetsDeleteLabel') }}
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
          {t('gradeTargetsAddButton', { year: selectedYear })}
        </button>
      </div>
    </div>
  )
}

export default GradeTargetsSection
