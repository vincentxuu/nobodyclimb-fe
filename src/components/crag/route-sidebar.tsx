'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { RouteListFilter } from './route-list-filter'
import { VirtualizedRouteList } from './virtualized-route-list'
import type { RouteSidebarItem } from '@/lib/crag-data'
import type { RouteFilterState } from '@/lib/hooks/useRouteFilter'

interface RouteSidebarProps {
  cragId: string
  cragName: string
  routes: RouteSidebarItem[]
  filteredRoutes: RouteSidebarItem[]
  areas: Array<{ id: string; name: string }>
  sectors: Array<{ id: string; name: string }>
  currentRouteId: string
  filterState: RouteFilterState
  onSearchChange: (_query: string) => void
  onAreaChange: (_area: string) => void
  onSectorChange: (_sector: string) => void
  onGradeChange: (_grade: string) => void
  onTypeChange: (_type: string) => void
}

export function RouteSidebar({
  cragId,
  cragName,
  routes,
  filteredRoutes,
  areas,
  sectors,
  currentRouteId,
  filterState,
  onSearchChange,
  onAreaChange,
  onSectorChange,
  onGradeChange,
  onTypeChange,
}: RouteSidebarProps) {

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
          onSearchChange={onSearchChange}
          selectedArea={filterState.selectedArea}
          onAreaChange={onAreaChange}
          selectedSector={filterState.selectedSector}
          onSectorChange={onSectorChange}
          selectedGrade={filterState.selectedGrade}
          onGradeChange={onGradeChange}
          selectedType={filterState.selectedType}
          onTypeChange={onTypeChange}
          areas={areas}
          sectors={sectors}
        />
      </div>

      {/* 路線列表 - 使用虛擬化 */}
      <div className="flex-1 overflow-y-auto p-2">
        <VirtualizedRouteList
          routes={filteredRoutes}
          cragId={cragId}
          currentRouteId={currentRouteId}
        />
      </div>
    </aside>
  )
}
