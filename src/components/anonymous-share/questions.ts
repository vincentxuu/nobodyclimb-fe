// 問題定義和類型
import type { QuestionsData } from '@/lib/hooks/useQuestions'

export interface Question {
  id: string
  title: string
  subtitle?: string
  placeholder: string
  type: 'core_story' | 'one_liner' | 'story'
  category?: string
  categoryName?: string
}

export interface StoryInput {
  question_id: string
  content: string
  type: 'core_story' | 'one_liner' | 'story'
  question_text?: string
  category_id?: string
}

/**
 * 從 API 資料轉換為 Question 格式
 */
export function convertApiQuestionsToQuestions(data: QuestionsData): {
  coreStories: Question[]
  oneLiners: Question[]
  stories: Question[]
  all: Question[]
} {
  // 建立分類名稱對照表
  const categoryNames: Record<string, string> = {}
  data.categories.forEach((cat) => {
    categoryNames[cat.id] = cat.name
  })

  const coreStories: Question[] = data.coreStories.map((q) => ({
    id: q.id,
    title: q.title,
    subtitle: q.subtitle || undefined,
    placeholder: q.placeholder || '分享你的故事...',
    type: 'core_story' as const,
  }))

  const oneLiners: Question[] = data.oneLiners.map((q) => ({
    id: q.id,
    title: q.question,
    subtitle: q.format_hint || undefined,
    placeholder: q.placeholder || '輸入你的回答...',
    type: 'one_liner' as const,
  }))

  const stories: Question[] = data.stories.map((q) => ({
    id: q.id,
    title: q.title,
    subtitle: q.subtitle || undefined,
    placeholder: q.placeholder || '分享你的故事...',
    type: 'story' as const,
    category: q.category_id,
    categoryName: categoryNames[q.category_id] || undefined,
  }))

  return {
    coreStories,
    oneLiners,
    stories,
    all: [...coreStories, ...oneLiners, ...stories],
  }
}
