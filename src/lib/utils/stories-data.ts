import { Biography } from '@/lib/types'
import { StoryCategory } from '@/lib/constants/biography-stories'

// ═══════════════════════════════════════════════════════════
// stories_data JSON 結構定義
// ═══════════════════════════════════════════════════════════

export interface StoryDataItem {
  answer: string
  visibility?: string
  updated_at?: string
}

export interface StoriesDataCategory {
  [questionKey: string]: StoryDataItem | undefined
}

export interface StoriesDataJson {
  [category: string]: StoriesDataCategory | undefined
}

// ═══════════════════════════════════════════════════════════
// 解析與取得故事內容
// ═══════════════════════════════════════════════════════════

/**
 * 解析 stories_data JSON 字串
 */
export function parseStoriesData(storiesDataJson: string | null | undefined): StoriesDataJson | null {
  if (!storiesDataJson) return null
  try {
    return JSON.parse(storiesDataJson) as StoriesDataJson
  } catch {
    return null
  }
}

/**
 * 從 stories_data JSON 或舊欄位中取得故事內容
 * 優先使用 stories_data，fallback 到舊欄位
 */
export function getStoryContent(
  person: Biography,
  field: string,
  storiesData: StoriesDataJson | null
): string | null {
  // 優先從 stories_data 取得（新格式）
  if (storiesData) {
    for (const category of Object.values(storiesData)) {
      if (!category) continue
      const storyItem = category[field]
      if (storyItem?.answer && storyItem.answer.trim() && storyItem.visibility === 'public') {
        return storyItem.answer
      }
    }
  }

  // Fallback 到舊欄位格式
  const legacyContent = person[field as keyof Biography] as string | null
  if (legacyContent && legacyContent.trim()) {
    return legacyContent
  }

  return null
}

// ═══════════════════════════════════════════════════════════
// 分類顏色映射
// ═══════════════════════════════════════════════════════════

export const STORY_CATEGORY_COLORS: Record<StoryCategory, { bg: string; text: string }> = {
  growth: { bg: 'bg-brand-accent/20', text: 'text-brand-dark' },
  psychology: { bg: 'bg-brand-light', text: 'text-brand-dark' },
  community: { bg: 'bg-brand-accent/20', text: 'text-brand-dark' },
  practical: { bg: 'bg-brand-light', text: 'text-brand-dark' },
  dreams: { bg: 'bg-brand-accent/20', text: 'text-brand-dark' },
  life: { bg: 'bg-brand-light', text: 'text-brand-dark' },
}
