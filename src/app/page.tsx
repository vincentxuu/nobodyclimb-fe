'use client'

import {
  Hero,
  FeaturedPosts,
  BiographySection,
  GallerySection,
  AboutSection,
} from '@/components/home'
import { PageTransition } from '@/components/shared/page-transition'

export default function HomePage() {
  return (
    <PageTransition>
      <Hero />
      <BiographySection />
      <FeaturedPosts />
      <GallerySection />
      <AboutSection />
    </PageTransition>
  )
}
