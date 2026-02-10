'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Route as RouteIcon,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
  Hash,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { adminCragService } from '@/lib/api/services'
import { AdminArea, AdminSector } from '@/lib/types'
import { useToast } from '@/components/ui/use-toast'
import { AdminRoute, RouteFormData, emptyRouteForm, routeTypeLabels } from './types'

interface RouteSectionProps {
  cragId: string
  areas: AdminArea[]
  onRoutesChange?: () => void
}

const ROUTES_PER_PAGE = 30

export default function RouteSection({ cragId, areas, onRoutesChange }: RouteSectionProps) {
  const { toast } = useToast()

  // Route state
  const [routes, setRoutes] = useState<AdminRoute[]>([])
  const [routesLoading, setRoutesLoading] = useState(false)
  const [routePage, setRoutePage] = useState(1)
  const [routePagination, setRoutePagination] = useState({
    total: 0,
    total_pages: 0,
  })

  // Route form
  const [showRouteForm, setShowRouteForm] = useState(false)
  const [editingRoute, setEditingRoute] = useState<AdminRoute | null>(null)
  const [routeForm, setRouteForm] = useState<RouteFormData>(emptyRouteForm)
  const [routeSubmitting, setRouteSubmitting] = useState(false)

  // Delete confirmation
  const [deletingRouteId, setDeletingRouteId] = useState<string | null>(null)

  // Sectors for route form dropdown
  const [formSectors, setFormSectors] = useState<AdminSector[]>([])

  const fetchRoutes = useCallback(async () => {
    setRoutesLoading(true)
    try {
      const response = await adminCragService.getRoutes(cragId, {
        page: routePage,
        limit: ROUTES_PER_PAGE,
      })
      if (response.success && response.data) {
        setRoutes(response.data as unknown as AdminRoute[])
        if (response.pagination) {
          setRoutePagination({
            total: response.pagination.total,
            total_pages: response.pagination.total_pages,
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch routes:', error)
    } finally {
      setRoutesLoading(false)
    }
  }, [cragId, routePage])

  const fetchSectorsForForm = useCallback(async (areaId: string) => {
    try {
      const response = await adminCragService.getSectors(cragId, areaId)
      if (response.success && response.data) {
        setFormSectors(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch sectors:', error)
    }
  }, [cragId])

  useEffect(() => {
    fetchRoutes()
  }, [fetchRoutes])

  // ---- Route CRUD ----
  const handleAddRoute = () => {
    setEditingRoute(null)
    setRouteForm(emptyRouteForm)
    setFormSectors([])
    setShowRouteForm(true)
  }

  const handleEditRoute = (route: AdminRoute) => {
    setEditingRoute(route)
    setRouteForm({
      name: route.name,
      grade: route.grade || '',
      grade_system: route.grade_system || 'yds',
      height: route.height?.toString() || '',
      bolt_count: route.bolt_count?.toString() || '',
      route_type: route.route_type || 'sport',
      description: route.description || '',
      first_ascent: route.first_ascent || '',
      area_id: route.area_id || '',
      sector_id: route.sector_id || '',
    })
    if (route.area_id) {
      fetchSectorsForForm(route.area_id)
    }
    setShowRouteForm(true)
  }

  const handleCancelRouteForm = () => {
    setShowRouteForm(false)
    setEditingRoute(null)
    setRouteForm(emptyRouteForm)
    setFormSectors([])
  }

  const handleRouteFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!routeForm.name.trim()) return

    setRouteSubmitting(true)
    try {
      const data: Record<string, unknown> = {
        name: routeForm.name.trim(),
        grade: routeForm.grade || null,
        grade_system: routeForm.grade_system || 'yds',
        height: routeForm.height ? Number(routeForm.height) : null,
        bolt_count: routeForm.bolt_count ? Number(routeForm.bolt_count) : null,
        route_type: routeForm.route_type || 'sport',
        description: routeForm.description || null,
        first_ascent: routeForm.first_ascent || null,
        area_id: routeForm.area_id || null,
        sector_id: routeForm.sector_id || null,
      }

      if (editingRoute) {
        await adminCragService.updateRoute(cragId, editingRoute.id, data)
      } else {
        await adminCragService.createRoute(cragId, data)
      }

      await fetchRoutes()
      handleCancelRouteForm()
      onRoutesChange?.()
    } catch (error) {
      console.error('Failed to save route:', error)
      toast({ variant: 'destructive', title: '錯誤', description: '儲存路線失敗' })
    } finally {
      setRouteSubmitting(false)
    }
  }

  const handleDeleteRoute = async (routeId: string) => {
    try {
      await adminCragService.deleteRoute(cragId, routeId)
      await fetchRoutes()
      setDeletingRouteId(null)
      onRoutesChange?.()
    } catch (error) {
      console.error('Failed to delete route:', error)
      toast({ variant: 'destructive', title: '錯誤', description: '刪除路線失敗' })
    }
  }

  return (
    <div className="space-y-3">
      {/* 路線列表標題 */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-wb-100 flex items-center gap-2">
          <RouteIcon className="h-4 w-4" />
          路線列表 ({routePagination.total || routes.length})
        </h4>
        <button
          onClick={handleAddRoute}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-wb-100 text-white rounded-lg hover:bg-wb-90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          新增路線
        </button>
      </div>

      {/* 路線表單 */}
      {showRouteForm && (
        <div className="bg-white rounded-lg border border-wb-20 p-4">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-sm font-medium text-wb-100">
              {editingRoute ? '編輯路線' : '新增路線'}
            </h5>
            <button
              onClick={handleCancelRouteForm}
              className="p-1 text-wb-50 hover:text-wb-100 rounded transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleRouteFormSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-wb-70 mb-1">
                  名稱 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={routeForm.name}
                  onChange={(e) => setRouteForm({ ...routeForm, name: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-wb-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-wb-100/20"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-wb-70 mb-1">難度</label>
                <input
                  type="text"
                  value={routeForm.grade}
                  onChange={(e) => setRouteForm({ ...routeForm, grade: e.target.value })}
                  placeholder="例：5.10a"
                  className="w-full px-3 py-1.5 text-sm border border-wb-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-wb-100/20"
                />
              </div>
              <div>
                <label className="block text-xs text-wb-70 mb-1">難度系統</label>
                <select
                  value={routeForm.grade_system}
                  onChange={(e) => setRouteForm({ ...routeForm, grade_system: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-wb-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-wb-100/20 bg-white"
                >
                  <option value="yds">YDS</option>
                  <option value="french">French</option>
                  <option value="v-scale">V-Scale</option>
                  <option value="font">Font</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-wb-70 mb-1">類型</label>
                <select
                  value={routeForm.route_type}
                  onChange={(e) => setRouteForm({ ...routeForm, route_type: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-wb-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-wb-100/20 bg-white"
                >
                  <option value="sport">運動攀登</option>
                  <option value="trad">傳統攀登</option>
                  <option value="boulder">抱石</option>
                  <option value="mixed">混合</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-wb-70 mb-1">高度 (m)</label>
                <input
                  type="number"
                  value={routeForm.height}
                  onChange={(e) => setRouteForm({ ...routeForm, height: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-wb-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-wb-100/20"
                />
              </div>
              <div>
                <label className="block text-xs text-wb-70 mb-1">Bolt 數</label>
                <input
                  type="number"
                  value={routeForm.bolt_count}
                  onChange={(e) => setRouteForm({ ...routeForm, bolt_count: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-wb-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-wb-100/20"
                />
              </div>
              <div>
                <label className="block text-xs text-wb-70 mb-1">首攀者</label>
                <input
                  type="text"
                  value={routeForm.first_ascent}
                  onChange={(e) => setRouteForm({ ...routeForm, first_ascent: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-wb-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-wb-100/20"
                />
              </div>
            </div>
            {/* 區域/岩壁歸屬 */}
            {areas.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-wb-70 mb-1">所屬區域</label>
                  <select
                    value={routeForm.area_id}
                    onChange={(e) => {
                      const newAreaId = e.target.value
                      setRouteForm({ ...routeForm, area_id: newAreaId, sector_id: '' })
                      setFormSectors([])
                      if (newAreaId) {
                        fetchSectorsForForm(newAreaId)
                      }
                    }}
                    className="w-full px-3 py-1.5 text-sm border border-wb-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-wb-100/20 bg-white"
                  >
                    <option value="">未指定</option>
                    {areas.map((area) => (
                      <option key={area.id} value={area.id}>{area.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-wb-70 mb-1">所屬岩壁</label>
                  <select
                    value={routeForm.sector_id}
                    onChange={(e) => setRouteForm({ ...routeForm, sector_id: e.target.value })}
                    disabled={!routeForm.area_id}
                    className="w-full px-3 py-1.5 text-sm border border-wb-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-wb-100/20 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">未指定</option>
                    {formSectors.map((sector) => (
                      <option key={sector.id} value={sector.id}>{sector.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs text-wb-70 mb-1">描述</label>
              <textarea
                value={routeForm.description}
                onChange={(e) => setRouteForm({ ...routeForm, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-1.5 text-sm border border-wb-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-wb-100/20 resize-none"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelRouteForm}
                className="px-3 py-1.5 text-sm text-wb-70 hover:text-wb-100 rounded-lg hover:bg-wb-10 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={routeSubmitting || !routeForm.name.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-wb-100 text-white rounded-lg hover:bg-wb-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {routeSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                {editingRoute ? '更新' : '新增'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 路線列表 */}
      {routesLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-wb-50" />
        </div>
      ) : routes.length === 0 ? (
        <div className="text-center py-6 text-sm text-wb-50">
          此岩場尚無路線資料
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-wb-20 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-wb-10">
              <tr className="text-left text-xs text-wb-70">
                <th className="px-3 py-2 font-medium">路線名稱</th>
                <th className="px-3 py-2 font-medium">難度</th>
                <th className="px-3 py-2 font-medium">類型</th>
                <th className="px-3 py-2 font-medium text-center">高度</th>
                <th className="px-3 py-2 font-medium text-center">Bolt</th>
                <th className="px-3 py-2 font-medium">首攀</th>
                <th className="px-3 py-2 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((route) => (
                <tr
                  key={route.id}
                  className="border-t border-wb-20 hover:bg-wb-10/50 transition-colors"
                >
                  <td className="px-3 py-2 font-medium text-wb-100">
                    {route.name}
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-wb-10 text-xs font-medium text-wb-90">
                      <Hash className="h-3 w-3" />
                      {route.grade || '-'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-wb-70">
                    {routeTypeLabels[route.route_type] || route.route_type}
                  </td>
                  <td className="px-3 py-2 text-center text-wb-70">
                    {route.height ? `${route.height}m` : '-'}
                  </td>
                  <td className="px-3 py-2 text-center text-wb-70">
                    {route.bolt_count ?? '-'}
                  </td>
                  <td className="px-3 py-2 text-wb-70 text-xs">
                    {route.first_ascent || '-'}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEditRoute(route)}
                        className="p-1.5 text-wb-50 hover:text-wb-100 hover:bg-wb-10 rounded transition-colors"
                        title="編輯"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {deletingRouteId === route.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDeleteRoute(route.id)}
                            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                          >
                            確認
                          </button>
                          <button
                            onClick={() => setDeletingRouteId(null)}
                            className="px-2 py-1 text-xs text-wb-70 hover:text-wb-100 rounded hover:bg-wb-10 transition-colors"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingRouteId(route.id)}
                          className="p-1.5 text-wb-50 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="刪除"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 路線分頁 */}
          {routePagination.total_pages > 1 && (
            <div className="flex items-center justify-between px-3 py-2 border-t border-wb-20 bg-wb-10/50">
              <div className="text-xs text-wb-70">
                共 {routePagination.total} 條路線，第 {routePage} / {routePagination.total_pages} 頁
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setRoutePage(routePage - 1)}
                  disabled={routePage <= 1}
                  className="p-1 text-wb-70 hover:text-wb-100 hover:bg-wb-10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <span className="text-xs text-wb-70 px-1">
                  {routePage} / {routePagination.total_pages}
                </span>
                <button
                  onClick={() => setRoutePage(routePage + 1)}
                  disabled={routePage >= routePagination.total_pages}
                  className="p-1 text-wb-70 hover:text-wb-100 hover:bg-wb-10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
