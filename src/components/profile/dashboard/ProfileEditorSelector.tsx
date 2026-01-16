'use client'

/**
 * Profile 編輯器版本選擇頁面
 *
 * 讓用戶體驗三種不同的編輯方式，選擇最適合的版本
 */

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  LayoutGrid,
  MousePointer,
  ListOrdered,
  ChevronRight,
} from 'lucide-react'
import ProfileEditorVersionA from './ProfileEditorVersionA'
import ProfileEditorVersionB from './ProfileEditorVersionB'
import ProfileEditorVersionC from './ProfileEditorVersionC'

type EditorVersion = 'selector' | 'A' | 'B' | 'C'

interface VersionOption {
  id: 'A' | 'B' | 'C'
  icon: React.ReactNode
  title: string
  subtitle: string
  description: string
  pros: string[]
  bestFor: string
}

const VERSION_OPTIONS: VersionOption[] = [
  {
    id: 'A',
    icon: <LayoutGrid className="h-8 w-8" />,
    title: '版本 A：分頁式編輯',
    subtitle: '傳統表單體驗',
    description: '使用側邊導航標籤，在單一頁面中切換編輯不同區塊。適合想要一次編輯多個欄位的用戶。',
    pros: ['一目了然的導航', '可以快速切換區塊', '適合完整編輯'],
    bestFor: '想要完整編輯所有資料的用戶',
  },
  {
    id: 'B',
    icon: <MousePointer className="h-8 w-8" />,
    title: '版本 B：內聯編輯',
    subtitle: '所見即所得',
    description: '直接在預覽頁面上點擊編輯，即時看到修改效果。類似 Notion 的編輯體驗。',
    pros: ['直覺的編輯方式', '即時預覽效果', '自動儲存'],
    bestFor: '想要快速修改特定欄位的用戶',
  },
  {
    id: 'C',
    icon: <ListOrdered className="h-8 w-8" />,
    title: '版本 C：引導精靈',
    subtitle: '逐步完成設定',
    description: '一步一步引導你完成設定，每次只專注一件事。有明確的進度指示。',
    pros: ['降低認知負擔', '明確的完成進度', '適合新手'],
    bestFor: '第一次設定或喜歡被引導的用戶',
  },
]

export default function ProfileEditorSelector() {
  const [activeVersion, setActiveVersion] = useState<EditorVersion>('selector')
  const [hoveredVersion, setHoveredVersion] = useState<'A' | 'B' | 'C' | null>(null)

  // 渲染對應版本的編輯器
  if (activeVersion === 'A') {
    return <ProfileEditorVersionA onBack={() => setActiveVersion('selector')} />
  }

  if (activeVersion === 'B') {
    return <ProfileEditorVersionB onBack={() => setActiveVersion('selector')} />
  }

  if (activeVersion === 'C') {
    return (
      <ProfileEditorVersionC
        onBack={() => setActiveVersion('selector')}
        onComplete={() => setActiveVersion('selector')}
      />
    )
  }

  // 選擇器頁面
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-4xl px-4 py-12">
        {/* 標題 */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold text-gray-900">選擇編輯方式</h1>
          <p className="mt-2 text-gray-500">
            我們提供三種不同的編輯體驗，選擇最適合你的方式
          </p>
        </div>

        {/* 版本選項 */}
        <div className="grid gap-6 md:grid-cols-3">
          {VERSION_OPTIONS.map((option) => (
            <motion.div
              key={option.id}
              onMouseEnter={() => setHoveredVersion(option.id)}
              onMouseLeave={() => setHoveredVersion(null)}
              whileHover={{ y: -4 }}
              className="relative"
            >
              <button
                onClick={() => setActiveVersion(option.id)}
                className={`group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border-2 bg-white p-6 text-left transition-all ${
                  hoveredVersion === option.id
                    ? 'border-gray-900 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* 圖標 */}
                <div
                  className={`mb-4 flex h-16 w-16 items-center justify-center rounded-xl transition-colors ${
                    hoveredVersion === option.id
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {option.icon}
                </div>

                {/* 標題 */}
                <h2 className="text-lg font-semibold text-gray-900">
                  {option.title}
                </h2>
                <p className="text-sm text-gray-500">{option.subtitle}</p>

                {/* 說明 */}
                <p className="mt-3 flex-1 text-sm text-gray-600">
                  {option.description}
                </p>

                {/* 優點列表 */}
                <ul className="mt-4 space-y-1">
                  {option.pros.map((pro) => (
                    <li key={pro} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      {pro}
                    </li>
                  ))}
                </ul>

                {/* 適合用戶 */}
                <div className="mt-4 rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">適合：</p>
                  <p className="text-sm font-medium text-gray-700">{option.bestFor}</p>
                </div>

                {/* 試用按鈕 */}
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">試用這個版本</span>
                  <ChevronRight
                    className={`h-5 w-5 transition-transform ${
                      hoveredVersion === option.id ? 'translate-x-1' : ''
                    }`}
                  />
                </div>
              </button>

              {/* 推薦標籤 */}
              {option.id === 'B' && (
                <div className="absolute -top-2 left-4 rounded-full bg-amber-500 px-3 py-1 text-xs font-medium text-white">
                  推薦
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* 比較表格 */}
        <div className="mt-16">
          <h2 className="mb-6 text-center text-xl font-semibold text-gray-900">
            功能比較
          </h2>

          <div className="overflow-hidden rounded-xl border bg-white">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    功能
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                    版本 A
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                    版本 B
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                    版本 C
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-600">即時預覽</td>
                  <td className="px-6 py-4 text-center">○</td>
                  <td className="px-6 py-4 text-center text-green-600">●</td>
                  <td className="px-6 py-4 text-center">○</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-600">自動儲存</td>
                  <td className="px-6 py-4 text-center">○</td>
                  <td className="px-6 py-4 text-center text-green-600">●</td>
                  <td className="px-6 py-4 text-center text-green-600">●</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-600">進度追蹤</td>
                  <td className="px-6 py-4 text-center text-green-600">●</td>
                  <td className="px-6 py-4 text-center">○</td>
                  <td className="px-6 py-4 text-center text-green-600">●</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-600">快速切換區塊</td>
                  <td className="px-6 py-4 text-center text-green-600">●</td>
                  <td className="px-6 py-4 text-center text-green-600">●</td>
                  <td className="px-6 py-4 text-center">○</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-600">新手友善</td>
                  <td className="px-6 py-4 text-center">○</td>
                  <td className="px-6 py-4 text-center">○</td>
                  <td className="px-6 py-4 text-center text-green-600">●</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-600">行動裝置體驗</td>
                  <td className="px-6 py-4 text-center">○</td>
                  <td className="px-6 py-4 text-center text-green-600">●</td>
                  <td className="px-6 py-4 text-center text-green-600">●</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 提示 */}
        <div className="mt-8 text-center text-sm text-gray-500">
          你可以隨時切換不同的編輯方式，所有資料都會保留
        </div>
      </div>
    </div>
  )
}
