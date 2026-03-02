'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'

// 文章類型定義
type Post = {
  id: number
  title: string
  slug: string
  coverImage: string
}

// 探索區塊文章資料
const explorePosts: Post[] = [
  {
    id: 1,
    title: '裝備介紹',
    slug: 'equipment-intro',
    coverImage: '/photo/blog-left.jpeg',
  },
  {
    id: 2,
    title: '技巧介紹',
    slug: 'technique-intro',
    coverImage: '/photo/blog-mid-left.jpg',
  },
  {
    id: 3,
    title: '技術研究',
    slug: 'technical-research',
    coverImage: '/photo/blog-mid-right.jpg',
  },
  {
    id: 4,
    title: '比賽介紹',
    slug: 'competition-intro',
    coverImage: '/photo/blog-right.jpg',
  },
]

/**
 * 探索卡片組件
 */
function ExploreCard({ post }: { post: Post }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block h-full">
      <div className="relative aspect-[1/1] overflow-hidden">
        <Image
          src={post.coverImage}
          alt={post.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          className="object-cover"
          priority={post.id === 1}
          loading={post.id === 1 ? 'eager' : 'lazy'}
        />

        {/* 黃色漸層遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#FFE70C] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="absolute inset-0 bg-black/40" />

        {/* 標題 */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h3 className="text-center font-['Noto_Sans_CJK_TC'] text-[26px] font-medium text-white">
            {post.title}
          </h3>
        </div>
      </div>
    </Link>
  )
}

/**
 * 探索攀岩區塊組件
 */
export function FeaturedPosts() {
  return (
    <section className="border-t border-[#D2D2D2] py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h2 className="font-['Noto_Sans_TC'] text-[40px] font-medium text-[#1B1A1A]">探索攀岩</h2>
          <p className="mt-4 font-['Noto_Sans_CJK_TC'] text-base font-normal tracking-[0.01em] text-[#6D6C6C]">
            關於攀岩的各種知識和故事
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {explorePosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <ExploreCard post={post} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
