'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { List, X, ArrowLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { RouteListFilter } from './route-list-filter'
import { VirtualizedRouteList } from './virtualized-route-list'
import type { RouteSidebarItem } from '@/lib/crag-data'
import { getSectorsForArea } from '@/lib/crag-data'
import { useRouteFilter } from '@/lib/hooks/useRouteFilter'

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

  // 使用共用的路線過濾 hook（包含防抖）
  const {
    filterState,
    filteredRoutes,
    setSearchQuery,
    setSelectedArea,
    setSelectedSector,
    setSelectedGrade,
    setSelectedType,
  } = useRouteFilter(routes)

  // 根據選擇的區域獲取 sectors（使用緩存）
  const sectors = useMemo(() => {
    if (filterState.selectedArea === 'all') return []
    return getSectorsForArea(cragId, filterState.selectedArea)
  }, [cragId, filterState.selectedArea])

  const handleItemClick = useCallback(() => {
    setIsOpen(false)
  }, [])

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
                    prefetch={false}
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
                  searchQuery={filterState.searchQuery}
                  onSearchChange={setSearchQuery}
                  selectedArea={filterState.selectedArea}
                  onAreaChange={setSelectedArea}
                  selectedSector={filterState.selectedSector}
                  onSectorChange={setSelectedSector}
                  selectedGrade={filterState.selectedGrade}
                  onGradeChange={setSelectedGrade}
                  selectedType={filterState.selectedType}
                  onTypeChange={setSelectedType}
                  areas={areas}
                  sectors={sectors}
                />
              </div>

              {/* 路線列表 - 使用虛擬化 */}
              <div className="min-h-0 flex-1 overflow-hidden overscroll-y-contain p-2">
                <VirtualizedRouteList
                  routes={filteredRoutes}
                  cragId={cragId}
                  currentRouteId={currentRouteId}
                  onItemClick={handleItemClick}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
