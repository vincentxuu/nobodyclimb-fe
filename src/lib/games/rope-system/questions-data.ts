/**
 * 攀岩系統練習遊戲 - 題目資料載入器
 *
 * 題目資料已移至 public/data/games/rope-system/*.json
 * 透過 fetch 動態載入，減少 Worker bundle 大小
 *
 * 注意：原本的 QUESTIONS_DATA 常數已移除
 * 請使用 fetchQuestionsByCategory() 異步函數取得題目
 */

import type { Question } from './types'

/** 題目資料快取（避免重複 fetch） */
const questionsCache: Record<string, Question[]> = {}

/** 取得指定類別的題目（異步） */
export async function fetchQuestionsByCategory(
  categoryId: string
): Promise<Question[]> {
  // 檢查快取
  if (questionsCache[categoryId]) {
    return questionsCache[categoryId]
  }

  try {
    const response = await fetch(`/data/games/rope-system/${categoryId}.json`)

    if (!response.ok) {
      console.error(`載入題目失敗: ${categoryId} (${response.status})`)
      return []
    }

    const questions: Question[] = await response.json()

    // 存入快取
    questionsCache[categoryId] = questions

    return questions
  } catch (error) {
    console.error(`載入題目發生錯誤: ${categoryId}`, error)
    return []
  }
}

/** 預載入指定類別的題目 */
export function preloadQuestions(categoryIds: string[]): void {
  categoryIds.forEach((categoryId) => {
    fetchQuestionsByCategory(categoryId)
  })
}

/** 清除快取（如需重新載入） */
export function clearQuestionsCache(): void {
  Object.keys(questionsCache).forEach((key) => {
    delete questionsCache[key]
  })
}

/**
 * @deprecated 請使用 fetchQuestionsByCategory() 異步函數
 * 此函數保留僅為向後兼容，返回快取中的資料
 */
export function getQuestionsByCategory(categoryId: string): Question[] {
  console.warn(
    'getQuestionsByCategory() 已棄用，請使用 fetchQuestionsByCategory() 異步函數'
  )
  return questionsCache[categoryId] || []
}

/** 索引檔案的類型 */
interface QuestionsIndex {
  generatedAt: string
  categories: Array<{ id: string; questionCount: number }>
}

/** 取得所有類別的題目數量統計（異步） */
export async function getQuestionStats(): Promise<Record<string, number>> {
  try {
    const response = await fetch('/data/games/rope-system/index.json')

    if (!response.ok) {
      return {}
    }

    const data: QuestionsIndex = await response.json()

    const stats: Record<string, number> = {}
    for (const category of data.categories) {
      stats[category.id] = category.questionCount
    }

    return stats
  } catch (error) {
    console.error('載入題目統計失敗:', error)
    return {}
  }
}
