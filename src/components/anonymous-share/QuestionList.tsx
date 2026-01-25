'use client'

import {
  Check,
  Plus,
  X,
  ChevronRight,
  Pen,
  MessageCircle,
  BookOpen,
  Sparkles,
} from 'lucide-react'
import type { Question, StoryInput } from './questions'
import { ALL_QUESTIONS, CORE_STORIES, ONE_LINERS, STORIES } from './questions'

interface QuestionListProps {
  stories: StoryInput[]
  onSelectQuestion: (_question: Question) => void
  onRemoveStory: (_questionId: string) => void
}

/**
 * 已回答的故事列表
 */
function AnsweredStories({
  stories,
  onSelectQuestion,
  onRemoveStory,
}: {
  stories: StoryInput[]
  onSelectQuestion: (_question: Question) => void
  onRemoveStory: (_questionId: string) => void
}) {
  if (stories.length === 0) return null

  return (
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
                  onClick={() => q && onSelectQuestion(q)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <Pen className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onRemoveStory(story.question_id)}
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
  )
}

/**
 * 問題項目按鈕
 */
function QuestionButton({
  question,
  iconBgClass,
  onClick,
}: {
  question: Question
  iconBgClass: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl bg-white p-4 text-left shadow-sm transition-colors hover:bg-gray-50"
    >
      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${iconBgClass}`}>
        <Plus className="h-4 w-4 text-[#1B1A1A]" />
      </div>
      <div className="flex-1">
        <p className="font-medium text-[#1B1A1A]">{question.title}</p>
        {question.subtitle && (
          <p className="text-sm text-gray-500">{question.subtitle}</p>
        )}
        {question.categoryName && !question.subtitle && (
          <span className="text-xs text-gray-400">{question.categoryName}</span>
        )}
      </div>
      <ChevronRight className="h-5 w-5 text-gray-300" />
    </button>
  )
}

/**
 * 問題類別區塊
 */
function QuestionSection({
  title,
  subtitle,
  icon,
  questions,
  answeredIds,
  iconBgClass,
  onSelectQuestion,
}: {
  title: string
  subtitle: string
  icon: React.ReactNode
  questions: Question[]
  answeredIds: Set<string>
  iconBgClass: string
  onSelectQuestion: (_question: Question) => void
}) {
  const unanswered = questions.filter((q) => !answeredIds.has(q.id))
  if (unanswered.length === 0) return null

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h2 className="text-sm font-medium text-gray-700">{title}</h2>
        <span className="text-xs text-gray-400">{subtitle}</span>
      </div>
      <div className="space-y-2">
        {unanswered.map((question) => (
          <QuestionButton
            key={question.id}
            question={question}
            iconBgClass={iconBgClass}
            onClick={() => onSelectQuestion(question)}
          />
        ))}
      </div>
    </section>
  )
}

/**
 * 問題列表組件
 * 顯示所有可選問題，按類別分組
 */
export function QuestionList({
  stories,
  onSelectQuestion,
  onRemoveStory,
}: QuestionListProps) {
  const answeredIds = new Set(stories.map((s) => s.question_id))

  return (
    <>
      {/* 已填寫的故事 */}
      <AnsweredStories
        stories={stories}
        onSelectQuestion={onSelectQuestion}
        onRemoveStory={onRemoveStory}
      />

      {/* 核心故事 */}
      <QuestionSection
        title="核心故事"
        subtitle="深度分享"
        icon={<BookOpen className="h-4 w-4 text-[#ffe70c]" />}
        questions={CORE_STORIES}
        answeredIds={answeredIds}
        iconBgClass="bg-[#ffe70c]/20"
        onSelectQuestion={onSelectQuestion}
      />

      {/* 一句話 */}
      <QuestionSection
        title="一句話"
        subtitle="快速回答"
        icon={<MessageCircle className="h-4 w-4 text-[#1B1A1A]" />}
        questions={ONE_LINERS}
        answeredIds={answeredIds}
        iconBgClass="bg-gray-100"
        onSelectQuestion={onSelectQuestion}
      />

      {/* 深度故事 */}
      <QuestionSection
        title="更多故事"
        subtitle="選填"
        icon={<Sparkles className="h-4 w-4 text-[#ffe70c]" />}
        questions={STORIES}
        answeredIds={answeredIds}
        iconBgClass="bg-[#ffe70c]/10"
        onSelectQuestion={onSelectQuestion}
      />
    </>
  )
}
