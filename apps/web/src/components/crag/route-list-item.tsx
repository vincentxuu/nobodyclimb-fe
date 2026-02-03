'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { routeLoadingManager } from '@/lib/route-loading-manager'
import { useToast } from '@/components/ui/use-toast'
import { RATE_LIMIT_TOAST } from '@/lib/constants'
import type { RouteSidebarItem } from '@/lib/crag-data'

interface RouteListItemProps {
  route: RouteSidebarItem
  cragId: string
  isActive: boolean
  onClick?: () => void
}

export function RouteListItem({ route, cragId, isActive, onClick }: RouteListItemProps) {
  const router = useRouter()
  const { toast } = useToast()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()

    // 檢查是否可以載入路線
    if (!routeLoadingManager.canLoadRoute(route.id)) {
      console.warn('Route loading rate limited:', route.id)
      toast(RATE_LIMIT_TOAST)
      return
    }

    // 開始載入路線
    routeLoadingManager.startLoadingRoute(route.id)

    // 執行點擊回調
    onClick?.()

    // 導航到路線頁面
    router.push(`/crag/${cragId}/route/${route.id}`)
  }

  return (
    <Link
      href={`/crag/${cragId}/route/${route.id}`}
      prefetch={false}
      onClick={handleClick}
      className={cn(
        'flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors',
        'hover:bg-gray-100',
        isActive && 'bg-yellow-50 border-l-4 border-[#FFE70C]'
      )}
    >
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            'text-sm font-medium truncate',
            isActive ? 'text-[#1B1A1A]' : 'text-gray-700'
          )}
        >
          {route.name}
        </div>
        <div className="text-xs text-gray-500 truncate">{route.areaName}</div>
      </div>
      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
        <span
          className={cn(
            'text-xs px-2 py-0.5 rounded-full',
            isActive ? 'bg-[#FFE70C] text-[#1B1A1A]' : 'bg-gray-100 text-gray-600'
          )}
        >
          {route.grade}
        </span>
      </div>
    </Link>
  )
}
