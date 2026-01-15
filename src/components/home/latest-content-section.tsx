'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FileText, User, Video, Loader2 } from 'lucide-react'
import { postService, biographyService } from '@/lib/api/services'
import { BackendPost, Biography, getCategoryLabel } from '@/lib/types'
import type { Video as VideoType } from '@/lib/types'
import { generateSummary } from '@/lib/utils/article'

// 統一的內容項目類型
type ContentType = 'article' | 'biography' | 'video'

interface ContentItem {
  id: string
  type: ContentType
  title: string
  thumbnail: string | null
  excerpt: string
  date: string
  link: string
  meta?: string
}

// 內容卡片組件
function ContentCard({ item, index }: { item: ContentItem; index: number }) {
  const typeIcons = {
    article: <FileText className="h-4 w-4" />,
    biography: <User className="h-4 w-4" />,
    video: <Video className="h-4 w-4" />,
  }

  const typeLabels = {
    article: '文章',
    biography: '人物誌',
    video: '影片',
  }

  const typeColors = {
    article: 'bg-brand-dark',
    biography: 'bg-brand-dark',
    video: 'bg-brand-dark',
  }

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
              {typeIcons[item.type]}
            </div>
          )}
          {/* 類型標籤 */}
          <div
            className={`absolute left-3 top-3 flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium text-white ${typeColors[item.type]}`}
          >
            {typeIcons[item.type]}
            <span>{typeLabels[item.type]}</span>
          </div>
        </div>

        {/* 內容 */}
        <div className="p-4">
          <h3 className="mb-2 line-clamp-2 text-base font-medium text-[#1B1A1A] group-hover:text-[#3F3D3D]">
            {item.title}
          </h3>
          <p className="mb-3 line-clamp-2 text-sm text-[#6D6C6C]">{item.excerpt}</p>
          <div className="flex items-center justify-between text-xs text-[#8E8C8C]">
            <span>{item.date}</span>
            {item.meta && <span>{item.meta}</span>}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

/**
 * 最新內容區組件
 * 混合展示最新文章、人物誌和影片
 */
export function LatestContentSection() {
  const [content, setContent] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchContent = async () => {
      try {
        // 並行獲取所有內容
        const [postsRes, biosRes, videosRes] = await Promise.all([
          postService.getPosts(1, 2),
          biographyService.getBiographies(1, 1),
          fetch('/data/videos.json').then((r) => r.json()),
        ])

        const items: ContentItem[] = []

        // 添加文章
        if (postsRes.success && postsRes.data) {
          postsRes.data.slice(0, 2).forEach((post: BackendPost) => {
            items.push({
              id: post.id,
              type: 'article',
              title: post.title,
              thumbnail: post.cover_image,
              excerpt: post.excerpt || generateSummary(post.content, undefined, 80),
              date: post.published_at
                ? new Date(post.published_at).toLocaleDateString('zh-TW')
                : new Date(post.created_at).toLocaleDateString('zh-TW'),
              link: `/blog/${post.id}`,
              meta: getCategoryLabel(post.category) || undefined,
            })
          })
        }

        // 添加人物誌
        if (biosRes.success && biosRes.data) {
          biosRes.data.slice(0, 1).forEach((bio: Biography) => {
            const climbingYears = bio.climbing_start_year
              ? new Date().getFullYear() - parseInt(bio.climbing_start_year)
              : null
            items.push({
              id: bio.id,
              type: 'biography',
              title: bio.name,
              thumbnail: bio.cover_image || bio.avatar_url || null,
              excerpt: bio.climbing_meaning || '探索這位攀岩者的故事',
              date: bio.created_at
                ? new Date(bio.created_at).toLocaleDateString('zh-TW')
                : '',
              link: `/biography/profile/${bio.id}`,
              meta: climbingYears ? `攀岩 ${climbingYears} 年` : undefined,
            })
          })
        }

        // 添加精選影片
        if (Array.isArray(videosRes)) {
          const featuredVideo = videosRes.find((v: VideoType) => v.featured) || videosRes[0]
          if (featuredVideo) {
            items.push({
              id: featuredVideo.id,
              type: 'video',
              title: featuredVideo.title,
              thumbnail: featuredVideo.thumbnailUrl,
              excerpt: featuredVideo.channel,
              date: featuredVideo.publishedAt
                ? new Date(featuredVideo.publishedAt).toLocaleDateString('zh-TW')
                : '',
              link: '/videos',
              meta: featuredVideo.category,
            })
          }
        }

        setContent(items)
      } catch (err) {
        console.error('Failed to fetch content:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
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

  if (content.length === 0) {
    return null
  }

  return (
    <section className="border-t border-[#D2D2D2] py-16 md:py-20">
      <div className="container mx-auto px-4">
        {/* 標題區 */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-[#1B1A1A] md:text-[40px]">最新內容</h2>
            <p className="mt-2 text-base text-[#6D6C6C]">探索攀岩社群的最新動態</p>
          </div>
        </div>

        {/* 內容網格 */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {content.map((item, index) => (
            <ContentCard key={`${item.type}-${item.id}`} item={item} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
