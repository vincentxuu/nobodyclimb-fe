'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Chip } from '@/components/ui/chip'
import { Button } from '@/components/ui/button'
import { Mountain, Eye, Loader2, Bookmark } from 'lucide-react'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { ShareButton } from '@/components/shared/share-button'
import { CommentSection } from '@/components/blog/CommentSection'
import { postService } from '@/lib/api/services'
import { useToast } from '@/components/ui/use-toast'
import { BackendPost } from '@/lib/types'
import { useAuthStore } from '@/store/authStore'
import { sanitizeHtml } from '@/lib/utils/sanitize'
import { decodeHtmlEntities } from '@/lib/utils/article'
import { ArticleCoverGenerator } from '@/components/shared/ArticleCoverGenerator'

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

export default function BlogDetailClient() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const id = params.id as string
  const { isAuthenticated, user } = useAuthStore()

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

  // 通用的切換操作處理函數
  const createToggleHandler = useCallback(
    <T extends Record<string, unknown>>(
      isToggling: boolean,
      setToggling: (_v: boolean) => void,
      apiCall: () => Promise<{ success: boolean; data?: T }>,
      onSuccess: (_data: T) => void,
      successMessage: (_data: T) => string
    ) => async () => {
      if (isToggling) return
      setToggling(true)
      try {
        const response = await apiCall()
        if (response.success && response.data) {
          onSuccess(response.data)
          toast({ title: successMessage(response.data) })
        }
      } catch (err) {
        console.error('Toggle action failed:', err)
        toast({
          title: '操作失敗',
          description: '請稍後再試',
          variant: 'destructive',
        })
      } finally {
        setToggling(false)
      }
    },
    [toast]
  )

  // 處理按讚
  const handleLike = createToggleHandler(
    isLiking,
    setIsLiking,
    () => postService.toggleLike(id),
    (data: { liked: boolean; likes: number }) => {
      setIsLiked(data.liked)
      setLikeCount(data.likes)
    },
    (data: { liked: boolean }) => (data.liked ? '已按讚' : '已取消按讚')
  )

  // 處理收藏
  const handleBookmark = createToggleHandler(
    isBookmarking,
    setIsBookmarking,
    () => postService.toggleBookmark(id),
    (data: { bookmarked: boolean; bookmarks: number }) => {
      setIsBookmarked(data.bookmarked)
      setBookmarkCount(data.bookmarks)
    },
    (data: { bookmarked: boolean }) => (data.bookmarked ? '已收藏' : '已取消收藏')
  )

  if (isLoading) {
    return <LoadingState />
  }

  if (error || !article) {
    return <ErrorState message={error || '找不到文章'} />
  }

  // 檢查是否為文章作者
  const isAuthor = user?.id === article.author_id

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
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Eye size={16} />
                    {article.view_count}
                  </span>
                  <button
                    onClick={handleLike}
                    disabled={isLiking}
                    className={`flex items-center gap-1 ${isLiked ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <Mountain size={16} className={isLiked ? 'fill-emerald-600' : ''} />
                    {likeCount > 0 && likeCount}
                  </button>
                  <button
                    onClick={handleBookmark}
                    disabled={isBookmarking}
                    className={`flex items-center gap-1 ${isBookmarked ? 'text-amber-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <Bookmark size={16} className={isBookmarked ? 'fill-amber-600' : ''} />
                    {bookmarkCount > 0 && bookmarkCount}
                  </button>
                  <ShareButton
                    title={`${article.title} - NobodyClimb`}
                    description={article.excerpt || ''}
                    variant="ghost"
                    className="h-auto p-0 text-gray-500 hover:bg-transparent hover:text-gray-700"
                    iconSize={16}
                  />
                </div>
              </div>
              {isAuthor && (
                <Button
                  onClick={() => router.push(`/blog/edit/${id}`)}
                  className="bg-brand-dark text-white hover:bg-brand-dark-hover"
                >
                  編輯文章
                </Button>
              )}
            </div>

            {/* Main Image */}
            <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-lg">
              {article.cover_image ? (
                <Image
                  src={article.cover_image}
                  alt={article.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <ArticleCoverGenerator
                  category={article.category}
                  title={article.title}
                  showTitle={true}
                  className="h-full w-full"
                />
              )}
            </div>

            {/* Article Content */}
            <div className="space-y-6">
              {article.excerpt && (
                <section>
                  <p className="text-lg text-gray-600 italic">{decodeHtmlEntities(article.excerpt)}</p>
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
                {popularArticles.map((popularArticle) => (
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
            {relatedArticles.map((relatedArticle) => (
              <Link
                key={relatedArticle.id}
                href={`/blog/${relatedArticle.id}`}
                className="block overflow-hidden rounded-lg bg-white transition-shadow hover:shadow-lg"
              >
                <div className="relative aspect-[16/9]">
                  {relatedArticle.cover_image ? (
                    <Image
                      src={relatedArticle.cover_image}
                      alt={relatedArticle.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <ArticleCoverGenerator
                      category={relatedArticle.category}
                      title={relatedArticle.title}
                      showTitle={false}
                      className="h-full w-full"
                    />
                  )}
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
