'use client'

import { useState, useMemo } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useGuestSession } from '@/lib/hooks/useGuestSession'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import apiClient from '@/lib/api/client'

import {
  QuestionEditor,
  QuestionList,
  SubmissionComplete,
  EligibilityCheck,
  AlreadyAuthenticated,
  type Question,
  type StoryInput,
} from '@/components/anonymous-share'

type ViewMode = 'list' | 'edit' | 'complete'

export default function AnonymousSharePage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const { session, isEligibleToShare, getSessionId } = useGuestSession()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [stories, setStories] = useState<StoryInput[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [contactEmail, setContactEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{ slug: string; anonymousName: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showEmailInput, setShowEmailInput] = useState(false)

  // 統計
  const stats = useMemo(() => ({
    total: stories.length,
  }), [stories])

  // 已登入用戶
  if (isAuthenticated) {
    return <AlreadyAuthenticated />
  }

  // 未達資格
  if (!isEligibleToShare && session) {
    return <EligibilityCheck session={session} />
  }

  // 完成提交
  if (viewMode === 'complete' && result) {
    return (
      <SubmissionComplete
        slug={result.slug}
        anonymousName={result.anonymousName}
        totalStories={stats.total}
      />
    )
  }

  // 開始編輯某題
  const handleSelectQuestion = (question: Question) => {
    setCurrentQuestion(question)
    setViewMode('edit')
  }

  // 儲存當前題目
  const handleSaveStory = (newStory: StoryInput) => {
    setStories((prev) => {
      const filtered = prev.filter((s) => s.question_id !== newStory.question_id)
      return [...filtered, newStory]
    })
    setCurrentQuestion(null)
    setViewMode('list')
  }

  // 刪除某題
  const handleRemoveStory = (questionId: string) => {
    setStories((prev) => prev.filter((s) => s.question_id !== questionId))
  }

  // 取消編輯
  const handleCancelEdit = () => {
    setCurrentQuestion(null)
    setViewMode('list')
  }

  // 提交
  const handleSubmit = async () => {
    if (stories.length === 0) {
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
        core_stories: stories.filter((s) => s.type === 'core_story'),
        one_liners: stories.filter((s) => s.type === 'one_liner').map((s) => ({
          question_id: s.question_id,
          answer: s.content,
          question_text: s.question_text,
        })),
        stories: stories.filter((s) => s.type === 'story').map((s) => ({
          question_id: s.question_id,
          content: s.content,
          question_text: s.question_text,
          category_id: s.category_id,
        })),
        contact_email: contactEmail || undefined,
      })

      if (response.data.success) {
        setResult({
          slug: response.data.biography.slug,
          anonymousName: response.data.biography.anonymous_name,
        })
        setViewMode('complete')
      } else {
        setError(response.data.error || '提交失敗')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || '提交失敗，請稍後再試')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 編輯模式
  if (viewMode === 'edit' && currentQuestion) {
    const existingContent = stories.find((s) => s.question_id === currentQuestion.id)?.content

    return (
      <QuestionEditor
        question={currentQuestion}
        initialContent={existingContent}
        onSave={handleSaveStory}
        onCancel={handleCancelEdit}
      />
    )
  }

  // 列表模式（主頁面）
  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <header className="sticky top-0 z-10 border-b bg-white">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>返回</span>
          </button>
          <h1 className="font-medium">匿名分享故事</h1>
          <div className="w-12" />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        {/* 問題列表 */}
        <QuestionList
          stories={stories}
          onSelectQuestion={handleSelectQuestion}
          onRemoveStory={handleRemoveStory}
        />

        {/* Email 輸入 */}
        {showEmailInput && (
          <section className="mb-6">
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <label className="block text-sm font-medium text-gray-700">Email（可選）</label>
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
          </section>
        )}

        {/* 錯誤訊息 */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}
      </main>

      {/* 底部操作列 */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-white p-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
          <div className="text-sm text-gray-500">
            {stats.total > 0 ? (
              <span>已填寫 {stats.total} 題</span>
            ) : (
              <span>選擇題目開始分享</span>
            )}
          </div>
          <div className="flex gap-2">
            {!showEmailInput && stories.length > 0 && (
              <Button variant="secondary" size="sm" onClick={() => setShowEmailInput(true)}>
                留 Email
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || stories.length === 0}
              className="min-w-[100px]"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : '匿名發布'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
