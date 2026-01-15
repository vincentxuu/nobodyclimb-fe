'use client'

import { useParams } from 'next/navigation'
import { RouteSidebar } from '@/components/crag/route-sidebar'
import { RouteMobileDrawer } from '@/components/crag/route-mobile-drawer'
import type { RouteSidebarItem } from '@/lib/crag-data'

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

  return (
    <div className="lg:flex lg:h-[calc(100vh-70px)] lg:overflow-hidden">
      {/* 桌面版側邊欄 */}
      <RouteSidebar
        cragId={cragId}
        cragName={cragName}
        routes={routes}
        areas={areas}
        currentRouteId={currentRouteId}
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
        areas={areas}
        currentRouteId={currentRouteId}
      />
    </div>
  )
}
