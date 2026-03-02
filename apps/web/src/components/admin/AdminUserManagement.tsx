'use client'

import { useState, useEffect, useCallback } from 'react'
import { adminUserService, AdminUser, AdminUserStats } from '@/lib/api/services'
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
} from 'lucide-react'

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
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

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
  }, [page, search, roleFilter, statusFilter])

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
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm text-wb-70 hover:text-wb-100 hover:bg-wb-10 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          重新整理
        </button>
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
                <p className="text-sm text-wb-70">活躍用戶</p>
                <p className="text-2xl font-bold text-wb-100">{stats.active}</p>
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
      <div className="bg-white rounded-lg shadow-sm border border-wb-20 p-4">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
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
            <option value="">所有狀態</option>
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
                <th className="px-6 py-4 font-medium">認證方式</th>
                <th className="px-6 py-4 font-medium">註冊時間</th>
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
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {authProviderLabels[user.auth_provider] || user.auth_provider}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('zh-TW')}
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
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
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
    </div>
  )
}
