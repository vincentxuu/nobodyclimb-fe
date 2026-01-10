'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, ChevronLeft, ChevronRight, Loader2, Heart, Eye, FileText } from 'lucide-react'
import { Article, ArticleCategory } from '@/mocks/articles'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { motion } from 'framer-motion'
import { postService } from '@/lib/api/services'
import { BackendPost } from '@/lib/types'
import { generateSummary } from '@/lib/utils/article'

// 載入狀態元件
const LoadingState = () => (
  <div className="flex min-h-[400px] items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-[#6D6C6C]" />
    <span className="ml-2 text-[#6D6C6C]">載入文章中...</span>
  </div>
)

// 空狀態元件
const EmptyState = ({ searchQuery, category }: { searchQuery: string; category: string }) => (
  <div className="flex min-h-[400px] flex-col items-center justify-center py-12">
    <FileText className="mb-4 h-16 w-16 text-gray-300" />
    <h3 className="mb-2 text-xl font-medium text-[#1B1A1A]">
      {searchQuery ? '找不到符合的文章' : '目前沒有文章'}
    </h3>
    <p className="mb-4 text-[#6D6C6C]">
      {searchQuery
        ? `沒有找到包含「${searchQuery}」的文章`
        : category !== '所有文章'
          ? `目前「${category}」分類沒有文章`
          : '成為第一個發表文章的人吧！'}
    </p>
    {searchQuery && (
      <Button variant="outline" className="border-[#1B1A1A] text-[#1B1A1A]">
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
  const hasImage = article.imageUrl && article.imageUrl !== '/photo/blog-left.jpeg'

  return (
    <Link
      href={`/blog/${article.id}`}
      className={`group overflow-hidden rounded-none bg-white transition-shadow hover:shadow-lg ${hasImage ? 'h-[416px]' : 'h-auto'}`}
    >
      {hasImage && (
        <div className="relative h-[208px]">
          <Image src={article.imageUrl} alt={article.title} fill className="object-cover" />
          {article.isFeature && (
            <div className="absolute left-3 top-3 rounded bg-orange-500 px-2 py-1 text-xs text-white">
              精選
            </div>
          )}
        </div>
      )}
      {!hasImage && article.isFeature && (
        <div className="px-5 pt-5">
          <span className="rounded bg-orange-500 px-2 py-1 text-xs text-white">
            精選
          </span>
        </div>
      )}
      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-center gap-3">
          <span className="rounded bg-[#3F3D3D] px-3 py-1 text-sm text-white">{article.category}</span>
          <span className="text-sm text-[#6D6C6C]">{article.date}</span>
        </div>
        <h2 className="line-clamp-2 text-xl font-medium group-hover:text-gray-700">
          {article.title}
        </h2>
        <p className="line-clamp-3 text-sm text-gray-700">{generateSummary(article.content)}</p>
      </div>
    </Link>
  )
}

// 文章卡片骨架屏
const ArticleCardSkeleton = () => (
  <div className="h-[416px] animate-pulse overflow-hidden rounded-none bg-white">
    <div className="h-[208px] bg-gray-200" />
    <div className="flex flex-col gap-3 p-5">
      <div className="flex items-center gap-3">
        <div className="h-6 w-16 rounded bg-gray-200" />
        <div className="h-4 w-20 rounded bg-gray-200" />
      </div>
      <div className="h-7 w-full rounded bg-gray-200" />
      <div className="h-4 w-full rounded bg-gray-200" />
      <div className="h-4 w-3/4 rounded bg-gray-200" />
    </div>
  </div>
)

function BlogContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get('category')
  const tagParam = searchParams.get('tag')

  // 為URL category參數映射到顯示類別
  const categoryMapping: Record<string, ArticleCategory> = {
    equipment: '裝備介紹',
    technique: '技巧介紹',
    research: '技術研究',
    competition: '比賽介紹',
  }

  // 類別和 URL 參數的反向映射
  const categoryToUrlParam: Record<ArticleCategory, string | null> = {
    所有文章: null,
    裝備介紹: 'equipment',
    技巧介紹: 'technique',
    技術研究: 'research',
    比賽介紹: 'competition',
  }

  // 根據URL參數設置默認選中的類別
  const defaultCategory = categoryParam
    ? (categoryMapping[categoryParam] ?? '所有文章')
    : '所有文章'

  const [selectedCategory, setSelectedCategory] = useState<ArticleCategory>(defaultCategory)
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
  const handleCategoryChange = (category: ArticleCategory) => {
    setSelectedCategory(category)
    setPage(1)
    setHasMore(true)

    // 更新 URL 路徑
    const urlParam = categoryToUrlParam[category]
    if (urlParam) {
      router.push(`/blog?category=${urlParam}`)
    } else {
      router.push('/blog')
    }
  }

  // 同步URL參數和選定類別
  useEffect(() => {
    if (categoryParam) {
      const mappedCategory = categoryMapping[categoryParam]
      if (mappedCategory && mappedCategory !== selectedCategory) {
        setSelectedCategory(mappedCategory)
      }
    }
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
          category: (post.tags?.[0] as ArticleCategory) || '技巧介紹',
          date: post.published_at
            ? new Date(post.published_at).toLocaleDateString('zh-TW')
            : new Date(post.created_at).toLocaleDateString('zh-TW'),
          content: post.content,
          imageUrl: post.cover_image || '/photo/blog-left.jpeg',
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
          category: (post.tags?.[0] as ArticleCategory) || '技巧介紹',
          date: post.published_at
            ? new Date(post.published_at).toLocaleDateString('zh-TW')
            : new Date(post.created_at).toLocaleDateString('zh-TW'),
          content: post.content,
          imageUrl: post.cover_image || '/photo/blog-left.jpeg',
          isFeature: true,
          description: post.excerpt || undefined,
        }))
        setFeaturedArticles(fetchedFeatured)
      }
    } catch (err) {
      console.error('Failed to fetch featured articles:', err)
    }
  }, [])

  // 初始載入
  useEffect(() => {
    fetchArticles(1)
    fetchFeaturedArticles()
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

  const categories: ArticleCategory[] = ['所有文章', '裝備介紹', '技巧介紹', '技術研究', '比賽介紹']

  // 過濾文章
  const filteredArticles = articles.filter((article) => {
    const matchesCategory = selectedCategory === '所有文章' || article.category === selectedCategory
    const matchesSearch =
      !searchQuery ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTag = !tagParam || article.category === tagParam
    return matchesCategory && matchesSearch && matchesTag
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-[#f5f5f5]"
    >
      {/* Header Section - Featured Carousel */}
      {displayFeatured.length > 0 && (
        <div
          className="group relative h-[480px] w-full"
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
                <Image
                  src={article.imageUrl}
                  alt={article.title}
                  fill
                  className="object-cover"
                  priority={index === 0}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-12 left-12 text-white">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="rounded bg-[#3F3D3D] px-3 py-1 text-sm">{article.category}</span>
                    <span className="text-sm">{article.date}</span>
                  </div>
                  <h1 className="max-w-[800px] text-4xl font-medium">{article.title}</h1>
                </div>
              </Link>
            </div>
          ))}

          {/* Navigation Dots */}
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 transform gap-3">
            {displayFeatured.map((_, index) => (
              <button
                key={index}
                className={`h-2 w-2 rounded-full transition-all ${
                  index === currentSlide ? 'w-6 bg-white' : 'bg-white/50'
                }`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>

          {/* Navigation Arrows */}
          <button
            className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={prevSlide}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={nextSlide}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      )}

      <div className="container mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Breadcrumb items={[{ label: '首頁', href: '/' }, { label: '部落格' }]} />
        </div>

        {/* Filter Section */}
        <div className="mb-8 space-y-6">
          {/* Search Input - 置中 */}
          <div className="flex justify-center">
            <div className="relative w-[240px]">
              <Input
                placeholder="搜尋文章關鍵字..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-[40px] w-full rounded-[4px] border border-[#1B1A1A] bg-white text-sm font-light placeholder:text-[#6D6C6C] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1B1A1A]"
              />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <Search className="h-5 w-5 stroke-[1.5px] text-[#1B1A1A]" />
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-4">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'primary' : 'outline'}
                className={`rounded-full px-8 ${
                  selectedCategory === category
                    ? 'bg-black text-white hover:bg-gray-800'
                    : 'border-gray-300 hover:bg-gray-100'
                }`}
                onClick={() => handleCategoryChange(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Articles Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <ArticleCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredArticles.length === 0 ? (
          <EmptyState searchQuery={searchQuery} category={selectedCategory} />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>

            {/* Load More Button */}
            <div className="mb-16 mt-10 flex justify-center">
              {hasMore ? (
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="h-11 border border-[#1B1A1A] px-8 text-[#1B1A1A] hover:bg-[#dbd8d8] hover:text-[#1B1A1A]"
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
                <p className="text-[#6D6C6C]">已顯示所有文章</p>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}

export default function BlogPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5]">
          <Loader2 className="h-8 w-8 animate-spin text-[#6D6C6C]" />
          <span className="ml-2 text-[#6D6C6C]">載入中...</span>
        </div>
      }
    >
      <BlogContent />
    </Suspense>
  )
}
