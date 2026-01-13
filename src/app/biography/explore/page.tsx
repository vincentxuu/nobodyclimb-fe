'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { PageHeader } from '@/components/ui/page-header'
import { SearchInput } from '@/components/ui/search-input'
import { TrendingGoals } from '@/components/biography/explore/trending-goals'
import { RecentCompletedStories } from '@/components/biography/explore/recent-completed-stories'
import { LocationExplorer } from '@/components/biography/explore/location-explorer'
import { CategoryExplorer } from '@/components/biography/explore/category-explorer'

type FilterTab = 'all' | 'growth' | 'experience' | 'recovery' | 'footprint'

const filterTabs: { value: FilterTab; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'growth', label: '成長故事' },
  { value: 'experience', label: '攀登經驗' },
  { value: 'recovery', label: '受傷復原' },
  { value: 'footprint', label: '攀岩足跡' },
]

export default function ExplorePage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')

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
      <PageHeader title="探索攀岩故事" subtitle="發現社群中精彩的攀岩目標與故事" />

      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Breadcrumb
            items={[
              { label: '首頁', href: '/' },
              { label: '人物誌', href: '/biography' },
              { label: '探索' },
            ]}
          />
        </div>

        {/* 搜尋與篩選 */}
        <div className="mb-8">
          <SearchInput
            value={searchTerm}
            onChange={handleSearch}
            placeholder="搜尋目標、地點或攀岩者..."
            className="mb-4"
          />

          {/* 篩選標籤 */}
          <div className="flex flex-wrap gap-2">
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveFilter(tab.value)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeFilter === tab.value
                    ? 'bg-[#1B1A1A] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 熱門目標排行 */}
        <section className="mb-12">
          <TrendingGoals searchTerm={searchTerm} filter={activeFilter} />
        </section>

        {/* 最新完成故事 */}
        <section className="mb-12">
          <RecentCompletedStories searchTerm={searchTerm} filter={activeFilter} />
        </section>

        {/* 依地點探索 */}
        <section className="mb-12">
          <LocationExplorer />
        </section>

        {/* 技巧與經驗分享 */}
        <section className="mb-12">
          <CategoryExplorer />
        </section>
      </div>
    </motion.div>
  )
}
