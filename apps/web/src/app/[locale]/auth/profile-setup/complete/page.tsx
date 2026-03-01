'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { PageTransition } from '@/components/shared/page-transition'
import { Check, Edit3, Home, User, Sparkles, ArrowRight } from 'lucide-react'
import { GuidedQuestions, ChoiceQuestion } from '@/components/onboarding'
import { biographyService } from '@/lib/api/services'
import { useQuestions, useChoiceQuestions, useSubmitChoiceAnswer } from '@/lib/hooks/useQuestions'
import { useToast } from '@/components/ui/use-toast'
import { buildOneLinersData } from '@/lib/utils/biography'

// 引導式問答的問題（從一句話問題中選取幾個容易回答的）
const GUIDED_QUESTIONS_CONFIG = [
  {
    id: 'best_moment',
    category: '攀岩的樂趣',
  },
  {
    id: 'current_goal',
    category: '目標與挑戰',
  },
  {
    id: 'climbing_takeaway',
    category: '成長與收穫',
  },
]

// 流程階段
type FlowPhase = 'complete' | 'choice' | 'guided'

export default function CompletePage() {
  const router = useRouter()
  const { status, isLoading } = useAuth()
  const { toast } = useToast()
  const { data: questionsData } = useQuestions()
  const { data: choiceQuestions } = useChoiceQuestions()
  const submitChoiceAnswer = useSubmitChoiceAnswer()
  const [flowPhase, setFlowPhase] = useState<FlowPhase>('complete')
  const [currentChoiceIndex, setCurrentChoiceIndex] = useState(0)
  const [isSaving, setIsSaving] = useState(false)

  // 取得當前用戶的 biography
  const { data: myBiography } = useQuery({
    queryKey: ['my-biography'],
    queryFn: async () => {
      const response = await biographyService.getMyBiography()
      return response.data
    },
    enabled: status === 'signIn',
  })

  useEffect(() => {
    if (!isLoading && status !== 'signIn') {
      router.push('/auth/login')
    }
  }, [status, isLoading, router])

  // 從 API 題目中匹配引導式問答的問題
  const guidedQuestions = React.useMemo(() => {
    if (!questionsData) return []

    return GUIDED_QUESTIONS_CONFIG.map((config) => {
      // 先從一句話問題中找
      const oneLiner = questionsData.oneLiners.find((q) => q.id === config.id)
      if (oneLiner) {
        return {
          id: oneLiner.id,
          question: oneLiner.question,
          subtitle: oneLiner.format_hint || undefined,
          placeholder: oneLiner.placeholder || undefined,
          type: 'text' as const,
          category: config.category,
        }
      }

      // 從核心故事中找
      const coreStory = questionsData.coreStories.find((q) => q.id === config.id)
      if (coreStory) {
        return {
          id: coreStory.id,
          question: coreStory.title,
          subtitle: coreStory.subtitle || undefined,
          placeholder: coreStory.placeholder || undefined,
          type: 'textarea' as const,
          category: config.category,
        }
      }

      return null
    }).filter((q): q is NonNullable<typeof q> => q !== null)
  }, [questionsData])

  // 開始引導流程：先選擇題，再一句話
  const handleStartGuided = () => {
    if (choiceQuestions && choiceQuestions.length > 0) {
      setFlowPhase('choice')
      setCurrentChoiceIndex(0)
    } else {
      setFlowPhase('guided')
    }
  }

  // 處理選擇題提交
  const handleChoiceSubmit = useCallback(
    async (optionId: string, customText?: string, followUpText?: string) => {
      if (!myBiography?.id) {
        throw new Error('Biography not found')
      }

      const currentQuestion = choiceQuestions?.[currentChoiceIndex]
      if (!currentQuestion) {
        throw new Error('Question not found')
      }

      const result = await submitChoiceAnswer.mutateAsync({
        biographyId: myBiography.id,
        questionId: currentQuestion.id,
        optionId,
        customText,
        followUpText,
      })

      return {
        responseMessage: result?.response_message || '感謝你的回答！',
        communityCount: result?.community_count || 1,
      }
    },
    [myBiography?.id, choiceQuestions, currentChoiceIndex, submitChoiceAnswer]
  )

  // 選擇題完成後，進入下一題或一句話問答
  const handleChoiceComplete = useCallback(() => {
    if (choiceQuestions && currentChoiceIndex < choiceQuestions.length - 1) {
      setCurrentChoiceIndex((prev) => prev + 1)
    } else {
      // 選擇題都完成了，進入一句話問答
      if (guidedQuestions.length > 0) {
        setFlowPhase('guided')
      } else {
        router.push('/profile')
      }
    }
  }, [choiceQuestions, currentChoiceIndex, guidedQuestions.length, router])

  // 跳過選擇題
  const handleChoiceSkip = useCallback(() => {
    // 跳過所有選擇題，進入一句話問答
    if (guidedQuestions.length > 0) {
      setFlowPhase('guided')
    } else {
      setFlowPhase('complete')
    }
  }, [guidedQuestions.length])

  const handleGuidedComplete = useCallback(
    async (answers: Record<string, string>) => {
      setIsSaving(true)
      try {
        const oneLinersData = buildOneLinersData(answers)

        if (Object.keys(oneLinersData).length > 0) {
          await biographyService.updateBiography({
            one_liners_data: JSON.stringify(oneLinersData),
          })

          toast({
            title: '回答已儲存',
            description: '你的人物誌已更新',
            variant: 'default',
          })
        }

        router.push('/profile')
      } catch (error) {
        console.error('Failed to save guided answers:', error)
        toast({
          title: '儲存失敗',
          description: '請稍後再試',
          variant: 'destructive',
        })
      } finally {
        setIsSaving(false)
      }
    },
    [router, toast]
  )

  const handleGuidedSkip = useCallback(() => {
    setFlowPhase('complete')
  }, [])

  const handleGoToEditor = () => {
    router.push('/profile')
  }

  const handleGoToProfile = () => {
    router.push('/profile')
  }

  const handleGoToHome = () => {
    router.push('/')
  }

  // 顯示選擇題
  if (flowPhase === 'choice' && choiceQuestions && choiceQuestions.length > 0) {
    const currentQuestion = choiceQuestions[currentChoiceIndex]
    if (currentQuestion) {
      return (
        <PageTransition>
          <div className="min-h-screen bg-white">
            <ChoiceQuestion
              question={currentQuestion}
              onSubmit={handleChoiceSubmit}
              onSkip={handleChoiceSkip}
              onComplete={handleChoiceComplete}
            />
          </div>
        </PageTransition>
      )
    }
  }

  // 顯示引導式問答
  if (flowPhase === 'guided' && guidedQuestions.length > 0) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-white">
          {isSaving ? (
            <div className="flex min-h-screen items-center justify-center">
              <div className="text-center">
                <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-primary mx-auto" />
                <p className="text-[#6D6C6C]">正在儲存...</p>
              </div>
            </div>
          ) : (
            <GuidedQuestions
              questions={guidedQuestions}
              onComplete={handleGuidedComplete}
              onSkip={handleGuidedSkip}
              title="讓更多人認識你"
              subtitle="回答幾個簡單的問題，讓你的人物誌更加完整"
            />
          )}
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* 步驟指示器 */}
        <div className="mb-8">
          <div className="flex justify-center">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                  <Check size={16} />
                </div>
                <span className="mt-2 text-xs sm:text-sm">基本資料</span>
              </div>
              <div className="h-1 w-8 sm:w-12 bg-primary"></div>
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                  <Check size={16} />
                </div>
                <span className="mt-2 text-xs sm:text-sm">標籤</span>
              </div>
              <div className="h-1 w-8 sm:w-12 bg-primary"></div>
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                  <Check size={16} />
                </div>
                <span className="mt-2 text-xs sm:text-sm">一句話</span>
              </div>
              <div className="h-1 w-8 sm:w-12 bg-primary"></div>
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                  4
                </div>
                <span className="mt-2 text-xs sm:text-sm">完成</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-12 flex flex-col items-center justify-center space-y-6 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-white">
              <Check size={36} />
            </div>
          </div>

          <h1 className="text-3xl font-bold">註冊完成！</h1>

          <p className="max-w-md text-gray-600">
            你的攀岩人物誌已經建立，現在可以開始探索 NobodyClimb 平台，
            與其他岩友互動交流。
          </p>

          {/* 引導式問答提示卡片 */}
          {guidedQuestions.length > 0 && (
            <div className="w-full max-w-md rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-5 text-left">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/20 p-2">
                  <Sparkles size={20} className="text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">再多回答幾個問題？</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    只需要 2 分鐘，讓其他岩友更了解你！
                  </p>
                  <Button
                    onClick={handleStartGuided}
                    className="mt-3 gap-1.5 bg-primary text-white hover:bg-primary/90"
                    size="sm"
                  >
                    <Sparkles size={14} />
                    開始回答
                    <ArrowRight size={14} />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* 原有提示卡片 */}
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-gray-100 p-2">
                <Edit3 size={20} className="text-gray-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">想讓人物誌更豐富？</h3>
                <p className="mt-1 text-sm text-gray-600">
                  你可以隨時到編輯器補充更多內容，包括深度故事、攀岩足跡等。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 按鈕區 */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            type="button"
            onClick={handleGoToEditor}
            className="rounded-lg px-6 py-3 text-white"
          >
            <Edit3 size={18} className="mr-2" />
            繼續編輯人物誌
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleGoToProfile}
            className="rounded-lg border-gray-300 px-6 py-3"
          >
            <User size={18} className="mr-2" />
            查看個人檔案
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={handleGoToHome}
            className="rounded-lg px-6 py-3"
          >
            <Home size={18} className="mr-2" />
            回到首頁
          </Button>
        </div>
      </div>
    </PageTransition>
  )
}
