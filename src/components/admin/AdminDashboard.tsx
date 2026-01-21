'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { statsService, notificationService } from '@/lib/api/services'
import {
  MountainSnow,
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
        <RefreshCw className="h-8 w-8 animate-spin text-wb-50" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
        <AlertCircle className="h-12 w-12 text-brand-red-100 mb-4" />
        <h3 className="text-lg font-medium text-wb-100 mb-2">無法載入資料</h3>
        <p className="text-wb-70 mb-4">{error}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-wb-100 text-white rounded-lg hover:bg-wb-90 transition-colors"
        >
          重試
        </button>
      </div>
    )
  }

  // 使用品牌灰階作為統計卡片背景
  const contentStats = [
    { label: '岩場', value: siteStats?.crags || 0, icon: MountainSnow },
    { label: '路線', value: siteStats?.routes || 0, icon: MapPin },
    { label: '人物誌', value: siteStats?.biographies || 0, icon: Users },
    { label: '影片', value: siteStats?.videos || 0, icon: Video },
    { label: '文章', value: siteStats?.posts || 0, icon: FileText },
    { label: '岩館', value: siteStats?.gyms || 0, icon: Building2 },
  ]

  const quickLinks = [
    {
      title: '通知監控',
      description: '查看過去 24 小時的通知系統統計',
      href: '/admin/notifications',
      icon: Bell,
    },
    {
      title: '用戶管理',
      description: '管理用戶帳號和權限',
      href: '/admin/users',
      icon: UserCheck,
    },
    {
      title: '內容管理',
      description: '管理岩場、岩館、影片等內容',
      href: '/admin/content',
      icon: BarChart3,
    },
    {
      title: '數據分析',
      description: '查看用戶活躍度和使用趨勢',
      href: '/admin/analytics',
      icon: Activity,
    },
  ]

  // 計算通知已讀率
  const readRate = notificationStats && notificationStats.total > 0
    ? Math.round(((notificationStats.total - notificationStats.unread) / notificationStats.total) * 100)
    : 0

  return (
    <div className="space-y-6 md:space-y-8">
      {/* 頁面標題 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-wb-100">管理後台總覽</h1>
          <p className="text-wb-70 mt-1 text-sm md:text-base">
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
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-wb-70 hover:text-wb-100 hover:bg-wb-10 rounded-lg transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="h-4 w-4" />
          重新整理
        </button>
      </div>

      {/* 內容統計卡片 */}
      <div>
        <h2 className="text-base md:text-lg font-semibold text-wb-100 mb-3 md:mb-4">內容統計</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {contentStats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl shadow-sm border border-wb-20 p-3 md:p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 md:gap-3">
                <div className="p-2 md:p-2.5 rounded-lg bg-wb-10">
                  <stat.icon className="h-4 w-4 md:h-5 md:w-5 text-wb-100" />
                </div>
                <div>
                  <p className="text-xs text-wb-70">{stat.label}</p>
                  <p className="text-lg md:text-xl font-bold text-wb-100">
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
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="text-base md:text-lg font-semibold text-wb-100">通知系統 (過去 24 小時)</h2>
            <Link
              href="/admin/notifications"
              className="text-sm text-wb-100 hover:text-brand-yellow-100 flex items-center gap-1 transition-colors"
            >
              查看詳情
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-wb-20 p-4 md:p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 md:p-3 bg-wb-10 rounded-lg">
                  <Bell className="h-4 w-4 md:h-5 md:w-5 text-wb-100" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-wb-70">發送總數</p>
                  <p className="text-xl md:text-2xl font-bold text-wb-100">{notificationStats.total}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-wb-20 p-4 md:p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 md:p-3 bg-brand-yellow-100/20 rounded-lg">
                  <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-brand-yellow-200" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-wb-70">未讀通知</p>
                  <p className="text-xl md:text-2xl font-bold text-wb-100">{notificationStats.unread}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-wb-20 p-4 md:p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 md:p-3 bg-wb-10 rounded-lg">
                  <Users className="h-4 w-4 md:h-5 md:w-5 text-wb-100" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-wb-70">有通知的用戶</p>
                  <p className="text-xl md:text-2xl font-bold text-wb-100">{notificationStats.usersWithNotifications}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-wb-20 p-4 md:p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 md:p-3 bg-wb-10 rounded-lg">
                  <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-wb-100" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-wb-70">已讀率</p>
                  <p className="text-xl md:text-2xl font-bold text-wb-100">{readRate}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 快速連結 */}
      <div>
        <h2 className="text-base md:text-lg font-semibold text-wb-100 mb-3 md:mb-4">管理功能</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.title}
              href={link.href}
              className="block bg-white rounded-xl shadow-sm border border-wb-20 p-4 md:p-5 hover:shadow-md hover:border-wb-30 transition-all group"
            >
              <div className="w-9 h-9 md:w-10 md:h-10 bg-wb-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-brand-yellow-100 transition-colors">
                <link.icon className="h-4 w-4 md:h-5 md:w-5 text-white group-hover:text-wb-100" />
              </div>
              <h3 className="font-semibold text-wb-100 mb-1 group-hover:text-brand-yellow-200 transition-colors">
                {link.title}
              </h3>
              <p className="text-sm text-wb-70">{link.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* 系統資訊 */}
      <div className="bg-wb-10 rounded-xl p-4 md:p-6">
        <h2 className="text-base md:text-lg font-semibold text-wb-100 mb-3 md:mb-4">系統資訊</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 text-sm">
          <div>
            <p className="text-wb-70 mb-1">平台</p>
            <p className="font-medium text-wb-100">NobodyClimb 攀岩社群</p>
          </div>
          <div>
            <p className="text-wb-70 mb-1">前端框架</p>
            <p className="font-medium text-wb-100">Next.js 15 + React 19</p>
          </div>
          <div>
            <p className="text-wb-70 mb-1">部署環境</p>
            <p className="font-medium text-wb-100">Cloudflare Workers</p>
          </div>
        </div>
      </div>
    </div>
  )
}
