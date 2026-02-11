'use client'

import { useState, useEffect } from 'react'
import { Loader2, Save, Trash2, Route as RouteIcon } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { adminCragService } from '@/lib/api/services'
import { AdminRoute, RouteFormData, emptyRouteForm, routeTypeLabels } from './types'

interface InlineRouteFormProps {
  route: AdminRoute | null
  cragId: string
  areaId?: string
  sectorId?: string
  areaName?: string
  sectorName?: string
  cragName?: string
  isNew?: boolean
  onSave: () => void
  onCancel: () => void
  onDelete?: () => void
}

export default function InlineRouteForm({
  route,
  cragId,
  areaId,
  sectorId,
  areaName,
  sectorName,
  cragName,
  isNew = false,
  onSave,
  onCancel,
  onDelete,
}: InlineRouteFormProps) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [form, setForm] = useState<RouteFormData>(emptyRouteForm)

  // Initialize form when route changes
  useEffect(() => {
    if (route) {
      setForm({
        name: route.name,
        grade: route.grade || '',
        grade_system: route.grade_system || 'yds',
        height: route.height?.toString() || '',
        bolt_count: route.bolt_count?.toString() || '',
        route_type: route.route_type || 'sport',
        description: route.description || '',
        first_ascent: route.first_ascent || '',
        area_id: route.area_id || areaId || '',
        sector_id: route.sector_id || sectorId || '',
      })
    } else {
      setForm({
        ...emptyRouteForm,
        area_id: areaId || '',
        sector_id: sectorId || '',
      })
    }
    setShowDeleteConfirm(false)
  }, [route, areaId, sectorId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return

    setSubmitting(true)
    try {
      const data: Record<string, unknown> = {
        name: form.name.trim(),
        grade: form.grade || null,
        grade_system: form.grade_system || 'yds',
        height: form.height ? Number(form.height) : null,
        bolt_count: form.bolt_count ? Number(form.bolt_count) : null,
        route_type: form.route_type || 'sport',
        description: form.description || null,
        first_ascent: form.first_ascent || null,
        area_id: form.area_id || areaId || null,
        sector_id: form.sector_id || sectorId || null,
      }

      if (route) {
        await adminCragService.updateRoute(cragId, route.id, data)
        toast({ title: '成功', description: '路線已更新' })
      } else {
        await adminCragService.createRoute(cragId, data)
        toast({ title: '成功', description: '路線已新增' })
      }

      onSave()
    } catch (error) {
      console.error('Failed to save route:', error)
      toast({ variant: 'destructive', title: '錯誤', description: '儲存路線失敗' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!route) return

    setDeleting(true)
    try {
      await adminCragService.deleteRoute(cragId, route.id)
      toast({ title: '成功', description: '路線已刪除' })
      onDelete?.()
    } catch (error) {
      console.error('Failed to delete route:', error)
      toast({ variant: 'destructive', title: '錯誤', description: '刪除路線失敗' })
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  // Build breadcrumb path
  const breadcrumb = [cragName, areaName, sectorName].filter(Boolean).join(' / ')

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-wb-20 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
            <RouteIcon className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="font-semibold text-wb-100">
              {isNew ? '新增路線' : `編輯路線：${route?.name}`}
            </h2>
            <p className="text-xs text-wb-50">
              {breadcrumb || '填寫路線資料'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4">
        <div className="space-y-6 max-w-2xl">
          {/* 基本資訊 */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-wb-90 mb-2">
              基本資訊
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-wb-70 mb-1">
                  路線名稱 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="例：勇者之路"
                  className="w-full px-3 py-2 text-sm border border-wb-20 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-wb-100/20"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-wb-70 mb-1">
                  難度
                </label>
                <input
                  type="text"
                  value={form.grade}
                  onChange={(e) => setForm({ ...form, grade: e.target.value })}
                  placeholder="例：5.10a"
                  className="w-full px-3 py-2 text-sm border border-wb-20 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-wb-100/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-wb-70 mb-1">
                  難度系統
                </label>
                <select
                  value={form.grade_system}
                  onChange={(e) =>
                    setForm({ ...form, grade_system: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-wb-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-wb-100/20 bg-white"
                >
                  <option value="yds">YDS</option>
                  <option value="french">French</option>
                  <option value="v-scale">V-Scale</option>
                  <option value="font">Font</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-wb-70 mb-1">
                  類型
                </label>
                <select
                  value={form.route_type}
                  onChange={(e) =>
                    setForm({ ...form, route_type: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-wb-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-wb-100/20 bg-white"
                >
                  {Object.entries(routeTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-wb-70 mb-1">
                  高度 (m)
                </label>
                <input
                  type="number"
                  value={form.height}
                  onChange={(e) => setForm({ ...form, height: e.target.value })}
                  placeholder="例：15"
                  className="w-full px-3 py-2 text-sm border border-wb-20 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-wb-100/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-wb-70 mb-1">
                  Bolt 數
                </label>
                <input
                  type="number"
                  value={form.bolt_count}
                  onChange={(e) =>
                    setForm({ ...form, bolt_count: e.target.value })
                  }
                  placeholder="例：8"
                  className="w-full px-3 py-2 text-sm border border-wb-20 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-wb-100/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-wb-70 mb-1">
                  首攀者
                </label>
                <input
                  type="text"
                  value={form.first_ascent}
                  onChange={(e) =>
                    setForm({ ...form, first_ascent: e.target.value })
                  }
                  placeholder="例：王小明 (2020)"
                  className="w-full px-3 py-2 text-sm border border-wb-20 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-wb-100/20"
                />
              </div>
            </div>
          </fieldset>

          {/* 描述 */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-wb-90 mb-2">
              路線描述
            </legend>
            <div>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={4}
                placeholder="描述路線特色、技巧要點、注意事項等..."
                className="w-full px-3 py-2 text-sm border border-wb-20 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-wb-100/20 resize-none"
              />
            </div>
          </fieldset>

          {/* 路線資訊摘要（僅在編輯模式顯示） */}
          {route && !isNew && (
            <div className="bg-wb-10/50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-wb-90 mb-3">路線資訊</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <dt className="text-xs text-wb-50 mb-0.5">難度</dt>
                  <dd className="text-sm font-medium text-wb-100">
                    {route.grade || '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-wb-50 mb-0.5">類型</dt>
                  <dd className="text-sm font-medium text-wb-100">
                    {routeTypeLabels[route.route_type] || route.route_type}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-wb-50 mb-0.5">高度</dt>
                  <dd className="text-sm font-medium text-wb-100">
                    {route.height ? `${route.height}m` : '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-wb-50 mb-0.5">Bolt</dt>
                  <dd className="text-sm font-medium text-wb-100">
                    {route.bolt_count ?? '-'}
                  </dd>
                </div>
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Footer actions */}
      <div className="px-4 py-3 border-t border-wb-20 flex items-center justify-between flex-shrink-0 bg-white">
        <div>
          {route && !isNew && (
            <>
              {showDeleteConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-600">確定要刪除嗎？</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {deleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      '確認刪除'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1.5 text-sm text-wb-70 hover:text-wb-100 rounded-lg hover:bg-wb-10 transition-colors"
                  >
                    取消
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  刪除路線
                </button>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-wb-70 hover:text-wb-100 rounded-lg hover:bg-wb-10 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={submitting || !form.name.trim()}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-wb-100 text-white rounded-lg hover:bg-wb-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {route ? '更新路線' : '新增路線'}
          </button>
        </div>
      </div>
    </div>
  )
}
