'use client'

import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { useRouteDetail } from '@/hooks/api/useCrags'
import type { RouteDetailData } from '@/lib/crag-data'
import RouteDetailClient from './RouteDetailClient'

interface RouteDetailFallbackProps {
  cragId: string
  routeId: string
}

/**
 * Client-side fallback：當 Server Component 無法從 API 取得資料時
 * （例如 Cloudflare Worker 間 HTTP 請求限制），在瀏覽器端取得資料
 */
export default function RouteDetailFallback({ cragId, routeId }: RouteDetailFallbackProps) {
  const { data, isLoading, error } = useRouteDetail(cragId, routeId)
  const t = useTranslations('CragPage')

  // 當 client-side 成功取得資料後，更新瀏覽器 tab 標題
  // （server-side metadata 因 Cloudflare Worker 限制無法取得資料，會設為「找不到路線」）
  useEffect(() => {
    if (data?.route) {
      document.title = `${data.route.name} (${data.route.grade})`
    }
  }, [data])

  if (isLoading) {
    return (
      <main className="min-h-full bg-gray-50">
        <div className="relative mx-auto px-4 py-4 lg:px-8 lg:py-8">
          <div className="mb-12 rounded-lg bg-white p-6 shadow-sm md:p-8">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-48 mb-4" />
              <div className="h-8 bg-gray-200 rounded w-64 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-32 mb-8" />
              <div className="h-4 bg-gray-200 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="min-h-full bg-gray-50">
        <div className="relative mx-auto px-4 py-4 lg:px-8 lg:py-8">
          <div className="text-center py-12">
            <p className="text-gray-500">{t('cragNotFound')}</p>
          </div>
        </div>
      </main>
    )
  }

  // 將 useRouteDetail 的資料格式轉為 RouteDetailData
  const routeDetailData: RouteDetailData = {
    route: data.route,
    crag: {
      id: data.crag.id,
      name: data.crag.name,
      nameEn: '',
      slug: data.crag.slug,
      location: '',
    },
    area: data.area ? { ...data.area, nameEn: '' } : null,
    relatedRoutes: [],
  }

  return <RouteDetailClient data={routeDetailData} />
}
