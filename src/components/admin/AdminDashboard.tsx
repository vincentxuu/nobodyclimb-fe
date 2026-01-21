'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { statsService, notificationService } from '@/lib/api/services'
import {
  Mountain,
  MapPin,
  Users,
  Video,
  FileText,
  Building2,
  Bell,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  BarChart3,
  UserCheck,
  Activity,
} from 'lucide-react'

interface SiteStats {
  crags: number
  routes: number
  biographies: number
  videos: number
  posts: number
  gyms: number
  updatedAt: string
}

interface NotificationOverview {
  total: number
  unread: number
  usersWithNotifications: number
}

export default function AdminDashboard() {
  const [siteStats, setSiteStats] = useState<SiteStats | null>(null)
  const [notificationStats, setNotificationStats] = useState<NotificationOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [statsResponse, notifResponse] = await Promise.all([
        statsService.getStats(),
        notificationService.getAdminStats(),
      ])

      if (statsResponse.success && statsResponse.data) {
        setSiteStats(statsResponse.data)
      }
      if (notifResponse.success && notifResponse.data) {
        setNotificationStats(notifResponse.data.overview)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '載入失敗'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">無法載入資料</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          重試
        </button>
      </div>
    )
  }

  const contentStats = [
    { label: '岩場', value: siteStats?.crags || 0, icon: Mountain, color: 'bg-emerald-50 text-emerald-600' },
    { label: '路線', value: siteStats?.routes || 0, icon: MapPin, color: 'bg-blue-50 text-blue-600' },
    { label: '人物誌', value: siteStats?.biographies || 0, icon: Users, color: 'bg-purple-50 text-purple-600' },
    { label: '影片', value: siteStats?.videos || 0, icon: Video, color: 'bg-red-50 text-red-600' },
    { label: '文章', value: siteStats?.posts || 0, icon: FileText, color: 'bg-amber-50 text-amber-600' },
    { label: '健身房', value: siteStats?.gyms || 0, icon: Building2, color: 'bg-cyan-50 text-cyan-600' },
  ]

  const quickLinks = [
    {
      title: '通知監控',
      description: '查看過去 24 小時的通知系統統計',
      href: '/admin/notifications',
      icon: Bell,
      color: 'bg-blue-500',
    },
    {
      title: '用戶管理',
      description: '管理用戶帳號和權限',
      href: '/admin/users',
      icon: UserCheck,
      color: 'bg-purple-500',
    },
    {
      title: '內容管理',
      description: '管理岩場、健身房、影片等內容',
      href: '/admin/content',
      icon: BarChart3,
      color: 'bg-emerald-500',
    },
    {
      title: '數據分析',
      description: '查看用戶活躍度和使用趨勢',
      href: '/admin/analytics',
      icon: Activity,
      color: 'bg-amber-500',
      comingSoon: true,
    },
  ]

  // 計算通知已讀率
  const readRate = notificationStats && notificationStats.total > 0
    ? Math.round(((notificationStats.total - notificationStats.unread) / notificationStats.total) * 100)
    : 0

  return (
    <div className="space-y-8">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">管理後台總覽</h1>
          <p className="text-gray-500 mt-1">
            網站數據概覽和快速操作
            {siteStats?.updatedAt && (
              <span className="text-xs ml-2">
                (更新於 {new Date(siteStats.updatedAt).toLocaleString('zh-TW')})
              </span>
            )}
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          重新整理
        </button>
      </div>

      {/* 內容統計卡片 */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">內容統計</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {contentStats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                  <p className="text-xl font-bold text-gray-900">
                    {stat.value.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 通知系統快速摘要 */}
      {notificationStats && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">通知系統 (過去 24 小時)</h2>
            <Link
              href="/admin/notifications"
              className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
            >
              查看詳情
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Bell className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">發送總數</p>
                  <p className="text-2xl font-bold text-gray-900">{notificationStats.total}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-50 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">未讀通知</p>
                  <p className="text-2xl font-bold text-gray-900">{notificationStats.unread}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-50 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">有通知的用戶</p>
                  <p className="text-2xl font-bold text-gray-900">{notificationStats.usersWithNotifications}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-50 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">已讀率</p>
                  <p className="text-2xl font-bold text-gray-900">{readRate}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 快速連結 */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">管理功能</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((link) => (
            <div key={link.title} className="relative">
              {link.comingSoon ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 opacity-60 cursor-not-allowed">
                  <div className={`w-10 h-10 ${link.color} rounded-lg flex items-center justify-center mb-3`}>
                    <link.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{link.title}</h3>
                  <p className="text-sm text-gray-500">{link.description}</p>
                  <span className="absolute top-3 right-3 text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                    即將推出
                  </span>
                </div>
              ) : (
                <Link
                  href={link.href}
                  className="block bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all group"
                >
                  <div className={`w-10 h-10 ${link.color} rounded-lg flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                    <link.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-primary transition-colors">
                    {link.title}
                  </h3>
                  <p className="text-sm text-gray-500">{link.description}</p>
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 系統資訊 */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">系統資訊</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <p className="text-gray-500 mb-1">平台</p>
            <p className="font-medium text-gray-900">NobodyClimb 攀岩社群</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">前端框架</p>
            <p className="font-medium text-gray-900">Next.js 15 + React 19</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">部署環境</p>
            <p className="font-medium text-gray-900">Cloudflare Workers</p>
          </div>
        </div>
      </div>
    </div>
  )
}
