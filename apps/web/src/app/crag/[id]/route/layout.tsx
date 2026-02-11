import { fetchCragById, fetchCragRoutes, fetchCragAreas } from '@/lib/api/server-fetch'
import { adaptRouteToSidebarItem } from '@/lib/adapters/crag-adapter'
import { RouteLayoutClient } from './RouteLayoutClient'

interface RouteLayoutProps {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export default async function RouteLayout({ children, params }: RouteLayoutProps) {
  const { id } = await params

  // 從 API 並行取得岩場、路線、區域資料
  const [apiCrag, apiRoutes, apiAreas] = await Promise.all([
    fetchCragById(id),
    fetchCragRoutes(id),
    fetchCragAreas(id),
  ])

  if (!apiCrag) {
    return <div>岩場不存在</div>
  }

  // 建立區域名稱映射
  const areaMap = new Map(apiAreas.map(a => [a.id, a.name]))

  // 轉換為側邊欄格式
  const routes = apiRoutes.map(r => adaptRouteToSidebarItem(r, areaMap))
  const areas = apiAreas.map(a => ({ id: a.id, name: a.name }))

  return (
    <RouteLayoutClient
      cragId={id}
      cragName={apiCrag.name}
      routes={routes}
      areas={areas}
    >
      {children}
    </RouteLayoutClient>
  )
}
