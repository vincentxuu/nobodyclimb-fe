'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { postService } from '@/lib/api/services'
import { BackendPost, getCategoryLabel } from '@/lib/types'
import { generateSummary } from '@/lib/utils/article'

/**
 * 精選文章 Hero 組件
 * Medium/Substack 風格的全幅精選文章展示
 */
export function HeroArticle() {
  const [articles, setArticles] = useState<BackendPost[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 獲取精選文章
  useEffect(() => {
    const fetchFeaturedArticles = async () => {
      try {
        const response = await postService.getFeaturedPosts()
        if (response.success && response.data && response.data.length > 0) {
          setArticles(response.data)
        } else {
          setError('目前沒有精選文章')
        }
      } catch (err) {
        console.error('Failed to fetch featured articles:', err)
        setError('無法載入精選文章')
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedArticles()
  }, [])

  // 輪播控制
  const nextSlide = useCallback(() => {
    if (articles.length > 0) {
      setCurrentSlide((prev) => (prev + 1) % articles.length)
    }
  }, [articles.length])

  const prevSlide = useCallback(() => {
    if (articles.length > 0) {
      setCurrentSlide((prev) => (prev - 1 + articles.length) % articles.length)
    }
  }, [articles.length])

  // 自動播放
  useEffect(() => {
    if (!isAutoPlaying || articles.length <= 1) return

    const interval = setInterval(() => {
      nextSlide()
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying, nextSlide, articles.length])

  // 載入狀態
  if (loading) {
    return (
      <div className="flex h-[70vh] w-full items-center justify-center bg-[#1B1A1A]">
        <Loader2 className="h-10 w-10 animate-spin text-white" />
      </div>
    )
  }

  // 錯誤狀態或無資料 - 顯示備用 Hero
  if (error || articles.length === 0) {
    return (
      <div className="relative h-[70vh] w-full overflow-hidden">
        <Image
          src="/photo/cont-intro.jpeg"
          alt="Climbing Background"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-[#242424]/50" />
        <div className="container relative z-10 mx-auto flex h-full flex-col items-center justify-center px-4 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl"
          >
            <h1 className="mb-4 text-4xl font-bold md:text-5xl">探索攀岩的世界</h1>
            <p className="text-lg text-white/80">發現精彩故事、認識攀岩人物、探索台灣岩場</p>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="group relative h-[70vh] w-full overflow-hidden"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* 文章輪播 */}
      {articles.map((article, index) => (
        <div
          key={article.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            index === currentSlide ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <Link href={`/blog/${article.id}`} className="relative block h-full">
            {/* 背景圖片 */}
            <Image
              src={article.cover_image || '/photo/cont-intro.jpeg'}
              alt={article.title}
              fill
              sizes="100vw"
              className="object-cover"
              priority={index === 0}
            />
            {/* 漸層遮罩 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            {/* 文章資訊 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="absolute bottom-16 left-0 right-0 px-4 md:bottom-20 md:px-12"
            >
              <div className="container mx-auto">
                {/* 分類標籤與日期 */}
                <div className="mb-4 flex items-center gap-3">
                  <span className="rounded bg-[#FFE70C] px-3 py-1 text-sm font-medium text-[#1B1A1A]">
                    {getCategoryLabel(article.category) || '文章'}
                  </span>
                  <span className="text-sm text-white/80">
                    {article.published_at
                      ? new Date(article.published_at).toLocaleDateString('zh-TW')
                      : new Date(article.created_at).toLocaleDateString('zh-TW')}
                  </span>
                </div>

                {/* 標題 */}
                <h1 className="mb-4 max-w-4xl text-3xl font-bold text-white md:text-4xl lg:text-5xl">
                  {article.title}
                </h1>

                {/* 摘要 */}
                <p className="mb-6 max-w-2xl text-base text-white/80 line-clamp-2 md:text-lg">
                  {article.excerpt || generateSummary(article.content, undefined, 120)}
                </p>

                {/* 作者資訊 */}
                <div className="flex items-center gap-3">
                  {article.author_avatar ? (
                    <div className="relative h-10 w-10 overflow-hidden rounded-full">
                      <Image
                        src={article.author_avatar}
                        alt={article.display_name || article.username || '作者'}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white">
                      {(article.display_name || article.username || '匿')?.charAt(0)}
                    </div>
                  )}
                  <span className="text-sm text-white">
                    {article.display_name || article.username || '匿名作者'}
                  </span>
                </div>
              </div>
            </motion.div>
          </Link>
        </div>
      ))}

      {/* 導航點 */}
      {articles.length > 1 && (
        <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 transform gap-3">
          {articles.map((_, index) => (
            <button
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/70'
              }`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`前往第 ${index + 1} 篇文章`}
            />
          ))}
        </div>
      )}

      {/* 導航箭頭 */}
      {articles.length > 1 && (
        <>
          <button
            className="absolute left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 opacity-0 backdrop-blur-sm transition-all hover:bg-white/20 group-hover:opacity-100"
            onClick={prevSlide}
            aria-label="上一篇文章"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <button
            className="absolute right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 opacity-0 backdrop-blur-sm transition-all hover:bg-white/20 group-hover:opacity-100"
            onClick={nextSlide}
            aria-label="下一篇文章"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>
        </>
      )}
    </div>
  )
}
