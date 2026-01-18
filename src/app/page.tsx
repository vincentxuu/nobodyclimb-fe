import { Suspense } from 'react'
import dynamic from 'next/dynamic'
// 直接引入避免 barrel file 拉入 framer-motion
import { AboutSection } from '@/components/home/about-section'

// 載入骨架組件 - 使用 CSS spinner 避免在 Server Component 引入 lucide-react
function SectionSkeleton() {
  return (
    <div className="flex min-h-[300px] items-center justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1B1A1A] border-t-transparent" />
    </div>
  )
}

// 動態載入各區塊組件（按需載入，減少初始 bundle 大小）
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

/**
 * 首頁 - 內容導向型設計
 * 使用 Server Component + 動態載入優化性能
 */
export default function HomePage() {
  return (
    <main>
      {/* 人物誌精選 - 放最上面（優先載入） */}
      <Suspense fallback={<SectionSkeleton />}>
        <BiographySection />
      </Suspense>

      {/* 最新文章 */}
      <Suspense fallback={<SectionSkeleton />}>
        <LatestContentSection />
      </Suspense>

      {/* 最新影片 */}
      <Suspense fallback={<SectionSkeleton />}>
        <FeaturedVideosSection />
      </Suspense>

      {/* 探索岩場 */}
      <Suspense fallback={<SectionSkeleton />}>
        <ExploreCragSection />
      </Suspense>

      {/* 相片集精選 */}
      <Suspense fallback={<SectionSkeleton />}>
        <GallerySection />
      </Suspense>

      {/* 關於小人物攀岩（Server Component，直接渲染） */}
      <AboutSection />
    </main>
  )
}
