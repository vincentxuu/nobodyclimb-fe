'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAskAI } from '@/lib/api/ai'
import { ChatMessage } from './ChatMessage'
import type { ChatMessageData } from './ChatMessage'

const SUGGESTIONS = [
  '台灣有哪些適合初學者的岩場？',
  '5.10 難度的路線有哪些特色？',
  '攀岩需要哪些基本裝備？',
]

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [messages, setMessages] = useState<ChatMessageData[]>([])
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { mutate: askAI, isPending } = useAskAI()

  // 開啟時聚焦輸入框
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // 新訊息時捲動到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isPending])

  // Escape 鍵關閉
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // 確保只在 client 端掛載 portal
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = useCallback(
    (query: string) => {
      const trimmed = query.trim()
      if (!trimmed || isPending) return

      const userMessage: ChatMessageData = {
        id: crypto.randomUUID(),
        role: 'user',
        content: trimmed,
      }
      setMessages((prev) => [...prev, userMessage])
      setInput('')

      askAI(
        { query: trimmed, include_sources: true },
        {
          onSuccess: (data) => {
            setMessages((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: data.answer,
                sources: data.sources,
                queryId: data.query_id,
              },
            ])
          },
          onError: () => {
            setMessages((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: '抱歉，AI 服務暫時無法使用，請稍後再試。',
              },
            ])
          },
        }
      )
    },
    [askAI, isPending]
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(input)
    }
  }

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
            // 桌面版：右下角浮動面板，限制最大高度避免超出 navbar
            'md:top-auto md:left-auto md:bottom-6 md:right-6 md:rounded-2xl md:border md:border-border',
            'md:h-[600px] md:max-h-[calc(100vh-5rem)] md:w-[400px]',
            // 行動版：全螢幕（蓋過 navbar）
            'inset-0'
          )}
        >
          {/* 標題列 */}
          <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold">NobodyClimb AI</h2>
              <p className="text-xs text-muted-foreground">攀岩助理</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="關閉 AI 助理"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* 訊息區 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              // 空白狀態：建議問題
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                <p className="text-sm text-muted-foreground px-4">
                  詢問關於台灣攀岩路線、岩場、裝備的任何問題！
                </p>
                <div className="w-full space-y-2">
                  {SUGGESTIONS.map((suggestion) => (
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
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
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
        </div>
      )}
    </>
  )

  if (!mounted) return null

  return createPortal(widget, document.body)
}
