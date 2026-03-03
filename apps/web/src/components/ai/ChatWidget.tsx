'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { MessageCircle, X, Send, Loader2, History, Trash2, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAskAI, createChatSession, getChatSessions, getChatMessages, deleteChatSession, saveMessage, getMyQuota } from '@/lib/api/ai'
import type { AiQuota, ChatSession } from '@/lib/api/ai'
import { useAuthStore } from '@/store/authStore'
import { ChatMessage } from './ChatMessage'
import type { ChatMessageData } from './ChatMessage'
import { RankBadge } from '@/components/rank/RankBadge'

// =============================================
// 建議問題題庫（至少 12 題，每次隨機取 3 題）
// =============================================
const SUGGESTION_POOL = [
  '龍洞有哪些 5.11 運攀路線？',
  '我想挑戰 5.12，有哪些推薦路線？',
  '爬完天天天藍了，推薦我下一條路線',
  '我想爬長路線，台灣有什麼選擇？',
  '龍洞的路線類型有哪些？',
  '從台北出發，最近的岩場在哪？',
  '5.10b 的路線適合怎樣程度的攀岩者？',
]

function getRandomSuggestions(): string[] {
  return [...SUGGESTION_POOL].sort(() => Math.random() - 0.5).slice(0, 3)
}

function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000) - timestamp
  if (seconds < 60) return '剛剛'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} 分鐘前`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} 小時前`
  return `${Math.floor(seconds / 86400)} 天前`
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [messages, setMessages] = useState<ChatMessageData[]>([])
  const [input, setInput] = useState('')
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([])
  const [displaySuggestions, setDisplaySuggestions] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [showConfirmClear, setShowConfirmClear] = useState(false)
  const [quota, setQuota] = useState<AiQuota | null>(null)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { mutate: askAI, isPending } = useAskAI()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  // 開啟時：隨機取建議問題、建立或載入 session、取得配額
  useEffect(() => {
    if (!isOpen) return
    setDisplaySuggestions(getRandomSuggestions())

    const timer = setTimeout(() => inputRef.current?.focus(), 100)

    getMyQuota().then(setQuota).catch(() => { })

    if (isAuthenticated && !currentSessionId) {
      getChatSessions().then((list) => {
        if (list.length > 0) {
          const latest = list[0]
          setCurrentSessionId(latest.id)
          getChatMessages(latest.id).then((msgs) => {
            setMessages(msgs.map((m) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              sources: undefined,
              queryId: m.query_id,
              suggestedQuestions: m.suggested_questions
                ? (typeof m.suggested_questions === 'string'
                  ? JSON.parse(m.suggested_questions)
                  : m.suggested_questions)
                : undefined,
            })))
          }).catch(() => { })
        } else {
          createChatSession().then((s) => setCurrentSessionId(s.id)).catch(() => { })
        }
      }).catch(() => {
        // 非登入用戶或 API 失敗，不持久化
      })
    }

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // 新訊息時捲動到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isPending, suggestedQuestions])

  // Escape 鍵關閉
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (showHistory) setShowHistory(false)
        else setIsOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, showHistory])

  useEffect(() => {
    setMounted(true)
  }, [])

  // 儲存訊息到後端（靜默失敗）
  const persistMessage = useCallback(async (
    role: 'user' | 'assistant',
    content: string,
    extra?: { suggested_questions?: string[]; query_id?: string }
  ) => {
    if (!currentSessionId) return
    try {
      await saveMessage(currentSessionId, { role, content, ...extra })
    } catch {
      // 靜默失敗，不中斷對話
    }
  }, [currentSessionId])

  const handleSubmit = useCallback(
    (query: string) => {
      const trimmed = query.trim()
      if (!trimmed || isPending) return

      setSuggestedQuestions([]) // 清除前一輪建議
      const userMessage: ChatMessageData = {
        id: crypto.randomUUID(),
        role: 'user',
        content: trimmed,
      }
      setMessages((prev) => [...prev, userMessage])
      setInput('')
      if (inputRef.current) inputRef.current.value = ''

      persistMessage('user', trimmed)

      askAI(
        { query: trimmed, include_sources: true },
        {
          onSuccess: (data) => {
            const assistantMsg: ChatMessageData = {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: data.answer,
              sources: data.sources,
              queryId: data.query_id,
            }
            setMessages((prev) => [...prev, assistantMsg])
            setSuggestedQuestions(data.suggested_questions ?? [])
            if (data.quota) setQuota(data.quota)
            persistMessage('assistant', data.answer, {
              suggested_questions: data.suggested_questions,
              query_id: data.query_id,
            })
          },
          onError: (error) => {
            const axiosError = error as { response?: { status?: number; data?: { data?: { daily_limit?: number; daily_used?: number; tier?: string; tier_display?: string; resets_at?: string } } } }
            if (axiosError?.response?.status === 429) {
              const errData = axiosError?.response?.data?.data
              const limit = errData?.daily_limit ?? quota?.daily_limit ?? 2
              const used = errData?.daily_used ?? limit
              setMessages((prev) => [
                ...prev,
                {
                  id: crypto.randomUUID(),
                  role: 'assistant',
                  content: `今日 AI 使用配額已用盡（${used}/${limit} 次）。\n\n配額將於台灣時間明日 00:00 重置。\n\n💡 充實你的攀岩日誌（記錄故事、路線攀登、人生清單），即可提升等級獲得更多每日配額。`,
                },
              ])
              if (errData) {
                setQuota({
                  tier: (errData.tier ?? quota?.tier ?? 'foothill') as AiQuota['tier'],
                  tier_display: errData.tier_display ?? quota?.tier_display ?? '麓',
                  daily_limit: limit,
                  daily_used: used,
                  remaining: 0,
                  score: quota?.score ?? 0,
                  resets_at: errData.resets_at ?? quota?.resets_at ?? '',
                })
              } else {
                setQuota((prev) => prev ? { ...prev, remaining: 0, daily_used: prev.daily_limit } : prev)
              }
            } else {
              setMessages((prev) => [
                ...prev,
                {
                  id: crypto.randomUUID(),
                  role: 'assistant',
                  content: '抱歉，AI 服務暫時無法使用，請稍後再試。',
                },
              ])
            }
          },
        }
      )
    },
    [askAI, isPending, persistMessage, quota]
  )

  // 重新生成最後一則 AI 回應
  const handleRegenerate = useCallback(() => {
    if (isPending) return
    // 找最後一則 user 訊息
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')
    if (!lastUserMsg) return
    // 移除最後一則 AI 訊息
    setMessages((prev) => prev.slice(0, -1))
    setSuggestedQuestions([])
    setIsRegenerating(true)
    askAI(
      { query: lastUserMsg.content, include_sources: true },
      {
        onSuccess: (data) => {
          setIsRegenerating(false)
          const assistantMsg: ChatMessageData = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: data.answer,
            sources: data.sources,
            queryId: data.query_id,
          }
          setMessages((prev) => [...prev, assistantMsg])
          setSuggestedQuestions(data.suggested_questions ?? [])
          if (data.quota) setQuota(data.quota)
          persistMessage('assistant', data.answer, {
            suggested_questions: data.suggested_questions,
            query_id: data.query_id,
          })
        },
        onError: (error) => {
          setIsRegenerating(false)
          const axiosError = error as { response?: { status?: number; data?: { data?: { daily_limit?: number; daily_used?: number; tier?: string; tier_display?: string; resets_at?: string } } } }
          if (axiosError?.response?.status === 429) {
            const errData = axiosError?.response?.data?.data
            const limit = errData?.daily_limit ?? quota?.daily_limit ?? 2
            const used = errData?.daily_used ?? limit
            setMessages((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: `今日 AI 使用配額已用盡（${used}/${limit} 次）。\n\n配額將於台灣時間明日 00:00 重置。\n\n💡 充實你的攀岩日誌（記錄故事、路線攀登、人生清單），即可提升等級獲得更多每日配額。`,
              },
            ])
            if (errData) {
              setQuota({
                tier: (errData.tier ?? quota?.tier ?? 'foothill') as AiQuota['tier'],
                tier_display: errData.tier_display ?? quota?.tier_display ?? '麓',
                daily_limit: limit,
                daily_used: used,
                remaining: 0,
                score: quota?.score ?? 0,
                resets_at: errData.resets_at ?? quota?.resets_at ?? '',
              })
            } else {
              setQuota((prev) => prev ? { ...prev, remaining: 0, daily_used: prev.daily_limit } : prev)
            }
          } else {
            setMessages((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: '抱歉，重新生成失敗，請稍後再試。',
              },
            ])
          }
        },
      }
    )
  }, [isPending, messages, askAI, persistMessage, quota])

  // 清除對話
  const handleClear = useCallback(async () => {
    if (currentSessionId) {
      try {
        await deleteChatSession(currentSessionId)
      } catch { }
    }
    setMessages([])
    setSuggestedQuestions([])
    setShowConfirmClear(false)
    setCurrentSessionId(null)
    // 建立新 session
    if (isAuthenticated) {
      try {
        const newSession = await createChatSession()
        setCurrentSessionId(newSession.id)
      } catch { }
    }
  }, [currentSessionId, isAuthenticated])

  // 開啟歷史面板
  const handleOpenHistory = useCallback(async () => {
    try {
      const list = await getChatSessions()
      setSessions(list)
    } catch { }
    setShowHistory(true)
  }, [])

  // 切換 session
  const handleSwitchSession = useCallback(async (sessionId: string) => {
    try {
      const msgs = await getChatMessages(sessionId)
      setCurrentSessionId(sessionId)
      setMessages(msgs.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        sources: undefined,
        queryId: m.query_id,
        suggestedQuestions: m.suggested_questions
          ? (typeof m.suggested_questions === 'string'
            ? JSON.parse(m.suggested_questions)
            : m.suggested_questions)
          : undefined,
      })))
      setSuggestedQuestions([])
      setShowHistory(false)
    } catch { }
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSubmit(input)
    }
  }

  const lastAssistantIndex = messages.reduce((last, m, i) => m.role === 'assistant' ? i : last, -1)

  const widget = (
    <>
      {/* 浮動觸發按鈕 */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 z-[20000] flex h-14 w-14 items-center justify-center rounded-full pointer-events-auto',
          'bg-primary text-primary-foreground shadow-lg',
          'hover:bg-primary/90 hover:scale-105 transition-all',
          isOpen && 'hidden'
        )}
        aria-label="開啟 AI 助理"
        aria-haspopup="dialog"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* 對話視窗 */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="NobodyClimb AI 助理"
          aria-modal="true"
          className={cn(
            'fixed z-[20000] flex flex-col bg-background shadow-2xl pointer-events-auto',
            'md:top-auto md:left-auto md:bottom-6 md:right-6 md:rounded-2xl md:border md:border-border',
            'md:h-[600px] md:max-h-[calc(100vh-5rem)] md:w-[400px]',
            'inset-0'
          )}
        >
          {/* 標題列 */}
          <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold">NobodyClimb AI</h2>
              {quota ? (
                <div className="flex items-center gap-1.5 mt-0.5">
                  {quota.daily_limit === -1 ? (
                    <span className="text-xs text-muted-foreground">無配額限制</span>
                  ) : (
                    <>
                      <RankBadge tier={quota.tier as import('@nobodyclimb/types').RankId} size="sm" />
                      <span className="text-xs text-muted-foreground">剩餘 {quota.remaining}/{quota.daily_limit}</span>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">攀岩助理</p>
              )}
            </div>
            <div className="flex items-center gap-1">
              {isAuthenticated && !showHistory && (
                <>
                  {/* 清除按鈕 */}
                  {messages.length > 0 && (
                    showConfirmClear ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">確定清除？</span>
                        <button
                          type="button"
                          onClick={handleClear}
                          className="rounded px-1.5 py-0.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          確定
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowConfirmClear(false)}
                          className="rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted transition-colors"
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowConfirmClear(true)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        aria-label="清除對話"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )
                  )}
                  {/* 歷史按鈕 */}
                  <button
                    type="button"
                    onClick={handleOpenHistory}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    aria-label="聊天記錄"
                  >
                    <History className="h-4 w-4" />
                  </button>
                </>
              )}
              {showHistory && (
                <button
                  type="button"
                  onClick={() => setShowHistory(false)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  aria-label="返回對話"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => { setIsOpen(false); setShowHistory(false); setShowConfirmClear(false) }}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="關閉 AI 助理"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* 歷史面板 */}
          {showHistory ? (
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <p className="text-xs text-muted-foreground px-1 pb-1">最近對話</p>
              {sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">還沒有歷史對話</p>
              ) : (
                sessions.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => handleSwitchSession(session.id)}
                    className={cn(
                      'w-full rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted',
                      session.id === currentSessionId && 'bg-muted'
                    )}
                  >
                    <p className="text-sm font-medium truncate">{session.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatRelativeTime(session.updated_at)}
                    </p>
                  </button>
                ))
              )}
            </div>
          ) : (
            <>
              {/* 訊息區 */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                    <p className="text-sm text-muted-foreground px-4">
                      詢問關於台灣攀岩路線、岩場任何問題！
                    </p>
                    <div className="w-full space-y-2">
                      {displaySuggestions.map((suggestion) => (
                        <button
                          type="button"
                          key={suggestion}
                          onClick={() => handleSubmit(suggestion)}
                          className="w-full rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => (
                      <ChatMessage
                        key={message.id}
                        message={message}
                        isLast={index === lastAssistantIndex && message.role === 'assistant'}
                        onRegenerate={handleRegenerate}
                        isPending={isRegenerating && isPending}
                      />
                    ))}
                    {/* 後續建議按鈕列 */}
                    {!isPending && suggestedQuestions.length > 0 && (
                      <div className="space-y-1.5 pl-1">
                        <p className="text-xs text-muted-foreground">你可能想問</p>
                        {suggestedQuestions.map((q) => (
                          <button
                            key={q}
                            type="button"
                            onClick={() => {
                              setSuggestedQuestions([])
                              handleSubmit(q)
                            }}
                            className="w-full rounded-lg border border-border px-3 py-1.5 text-left text-xs hover:bg-muted transition-colors"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    )}
                    {/* 載入狀態 */}
                    {isPending && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>思考中...</span>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* 輸入區 */}
              <div className="shrink-0 border-t border-border p-3">
                <div className="flex items-end gap-2 rounded-xl border border-border bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-ring">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="輸入問題... (Enter 送出)"
                    rows={1}
                    className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    style={{ maxHeight: '120px' }}
                    aria-label="輸入問題"
                  />
                  <button
                    type="button"
                    onClick={() => handleSubmit(input)}
                    disabled={!input.trim() || isPending}
                    className="rounded-lg bg-primary p-1.5 text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors"
                    aria-label="送出問題"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )

  if (!mounted) return null

  return createPortal(widget, document.body)
}
