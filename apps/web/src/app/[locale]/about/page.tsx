'use client'

import { motion } from 'framer-motion'
import {
  BookOpen,
  Building2,
  Camera,
  FileText,
  MapPin,
  MountainSnow,
  Users,
  Video,
} from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { PageTransition } from '@/components/shared/page-transition'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { useAboutStats } from '@/lib/hooks/useAboutStats'

// 動畫配置
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

// Hero Section
function HeroSection() {
  const t = useTranslations('AboutPage')
  return (
    <section className="relative h-[60vh] min-h-[400px] overflow-hidden">
      {/* 背景 */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1B1A1A] to-[#3F3D3D]" />

      {/* 內容 */}
      <div className="container relative z-10 mx-auto flex h-full flex-col items-center justify-center px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Image
            src="/logo/Nobodylimb-white.svg"
            alt={t('brandLogoAlt')}
            width={280}
            height={80}
            className="mx-auto"
            priority
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="my-6 h-1 w-16 bg-brand-accent"
        />
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-xl text-lg text-white/80 md:text-xl"
        >
          {t('heroTagline')}
        </motion.p>
      </div>
    </section>
  )
}

// Our Story Section
function StorySection() {
  const t = useTranslations('AboutPage')
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* 文字內容 */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-[#1B1A1A] md:text-4xl">{t('storyTitle')}</h2>
            <div className="my-4 h-1 w-12 bg-[#1B1A1A]" />
            <div className="space-y-4 text-[#3F3D3D]">
              <p className="text-lg leading-relaxed">{t('storyParagraph1')}</p>
              <p className="leading-relaxed">{t('storyParagraph2')}</p>
              <p className="leading-relaxed">{t('storyParagraph3')}</p>
            </div>
          </motion.div>

          {/* Logo 區塊 */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex aspect-[4/3] items-center justify-center"
          >
            <Image src="/logo512.png" alt={t('brandLogoAlt')} width={240} height={240} />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// Mission Section
function MissionSection() {
  const t = useTranslations('AboutPage')
  const missions = [
    {
      id: 'promote',
      icon: MountainSnow,
      title: t('missionPromoteTitle'),
      description: t('missionPromoteDescription'),
      color: 'bg-brand-accent', // 黃色
    },
    {
      id: 'community',
      icon: Users,
      title: t('missionCommunityTitle'),
      description: t('missionCommunityDescription'),
      color: 'bg-brand-accent-hover/60', // 橘色淡化
    },
    {
      id: 'record',
      icon: BookOpen,
      title: t('missionRecordTitle'),
      description: t('missionRecordDescription'),
      color: 'bg-brand-red/50', // 紅色淡化
    },
  ]

  return (
    <section className="bg-[#F5F5F5] py-16 md:py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl font-bold text-[#1B1A1A] md:text-4xl">{t('missionTitle')}</h2>
          <div className="mx-auto my-4 h-1 w-12 bg-brand-accent" />
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="grid gap-8 md:grid-cols-3"
        >
          {missions.map((mission) => (
            <motion.div
              key={mission.id}
              variants={fadeInUp}
              className="rounded-lg bg-white p-8 text-center shadow-sm transition-shadow hover:shadow-md"
            >
              <div
                className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${mission.color}`}
              >
                <mission.icon className="h-8 w-8 text-brand-dark" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-[#1B1A1A]">{mission.title}</h3>
              <p className="text-[#6D6C6C]">{mission.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// Features Section
function FeaturesSection() {
  const t = useTranslations('AboutPage')
  const features = [
    {
      id: 'crag',
      icon: MapPin,
      title: t('featureCragTitle'),
      description: t('featureCragDescription'),
      href: '/crag',
    },
    {
      id: 'biography',
      icon: Users,
      title: t('featureBiographyTitle'),
      description: t('featureBiographyDescription'),
      href: '/biography',
    },
    {
      id: 'videos',
      icon: Video,
      title: t('featureVideosTitle'),
      description: t('featureVideosDescription'),
      href: '/videos',
    },
    {
      id: 'gallery',
      icon: Camera,
      title: t('featureGalleryTitle'),
      description: t('featureGalleryDescription'),
      href: '/gallery',
    },
    {
      id: 'blog',
      icon: FileText,
      title: t('featureBlogTitle'),
      description: t('featureBlogDescription'),
      href: '/blog',
    },
    {
      id: 'gym',
      icon: Building2,
      title: t('featureGymTitle'),
      description: t('featureGymDescription'),
      href: '/gym',
    },
  ]

  return (
    <section className="bg-white py-16 md:py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl font-bold text-[#1B1A1A] md:text-4xl">{t('featuresTitle')}</h2>
          <div className="mx-auto my-4 h-1 w-12 bg-[#1B1A1A]" />
          <p className="mx-auto max-w-2xl text-[#6D6C6C]">{t('featuresSubtitle')}</p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => (
            <motion.div key={feature.id} variants={fadeInUp}>
              <Link
                href={feature.href}
                className="group flex items-start gap-4 rounded-lg border border-[#E5E5E5] bg-white p-6 transition-all hover:border-brand-accent hover:shadow-md"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-[#F5F5F5] transition-colors group-hover:bg-brand-accent">
                  <feature.icon className="h-6 w-6 text-[#1B1A1A] transition-colors group-hover:text-brand-dark" />
                </div>
                <div>
                  <h3 className="mb-1 font-semibold text-[#1B1A1A]">{feature.title}</h3>
                  <p className="text-sm text-[#6D6C6C]">{feature.description}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// Stats Skeleton Component for loading state
function StatsSkeleton() {
  return (
    <div className="flex flex-col items-center">
      <div className="h-12 w-20 animate-pulse rounded bg-brand-dark/20 md:h-14 md:w-24" />
      <div className="mt-2 h-5 w-16 animate-pulse rounded bg-brand-dark/10" />
    </div>
  )
}

// Stats Section
function StatsSection() {
  const t = useTranslations('AboutPage')
  const { stats, isLoading } = useAboutStats()

  const statsConfig = [
    { key: 'gyms' as const, label: t('statGyms'), suffix: '+' },
    { key: 'crags' as const, label: t('statCrags'), suffix: '+' },
    { key: 'routes' as const, label: t('statRoutes'), suffix: '+' },
    { key: 'biographies' as const, label: t('statBiographies'), suffix: '+' },
    { key: 'posts' as const, label: t('statPosts'), suffix: '+' },
    { key: 'videos' as const, label: t('statVideos'), suffix: '+' },
  ]

  return (
    <section className="bg-brand-accent py-16 md:py-20">
      <div className="container mx-auto px-4">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6"
        >
          {statsConfig.map((item) => (
            <motion.div key={item.key} variants={fadeInUp} className="text-center">
              {isLoading ? (
                <StatsSkeleton />
              ) : (
                <>
                  <div className="text-4xl font-bold text-brand-dark md:text-5xl">
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      {stats[item.key]}
                    </motion.span>
                    <span className="text-2xl md:text-3xl">{item.suffix}</span>
                  </div>
                  <div className="mt-2 text-brand-dark/80">{item.label}</div>
                </>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// CTA Section
function CTASection() {
  const t = useTranslations('AboutPage')
  return (
    <section className="bg-[#F5F5F5] py-16 md:py-24">
      <div className="container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center"
        >
          <Image
            src="/logo/Nobodylimb-black.svg"
            alt={t('brandLogoAlt')}
            width={280}
            height={80}
            className="mb-8"
          />
          <h2 className="text-3xl font-bold text-[#1B1A1A] md:text-4xl">{t('ctaTitle')}</h2>
          <div className="mx-auto my-4 h-1 w-12 bg-[#1B1A1A]" />
          <p className="mx-auto mb-8 max-w-xl text-[#6D6C6C]">{t('ctaDescription')}</p>

          <Link href="/auth/register">
            <Button className="h-12 bg-[#1B1A1A] px-8 text-base text-white hover:bg-[#3F3D3D]">
              {t('ctaButton')}
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

// Main About Page
export default function AboutPage() {
  return (
    <PageTransition>
      <HeroSection />
      <StorySection />
      <MissionSection />
      <FeaturesSection />
      <StatsSection />
      <CTASection />
    </PageTransition>
  )
}
