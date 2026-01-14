'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { PageHeader } from '@/components/ui/page-header'
import { SearchInput } from '@/components/ui/search-input'

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
      className="min-h-screen bg-page-content-bg"
    >
      <PageHeader title="人物誌" subtitle="記載了 Nobody 們的攀岩小故事" />

      <div className="container mx-auto px-4 py-4 md:py-6">
        {/* Breadcrumb - 手機版隱藏 */}
        <div className="mb-4 md:mb-8">
          <Breadcrumb items={[{ label: '首頁', href: '/' }, { label: '人物誌' }]} hideOnMobile />
        </div>

        <SearchInput
          value={searchTerm}
          onChange={handleSearch}
          placeholder="搜尋人物關鍵字..."
          className="mb-6 md:mb-16"
        />

        <BiographyList searchTerm={searchTerm} />

        <div className="mb-10 mt-6 flex justify-center md:mb-16 md:mt-10">
          <Button
            variant="outline"
            className="h-10 border border-[#1B1A1A] px-6 text-[#1B1A1A] hover:bg-[#dbd8d8] hover:text-[#1B1A1A] md:h-11 md:px-8"
          >
            看更多
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
