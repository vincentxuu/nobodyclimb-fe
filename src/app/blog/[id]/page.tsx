'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Chip } from '@/components/ui/chip'
import { Button } from '@/components/ui/button'
import { Mountain, Eye, Loader2, Share2, Bookmark } from 'lucide-react'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { CommentSection } from '@/components/blog/CommentSection'
import { postService } from '@/lib/api/services'
import { useToast } from '@/components/ui/use-toast'
import { BackendPost } from '@/lib/types'
import { useAuthStore } from '@/store/authStore'
import { sanitizeHtml } from '@/lib/utils/sanitize'

// 載入狀態元件
const LoadingState = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#F5F5F5]">
    <Loader2 className="h-8 w-8 animate-spin text-[#6D6C6C]" />
    <span className="ml-2 text-[#6D6C6C]">載入中...</span>
  </div>
)

// 錯誤狀態元件
const ErrorState = ({ message }: { message: string }) => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F5F5]">
    <p className="mb-4 text-lg text-red-600">{message}</p>
    <Link href="/blog">
      <Button className="bg-brand-dark text-white hover:bg-brand-dark-hover">返回文章列表</Button>
    </Link>
  </div>
)

export default function BlogDetail() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const id = params.id as string
  const { isAuthenticated } = useAuthStore()

  const [article, setArticle] = useState<BackendPost | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // 按讚狀態
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [isLiking, setIsLiking] = useState(false)
  // 收藏狀態
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [bookmarkCount, setBookmarkCount] = useState(0)
  const [isBookmarking, setIsBookmarking] = useState(false)
  const [popularArticles, setPopularArticles] = useState<BackendPost[]>([])
  const [relatedArticles, setRelatedArticles] = useState<BackendPost[]>([])

  // 獲取文章詳情
  const fetchArticle = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await postService.getPostById(id)
      if (response.success && response.data) {
        setArticle(response.data)
      } else {
        setError('找不到文章')
      }
    } catch (err) {
      console.error('Failed to fetch article:', err)
      setError('無法載入文章')
    } finally {
      setIsLoading(false)
    }
  }, [id])

  // 獲取按讚狀態
  const fetchLikeStatus = useCallback(async () => {
    try {
      const response = await postService.getLikeStatus(id)
      if (response.success && response.data) {
        setIsLiked(response.data.liked)
        setLikeCount(response.data.likes)
      }
    } catch (err) {
      console.error('Failed to fetch like status:', err)
    }
  }, [id])

  // 獲取收藏狀態
  const fetchBookmarkStatus = useCallback(async () => {
    try {
      const response = await postService.getBookmarkStatus(id)
      if (response.success && response.data) {
        setIsBookmarked(response.data.bookmarked)
        setBookmarkCount(response.data.bookmarks)
      }
    } catch (err) {
      console.error('Failed to fetch bookmark status:', err)
    }
  }, [id])

  // 獲取熱門文章
  const fetchPopularArticles = useCallback(async () => {
    try {
      const response = await postService.getPopularPosts(4)
      if (response.success && response.data) {
        setPopularArticles(response.data)
      }
    } catch (err) {
      console.error('Failed to fetch popular articles:', err)
    }
  }, [])

  // 獲取相關文章
  const fetchRelatedArticles = useCallback(async () => {
    try {
      const response = await postService.getRelatedPosts(id, 3)
      if (response.success && response.data) {
        setRelatedArticles(response.data)
      }
    } catch (err) {
      console.error('Failed to fetch related articles:', err)
    }
  }, [id])

  useEffect(() => {
    fetchArticle()
    fetchLikeStatus()
    fetchBookmarkStatus()
    fetchPopularArticles()
    fetchRelatedArticles()
  }, [fetchArticle, fetchLikeStatus, fetchBookmarkStatus, fetchPopularArticles, fetchRelatedArticles])

  // 處理按讚
  const handleLike = async () => {
    if (isLiking) return
    setIsLiking(true)
    try {
      const response = await postService.toggleLike(id)
      if (response.success && response.data) {
        setIsLiked(response.data.liked)
        setLikeCount(response.data.likes)
        toast({
          title: response.data.liked ? '已按讚' : '已取消按讚',
        })
      }
    } catch (err) {
      console.error('Failed to toggle like:', err)
      // 本地切換狀態
      setIsLiked(!isLiked)
      setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1))
    } finally {
      setIsLiking(false)
    }
  }

  // 處理收藏
  const handleBookmark = async () => {
    if (isBookmarking) return

    setIsBookmarking(true)
    try {
      const response = await postService.toggleBookmark(id)
      if (response.success && response.data) {
        setIsBookmarked(response.data.bookmarked)
        setBookmarkCount(response.data.bookmarks)
        toast({
          title: response.data.bookmarked ? '已收藏' : '已取消收藏',
        })
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err)
      // 本地切換狀態
      setIsBookmarked(!isBookmarked)
      setBookmarkCount((prev) => (isBookmarked ? prev - 1 : prev + 1))
    } finally {
      setIsBookmarking(false)
    }
  }

  // 處理分享
  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: article?.title,
          url,
        })
      } catch (err) {
        // 用戶取消分享
      }
    } else {
      // 複製連結
      await navigator.clipboard.writeText(url)
      toast({
        title: '連結已複製',
        description: '文章連結已複製到剪貼簿',
      })
    }
  }

  if (isLoading) {
    return <LoadingState />
  }

  if (error || !article) {
    return <ErrorState message={error || '找不到文章'} />
  }

  // 使用從 API 獲取的相關文章
  const displayRelatedArticles = relatedArticles

  // 使用從 API 獲取的熱門文章
  const displayPopularArticles = popularArticles

  // 格式化日期
  const dateToFormat = article.published_at || article.created_at
  const formattedDate = dateToFormat
    ? new Date(dateToFormat).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    : ''

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <main className="mx-auto max-w-[1440px] px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Breadcrumb
            items={[
              { label: '首頁', href: '/' },
              { label: '部落格', href: '/blog' },
              { label: article.title },
            ]}
          />
        </div>

        {/* Content */}
        <div className="mb-16 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          <div className="rounded-lg bg-white p-8 lg:p-16">
            {/* Article Header */}
            <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row">
              <div className="flex-1">
                <h1 className="mb-3 text-2xl font-medium sm:text-3xl">{article.title}</h1>
                <div className="flex flex-wrap items-center gap-3">
                  {article.tags && article.tags.length > 0 && (
                    <Chip>{article.tags[0]}</Chip>
                  )}
                  <span className="text-sm text-gray-500">更新日期</span>
                  <span className="text-sm text-gray-500">{formattedDate}</span>
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    <Eye size={14} />
                    {article.view_count}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                {/* 按讚按鈕 */}
                <Button
                  variant="outline"
                  onClick={handleLike}
                  disabled={isLiking}
                  className={`${isLiked
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-600'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <Mountain
                    size={18}
                    className={`mr-1 ${isLiked ? 'fill-emerald-600' : ''}`}
                  />
                  {likeCount > 0 ? likeCount : '讚'}
                </Button>
                {/* 收藏按鈕 */}
                <Button
                  variant="outline"
                  onClick={handleBookmark}
                  disabled={isBookmarking}
                  className={`${isBookmarked
                    ? 'border-amber-300 bg-amber-50 text-amber-600'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <Bookmark
                    size={18}
                    className={`mr-1 ${isBookmarked ? 'fill-amber-600' : ''}`}
                  />
                  {bookmarkCount > 0 ? bookmarkCount : '收藏'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleShare}
                  className="border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  <Share2 size={18} className="mr-1" />
                </Button>
                <Button
                  onClick={() => router.push(`/blog/edit/${id}`)}
                  className="bg-brand-dark text-white hover:bg-brand-dark-hover"
                >
                  編輯文章
                </Button>
              </div>
            </div>

            {/* Main Image */}
            {article.cover_image && (
              <div className="relative mb-8 aspect-[16/9]">
                <Image
                  src={article.cover_image}
                  alt={article.title}
                  fill
                  className="rounded-lg object-cover"
                />
              </div>
            )}

            {/* Article Content */}
            <div className="space-y-6">
              {article.excerpt && (
                <section>
                  <p className="text-lg text-gray-600 italic">{article.excerpt}</p>
                </section>
              )}
              <section
                className="blog-content text-gray-800 [&>p]:mb-4 [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mb-4 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mb-3 [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:mb-2 [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:mb-4 [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:mb-4 [&>blockquote]:border-l-4 [&>blockquote]:border-gray-300 [&>blockquote]:pl-4 [&>blockquote]:italic [&>a]:text-blue-600 [&>a]:underline"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }}
              />
            </div>

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <Link key={tag} href={`/blog?tag=${encodeURIComponent(tag)}`}>
                    <Chip className="cursor-pointer hover:bg-gray-200">{tag}</Chip>
                  </Link>
                ))}
              </div>
            )}


            {/* Comment Section */}
            <CommentSection postId={id} isLoggedIn={isAuthenticated} />
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Categories */}
            <div>
              <h2 className="mb-4 text-2xl font-medium">文章分類</h2>
              <div className="overflow-hidden rounded-lg bg-white">
                <Link href="/blog">
                  <Button
                    variant="ghost"
                    className="w-full justify-start px-5 py-3 font-medium hover:bg-gray-50"
                  >
                    所有文章
                  </Button>
                </Link>
                <Link href="/blog?category=equipment">
                  <Button
                    variant="ghost"
                    className="w-full justify-start px-5 py-3 font-medium text-gray-500 hover:bg-gray-50"
                  >
                    裝備介紹
                  </Button>
                </Link>
                <Link href="/blog?category=technique">
                  <Button
                    variant="ghost"
                    className="w-full justify-start px-5 py-3 font-medium text-gray-500 hover:bg-gray-50"
                  >
                    技巧介紹
                  </Button>
                </Link>
                <Link href="/blog?category=research">
                  <Button
                    variant="ghost"
                    className="w-full justify-start px-5 py-3 font-medium text-gray-500 hover:bg-gray-50"
                  >
                    技術研究
                  </Button>
                </Link>
                <Link href="/blog?category=competition">
                  <Button
                    variant="ghost"
                    className="w-full justify-start px-5 py-3 font-medium text-gray-500 hover:bg-gray-50"
                  >
                    比賽介紹
                  </Button>
                </Link>
              </div>
            </div>

            {/* Popular Articles */}
            <div>
              <h2 className="mb-4 text-2xl font-medium">熱門文章</h2>
              <div className="space-y-4">
                {displayPopularArticles.map((popularArticle) => (
                  <Link
                    key={popularArticle.id}
                    href={`/blog/${popularArticle.id}`}
                    className="block rounded-lg border-b border-gray-200 bg-white p-5 transition-colors hover:bg-gray-50"
                  >
                    <h3 className="mb-2 font-medium">{popularArticle.title}</h3>
                    <div className="flex items-center gap-3">
                      <Chip>{popularArticle.tags?.[0] || '技巧介紹'}</Chip>
                      <span className="text-sm text-gray-500">
                        {popularArticle.published_at
                          ? new Date(popularArticle.published_at).toLocaleDateString('zh-TW')
                          : ''}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Related Articles Section */}
        <div className="mx-auto max-w-[1440px]">
          <h2 className="mb-8 text-2xl font-medium">相關文章</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {displayRelatedArticles.map((relatedArticle) => (
              <Link
                key={relatedArticle.id}
                href={`/blog/${relatedArticle.id}`}
                className="block overflow-hidden rounded-lg bg-white transition-shadow hover:shadow-lg"
              >
                <div className="relative aspect-[16/9]">
                  <Image
                    src={relatedArticle.cover_image || '/photo/blog-left.jpeg'}
                    alt={relatedArticle.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="mb-2 font-medium">{relatedArticle.title}</h3>
                  <div className="mb-2 flex items-center gap-3">
                    <Chip>{relatedArticle.tags?.[0] || '技巧介紹'}</Chip>
                    <span className="text-sm text-gray-500">
                      {relatedArticle.published_at
                        ? new Date(relatedArticle.published_at).toLocaleDateString('zh-TW')
                        : ''}
                    </span>
                  </div>
                  <p className="line-clamp-3 text-sm text-gray-500">
                    {relatedArticle.excerpt || relatedArticle.content}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
