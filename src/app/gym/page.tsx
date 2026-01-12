'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { MapPin, Filter, Loader2, Star } from 'lucide-react'
import BackToTop from '@/components/ui/back-to-top'
import PlaceholderImage from '@/components/ui/placeholder-image'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { PageHeader } from '@/components/ui/page-header'
import { searchGyms, type GymListItem } from '@/lib/gym-data'

// 區域篩選選項（僅保留有岩館的地區）
const regions = [
  '所有地區',
  '台北',
  '新北',
  '桃園',
  '新竹',
  '台中',
  '彰化',
  '台南',
  '高雄',
  '宜蘭',
  '花蓮',
  '台東',
]

// 攀岩館類型篩選選項
const gymTypes = ['所有類型', '上攀', '抱石']

export default function GymListPage() {
  const [selectedRegion, setSelectedRegion] = useState('所有地區')
  const [selectedType, setSelectedType] = useState('所有類型')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [gyms, setGyms] = useState<GymListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 載入岩館資料
  useEffect(() => {
    try {
      setLoading(true)
      setError(null)
      const data = searchGyms({
        region: selectedRegion,
        type: selectedType,
      })
      setGyms(data)
    } catch (err) {
      console.error('Error fetching gyms:', err)
      setError('無法載入岩館資料，請稍後再試')
    } finally {
      setLoading(false)
    }
  }, [selectedRegion, selectedType])

  return (
    <main className="min-h-screen bg-page-content-bg">
      <PageHeader title="岩館介紹" subtitle="探索台灣各式各樣有趣的岩館" />

      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Breadcrumb items={[{ label: '首頁', href: '/' }, { label: '岩館' }]} />
        </div>

        {/* 篩選區塊 */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold">篩選</h2>
            <button
              className="flex items-center font-medium text-primary md:hidden"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <Filter size={18} className="mr-1" />
              {isFilterOpen ? '收起篩選' : '展開篩選'}
            </button>
          </div>

          <div className={`${isFilterOpen ? 'block' : 'hidden md:block'}`}>
            <div className="space-y-6">
              <div>
                <h3 className="mb-3 font-medium text-gray-900">地區篩選</h3>
                <div className="flex flex-wrap gap-2">
                  {regions.map((region) => (
                    <button
                      key={region}
                      className={`border-b-2 px-4 py-1.5 text-sm transition ${
                        selectedRegion === region
                          ? 'border-[#1B1A1A] font-medium text-[#1B1A1A]'
                          : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-800'
                      }`}
                      onClick={() => setSelectedRegion(region)}
                    >
                      {region}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-3 font-medium text-gray-900">類型篩選</h3>
                <div className="flex flex-wrap gap-2">
                  {gymTypes.map((type) => (
                    <button
                      key={type}
                      className={`border-b-2 px-4 py-1.5 text-sm transition ${
                        selectedType === type
                          ? 'border-[#1B1A1A] font-medium text-[#1B1A1A]'
                          : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-800'
                      }`}
                      onClick={() => setSelectedType(type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 載入中狀態 */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">載入中...</span>
          </div>
        )}

        {/* 錯誤狀態 */}
        {error && (
          <div className="py-12 text-center">
            <p className="text-lg text-red-500">{error}</p>
          </div>
        )}

        {/* 搜尋結果 */}
        {!loading && !error && (
          <>
            <div className="mb-4">
              <p className="text-sm text-gray-500">
                找到 <span className="font-medium text-gray-900">{gyms.length}</span> 個攀岩館
              </p>
            </div>

            {/* 攀岩館列表 */}
            <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {gyms.map((gym) => (
                <motion.div
                  key={gym.id}
                  className="overflow-hidden rounded-lg bg-white shadow-sm transition-shadow hover:shadow"
                  whileHover={{ y: -3 }}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Link href={`/gym/${gym.id}`}>
                    <div className="relative h-48 w-full bg-gray-100">
                      <PlaceholderImage text={gym.name} bgColor="#f8fafc" textColor="#64748b" />
                    </div>
                    <div className="p-4">
                      <div className="mb-2">
                        <h3 className="text-base font-bold text-gray-900">{gym.name}</h3>
                        {gym.nameEn && gym.nameEn !== gym.name && (
                          <p className="text-sm text-gray-500">{gym.nameEn}</p>
                        )}
                      </div>

                      <div className="mb-2 flex items-center">
                        <MapPin size={14} className="mr-1 text-gray-400" />
                        <span className="text-sm text-gray-600">{gym.location}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                          {gym.typeLabel}
                        </span>
                        {gym.rating > 0 && (
                          <span className="flex items-center gap-1 text-sm text-yellow-500">
                            <Star size={14} fill="currentColor" />
                            {gym.rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* 查看更多按鈕 */}
            {gyms.length > 0 && (
              <div className="mb-8 mt-6 flex justify-center">
                <button className="rounded-md border border-black px-8 py-2.5 text-sm font-medium text-black transition hover:bg-gray-50">
                  看更多
                </button>
              </div>
            )}

            {/* 無結果提示 */}
            {gyms.length === 0 && (
              <div className="py-12 text-center">
                <p className="mb-4 text-lg text-gray-500">沒有找到符合條件的攀岩館</p>
                <button
                  className="border-b border-gray-900 pb-1 text-gray-900 transition-colors hover:border-gray-700 hover:text-gray-700"
                  onClick={() => {
                    setSelectedRegion('所有地區')
                    setSelectedType('所有類型')
                  }}
                >
                  清除篩選條件
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <BackToTop />
    </main>
  )
}
