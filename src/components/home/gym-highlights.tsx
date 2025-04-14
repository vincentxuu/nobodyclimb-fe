'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight, MapPin, Star } from 'lucide-react'
import { useContentStore } from '@/store/contentStore'
import { Gym } from '@/lib/types'
import { Button } from '@/components/ui/button'

/**
 * 攀岩館卡片組件
 */
function GymCard({ gym }: { gym: Gym }) {
  return (
    <div className="group rounded-lg border border-border bg-card transition-all hover:shadow-md">
      <div className="relative h-40 overflow-hidden rounded-t-lg">
        <Image
          src={gym.coverImage}
          alt={gym.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* 評分 */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-black">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          <span>{gym.rating.toFixed(1)}</span>
          <span className="text-muted-foreground">({gym.reviews})</span>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="mb-1 text-lg font-semibold">
          <Link href={`/gym/${gym.slug}`} className="hover:text-primary">
            {gym.name}
          </Link>
        </h3>
        
        <div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span className="truncate">{gym.address}</span>
        </div>
        
        <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
          {gym.description}
        </p>
        
        {/* 設施標籤 */}
        <div className="mb-3 flex flex-wrap gap-2">
          {gym.facilities?.slice(0, 3).map((facility) => (
            <span
              key={facility}
              className="rounded-full bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
            >
              {facility}
            </span>
          ))}
          {gym.facilities && gym.facilities.length > 3 && (
            <span className="rounded-full bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
              +{gym.facilities.length - 3}
            </span>
          )}
        </div>
        
        <Link href={`/gym/${gym.slug}`}>
          <Button size="sm" variant="outline" className="w-full">
            查看詳情
          </Button>
        </Link>
      </div>
    </div>
  )
}

/**
 * 首頁攀岩館亮點組件
 * 展示精選的攀岩館
 */
export function GymHighlights() {
  const { featuredGyms, gymsLoading, fetchFeaturedGyms } = useContentStore()
  
  useEffect(() => {
    fetchFeaturedGyms()
  }, [fetchFeaturedGyms])
  
  return (
    <section className="bg-muted/40 py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <motion.h2
            className="text-3xl font-bold tracking-tight"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            熱門攀岩館
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Button variant="ghost" asChild>
              <Link href="/gym" className="group flex items-center gap-1">
                查看全部
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </motion.div>
        </div>
        
        {gymsLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <motion.div 
                key={i} 
                className="h-72 animate-pulse rounded-lg bg-muted"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredGyms.map((gym, index) => (
              <motion.div 
                key={gym.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <GymCard gym={gym} />
              </motion.div>
            ))}
          </div>
        )}
        
        {/* 加入新攀岩館提示 */}
        <motion.div 
          className="mt-12 rounded-lg bg-gradient-to-r from-primary/20 to-secondary/20 p-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3 className="mb-2 text-xl font-semibold">發現新的攀岩場所？</h3>
          <p className="mb-4 text-muted-foreground">
            幫助社群成長！分享你知道的攀岩館資訊，讓更多攀岩愛好者受益。
          </p>
          <Button asChild>
            <Link href="/gym/add">新增攀岩館</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
