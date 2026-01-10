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
          <Breadcrumb items={[{ label: '首頁', href: '/' }, { label: '人物誌' }]} />
        </div>

        <div className="mb-16">
          <div className="relative mx-auto w-[240px]">
            <Input
              type="text"
              placeholder="搜尋人物關鍵字..."
              value={searchTerm}
              onChange={handleSearch}
              className="h-[40px] w-full rounded-[4px] border border-[#1B1A1A] bg-white text-sm font-light placeholder:text-[#6D6C6C] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1B1A1A]"
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <Search className="h-5 w-5 stroke-[1.5px] text-[#1B1A1A]" />
            </div>
          </div>
        </div>

        <BiographyList searchTerm={searchTerm} />

        <div className="mb-16 mt-10 flex justify-center">
          <Button
            variant="outline"
            className="h-11 border border-[#1B1A1A] px-8 text-[#1B1A1A] hover:bg-[#dbd8d8] hover:text-[#1B1A1A]"
          >
            看更多
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
