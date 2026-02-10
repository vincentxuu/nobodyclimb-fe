'use client'

import { useState, useEffect, useCallback, Fragment } from 'react'
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
} from 'lucide-react'
import { adminCragService, AdminCragStats } from '@/lib/api/services'
import { AdminCrag, AdminArea } from '@/lib/types'
import { useToast } from '@/components/ui/use-toast'
import apiClient from '@/lib/api/client'
import Link from 'next/link'

import CragForm from './crag/CragForm'
import AreaSectorSection from './crag/AreaSectorSection'
import RouteSection from './crag/RouteSection'
import { useDebounce, REGIONS } from './crag/types'

export default function AdminCragManagement() {
  const { toast } = useToast()

  const [crags, setCrags] = useState<AdminCrag[]>([])
  const [stats, setStats] = useState<AdminCragStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('')
  const [page, setPage] = useState(1)

  // 展開的岩場
  const [expandedCragId, setExpandedCragId] = useState<string | null>(null)
  const [expandedAreas, setExpandedAreas] = useState<AdminArea[]>([])

  // 岩場表單
  const [showCragForm, setShowCragForm] = useState(false)
  const [editingCrag, setEditingCrag] = useState<AdminCrag | null>(null)

  // 刪除確認
  const [deletingCragId, setDeletingCragId] = useState<string | null>(null)

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

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    fetchCrags()
  }, [fetchCrags])

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
      setExpandedAreas([])
    } else {
      setExpandedCragId(cragId)
      setExpandedAreas([])
    }
  }

  // ---- Crag CRUD ----
  const handleAddCrag = () => {
    setEditingCrag(null)
    setShowCragForm(true)
  }

  const handleEditCrag = (crag: AdminCrag) => {
    setEditingCrag(crag)
    setShowCragForm(true)
  }

  const handleCragFormSave = () => {
    setShowCragForm(false)
    setEditingCrag(null)
    fetchCrags()
    fetchStats()
  }

  const handleCragFormCancel = () => {
    setShowCragForm(false)
    setEditingCrag(null)
  }

  const handleDeleteCrag = async (id: string) => {
    try {
      await apiClient.delete(`/crags/${id}`)
      await fetchCrags()
      fetchStats()
      setDeletingCragId(null)
      if (expandedCragId === id) {
        setExpandedCragId(null)
        setExpandedAreas([])
      }
    } catch (error) {
      console.error('Failed to delete crag:', error)
      toast({ variant: 'destructive', title: '錯誤', description: '刪除岩場失敗' })
    }
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-wb-100">岩場管理</h1>
          <p className="text-sm text-wb-70 mt-1">管理岩場、區域和路線資料</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddCrag}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-wb-100 text-white rounded-lg hover:bg-wb-90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            新增岩場
          </button>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-wb-10 text-wb-70 rounded-lg hover:bg-wb-20 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            重新整理
          </button>
        </div>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon={Mountain} label="總岩場數" value={stats?.total_crags ?? '-'} loading={statsLoading} />
        <StatCard icon={RouteIcon} label="總路線數" value={stats?.total_routes ?? '-'} loading={statsLoading} />
        <StatCard icon={BarChart3} label="總 Bolt 數" value={stats?.total_bolts ?? '-'} loading={statsLoading} />
        <StatCard icon={Star} label="精選岩場" value={stats?.featured_count ?? '-'} loading={statsLoading} />
        <StatCard icon={MapPin} label="本月新增" value={stats?.new_this_month ?? '-'} loading={statsLoading} />
      </div>

      {/* 區域分布 */}
      {stats?.regions && stats.regions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-wb-20 p-4">
          <h3 className="text-sm font-medium text-wb-70 mb-3">區域分布</h3>
          <div className="flex flex-wrap gap-2">
            {stats.regions.map((r) => (
              <span key={r.region} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-wb-10 rounded-full text-sm">
                <span className="text-wb-100 font-medium">{r.region}</span>
                <span className="text-wb-70">{r.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 新增/編輯岩場表單 */}
      {showCragForm && (
        <CragForm crag={editingCrag} onSave={handleCragFormSave} onCancel={handleCragFormCancel} />
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
              className="w-full pl-10 pr-4 py-2 border border-wb-20 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-wb-100/20 focus:border-wb-100"
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
            {REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
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
                    <Fragment key={crag.id}>
                      <tr
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
                              <div className="text-xs text-wb-50">{crag.location || crag.slug}</div>
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
                          <div className="flex items-center justify-end gap-1">
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
                              title="編輯岩場"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditCrag(crag)
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            {deletingCragId === crag.id ? (
                              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => handleDeleteCrag(crag.id)}
                                  className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                >
                                  確認
                                </button>
                                <button
                                  onClick={() => setDeletingCragId(null)}
                                  className="px-2 py-1 text-xs text-wb-70 hover:text-wb-100 rounded hover:bg-wb-10 transition-colors"
                                >
                                  取消
                                </button>
                              </div>
                            ) : (
                              <button
                                className="p-2 text-wb-70 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="刪除岩場"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDeletingCragId(crag.id)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
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

                      {/* 展開的岩場管理面板 */}
                      {expandedCragId === crag.id && (
                        <tr>
                          <td colSpan={7} className="bg-wb-10/30 px-4 py-4">
                            <div className="space-y-4">
                              <AreaSectorSection
                                cragId={crag.id}
                                onAreasChange={setExpandedAreas}
                              />
                              <div className="border-t border-wb-20" />
                              <RouteSection
                                cragId={crag.id}
                                areas={expandedAreas}
                                onRoutesChange={() => { fetchCrags(); fetchStats() }}
                              />
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
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
          <li>- 點擊「新增岩場」可建立新的岩場資料，包含位置、地理、攀岩和交通等完整資訊</li>
          <li>- 點擊鉛筆圖示可編輯岩場的所有欄位</li>
          <li>- 點擊岩場列或箭頭圖示可展開管理面板，管理區域、岩壁和路線</li>
          <li>- 結構層次：岩場 → 區域（如校門口、鐘塔）→ 岩壁（如人面岩、門簷）→ 路線</li>
          <li>- 刪除區域會同時移除其下所有岩壁分區，路線保留但歸屬會被清空</li>
          <li>- 攀登類型和適合季節以逗號分隔填寫</li>
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
