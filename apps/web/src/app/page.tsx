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
const HeroIntroSection = dynamic(
  () => import('@/components/home/hero-intro-section').then((mod) => mod.HeroIntroSection),
  { loading: () => null }
)

const FunFactSection = dynamic(
  () => import('@/components/home/fun-fact-section').then((mod) => mod.FunFactSection),
  { loading: () => null }
)

const ExploreCragSection = dynamic(
  () => import('@/components/home/explore-crag-section').then((mod) => mod.ExploreCragSection),
  { loading: () => <SectionSkeleton /> }
)

const FeaturedStoriesSection = dynamic(
  () =>
    import('@/components/home/featured-stories-section').then((mod) => mod.FeaturedStoriesSection),
  { loading: () => <SectionSkeleton /> }
)

const BiographySection = dynamic(
  () => import('@/components/home/biography-section').then((mod) => mod.BiographySection),
  { loading: () => <SectionSkeleton /> }
)

const AboutSection = dynamic(
  () => import('@/components/home/about-section').then((mod) => mod.AboutSection),
  { loading: () => <SectionSkeleton /> }
)

/**
 * 首頁 - 聚焦三大核心功能：查路線 · 看故事 · 寫紀錄
 * 使用動態載入優化初始載入速度
 */
export default function HomePage() {
  return (
    <main>
      {/* 趣味冷知識 */}
      <FunFactSection />

      {/* 網站介紹 */}
      <HeroIntroSection />

      {/* 查路線 - 探索岩場 */}
      <ExploreCragSection />

      {/* 看故事 - 精選故事 */}
      <FeaturedStoriesSection />

      {/* 寫紀錄 - 人物誌 */}
      <BiographySection />

      {/* 關於小人物攀岩 */}
      <AboutSection />
    </main>
  )
}
