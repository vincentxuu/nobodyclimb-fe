'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { MessageCircle, Sparkles } from 'lucide-react'
import type { BiographyV2 } from '@/lib/types/biography-v2'
import { getOneLinerQuestionById } from '@/lib/constants/biography-questions'

interface BiographyOneLinersProps {
  /** 人物誌資料 */
  biography: BiographyV2
  /** 自訂樣式 */
  className?: string
}

// 這些問題已經在 Chapter 組件中顯示，不需要重複顯示
const CHAPTER_QUESTION_IDS = new Set([
  'climbing_origin',   // Chapter 1: 相遇篇
  'climbing_meaning',  // Chapter 2: 意義篇
  'advice_to_self',    // Chapter 4: 給新手的話
])

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
    if (!biography.one_liners || biography.one_liners.length === 0) return []

    const items: Array<{
      id: string
      question: string
      answer: string
      isCustom: boolean
    }> = []

    for (const item of biography.one_liners) {
      if (!item.answer) continue

      // 跳過已經在 Chapter 組件顯示的問題
      if (CHAPTER_QUESTION_IDS.has(item.question_id)) continue

      // 嘗試找系統問題
      const systemQuestion = getOneLinerQuestionById(item.question_id)
      if (systemQuestion) {
        items.push({
          id: item.question_id,
          question: systemQuestion.question,
          answer: item.answer,
          isCustom: item.source === 'user',
        })
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
        <MessageCircle size={18} className="text-[#3F3D3D]" />
        <h2 className="text-lg font-semibold text-[#1B1A1A]">關於我</h2>
      </div>

      <div className="space-y-4">
        {oneLiners.map((item) => (
          <div
            key={item.id}
            className={cn(
              'p-4 rounded-xl border',
              item.isCustom
                ? 'bg-brand-accent/5 border-brand-accent/30'
                : 'bg-white border-[#DBD8D8]'
            )}
          >
            <div className="flex items-center gap-1 mb-2">
              {item.isCustom && <Sparkles size={14} className="text-brand-accent" />}
              <h3 className="font-medium text-[#6D6C6C]">{item.question}</h3>
            </div>
            <p className="text-[#1B1A1A]">「{item.answer}」</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default BiographyOneLiners
