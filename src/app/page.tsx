'use client'

import {
  HeroArticle,
  LatestContentSection,
  BiographySection,
  ExploreCragSection,
  FeaturedVideosSection,
  GallerySection,
  AboutSection,
} from '@/components/home'
import { PageTransition } from '@/components/shared/page-transition'

/**
 * 首頁 - 版本 A：內容導向型 (Medium/Substack 風格)
 * 強調內容優先、時間軸流式、閱讀體驗
 */
export default function HomePage() {
  return (
    <PageTransition>
      {/* 精選文章 Hero */}
      <HeroArticle />

      {/* 最新內容區 - 混合展示文章、人物誌、影片 */}
      <LatestContentSection />

      {/* 熱門人物誌 */}
      <BiographySection />

      {/* 探索岩場 - 地圖視覺化 + 熱門岩場卡片 */}
      <ExploreCragSection />

      {/* 最新影片 - 1大 + 2小佈局 */}
      <FeaturedVideosSection />

      {/* 相片集精選 - Masonry Grid */}
      <GallerySection />

      {/* 關於小人物攀岩 */}
      <AboutSection />
    </PageTransition>
  )
}
