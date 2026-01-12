'use client'

import React, { useState } from 'react'
import PlaceholderImage from '@/components/ui/placeholder-image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Filter, MapPin, Calendar, Clock, ChevronUp, ChevronDown } from 'lucide-react'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { PageHeader } from '@/components/ui/page-header'
import BackToTop from '@/components/ui/back-to-top'
import { getAllCrags } from '@/lib/crag-data'

// 從資料服務層讀取岩場資料
const crags = getAllCrags()

// 岩石類型篩選選項
const rockTypes = ['全部', '砂岩', '石灰岩', '海蝕岩', '花崗岩']

// 難度篩選選項
const difficultyLevels = [
  '全部',
  '入門 (5.5-5.8)',
  '初級 (5.9-5.10c)',
  '中級 (5.10d-5.11c)',
  '高級 (5.11d+)',
]

// 季節篩選選項
const seasonOptions = ['全部', '春', '夏', '秋', '冬']

export default function CragListPage() {
  const [selectedRockType, setSelectedRockType] = useState('全部')
  const [selectedDifficulty, setSelectedDifficulty] = useState('全部')
  const [selectedSeason, setSelectedSeason] = useState('全部')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [expandedFilters, setExpandedFilters] = useState({
    rockType: true,
    difficulty: false,
    season: false,
  })

  // 切換篩選展開狀態
  const toggleFilter = (filter: 'rockType' | 'difficulty' | 'season') => {
    setExpandedFilters({
      ...expandedFilters,
      [filter]: !expandedFilters[filter],
    })
  }

  // 篩選岩場
  const filteredCrags = crags.filter((crag) => {
    const typeMatch = selectedRockType === '全部' || crag.type.includes(selectedRockType)
    const seasonMatch = selectedSeason === '全部' || crag.seasons.includes(selectedSeason)
    // 由於難度比較複雜，這裡簡化處理
    const difficultyMatch = selectedDifficulty === '全部' // 實際應用中需要更複雜的邏輯

    return typeMatch && seasonMatch && difficultyMatch
  })

  return (
    <main className="min-h-screen bg-page-content-bg pb-16">
      <PageHeader
        title="探索岩場"
        subtitle="發現台灣各地最佳攀岩地點，從海蝕岩場到山區砂岩，適合各級攀岩者的完美岩點"
      />

      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Breadcrumb items={[{ label: '首頁', href: '/' }, { label: '岩場' }]} />
        </div>

        {/* 篩選區塊 */}
        <div className="mb-8 rounded-xl bg-white p-6 shadow-md">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="flex items-center text-xl font-bold">
              <Filter size={20} className="mr-2 text-[#1B1A1A]" />
              篩選岩場
            </h2>
            <button
              className="flex items-center rounded-md border border-gray-200 px-4 py-2 font-medium text-[#1B1A1A] transition hover:bg-gray-50 md:hidden"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              {isFilterOpen ? '收起篩選' : '展開篩選'}
            </button>
          </div>

          <div className={`${isFilterOpen ? 'block' : 'hidden md:block'}`}>
            <div className="space-y-6">
              {/* 岩石類型篩選 */}
              <div className="border-b pb-4">
                <div
                  className="flex cursor-pointer items-center justify-between"
                  onClick={() => toggleFilter('rockType')}
                >
                  <h3 className="font-medium text-gray-800">岩石類型</h3>
                  {expandedFilters.rockType ? (
                    <ChevronUp size={18} className="text-gray-500" />
                  ) : (
                    <ChevronDown size={18} className="text-gray-500" />
                  )}
                </div>

                {expandedFilters.rockType && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {rockTypes.map((type) => (
                      <button
                        key={type}
                        className={`border-b-2 px-4 py-1.5 text-sm transition ${
                          selectedRockType === type
                            ? 'border-[#1B1A1A] font-medium text-[#1B1A1A]'
                            : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-800'
                        }`}
                        onClick={() => setSelectedRockType(type)}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 難度範圍篩選 */}
              <div className="border-b pb-4">
                <div
                  className="flex cursor-pointer items-center justify-between"
                  onClick={() => toggleFilter('difficulty')}
                >
                  <h3 className="font-medium text-gray-800">難度範圍</h3>
                  {expandedFilters.difficulty ? (
                    <ChevronUp size={18} className="text-gray-500" />
                  ) : (
                    <ChevronDown size={18} className="text-gray-500" />
                  )}
                </div>

                {expandedFilters.difficulty && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {difficultyLevels.map((level) => (
                      <button
                        key={level}
                        className={`border-b-2 px-4 py-1.5 text-sm transition ${
                          selectedDifficulty === level
                            ? 'border-[#1B1A1A] font-medium text-[#1B1A1A]'
                            : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-800'
                        }`}
                        onClick={() => setSelectedDifficulty(level)}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 季節篩選 */}
              <div>
                <div
                  className="flex cursor-pointer items-center justify-between"
                  onClick={() => toggleFilter('season')}
                >
                  <h3 className="font-medium text-gray-800">季節</h3>
                  {expandedFilters.season ? (
                    <ChevronUp size={18} className="text-gray-500" />
                  ) : (
                    <ChevronDown size={18} className="text-gray-500" />
                  )}
                </div>

                {expandedFilters.season && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {seasonOptions.map((season) => (
                      <button
                        key={season}
                        className={`border-b-2 px-4 py-1.5 text-sm transition ${
                          selectedSeason === season
                            ? 'border-[#1B1A1A] font-medium text-[#1B1A1A]'
                            : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-800'
                        }`}
                        onClick={() => setSelectedSeason(season)}
                      >
                        {season}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 清除篩選按鈕 */}
            <div className="mt-6 text-center">
              <button
                className="rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-[#1B1A1A] transition hover:bg-gray-50"
                onClick={() => {
                  setSelectedRockType('全部')
                  setSelectedDifficulty('全部')
                  setSelectedSeason('全部')
                }}
              >
                清除所有篩選
              </button>
            </div>
          </div>
        </div>

        {/* 搜尋結果 */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-gray-600">
            找到 <span className="font-medium text-gray-900">{filteredCrags.length}</span> 個岩場
          </p>
          <div className="flex items-center space-x-4">
            <select className="rounded-md border border-gray-200 bg-white p-2 text-sm text-gray-600">
              <option value="recommend">推薦排序</option>
              <option value="name">名稱排序</option>
              <option value="routes-high">路線數量 (高到低)</option>
              <option value="routes-low">路線數量 (低到高)</option>
            </select>
          </div>
        </div>

        {/* 岩場列表 */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCrags.map((crag) => (
            <motion.div
              key={crag.id}
              className="overflow-hidden rounded-xl bg-white shadow-md transition hover:shadow-lg"
              whileHover={{ y: -5 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Link href={`/crag/${crag.id}`} className="block h-full">
                <div className="relative h-48 w-full">
                  <PlaceholderImage text={crag.name} bgColor="#f8fafc" />
                  <div className="absolute right-4 top-4 rounded bg-[#FFE70C] px-2.5 py-1 text-xs font-bold text-black">
                    {crag.type}
                  </div>
                </div>
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold">{crag.name}</h3>
                    <p className="text-gray-500">{crag.nameEn}</p>
                  </div>

                  <div className="mb-5 space-y-3">
                    <div className="flex items-center text-gray-700">
                      <MapPin size={16} className="mr-2 text-gray-400" />
                      <span>{crag.location}</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <Calendar size={16} className="mr-2 text-gray-400" />
                      <span>最佳季節: {crag.seasons.join(', ')}</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <Clock size={16} className="mr-2 text-gray-400" />
                      <span>接近時間: 15-30分鐘</span>
                    </div>
                  </div>

                  <div className="mb-5 grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-gray-50 p-3 text-center">
                      <p className="mb-1 text-sm text-gray-500">難度範圍</p>
                      <p className="font-medium">{crag.difficulty}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3 text-center">
                      <p className="mb-1 text-sm text-gray-500">路線數量</p>
                      <p className="font-medium">{crag.routes}+</p>
                    </div>
                  </div>

                  <button className="w-full rounded-md bg-[#1B1A1A] py-2 font-medium text-white transition hover:bg-black">
                    查看詳情
                  </button>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* 無結果提示 */}
        {filteredCrags.length === 0 && (
          <div className="my-6 rounded-xl bg-white py-16 text-center shadow-sm">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FFE70C]">
                <Filter size={24} className="text-[#1B1A1A]" />
              </div>
            </div>
            <p className="mb-3 text-xl text-gray-600">沒有找到符合條件的岩場</p>
            <p className="mb-6 text-gray-500">請嘗試調整篩選條件</p>
            <button
              className="rounded-md bg-[#1B1A1A] px-6 py-2 font-medium text-white transition hover:bg-black"
              onClick={() => {
                setSelectedRockType('全部')
                setSelectedDifficulty('全部')
                setSelectedSeason('全部')
              }}
            >
              清除篩選條件
            </button>
          </div>
        )}

        {/* 加載更多按鈕 */}
        {filteredCrags.length > 0 && (
          <div className="mt-12 text-center">
            <button className="rounded-md border border-gray-300 bg-white px-8 py-3 font-medium text-[#1B1A1A] transition hover:bg-gray-50">
              載入更多岩場
            </button>
          </div>
        )}
      </div>

      {/* 回到頂部按鈕 */}
      <BackToTop />
    </main>
  )
}
