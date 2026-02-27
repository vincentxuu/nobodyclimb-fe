import { fetchCragById, fetchCragAreas } from '@/lib/api/server-fetch'
import { RouteLayoutClient } from './RouteLayoutClient'

interface RouteLayoutProps {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export default async function RouteLayout({ children, params }: RouteLayoutProps) {
  const { id } = await params

  // 從 API 並行取得岩場、區域資料
  // 注意：路線列表改為在 client 端取得（避免 Worker 間 HTTP 請求失敗）
  const [apiCrag, apiAreas] = await Promise.all([
    fetchCragById(id),
    fetchCragAreas(id),
  ])

  if (!apiCrag) {
    return <div>岩場不存在</div>
  }

  const areas = apiAreas.map(a => ({ id: a.id, name: a.name }))

  return (
    <RouteLayoutClient
      cragId={id}
      cragName={apiCrag.name}
      routes={[]}
      areas={areas}
    >
      {children}
    </RouteLayoutClient>
  )
}
