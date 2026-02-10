'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Mountain,
  Route as RouteIcon,
  MapPin,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Star,
  Loader2,
  ExternalLink,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Hash,
} from 'lucide-react'
import { adminCragService, AdminCragStats } from '@/lib/api/services'
import { AdminCrag } from '@/lib/types'
import Link from 'next/link'

// Backend route type (snake_case, matching API response)
interface AdminRoute {
  id: string
  crag_id: string
  name: string
  grade: string | null
  grade_system: string
  height: number | null
  bolt_count: number | null
  route_type: 'sport' | 'trad' | 'boulder' | 'mixed'
  description: string | null
  first_ascent: string | null
  created_at: string
}

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Route form data
interface RouteFormData {
  name: string
  grade: string
  grade_system: string
  height: string
  bolt_count: string
  route_type: string
  description: string
  first_ascent: string
}

const emptyRouteForm: RouteFormData = {
  name: '',
  grade: '',
  grade_system: 'yds',
  height: '',
  bolt_count: '',
  route_type: 'sport',
  description: '',
  first_ascent: '',
}

export default function AdminCragManagement() {
  const [crags, setCrags] = useState<AdminCrag[]>([])
  const [stats, setStats] = useState<AdminCragStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('')
  const [page, setPage] = useState(1)

  // Expanded crag detail
  const [expandedCragId, setExpandedCragId] = useState<string | null>(null)
  const [cragRoutes, setCragRoutes] = useState<AdminRoute[]>([])
  const [routesLoading, setRoutesLoading] = useState(false)

  // Route form
  const [showRouteForm, setShowRouteForm] = useState(false)
  const [editingRoute, setEditingRoute] = useState<AdminRoute | null>(null)
  const [routeForm, setRouteForm] = useState<RouteFormData>(emptyRouteForm)
  const [routeSubmitting, setRouteSubmitting] = useState(false)

  // Delete confirmation
  const [deletingRouteId, setDeletingRouteId] = useState<string | null>(null)

  // Debounce search input to reduce API calls
  const debouncedSearch = useDebounce(search, 300)
  const [pagination, setPagination] = useState({
    total: 0,
    total_pages: 0,
    limit: 20,
  })

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

  const fetchCrags = useCallback(async () => {
    setLoading(true)
    try {
      const response = await adminCragService.getCrags({
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        region: region || undefined,
      })
      if (response.success && response.data) {
        setCrags(response.data)
        if (response.pagination) {
          setPagination({
            total: response.pagination.total,
            total_pages: response.pagination.total_pages,
            limit: response.pagination.limit,
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch crags:', error)
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, region])

  const fetchRoutes = useCallback(async (cragId: string) => {
    setRoutesLoading(true)
    try {
      const response = await adminCragService.getRoutes(cragId, { limit: 100 })
      if (response.success && response.data) {
        setCragRoutes(response.data as unknown as AdminRoute[])
      }
    } catch (error) {
      console.error('Failed to fetch routes:', error)
    } finally {
      setRoutesLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    fetchCrags()
  }, [fetchCrags])

  // Reset page to 1 when search changes
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
  }

  const handleRefresh = () => {
    fetchStats()
    fetchCrags()
  }

  const toggleCragExpand = (cragId: string) => {
    if (expandedCragId === cragId) {
      setExpandedCragId(null)
      setCragRoutes([])
      setShowRouteForm(false)
      setEditingRoute(null)
    } else {
      setExpandedCragId(cragId)
      fetchRoutes(cragId)
      setShowRouteForm(false)
      setEditingRoute(null)
    }
  }

  const handleAddRoute = () => {
    setEditingRoute(null)
    setRouteForm(emptyRouteForm)
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
    })
    setShowRouteForm(true)
  }

  const handleCancelRouteForm = () => {
    setShowRouteForm(false)
    setEditingRoute(null)
    setRouteForm(emptyRouteForm)
  }

  const handleRouteFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!expandedCragId || !routeForm.name.trim()) return

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
      }

      if (editingRoute) {
        await adminCragService.updateRoute(expandedCragId, editingRoute.id, data)
      } else {
        await adminCragService.createRoute(expandedCragId, data)
      }

      await fetchRoutes(expandedCragId)
      handleCancelRouteForm()
      // Refresh crag stats (route_count may have changed)
      fetchCrags()
      fetchStats()
    } catch (error) {
      console.error('Failed to save route:', error)
      alert('儲存路線失敗')
    } finally {
      setRouteSubmitting(false)
    }
  }

  const handleDeleteRoute = async (routeId: string) => {
    if (!expandedCragId) return

    try {
      await adminCragService.deleteRoute(expandedCragId, routeId)
      await fetchRoutes(expandedCragId)
      setDeletingRouteId(null)
      fetchCrags()
      fetchStats()
    } catch (error) {
      console.error('Failed to delete route:', error)
      alert('刪除路線失敗')
    }
  }

  const regions = ['北部', '中部', '南部', '東部', '離島']

  const routeTypeLabels: Record<string, string> = {
    sport: '運動攀登',
    trad: '傳統攀登',
    boulder: '抱石',
    mixed: '混合',
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-wb-100">岩場管理</h1>
          <p className="text-sm text-wb-70 mt-1">管理岩場和路線資料</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-wb-10 text-wb-70 rounded-lg hover:bg-wb-20 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          重新整理
        </button>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          icon={Mountain}
          label="總岩場數"
          value={stats?.total_crags ?? '-'}
          loading={statsLoading}
        />
        <StatCard
          icon={RouteIcon}
          label="總路線數"
          value={stats?.total_routes ?? '-'}
          loading={statsLoading}
        />
        <StatCard
          icon={BarChart3}
          label="總 Bolt 數"
          value={stats?.total_bolts ?? '-'}
          loading={statsLoading}
        />
        <StatCard
          icon={Star}
          label="精選岩場"
          value={stats?.featured_count ?? '-'}
          loading={statsLoading}
        />
        <StatCard
          icon={MapPin}
          label="本月新增"
          value={stats?.new_this_month ?? '-'}
          loading={statsLoading}
        />
      </div>

      {/* 區域分布 */}
      {stats?.regions && stats.regions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-wb-20 p-4">
          <h3 className="text-sm font-medium text-wb-70 mb-3">區域分布</h3>
          <div className="flex flex-wrap gap-2">
            {stats.regions.map((r) => (
              <span
                key={r.region}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-wb-10 rounded-full text-sm"
              >
                <span className="text-wb-100 font-medium">{r.region}</span>
                <span className="text-wb-70">{r.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 搜尋和篩選 */}
      <div className="bg-white rounded-xl shadow-sm border border-wb-20 p-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-wb-50" />
            <input
              type="text"
              placeholder="搜尋岩場名稱、位置..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-wb-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-wb-100/20 focus:border-wb-100"
            />
          </div>
          <select
            value={region}
            onChange={(e) => {
              setRegion(e.target.value)
              setPage(1)
            }}
            className="px-4 py-2 border border-wb-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-wb-100/20 focus:border-wb-100 bg-white"
          >
            <option value="">所有區域</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-wb-100 text-white rounded-lg hover:bg-wb-90 transition-colors"
          >
            搜尋
          </button>
        </form>
      </div>

      {/* 岩場列表 */}
      <div className="bg-white rounded-xl shadow-sm border border-wb-20 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-wb-50" />
          </div>
        ) : crags.length === 0 ? (
          <div className="text-center py-12 text-wb-70">
            {search || region ? '沒有找到符合條件的岩場' : '尚無岩場資料'}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-wb-10">
                  <tr className="text-left text-sm text-wb-70">
                    <th className="px-4 py-3 font-medium">岩場</th>
                    <th className="px-4 py-3 font-medium">區域</th>
                    <th className="px-4 py-3 font-medium text-center">路線數</th>
                    <th className="px-4 py-3 font-medium text-center">Bolt</th>
                    <th className="px-4 py-3 font-medium text-center">精選</th>
                    <th className="px-4 py-3 font-medium">更新時間</th>
                    <th className="px-4 py-3 font-medium text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {crags.map((crag) => (
                    <>
                      <tr
                        key={crag.id}
                        className={`border-t border-wb-20 hover:bg-wb-10/50 transition-colors cursor-pointer ${expandedCragId === crag.id ? 'bg-wb-10/50' : ''}`}
                        onClick={() => toggleCragExpand(crag.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-wb-10 flex items-center justify-center">
                              <Mountain className="h-5 w-5 text-wb-70" />
                            </div>
                            <div>
                              <div className="font-medium text-wb-100">{crag.name}</div>
                              <div className="text-xs text-wb-50">{crag.slug}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-wb-10 text-wb-90">
                            <MapPin className="h-3 w-3" />
                            {crag.region || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-medium text-wb-100">{crag.route_count || 0}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-wb-70">{crag.bolt_count || 0}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {crag.is_featured ? (
                            <Star className="h-4 w-4 text-yellow-500 mx-auto fill-yellow-500" />
                          ) : (
                            <span className="text-wb-50">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-wb-70">
                          {crag.updated_at
                            ? new Date(crag.updated_at).toLocaleDateString('zh-TW')
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/crag/${crag.slug}`}
                              target="_blank"
                              className="p-2 text-wb-70 hover:text-wb-100 hover:bg-wb-10 rounded-lg transition-colors"
                              title="查看頁面"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                            <button
                              className="p-2 text-wb-70 hover:text-wb-100 hover:bg-wb-10 rounded-lg transition-colors"
                              title={expandedCragId === crag.id ? '收合' : '管理路線'}
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleCragExpand(crag.id)
                              }}
                            >
                              {expandedCragId === crag.id ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Route Management */}
                      {expandedCragId === crag.id && (
                        <tr key={`${crag.id}-routes`}>
                          <td colSpan={7} className="bg-wb-10/30 px-4 py-4">
                            <div className="space-y-4">
                              {/* Route list header */}
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-wb-100 flex items-center gap-2">
                                  <RouteIcon className="h-4 w-4" />
                                  路線列表 ({cragRoutes.length})
                                </h4>
                                <button
                                  onClick={handleAddRoute}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-wb-100 text-white rounded-lg hover:bg-wb-90 transition-colors"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  新增路線
                                </button>
                              </div>

                              {/* Route form (add/edit) */}
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
                                          onChange={(e) =>
                                            setRouteForm({ ...routeForm, name: e.target.value })
                                          }
                                          className="w-full px-3 py-1.5 text-sm border border-wb-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-wb-100/20"
                                          required
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs text-wb-70 mb-1">難度</label>
                                        <input
                                          type="text"
                                          value={routeForm.grade}
                                          onChange={(e) =>
                                            setRouteForm({ ...routeForm, grade: e.target.value })
                                          }
                                          placeholder="例：5.10a"
                                          className="w-full px-3 py-1.5 text-sm border border-wb-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-wb-100/20"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs text-wb-70 mb-1">
                                          難度系統
                                        </label>
                                        <select
                                          value={routeForm.grade_system}
                                          onChange={(e) =>
                                            setRouteForm({
                                              ...routeForm,
                                              grade_system: e.target.value,
                                            })
                                          }
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
                                          onChange={(e) =>
                                            setRouteForm({
                                              ...routeForm,
                                              route_type: e.target.value,
                                            })
                                          }
                                          className="w-full px-3 py-1.5 text-sm border border-wb-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-wb-100/20 bg-white"
                                        >
                                          <option value="sport">運動攀登</option>
                                          <option value="trad">傳統攀登</option>
                                          <option value="boulder">抱石</option>
                                          <option value="mixed">混合</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block text-xs text-wb-70 mb-1">
                                          高度 (m)
                                        </label>
                                        <input
                                          type="number"
                                          value={routeForm.height}
                                          onChange={(e) =>
                                            setRouteForm({ ...routeForm, height: e.target.value })
                                          }
                                          className="w-full px-3 py-1.5 text-sm border border-wb-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-wb-100/20"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs text-wb-70 mb-1">
                                          Bolt 數
                                        </label>
                                        <input
                                          type="number"
                                          value={routeForm.bolt_count}
                                          onChange={(e) =>
                                            setRouteForm({
                                              ...routeForm,
                                              bolt_count: e.target.value,
                                            })
                                          }
                                          className="w-full px-3 py-1.5 text-sm border border-wb-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-wb-100/20"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs text-wb-70 mb-1">
                                          首攀者
                                        </label>
                                        <input
                                          type="text"
                                          value={routeForm.first_ascent}
                                          onChange={(e) =>
                                            setRouteForm({
                                              ...routeForm,
                                              first_ascent: e.target.value,
                                            })
                                          }
                                          className="w-full px-3 py-1.5 text-sm border border-wb-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-wb-100/20"
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-xs text-wb-70 mb-1">描述</label>
                                      <textarea
                                        value={routeForm.description}
                                        onChange={(e) =>
                                          setRouteForm({
                                            ...routeForm,
                                            description: e.target.value,
                                          })
                                        }
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

                              {/* Route list */}
                              {routesLoading ? (
                                <div className="flex items-center justify-center py-6">
                                  <Loader2 className="h-5 w-5 animate-spin text-wb-50" />
                                </div>
                              ) : cragRoutes.length === 0 ? (
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
                                      {cragRoutes.map((route) => (
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
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 分頁 */}
            {pagination.total_pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-wb-20">
                <div className="text-sm text-wb-70">
                  共 {pagination.total} 個岩場，第 {page} / {pagination.total_pages} 頁
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                    className="p-2 text-wb-70 hover:text-wb-100 hover:bg-wb-10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-wb-70">
                    {page} / {pagination.total_pages}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= pagination.total_pages}
                    className="p-2 text-wb-70 hover:text-wb-100 hover:bg-wb-10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 說明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">管理說明</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>- 點擊岩場列展開路線管理面板，可直接新增、編輯或刪除路線</li>
          <li>- 點擊外部連結圖示可在新分頁中查看岩場前台頁面</li>
          <li>- 路線的新增或刪除會自動更新岩場的路線數和 Bolt 統計</li>
        </ul>
      </div>
    </div>
  )
}

// 統計卡片組件
function StatCard({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number | string
  loading?: boolean
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-wb-20 p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-wb-10 rounded-lg">
          <Icon className="h-5 w-5 text-wb-100" />
        </div>
        <div>
          <p className="text-xs text-wb-70">{label}</p>
          {loading ? (
            <div className="h-7 w-12 bg-wb-10 rounded animate-pulse mt-0.5" />
          ) : (
            <p className="text-2xl font-bold text-wb-100">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
