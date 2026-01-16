'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { RouteListFilter } from './route-list-filter'
import { VirtualizedRouteList } from './virtualized-route-list'
import type { RouteSidebarItem } from '@/lib/crag-data'
import { getSectorsForArea } from '@/lib/crag-data'
import { useRouteFilter } from '@/lib/hooks/useRouteFilter'

interface RouteSidebarProps {
  cragId: string
  cragName: string
  routes: RouteSidebarItem[]
  areas: Array<{ id: string; name: string }>
  currentRouteId: string
}

export function RouteSidebar({
  cragId,
  cragName,
  routes,
  areas,
  currentRouteId,
}: RouteSidebarProps) {
  // 使用共用的路線過濾 hook（包含防抖）
  const {
    filterState,
    filteredRoutes,
    setSearchQuery,
    setSelectedArea,
    setSelectedSector,
    setSelectedGrade,
    setSelectedType,
  } = useRouteFilter(routes)

  // 根據選擇的區域獲取 sectors（使用緩存）
  const sectors = useMemo(() => {
    if (filterState.selectedArea === 'all') return []
    return getSectorsForArea(cragId, filterState.selectedArea)
  }, [cragId, filterState.selectedArea])

  return (
    <aside className="hidden lg:flex lg:w-80 lg:flex-shrink-0 lg:flex-col border-r border-gray-200 bg-white">
      {/* 標題區 */}
      <div className="flex-shrink-0 border-b border-gray-200 p-4">
        <Link
          href={`/crag/${cragId}`}
          prefetch={false}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#1B1A1A] transition-colors"
        >
          <ArrowLeft size={16} />
          <span>{cragName}</span>
        </Link>
        <h2 className="mt-3 text-lg font-semibold text-[#1B1A1A]">路線列表</h2>
        <p className="text-sm text-gray-500">
          {filteredRoutes.length === routes.length
            ? `${routes.length} 條路線`
            : `${filteredRoutes.length} / ${routes.length} 條路線`}
        </p>
      </div>

      {/* 篩選區 */}
      <div className="flex-shrink-0 border-b border-gray-200 p-4">
        <RouteListFilter
          searchQuery={filterState.searchQuery}
          onSearchChange={setSearchQuery}
          selectedArea={filterState.selectedArea}
          onAreaChange={setSelectedArea}
          selectedSector={filterState.selectedSector}
          onSectorChange={setSelectedSector}
          selectedGrade={filterState.selectedGrade}
          onGradeChange={setSelectedGrade}
          selectedType={filterState.selectedType}
          onTypeChange={setSelectedType}
          areas={areas}
          sectors={sectors}
        />
      </div>

      {/* 路線列表 - 使用虛擬化 */}
      <div className="flex-1 overflow-hidden p-2">
        <VirtualizedRouteList
          routes={filteredRoutes}
          cragId={cragId}
          currentRouteId={currentRouteId}
        />
      </div>
    </aside>
  )
}
