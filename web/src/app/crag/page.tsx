'use client'

import React from 'react'
import Link from 'next/link'
import { MapPin, Calendar, MountainSnow } from 'lucide-react'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { PageHeader } from '@/components/ui/page-header'
import BackToTop from '@/components/ui/back-to-top'
import { CragCoverGenerator } from '@/components/shared/CragCoverGenerator'
import { getAllCrags } from '@/lib/crag-data'
import { CragMap } from './crag-map'

// 岩場卡片組件（使用 CSS 動畫替代 Framer Motion）
function CragCard({ crag }: { crag: ReturnType<typeof getAllCrags>[0] }) {
  return (
    <div className="group overflow-hidden rounded-lg bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/crag/${crag.id}`} className="block h-full">
        {/* 岩場封面 */}
        <div className="relative aspect-[4/1] overflow-hidden">
          <CragCoverGenerator
            rockType={crag.rockType}
            name={crag.name}
            showName={false}
            showTypeLabel={false}
            className="absolute inset-0"
          />
          <div className="absolute left-2 top-2 rounded bg-[#1B1A1A]/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
            {crag.type}
          </div>
        </div>

        <div className="p-3">
          <h3 className="mb-1.5 text-base font-medium text-[#1B1A1A] group-hover:text-[#3F3D3D]">
            {crag.name}
            <span className="ml-1.5 text-xs font-normal text-[#8E8C8C]">{crag.nameEn}</span>
          </h3>

          <div className="mb-2 flex items-center gap-1.5 text-xs text-[#6D6C6C]">
            <MapPin className="h-3.5 w-3.5" />
            <span>{crag.location}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1 text-[#6D6C6C]">
              <MountainSnow className="h-3.5 w-3.5" />
              <span>{crag.routes} 條路線</span>
            </div>
            <div className="text-[#8E8C8C]">{crag.difficulty}</div>
          </div>

          {/* 季節標籤 */}
          <div className="mt-2 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-[#8E8C8C]" />
            <div className="flex gap-1">
              {crag.seasons.map((season) => (
                <span
                  key={season}
                  className="rounded bg-[#F5F5F5] px-1.5 py-0.5 text-[10px] text-[#6D6C6C]"
                >
                  {season}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}

// Server Component - 直接在服務端讀取資料
export default function CragListPage() {
  const crags = getAllCrags()

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

        {/* 主要內容區 - 使用 grid 讓地圖在手機版顯示在最上面 */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
          {/* 地圖（客戶端組件）- 只渲染一次 TaiwanMap */}
          <CragMap crags={crags} />

          {/* 岩場列表 */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {crags.map((crag) => (
              <CragCard key={crag.id} crag={crag} />
            ))}
          </div>
        </div>
      </div>

      {/* 回到頂部按鈕 */}
      <BackToTop />
    </main>
  )
}
