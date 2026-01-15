'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { postService } from '@/lib/api/services'
import { BackendPost, getCategoryLabel } from '@/lib/types'
import { generateSummary } from '@/lib/utils/article'

interface ArticleItem {
  id: string
  title: string
  thumbnail: string | null
  excerpt: string
  date: string
  link: string
  category?: string
}

// 文章卡片組件
function ArticleCard({ item, index }: { item: ArticleItem; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link
        href={item.link}
        className="group block h-full overflow-hidden rounded-lg bg-white shadow-sm transition-shadow hover:shadow-md"
      >
        {/* 縮圖 */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          {item.thumbnail ? (
            <Image
              src={item.thumbnail}
              alt={item.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              <FileText className="h-8 w-8" />
            </div>
          )}
          {/* 分類標籤 */}
          {item.category && (
            <div className="absolute left-3 top-3 rounded bg-[#1B1A1A] px-2 py-1 text-xs font-medium text-white">
              {item.category}
            </div>
          )}
        </div>

        {/* 內容 */}
        <div className="p-4">
          <h3 className="mb-2 line-clamp-2 text-base font-medium text-[#1B1A1A] group-hover:text-[#3F3D3D]">
            {item.title}
          </h3>
          <p className="mb-3 line-clamp-2 text-sm text-[#6D6C6C]">{item.excerpt}</p>
          <div className="text-xs text-[#8E8C8C]">
            <span>{item.date}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

/**
 * 最新文章區組件
 * 展示最新的 4 篇文章
 */
export function LatestContentSection() {
  const [articles, setArticles] = useState<ArticleItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const postsRes = await postService.getPosts(1, 4)

        if (postsRes.success && postsRes.data) {
          const items: ArticleItem[] = postsRes.data.map((post: BackendPost) => ({
            id: post.id,
            title: post.title,
            thumbnail: post.cover_image,
            excerpt: post.excerpt || generateSummary(post.content, undefined, 80),
            date: post.published_at
              ? new Date(post.published_at).toLocaleDateString('zh-TW')
              : new Date(post.created_at).toLocaleDateString('zh-TW'),
            link: `/blog/${post.id}`,
            category: getCategoryLabel(post.category) || undefined,
          }))
          setArticles(items)
        }
      } catch (err) {
        console.error('Failed to fetch articles:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchArticles()
  }, [])

  if (loading) {
    return (
      <section className="border-t border-[#D2D2D2] py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="flex min-h-[300px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#1B1A1A]" />
          </div>
        </div>
      </section>
    )
  }

  if (articles.length === 0) {
    return null
  }

  return (
    <section className="border-t border-[#D2D2D2] py-16 md:py-20">
      <div className="container mx-auto px-4">
        {/* 標題區 */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-[#1B1A1A] md:text-[40px]">最新文章</h2>
          <p className="mt-4 text-base text-[#6D6C6C]">探索攀岩社群的最新動態</p>
        </div>

        {/* 文章網格 */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {articles.map((item, index) => (
            <ArticleCard key={item.id} item={item} index={index} />
          ))}
        </div>

        {/* 查看更多按鈕 */}
        <div className="mt-10 flex justify-center">
          <Link href="/blog">
            <Button
              variant="outline"
              className="h-11 border border-[#1B1A1A] px-8 text-base text-[#1B1A1A] hover:bg-[#DBD8D8]"
            >
              查看更多文章
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
