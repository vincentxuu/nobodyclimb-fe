'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Loader2, User, Lock, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useGuestSession } from '@/lib/hooks/useGuestSession'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import apiClient from '@/lib/api/client'
import Link from 'next/link'

// 核心故事問題定義
const CORE_STORY_QUESTIONS = [
  {
    id: 'climbing_origin',
    title: '你與攀岩的相遇',
    subtitle: '什麼契機讓你開始攀岩？',
    placeholder: '分享你開始攀岩的故事，無論是朋友介紹、偶然路過岩館，或是某次旅行的體驗...',
  },
  {
    id: 'climbing_meaning',
    title: '攀岩對你來說是什麼',
    subtitle: '攀岩在你生活中扮演什麼角色？',
    placeholder: '可能是一種運動、一種冥想、一種社交方式，或是面對恐懼的練習...',
  },
  {
    id: 'advice_to_self',
    title: '給剛開始攀岩的自己',
    subtitle: '如果能對過去的自己說一句話',
    placeholder: '關於技術、心態、或是攀岩旅程中學到的任何事...',
  },
]

interface StoryInput {
  question_id: string
  content: string
}

export default function AnonymousSharePage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const { session, isEligibleToShare, getSessionId } = useGuestSession()

  const [currentStep, setCurrentStep] = useState(0)
  const [stories, setStories] = useState<StoryInput[]>(
    CORE_STORY_QUESTIONS.map((q) => ({ question_id: q.id, content: '' }))
  )
  const [contactEmail, setContactEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [result, setResult] = useState<{ slug: string; anonymousName: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 已登入用戶導向正常編輯頁面
  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <User className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="mb-2 text-xl font-bold">你已經登入了</h1>
          <p className="mb-6 text-gray-600">
            可以直接在個人頁面編輯你的故事，不需要匿名分享
          </p>
          <Link href="/profile/edit">
            <Button className="w-full">前往編輯我的故事</Button>
          </Link>
        </div>
      </div>
    )
  }

  // 未達資格
  if (!isEligibleToShare && session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
            <Lock className="h-8 w-8 text-yellow-600" />
          </div>
          <h1 className="mb-2 text-xl font-bold">再多看看別人的故事</h1>
          <p className="mb-4 text-gray-600">
            瀏覽更多攀岩者的故事後，就可以開始分享你的故事
          </p>
          <div className="mb-6 rounded-lg bg-gray-100 p-4">
            <p className="text-sm text-gray-500">
              目前進度：已瀏覽 {session.biographyViews} 個故事
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-[#ffe70c] transition-all"
                style={{ width: `${Math.min((session.biographyViews / 3) * 100, 100)}%` }}
              />
            </div>
          </div>
          <Link href="/biography">
            <Button className="w-full">探索攀岩者故事</Button>
          </Link>
        </div>
      </div>
    )
  }

  // 完成提交
  if (isComplete && result) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="mb-2 text-xl font-bold">故事已分享！</h1>
          <p className="mb-2 text-gray-600">你的故事已經以匿名方式發布</p>
          <p className="mb-6 text-lg font-medium text-[#1B1A1A]">
            {result.anonymousName}
          </p>

          <div className="mb-6 rounded-lg bg-yellow-50 p-4 text-left">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">之後想認領這個故事？</p>
                <p className="mt-1 text-sm text-yellow-700">
                  只要用同一個裝置和瀏覽器登入或註冊，系統會自動幫你連結
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Link href={`/biography/${result.slug}`}>
              <Button className="w-full">查看我的故事</Button>
            </Link>
            <Link href="/biography">
              <Button variant="secondary" className="w-full">
                繼續探索其他故事
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  const currentQuestion = CORE_STORY_QUESTIONS[currentStep]
  const currentStory = stories[currentStep]
  const canProceed = currentStory.content.trim().length >= 10
  const isLastStep = currentStep === CORE_STORY_QUESTIONS.length - 1
  const filledCount = stories.filter((s) => s.content.trim().length >= 10).length

  // 更新故事內容
  const handleContentChange = (content: string) => {
    setStories((prev) =>
      prev.map((s, i) => (i === currentStep ? { ...s, content } : s))
    )
  }

  // 提交
  const handleSubmit = async () => {
    const validStories = stories.filter((s) => s.content.trim().length >= 10)
    if (validStories.length === 0) {
      setError('請至少填寫一個故事')
      return
    }

    const sessionId = getSessionId()
    if (!sessionId) {
      setError('Session 遺失，請重新整理頁面')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await apiClient.post('/guest/anonymous/biography', {
        session_id: sessionId,
        core_stories: validStories,
        contact_email: contactEmail || undefined,
      })

      if (response.data.success) {
        setResult({
          slug: response.data.biography.slug,
          anonymousName: response.data.biography.anonymous_name,
        })
        setIsComplete(true)
      } else {
        setError(response.data.error || '提交失敗')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || '提交失敗，請稍後再試')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <button
            onClick={() => currentStep > 0 ? setCurrentStep(currentStep - 1) : router.back()}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">返回</span>
          </button>

          <div className="flex items-center gap-2">
            {CORE_STORY_QUESTIONS.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-8 rounded-full transition-colors ${
                  i < currentStep
                    ? 'bg-[#ffe70c]'
                    : i === currentStep
                    ? 'bg-[#1B1A1A]'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          <div className="w-16 text-right text-sm text-gray-500">
            {currentStep + 1} / {CORE_STORY_QUESTIONS.length}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-2xl px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Question */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[#1B1A1A]">
                {currentQuestion.title}
              </h1>
              <p className="mt-2 text-gray-600">{currentQuestion.subtitle}</p>
            </div>

            {/* Textarea */}
            <textarea
              value={currentStory.content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder={currentQuestion.placeholder}
              className="min-h-[200px] w-full resize-none rounded-xl border border-gray-200 p-4 text-lg leading-relaxed focus:border-[#ffe70c] focus:outline-none focus:ring-2 focus:ring-[#ffe70c]/20"
              autoFocus
            />

            {/* Character count */}
            <div className="mt-2 flex justify-between text-sm">
              <span className={currentStory.content.length < 10 ? 'text-gray-400' : 'text-green-600'}>
                {currentStory.content.length < 10
                  ? `還需要 ${10 - currentStory.content.length} 個字`
                  : '已達最低字數'}
              </span>
              <span className="text-gray-400">{currentStory.content.length} 字</span>
            </div>

            {/* Email input (optional, on last step) */}
            {isLastStep && (
              <div className="mt-6 rounded-lg bg-gray-100 p-4">
                <label className="block text-sm font-medium text-gray-700">
                  Email（可選）
                </label>
                <p className="mb-2 text-xs text-gray-500">
                  留下 email，之後用同一個 email 註冊就能自動認領
                </p>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#ffe70c] focus:outline-none"
                />
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-white p-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
          <div className="text-sm text-gray-500">
            已填寫 {filledCount} / {CORE_STORY_QUESTIONS.length} 題
          </div>

          <div className="flex gap-2">
            {!isLastStep ? (
              <>
                <Button
                  variant="secondary"
                  onClick={() => setCurrentStep(currentStep + 1)}
                >
                  跳過
                </Button>
                <Button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={!canProceed}
                >
                  下一題
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || filledCount === 0}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  '匿名發布'
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
