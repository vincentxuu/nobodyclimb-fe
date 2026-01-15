'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { RouteListItem } from './route-list-item'
import { RouteListFilter } from './route-list-filter'
import type { RouteSidebarItem } from '@/lib/crag-data'
import { getSectorsForArea } from '@/lib/crag-data'

interface RouteSidebarProps {
  cragId: string
  cragName: string
  routes: RouteSidebarItem[]
  areas: Array<{ id: string; name: string }>
  currentRouteId: string
}

export function RouteSidebar({
  cragId,
  cragName,
  routes,
  areas,
  currentRouteId,
}: RouteSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedArea, setSelectedArea] = useState('all')
  const [selectedSector, setSelectedSector] = useState('all')
  const [selectedGrade, setSelectedGrade] = useState('all')
  const [selectedType, setSelectedType] = useState('all')

  // 根據選擇的區域獲取 sectors
  const sectors = useMemo(() => {
    if (selectedArea === 'all') return []
    return getSectorsForArea(cragId, selectedArea)
  }, [cragId, selectedArea])

  const filteredRoutes = useMemo(() => {
    return routes.filter((route) => {
      // 文字搜尋
      const matchesSearch =
        !searchQuery ||
        route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        route.grade.toLowerCase().includes(searchQuery.toLowerCase()) ||
        route.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (route.sector && route.sector.toLowerCase().includes(searchQuery.toLowerCase()))

      // 區域篩選
      const matchesArea = selectedArea === 'all' || route.areaId === selectedArea

      // Sector 篩選
      const matchesSector = selectedSector === 'all' || route.sector === selectedSector

      // 難度篩選
      let matchesGrade = true
      if (selectedGrade !== 'all') {
        const grade = route.grade
        switch (selectedGrade) {
          case '5.0-5.7':
            matchesGrade = /^5\.[0-7](?![0-9])/.test(grade)
            break
          case '5.8-5.9':
            matchesGrade = /^5\.[89](?![0-9])/.test(grade)
            break
          case '5.10':
            matchesGrade = /^5\.10/.test(grade)
            break
          case '5.11':
            matchesGrade = /^5\.11/.test(grade)
            break
          case '5.12':
            matchesGrade = /^5\.12/.test(grade)
            break
          case '5.13+':
            matchesGrade = /^5\.1[3-5]/.test(grade)
            break
        }
      }

      // 類型篩選
      const matchesType = selectedType === 'all' || route.type === selectedType

      return matchesSearch && matchesArea && matchesSector && matchesGrade && matchesType
    })
  }, [routes, searchQuery, selectedArea, selectedSector, selectedGrade, selectedType])

  return (
    <aside className="hidden lg:flex lg:w-80 lg:flex-shrink-0 lg:flex-col border-r border-gray-200 bg-white">
      {/* 標題區 */}
      <div className="flex-shrink-0 border-b border-gray-200 p-4">
        <Link
          href={`/crag/${cragId}`}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#1B1A1A] transition-colors"
        >
          <ArrowLeft size={16} />
          <span>{cragName}</span>
        </Link>
        <h2 className="mt-3 text-lg font-semibold text-[#1B1A1A]">路線列表</h2>
        <p className="text-sm text-gray-500">
          {filteredRoutes.length === routes.length
            ? `${routes.length} 條路線`
            : `${filteredRoutes.length} / ${routes.length} 條路線`}
        </p>
      </div>

      {/* 篩選區 */}
      <div className="flex-shrink-0 border-b border-gray-200 p-4">
        <RouteListFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedArea={selectedArea}
          onAreaChange={setSelectedArea}
          selectedSector={selectedSector}
          onSectorChange={setSelectedSector}
          selectedGrade={selectedGrade}
          onGradeChange={setSelectedGrade}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          areas={areas}
          sectors={sectors}
        />
      </div>

      {/* 路線列表 */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredRoutes.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-gray-500">
            沒有符合條件的路線
          </div>
        ) : (
          <div className="space-y-1">
            {filteredRoutes.map((route) => (
              <RouteListItem
                key={route.id}
                route={route}
                cragId={cragId}
                isActive={route.id === currentRouteId}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}
