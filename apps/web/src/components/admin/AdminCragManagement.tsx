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
} from 'lucide-react'
import { adminCragService, AdminCragStats } from '@/lib/api/services'
import { Crag } from '@/lib/types'
import Link from 'next/link'

export default function AdminCragManagement() {
  const [crags, setCrags] = useState<Crag[]>([])
  const [stats, setStats] = useState<AdminCragStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('')
  const [page, setPage] = useState(1)
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
        search: search || undefined,
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
  }, [page, search, region])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    fetchCrags()
  }, [fetchCrags])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchCrags()
  }

  const handleRefresh = () => {
    fetchStats()
    fetchCrags()
  }

  const regions = ['北部', '中部', '南部', '東部', '離島']

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
                    <tr
                      key={crag.id}
                      className="border-t border-wb-20 hover:bg-wb-10/50 transition-colors"
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
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
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
          <li>- 岩場和路線資料由 Google Sheets 管理，審核通過後同步到資料庫</li>
          <li>- 點擊「編輯」可查看岩場詳情和路線列表</li>
          <li>- 如需新增或修改資料，請在 Google Sheets 中操作</li>
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
