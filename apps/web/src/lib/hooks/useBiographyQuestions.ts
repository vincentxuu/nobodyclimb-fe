'use client'

import { useMessages, useTranslations } from 'next-intl'

/**
 * Hook for resolving biography question/category text with i18n fallback.
 * Checks if the translation key exists before calling tq() to avoid
 * MISSING_MESSAGE warnings for custom/unknown question IDs.
 */
export function useBiographyQuestionText() {
  const tq = useTranslations('BiographyQuestions')
  const messages = useMessages()
  const bqMessages = (messages.BiographyQuestions ?? {}) as Record<string, string>

  const getOneLinerText = (questionId: string, fallback: string): string => {
    const key = `oneliner_${questionId}`
    return key in bqMessages ? tq(key as Parameters<typeof tq>[0]) : fallback
  }

  const getStoryTitle = (questionId: string, fallback: string): string => {
    const key = `story_${questionId}`
    return key in bqMessages ? tq(key as Parameters<typeof tq>[0]) : fallback
  }

  const getCategoryName = (categoryId: string | undefined, fallback: string): string => {
    if (!categoryId) return tq('category_custom')
    const key = `category_${categoryId}`
    return key in bqMessages ? tq(key as Parameters<typeof tq>[0]) : fallback
  }

  return { getOneLinerText, getStoryTitle, getCategoryName }
}
