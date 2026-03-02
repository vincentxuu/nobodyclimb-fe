'use client'

import { Database, Clock, User, MessageSquare } from 'lucide-react'

export interface DataSourceInfo {
  source: string
  sourceUrl?: string
  lastUpdated?: string
  maintainer: string
  maintainerUrl?: string
  version?: string
}

interface DataSourceSectionProps {
  data: DataSourceInfo
}

/**
 * 格式化日期時間
 */
function formatDateTime(dateString: string | undefined | null): string {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '-'
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return '-'
  }
}

export function DataSourceSection({ data }: DataSourceSectionProps) {
  return (
    <div className="mb-6">
      <div className="mb-1">
        <h2 className="text-lg font-medium text-orange-500">資料來源</h2>
        <div className="h-px w-full bg-gray-200"></div>
      </div>
      <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* 資料來源 */}
          <div className="flex items-start gap-3">
            <Database size={18} className="mt-0.5 flex-shrink-0 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">資料來源</p>
              {data.sourceUrl ? (
                <a
                  href={data.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-orange-500 hover:text-orange-600 hover:underline"
                >
                  {data.source}
                </a>
              ) : (
                <p className="text-sm font-medium text-gray-900">{data.source}</p>
              )}
            </div>
          </div>

          {/* 最後更新時間 */}
          <div className="flex items-start gap-3">
            <Clock size={18} className="mt-0.5 flex-shrink-0 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">最後更新</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDateTime(data.lastUpdated)}
              </p>
            </div>
          </div>

          {/* 資料維護者 */}
          <div className="flex items-start gap-3">
            <User size={18} className="mt-0.5 flex-shrink-0 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">資料維護</p>
              {data.maintainerUrl ? (
                <a
                  href={data.maintainerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-orange-500 hover:text-orange-600 hover:underline"
                >
                  {data.maintainer}
                </a>
              ) : (
                <p className="text-sm font-medium text-gray-900">{data.maintainer}</p>
              )}
            </div>
          </div>

          {/* 回報錯誤連結 */}
          <div className="flex items-start gap-3">
            <MessageSquare size={18} className="mt-0.5 flex-shrink-0 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">發現錯誤？</p>
              <a
                href="https://forms.gle/Q1d4UXWpTUHVVCY88"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-orange-500 hover:text-orange-600 hover:underline"
              >
                回報資料問題
              </a>
            </div>
          </div>
        </div>

        {/* 版本資訊（如有） */}
        {data.version && (
          <div className="mt-3 border-t border-gray-200 pt-3">
            <p className="text-xs text-gray-400">資料版本：{data.version}</p>
          </div>
        )}
      </div>
    </div>
  )
}
