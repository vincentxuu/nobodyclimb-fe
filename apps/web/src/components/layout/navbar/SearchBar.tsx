'use client'

import { Search } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'

/**
 * 搜尋按鈕組件
 * 只在桌面版顯示，點擊後打開搜尋框
 */
export default function SearchBar() {
  const { toggleSearch } = useUIStore()

  return (
    <div className="relative px-4">
      <button
        onClick={toggleSearch}
        aria-label="搜尋"
        className="text-[#1B1A1A] transition-colors duration-200 hover:text-[#8E8C8C]"
      >
        <Search className="h-5 w-5 stroke-[1.5px]" />
      </button>
    </div>
  )
}
