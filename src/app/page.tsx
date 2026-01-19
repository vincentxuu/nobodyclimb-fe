'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// 載入骨架組件
function SectionSkeleton() {
  return (
    <div className="flex min-h-[300px] items-center justify-center py-16">
      <Loader2 className="h-8 w-8 animate-spin text-[#1B1A1A]" />
    </div>
  )
}

// 動態載入各區塊組件（按需載入，減少初始 bundle 大小）
const FunFactSection = dynamic(
  () => import('@/components/home/fun-fact-section').then((mod) => mod.FunFactSection),
  { loading: () => null }
)

const BiographySection = dynamic(
  () => import('@/components/home/biography-section').then((mod) => mod.BiographySection),
  { loading: () => <SectionSkeleton /> }
)

const LatestContentSection = dynamic(
  () => import('@/components/home/latest-content-section').then((mod) => mod.LatestContentSection),
  { loading: () => <SectionSkeleton /> }
)

const FeaturedVideosSection = dynamic(
  () =>
    import('@/components/home/featured-videos-section').then((mod) => mod.FeaturedVideosSection),
  { loading: () => <SectionSkeleton /> }
)

const ExploreCragSection = dynamic(
  () => import('@/components/home/explore-crag-section').then((mod) => mod.ExploreCragSection),
  { loading: () => <SectionSkeleton /> }
)

const GallerySection = dynamic(
  () => import('@/components/home/gallery-section').then((mod) => mod.GallerySection),
  { loading: () => <SectionSkeleton /> }
)

const AboutSection = dynamic(
  () => import('@/components/home/about-section').then((mod) => mod.AboutSection),
  { loading: () => <SectionSkeleton /> }
)

/**
 * 首頁 - 內容導向型設計
 * 使用動態載入優化初始載入速度
 */
export default function HomePage() {
  return (
    <main>
      {/* 趣味冷知識 */}
      <FunFactSection />

      {/* 人物誌精選 */}
      <BiographySection />

      {/* 最新文章 */}
      <LatestContentSection />

      {/* 最新影片 */}
      <FeaturedVideosSection />

      {/* 探索岩場 */}
      <ExploreCragSection />

      {/* 相片集精選 */}
      <GallerySection />

      {/* 關於小人物攀岩 */}
      <AboutSection />
    </main>
  )
}
