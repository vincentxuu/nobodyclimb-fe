'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { BiographyV2, BiographyOneLinersV2 } from '@/lib/types/biography-v2'
import {
  SYSTEM_ONELINER_QUESTION_LIST,
  getOneLinerQuestionById,
} from '@/lib/constants/biography-questions'

interface BiographyOneLinersProps {
  /** 人物誌資料 */
  biography: BiographyV2
  /** 自訂樣式 */
  className?: string
}

/**
 * 一句話系列展示組件
 *
 * 顯示用戶填寫的一句話回答
 */
export function BiographyOneLiners({
  biography,
  className,
}: BiographyOneLinersProps) {
  // 將回答整理為展示列表
  const oneLiners = useMemo(() => {
    if (!biography.one_liners?.answers) return []

    const items: Array<{
      id: string
      question: string
      answer: string
      isCustom: boolean
    }> = []

    for (const answer of biography.one_liners.answers) {
      if (!answer.answer) continue

      // 嘗試找系統問題
      const systemQuestion = getOneLinerQuestionById(answer.question_id)
      if (systemQuestion) {
        items.push({
          id: answer.question_id,
          question: systemQuestion.question,
          answer: answer.answer,
          isCustom: false,
        })
      } else {
        // 找用戶自訂問題
        const customQuestion = biography.one_liners.custom_questions?.find(
          (q) => q.id === answer.question_id
        )
        if (customQuestion) {
          items.push({
            id: answer.question_id,
            question: customQuestion.question,
            answer: answer.answer,
            isCustom: true,
          })
        }
      }
    }

    return items
  }, [biography.one_liners])

  if (oneLiners.length === 0) {
    return null
  }

  return (
    <section className={cn('py-6', className)}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">💬</span>
        <h2 className="text-lg font-semibold text-gray-900">關於我</h2>
      </div>

      <div className="space-y-4">
        {oneLiners.map((item) => (
          <div
            key={item.id}
            className={cn(
              'p-4 rounded-xl border',
              item.isCustom
                ? 'bg-amber-50/50 border-amber-200'
                : 'bg-white border-gray-200'
            )}
          >
            <div className="flex items-center gap-1 mb-2">
              {item.isCustom && <span className="text-amber-500">✨</span>}
              <h3 className="font-medium text-gray-700">{item.question}</h3>
            </div>
            <p className="text-gray-900">「{item.answer}」</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default BiographyOneLiners
