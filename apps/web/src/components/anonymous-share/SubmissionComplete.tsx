'use client'

import { motion } from 'framer-motion'
import { Check, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface SubmissionCompleteProps {
  slug: string
  anonymousName: string
  totalStories: number
}

/**
 * 提交成功頁面組件
 * 顯示匿名故事發布成功後的資訊
 */
export function SubmissionComplete({
  slug,
  anonymousName,
  totalStories,
}: SubmissionCompleteProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="mb-2 text-xl font-bold">故事已分享！</h1>
        <p className="mb-2 text-gray-600">你的故事已經以匿名方式發布</p>
        <p className="mb-2 text-lg font-medium text-[#1B1A1A]">{anonymousName}</p>
        <p className="mb-6 text-sm text-gray-500">共 {totalStories} 則故事</p>

        <div className="mb-6 rounded-lg bg-yellow-50 p-4 text-left">
          <div className="flex items-start gap-2">
            <Sparkles className="mt-0.5 h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800">之後想認領這個故事？</p>
              <p className="mt-1 text-sm text-yellow-700">
                用同一個裝置和瀏覽器登入，系統會自動幫你連結
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Link href={`/biography/${slug}`}>
            <Button className="w-full">查看我的故事</Button>
          </Link>
          <Link href="/biography">
            <Button variant="secondary" className="w-full">繼續探索其他故事</Button>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
