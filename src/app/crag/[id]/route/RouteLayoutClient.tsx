'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { RouteSidebar } from '@/components/crag/route-sidebar'
import { RouteMobileDrawer } from '@/components/crag/route-mobile-drawer'
import type { RouteSidebarItem } from '@/lib/crag-data'
import { getSectorsForArea } from '@/lib/crag-data'
import { useRouteFilter } from '@/lib/hooks/useRouteFilter'

interface RouteLayoutClientProps {
  children: React.ReactNode
  cragId: string
  cragName: string
  routes: RouteSidebarItem[]
  areas: Array<{ id: string; name: string }>
}

export function RouteLayoutClient({
  children,
  cragId,
  cragName,
  routes,
  areas,
}: RouteLayoutClientProps) {
  const params = useParams()
  const currentRouteId = (params?.routeId as string) || ''

  // 在父層級管理篩選狀態，讓桌面版和手機版共享同一狀態
  const {
    filterState,
    filteredRoutes,
    setSearchQuery,
    setSelectedArea,
    setSelectedSector,
    setSelectedGrade,
    setSelectedType,
  } = useRouteFilter(routes)

  // 根據選擇的區域獲取 sectors
  const sectors = useMemo(() => {
    if (filterState.selectedArea === 'all') return []
    return getSectorsForArea(cragId, filterState.selectedArea)
  }, [cragId, filterState.selectedArea])

  return (
    <div className="lg:flex lg:h-[calc(100vh-70px)] lg:overflow-hidden">
      {/* 桌面版側邊欄 */}
      <RouteSidebar
        cragId={cragId}
        cragName={cragName}
        routes={routes}
        filteredRoutes={filteredRoutes}
        areas={areas}
        sectors={sectors}
        currentRouteId={currentRouteId}
        filterState={filterState}
        onSearchChange={setSearchQuery}
        onAreaChange={setSelectedArea}
        onSectorChange={setSelectedSector}
        onGradeChange={setSelectedGrade}
        onTypeChange={setSelectedType}
      />

      {/* 主要內容區 */}
      <div className="lg:flex-1 lg:overflow-y-auto">
        {children}
      </div>

      {/* 手機版抽屜 */}
      <RouteMobileDrawer
        cragId={cragId}
        cragName={cragName}
        routes={routes}
        filteredRoutes={filteredRoutes}
        areas={areas}
        sectors={sectors}
        currentRouteId={currentRouteId}
        filterState={filterState}
        onSearchChange={setSearchQuery}
        onAreaChange={setSelectedArea}
        onSectorChange={setSelectedSector}
        onGradeChange={setSelectedGrade}
        onTypeChange={setSelectedType}
      />
    </div>
  )
}
