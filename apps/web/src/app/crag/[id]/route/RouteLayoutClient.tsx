'use client'

import { Suspense, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { RouteSidebar } from '@/components/crag/route-sidebar'
import { RouteMobileDrawer } from '@/components/crag/route-mobile-drawer'
import type { RouteSidebarItem } from '@/lib/crag-data'
import { getSectorsForArea } from '@/lib/crag-data'
import { useRouteFilterParams } from '@/lib/hooks/useRouteFilterParams'

interface RouteLayoutClientProps {
  children: React.ReactNode
  cragId: string
  cragName: string
  routes: RouteSidebarItem[]
  areas: Array<{ id: string; name: string }>
}

// 內部元件，使用 useSearchParams 需要 Suspense 包裹
function RouteLayoutContent({
  children,
  cragId,
  cragName,
  routes,
  areas,
}: RouteLayoutClientProps) {
  const params = useParams()
  const currentRouteId = (params?.routeId as string) || ''

  // 使用 URL 參數管理篩選狀態，讓設定可以保留在網址中
  const {
    filterState,
    filteredRoutes,
    setSearchQuery,
    setSelectedArea,
    setSelectedSector,
    setSelectedGrade,
    setSelectedType,
  } = useRouteFilterParams(routes)

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

// 主元件，用 Suspense 包裹以支援 useSearchParams
export function RouteLayoutClient(props: RouteLayoutClientProps) {
  return (
    <Suspense fallback={
      <div className="lg:flex lg:h-[calc(100vh-70px)] lg:overflow-hidden">
        <aside className="hidden lg:flex lg:w-80 lg:flex-shrink-0 lg:flex-col border-r border-gray-200 bg-white">
          <div className="animate-pulse p-4">
            <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
            <div className="h-6 bg-gray-200 rounded w-32 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-20" />
          </div>
        </aside>
        <div className="lg:flex-1 lg:overflow-y-auto">
          {props.children}
        </div>
      </div>
    }>
      <RouteLayoutContent {...props} />
    </Suspense>
  )
}
