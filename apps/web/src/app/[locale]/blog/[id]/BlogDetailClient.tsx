'use client'

import { Bookmark, Eye, Loader2, Mountain } from 'lucide-react'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import {
  ContentInteractorsPanel,
  type InteractorUser,
} from '@/components/biography/display/ContentInteractorsPanel'
import { CommentSection } from '@/components/blog/CommentSection'
import { ArticleCoverGenerator } from '@/components/shared/ArticleCoverGenerator'
import { ShareButton } from '@/components/shared/share-button'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { useToast } from '@/components/ui/use-toast'
import { Link } from '@/i18n/navigation'
import apiClient from '@/lib/api/client'
import { postService } from '@/lib/api/services'
import { BackendPost } from '@/lib/types'
import { normalizeNewlines } from '@/lib/utils'
import { decodeHtmlEntities } from '@/lib/utils/article'
import { sanitizeHtml } from '@/lib/utils/sanitize'
import { useAuthStore } from '@/store/authStore'

// 載入狀態元件
const LoadingState = ({ label }: { label: string }) => (
  <div className="flex min-h-screen items-center justify-center bg-page-bg">
    <Loader2 className="h-6 w-6 animate-spin text-wb-70 sm:h-8 sm:w-8" />
    <span className="ml-2 text-sm text-wb-70 sm:text-base">{label}</span>
  </div>
)

// 錯誤狀態元件
const ErrorState = ({ message, backLabel }: { message: string; backLabel: string }) => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-page-bg px-4">
    <p className="mb-4 text-center text-base text-brand-red sm:text-lg">{message}</p>
    <Link href="/blog">
      <Button className="bg-brand-dark text-wb-0 hover:bg-brand-dark-hover">{backLabel}</Button>
    </Link>
  </div>
)

export default function BlogDetailClient() {
  const t = useTranslations('BlogPage')
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const id = params.id as string
  const { status, user } = useAuthStore()

  const [article, setArticle] = useState<BackendPost | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // 按讚狀態
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [isLiking, setIsLiking] = useState(false)
  // 按讚者列表
  const [isLikersOpen, setIsLikersOpen] = useState(false)
  const [likers, setLikers] = useState<InteractorUser[]>([])
  const [isLoadingLikers, setIsLoadingLikers] = useState(false)
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
        setError(t('articleNotFound'))
      }
    } catch (err) {
      console.error('Failed to fetch article:', err)
      setError(t('loadArticleFailed'))
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
      } else {
        setRelatedArticles([])
      }
    } catch (err) {
      console.error('Failed to fetch related articles:', err)
      setRelatedArticles([])
    }
  }, [id])

  useEffect(() => {
    fetchArticle()
    fetchLikeStatus()
    fetchBookmarkStatus()
    fetchPopularArticles()
    fetchRelatedArticles()
  }, [
    fetchArticle,
    fetchLikeStatus,
    fetchBookmarkStatus,
    fetchPopularArticles,
    fetchRelatedArticles,
  ])

  // 通用的切換操作處理函數
  const createToggleHandler = useCallback(
    <T extends Record<string, unknown>>(
      isToggling: boolean,
      setToggling: (_v: boolean) => void,
      apiCall: () => Promise<{ success: boolean; data?: T }>,
      onSuccess: (_data: T) => void,
      successMessage: (_data: T) => string
    ) =>
      async () => {
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
            title: t('actionFailed'),
            description: t('tryAgainLater'),
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
      setLikers([]) // 按讚狀態改變後清除快取
    },
    (data: { liked: boolean }) => (data.liked ? t('liked') : t('unliked'))
  )

  // 展開/收合按讚者列表
  const handleShowLikers = useCallback(async () => {
    const next = !isLikersOpen
    setIsLikersOpen(next)
    if (next && likers.length === 0) {
      setIsLoadingLikers(true)
      try {
        const resp = await apiClient.get(`/posts/${id}/likers`)
        setLikers(resp.data?.data?.likers ?? [])
      } catch (err) {
        console.error('Failed to fetch post likers:', err)
      } finally {
        setIsLoadingLikers(false)
      }
    }
  }, [isLikersOpen, likers.length, id])

  // 處理收藏
  const handleBookmark = createToggleHandler(
    isBookmarking,
    setIsBookmarking,
    () => postService.toggleBookmark(id),
    (data: { bookmarked: boolean; bookmarks: number }) => {
      setIsBookmarked(data.bookmarked)
      setBookmarkCount(data.bookmarks)
    },
    (data: { bookmarked: boolean }) => (data.bookmarked ? t('bookmarked') : t('unbookmarked'))
  )

  if (isLoading) {
    return <LoadingState label={t('loading')} />
  }

  if (error || !article) {
    return <ErrorState message={error || t('articleNotFound')} backLabel={t('backToList')} />
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
    <div className="min-h-screen bg-page-bg">
      <main className="mx-auto max-w-[1440px] px-3 py-4 sm:px-4 sm:py-8">
        {/* Breadcrumb */}
        <div className="mb-4 sm:mb-8">
          <Breadcrumb
            items={[
              { label: t('articleDetailHome'), href: '/' },
              { label: t('articleDetailBlog'), href: '/blog' },
              { label: article.title },
            ]}
          />
        </div>

        {/* Content */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:mb-16 sm:gap-8 lg:grid-cols-[1fr_320px]">
          <div className="rounded-lg bg-wb-0 p-4 sm:p-8 lg:p-16">
            {/* Article Header */}
            <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:mb-8 sm:flex-row">
              <div className="flex-1">
                <h1 className="mb-3 text-xl font-medium sm:mb-4 sm:text-2xl md:text-3xl">
                  {article.title}
                </h1>
                {/* 作者資訊 */}
                <div className="mb-3 flex items-center gap-3 sm:mb-4">
                  {article.author_avatar ? (
                    <div className="h-10 w-10 overflow-hidden rounded-full">
                      <Image
                        src={article.author_avatar}
                        alt={article.display_name || article.username || t('authorPlaceholder')}
                        width={40}
                        height={40}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-wb-20 text-sm font-medium text-wb-70">
                      {(article.display_name || article.username || t('anonymous').charAt(0))
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-wb-100 sm:text-base">
                      {article.display_name || article.username || t('anonymous')}
                    </p>
                    <p className="text-xs text-wb-70 sm:text-sm">{formattedDate}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  {article.tags && article.tags.length > 0 && <Chip>{article.tags[0]}</Chip>}
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs text-wb-70 sm:gap-4 sm:text-sm">
                  <span className="flex items-center gap-1">
                    <Eye size={14} className="sm:h-4 sm:w-4" />
                    {article.view_count}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleLike}
                      disabled={isLiking}
                      className={`flex items-center ${isLiked ? 'text-emerald-600' : 'text-wb-70 hover:text-wb-90'}`}
                    >
                      <Mountain
                        size={14}
                        className={`sm:h-4 sm:w-4 ${isLiked ? 'fill-emerald-600' : ''}`}
                      />
                    </button>
                    {likeCount > 0 && (
                      <button
                        onClick={handleShowLikers}
                        className={`hover:underline ${isLiked ? 'text-emerald-600' : 'text-wb-70'}`}
                      >
                        {likeCount}
                      </button>
                    )}
                  </div>
                  <button
                    onClick={handleBookmark}
                    disabled={isBookmarking}
                    className={`flex items-center gap-1 ${isBookmarked ? 'text-brand-accent-hover' : 'text-wb-70 hover:text-wb-90'}`}
                  >
                    <Bookmark
                      size={14}
                      className={`sm:h-4 sm:w-4 ${isBookmarked ? 'fill-brand-accent-hover' : ''}`}
                    />
                    {bookmarkCount > 0 && bookmarkCount}
                  </button>
                  <ShareButton
                    title={`${article.title} - NobodyClimb`}
                    description={article.excerpt || ''}
                    variant="ghost"
                    className="h-auto p-0 text-wb-70 hover:bg-transparent hover:text-wb-90"
                    iconSize={14}
                  />
                </div>
                {/* 按讚者列表 */}
                <ContentInteractorsPanel
                  isOpen={isLikersOpen}
                  users={likers}
                  isLoading={isLoadingLikers}
                  emptyMessage={t('noLikesYet')}
                />
              </div>
              {isAuthor && (
                <Button
                  onClick={() => router.push(`/blog/edit/${id}`)}
                  className="bg-brand-dark text-wb-0 hover:bg-brand-dark-hover"
                >
                  {t('editArticle')}
                </Button>
              )}
            </div>

            {/* Main Image */}
            <div className="relative mb-6 aspect-[16/9] overflow-hidden rounded-lg sm:mb-8">
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
            <div className="space-y-4 sm:space-y-6">
              {article.excerpt && (
                <section>
                  <p className="text-base italic text-wb-70 sm:text-lg">
                    {decodeHtmlEntities(normalizeNewlines(article.excerpt))}
                  </p>
                </section>
              )}
              <section
                className="blog-content text-sm text-wb-100 sm:text-base [&>p]:mb-4 [&>h1]:text-xl [&>h1]:font-bold [&>h1]:mb-4 sm:[&>h1]:text-2xl [&>h2]:text-lg [&>h2]:font-bold [&>h2]:mb-3 sm:[&>h2]:text-xl [&>h3]:text-base [&>h3]:font-semibold [&>h3]:mb-2 sm:[&>h3]:text-lg [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:mb-4 [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:mb-4 [&>blockquote]:border-l-4 [&>blockquote]:border-wb-30 [&>blockquote]:pl-4 [&>blockquote]:italic [&>a]:text-blue-600 [&>a]:underline"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(normalizeNewlines(article.content)),
                }}
              />
            </div>

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2 sm:mt-8">
                {article.tags.map((tag) => (
                  <Link key={tag} href={`/blog?tag=${encodeURIComponent(tag)}`}>
                    <Chip className="cursor-pointer hover:bg-wb-20">{tag}</Chip>
                  </Link>
                ))}
              </div>
            )}

            {/* Comment Section */}
            <CommentSection postId={id} isLoggedIn={status === 'signIn'} />
          </div>

          {/* Sidebar - 手機版隱藏或改為水平滾動 */}
          <div className="hidden space-y-6 sm:space-y-8 lg:block">
            {/* Categories */}
            <div>
              <h2 className="mb-3 text-xl font-medium sm:mb-4 sm:text-2xl">
                {t('articleCategories')}
              </h2>
              <div className="overflow-hidden rounded-lg bg-wb-0">
                <Link href="/blog">
                  <Button
                    variant="ghost"
                    className="w-full justify-start px-4 py-2.5 text-sm font-medium hover:bg-wb-10 sm:px-5 sm:py-3 sm:text-base"
                  >
                    {t('allArticles')}
                  </Button>
                </Link>
                <Link href="/blog?category=equipment">
                  <Button
                    variant="ghost"
                    className="w-full justify-start px-4 py-2.5 text-sm font-medium text-wb-70 hover:bg-wb-10 sm:px-5 sm:py-3 sm:text-base"
                  >
                    {t('categoryEquipment')}
                  </Button>
                </Link>
                <Link href="/blog?category=technique">
                  <Button
                    variant="ghost"
                    className="w-full justify-start px-4 py-2.5 text-sm font-medium text-wb-70 hover:bg-wb-10 sm:px-5 sm:py-3 sm:text-base"
                  >
                    {t('categoryTechnique')}
                  </Button>
                </Link>
                <Link href="/blog?category=research">
                  <Button
                    variant="ghost"
                    className="w-full justify-start px-4 py-2.5 text-sm font-medium text-wb-70 hover:bg-wb-10 sm:px-5 sm:py-3 sm:text-base"
                  >
                    {t('categoryResearch')}
                  </Button>
                </Link>
                <Link href="/blog?category=competition">
                  <Button
                    variant="ghost"
                    className="w-full justify-start px-4 py-2.5 text-sm font-medium text-wb-70 hover:bg-wb-10 sm:px-5 sm:py-3 sm:text-base"
                  >
                    {t('categoryCompetition')}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Popular Articles */}
            <div>
              <h2 className="mb-3 text-xl font-medium sm:mb-4 sm:text-2xl">
                {t('popularArticles')}
              </h2>
              <div className="space-y-3 sm:space-y-4">
                {popularArticles.map((popularArticle) => (
                  <Link
                    key={popularArticle.id}
                    href={`/blog/${popularArticle.id}`}
                    className="block rounded-lg border-b border-wb-20 bg-wb-0 p-4 transition-colors hover:bg-wb-10 sm:p-5"
                  >
                    <h3 className="mb-2 text-sm font-medium sm:text-base">
                      {popularArticle.title}
                    </h3>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Chip>{popularArticle.tags?.[0] || t('categoryTechnique')}</Chip>
                      <span className="text-xs text-wb-70 sm:text-sm">
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
          <h2 className="mb-4 text-xl font-medium sm:mb-8 sm:text-2xl">{t('relatedArticles')}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-6 md:grid-cols-3">
            {relatedArticles.map((relatedArticle) => (
              <Link
                key={relatedArticle.id}
                href={`/blog/${relatedArticle.id}`}
                className="block overflow-hidden rounded-lg bg-wb-0 transition-shadow hover:shadow-lg"
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
                <div className="p-4 sm:p-6">
                  <h3 className="mb-2 text-sm font-medium sm:text-base">{relatedArticle.title}</h3>
                  <div className="mb-2 flex flex-wrap items-center gap-2 sm:gap-3">
                    <Chip>{relatedArticle.tags?.[0] || t('categoryTechnique')}</Chip>
                    <span className="text-xs text-wb-70 sm:text-sm">
                      {relatedArticle.published_at
                        ? new Date(relatedArticle.published_at).toLocaleDateString('zh-TW')
                        : ''}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-xs text-wb-70 sm:line-clamp-3 sm:text-sm">
                    {normalizeNewlines(relatedArticle.excerpt || relatedArticle.content)}
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
