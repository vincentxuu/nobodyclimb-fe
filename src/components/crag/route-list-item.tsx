'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { RouteSidebarItem } from '@/lib/crag-data'

interface RouteListItemProps {
  route: RouteSidebarItem
  cragId: string
  isActive: boolean
  onClick?: () => void
}

export function RouteListItem({ route, cragId, isActive, onClick }: RouteListItemProps) {
  return (
    <Link
      href={`/crag/${cragId}/route/${route.id}`}
      prefetch={false}
      onClick={onClick}
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
