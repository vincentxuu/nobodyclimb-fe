'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'
import { Bookmark } from 'lucide-react'
import ProfilePageLayout from '@/components/profile/layout/ProfilePageLayout'
import { useIsMobile } from '@/lib/hooks/useIsMobile'
import { useToast } from '@/components/ui/use-toast'

// 暫時性的假資料
const bookmarksMock = [
  {
    id: 101,
    title: '2024年世界盃攀岩賽事回顧',
    excerpt: '回顧今年世界盃攀岩賽事的精彩瞬間和最佳選手表現...',
    coverImage: '/api/placeholder/400/250',
    createdAt: '2024-02-28',
    author: '小岩',
    category: '賽事報導',
    bookmarkedAt: '2024-03-02',
  },
  {
    id: 102,
    title: '進階攀岩技巧：如何提升你的攀爬效率',
    excerpt: '分享一些進階攀岩技巧，幫助你提升攀爬效率和改善體能...',
    coverImage: '/api/placeholder/400/250',
    createdAt: '2024-01-15',
    author: '攀岩專家',
    category: '技術指導',
    bookmarkedAt: '2024-01-16',
  },
  {
    id: 103,
    title: '攀岩與心理健康：如何透過攀岩減輕壓力',
    excerpt: '探討攀岩如何幫助減輕壓力、增強專注力，以及改善整體心理健康...',
    coverImage: '/api/placeholder/400/250',
    createdAt: '2023-12-05',
    author: '健康攀岩',
    category: '健康專欄',
    bookmarkedAt: '2023-12-10',
  },
  {
    id: 104,
    title: '攀岩訓練計劃：從初學者到中級攀岩者',
    excerpt: '一套完整的攀岩訓練計劃，幫助初學者逐步提升到中級水平...',
    coverImage: '/api/placeholder/400/250',
    createdAt: '2024-01-05',
    author: '訓練達人',
    category: '訓練計劃',
    bookmarkedAt: '2024-01-08',
  },
]

// 頁面標題元件
interface PageHeaderProps {
  title: string
  isMobile?: boolean
}

const PageHeader = ({ title, isMobile }: PageHeaderProps) => (
  <div className="mb-8 flex items-center justify-between">
    <h1 className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-medium text-[#1B1A1A]`}>{title}</h1>
  </div>
)

// 收藏文章卡片元件
interface BookmarkCardProps {
  article: {
    id: number
    title: string
    excerpt: string
    coverImage: string
    createdAt: string
    author: string
    category: string
    bookmarkedAt: string
  }
  onRemoveBookmark: (id: number) => void
}

const BookmarkCard = ({ article, onRemoveBookmark }: BookmarkCardProps) => (
  <div className="rounded-sm border border-[#DBD8D8] p-5">
    <div className="flex gap-6">
      <div className="relative h-[120px] w-[200px]">
        <Image src={article.coverImage} alt={article.title} fill className="object-cover" />
      </div>
      <div className="flex-1">
        <div className="mb-1 flex justify-between">
          <span className="text-sm text-[#6D6C6C]">
            {article.category} | 作者：{article.author}
          </span>
          <span className="text-sm text-[#6D6C6C]">發布於 {article.createdAt}</span>
        </div>
        <h2 className="mb-2 text-xl font-medium">{article.title}</h2>
        <p className="mb-3 line-clamp-2 text-[#3F3D3D]">{article.excerpt}</p>
        <div className="flex justify-between">
          <span className="text-sm text-[#8E8C8C]">收藏於 {article.bookmarkedAt}</span>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex items-center gap-1 border-[#B6B3B3] text-[#3F3D3D] hover:bg-[#F5F5F5]"
              onClick={() => onRemoveBookmark(article.id)}
            >
              <Bookmark size={16} />
              移除收藏
            </Button>
            <Link href={`/blog/${article.id}`}>
              <Button
                variant="outline"
                className="border-[#B6B3B3] text-[#3F3D3D] hover:bg-[#F5F5F5]"
              >
                閱讀文章
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  </div>
)

// 空狀態元件
const EmptyState = () => (
  <div className="py-12 text-center">
    <p className="mb-4 text-[#6D6C6C]">你還沒有收藏任何文章</p>
    <Link href="/blog">
      <Button className="bg-[#1B1A1A] text-white hover:bg-[#3F3D3D]">瀏覽文章專區</Button>
    </Link>
  </div>
)

export default function BookmarksPage() {
  const isMobile = useIsMobile()
  const { toast } = useToast()

  // 處理移除收藏
  const handleRemoveBookmark = (id: number) => {
    console.log(`移除收藏: ${id}`)
    // 在實際應用中，這裡會發送API請求來移除收藏
    toast({
      title: '已移除收藏',
      description: '文章已從收藏列表中移除',
    })
  }

  return (
    <ProfilePageLayout>
      <div className={`bg-white ${isMobile ? 'p-4 md:p-6' : 'p-8 md:p-12'} rounded-sm`}>
        <PageHeader title="收藏文章" isMobile={isMobile} />

        {bookmarksMock.length > 0 ? (
          <div className="space-y-6">
            {bookmarksMock.map((article) => (
              <BookmarkCard
                key={article.id}
                article={article}
                onRemoveBookmark={handleRemoveBookmark}
              />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </ProfilePageLayout>
  )
}
