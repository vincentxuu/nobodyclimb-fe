'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  adminAccessLogsService,
  AccessLogSummary,
  AccessLogEntry,
  AccessLogError,
  AccessLogSlow,
} from '@/lib/api/services'
import {
  RefreshCw,
  AlertCircle,
  Activity,
  AlertTriangle,
  Clock,
  Globe,
  TrendingUp,
  Server,
  Zap,
  List,
} from 'lucide-react'

type TabType = 'summary' | 'logs' | 'errors' | 'slow'

export default function AdminAccessLogs() {
  const [activeTab, setActiveTab] = useState<TabType>('summary')
  const [summaryData, setSummaryData] = useState<AccessLogSummary | null>(null)
  const [logsData, setLogsData] = useState<AccessLogEntry[] | null>(null)
  const [errorsData, setErrorsData] = useState<AccessLogError[] | null>(null)
  const [slowData, setSlowData] = useState<AccessLogSlow[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hours, setHours] = useState(24)

  const loadData = useCallback(
    async (tab: TabType, forceRefresh = false) => {
      setLoading(true)
      setError(null)
      try {
        switch (tab) {
          case 'summary':
            if (forceRefresh || !summaryData) {
              const response = await adminAccessLogsService.getSummary(hours)
              if (response.success && response.data) {
                setSummaryData(response.data)
              }
            }
            break
          case 'logs':
            if (forceRefresh || !logsData) {
              const response = await adminAccessLogsService.getLogs({ limit: 100 })
              if (response.success && response.data) {
                setLogsData(response.data)
              }
            }
            break
          case 'errors':
            if (forceRefresh || !errorsData) {
              const response = await adminAccessLogsService.getErrors({ hours, limit: 50 })
              if (response.success && response.data) {
                setErrorsData(response.data)
              }
            }
            break
          case 'slow':
            if (forceRefresh || !slowData) {
              const response = await adminAccessLogsService.getSlowRequests({
                hours,
                threshold: 1000,
                limit: 50,
              })
              if (response.success && response.data) {
                setSlowData(response.data)
              }
            }
            break
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : '載入失敗'
        // 檢查是否是 Analytics Engine 未設定的錯誤
        if (message.includes('CLOUDFLARE_ACCOUNT_ID') || message.includes('CLOUDFLARE_API_TOKEN')) {
          setError('Analytics Engine 尚未設定。請在 Cloudflare Workers 設定 CLOUDFLARE_ACCOUNT_ID 和 CLOUDFLARE_API_TOKEN secrets。')
        } else {
          setError(message)
        }
      } finally {
        setLoading(false)
      }
    },
    [summaryData, logsData, errorsData, slowData, hours]
  )

  const refreshData = async () => {
    setSummaryData(null)
    setLogsData(null)
    setErrorsData(null)
    setSlowData(null)
    await loadData(activeTab, true)
  }

  useEffect(() => {
    loadData(activeTab)
  }, [activeTab, loadData])

  const tabs = [
    { id: 'summary' as TabType, label: '統計總覽', icon: TrendingUp },
    { id: 'logs' as TabType, label: '請求日誌', icon: List },
    { id: 'errors' as TabType, label: '錯誤日誌', icon: AlertTriangle },
    { id: 'slow' as TabType, label: '慢請求', icon: Clock },
  ]

  // 格式化時間
  const formatTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString('zh-TW')
    } catch {
      return timestamp
    }
  }

  // 格式化響應時間
  const formatResponseTime = (ms: number) => {
    if (ms >= 1000) {
      return `${(ms / 1000).toFixed(2)}s`
    }
    return `${Math.round(ms)}ms`
  }

  // HTTP 狀態碼顏色
  const getStatusColor = (status: string | number) => {
    const statusNum = typeof status === 'string' ? parseInt(status) : status
    if (statusNum >= 200 && statusNum < 300) return 'text-green-600 bg-green-100'
    if (statusNum >= 300 && statusNum < 400) return 'text-blue-600 bg-blue-100'
    if (statusNum >= 400 && statusNum < 500) return 'text-yellow-600 bg-yellow-100'
    if (statusNum >= 500) return 'text-red-600 bg-red-100'
    return 'text-gray-600 bg-gray-100'
  }

  // 簡單長條圖組件
  const SimpleBarChart = ({
    data,
    labelKey,
    valueKey,
    maxBars = 10,
  }: {
    data: Record<string, unknown>[]
    labelKey: string
    valueKey: string
    maxBars?: number
  }) => {
    if (!data || data.length === 0) return <p className="text-gray-500">暫無數據</p>
    const displayData = data.slice(0, maxBars)
    const maxValue = Math.max(...displayData.map((d) => Number(d[valueKey]) || 0))
    return (
      <div className="space-y-2">
        {displayData.map((item) => {
          const value = Number(item[valueKey]) || 0
          const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0
          return (
            <div key={String(item[labelKey])} className="flex items-center gap-2">
              <span className="w-32 text-sm text-gray-600 truncate" title={String(item[labelKey])}>
                {String(item[labelKey])}
              </span>
              <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="w-16 text-sm text-gray-700 text-right">{value}</span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 標題和操作 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">訪問日誌</h1>
        <div className="flex items-center gap-4">
          <select
            value={hours}
            onChange={(e) => {
              setHours(Number(e.target.value))
              setSummaryData(null)
              setErrorsData(null)
              setSlowData(null)
            }}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value={1}>過去 1 小時</option>
            <option value={6}>過去 6 小時</option>
            <option value={24}>過去 24 小時</option>
            <option value={72}>過去 3 天</option>
            <option value={168}>過去 7 天</option>
          </select>
          <button
            onClick={refreshData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            重新整理
          </button>
        </div>
      </div>

      {/* 分頁標籤 */}
      <div className="flex gap-2 mb-6 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* 錯誤提示 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-700">{error}</p>
            {error.includes('Analytics Engine') && (
              <p className="text-sm text-red-600 mt-2">
                設定方法：
                <br />
                1. 在 Cloudflare Dashboard 取得 Account ID
                <br />
                2. 建立 API Token（需要 Analytics Engine 讀取權限）
                <br />
                3. 執行：wrangler secret put CLOUDFLARE_ACCOUNT_ID --env production
                <br />
                4. 執行：wrangler secret put CLOUDFLARE_API_TOKEN --env production
              </p>
            )}
          </div>
        </div>
      )}

      {/* 載入中 */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-3 text-gray-600">載入中...</span>
        </div>
      )}

      {/* 統計總覽 */}
      {!loading && activeTab === 'summary' && summaryData && (
        <div className="space-y-6">
          {/* 摘要卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <Activity className="w-4 h-4" />
                <span className="text-sm">總請求數</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {summaryData.summary.totalRequests?.toLocaleString() || 0}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <Zap className="w-4 h-4" />
                <span className="text-sm">平均響應時間</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatResponseTime(summaryData.summary.avgResponseTime || 0)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="flex items-center gap-2 text-green-500 mb-2">
                <Server className="w-4 h-4" />
                <span className="text-sm">成功請求</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {summaryData.summary.successCount?.toLocaleString() || 0}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="flex items-center gap-2 text-yellow-500 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">客戶端錯誤</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">
                {summaryData.summary.clientErrorCount?.toLocaleString() || 0}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="flex items-center gap-2 text-red-500 mb-2">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">伺服器錯誤</span>
              </div>
              <p className="text-2xl font-bold text-red-600">
                {summaryData.summary.serverErrorCount?.toLocaleString() || 0}
              </p>
            </div>
          </div>

          {/* 圖表區 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 熱門路徑 */}
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">熱門 API 路徑</h3>
              <SimpleBarChart
                data={summaryData.topPaths as unknown as Record<string, unknown>[]}
                labelKey="path"
                valueKey="count"
              />
            </div>

            {/* HTTP 方法分布 */}
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">HTTP 方法分布</h3>
              <SimpleBarChart
                data={summaryData.methodDistribution as unknown as Record<string, unknown>[]}
                labelKey="method"
                valueKey="count"
              />
            </div>

            {/* 國家分布 */}
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5" />
                訪問國家分布
              </h3>
              <SimpleBarChart
                data={summaryData.countryDistribution as unknown as Record<string, unknown>[]}
                labelKey="country"
                valueKey="count"
              />
            </div>

            {/* 每小時請求量 */}
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">每小時請求量</h3>
              <SimpleBarChart
                data={summaryData.hourlyRequests as unknown as Record<string, unknown>[]}
                labelKey="hour"
                valueKey="count"
                maxBars={24}
              />
            </div>
          </div>
        </div>
      )}

      {/* 請求日誌 */}
      {!loading && activeTab === 'logs' && logsData && (
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    時間
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    方法
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    路徑
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    狀態
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    響應時間
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    國家
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    用戶
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logsData.map((log, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatTime(log.timestamp)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                        {log.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-mono max-w-xs truncate">
                      {log.path}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(log.statusCode)}`}
                      >
                        {log.statusCode}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatResponseTime(log.responseTime)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{log.country}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 truncate max-w-[100px]">
                      {log.userId === 'anonymous' ? (
                        <span className="text-gray-400">匿名</span>
                      ) : (
                        log.userId
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {logsData.length === 0 && (
            <div className="text-center py-8 text-gray-500">暫無日誌數據</div>
          )}
        </div>
      )}

      {/* 錯誤日誌 */}
      {!loading && activeTab === 'errors' && errorsData && (
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    時間
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    方法
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    路徑
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    狀態
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    錯誤訊息
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    用戶
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {errorsData.map((log, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatTime(log.timestamp)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                        {log.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-mono max-w-xs truncate">
                      {log.path}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(log.statusCode)}`}
                      >
                        {log.statusCode}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-red-600 max-w-xs truncate">
                      {log.errorMessage || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 truncate max-w-[100px]">
                      {log.userId === 'anonymous' ? (
                        <span className="text-gray-400">匿名</span>
                      ) : (
                        log.userId
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {errorsData.length === 0 && (
            <div className="text-center py-8 text-gray-500">太棒了！沒有錯誤日誌</div>
          )}
        </div>
      )}

      {/* 慢請求 */}
      {!loading && activeTab === 'slow' && slowData && (
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    時間
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    方法
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    路徑
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    狀態
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    響應時間
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    用戶
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {slowData.map((log, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatTime(log.timestamp)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                        {log.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-mono max-w-xs truncate">
                      {log.path}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(log.statusCode)}`}
                      >
                        {log.statusCode}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded">
                        {formatResponseTime(log.responseTime)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 truncate max-w-[100px]">
                      {log.userId === 'anonymous' ? (
                        <span className="text-gray-400">匿名</span>
                      ) : (
                        log.userId
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {slowData.length === 0 && (
            <div className="text-center py-8 text-gray-500">太棒了！沒有慢請求</div>
          )}
        </div>
      )}
    </div>
  )
}
