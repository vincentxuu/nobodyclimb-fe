'use client'

import React from 'react'
import PlaceholderImage from '@/components/ui/placeholder-image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { MapPin, Calendar, Clock } from 'lucide-react'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { PageHeader } from '@/components/ui/page-header'
import BackToTop from '@/components/ui/back-to-top'
import { getAllCrags } from '@/lib/crag-data'

// 從資料服務層讀取岩場資料
const crags = getAllCrags()

export default function CragListPage() {
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

        {/* 搜尋結果 */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-gray-600">
            找到 <span className="font-medium text-gray-900">{crags.length}</span> 個岩場
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
          {crags.map((crag) => (
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

        {/* 加載更多按鈕 */}
        {crags.length > 0 && (
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
