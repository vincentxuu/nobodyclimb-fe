'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'
import { Bookmark, Loader2 } from 'lucide-react'
import ProfilePageLayout from '@/components/profile/layout/ProfilePageLayout'
import { useIsMobile } from '@/lib/hooks/useIsMobile'
import { useToast } from '@/components/ui/use-toast'
import { userService, postService } from '@/lib/api/services'
import { BackendPost } from '@/lib/types'

const ITEMS_PER_PAGE = 10

// 頁面標題元件
interface PageHeaderProps {
  title: string
  totalCount?: number
  isMobile?: boolean
}

const PageHeader = ({ title, totalCount, isMobile }: PageHeaderProps) => (
  <div className="mb-8 flex items-center justify-between">
    <h1 className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-medium text-[#1B1A1A]`}>
      {title}
      {totalCount !== undefined && totalCount > 0 && (
        <span className="ml-2 text-lg font-normal text-[#6D6C6C]">({totalCount})</span>
      )}
    </h1>
  </div>
)

// 載入狀態元件
const LoadingState = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="h-8 w-8 animate-spin text-[#6D6C6C]" />
    <span className="ml-2 text-[#6D6C6C]">載入中...</span>
  </div>
)

// 錯誤狀態元件
const ErrorState = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="py-12 text-center">
    <p className="mb-4 text-red-600">{message}</p>
    <Button onClick={onRetry} className="bg-[#1B1A1A] text-white hover:bg-[#3F3D3D]">
      重試
    </Button>
  </div>
)

// 收藏文章卡片元件
interface BookmarkCardProps {
  article: BackendPost
  onRemoveBookmark: (id: string) => void
  isRemoving: boolean
  isMobile?: boolean
}

const BookmarkCard = ({ article, onRemoveBookmark, isRemoving, isMobile }: BookmarkCardProps) => {
  // 格式化日期
  const formattedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date(article.created_at).toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })

  // 獲取分類（使用第一個 tag）
  const category = article.tags?.[0] || '未分類'

  // 獲取作者名稱
  const authorName = article.display_name || article.username || '匿名'

  if (isMobile) {
    return (
      <div className="rounded-sm border border-[#DBD8D8] p-4">
        {article.cover_image && (
          <div className="relative mb-3 h-[160px] w-full">
            <Image
              src={article.cover_image}
              alt={article.title}
              fill
              className="rounded-sm object-cover"
            />
          </div>
        )}
        <div className="mb-1 text-sm text-[#6D6C6C]">
          {category} | 作者：{authorName}
        </div>
        <h2 className="mb-2 text-lg font-medium">{article.title}</h2>
        <p className="mb-3 line-clamp-2 text-sm text-[#3F3D3D]">
          {article.excerpt || article.content?.slice(0, 100)}
        </p>
        <div className="mb-3 text-xs text-[#8E8C8C]">發布於 {formattedDate}</div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex flex-1 items-center justify-center gap-1 border-[#B6B3B3] text-[#3F3D3D] hover:bg-[#F5F5F5]"
            onClick={() => onRemoveBookmark(article.id)}
            disabled={isRemoving}
          >
            {isRemoving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Bookmark size={14} />
            )}
            移除收藏
          </Button>
          <Link href={`/blog/${article.id}`} className="flex-1">
            <Button
              variant="outline"
              size="sm"
              className="w-full border-[#B6B3B3] text-[#3F3D3D] hover:bg-[#F5F5F5]"
            >
              閱讀文章
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-sm border border-[#DBD8D8] p-5">
      <div className="flex gap-6">
        <div className="relative h-[120px] w-[200px] flex-shrink-0">
          {article.cover_image ? (
            <Image
              src={article.cover_image}
              alt={article.title}
              fill
              className="rounded-sm object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-sm bg-gray-100">
              <span className="text-sm text-gray-400">無封面圖片</span>
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="mb-1 flex justify-between">
            <span className="text-sm text-[#6D6C6C]">
              {category} | 作者：{authorName}
            </span>
            <span className="text-sm text-[#6D6C6C]">發布於 {formattedDate}</span>
          </div>
          <h2 className="mb-2 text-xl font-medium">{article.title}</h2>
          <p className="mb-3 line-clamp-2 text-[#3F3D3D]">
            {article.excerpt || article.content?.slice(0, 150)}
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              className="flex items-center gap-1 border-[#B6B3B3] text-[#3F3D3D] hover:bg-[#F5F5F5]"
              onClick={() => onRemoveBookmark(article.id)}
              disabled={isRemoving}
            >
              {isRemoving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Bookmark size={16} />
              )}
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
  )
}

// 空狀態元件
const EmptyState = () => (
  <div className="py-12 text-center">
    <Bookmark size={48} className="mx-auto mb-4 text-[#B6B3B3]" />
    <p className="mb-4 text-[#6D6C6C]">你還沒有收藏任何文章</p>
    <Link href="/blog">
      <Button className="bg-[#1B1A1A] text-white hover:bg-[#3F3D3D]">瀏覽文章專區</Button>
    </Link>
  </div>
)

// 載入更多按鈕元件
interface LoadMoreButtonProps {
  onClick: () => void
  isLoading: boolean
  currentCount: number
  totalCount: number
}

const LoadMoreButton = ({ onClick, isLoading, currentCount, totalCount }: LoadMoreButtonProps) => (
  <div className="mt-8 flex flex-col items-center gap-2">
    <p className="text-sm text-[#6D6C6C]">
      已顯示 {currentCount} / {totalCount} 篇文章
    </p>
    <Button
      variant="outline"
      onClick={onClick}
      disabled={isLoading}
      className="min-w-[160px] border-[#B6B3B3] text-[#3F3D3D] hover:bg-[#F5F5F5]"
    >
      {isLoading ? (
        <>
          <Loader2 size={16} className="mr-2 animate-spin" />
          載入中...
        </>
      ) : (
        '載入更多'
      )}
    </Button>
  </div>
)

export default function BookmarksPage() {
  const isMobile = useIsMobile()
  const { toast } = useToast()

  const [bookmarks, setBookmarks] = useState<BackendPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set())

  // 分頁狀態
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  // 獲取收藏文章
  const fetchBookmarks = useCallback(async (pageNum: number, append = false) => {
    if (append) {
      setIsLoadingMore(true)
    } else {
      setIsLoading(true)
    }
    setError(null)

    try {
      const response = await userService.getUserLikedPosts(pageNum, ITEMS_PER_PAGE)
      if (response.success && response.data) {
        const { data: posts, pagination } = response.data

        if (append) {
          setBookmarks((prev) => [...prev, ...(posts || [])])
        } else {
          setBookmarks(posts || [])
        }

        setTotalCount(pagination?.total || 0)
        setHasMore(pageNum < (pagination?.total_pages || 1))
        setPage(pageNum)
      } else {
        setError('無法載入收藏文章')
      }
    } catch (err) {
      console.error('Failed to fetch bookmarks:', err)
      setError('無法載入收藏文章，請稍後再試')
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [])

  // 初始載入
  useEffect(() => {
    fetchBookmarks(1)
  }, [fetchBookmarks])

  // 載入更多
  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchBookmarks(page + 1, true)
    }
  }

  // 重試（重新載入第一頁）
  const handleRetry = () => {
    setPage(1)
    setBookmarks([])
    fetchBookmarks(1)
  }

  // 處理移除收藏
  const handleRemoveBookmark = async (id: string) => {
    setRemovingIds((prev) => new Set(prev).add(id))
    try {
      const response = await postService.toggleLike(id)
      if (response.success) {
        // 從列表中移除並更新總數
        setBookmarks((prev) => prev.filter((article) => article.id !== id))
        setTotalCount((prev) => Math.max(0, prev - 1))
        toast({
          title: '已移除收藏',
          description: '文章已從收藏列表中移除',
        })
      } else {
        toast({
          title: '操作失敗',
          description: '無法移除收藏，請稍後再試',
          variant: 'destructive',
        })
      }
    } catch (err) {
      console.error('Failed to remove bookmark:', err)
      toast({
        title: '操作失敗',
        description: '無法移除收藏，請稍後再試',
        variant: 'destructive',
      })
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  return (
    <ProfilePageLayout>
      <div className={`bg-white ${isMobile ? 'p-4 md:p-6' : 'p-8 md:p-12'} rounded-sm`}>
        <PageHeader title="收藏文章" totalCount={totalCount} isMobile={isMobile} />

        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={handleRetry} />
        ) : bookmarks.length > 0 ? (
          <>
            <div className="space-y-6">
              {bookmarks.map((article) => (
                <BookmarkCard
                  key={article.id}
                  article={article}
                  onRemoveBookmark={handleRemoveBookmark}
                  isRemoving={removingIds.has(article.id)}
                  isMobile={isMobile}
                />
              ))}
            </div>
            {hasMore && (
              <LoadMoreButton
                onClick={handleLoadMore}
                isLoading={isLoadingMore}
                currentCount={bookmarks.length}
                totalCount={totalCount}
              />
            )}
          </>
        ) : (
          <EmptyState />
        )}
      </div>
    </ProfilePageLayout>
  )
}
