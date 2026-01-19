'use client'

import * as React from 'react'
import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2, HelpCircle } from 'lucide-react'
import { GameCanvas } from '@/components/games/rope-system'
import { CATEGORIES, ROUTES } from '@/lib/games/rope-system/constants'
import { getQuestionsByCategory } from '@/lib/games/rope-system/questions-data'
import type { Question } from '@/lib/games/rope-system/types'

export default function LearnModePage() {
  const params = useParams()
  const router = useRouter()
  const categoryId = params.categoryId as string

  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 取得類別資料
  const category = useMemo(
    () => CATEGORIES.find((c) => c.id === categoryId),
    [categoryId]
  )

  // 載入題目
  useEffect(() => {
    if (!categoryId) return

    const loadQuestions = async () => {
      setIsLoading(true)
      try {
        // 模擬 API 延遲（未來可改為真實 API 呼叫）
        await new Promise((resolve) => setTimeout(resolve, 300))

        // 從題庫取得題目
        const loadedQuestions = getQuestionsByCategory(categoryId)

        if (loadedQuestions.length === 0) {
          router.push(ROUTES.HOME)
          return
        }

        // 隨機打亂題目順序
        setQuestions([...loadedQuestions].sort(() => Math.random() - 0.5))
      } finally {
        setIsLoading(false)
      }
    }

    loadQuestions()
  }, [categoryId, router])

  // 類別不存在
  if (!category) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <HelpCircle className="h-12 w-12 text-[#535353]" />
          </div>
          <h1 className="mb-2 text-xl font-bold text-[#1B1A1A]">
            找不到該類別
          </h1>
          <p className="text-[#535353]">請確認網址是否正確</p>
        </div>
      </div>
    )
  }

  // 載入中
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-[#FFE70C]" />
          <p className="text-[#535353]">正在載入題目...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <GameCanvas
      mode="learn"
      questions={questions}
      category={category}
    />
  )
}
