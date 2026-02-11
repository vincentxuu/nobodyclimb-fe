'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  Mountain,
  RefreshCw,
  Plus,
  FolderOpen,
  Layers,
  Route as RouteIcon,
} from 'lucide-react'
import { adminCragService, AdminCragStats } from '@/lib/api/services'
import { AdminCrag, AdminArea, AdminSector } from '@/lib/types'

import CragTree, { SelectedItem, SelectedItemType } from './crag/CragTree'
import InlineCragForm from './crag/InlineCragForm'
import InlineAreaForm from './crag/InlineAreaForm'
import InlineSectorForm from './crag/InlineSectorForm'
import InlineRouteForm from './crag/InlineRouteForm'
import { AdminRoute } from './crag/types'

export default function AdminCragManagement() {
  // Stats
  const [stats, setStats] = useState<AdminCragStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  // Selected item state
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null)

  // Refresh trigger for tree
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Parent data cache for form display
  const [cragCache, setCragCache] = useState<Record<string, AdminCrag>>({})
  const [areaCache, setAreaCache] = useState<Record<string, AdminArea>>({})
  const [sectorCache, setSectorCache] = useState<Record<string, AdminSector>>({})

  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const response = await adminCragService.getStats()
      if (response.success && response.data) {
        setStats(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1)
    fetchStats()
  }

  // Handle item selection from tree
  const handleSelectItem = (item: SelectedItem | null) => {
    setSelectedItem(item)
    // Cache the data if available
    if (item?.data) {
      if (item.type === 'crag') {
        setCragCache((prev) => ({
          ...prev,
          [item.id]: item.data as AdminCrag,
        }))
      } else if (item.type === 'area') {
        setAreaCache((prev) => ({
          ...prev,
          [item.id]: item.data as AdminArea,
        }))
      } else if (item.type === 'sector') {
        setSectorCache((prev) => ({
          ...prev,
          [item.id]: item.data as AdminSector,
        }))
      }
    }
    // Also cache parent data if available
    if (item?.parentData) {
      if (item.parentData.crag) {
        setCragCache((prev) => ({
          ...prev,
          [item.parentData!.crag!.id]: item.parentData!.crag!,
        }))
      }
      if (item.parentData.area) {
        setAreaCache((prev) => ({
          ...prev,
          [item.parentData!.area!.id]: item.parentData!.area!,
        }))
      }
      if (item.parentData.sector) {
        setSectorCache((prev) => ({
          ...prev,
          [item.parentData!.sector!.id]: item.parentData!.sector!,
        }))
      }
    }
  }

  // Handle add button click from tree
  const handleAddItem = (
    type: SelectedItemType,
    parentIds: SelectedItem['parentIds']
  ) => {
    setSelectedItem({
      type,
      id: '',
      parentIds,
      isNew: true,
    })
  }

  // Handle new crag button
  const handleAddCrag = () => {
    setSelectedItem({
      type: 'crag',
      id: '',
      parentIds: { cragId: '' },
      isNew: true,
    })
  }

  // Handle form save
  const handleFormSave = () => {
    setRefreshTrigger((prev) => prev + 1)
    fetchStats()
    setSelectedItem(null)
  }

  // Handle form cancel
  const handleFormCancel = () => {
    setSelectedItem(null)
  }

  // Handle form delete
  const handleFormDelete = () => {
    setRefreshTrigger((prev) => prev + 1)
    fetchStats()
    setSelectedItem(null)
  }

  // Get parent names for display
  const getCragName = (cragId: string) => cragCache[cragId]?.name
  const getAreaName = (areaId: string) => areaCache[areaId]?.name
  const getSectorName = (sectorId: string) => sectorCache[sectorId]?.name

  // Render right panel content based on selected item
  const renderRightPanel = () => {
    if (!selectedItem) {
      return (
        <div className="flex-1 flex items-center justify-center text-wb-50">
          <div className="text-center">
            <Mountain className="h-12 w-12 mx-auto mb-3 text-wb-30" />
            <p>請從左側選擇一個項目進行編輯</p>
            <p className="text-xs text-wb-40 mt-1">
              或點擊 [+] 按鈕新增項目
            </p>
          </div>
        </div>
      )
    }

    switch (selectedItem.type) {
      case 'crag':
        return (
          <InlineCragForm
            crag={
              selectedItem.isNew
                ? null
                : (selectedItem.data as AdminCrag) ||
                  cragCache[selectedItem.id] ||
                  null
            }
            isNew={selectedItem.isNew}
            onSave={handleFormSave}
            onCancel={handleFormCancel}
            onDelete={handleFormDelete}
          />
        )

      case 'area':
        return (
          <InlineAreaForm
            area={
              selectedItem.isNew
                ? null
                : (selectedItem.data as AdminArea) ||
                  areaCache[selectedItem.id] ||
                  null
            }
            cragId={selectedItem.parentIds.cragId}
            cragName={getCragName(selectedItem.parentIds.cragId)}
            isNew={selectedItem.isNew}
            onSave={handleFormSave}
            onCancel={handleFormCancel}
            onDelete={handleFormDelete}
          />
        )

      case 'sector':
        return (
          <InlineSectorForm
            sector={
              selectedItem.isNew
                ? null
                : (selectedItem.data as AdminSector) ||
                  sectorCache[selectedItem.id] ||
                  null
            }
            cragId={selectedItem.parentIds.cragId}
            areaId={selectedItem.parentIds.areaId || ''}
            cragName={getCragName(selectedItem.parentIds.cragId)}
            areaName={
              selectedItem.parentIds.areaId
                ? getAreaName(selectedItem.parentIds.areaId)
                : undefined
            }
            isNew={selectedItem.isNew}
            onSave={handleFormSave}
            onCancel={handleFormCancel}
            onDelete={handleFormDelete}
          />
        )

      case 'route':
        return (
          <InlineRouteForm
            route={
              selectedItem.isNew
                ? null
                : (selectedItem.data as AdminRoute) || null
            }
            cragId={selectedItem.parentIds.cragId}
            areaId={selectedItem.parentIds.areaId}
            sectorId={selectedItem.parentIds.sectorId}
            cragName={getCragName(selectedItem.parentIds.cragId)}
            areaName={
              selectedItem.parentIds.areaId
                ? getAreaName(selectedItem.parentIds.areaId)
                : undefined
            }
            sectorName={
              selectedItem.parentIds.sectorId
                ? getSectorName(selectedItem.parentIds.sectorId)
                : undefined
            }
            isNew={selectedItem.isNew}
            onSave={handleFormSave}
            onCancel={handleFormCancel}
            onDelete={handleFormDelete}
          />
        )

      default:
        return null
    }
  }

  // Get icon for selected item type
  const getItemIcon = (type: SelectedItemType) => {
    switch (type) {
      case 'crag':
        return <Mountain className="h-4 w-4" />
      case 'area':
        return <FolderOpen className="h-4 w-4" />
      case 'sector':
        return <Layers className="h-4 w-4" />
      case 'route':
        return <RouteIcon className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-wb-100">
            岩場管理
          </h1>
          <p className="text-sm text-wb-70 mt-1">
            {statsLoading
              ? '載入中...'
              : `共 ${stats?.total_crags || 0} 個岩場，${stats?.total_routes || 0} 條路線`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddCrag}
            className="flex items-center gap-2 px-3 lg:px-4 py-2 text-sm bg-wb-100 text-white rounded-lg hover:bg-wb-90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">新增岩場</span>
          </button>
          <button
            onClick={handleRefresh}
            className="p-2 text-sm bg-wb-10 text-wb-70 rounded-lg hover:bg-wb-20 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main content: Left-Right split layout */}
      <div className="flex gap-4 h-[calc(100vh-180px)]">
        {/* Left panel: Tree navigation */}
        <div className="w-48 lg:w-72 flex-shrink-0 bg-white rounded-xl shadow-sm border border-wb-20 flex flex-col overflow-hidden">
          <CragTree
            selectedItem={selectedItem}
            onSelectItem={handleSelectItem}
            onAddItem={handleAddItem}
            refreshTrigger={refreshTrigger}
          />
        </div>

        {/* Right panel: Form area */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-wb-20 flex flex-col overflow-hidden">
          {renderRightPanel()}
        </div>
      </div>
    </div>
  )
}
