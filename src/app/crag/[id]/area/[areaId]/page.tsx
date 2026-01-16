'use client'

import React, { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, MapPin, Mountain, Route as RouteIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import BackToTop from '@/components/ui/back-to-top'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { CragRouteSection } from '@/components/crag/route-section'
import { GradeDistributionChart } from '@/components/crag/grade-distribution-chart'
import PlaceholderImage from '@/components/ui/placeholder-image'
import { getAreaDetailData } from '@/lib/crag-data'

export default function AreaDetailPage({
  params,
}: {
  params: Promise<{ id: string; areaId: string }>
}) {
  const { id: cragId, areaId } = use(params)

  // 從資料服務層讀取區域資料
  const areaData = getAreaDetailData(cragId, areaId)

  if (!areaData) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 pt-20">
          <div className="rounded-lg bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-gray-800">找不到區域</h1>
            <p className="mt-2 text-gray-600">該區域不存在或已被移除</p>
            <Link href={`/crag/${cragId}`} prefetch={false}>
              <Button className="mt-4">返回岩場</Button>
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const { crag, area, routes, otherAreas, statistics } = areaData

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container relative mx-auto px-4 pt-20">
        {/* 麵包屑導航 */}
        <div className="mb-8">
          <Breadcrumb
            items={[
              { label: '首頁', href: '/' },
              { label: '岩場', href: '/crag' },
              { label: crag.name, href: `/crag/${crag.id}` },
              { label: area.name },
            ]}
          />
        </div>

        {/* 返回按鈕 */}
        <div className="sticky left-0 top-0 z-30 mb-4 w-full bg-gray-50 py-3">
          <motion.div
            className="w-fit"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Link href={`/crag/${crag.id}`} prefetch={false}>
              <Button
                variant="ghost"
                className="flex items-center gap-2 bg-white shadow-sm hover:bg-gray-200"
              >
                <ArrowLeft size={16} />
                <span>返回 {crag.name}</span>
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* 主要內容區 */}
        <div className="mb-12 mt-4 rounded-lg bg-white p-8 shadow-sm">
          {/* 區域標題圖片 */}
          <div className="mb-8">
            <div className="relative h-64 w-full overflow-hidden rounded-lg md:h-80">
              <PlaceholderImage
                text={`${area.name} 區域`}
                bgColor="#2d3748"
                textColor="#fff"
              />
            </div>
          </div>

          {/* 區域標題與基本資訊 */}
          <div className="mb-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#1B1A1A]">{area.name}</h1>
                <p className="mt-1 text-lg text-gray-500">{area.nameEn}</p>
                <div className="mt-2 flex items-center text-gray-500">
                  <MapPin size={16} className="mr-1" />
                  <span>{crag.name}</span>
                </div>
              </div>

              {/* 快速統計 */}
              <div className="flex flex-wrap gap-4">
                <div className="rounded-lg bg-gray-50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <RouteIcon size={18} className="text-[#FFE70C]" />
                    <span className="text-sm text-gray-500">路線數量</span>
                  </div>
                  <p className="mt-1 text-xl font-bold">{statistics.totalRoutes}</p>
                </div>
                <div className="rounded-lg bg-gray-50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Mountain size={18} className="text-[#FFE70C]" />
                    <span className="text-sm text-gray-500">難度範圍</span>
                  </div>
                  <p className="mt-1 text-xl font-bold">{area.difficulty || 'N/A'}</p>
                </div>
                <div className="rounded-lg bg-gray-50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">總 Bolt 數</span>
                  </div>
                  <p className="mt-1 text-xl font-bold">{statistics.totalBolts}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 區域介紹 */}
          <div className="mb-8">
            <h2 className="mb-4 border-l-4 border-[#FFE70C] pl-4 text-xl font-bold">
              區域介紹
            </h2>
            <p className="leading-relaxed text-gray-700">
              {area.description || '暫無介紹'}
            </p>
            {area.descriptionEn && (
              <p className="mt-3 leading-relaxed text-gray-500">
                {area.descriptionEn}
              </p>
            )}
          </div>

          {/* 路線難度分佈 */}
          <div className="mb-8">
            <h2 className="mb-4 border-l-4 border-[#FFE70C] pl-4 text-xl font-bold">
              路線難度分佈
            </h2>
            <GradeDistributionChart
              gradeRanges={statistics.gradeRanges}
              totalRoutes={statistics.totalRoutes}
            />
          </div>

          {/* 路線類型分佈 */}
          {Object.keys(statistics.typeDistribution).length > 0 && (
            <div className="mb-8">
              <h2 className="mb-4 border-l-4 border-[#FFE70C] pl-4 text-xl font-bold">
                路線類型分佈
              </h2>
              <div className="flex flex-wrap gap-3">
                {Object.entries(statistics.typeDistribution).map(([type, count]) => (
                  <div
                    key={type}
                    className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2"
                  >
                    <span className="font-medium text-gray-700">{type}</span>
                    <span className="ml-2 text-gray-500">({count})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 路線列表 */}
          <div className="mt-10 border-t border-gray-200 pt-8">
            <CragRouteSection routes={routes} cragId={cragId} />
          </div>

          {/* 其他區域推薦 */}
          {otherAreas.length > 0 && (
            <div className="mt-10 border-t border-gray-200 pt-8">
              <h2 className="mb-6 border-l-4 border-[#FFE70C] pl-4 text-xl font-bold">
                {crag.name} 其他區域
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {otherAreas.slice(0, 3).map((otherArea) => (
                  <Link
                    key={otherArea.id}
                    href={`/crag/${crag.id}/area/${otherArea.id}`}
                    prefetch={false}
                    className="group overflow-hidden rounded-lg border border-gray-200 bg-white transition-all hover:border-[#FFE70C] hover:shadow-md"
                  >
                    <div className="relative h-32">
                      <PlaceholderImage text={otherArea.name} bgColor="#f8f9fa" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-gray-800 group-hover:text-[#1B1A1A]">
                        {otherArea.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {otherArea.difficulty} · {otherArea.routesCount} 條路線
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 回到頂部按鈕 */}
      <BackToTop />
    </main>
  )
}
