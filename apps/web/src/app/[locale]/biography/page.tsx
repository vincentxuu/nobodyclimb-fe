'use client'

import React, { useState, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { UserPlus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { PageHeader } from '@/components/ui/page-header'
import { SearchInput } from '@/components/ui/search-input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useAuthStore } from '@/store/authStore'

// 匯入頁面組件
import { BiographyList } from '@/components/biography/biography-list'
import { StoryList } from '@/components/biography/story-list'

type TabValue = 'stories' | 'people'

function BiographyPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { status } = useAuthStore()

  // 從 URL 讀取 tab 參數，預設為 'people'
  const tabParam = searchParams.get('tab')
  const currentTab: TabValue = tabParam === 'stories' ? 'stories' : 'people'

  const [searchTerm, setSearchTerm] = useState('')
  const [hasMore, setHasMore] = useState(false)
  const [loadMoreFn, setLoadMoreFn] = useState<(() => void) | null>(null)

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleTabChange = (value: string) => {
    // 更新 URL 參數
    const newTab = value as TabValue
    const url = newTab === 'people' ? '/biography' : `/biography?tab=${newTab}`
    router.push(url, { scroll: false })
  }

  const handleTotalChange = useCallback((_total: number, hasMoreData: boolean) => {
    setHasMore(hasMoreData)
  }, [])

  const handleLoadMoreChange = useCallback((loadMore: () => void) => {
    setLoadMoreFn(() => loadMore)
  }, [])

  const handleLoadMore = () => {
    if (loadMoreFn) {
      loadMoreFn()
    }
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

        {/* 訪客引導 Banner - 僅未登入時顯示 */}
        {status !== 'signIn' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex flex-col items-center justify-between gap-3 rounded-lg border border-brand-gray bg-white p-4 shadow-sm sm:flex-row md:mb-8"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gray-light">
                <UserPlus size={20} className="text-brand-dark" />
              </div>
              <p className="text-sm text-brand-dark md:text-base">
                你也是攀岩人嗎？註冊建立你的人物誌，讓大家認識你！
              </p>
            </div>
            <Link href="/auth/register">
              <Button className="h-9 whitespace-nowrap bg-brand-accent/70 px-6 text-sm text-brand-dark hover:bg-brand-accent">
                立即加入
              </Button>
            </Link>
          </motion.div>
        )}

        {/* Tabs */}
        <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 md:mb-8">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="stories" className="flex-1 sm:flex-none px-6">
                小故事
              </TabsTrigger>
              <TabsTrigger value="people" className="flex-1 sm:flex-none px-6">
                小人物
              </TabsTrigger>
            </TabsList>

            <SearchInput
              value={searchTerm}
              onChange={handleSearch}
              placeholder={currentTab === 'stories' ? '搜尋故事關鍵字...' : '搜尋人物關鍵字...'}
              className="w-full sm:w-72"
            />
          </div>

          {/* 小故事 Tab */}
          <TabsContent value="stories">
            <StoryList searchTerm={searchTerm} />
          </TabsContent>

          {/* 小人物 Tab */}
          <TabsContent value="people">
            <BiographyList
              searchTerm={searchTerm}
              onTotalChange={handleTotalChange}
              onLoadMoreChange={handleLoadMoreChange}
            />

            {hasMore && (
              <div className="mb-10 mt-6 flex justify-center md:mb-16 md:mt-10">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  className="h-10 border border-brand-dark px-6 text-brand-dark hover:bg-brand-light hover:text-brand-dark md:h-11 md:px-8"
                >
                  看更多
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  )
}

export default function BiographyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-page-content-bg flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#1B1A1A]" />
        </div>
      }
    >
      <BiographyPageContent />
    </Suspense>
  )
}
