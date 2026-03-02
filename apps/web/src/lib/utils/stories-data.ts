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
 *
 * @param person - Biography 物件
 * @param field - 故事欄位名稱
 * @param storiesData - 解析後的 stories_data JSON
 * @param category - 可選的分類，傳入可實現 O(1) 直接查找
 */
export function getStoryContent(
  person: Biography,
  field: string,
  storiesData: StoriesDataJson | null,
  category?: StoryCategory
): string | null {
  // 優先從 stories_data 取得（新格式）
  if (storiesData) {
    // 如果有傳入 category，先嘗試直接 O(1) 查找
    if (category) {
      const storyItem = storiesData[category]?.[field]
      if (storyItem?.answer && storyItem.answer.trim() && storyItem.visibility === 'public') {
        return storyItem.answer
      }
      // Fallback: 檢查 'uncategorized' 分類（V2 編輯器儲存的格式）
      const uncategorizedItem = storiesData['uncategorized']?.[field]
      if (uncategorizedItem?.answer && uncategorizedItem.answer.trim() && uncategorizedItem.visibility === 'public') {
        return uncategorizedItem.answer
      }
    } else {
      // 沒有 category 時，遍歷所有分類（向後兼容）
      for (const cat of Object.values(storiesData)) {
        if (!cat) continue
        const storyItem = cat[field]
        if (storyItem?.answer && storyItem.answer.trim() && storyItem.visibility === 'public') {
          return storyItem.answer
        }
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
