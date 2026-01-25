'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Check,
  Loader2,
  User,
  Lock,
  Sparkles,
  Plus,
  X,
  ChevronRight,
  Pen,
  MessageCircle,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useGuestSession } from '@/lib/hooks/useGuestSession'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import apiClient from '@/lib/api/client'
import Link from 'next/link'

// ============================================
// 問題定義
// ============================================

interface Question {
  id: string
  title: string
  subtitle?: string
  placeholder: string
  type: 'core_story' | 'one_liner' | 'story'
  category?: string
  categoryName?: string
}

// 核心故事（3 題）
const CORE_STORIES: Question[] = [
  {
    id: 'climbing_origin',
    title: '你與攀岩的相遇',
    subtitle: '什麼契機讓你開始攀岩？',
    placeholder: '分享你開始攀岩的故事...',
    type: 'core_story',
  },
  {
    id: 'climbing_meaning',
    title: '攀岩對你來說是什麼',
    subtitle: '攀岩在你生活中扮演什麼角色？',
    placeholder: '可能是一種運動、冥想、社交方式...',
    type: 'core_story',
  },
  {
    id: 'advice_to_self',
    title: '給剛開始攀岩的自己',
    subtitle: '如果能對過去的自己說一句話',
    placeholder: '關於技術、心態、或攀岩旅程中學到的事...',
    type: 'core_story',
  },
]

// 一句話（7 題）
const ONE_LINERS: Question[] = [
  { id: 'best_moment', title: '爬岩最爽的是?', placeholder: '終於送出卡了一個月的 project', type: 'one_liner' },
  { id: 'favorite_place', title: '最喜歡在哪裡爬?', placeholder: '龍洞的海邊岩壁', type: 'one_liner' },
  { id: 'current_goal', title: '目前的攀岩小目標?', placeholder: '這個月送出 V4', type: 'one_liner' },
  { id: 'climbing_takeaway', title: '攀岩教會我的一件事?', placeholder: '失敗沒什麼,再來就好', type: 'one_liner' },
  { id: 'climbing_style_desc', title: '用一句話形容你的攀岩風格?', placeholder: '慢慢來但很穩', type: 'one_liner' },
  { id: 'life_outside', title: '攀岩之外,你是誰?', placeholder: '工程師/學生/全職岩棍', type: 'one_liner' },
  { id: 'bucket_list', title: '攀岩人生清單上有什麼?', placeholder: '去優勝美地爬一次', type: 'one_liner' },
]

// 深度故事（精選 12 題，涵蓋各類別）
const STORIES: Question[] = [
  { id: 'memorable_moment', title: '有沒有某次攀爬讓你一直記到現在?', subtitle: '不一定要多厲害,只要對你有意義', placeholder: '去年第一次去龍洞...', type: 'story', category: 'sys_cat_growth', categoryName: '成長與突破' },
  { id: 'biggest_challenge', title: '有遇過什麼卡關的時候嗎?', subtitle: '卡關也是成長的一部分', placeholder: '有一段時間怎麼爬都沒進步...', type: 'story', category: 'sys_cat_growth', categoryName: '成長與突破' },
  { id: 'fear_management', title: '會怕高或怕墜落嗎?怎麼面對的?', subtitle: '每個人都有害怕的時候', placeholder: '剛開始真的很怕...', type: 'story', category: 'sys_cat_psychology', categoryName: '心理與哲學' },
  { id: 'climbing_lesson', title: '攀岩有沒有讓你學到什麼?', subtitle: '可能是對生活的啟發', placeholder: '學會了面對失敗...', type: 'story', category: 'sys_cat_psychology', categoryName: '心理與哲學' },
  { id: 'climbing_mentor', title: '有沒有想感謝的人?', subtitle: '可能是教你的人、一起爬的朋友', placeholder: '很感謝第一個帶我去爬的朋友...', type: 'story', category: 'sys_cat_community', categoryName: '社群與連結' },
  { id: 'funny_moment', title: '有沒有什麼搞笑或尷尬的經歷?', subtitle: '爬岩的糗事也很有趣', placeholder: '有一次在岩館...', type: 'story', category: 'sys_cat_community', categoryName: '社群與連結' },
  { id: 'injury_recovery', title: '有受過傷嗎?怎麼復原的?', subtitle: '分享你的經驗', placeholder: '有一次 A2 滑輪受傷...', type: 'story', category: 'sys_cat_practical', categoryName: '實用分享' },
  { id: 'technique_tip', title: '有沒有學到什麼實用的技巧?', subtitle: '可能是某個動作或心法', placeholder: '學會 heel hook 之後...', type: 'story', category: 'sys_cat_practical', categoryName: '實用分享' },
  { id: 'dream_climb', title: '如果能去任何地方爬,你想去哪?', subtitle: '你的夢想攀岩地點', placeholder: '想去優勝美地爬 El Cap...', type: 'story', category: 'sys_cat_dreams', categoryName: '夢想與探索' },
  { id: 'climbing_trip', title: '有沒有印象深刻的攀岩旅行?', subtitle: '分享你的旅行故事', placeholder: '去泰國的喀比爬了一週...', type: 'story', category: 'sys_cat_dreams', categoryName: '夢想與探索' },
  { id: 'first_outdoor', title: '還記得第一次戶外攀岩嗎?', subtitle: '室內和戶外的差別', placeholder: '第一次站在真的岩壁前...', type: 'story', category: 'sys_cat_growth', categoryName: '成長與突破' },
  { id: 'unexpected_gain', title: '攀岩有帶給你什麼意外的收穫嗎?', subtitle: '可能是你沒想到的好處', placeholder: '認識了很多很棒的朋友...', type: 'story', category: 'sys_cat_psychology', categoryName: '心理與哲學' },
]

const ALL_QUESTIONS = [...CORE_STORIES, ...ONE_LINERS, ...STORIES]

// ============================================
// 類型定義
// ============================================

interface StoryInput {
  question_id: string
  content: string
  type: 'core_story' | 'one_liner' | 'story'
  question_text?: string
  category_id?: string
}

type ViewMode = 'list' | 'edit' | 'complete'

// ============================================
// 主組件
// ============================================

export default function AnonymousSharePage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const { session, isEligibleToShare, getSessionId } = useGuestSession()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [stories, setStories] = useState<StoryInput[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [currentContent, setCurrentContent] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{ slug: string; anonymousName: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showEmailInput, setShowEmailInput] = useState(false)

  // 已回答的問題 ID
  const answeredIds = useMemo(() => new Set(stories.map((s) => s.question_id)), [stories])

  // 統計
  const stats = useMemo(() => ({
    coreStories: stories.filter((s) => s.type === 'core_story').length,
    oneLiners: stories.filter((s) => s.type === 'one_liner').length,
    stories: stories.filter((s) => s.type === 'story').length,
    total: stories.length,
  }), [stories])

  // 已登入用戶
  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <User className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="mb-2 text-xl font-bold">你已經登入了</h1>
          <p className="mb-6 text-gray-600">可以直接在個人頁面編輯你的故事</p>
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
          <p className="mb-4 text-gray-600">瀏覽更多攀岩者的故事後，就可以開始分享</p>
          <div className="mb-6 rounded-lg bg-gray-100 p-4">
            <p className="text-sm text-gray-500">已瀏覽 {session.biographyViews} 個故事</p>
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
  if (viewMode === 'complete' && result) {
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
          <p className="mb-2 text-lg font-medium text-[#1B1A1A]">{result.anonymousName}</p>
          <p className="mb-6 text-sm text-gray-500">
            共 {stats.total} 則故事
          </p>

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
            <Link href={`/biography/${result.slug}`}>
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

  // 開始編輯某題
  const handleSelectQuestion = (question: Question) => {
    const existing = stories.find((s) => s.question_id === question.id)
    setCurrentQuestion(question)
    setCurrentContent(existing?.content || '')
    setViewMode('edit')
  }

  // 儲存當前題目
  const handleSaveStory = () => {
    if (!currentQuestion || currentContent.trim().length < 1) return

    const newStory: StoryInput = {
      question_id: currentQuestion.id,
      content: currentContent.trim(),
      type: currentQuestion.type,
      question_text: currentQuestion.title,
      category_id: currentQuestion.category,
    }

    setStories((prev) => {
      const filtered = prev.filter((s) => s.question_id !== currentQuestion.id)
      return [...filtered, newStory]
    })

    setCurrentQuestion(null)
    setCurrentContent('')
    setViewMode('list')
  }

  // 刪除某題
  const handleRemoveStory = (questionId: string) => {
    setStories((prev) => prev.filter((s) => s.question_id !== questionId))
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
    const minLength = currentQuestion.type === 'one_liner' ? 1 : 10
    const canSave = currentContent.trim().length >= minLength

    return (
      <div className="min-h-screen bg-gray-50">
        <header className="sticky top-0 z-10 border-b bg-white">
          <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
            <button
              onClick={() => { setViewMode('list'); setCurrentQuestion(null) }}
              className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>返回</span>
            </button>
            <Button onClick={handleSaveStory} disabled={!canSave} size="sm">
              儲存
            </Button>
          </div>
        </header>

        <main className="mx-auto max-w-2xl px-4 py-8 pb-24">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#1B1A1A]">{currentQuestion.title}</h1>
            {currentQuestion.subtitle && (
              <p className="mt-2 text-gray-600">{currentQuestion.subtitle}</p>
            )}
            {currentQuestion.categoryName && (
              <span className="mt-2 inline-block rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                {currentQuestion.categoryName}
              </span>
            )}
          </div>

          <textarea
            value={currentContent}
            onChange={(e) => setCurrentContent(e.target.value)}
            placeholder={currentQuestion.placeholder}
            className={`w-full resize-none rounded-xl border border-gray-200 p-4 leading-relaxed focus:border-[#ffe70c] focus:outline-none focus:ring-2 focus:ring-[#ffe70c]/20 ${
              currentQuestion.type === 'one_liner' ? 'min-h-[80px] text-lg' : 'min-h-[200px] text-lg'
            }`}
            autoFocus
          />

          <div className="mt-2 flex justify-between text-sm">
            <span className={currentContent.length < minLength ? 'text-gray-400' : 'text-green-600'}>
              {currentContent.length < minLength
                ? `還需要 ${minLength - currentContent.length} 個字`
                : '可以儲存了'}
            </span>
            <span className="text-gray-400">{currentContent.length} 字</span>
          </div>
        </main>
      </div>
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
        {/* 已填寫的故事 */}
        {stories.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-medium text-gray-500">已填寫 ({stories.length})</h2>
            <div className="space-y-2">
              {stories.map((story) => {
                const q = ALL_QUESTIONS.find((q) => q.id === story.question_id)
                return (
                  <div
                    key={story.question_id}
                    className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-[#1B1A1A]">{q?.title || story.question_id}</p>
                      <p className="truncate text-sm text-gray-500">{story.content}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => q && handleSelectQuestion(q)}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      >
                        <Pen className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveStory(story.question_id)}
                        className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* 核心故事 */}
        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[#ffe70c]" />
            <h2 className="text-sm font-medium text-gray-700">核心故事</h2>
            <span className="text-xs text-gray-400">深度分享</span>
          </div>
          <div className="space-y-2">
            {CORE_STORIES.filter((q) => !answeredIds.has(q.id)).map((question) => (
              <button
                key={question.id}
                onClick={() => handleSelectQuestion(question)}
                className="flex w-full items-center gap-3 rounded-xl bg-white p-4 text-left shadow-sm transition-colors hover:bg-gray-50"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ffe70c]/20">
                  <Plus className="h-4 w-4 text-[#1B1A1A]" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[#1B1A1A]">{question.title}</p>
                  {question.subtitle && (
                    <p className="text-sm text-gray-500">{question.subtitle}</p>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 text-gray-300" />
              </button>
            ))}
          </div>
        </section>

        {/* 一句話 */}
        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-blue-500" />
            <h2 className="text-sm font-medium text-gray-700">一句話</h2>
            <span className="text-xs text-gray-400">快速回答</span>
          </div>
          <div className="space-y-2">
            {ONE_LINERS.filter((q) => !answeredIds.has(q.id)).map((question) => (
              <button
                key={question.id}
                onClick={() => handleSelectQuestion(question)}
                className="flex w-full items-center gap-3 rounded-xl bg-white p-4 text-left shadow-sm transition-colors hover:bg-gray-50"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50">
                  <Plus className="h-4 w-4 text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[#1B1A1A]">{question.title}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-300" />
              </button>
            ))}
          </div>
        </section>

        {/* 深度故事 */}
        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <h2 className="text-sm font-medium text-gray-700">更多故事</h2>
            <span className="text-xs text-gray-400">選填</span>
          </div>
          <div className="space-y-2">
            {STORIES.filter((q) => !answeredIds.has(q.id)).map((question) => (
              <button
                key={question.id}
                onClick={() => handleSelectQuestion(question)}
                className="flex w-full items-center gap-3 rounded-xl bg-white p-4 text-left shadow-sm transition-colors hover:bg-gray-50"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-50">
                  <Plus className="h-4 w-4 text-purple-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[#1B1A1A]">{question.title}</p>
                  {question.categoryName && (
                    <span className="text-xs text-gray-400">{question.categoryName}</span>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 text-gray-300" />
              </button>
            ))}
          </div>
        </section>

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
