'use client'

import { Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'

function SectionSkeleton() {
  return (
    <div className="flex min-h-[300px] items-center justify-center py-16">
      <Loader2 className="h-8 w-8 animate-spin text-[#1B1A1A]" />
    </div>
  )
}

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

export default function HomeClient() {
  return (
    <main>
      <FunFactSection />
      <HeroIntroSection />
      <ExploreCragSection />
      <FeaturedStoriesSection />
      <BiographySection />
      <AboutSection />
    </main>
  )
}
