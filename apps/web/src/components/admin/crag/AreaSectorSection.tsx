'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Layers,
  FolderOpen,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { adminCragService } from '@/lib/api/services'
import { AdminArea, AdminSector } from '@/lib/types'
import { useToast } from '@/components/ui/use-toast'

interface AreaSectorSectionProps {
  cragId: string
  onAreasChange?: (areas: AdminArea[]) => void
}

export default function AreaSectorSection({ cragId, onAreasChange }: AreaSectorSectionProps) {
  const { toast } = useToast()

  // Area state
  const [areas, setAreas] = useState<AdminArea[]>([])
  const [areasLoading, setAreasLoading] = useState(false)
  const [showAreaForm, setShowAreaForm] = useState(false)
  const [editingArea, setEditingArea] = useState<AdminArea | null>(null)
  const [areaForm, setAreaForm] = useState({ name: '', name_en: '', description: '' })
  const [areaSubmitting, setAreaSubmitting] = useState(false)
  const [expandedAreaId, setExpandedAreaId] = useState<string | null>(null)
  const [deletingAreaId, setDeletingAreaId] = useState<string | null>(null)

  // Sector state
  const [areaSectors, setAreaSectors] = useState<Record<string, AdminSector[]>>({})
  const [sectorsLoading, setSectorsLoading] = useState(false)
  const [showSectorForm, setShowSectorForm] = useState(false)
  const [editingSector, setEditingSector] = useState<AdminSector | null>(null)
  const [sectorForm, setSectorForm] = useState({ name: '', name_en: '' })
  const [sectorSubmitting, setSectorSubmitting] = useState(false)
  const [deletingSectorId, setDeletingSectorId] = useState<string | null>(null)

  const fetchAreas = useCallback(async () => {
    setAreasLoading(true)
    try {
      const response = await adminCragService.getAreas(cragId)
      if (response.success && response.data) {
        setAreas(response.data)
        onAreasChange?.(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch areas:', error)
    } finally {
      setAreasLoading(false)
    }
  }, [cragId, onAreasChange])

  const fetchSectors = useCallback(async (areaId: string) => {
    setSectorsLoading(true)
    try {
      const response = await adminCragService.getSectors(cragId, areaId)
      if (response.success && response.data) {
        const sectors = response.data
        setAreaSectors((prev) => ({ ...prev, [areaId]: sectors }))
      }
    } catch (error) {
      console.error('Failed to fetch sectors:', error)
    } finally {
      setSectorsLoading(false)
    }
  }, [cragId])

  useEffect(() => {
    fetchAreas()
  }, [fetchAreas])

  // ---- Area CRUD ----
  const handleAddArea = () => {
    setEditingArea(null)
    setAreaForm({ name: '', name_en: '', description: '' })
    setShowAreaForm(true)
  }

  const handleEditArea = (area: AdminArea) => {
    setEditingArea(area)
    setAreaForm({
      name: area.name,
      name_en: area.name_en || '',
      description: area.description || '',
    })
    setShowAreaForm(true)
  }

  const handleAreaFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!areaForm.name.trim()) return

    setAreaSubmitting(true)
    try {
      const data = {
        name: areaForm.name.trim(),
        name_en: areaForm.name_en.trim() || undefined,
        description: areaForm.description.trim() || undefined,
      }

      if (editingArea) {
        await adminCragService.updateArea(cragId, editingArea.id, data)
      } else {
        await adminCragService.createArea(cragId, data)
      }

      await fetchAreas()
      setShowAreaForm(false)
      setEditingArea(null)
    } catch (error) {
      console.error('Failed to save area:', error)
      toast({ variant: 'destructive', title: '錯誤', description: '儲存區域失敗' })
    } finally {
      setAreaSubmitting(false)
    }
  }

  const handleDeleteArea = async (areaId: string) => {
    try {
      await adminCragService.deleteArea(cragId, areaId)
      await fetchAreas()
      setDeletingAreaId(null)
      if (expandedAreaId === areaId) {
        setExpandedAreaId(null)
      }
    } catch (error) {
      console.error('Failed to delete area:', error)
      toast({ variant: 'destructive', title: '錯誤', description: '刪除區域失敗' })
    }
  }

  const toggleAreaExpand = (areaId: string) => {
    if (expandedAreaId === areaId) {
      setExpandedAreaId(null)
      setShowSectorForm(false)
    } else {
      setExpandedAreaId(areaId)
      setShowSectorForm(false)
      fetchSectors(areaId)
    }
  }

  // ---- Sector CRUD ----
  const handleAddSector = () => {
    setEditingSector(null)
    setSectorForm({ name: '', name_en: '' })
    setShowSectorForm(true)
  }

  const handleEditSector = (sector: AdminSector) => {
    setEditingSector(sector)
    setSectorForm({
      name: sector.name,
      name_en: sector.name_en || '',
    })
    setShowSectorForm(true)
  }

  const handleSectorFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!expandedAreaId || !sectorForm.name.trim()) return

    setSectorSubmitting(true)
    try {
      const data = {
        name: sectorForm.name.trim(),
        name_en: sectorForm.name_en.trim() || undefined,
      }

      if (editingSector) {
        await adminCragService.updateSector(cragId, expandedAreaId, editingSector.id, data)
      } else {
        await adminCragService.createSector(cragId, expandedAreaId, data)
      }

      await fetchSectors(expandedAreaId)
      setShowSectorForm(false)
      setEditingSector(null)
    } catch (error) {
      console.error('Failed to save sector:', error)
      toast({ variant: 'destructive', title: '錯誤', description: '儲存岩壁失敗' })
    } finally {
      setSectorSubmitting(false)
    }
  }

  const handleDeleteSector = async (sectorId: string) => {
    if (!expandedAreaId) return
    try {
      await adminCragService.deleteSector(cragId, expandedAreaId, sectorId)
      await fetchSectors(expandedAreaId)
      setDeletingSectorId(null)
    } catch (error) {
      console.error('Failed to delete sector:', error)
      toast({ variant: 'destructive', title: '錯誤', description: '刪除岩壁失敗' })
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-wb-100 flex items-center gap-2">
          <Layers className="h-4 w-4" />
          區域管理 ({areas.length})
        </h4>
        <button
          onClick={handleAddArea}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-wb-100 text-white rounded-lg hover:bg-wb-90 transition-colors"
        >
          <Plus className="h-3 w-3" />
          新增區域
        </button>
      </div>

      {/* 區域表單 */}
      {showAreaForm && (
        <div className="bg-white rounded-lg border border-wb-20 p-3">
          <form onSubmit={handleAreaFormSubmit} className="space-y-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-wb-90">
                {editingArea ? '編輯區域' : '新增區域'}
              </span>
              <button
                type="button"
                onClick={() => { setShowAreaForm(false); setEditingArea(null) }}
                className="p-1 text-wb-50 hover:text-wb-100 rounded"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                value={areaForm.name}
                onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })}
                placeholder="區域名稱（必填）"
                className="px-2.5 py-1.5 text-sm border border-wb-20 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-wb-100/20"
                required
              />
              <input
                type="text"
                value={areaForm.name_en}
                onChange={(e) => setAreaForm({ ...areaForm, name_en: e.target.value })}
                placeholder="英文名稱"
                className="px-2.5 py-1.5 text-sm border border-wb-20 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-wb-100/20"
              />
              <input
                type="text"
                value={areaForm.description}
                onChange={(e) => setAreaForm({ ...areaForm, description: e.target.value })}
                placeholder="描述"
                className="px-2.5 py-1.5 text-sm border border-wb-20 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-wb-100/20"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setShowAreaForm(false); setEditingArea(null) }}
                className="px-2.5 py-1 text-xs text-wb-70 hover:text-wb-100 rounded hover:bg-wb-10"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={areaSubmitting || !areaForm.name.trim()}
                className="flex items-center gap-1 px-2.5 py-1 text-xs bg-wb-100 text-white rounded hover:bg-wb-90 disabled:opacity-50"
              >
                {areaSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                {editingArea ? '更新' : '新增'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 區域列表 */}
      {areasLoading ? (
        <div className="flex items-center justify-center py-3">
          <Loader2 className="h-4 w-4 animate-spin text-wb-50" />
        </div>
      ) : areas.length === 0 ? (
        <div className="text-center py-3 text-xs text-wb-50">
          尚無區域資料，點擊「新增區域」開始建立
        </div>
      ) : (
        <div className="space-y-1">
          {areas.map((area) => (
            <div key={area.id} className="bg-white rounded-lg border border-wb-20">
              <div
                className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-wb-10/50 transition-colors ${expandedAreaId === area.id ? 'bg-wb-10/50' : ''}`}
                onClick={() => toggleAreaExpand(area.id)}
              >
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-3.5 w-3.5 text-wb-70" />
                  <span className="text-sm font-medium text-wb-100">{area.name}</span>
                  {area.name_en && (
                    <span className="text-xs text-wb-50">{area.name_en}</span>
                  )}
                  <span className="text-xs text-wb-50">
                    ({area.route_count} 路線 / {area.bolt_count} bolt)
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEditArea(area) }}
                    className="p-1 text-wb-50 hover:text-wb-100 hover:bg-wb-10 rounded transition-colors"
                    title="編輯區域"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  {deletingAreaId === area.id ? (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleDeleteArea(area.id)}
                        className="px-1.5 py-0.5 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        確認
                      </button>
                      <button
                        onClick={() => setDeletingAreaId(null)}
                        className="px-1.5 py-0.5 text-xs text-wb-70 rounded hover:bg-wb-10"
                      >
                        取消
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeletingAreaId(area.id) }}
                      className="p-1 text-wb-50 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="刪除區域"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                  {expandedAreaId === area.id ? (
                    <ChevronUp className="h-3.5 w-3.5 text-wb-50" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-wb-50" />
                  )}
                </div>
              </div>

              {/* 展開：岩壁分區 */}
              {expandedAreaId === area.id && (
                <div className="border-t border-wb-20 px-3 py-2 bg-wb-10/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-wb-70">
                      岩壁分區 ({areaSectors[area.id]?.length || 0})
                    </span>
                    <button
                      onClick={handleAddSector}
                      className="flex items-center gap-1 px-2 py-0.5 text-xs bg-wb-100 text-white rounded hover:bg-wb-90 transition-colors"
                    >
                      <Plus className="h-2.5 w-2.5" />
                      新增岩壁
                    </button>
                  </div>

                  {/* 岩壁表單 */}
                  {showSectorForm && (
                    <div className="bg-white rounded border border-wb-20 p-2">
                      <form onSubmit={handleSectorFormSubmit} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={sectorForm.name}
                          onChange={(e) => setSectorForm({ ...sectorForm, name: e.target.value })}
                          placeholder="岩壁名稱"
                          className="flex-1 px-2 py-1 text-xs border border-wb-20 rounded focus:outline-none focus:ring-1 focus:ring-wb-100/20"
                          required
                        />
                        <input
                          type="text"
                          value={sectorForm.name_en}
                          onChange={(e) => setSectorForm({ ...sectorForm, name_en: e.target.value })}
                          placeholder="英文名"
                          className="flex-1 px-2 py-1 text-xs border border-wb-20 rounded focus:outline-none focus:ring-1 focus:ring-wb-100/20"
                        />
                        <button
                          type="submit"
                          disabled={sectorSubmitting || !sectorForm.name.trim()}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-wb-100 text-white rounded hover:bg-wb-90 disabled:opacity-50"
                        >
                          {sectorSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                          {editingSector ? '更新' : '新增'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowSectorForm(false); setEditingSector(null) }}
                          className="p-1 text-wb-50 hover:text-wb-100 rounded"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </form>
                    </div>
                  )}

                  {/* 岩壁列表 */}
                  {sectorsLoading ? (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="h-3 w-3 animate-spin text-wb-50" />
                    </div>
                  ) : !areaSectors[area.id] || areaSectors[area.id].length === 0 ? (
                    <div className="text-center py-2 text-xs text-wb-50">
                      尚無岩壁分區
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {areaSectors[area.id].map((sector) => (
                        <div
                          key={sector.id}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-wb-20 rounded text-xs"
                        >
                          <span className="text-wb-100 font-medium">{sector.name}</span>
                          {sector.name_en && (
                            <span className="text-wb-50">{sector.name_en}</span>
                          )}
                          <button
                            onClick={() => handleEditSector(sector)}
                            className="p-0.5 text-wb-50 hover:text-wb-100 rounded transition-colors"
                          >
                            <Pencil className="h-2.5 w-2.5" />
                          </button>
                          {deletingSectorId === sector.id ? (
                            <div className="flex items-center gap-0.5">
                              <button
                                onClick={() => handleDeleteSector(sector.id)}
                                className="px-1 text-xs text-red-500 hover:text-red-600"
                              >
                                刪
                              </button>
                              <button
                                onClick={() => setDeletingSectorId(null)}
                                className="px-1 text-xs text-wb-50 hover:text-wb-100"
                              >
                                取消
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeletingSectorId(sector.id)}
                              className="p-0.5 text-wb-50 hover:text-red-500 rounded transition-colors"
                            >
                              <Trash2 className="h-2.5 w-2.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
