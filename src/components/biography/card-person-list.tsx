'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRightCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

// 相關文章資料
const relatedArticles = [
  {
    id: 1,
    title: "冰攀初體驗",
    author: "謝璿",
    date: "2023.02.15",
    description: "第一次體驗冰攀，在冰凍的瀑布上攀登，是一種全新的感受...",
    imageSrc: "/photo/blog-left.jpeg"
  },
  {
    id: 2,
    title: "長程攀登：心得與準備",
    author: "小若",
    date: "2023.01.20",
    description: "準備一次長程攀登需要什麼？分享我的準備清單和心得...",
    imageSrc: "/photo/blog-mid-left.jpeg"
  },
  {
    id: 3,
    title: "攀岩訓練與身體調適",
    author: "一路",
    date: "2023.03.05",
    description: "如何安排訓練計畫，讓身體達到最佳攀岩狀態...",
    imageSrc: "/photo/blog-mid-right.jpeg"
  }
];

interface RelatedArticleCardProps {
  article: typeof relatedArticles[0];
}

function RelatedArticleCard({ article }: RelatedArticleCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-full"
    >
      <Link href={`/blog/${article.id}`} className="block h-full">
        <Card className="h-full overflow-hidden hover:shadow-md transition-shadow duration-300">
          <div className="relative h-[200px] overflow-hidden">
            <Image
              src={article.imageSrc}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-500 hover:scale-105"
            />
          </div>
          
          <CardContent className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-[#1B1A1A]">{article.title}</h3>
                <p className="text-sm text-[#8E8C8C]">{article.author} | {article.date}</p>
              </div>
              <ArrowRightCircle size={20} className="text-gray-400" />
            </div>
            
            <p className="text-sm text-[#1B1A1A] line-clamp-2">{article.description}</p>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}

export function CardPersonList() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {relatedArticles.map((article) => (
        <RelatedArticleCard key={article.id} article={article} />
      ))}
    </div>
  )
}
