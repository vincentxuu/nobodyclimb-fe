'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import {
  Mountain,
  Users,
  BookOpen,
  MapPin,
  Video,
  Camera,
  FileText,
  Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageTransition } from '@/components/shared/page-transition'

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
  return (
    <section className="relative h-[60vh] min-h-[400px] overflow-hidden">
      {/* 背景圖片 */}
      <div className="absolute inset-0">
        <Image
          src="/photo/cont-intro.jpeg"
          alt="攀岩背景"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
      </div>

      {/* 內容 */}
      <div className="container relative z-10 mx-auto flex h-full flex-col items-center justify-center px-4 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-bold text-white md:text-5xl lg:text-6xl"
        >
          小人物攀岩
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-2 text-xl font-light tracking-wider text-white/90 md:text-2xl"
        >
          NobodyClimb
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="my-6 h-1 w-16 bg-[#FFE70C]"
        />
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="max-w-xl text-lg text-white/80 md:text-xl"
        >
          每個 Nobody 都有屬於自己的攀岩故事
        </motion.p>
      </div>
    </section>
  )
}

// Our Story Section
function StorySection() {
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
            <h2 className="text-3xl font-bold text-[#1B1A1A] md:text-4xl">故事起源</h2>
            <div className="my-4 h-1 w-12 bg-[#1B1A1A]" />
            <div className="space-y-4 text-[#3F3D3D]">
              <p className="text-lg leading-relaxed">
                「小人物攀岩」緣起於一個 Nobody 對攀岩的熱愛。
              </p>
              <p className="leading-relaxed">
                在攀岩的路上，我們都是小人物。不論你是剛踏入岩館的新手，還是征戰各大岩場的老手，每個人都有屬於自己的故事、自己的掙扎、自己的突破。
              </p>
              <p className="leading-relaxed">
                我們希望打造一個平台，讓每位攀岩愛好者都能找到資訊、分享故事、建立連結。因為在這裡，每個 Nobody 都值得被看見。
              </p>
            </div>
          </motion.div>

          {/* 圖片 */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative aspect-[4/3] overflow-hidden rounded-lg"
          >
            <Image
              src="/photo/cover-photo.jpeg"
              alt="攀岩故事"
              fill
              className="object-cover"
            />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// Mission Section
function MissionSection() {
  const missions = [
    {
      icon: Mountain,
      title: '推廣攀岩',
      description: '降低入門門檻，提供完整的岩場資訊與攻略，讓更多人認識並愛上攀岩運動。',
    },
    {
      icon: Users,
      title: '建立社群',
      description: '連結台灣各地的攀岩愛好者，創造交流與分享的空間，一起成長進步。',
    },
    {
      icon: BookOpen,
      title: '記錄故事',
      description: '透過人物誌與部落格，記錄每位攀岩者的珍貴回憶與獨特經歷。',
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
          <h2 className="text-3xl font-bold text-[#1B1A1A] md:text-4xl">我們的使命</h2>
          <div className="mx-auto my-4 h-1 w-12 bg-[#1B1A1A]" />
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
              key={mission.title}
              variants={fadeInUp}
              className="rounded-lg bg-white p-8 text-center shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#1B1A1A]">
                <mission.icon className="h-8 w-8 text-[#FFE70C]" />
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
  const features = [
    {
      icon: MapPin,
      title: '岩場探索',
      description: '台灣各地天然岩場的完整資訊與路線資料',
      href: '/crag',
    },
    {
      icon: Users,
      title: '人物誌',
      description: '記錄攀岩者們的故事與心路歷程',
      href: '/biography',
    },
    {
      icon: Video,
      title: '攀岩影片',
      description: '精選攀岩教學與紀錄影片',
      href: '/videos',
    },
    {
      icon: Camera,
      title: '相片集',
      description: '捕捉攀岩的精彩瞬間',
      href: '/gallery',
    },
    {
      icon: FileText,
      title: '部落格',
      description: '攀岩知識、心得與攻略分享',
      href: '/blog',
    },
    {
      icon: Building2,
      title: '岩館資訊',
      description: '全台室內攀岩館完整指南',
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
          <h2 className="text-3xl font-bold text-[#1B1A1A] md:text-4xl">平台功能</h2>
          <div className="mx-auto my-4 h-1 w-12 bg-[#1B1A1A]" />
          <p className="mx-auto max-w-2xl text-[#6D6C6C]">
            從入門到進階，提供你攀岩旅程所需的一切資源
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={fadeInUp}>
              <Link
                href={feature.href}
                className="group flex items-start gap-4 rounded-lg border border-[#E5E5E5] bg-white p-6 transition-all hover:border-[#1B1A1A] hover:shadow-md"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-[#F5F5F5] transition-colors group-hover:bg-[#1B1A1A]">
                  <feature.icon className="h-6 w-6 text-[#1B1A1A] transition-colors group-hover:text-[#FFE70C]" />
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

// Stats Section
function StatsSection() {
  const stats = [
    { value: '5', label: '個岩場', suffix: '+' },
    { value: '600', label: '條路線', suffix: '+' },
    { value: '50', label: '篇人物誌', suffix: '+' },
    { value: '100', label: '部影片', suffix: '+' },
  ]

  return (
    <section className="bg-[#1B1A1A] py-16 md:py-20">
      <div className="container mx-auto px-4">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="grid grid-cols-2 gap-8 md:grid-cols-4"
        >
          {stats.map((stat) => (
            <motion.div key={stat.label} variants={fadeInUp} className="text-center">
              <div className="text-4xl font-bold text-[#FFE70C] md:text-5xl">
                {stat.value}
                <span className="text-2xl md:text-3xl">{stat.suffix}</span>
              </div>
              <div className="mt-2 text-white/80">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// CTA Section
function CTASection() {
  return (
    <section className="bg-[#F5F5F5] py-16 md:py-24">
      <div className="container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold text-[#1B1A1A] md:text-4xl">
            成為小人物的一份子
          </h2>
          <div className="mx-auto my-4 h-1 w-12 bg-[#1B1A1A]" />
          <p className="mx-auto mb-8 max-w-xl text-[#6D6C6C]">
            加入我們的社群，和其他攀岩愛好者一起分享、學習、成長
          </p>

          <div className="flex flex-col items-center gap-6">
            <Link href="/auth/register">
              <Button className="h-12 bg-[#1B1A1A] px-8 text-base text-white hover:bg-[#3F3D3D]">
                立即加入
              </Button>
            </Link>
          </div>
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
