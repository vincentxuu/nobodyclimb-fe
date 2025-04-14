'use client'

import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * 桌面版搜尋框組件
 * 只在桌面版且搜尋框處於打開狀態時顯示
 */
export default function DesktopSearchBar() {
  const router = useRouter()
  const { 
    isSearchOpen, 
    closeSearch,
    searchQuery,
    setSearchQuery 
  } = useUIStore()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      closeSearch()
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  if (!isSearchOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, width: 0 }}
        animate={{ opacity: 1, width: 'auto' }}
        exit={{ opacity: 0, width: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute right-16 top-1/2 -translate-y-1/2 z-10 hidden lg:block"
      >
        <form 
          onSubmit={handleSearch}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="請輸入關鍵字"
            className="w-[240px] h-[40px] px-4 py-3 bg-[#F5F5F5] rounded-[4px] text-base font-normal font-['Noto_Sans_CJK_TC'] leading-6 tracking-[0.01em] placeholder:text-[#B6B3B3] focus:outline-none"
            autoFocus
          />
          <button 
            type="button" 
            onClick={closeSearch} 
            className="absolute right-10 top-1/2 transform -translate-y-1/2 text-[#8E8C8C] hover:text-[#3F3D3D]"
          >
            <X className="h-4 w-4" />
          </button>
          <button 
            type="submit" 
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#1B1A1A]"
          >
            <Search className="h-5 w-5 stroke-[1.5px]"/>
          </button>
        </form>
      </motion.div>
    </AnimatePresence>
  )
}
