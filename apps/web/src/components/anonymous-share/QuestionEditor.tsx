'use client'

import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Question, StoryInput } from './questions'

interface QuestionEditorProps {
  question: Question
  initialContent?: string
  onSave: (_story: StoryInput) => void
  onCancel: () => void
}

/**
 * 問題編輯器組件
 * 用於編輯單一問題的回答
 */
export function QuestionEditor({
  question,
  initialContent = '',
  onSave,
  onCancel,
}: QuestionEditorProps) {
  const [content, setContent] = useState(initialContent)

  const minLength = question.type === 'one_liner' ? 1 : 10
  const canSave = content.trim().length >= minLength

  const handleSave = () => {
    if (!canSave) return

    const story: StoryInput = {
      question_id: question.id,
      content: content.trim(),
      type: question.type,
      question_text: question.title,
      category_id: question.category,
    }

    onSave(story)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 border-b bg-white">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <button
            onClick={onCancel}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>返回</span>
          </button>
          <Button onClick={handleSave} disabled={!canSave} size="sm">
            儲存
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 pb-24">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1B1A1A]">{question.title}</h1>
          {question.subtitle && (
            <p className="mt-2 text-gray-600">{question.subtitle}</p>
          )}
          {question.categoryName && (
            <span className="mt-2 inline-block rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
              {question.categoryName}
            </span>
          )}
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={question.placeholder}
          className={`w-full resize-none rounded-lg border border-gray-200 bg-white p-4 leading-relaxed text-gray-900 placeholder:text-gray-400 focus:border-[#ffe70c] focus:outline-none focus:ring-2 focus:ring-[#ffe70c]/20 ${
            question.type === 'one_liner' ? 'min-h-[80px] text-lg' : 'min-h-[200px] text-lg'
          }`}
          autoFocus
        />

        <div className="mt-2 flex justify-between text-sm">
          <span className={content.length < minLength ? 'text-gray-400' : 'text-green-600'}>
            {content.length < minLength
              ? `還需要 ${minLength - content.length} 個字`
              : '可以儲存了'}
          </span>
          <span className="text-gray-400">{content.length} 字</span>
        </div>
      </main>
    </div>
  )
}
