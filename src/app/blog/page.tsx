'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { SearchInput } from '@/components/ui/search-input'
import { ChevronLeft, ChevronRight, Loader2, FileText } from 'lucide-react'
import { Article } from '@/mocks/articles'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { postService } from '@/lib/api/services'
import { PostCategory, POST_CATEGORIES, getCategoryLabel } from '@/lib/types'
import { generateSummary } from '@/lib/utils/article'
import { ArticleCoverGenerator } from '@/components/shared/ArticleCoverGenerator'

// 空狀態元件
const EmptyState = ({ searchQuery, category }: { searchQuery: string; category: string }) => (
  <div className="flex min-h-[400px] flex-col items-center justify-center py-12">
    <FileText className="mb-4 h-12 w-12 text-wb-30 sm:h-16 sm:w-16" />
    <h3 className="mb-2 text-lg font-medium text-brand-dark sm:text-xl">
      {searchQuery ? '找不到符合的文章' : '目前沒有文章'}
    </h3>
    <p className="mb-4 text-center text-sm text-wb-70 sm:text-base">
      {searchQuery
        ? `沒有找到包含「${searchQuery}」的文章`
        : category !== '所有文章'
          ? `目前「${category}」分類沒有文章`
          : '成為第一個發表文章的人吧！'}
    </p>
    {searchQuery && (
      <Button variant="outline" className="border-brand-dark text-brand-dark">
        清除搜尋
      </Button>
    )}
  </div>
)

// 文章卡片元件
interface ArticleCardProps {
  article: Article
}

const ArticleCard = ({ article }: ArticleCardProps) => {
  const hasImage = article.imageUrl && article.imageUrl.trim() !== ''

  return (
    <Link
      href={`/blog/${article.id}`}
      className="group h-auto min-h-[380px] overflow-hidden rounded-lg bg-wb-0 transition-shadow hover:shadow-lg sm:h-[416px]"
    >
      <div className="relative aspect-video sm:h-[208px] sm:aspect-auto">
        {hasImage ? (
          <Image src={article.imageUrl} alt={article.title} fill className="object-cover" />
        ) : (
          <ArticleCoverGenerator
            category={article.categoryValue}
            title={article.title}
            showTitle={false}
            className="h-full w-full"
          />
        )}
        {article.isFeature && (
          <div className="absolute left-2 top-2 rounded bg-brand-accent px-2 py-0.5 text-[10px] font-medium text-brand-dark sm:left-3 sm:top-3 sm:py-1 sm:text-xs">
            精選
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 p-4 sm:gap-3 sm:p-5">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="rounded bg-brand-dark px-2 py-0.5 text-xs text-wb-0 sm:px-3 sm:py-1 sm:text-sm">
            {article.category}
          </span>
          <span className="text-xs text-wb-70 sm:text-sm">{article.date}</span>
        </div>
        <h2 className="line-clamp-2 text-base font-medium group-hover:text-wb-70 sm:text-xl">
          {article.title}
        </h2>
        <p className="line-clamp-2 text-xs text-wb-70 sm:line-clamp-3 sm:text-sm">
          {generateSummary(article.content)}
        </p>
      </div>
    </Link>
  )
}

// 文章卡片骨架屏
const ArticleCardSkeleton = () => (
  <div className="h-auto min-h-[380px] animate-pulse overflow-hidden rounded-lg bg-wb-0 sm:h-[416px]">
    <div className="aspect-video bg-wb-20 sm:h-[208px] sm:aspect-auto" />
    <div className="flex flex-col gap-2 p-4 sm:gap-3 sm:p-5">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="h-5 w-14 rounded bg-wb-20 sm:h-6 sm:w-16" />
        <div className="h-4 w-16 rounded bg-wb-20 sm:w-20" />
      </div>
      <div className="h-6 w-full rounded bg-wb-20 sm:h-7" />
      <div className="h-4 w-full rounded bg-wb-20" />
      <div className="h-4 w-3/4 rounded bg-wb-20" />
    </div>
  </div>
)

function BlogContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get('category') as PostCategory | null
  const tagParam = searchParams.get('tag')

  // 根據 URL 參數設置默認選中的類別（URL 參數或 null 表示「所有文章」）
  const [selectedCategory, setSelectedCategory] = useState<PostCategory | null>(categoryParam)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [articles, setArticles] = useState<Article[]>([])
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // 處理類別選擇變更
  const handleCategoryChange = (category: PostCategory | null) => {
    setSelectedCategory(category)
    setPage(1)
    setHasMore(true)

    // 更新 URL 路徑
    if (category) {
      router.push(`/blog?category=${category}`)
    } else {
      router.push('/blog')
    }
  }

  // 同步 URL 參數和選定類別
  useEffect(() => {
    setSelectedCategory(categoryParam)
  }, [categoryParam])

  // 獲取文章列表
  const fetchArticles = useCallback(async (pageNum: number, append: boolean = false) => {
    if (pageNum === 1) {
      setIsLoading(true)
    } else {
      setIsLoadingMore(true)
    }

    try {
      const response = await postService.getPosts(pageNum, 9)
      if (response.success && response.data) {
        // 後端返回 { success, data: [...], pagination }
        const { data: postsData, pagination: paginationData } = response

        // 將後端數據轉換為前端格式
        const fetchedArticles: Article[] = postsData.map((post) => ({
          id: post.id,
          title: post.title,
          category: getCategoryLabel(post.category) || '未分類',
          categoryValue: post.category || undefined,
          date: post.published_at
            ? new Date(post.published_at).toLocaleDateString('zh-TW')
            : new Date(post.created_at).toLocaleDateString('zh-TW'),
          content: post.content,
          imageUrl: post.cover_image || '',
          isFeature: post.is_featured === 1,
          description: post.excerpt || undefined,
        }))

        if (append) {
          setArticles((prev) => [...prev, ...fetchedArticles])
        } else {
          setArticles(fetchedArticles)
        }
        setHasMore(pageNum < (paginationData?.total_pages || 1))
      } else {
        if (!append) {
          setArticles([])
        }
        setHasMore(false)
      }
    } catch (err) {
      console.error('Failed to fetch articles:', err)
      if (!append) {
        setArticles([])
      }
      setHasMore(false)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [])

  // 獲取精選文章
  const fetchFeaturedArticles = useCallback(async () => {
    try {
      const response = await postService.getFeaturedPosts()
      if (response.success && response.data) {
        const fetchedFeatured: Article[] = response.data.map((post) => ({
          id: post.id,
          title: post.title,
          category: getCategoryLabel(post.category) || '未分類',
          categoryValue: post.category || undefined,
          date: post.published_at
            ? new Date(post.published_at).toLocaleDateString('zh-TW')
            : new Date(post.created_at).toLocaleDateString('zh-TW'),
          content: post.content,
          imageUrl: post.cover_image || '',
          isFeature: true,
          description: post.excerpt || undefined,
        }))
        setFeaturedArticles(fetchedFeatured)
      }
    } catch (err) {
      console.error('Failed to fetch featured articles:', err)
    }
  }, [])

  // 初始載入 - 合併 API 調用
  useEffect(() => {
    Promise.all([fetchArticles(1), fetchFeaturedArticles()])
  }, [fetchArticles, fetchFeaturedArticles])

  // 載入更多
  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchArticles(nextPage, true)
    }
  }

  // 使用從 API 獲取的精選文章
  const displayFeatured = featuredArticles

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % displayFeatured.length)
  }, [displayFeatured.length])

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + displayFeatured.length) % displayFeatured.length)
  }, [displayFeatured.length])

  useEffect(() => {
    let intervalId: NodeJS.Timeout

    if (isAutoPlaying && displayFeatured.length > 0) {
      intervalId = setInterval(() => {
        nextSlide()
      }, 5000) // Change slide every 5 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [isAutoPlaying, nextSlide, displayFeatured.length])

  // 分類按鈕列表（含「所有文章」）
  const categoryButtons: { value: PostCategory | null; label: string }[] = [
    { value: null, label: '所有文章' },
    ...POST_CATEGORIES,
  ]

  // 過濾文章
  const filteredArticles = articles.filter((article) => {
    const selectedLabel = selectedCategory ? getCategoryLabel(selectedCategory) : null
    const matchesCategory = !selectedCategory || article.category === selectedLabel
    const matchesSearch =
      !searchQuery ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTag = !tagParam || article.category === tagParam
    return matchesCategory && matchesSearch && matchesTag
  })

  // 取得當前選中分類的顯示名稱
  const getSelectedCategoryLabel = (): string => {
    if (!selectedCategory) return '所有文章'
    return getCategoryLabel(selectedCategory)
  }

  return (
    <div className="min-h-screen bg-page-content-bg">
      {/* Header Section - Featured Carousel */}
      {displayFeatured.length > 0 && (
        <div className="container mx-auto px-3 pt-4 sm:px-4 sm:pt-8">
          <div
            className="group relative aspect-[16/9] w-full overflow-hidden rounded-lg sm:aspect-[21/9] sm:rounded-xl"
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
          >
            {displayFeatured.map((article, index) => (
              <div
                key={article.id}
                className={`absolute inset-0 transition-opacity duration-500 ${
                  index === currentSlide ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
              >
                <Link href={`/blog/${article.id}`} className="relative block h-full">
                  {article.imageUrl && article.imageUrl.trim() !== '' ? (
                    <Image
                      src={article.imageUrl}
                      alt={article.title}
                      fill
                      className="object-cover"
                      priority={index === 0}
                      loading={index === 0 ? 'eager' : 'lazy'}
                    />
                  ) : (
                    <ArticleCoverGenerator
                      category={article.categoryValue}
                      title={article.title}
                      showTitle={false}
                      showIcon={true}
                      className="h-full w-full"
                      aspectRatio="wide"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-wb-0 sm:bottom-8 sm:left-8 sm:right-auto md:bottom-12 md:left-12">
                    <div className="mb-2 flex flex-wrap items-center gap-2 sm:mb-3 sm:gap-3 md:mb-4">
                      <span className="rounded bg-brand-dark px-2 py-0.5 text-xs sm:px-3 sm:py-1 sm:text-sm">
                        {article.category}
                      </span>
                      <span className="text-xs sm:text-sm">{article.date}</span>
                    </div>
                    <h1 className="line-clamp-2 text-lg font-medium sm:max-w-[600px] sm:text-2xl md:max-w-[800px] md:text-4xl">
                      {article.title}
                    </h1>
                  </div>
                </Link>
              </div>
            ))}

            {/* Navigation Dots */}
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 transform gap-2 sm:bottom-4 sm:gap-3">
              {displayFeatured.map((_, index) => (
                <button
                  key={index}
                  className={`h-1.5 w-1.5 rounded-full transition-all sm:h-2 sm:w-2 ${
                    index === currentSlide ? 'w-4 bg-wb-0 sm:w-6' : 'bg-wb-0/50'
                  }`}
                  onClick={() => setCurrentSlide(index)}
                />
              ))}
            </div>

            {/* Navigation Arrows - 手機版隱藏 */}
            <button
              className="absolute left-2 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-wb-0/80 opacity-0 transition-opacity group-hover:opacity-100 sm:left-4 sm:flex sm:h-10 sm:w-10"
              onClick={prevSlide}
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <button
              className="absolute right-2 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-wb-0/80 opacity-0 transition-opacity group-hover:opacity-100 sm:right-4 sm:flex sm:h-10 sm:w-10"
              onClick={nextSlide}
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>
        </div>
      )}

      <div className="container mx-auto px-3 py-6 sm:px-4 sm:py-10">
        {/* Breadcrumb */}
        <div className="mb-6 sm:mb-8">
          <Breadcrumb items={[{ label: '首頁', href: '/' }, { label: '部落格' }]} />
        </div>

        {/* Filter Section */}
        <div className="mb-6 space-y-4 sm:mb-8 sm:space-y-6">
          {/* Search Input - 置中 */}
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋文章關鍵字..."
          />

          {/* Categories - 響應式按鈕 */}
          <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 md:gap-4">
            {categoryButtons.map((cat) => (
              <Button
                key={cat.value || 'all'}
                variant={selectedCategory === cat.value ? 'primary' : 'outline'}
                className={`rounded-full px-4 py-1.5 text-xs sm:px-6 sm:py-2 sm:text-sm md:px-8 ${
                  selectedCategory === cat.value
                    ? 'bg-brand-dark text-wb-0 hover:bg-brand-dark-hover'
                    : 'border-wb-30 text-wb-100 hover:bg-wb-10'
                }`}
                onClick={() => handleCategoryChange(cat.value)}
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Articles Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <ArticleCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredArticles.length === 0 ? (
          <EmptyState searchQuery={searchQuery} category={getSelectedCategoryLabel()} />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {filteredArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>

            {/* Load More Button */}
            <div className="mb-12 mt-8 flex justify-center sm:mb-16 sm:mt-10">
              {hasMore ? (
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="h-10 border border-brand-dark px-6 text-sm text-brand-dark hover:bg-brand-light hover:text-brand-dark sm:h-11 sm:px-8 sm:text-base"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      載入中...
                    </>
                  ) : (
                    '看更多'
                  )}
                </Button>
              ) : (
                <p className="text-sm text-wb-70 sm:text-base">已顯示所有文章</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function BlogPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-page-content-bg">
          <Loader2 className="h-6 w-6 animate-spin text-wb-70 sm:h-8 sm:w-8" />
          <span className="ml-2 text-sm text-wb-70 sm:text-base">載入中...</span>
        </div>
      }
    >
      <BlogContent />
    </Suspense>
  )
}
