'use client'

import { motion } from 'framer-motion'
import { HelpCircle, Loader2 } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { GameCanvas } from '@/components/games/rope-system'
import { CATEGORIES, ROUTES } from '@/lib/games/rope-system/constants'
import { fetchQuestionsByCategory } from '@/lib/games/rope-system/questions-data'
import type { Question } from '@/lib/games/rope-system/types'

export default function LearnModePage() {
  const t = useTranslations('GamesPage')
  const params = useParams()
  const router = useRouter()
  const categoryId = params.categoryId as string

  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 取得類別資料
  const category = useMemo(() => CATEGORIES.find((c) => c.id === categoryId), [categoryId])

  // 載入題目
  useEffect(() => {
    if (!categoryId) return

    const loadQuestions = async () => {
      setIsLoading(true)
      try {
        // 從靜態 JSON 檔案載入題目
        const loadedQuestions = await fetchQuestionsByCategory(categoryId)

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
          <h1 className="mb-2 text-xl font-bold text-[#1B1A1A]">{t('notFoundCategory')}</h1>
          <p className="text-[#535353]">{t('checkUrl')}</p>
        </div>
      </div>
    )
  }

  // 載入中
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-[#FFE70C]" />
          <p className="text-[#535353]">{t('loadingQuestions')}</p>
        </motion.div>
      </div>
    )
  }

  return <GameCanvas mode="learn" questions={questions} category={category} />
}
