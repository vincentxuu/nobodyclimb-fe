'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Edit2, Trash2, Eye, Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import ProfilePageLayout from '@/components/profile/layout/ProfilePageLayout'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { postService } from '@/lib/api/services'
import { useToast } from '@/components/ui/use-toast'

// 文章類型定義
interface Article {
  id: string
  title: string
  excerpt: string
  cover_image: string | null
  created_at: string
  status: 'draft' | 'published' | 'archived'
  view_count: number
  tags?: string[]
}

// 頁面標題元件
interface PageHeaderProps {
  title: string
  actionButton?: React.ReactNode
}

const PageHeader = ({ title, actionButton }: PageHeaderProps) => (
  <div className="mb-8 flex items-center justify-between">
    <h1 className="text-2xl font-medium text-[#1B1A1A] md:text-4xl">{title}</h1>
    {actionButton}
  </div>
)

// 文章卡片元件
interface ArticleCardProps {
  article: Article
  // eslint-disable-next-line no-unused-vars
  onDelete: (_id: string) => void
  isDeleting: boolean
}

const ArticleCard = ({ article, onDelete, isDeleting }: ArticleCardProps) => {
  const statusLabel = {
    draft: '草稿',
    published: '已發布',
    archived: '已封存',
  }

  const statusColor = {
    draft: 'bg-yellow-100 text-yellow-800',
    published: 'bg-green-100 text-green-800',
    archived: 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="rounded-sm border border-[#DBD8D8] p-4 md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:gap-6">
        {/* 封面圖片區域 */}
        <div className="relative h-[160px] w-full flex-shrink-0 overflow-hidden bg-gray-100 md:h-[120px] md:w-[200px]">
          {article.cover_image ? (
            <Image
              src={article.cover_image}
              alt={article.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              無封面圖
            </div>
          )}
        </div>

        {/* 文章內容區域 */}
        <div className="flex flex-1 flex-col">
          {/* 狀態和日期 */}
          <div className="mb-1 flex items-center justify-between md:mb-1">
            <div className="flex items-center gap-2">
              <span
                className={`rounded px-2 py-0.5 text-xs ${statusColor[article.status]}`}
              >
                {statusLabel[article.status]}
              </span>
              {article.tags && article.tags.length > 0 && (
                <span className="text-xs text-[#6D6C6C] md:text-sm">{article.tags[0]}</span>
              )}
            </div>
            <span className="text-xs text-[#6D6C6C] md:text-sm">
              {new Date(article.created_at).toLocaleDateString('zh-TW')}
            </span>
          </div>

          {/* 標題 */}
          <h2 className="mb-2 line-clamp-2 text-lg font-medium md:line-clamp-1 md:text-xl">
            {article.title}
          </h2>

          {/* 摘要 */}
          <p className="mb-3 line-clamp-2 text-sm text-[#3F3D3D] md:flex-1 md:text-base">
            {article.excerpt || '無摘要'}
          </p>

          {/* 統計和操作按鈕 */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-0">
            <div className="flex items-center text-xs text-[#8E8C8C] md:text-sm">
              <Eye size={14} className="mr-1" />
              {article.view_count} 次瀏覽
            </div>
            <div className="flex gap-2">
              <Link href={`/blog/edit/${article.id}`} className="flex-1 md:flex-none">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-[#B6B3B3] text-[#3F3D3D] hover:bg-[#F5F5F5] md:w-auto"
                >
                  <Edit2 size={14} className="mr-1" />
                  編輯
                </Button>
              </Link>
              <Link href={`/blog/${article.id}`} className="flex-1 md:flex-none">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-[#B6B3B3] text-[#3F3D3D] hover:bg-[#F5F5F5] md:w-auto"
                >
                  查看
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(article.id)}
                disabled={isDeleting}
                className="flex-1 border-red-300 text-red-600 hover:bg-red-50 md:flex-none"
              >
                <Trash2 size={14} className="mr-1" />
                刪除
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 空狀態元件
const EmptyState = () => (
  <div className="py-12 text-center">
    <p className="mb-4 text-[#6D6C6C]">你還沒有發表任何文章</p>
    <Link href="/blog/create">
      <Button className="bg-[#1B1A1A] text-white hover:bg-[#3F3D3D]">開始撰寫第一篇文章</Button>
    </Link>
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

// 新增文章按鈕元件
const NewArticleButton = () => (
  <Link href="/blog/create">
    <Button className="flex items-center gap-2 bg-[#1B1A1A] text-white hover:bg-[#3F3D3D]">
      <Edit2 size={18} />
      發表文章
    </Button>
  </Link>
)

export default function ArticlesPage() {
  const { toast } = useToast()
  const [articles, setArticles] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [articleToDelete, setArticleToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // 獲取用戶文章列表
  const fetchArticles = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await postService.getMyPosts(1, 50)
      if (response.success && response.data) {
        // 後端直接返回文章數組
        setArticles(response.data as unknown as Article[])
      }
    } catch (err) {
      console.error('Failed to fetch articles:', err)
      setError('無法載入文章列表，請稍後再試')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  // 處理刪除確認
  const handleDeleteClick = (id: string) => {
    setArticleToDelete(id)
    setDeleteDialogOpen(true)
  }

  // 執行刪除
  const handleDeleteConfirm = async () => {
    if (!articleToDelete) return

    setIsDeleting(true)
    try {
      await postService.deletePost(articleToDelete)
      setArticles((prev) => prev.filter((a) => a.id !== articleToDelete))
      toast({
        title: '刪除成功',
        description: '文章已成功刪除',
      })
    } catch (err) {
      console.error('Failed to delete article:', err)
      toast({
        title: '刪除失敗',
        description: '無法刪除文章，請稍後再試',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setArticleToDelete(null)
    }
  }

  // 關閉刪除對話框
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setArticleToDelete(null)
  }

  return (
    <ProfilePageLayout>
      <div className="rounded-sm bg-white p-4 md:p-8 lg:p-12">
        <PageHeader title="我的文章" actionButton={<NewArticleButton />} />

        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchArticles} />
        ) : articles.length > 0 ? (
          <div className="space-y-4 md:space-y-6">
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                onDelete={handleDeleteClick}
                isDeleting={isDeleting && articleToDelete === article.id}
              />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>

      {/* 刪除確認對話框 */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="刪除文章"
        message="確定要刪除這篇文章嗎？此操作無法復原。"
        confirmText="刪除"
        cancelText="取消"
        isLoading={isDeleting}
        variant="danger"
      />
    </ProfilePageLayout>
  )
}
