'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { PageTransition } from '@/components/shared/page-transition'
import { useToast } from '@/components/ui/use-toast'
import { biographyService } from '@/lib/api/services'
import { cn } from '@/lib/utils'
import { useQuestions } from '@/lib/hooks/useQuestions'

// 核心故事問題 ID（固定）
const CORE_STORY_IDS = {
  CLIMBING_ORIGIN: 'climbing_origin',
  CLIMBING_MEANING: 'climbing_meaning',
  ADVICE_TO_SELF: 'advice_to_self',
} as const

interface OneLinerFormData {
  [key: string]: string
}

export default function SelfIntroPage() {
  const router = useRouter()
  const { status, isLoading } = useAuth()
  const { toast } = useToast()
  const { data: questionsData, isLoading: questionsLoading } = useQuestions()

  const [formData, setFormData] = useState<OneLinerFormData>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPublic, setIsPublic] = useState(true)

  // 從 API 取得核心故事問題
  const questionsToShow = questionsData?.coreStories || []

  useEffect(() => {
    // 如果使用者未登入，重定向至登入頁面
    if (!isLoading && status !== 'signIn') {
      router.push('/auth/login')
    }
  }, [status, isLoading, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // 直接傳核心故事欄位到後端（存到獨立表 biography_core_stories）
      await biographyService.updateBiography({
        climbing_origin: formData[CORE_STORY_IDS.CLIMBING_ORIGIN]?.trim() || undefined,
        climbing_meaning: formData[CORE_STORY_IDS.CLIMBING_MEANING]?.trim() || undefined,
        advice_to_self: formData[CORE_STORY_IDS.ADVICE_TO_SELF]?.trim() || undefined,
        visibility: isPublic ? 'public' : 'private',
      })

      toast({
        title: '自我介紹已儲存',
        description: '您的個人資料已成功更新',
        variant: 'default',
      })

      // 導航到完成頁面
      router.push('/auth/profile-setup/complete')
    } catch (error) {
      console.error('更新資料失敗', error)
      toast({
        title: '更新失敗',
        description: '更新資料時發生錯誤，請稍後再試',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 計算已填寫的問題數量
  const filledCount = Object.values(formData).filter((v) => v.trim()).length

  return (
    <PageTransition>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* 步驟指示器 */}
        <div className="mb-8">
          <div className="flex justify-center">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                  1
                </div>
                <span className="mt-2 text-xs sm:text-sm">基本資料</span>
              </div>
              <div className="h-1 w-8 sm:w-12 bg-primary"></div>
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                  2
                </div>
                <span className="mt-2 text-xs sm:text-sm">標籤</span>
              </div>
              <div className="h-1 w-8 sm:w-12 bg-primary"></div>
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                  3
                </div>
                <span className="mt-2 text-xs sm:text-sm">一句話</span>
              </div>
              <div className="h-1 w-8 sm:w-12 bg-gray-300"></div>
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-gray-600">
                  4
                </div>
                <span className="mt-2 text-xs sm:text-sm text-gray-500">完成</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">用一句話回答</h1>
          <p className="mt-2 text-gray-600">
            不用想太多，簡短回答就好
          </p>
          {filledCount > 0 && (
            <span className="mt-2 inline-block text-sm text-primary">
              已填寫 {filledCount}/{questionsToShow.length} 題
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 核心故事問題列表 */}
          {questionsLoading ? (
            <div className="text-center py-8 text-gray-500">載入中...</div>
          ) : (
            questionsToShow.map((question) => (
              <div key={question.id} className="space-y-2">
                <label className="text-gray-700 font-medium">
                  {question.title}
                </label>
                {question.subtitle && (
                  <p className="text-xs text-gray-500">{question.subtitle}</p>
                )}
                <input
                  type="text"
                  name={question.id}
                  value={formData[question.id] || ''}
                  onChange={handleChange}
                  placeholder={question.placeholder || ''}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                />
              </div>
            ))
          )}

          {/* 公開分享選項 */}
          <div className="flex items-center space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={cn(
                'h-5 w-5 rounded border-2 flex items-center justify-center transition-colors',
                isPublic
                  ? 'bg-primary border-primary text-white'
                  : 'bg-white border-gray-300 hover:border-primary'
              )}
            >
              {isPublic && (
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
            <label
              htmlFor="isPublic"
              className="text-gray-700 cursor-pointer select-none"
              onClick={() => setIsPublic(!isPublic)}
            >
              我願意將人物誌公開
            </label>
          </div>

          {/* 按鈕區 */}
          <div className="pt-4">
            <Button
              type="submit"
              className="w-full rounded-lg py-3 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? '處理中...' : '完成'}
            </Button>
          </div>
        </form>
      </div>
    </PageTransition>
  )
}
