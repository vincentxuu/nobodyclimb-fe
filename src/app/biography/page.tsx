'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { PageHeader } from '@/components/ui/page-header'

// 匯入頁面組件
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
      <PageHeader title="人物誌" subtitle="記載了 Nobody 們的攀岩小故事" />

      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Breadcrumb items={[{ label: '首頁', href: '/' }, { label: '人物誌' }]} />
        </div>

        <div className="mb-16 flex justify-center px-4 md:px-0">
          <Input
            type="text"
            placeholder="搜尋人物關鍵字..."
            value={searchTerm}
            onChange={handleSearch}
            rightIcon={<Search className="h-5 w-5 stroke-[1.5px] text-[#1B1A1A]" />}
            wrapperClassName="w-full max-w-[240px]"
            className="h-[40px] rounded-[4px] border-[#1B1A1A] bg-white font-light text-[#1B1A1A] placeholder:text-[#6D6C6C] focus:ring-2 focus:ring-[#1B1A1A]"
          />
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
