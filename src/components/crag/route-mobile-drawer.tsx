'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { List, X, ArrowLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { RouteListItem } from './route-list-item'
import { RouteListFilter } from './route-list-filter'
import type { RouteSidebarItem } from '@/lib/crag-data'
import { getSectorsForArea } from '@/lib/crag-data'

interface RouteMobileDrawerProps {
  cragId: string
  cragName: string
  routes: RouteSidebarItem[]
  areas: Array<{ id: string; name: string }>
  currentRouteId: string
}

export function RouteMobileDrawer({
  cragId,
  cragName,
  routes,
  areas,
  currentRouteId,
}: RouteMobileDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)
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
    if (!routes || !Array.isArray(routes)) return []

    return routes.filter((route) => {
      if (!route || typeof route !== 'object') return false

      const routeName = route.name || ''
      const routeGrade = route.grade || ''
      const routeType = route.type || ''
      const routeSector = route.sector || ''
      const routeAreaId = route.areaId || ''

      // 文字搜尋
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch =
        !searchQuery ||
        routeName.toLowerCase().includes(searchLower) ||
        routeGrade.toLowerCase().includes(searchLower) ||
        routeType.toLowerCase().includes(searchLower) ||
        routeSector.toLowerCase().includes(searchLower)

      // 區域篩選
      const matchesArea = selectedArea === 'all' || routeAreaId === selectedArea

      // Sector 篩選
      const matchesSector = selectedSector === 'all' || routeSector === selectedSector

      // 難度篩選
      let matchesGrade = true
      if (selectedGrade !== 'all' && routeGrade) {
        switch (selectedGrade) {
          case '5.0-5.7':
            matchesGrade = /^5\.[0-7](?![0-9])/.test(routeGrade)
            break
          case '5.8-5.9':
            matchesGrade = /^5\.[89](?![0-9])/.test(routeGrade)
            break
          case '5.10':
            matchesGrade = /^5\.10/.test(routeGrade)
            break
          case '5.11':
            matchesGrade = /^5\.11/.test(routeGrade)
            break
          case '5.12':
            matchesGrade = /^5\.12/.test(routeGrade)
            break
          case '5.13+':
            matchesGrade = /^5\.1[3-5]/.test(routeGrade)
            break
          default:
            matchesGrade = true
        }
      }

      // 類型篩選
      const matchesType = selectedType === 'all' || routeType === selectedType

      return matchesSearch && matchesArea && matchesSector && matchesGrade && matchesType
    })
  }, [routes, searchQuery, selectedArea, selectedSector, selectedGrade, selectedType])

  return (
    <>
      {/* 浮動按鈕 - 僅手機和平板顯示 */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#1B1A1A] text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        aria-label="開啟路線列表"
      >
        <List size={24} />
      </button>

      {/* 抽屜 */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* 遮罩 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="lg:hidden fixed inset-0 z-50 bg-black/50"
            />

            {/* 抽屜內容 */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex max-h-[80vh] flex-col rounded-t-2xl bg-white shadow-xl"
            >
              {/* 拖曳把手 */}
              <div className="flex justify-center py-2">
                <div className="h-1 w-12 rounded-full bg-gray-300" />
              </div>

              {/* 標題列 */}
              <div className="flex items-center justify-between border-b border-gray-200 px-4 pb-3">
                <div>
                  <Link
                    href={`/crag/${cragId}`}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-[#1B1A1A]"
                    onClick={() => setIsOpen(false)}
                  >
                    <ArrowLeft size={14} />
                    {cragName}
                  </Link>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {filteredRoutes.length === routes.length
                      ? `${routes.length} 條路線`
                      : `${filteredRoutes.length} / ${routes.length} 條路線`}
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-2 hover:bg-gray-100"
                  aria-label="關閉"
                >
                  <X size={20} />
                </button>
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
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-2">
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
                        onClick={() => setIsOpen(false)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
