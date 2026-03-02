'use client'

import { useState } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SourceCard } from './SourceCard'
import { useSubmitFeedback } from '@/lib/api/ai'
import type { AISource } from '@/lib/api/ai'

// 簡易 markdown 渲染：支援 **bold**、*italic*、- 列表、換行
function MarkdownContent({ text }: { text: string }) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let listItems: string[] = []

  const flushList = (key: string) => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={key} className="my-1 space-y-0.5 pl-4 list-disc">
          {listItems.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </ul>
      )
      listItems = []
    }
  }

  const renderInline = (line: string): React.ReactNode => {
    // **bold** 和 *italic*
    const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i}>{part.slice(1, -1)}</em>
      }
      return part
    })
  }

  lines.forEach((line, i) => {
    const listMatch = line.match(/^[-*]\s+(.+)/) || line.match(/^\d+\.\s+(.+)/)
    if (listMatch) {
      listItems.push(listMatch[1])
    } else {
      flushList(`list-${i}`)
      if (line.trim() === '') {
        elements.push(<div key={i} className="h-1" />)
      } else {
        elements.push(<p key={i}>{renderInline(line)}</p>)
      }
    }
  })
  flushList('list-end')

  return <div className="space-y-0.5">{elements}</div>
}

export interface ChatMessageData {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: AISource[]
  queryId?: string
}

interface ChatMessageProps {
  message: ChatMessageData
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const { mutate: submitFeedback } = useSubmitFeedback()

  const isUser = message.role === 'user'

  const handleFeedback = (score: 1 | 5) => {
    if (!message.queryId || feedbackSubmitted) return
    submitFeedback(
      { query_id: message.queryId, score },
      { onSuccess: () => setFeedbackSubmitted(true) }
    )
  }

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div className="max-w-[85%] space-y-2">
        {/* 訊息氣泡 */}
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
            isUser
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-muted text-foreground rounded-bl-sm'
          )}
        >
          {isUser ? (
            <span className="whitespace-pre-wrap">{message.content}</span>
          ) : (
            <MarkdownContent text={message.content} />
          )}
        </div>

        {/* 來源卡片（僅助理訊息） */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="space-y-1.5 pl-1">
            <p className="text-xs text-muted-foreground">參考來源</p>
            {message.sources.map((source) => (
              <SourceCard key={source.id} source={source} />
            ))}
          </div>
        )}

        {/* 回饋按鈕（僅助理訊息且有 queryId） */}
        {!isUser && message.queryId && (
          <div className="flex items-center gap-1 pl-1">
            {feedbackSubmitted ? (
              <span className="text-xs text-muted-foreground">感謝您的回饋！</span>
            ) : (
              <>
                <button
                  onClick={() => handleFeedback(5)}
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  aria-label="好評"
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleFeedback(1)}
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  aria-label="差評"
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
