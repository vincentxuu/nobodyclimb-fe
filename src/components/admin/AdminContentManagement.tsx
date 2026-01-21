'use client'

import { useState, useEffect } from 'react'
import { statsService, SiteStats } from '@/lib/api/services'
import {
  Mountain,
  Building2,
  Video,
  FileText,
  MapPin,
  Image,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Plus,
  Database,
} from 'lucide-react'

interface ContentCategory {
  id: string
  title: string
  description: string
  icon: React.ElementType
  color: string
  count: number
  actions: {
    label: string
    href: string
    external?: boolean
  }[]
}

export default function AdminContentManagement() {
  const [stats, setStats] = useState<SiteStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await statsService.getStats()
      if (response.success && response.data) {
        setStats(response.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入失敗')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  const handleInvalidateCache = async () => {
    try {
      await statsService.invalidateCache()
      await loadStats()
      alert('快取已清除')
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失敗')
    }
  }

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
          onClick={loadStats}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          重試
        </button>
      </div>
    )
  }

  const contentCategories: ContentCategory[] = [
    {
      id: 'crags',
      title: '岩場管理',
      description: '管理戶外攀岩場地資訊',
      icon: Mountain,
      color: 'bg-emerald-500',
      count: stats?.crags || 0,
      actions: [
        { label: '查看所有岩場', href: '/crag' },
        { label: '新增岩場', href: '/crag/new', external: true },
      ],
    },
    {
      id: 'routes',
      title: '路線管理',
      description: '管理攀岩路線資料',
      icon: MapPin,
      color: 'bg-blue-500',
      count: stats?.routes || 0,
      actions: [{ label: '查看路線列表', href: '/crag' }],
    },
    {
      id: 'gyms',
      title: '健身房管理',
      description: '管理室內攀岩館資訊',
      icon: Building2,
      color: 'bg-cyan-500',
      count: stats?.gyms || 0,
      actions: [
        { label: '查看所有健身房', href: '/gym' },
        { label: '新增健身房', href: '/gym/new', external: true },
      ],
    },
    {
      id: 'videos',
      title: '影片管理',
      description: '管理攀岩相關影片',
      icon: Video,
      color: 'bg-red-500',
      count: stats?.videos || 0,
      actions: [{ label: '查看影片庫', href: '/videos' }],
    },
    {
      id: 'posts',
      title: '文章管理',
      description: '管理部落格文章',
      icon: FileText,
      color: 'bg-amber-500',
      count: stats?.posts || 0,
      actions: [
        { label: '查看所有文章', href: '/blog' },
        { label: '撰寫新文章', href: '/blog/new', external: true },
      ],
    },
    {
      id: 'biographies',
      title: '人物誌管理',
      description: '管理攀岩者人物誌',
      icon: Image,
      color: 'bg-purple-500',
      count: stats?.biographies || 0,
      actions: [{ label: '查看人物誌', href: '/biography' }],
    },
  ]

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">內容管理</h1>
          <p className="text-gray-500 mt-1">管理平台上的各類內容</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleInvalidateCache}
            className="flex items-center gap-2 px-4 py-2 text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
          >
            <Database className="h-4 w-4" />
            清除快取
          </button>
          <button
            onClick={loadStats}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            重新整理
          </button>
        </div>
      </div>

      {/* 內容統計概覽 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {contentCategories.map((category) => (
          <div
            key={category.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 ${category.color} rounded-lg`}>
                <category.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{category.title.replace('管理', '')}</p>
                <p className="text-xl font-bold text-gray-900">
                  {category.count.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 內容管理卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contentCategories.map((category) => (
          <div
            key={category.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 ${category.color} rounded-lg`}>
                  <category.icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {category.count.toLocaleString()}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{category.title}</h3>
              <p className="text-sm text-gray-500 mb-4">{category.description}</p>
              <div className="flex flex-wrap gap-2">
                {category.actions.map((action, index) => (
                  <a
                    key={index}
                    href={action.href}
                    target={action.external ? '_blank' : undefined}
                    rel={action.external ? 'noopener noreferrer' : undefined}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      index === 0
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-primary/10 text-primary hover:bg-primary/20'
                    }`}
                  >
                    {index === 0 ? null : <Plus className="h-3 w-3" />}
                    {action.label}
                    {action.external && <ExternalLink className="h-3 w-3 ml-1" />}
                  </a>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 管理提示 */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-2">內容管理說明</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 岩場、健身房、影片的新增和編輯需要 Admin 權限</li>
          <li>• 文章可由一般用戶撰寫，Admin 可以審核和管理所有文章</li>
          <li>• 人物誌由用戶自行管理，Admin 可以查看和編輯所有人物誌</li>
          <li>• 清除快取會強制重新計算統計數據，建議僅在數據不一致時使用</li>
        </ul>
      </div>

      {/* 更新時間 */}
      {stats?.updatedAt && (
        <p className="text-xs text-gray-400 text-center">
          統計數據更新時間：{new Date(stats.updatedAt).toLocaleString('zh-TW')}
        </p>
      )}
    </div>
  )
}
