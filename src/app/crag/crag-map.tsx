'use client'

import { TaiwanMap } from '@/components/home'
import type { getAllCrags } from '@/lib/crag-data'

interface CragMapProps {
  crags: ReturnType<typeof getAllCrags>
}

export function CragMap({ crags }: CragMapProps) {
  return (
    <>
      {/* 手機版地圖 */}
      <div className="mb-6 rounded-xl bg-white p-4 shadow-sm lg:hidden lg:order-none order-first col-span-full">
        <p className="mb-3 text-center text-sm text-[#6D6C6C]">點擊地圖標記前往岩場</p>
        <div className="flex justify-center">
          <TaiwanMap crags={crags} clickable />
        </div>
      </div>

      {/* 桌面版固定地圖 */}
      <div className="hidden lg:block">
        <div className="sticky top-24 rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-center font-medium text-[#1B1A1A]">點擊地圖前往岩場</h3>
          <div className="flex justify-center">
            <TaiwanMap crags={crags} clickable />
          </div>
        </div>
      </div>
    </>
  )
}
