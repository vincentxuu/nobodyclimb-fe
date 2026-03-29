import { fetchCragAreas, fetchCragById } from '@/lib/api/server-fetch'
import { RouteLayoutClient } from './RouteLayoutClient'

interface RouteLayoutProps {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export default async function RouteLayout({ children, params }: RouteLayoutProps) {
  const { id } = await params

  // 從 API 並行取得岩場、區域資料
  // 注意：這些呼叫在 Cloudflare Worker 間可能失敗，失敗時改由 client 端取得
  const [apiCrag, apiAreas] = await Promise.all([fetchCragById(id), fetchCragAreas(id)])

  const areas = apiAreas.map((a) => ({ id: a.id, name: a.name }))

  return (
    <RouteLayoutClient cragId={id} cragName={apiCrag?.name || ''} routes={[]} areas={areas}>
      {children}
    </RouteLayoutClient>
  )
}
