'use client'

import { Search, X } from 'lucide-react'
import { useTranslations } from 'next-intl'

// 難度範圍選項（id 保持固定，name 由翻譯提供）
const GRADE_RANGES = [
  { id: 'all' },
  { id: '5.0-5.7' },
  { id: '5.8-5.9' },
  { id: '5.10' },
  { id: '5.11' },
  { id: '5.12' },
  { id: '5.13+' },
]

// 類型選項（id 保持固定）
const ROUTE_TYPES = [
  { id: 'all' },
  { id: 'Sport Climbing' },
  { id: 'Traditional' },
  { id: 'Top Rope' },
  { id: 'Boulder' },
]

// 導出供外部使用的原始資料（保持向後相容）
const GRADE_RANGES_LEGACY = [
  { id: 'all', name: '所有難度' },
  { id: '5.0-5.7', name: '5.0 - 5.7 (入門)' },
  { id: '5.8-5.9', name: '5.8 - 5.9' },
  { id: '5.10', name: '5.10a - 5.10d' },
  { id: '5.11', name: '5.11a - 5.11d' },
  { id: '5.12', name: '5.12a - 5.12d' },
  { id: '5.13+', name: '5.13+' },
]

const ROUTE_TYPES_LEGACY = [
  { id: 'all', name: '所有類型' },
  { id: 'Sport Climbing', name: 'Sport' },
  { id: 'Traditional', name: 'Trad' },
  { id: 'Top Rope', name: 'Top Rope' },
  { id: 'Boulder', name: 'Boulder' },
]

export interface RouteFilterState {
  searchQuery: string
  selectedArea: string
  selectedSector: string
  selectedGrade: string
  selectedType: string
}

interface RouteListFilterProps {
  searchQuery: string
  onSearchChange: (_query: string) => void
  selectedArea: string
  onAreaChange: (_area: string) => void
  selectedSector: string
  onSectorChange: (_sector: string) => void
  selectedGrade: string
  onGradeChange: (_grade: string) => void
  selectedType: string
  onTypeChange: (_type: string) => void
  areas: Array<{ id: string; name: string }>
  sectors: Array<{ id: string; name: string }>
}

export function RouteListFilter({
  searchQuery,
  onSearchChange,
  selectedArea,
  onAreaChange,
  selectedSector,
  onSectorChange,
  selectedGrade,
  onGradeChange,
  selectedType,
  onTypeChange,
  areas,
  sectors,
}: RouteListFilterProps) {
  const t = useTranslations('CragPage')

  const gradeRangeNames: Record<string, string> = {
    all: t('filterAllGrades'),
    '5.0-5.7': t('filterGradeEntry'),
    '5.8-5.9': '5.8 - 5.9',
    '5.10': '5.10a - 5.10d',
    '5.11': '5.11a - 5.11d',
    '5.12': '5.12a - 5.12d',
    '5.13+': '5.13+',
  }

  const routeTypeNames: Record<string, string> = {
    all: t('filterAllTypes'),
    'Sport Climbing': 'Sport',
    Traditional: 'Trad',
    'Top Rope': 'Top Rope',
    Boulder: 'Boulder',
  }

  return (
    <div className="space-y-3">
      {/* 搜尋框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder={t('searchRoutePlaceholder')}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-8 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-[#FFE70C] focus:ring-1 focus:ring-[#FFE70C]/20"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 區域篩選 */}
      <select
        value={selectedArea}
        onChange={(e) => onAreaChange(e.target.value)}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-[#FFE70C] focus:ring-1 focus:ring-[#FFE70C]/20"
      >
        <option value="all">{t('filterAllAreas')}</option>
        {areas.map((area) => (
          <option key={area.id} value={area.id}>
            {area.name}
          </option>
        ))}
      </select>

      {/* Sector 篩選 - 只在選擇區域且有 sectors 時顯示 */}
      {selectedArea !== 'all' && sectors.length > 0 && (
        <select
          value={selectedSector}
          onChange={(e) => onSectorChange(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-[#FFE70C] focus:ring-1 focus:ring-[#FFE70C]/20"
        >
          <option value="all">{t('filterAllSectors')}</option>
          {sectors.map((sector) => (
            <option key={sector.id} value={sector.id}>
              {sector.name}
            </option>
          ))}
        </select>
      )}

      {/* 難度與類型：並排顯示 */}
      <div className="grid grid-cols-2 gap-2">
        {/* 難度篩選 */}
        <select
          value={selectedGrade}
          onChange={(e) => onGradeChange(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm outline-none transition-colors focus:border-[#FFE70C] focus:ring-1 focus:ring-[#FFE70C]/20"
        >
          {GRADE_RANGES.map((grade) => (
            <option key={grade.id} value={grade.id}>
              {gradeRangeNames[grade.id] ?? grade.id}
            </option>
          ))}
        </select>

        {/* 類型篩選 */}
        <select
          value={selectedType}
          onChange={(e) => onTypeChange(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm outline-none transition-colors focus:border-[#FFE70C] focus:ring-1 focus:ring-[#FFE70C]/20"
        >
          {ROUTE_TYPES.map((type) => (
            <option key={type.id} value={type.id}>
              {routeTypeNames[type.id] ?? type.id}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

// 匯出難度範圍配置供外部使用（保持向後相容）
export { GRADE_RANGES_LEGACY as GRADE_RANGES, ROUTE_TYPES_LEGACY as ROUTE_TYPES }
