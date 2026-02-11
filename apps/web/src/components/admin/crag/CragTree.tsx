'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  Mountain,
  FolderOpen,
  Layers,
  Route as RouteIcon,
  Plus,
  Star,
  ChevronRight,
  ChevronDown,
  Loader2,
  Search,
} from 'lucide-react'
import { adminCragService } from '@/lib/api/services'
import { AdminCrag, AdminArea, AdminSector } from '@/lib/types'
import { AdminRoute, REGIONS, useDebounce } from './types'

// 選中項目的統一型別
export type SelectedItemType = 'crag' | 'area' | 'sector' | 'route'

export interface SelectedItem {
  type: SelectedItemType
  id: string
  parentIds: {
    cragId: string
    areaId?: string
    sectorId?: string
  }
  parentData?: {
    crag?: AdminCrag
    area?: AdminArea
    sector?: AdminSector
  }
  isNew?: boolean
  data?: AdminCrag | AdminArea | AdminSector | AdminRoute
}

interface CragTreeProps {
  selectedItem: SelectedItem | null
  onSelectItem: (item: SelectedItem | null) => void
  onAddItem: (type: SelectedItemType, parentIds: SelectedItem['parentIds']) => void
  refreshTrigger?: number
}

interface TreeNodeState {
  expanded: boolean
  loading: boolean
  areas?: AdminArea[]
  sectors?: Record<string, AdminSector[]>
  routes?: Record<string, AdminRoute[]>
  areaRoutes?: Record<string, AdminRoute[]>  // 直接屬於 area 的路線（沒有 sector_id）
}

export default function CragTree({
  selectedItem,
  onSelectItem,
  onAddItem,
  refreshTrigger = 0,
}: CragTreeProps) {
  // Crag list state
  const [crags, setCrags] = useState<AdminCrag[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  // Tree node states
  const [nodeStates, setNodeStates] = useState<Record<string, TreeNodeState>>({})

  // Fetch crags
  const fetchCrags = useCallback(async () => {
    setLoading(true)
    try {
      const response = await adminCragService.getCrags({
        limit: 100,
        search: debouncedSearch || undefined,
        region: region || undefined,
      })
      if (response.success && response.data) {
        setCrags(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch crags:', error)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, region])

  useEffect(() => {
    fetchCrags()
  }, [fetchCrags, refreshTrigger])

  // Fetch areas for a crag
  const fetchAreas = useCallback(async (cragId: string) => {
    setNodeStates((prev) => ({
      ...prev,
      [cragId]: { ...prev[cragId], loading: true },
    }))
    try {
      const response = await adminCragService.getAreas(cragId)
      if (response.success && response.data) {
        setNodeStates((prev) => ({
          ...prev,
          [cragId]: { ...prev[cragId], loading: false, areas: response.data },
        }))
      }
    } catch (error) {
      console.error('Failed to fetch areas:', error)
      setNodeStates((prev) => ({
        ...prev,
        [cragId]: { ...prev[cragId], loading: false },
      }))
    }
  }, [])

  // Fetch sectors and area routes for an area
  const fetchSectors = useCallback(async (cragId: string, areaId: string) => {
    const nodeKey = `${cragId}-${areaId}`
    setNodeStates((prev) => ({
      ...prev,
      [nodeKey]: { ...prev[nodeKey], loading: true },
    }))
    try {
      // 同時載入 sectors 和直接屬於 area 的路線
      const [sectorsResponse, routesResponse] = await Promise.all([
        adminCragService.getSectors(cragId, areaId),
        adminCragService.getRoutes(cragId, { area_id: areaId, limit: 100 }),
      ])

      // 過濾出沒有 sector_id 的路線（直接屬於 area）
      const allRoutes = (routesResponse.data || []) as unknown as AdminRoute[]
      const areaRoutes = allRoutes.filter(
        (route) => !route.sector_id
      )

      setNodeStates((prev) => {
        const cragState = prev[cragId] || {}
        return {
          ...prev,
          [cragId]: {
            ...cragState,
            sectors: {
              ...(cragState.sectors || {}),
              [areaId]: sectorsResponse.data || [],
            },
            areaRoutes: {
              ...(cragState.areaRoutes || {}),
              [areaId]: areaRoutes,
            },
          },
          [nodeKey]: { ...prev[nodeKey], loading: false },
        }
      })
    } catch (error) {
      console.error('Failed to fetch sectors:', error)
      setNodeStates((prev) => ({
        ...prev,
        [nodeKey]: { ...prev[nodeKey], loading: false },
      }))
    }
  }, [])

  // Fetch routes for a sector
  const fetchRoutes = useCallback(async (cragId: string, sectorId: string) => {
    const nodeKey = `sector-${sectorId}`
    setNodeStates((prev) => ({
      ...prev,
      [nodeKey]: { ...prev[nodeKey], loading: true },
    }))
    try {
      const response = await adminCragService.getRoutes(cragId, {
        sector_id: sectorId,
        limit: 100,
      })
      if (response.success && response.data) {
        setNodeStates((prev) => {
          const cragState = prev[cragId] || {}
          return {
            ...prev,
            [cragId]: {
              ...cragState,
              routes: {
                ...(cragState.routes || {}),
                [sectorId]: (response.data || []) as unknown as AdminRoute[],
              },
            },
            [nodeKey]: { ...prev[nodeKey], loading: false },
          }
        })
      }
    } catch (error) {
      console.error('Failed to fetch routes:', error)
      setNodeStates((prev) => ({
        ...prev,
        [nodeKey]: { ...prev[nodeKey], loading: false },
      }))
    }
  }, [])

  // Toggle crag expansion
  const toggleCrag = (crag: AdminCrag) => {
    const isExpanded = nodeStates[crag.id]?.expanded
    setNodeStates((prev) => ({
      ...prev,
      [crag.id]: {
        ...prev[crag.id],
        expanded: !isExpanded,
      },
    }))
    if (!isExpanded && !nodeStates[crag.id]?.areas) {
      fetchAreas(crag.id)
    }
  }

  // Toggle area expansion
  const toggleArea = (cragId: string, areaId: string) => {
    const nodeKey = `${cragId}-${areaId}`
    const isExpanded = nodeStates[nodeKey]?.expanded
    setNodeStates((prev) => ({
      ...prev,
      [nodeKey]: {
        ...prev[nodeKey],
        expanded: !isExpanded,
      },
    }))
    if (!isExpanded && !nodeStates[cragId]?.sectors?.[areaId]) {
      fetchSectors(cragId, areaId)
    }
  }

  // Toggle sector expansion
  const toggleSector = (cragId: string, areaId: string, sectorId: string) => {
    const nodeKey = `sector-${sectorId}`
    const isExpanded = nodeStates[nodeKey]?.expanded
    setNodeStates((prev) => ({
      ...prev,
      [nodeKey]: {
        ...prev[nodeKey],
        expanded: !isExpanded,
      },
    }))
    if (!isExpanded && !nodeStates[cragId]?.routes?.[sectorId]) {
      fetchRoutes(cragId, sectorId)
    }
  }

  // Check if item is selected
  const isSelected = (type: SelectedItemType, id: string) => {
    return selectedItem?.type === type && selectedItem?.id === id
  }

  // Handle item click
  const handleItemClick = (
    type: SelectedItemType,
    id: string,
    parentIds: SelectedItem['parentIds'],
    data?: AdminCrag | AdminArea | AdminSector | AdminRoute,
    parentData?: SelectedItem['parentData']
  ) => {
    onSelectItem({ type, id, parentIds, data, parentData })
  }

  // Handle add button click
  const handleAddClick = (
    e: React.MouseEvent,
    type: SelectedItemType,
    parentIds: SelectedItem['parentIds']
  ) => {
    e.stopPropagation()
    onAddItem(type, parentIds)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search and filter */}
      <div className="p-3 border-b border-wb-20 space-y-2 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-wb-50" />
          <input
            type="text"
            placeholder="搜尋岩場..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-wb-20 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-wb-100/20"
          />
        </div>
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-wb-20 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-wb-100/20 hidden lg:block"
        >
          <option value="">所有區域</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* Tree list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-wb-50" />
          </div>
        ) : crags.length === 0 ? (
          <div className="text-center py-8 text-sm text-wb-50">
            {search || region ? '沒有符合條件的岩場' : '尚無岩場資料'}
          </div>
        ) : (
          <div className="py-1">
            {crags.map((crag) => (
              <CragNode
                key={crag.id}
                crag={crag}
                nodeStates={nodeStates}
                isSelected={isSelected}
                onToggleCrag={toggleCrag}
                onToggleArea={toggleArea}
                onToggleSector={toggleSector}
                onItemClick={handleItemClick}
                onAddClick={handleAddClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Crag node component
interface CragNodeProps {
  crag: AdminCrag
  nodeStates: Record<string, TreeNodeState>
  isSelected: (type: SelectedItemType, id: string) => boolean
  onToggleCrag: (crag: AdminCrag) => void
  onToggleArea: (cragId: string, areaId: string) => void
  onToggleSector: (cragId: string, areaId: string, sectorId: string) => void
  onItemClick: (
    type: SelectedItemType,
    id: string,
    parentIds: SelectedItem['parentIds'],
    data?: AdminCrag | AdminArea | AdminSector | AdminRoute,
    parentData?: SelectedItem['parentData']
  ) => void
  onAddClick: (
    e: React.MouseEvent,
    type: SelectedItemType,
    parentIds: SelectedItem['parentIds']
  ) => void
}

function CragNode({
  crag,
  nodeStates,
  isSelected,
  onToggleCrag,
  onToggleArea,
  onToggleSector,
  onItemClick,
  onAddClick,
}: CragNodeProps) {
  const state = nodeStates[crag.id]
  const isExpanded = state?.expanded || false
  const isCragSelected = isSelected('crag', crag.id)

  return (
    <div>
      {/* Crag row */}
      <div
        className={`flex items-center gap-1 px-2 py-1.5 cursor-pointer transition-colors group ${
          isCragSelected ? 'bg-wb-100 text-white' : 'hover:bg-wb-10'
        }`}
      >
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleCrag(crag)
          }}
          className={`p-0.5 rounded hover:bg-white/20 ${
            isCragSelected ? 'text-white' : 'text-wb-50 hover:text-wb-70'
          }`}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        <div
          className="flex-1 flex items-center gap-2 min-w-0"
          onClick={() =>
            onItemClick('crag', crag.id, { cragId: crag.id }, crag)
          }
        >
          {crag.is_featured ? (
            <Star
              className={`h-3.5 w-3.5 flex-shrink-0 ${
                isCragSelected
                  ? 'text-yellow-300 fill-yellow-300'
                  : 'text-yellow-500 fill-yellow-500'
              }`}
            />
          ) : (
            <Mountain
              className={`h-3.5 w-3.5 flex-shrink-0 ${
                isCragSelected ? 'text-white/70' : 'text-wb-50'
              }`}
            />
          )}
          <span className="text-sm font-medium truncate">{crag.name}</span>
          <span
            className={`text-xs flex-shrink-0 ${
              isCragSelected ? 'text-white/60' : 'text-wb-40'
            }`}
          >
            ({crag.route_count || 0})
          </span>
        </div>
        <button
          onClick={(e) => onAddClick(e, 'area', { cragId: crag.id })}
          className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
            isCragSelected
              ? 'hover:bg-white/20 text-white'
              : 'hover:bg-wb-10 text-wb-50 hover:text-wb-70'
          }`}
          title="新增區域"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Areas */}
      {isExpanded && (
        <div className="ml-4">
          {state?.loading ? (
            <div className="flex items-center gap-2 px-2 py-2 text-xs text-wb-50">
              <Loader2 className="h-3 w-3 animate-spin" />
              載入中...
            </div>
          ) : !state?.areas || state.areas.length === 0 ? (
            <div className="px-2 py-2 text-xs text-wb-40 italic">尚無區域</div>
          ) : (
            state.areas.map((area) => (
              <AreaNode
                key={area.id}
                area={area}
                crag={crag}
                cragId={crag.id}
                nodeStates={nodeStates}
                isSelected={isSelected}
                onToggleArea={onToggleArea}
                onToggleSector={onToggleSector}
                onItemClick={onItemClick}
                onAddClick={onAddClick}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

// Area node component
interface AreaNodeProps {
  area: AdminArea
  crag: AdminCrag
  cragId: string
  nodeStates: Record<string, TreeNodeState>
  isSelected: (type: SelectedItemType, id: string) => boolean
  onToggleArea: (cragId: string, areaId: string) => void
  onToggleSector: (cragId: string, areaId: string, sectorId: string) => void
  onItemClick: (
    type: SelectedItemType,
    id: string,
    parentIds: SelectedItem['parentIds'],
    data?: AdminCrag | AdminArea | AdminSector | AdminRoute,
    parentData?: SelectedItem['parentData']
  ) => void
  onAddClick: (
    e: React.MouseEvent,
    type: SelectedItemType,
    parentIds: SelectedItem['parentIds']
  ) => void
}

function AreaNode({
  area,
  crag,
  cragId,
  nodeStates,
  isSelected,
  onToggleArea,
  onToggleSector,
  onItemClick,
  onAddClick,
}: AreaNodeProps) {
  const nodeKey = `${cragId}-${area.id}`
  const isExpanded = nodeStates[nodeKey]?.expanded || false
  const isAreaSelected = isSelected('area', area.id)
  const sectors = nodeStates[cragId]?.sectors?.[area.id]
  const areaRoutes = nodeStates[cragId]?.areaRoutes?.[area.id]  // 直接屬於 area 的路線
  const isLoading = nodeStates[nodeKey]?.loading
  const hasSectors = sectors && sectors.length > 0
  const hasAreaRoutes = areaRoutes && areaRoutes.length > 0

  return (
    <div>
      {/* Area row */}
      <div
        className={`flex items-center gap-1 px-2 py-1.5 cursor-pointer transition-colors group ${
          isAreaSelected ? 'bg-wb-100 text-white' : 'hover:bg-wb-10'
        }`}
      >
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleArea(cragId, area.id)
          }}
          className={`p-0.5 rounded hover:bg-white/20 ${
            isAreaSelected ? 'text-white' : 'text-wb-50 hover:text-wb-70'
          }`}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        <div
          className="flex-1 flex items-center gap-2 min-w-0"
          onClick={() =>
            onItemClick('area', area.id, { cragId, areaId: area.id }, area, { crag })
          }
        >
          <FolderOpen
            className={`h-3.5 w-3.5 flex-shrink-0 ${
              isAreaSelected ? 'text-white/70' : 'text-wb-50'
            }`}
          />
          <span className="text-sm truncate">{area.name}</span>
          <span
            className={`text-xs flex-shrink-0 ${
              isAreaSelected ? 'text-white/60' : 'text-wb-40'
            }`}
          >
            ({area.route_count || 0})
          </span>
        </div>
        {/* 新增岩壁或路線按鈕 */}
        <button
          onClick={(e) => onAddClick(e, 'sector', { cragId, areaId: area.id })}
          className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
            isAreaSelected
              ? 'hover:bg-white/20 text-white'
              : 'hover:bg-wb-10 text-wb-50 hover:text-wb-70'
          }`}
          title="新增岩壁"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Sectors and Area Routes */}
      {isExpanded && (
        <div className="ml-4">
          {isLoading ? (
            <div className="flex items-center gap-2 px-2 py-2 text-xs text-wb-50">
              <Loader2 className="h-3 w-3 animate-spin" />
              載入中...
            </div>
          ) : (
            <>
              {/* Sectors */}
              {hasSectors && sectors.map((sector) => (
                <SectorNode
                  key={sector.id}
                  sector={sector}
                  crag={crag}
                  area={area}
                  cragId={cragId}
                  areaId={area.id}
                  nodeStates={nodeStates}
                  isSelected={isSelected}
                  onToggleSector={onToggleSector}
                  onItemClick={onItemClick}
                  onAddClick={onAddClick}
                />
              ))}

              {/* 直接屬於 area 的路線（沒有 sector_id） */}
              {hasAreaRoutes && (
                <>
                  {hasSectors && (
                    <div className="px-2 py-1 text-xs text-wb-40 border-t border-wb-10 mt-1">
                      未分類路線
                    </div>
                  )}
                  {areaRoutes.map((route) => (
                    <RouteNode
                      key={route.id}
                      route={route}
                      crag={crag}
                      area={area}
                      sector={null}
                      cragId={cragId}
                      areaId={area.id}
                      sectorId=""
                      isSelected={isSelected}
                      onItemClick={onItemClick}
                    />
                  ))}
                </>
              )}

              {/* 沒有任何內容時顯示 */}
              {!hasSectors && !hasAreaRoutes && (
                <div className="px-2 py-2 text-xs text-wb-40 italic">
                  尚無岩壁或路線
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// Sector node component
interface SectorNodeProps {
  sector: AdminSector
  crag: AdminCrag
  area: AdminArea
  cragId: string
  areaId: string
  nodeStates: Record<string, TreeNodeState>
  isSelected: (type: SelectedItemType, id: string) => boolean
  onToggleSector: (cragId: string, areaId: string, sectorId: string) => void
  onItemClick: (
    type: SelectedItemType,
    id: string,
    parentIds: SelectedItem['parentIds'],
    data?: AdminCrag | AdminArea | AdminSector | AdminRoute,
    parentData?: SelectedItem['parentData']
  ) => void
  onAddClick: (
    e: React.MouseEvent,
    type: SelectedItemType,
    parentIds: SelectedItem['parentIds']
  ) => void
}

function SectorNode({
  sector,
  crag,
  area,
  cragId,
  areaId,
  nodeStates,
  isSelected,
  onToggleSector,
  onItemClick,
  onAddClick,
}: SectorNodeProps) {
  const nodeKey = `sector-${sector.id}`
  const isExpanded = nodeStates[nodeKey]?.expanded || false
  const isSectorSelected = isSelected('sector', sector.id)
  const routes = nodeStates[cragId]?.routes?.[sector.id]
  const isLoading = nodeStates[nodeKey]?.loading

  return (
    <div>
      {/* Sector row */}
      <div
        className={`flex items-center gap-1 px-2 py-1.5 cursor-pointer transition-colors group ${
          isSectorSelected ? 'bg-wb-100 text-white' : 'hover:bg-wb-10'
        }`}
      >
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleSector(cragId, areaId, sector.id)
          }}
          className={`p-0.5 rounded hover:bg-white/20 ${
            isSectorSelected ? 'text-white' : 'text-wb-50 hover:text-wb-70'
          }`}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        <div
          className="flex-1 flex items-center gap-2 min-w-0"
          onClick={() =>
            onItemClick(
              'sector',
              sector.id,
              { cragId, areaId, sectorId: sector.id },
              sector,
              { crag, area }
            )
          }
        >
          <Layers
            className={`h-3.5 w-3.5 flex-shrink-0 ${
              isSectorSelected ? 'text-white/70' : 'text-wb-50'
            }`}
          />
          <span className="text-sm truncate">{sector.name}</span>
        </div>
        <button
          onClick={(e) =>
            onAddClick(e, 'route', { cragId, areaId, sectorId: sector.id })
          }
          className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
            isSectorSelected
              ? 'hover:bg-white/20 text-white'
              : 'hover:bg-wb-10 text-wb-50 hover:text-wb-70'
          }`}
          title="新增路線"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Routes */}
      {isExpanded && (
        <div className="ml-4">
          {isLoading ? (
            <div className="flex items-center gap-2 px-2 py-2 text-xs text-wb-50">
              <Loader2 className="h-3 w-3 animate-spin" />
              載入中...
            </div>
          ) : !routes || routes.length === 0 ? (
            <div className="px-2 py-2 text-xs text-wb-40 italic">尚無路線</div>
          ) : (
            routes.map((route) => (
              <RouteNode
                key={route.id}
                route={route}
                crag={crag}
                area={area}
                sector={sector}
                cragId={cragId}
                areaId={areaId}
                sectorId={sector.id}
                isSelected={isSelected}
                onItemClick={onItemClick}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

// Route node component (leaf node)
interface RouteNodeProps {
  route: AdminRoute
  crag: AdminCrag
  area: AdminArea
  sector: AdminSector | null  // 可能為 null（直接屬於 area 的路線）
  cragId: string
  areaId: string
  sectorId: string
  isSelected: (type: SelectedItemType, id: string) => boolean
  onItemClick: (
    type: SelectedItemType,
    id: string,
    parentIds: SelectedItem['parentIds'],
    data?: AdminCrag | AdminArea | AdminSector | AdminRoute,
    parentData?: SelectedItem['parentData']
  ) => void
}

function RouteNode({
  route,
  crag,
  area,
  sector,
  cragId,
  areaId,
  sectorId,
  isSelected,
  onItemClick,
}: RouteNodeProps) {
  const isRouteSelected = isSelected('route', route.id)

  return (
    <div
      className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer transition-colors ${
        isRouteSelected ? 'bg-wb-100 text-white' : 'hover:bg-wb-10'
      }`}
      onClick={() =>
        onItemClick(
          'route',
          route.id,
          { cragId, areaId, sectorId: sectorId || undefined },
          route,
          { crag, area, sector: sector || undefined }
        )
      }
    >
      <span
        className={`w-4 text-center ${
          isRouteSelected ? 'text-white/50' : 'text-wb-30'
        }`}
      >
        •
      </span>
      <RouteIcon
        className={`h-3 w-3 flex-shrink-0 ${
          isRouteSelected ? 'text-white/70' : 'text-wb-50'
        }`}
      />
      <span className="text-sm truncate flex-1">{route.name}</span>
      {route.grade && (
        <span
          className={`text-xs flex-shrink-0 ${
            isRouteSelected ? 'text-white/60' : 'text-wb-40'
          }`}
        >
          {route.grade}
        </span>
      )}
    </div>
  )
}
