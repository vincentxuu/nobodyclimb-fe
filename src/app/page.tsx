'use client'

import {
  BiographySection,
  LatestContentSection,
  FeaturedVideosSection,
  ExploreCragSection,
  GallerySection,
  AboutSection,
} from '@/components/home'
import { PageTransition } from '@/components/shared/page-transition'

/**
 * 首頁 - 內容導向型設計
 * 移除大型 Hero，直接展示內容
 */
export default function HomePage() {
  return (
    <PageTransition>
      {/* 人物誌精選 - 放最上面 */}
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
    </PageTransition>
  )
}
