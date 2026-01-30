import { getCragById, getCragRoutesForSidebar, getCragAreasForFilter } from '@/lib/crag-data'
import { RouteLayoutClient } from './RouteLayoutClient'

interface RouteLayoutProps {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export default async function RouteLayout({ children, params }: RouteLayoutProps) {
  const { id } = await params
  const cragData = getCragById(id)

  if (!cragData) {
    return <div>岩場不存在</div>
  }

  const routes = getCragRoutesForSidebar(id)
  const areas = getCragAreasForFilter(id)

  return (
    <RouteLayoutClient
      cragId={id}
      cragName={cragData.crag.name}
      routes={routes}
      areas={areas}
    >
      {children}
    </RouteLayoutClient>
  )
}
