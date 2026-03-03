'use client'

import { useState, useEffect, useCallback } from 'react'
import { adminUserService, AdminUser, AdminUserStats } from '@/lib/api/services'
import {
  useUserRankDetail,
  useRecalculateRank,
  useOverrideUserRank,
  RankId,
} from '@/lib/api/admin-ai'
import {
  Users,
  UserCheck,
  UserX,
  Shield,
  Search,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Mail,
  Calendar,
  TrendingUp,
  Clock,
  ArrowUpDown,
  Mountain,
  X,
} from 'lucide-react'

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return '從未登入'
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes} 分鐘前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小時前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} 天前`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} 個月前`
  return `${Math.floor(months / 12)} 年前`
}

const roleLabels: Record<string, string> = {
  user: '一般用戶',
  admin: '管理員',
  moderator: '版主',
}

const roleColors: Record<string, string> = {
  user: 'bg-wb-10 text-wb-90',
  admin: 'bg-brand-red-100/10 text-brand-red-100',
  moderator: 'bg-brand-yellow-100/10 text-brand-yellow-200',
}

const authProviderLabels: Record<string, string> = {
  local: '本地註冊',
  google: 'Google',
}

const rankLabels: Record<string, string> = {
  foothill: '麓',
  wall: '壁',
  ridge: '稜',
  summit: '巔',
}

const rankColors: Record<string, string> = {
  foothill: 'bg-stone-100 text-stone-600',
  wall: 'bg-blue-100 text-blue-700',
  ridge: 'bg-purple-100 text-purple-700',
  summit: 'bg-amber-100 text-amber-700',
}

const RANK_OPTIONS: { id: RankId; label: string }[] = [
  { id: 'summit', label: '巔' },
  { id: 'ridge', label: '稜' },
  { id: 'wall', label: '壁' },
  { id: 'foothill', label: '麓' },
]

// =============================================
// 用戶等級詳情 Modal
// =============================================

function UserRankModal({
  userId,
  username,
  onClose,
}: {
  userId: string
  username: string
  onClose: () => void
}) {
  const { data: rank, isLoading, error, refetch } = useUserRankDetail(userId)
  const recalculate = useRecalculateRank()
  const override = useOverrideUserRank()

  const handleRecalculate = async () => {
    await recalculate.mutateAsync(userId)
    refetch()
  }

  const handleOverride = async (rankId: RankId | null) => {
    await override.mutateAsync({ userId, rank: rankId })
    refetch()
  }

  const scoreItems = rank
    ? [
        { label: '個人頁文字欄位', value: rank.score_breakdown.biography_fields, max: 15 },
        { label: '人生清單欄位', value: rank.score_breakdown.biography_bucket_list, max: 3 },
        { label: '公開個人頁', value: rank.score_breakdown.biography_public, max: 5 },
        { label: '核心故事', value: rank.score_breakdown.core_stories, max: 24 },
        { label: 'One-liners', value: rank.score_breakdown.one_liners, max: 20 },
        { label: 'Stories', value: rank.score_breakdown.stories, max: 15 },
        { label: '攀爬記錄', value: rank.score_breakdown.route_ascents, max: 20 },
        { label: '人生清單項目', value: rank.score_breakdown.bucket_list_items, max: 10 },
        { label: '人生清單已完成', value: rank.score_breakdown.bucket_list_completed, max: 10 },
      ]
    : []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="relative w-full max-w-md rounded-2xl bg-white shadow-xl p-6 mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Mountain className="h-5 w-5 text-emerald-600" />
            <h2 className="text-base font-semibold text-wb-100">
              {username} 的等級詳情
            </h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-wb-10 rounded-lg transition-colors">
            <X className="h-4 w-4 text-wb-60" />
          </button>
        </div>

        {isLoading && (
          <div className="flex justify-center py-10">
            <RefreshCw className="h-5 w-5 animate-spin text-wb-40" />
          </div>
        )}

        {error && (
          <div className="space-y-3">
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-700">
              該用戶尚無等級記錄，點下方按鈕建立並計算積分。
            </div>
            <button
              onClick={handleRecalculate}
              disabled={recalculate.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${recalculate.isPending ? 'animate-spin' : ''}`} />
              {recalculate.isPending ? '建立中...' : '建立積分記錄'}
            </button>
          </div>
        )}

        {rank && (
          <div className="space-y-5">
            {/* 等級與分數 */}
            <div className="flex items-center justify-between rounded-xl bg-wb-5 border border-wb-10 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${rankColors[rank.rank_id] ?? 'bg-wb-10 text-wb-70'}`}>
                  {rank.rank_display_name}
                </span>
                {rank.rank_override_id && (
                  <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    手動覆寫
                  </span>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-wb-100">{rank.score}</p>
                <p className="text-xs text-wb-50">積分</p>
              </div>
            </div>

            {/* AI 配額 */}
            <div className="flex items-center justify-between text-sm text-wb-70 px-1">
              <span>今日 AI 使用量</span>
              <span className="font-medium text-wb-100">
                {rank.daily_ai_used} / {rank.daily_ai_limit} 次
              </span>
            </div>

            {/* 積分明細 */}
            <div>
              <p className="text-xs font-medium text-wb-50 mb-2">積分明細</p>
              <div className="space-y-1.5">
                {scoreItems.map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <span className="text-wb-70">{item.label}</span>
                    <span className={item.value > 0 ? 'font-medium text-wb-100' : 'text-wb-40'}>
                      {item.value} / {item.max}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 最後計算時間 */}
            {rank.last_score_calculated_at && (
              <p className="text-xs text-wb-40 text-center">
                最後計算：{new Date(rank.last_score_calculated_at).toLocaleString('zh-TW')}
              </p>
            )}

            {/* 操作 */}
            <div className="border-t border-wb-10 pt-4 space-y-3">
              <p className="text-xs font-medium text-wb-50">手動操作</p>
              <button
                onClick={handleRecalculate}
                disabled={recalculate.isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-wb-20 text-sm text-wb-80 hover:bg-wb-5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${recalculate.isPending ? 'animate-spin' : ''}`} />
                立即重算積分
              </button>
              <div>
                <p className="text-xs text-wb-50 mb-2">覆寫等級</p>
                <div className="flex gap-2 flex-wrap">
                  {RANK_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleOverride(opt.id)}
                      disabled={override.isPending}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                        rank.rank_override_id === opt.id
                          ? rankColors[opt.id]
                          : 'bg-wb-10 text-wb-70 hover:bg-wb-20'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                  {rank.rank_override_id && (
                    <button
                      onClick={() => handleOverride(null)}
                      disabled={override.isPending}
                      className="px-3 py-1.5 rounded-lg text-sm text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      清除覆寫
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminUserManagement() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<AdminUserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState<'created_at' | 'last_active_at'>('created_at')
  const [activityFilter, setActivityFilter] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [rankModalUser, setRankModalUser] = useState<{ id: string; username: string } | null>(null)
  const recalculateAll = useRecalculateRank()

  const handleRecalculateAll = async () => {
    if (!confirm('確定要重算所有用戶積分嗎？此操作會在背景執行。')) return
    await recalculateAll.mutateAsync('all')
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [usersResponse, statsResponse] = await Promise.all([
        adminUserService.getUsers({
          page,
          limit: 20,
          search: search || undefined,
          role: roleFilter || undefined,
          status: statusFilter || undefined,
          sort: sortBy,
          activity: activityFilter as 'recent_7d' | 'recent_30d' | 'inactive_30d' | undefined || undefined,
        }),
        adminUserService.getStats(),
      ])

      if (usersResponse.success) {
        setUsers(usersResponse.data || [])
        setTotalPages(usersResponse.pagination.total_pages)
        setTotal(usersResponse.pagination.total)
      }
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '載入失敗'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [page, search, roleFilter, statusFilter, sortBy, activityFilter])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadData()
  }

  const handleToggleStatus = async (user: AdminUser) => {
    if (actionLoading) return
    setActionLoading(user.id)
    setMenuOpen(null)
    try {
      const response = await adminUserService.updateStatus(user.id, user.is_active === 0)
      if (response.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === user.id ? { ...u, is_active: user.is_active === 0 ? 1 : 0 } : u
          )
        )
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失敗')
    } finally {
      setActionLoading(null)
    }
  }

  const handleChangeRole = async (user: AdminUser, newRole: 'user' | 'admin' | 'moderator') => {
    if (actionLoading) return
    setActionLoading(user.id)
    setMenuOpen(null)
    try {
      const response = await adminUserService.updateRole(user.id, newRole)
      if (response.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
        )
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失敗')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-wb-60" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertCircle className="h-12 w-12 text-brand-red-100 mb-4" />
        <h3 className="text-lg font-medium text-wb-100 mb-2">無法載入資料</h3>
        <p className="text-wb-70 mb-4">{error}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          重試
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-wb-100">用戶管理</h1>
          <p className="text-wb-70 mt-1">管理平台用戶帳號和權限</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRecalculateAll}
            disabled={recalculateAll.isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm text-wb-70 hover:text-wb-100 hover:bg-wb-10 rounded-lg transition-colors disabled:opacity-50"
          >
            <Mountain className={`h-4 w-4 ${recalculateAll.isPending ? 'animate-pulse' : ''}`} />
            全體重算積分
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm text-wb-70 hover:text-wb-100 hover:bg-wb-10 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            重新整理
          </button>
        </div>
      </div>

      {/* 統計卡片 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-wb-20 p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand-yellow-100/10 rounded-lg">
                <Users className="h-5 w-5 text-brand-yellow-200" />
              </div>
              <div>
                <p className="text-sm text-wb-70">總用戶數</p>
                <p className="text-2xl font-bold text-wb-100">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-wb-20 p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-wb-90/10 rounded-lg">
                <UserCheck className="h-5 w-5 text-wb-90" />
              </div>
              <div>
                <p className="text-sm text-wb-70">已啟用帳號</p>
                <p className="text-2xl font-bold text-wb-100">{stats.active}</p>
                <p className="text-xs text-wb-50 mt-0.5">is_active = 1</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-wb-20 p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand-yellow-200/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-brand-yellow-200" />
              </div>
              <div>
                <p className="text-sm text-wb-70">本週新增</p>
                <p className="text-2xl font-bold text-wb-100">{stats.newThisWeek}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-wb-20 p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand-yellow-100/10 rounded-lg">
                <Calendar className="h-5 w-5 text-brand-yellow-200" />
              </div>
              <div>
                <p className="text-sm text-wb-70">本月新增</p>
                <p className="text-2xl font-bold text-wb-100">{stats.newThisMonth}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 搜尋和篩選 */}
      <div className="bg-white rounded-lg shadow-sm border border-wb-20 p-4 space-y-3">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-wb-60" />
            <input
              type="text"
              placeholder="搜尋用戶名稱、Email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white text-wb-100 border border-wb-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-wb-50"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value)
              setPage(1)
            }}
            className="px-4 py-2 bg-white text-wb-100 border border-wb-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          >
            <option value="">所有角色</option>
            <option value="user">一般用戶</option>
            <option value="moderator">版主</option>
            <option value="admin">管理員</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="px-4 py-2 bg-white text-wb-100 border border-wb-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          >
            <option value="">所有帳號狀態</option>
            <option value="active">已啟用</option>
            <option value="inactive">已停用</option>
          </select>
          <button
            type="submit"
            className="px-6 py-2 bg-brand-dark text-white rounded-lg hover:bg-brand-dark-hover transition-colors"
          >
            搜尋
          </button>
        </form>
        <div className="flex flex-wrap gap-3 pt-1 border-t border-wb-10">
          {/* 活躍度篩選 */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-wb-60" />
            <span className="text-xs text-wb-60">活躍度：</span>
            {[
              { value: '', label: '全部' },
              { value: 'recent_7d', label: '近 7 天活躍' },
              { value: 'recent_30d', label: '近 30 天活躍' },
              { value: 'inactive_30d', label: '超過 30 天未登入' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setActivityFilter(opt.value)
                  setPage(1)
                }}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  activityFilter === opt.value
                    ? 'bg-wb-100 text-white'
                    : 'bg-wb-10 text-wb-70 hover:bg-wb-20'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {/* 排序切換 */}
          <div className="flex items-center gap-2 ml-auto">
            <ArrowUpDown className="h-4 w-4 text-wb-60" />
            <span className="text-xs text-wb-60">排序：</span>
            <button
              type="button"
              onClick={() => { setSortBy('created_at'); setPage(1) }}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                sortBy === 'created_at'
                  ? 'bg-wb-100 text-white'
                  : 'bg-wb-10 text-wb-70 hover:bg-wb-20'
              }`}
            >
              註冊時間
            </button>
            <button
              type="button"
              onClick={() => { setSortBy('last_active_at'); setPage(1) }}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                sortBy === 'last_active_at'
                  ? 'bg-wb-100 text-white'
                  : 'bg-wb-10 text-wb-70 hover:bg-wb-20'
              }`}
            >
              最近活躍
            </button>
          </div>
        </div>
      </div>

      {/* 用戶列表 */}
      <div className="bg-white rounded-lg shadow-sm border border-wb-20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-wb-10 text-left text-sm text-wb-70 border-b border-wb-20">
                <th className="px-6 py-4 font-medium">用戶</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">角色</th>
                <th className="px-6 py-4 font-medium">狀態</th>
                <th className="px-6 py-4 font-medium">等級</th>
                <th className="px-6 py-4 font-medium">認證方式</th>
                <th className="px-6 py-4 font-medium">註冊時間</th>
                <th className="px-6 py-4 font-medium">最後活躍</th>
                <th className="px-6 py-4 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-wb-10 hover:bg-wb-10/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-wb-20 flex items-center justify-center">
                          <Users className="h-5 w-5 text-wb-60" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-wb-100">
                          {user.display_name || user.username}
                        </p>
                        <p className="text-xs text-wb-70">@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-wb-70">
                      <Mail className="h-4 w-4 text-wb-60" />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${roleColors[user.role]}`}
                    >
                      <Shield className="h-3 w-3" />
                      {roleLabels[user.role]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.is_active ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <UserCheck className="h-3 w-3" />
                        已啟用
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        <UserX className="h-3 w-3" />
                        已停用
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {user.rank_id ? (
                      <button
                        onClick={() => setRankModalUser({ id: user.id, username: user.display_name || user.username })}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors hover:opacity-80 ${rankColors[user.rank_id] ?? 'bg-wb-10 text-wb-70'}`}
                      >
                        {rankLabels[user.rank_id] ?? user.rank_id}
                        {user.rank_score != null && (
                          <span className="opacity-70">{user.rank_score}分</span>
                        )}
                      </button>
                    ) : (
                      <span className="text-xs text-wb-40">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {authProviderLabels[user.auth_provider] || user.auth_provider}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('zh-TW')}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-sm ${
                        !user.last_active_at
                          ? 'text-wb-40'
                          : Date.now() - new Date(user.last_active_at).getTime() < 7 * 86400000
                          ? 'text-green-600'
                          : Date.now() - new Date(user.last_active_at).getTime() < 30 * 86400000
                          ? 'text-wb-70'
                          : 'text-wb-40'
                      }`}
                      title={user.last_active_at ?? undefined}
                    >
                      {formatRelativeTime(user.last_active_at)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpen(menuOpen === user.id ? null : user.id)}
                        disabled={actionLoading === user.id}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {actionLoading === user.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
                        ) : (
                          <MoreVertical className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                      {menuOpen === user.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
                          <button
                            onClick={() => {
                              setMenuOpen(null)
                              setRankModalUser({ id: user.id, username: user.display_name || user.username })
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                          >
                            <Mountain className="h-4 w-4 text-emerald-600" />
                            查看等級詳情
                          </button>
                          <div className="border-t border-gray-100 my-1" />
                          <button
                            onClick={() => handleToggleStatus(user)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                          >
                            {user.is_active ? (
                              <>
                                <UserX className="h-4 w-4 text-red-500" />
                                停用帳號
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4 text-green-500" />
                                啟用帳號
                              </>
                            )}
                          </button>
                          <div className="border-t border-gray-100 my-1" />
                          <p className="px-4 py-1 text-xs text-gray-400">更改角色</p>
                          {user.role !== 'user' && (
                            <button
                              onClick={() => handleChangeRole(user, 'user')}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                            >
                              設為一般用戶
                            </button>
                          )}
                          {user.role !== 'moderator' && (
                            <button
                              onClick={() => handleChangeRole(user, 'moderator')}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                            >
                              設為版主
                            </button>
                          )}
                          {user.role !== 'admin' && (
                            <button
                              onClick={() => handleChangeRole(user, 'admin')}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors text-red-600"
                            >
                              設為管理員
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    沒有找到符合條件的用戶
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 分頁 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              共 {total} 位用戶，第 {page} / {totalPages} 頁
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 點擊其他地方關閉選單 */}
      {menuOpen && (
        <div className="fixed inset-0 z-0" onClick={() => setMenuOpen(null)} />
      )}

      {/* 等級詳情 Modal */}
      {rankModalUser && (
        <UserRankModal
          userId={rankModalUser.id}
          username={rankModalUser.username}
          onClose={() => setRankModalUser(null)}
        />
      )}
    </div>
  )
}
