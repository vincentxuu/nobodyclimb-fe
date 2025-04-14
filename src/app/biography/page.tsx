'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Breadcrumb } from '@/components/ui/breadcrumb'

// 匯入頁面組件
import { BiographyHeader } from '@/components/biography/biography-header'
import { BiographyList } from '@/components/biography/biography-list'

export default function BiographyPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-[#f5f5f5]"
    >
      <BiographyHeader />

      <div className="container mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Breadcrumb
            items={[
              { label: '首頁', href: '/' },
              { label: '人物誌' }
            ]}
          />
        </div>

        <div className="mb-16 max-w-md mx-auto">
          <div className="absolute left-5 -translate-y-1/2">
            <input
              type="text"
              placeholder="搜尋人物關鍵字..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-[240px] h-[40px] px-4 py-3 border border-[#1B1A1A] bg-white rounded-[4px] text-sm font-light placeholder:text-[#6D6C6C] focus:outline-none focus:ring-2 focus:ring-[#1B1A1A] focus:border-transparent"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <Search
                className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#1B1A1A] stroke-[1.5px] pointer-events-none"
              />
            </div>
          </div>
        </div>

        <BiographyList searchTerm={searchTerm} />

        <div className="flex justify-center mt-10 mb-16">
          <Button
            variant="outline"
            className="h-11 border border-[#1B1A1A] text-[#1B1A1A] px-8 hover:bg-[#dbd8d8] hover:text-[#1B1A1A]"
          >
            看更多
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
