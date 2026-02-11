'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { MessageCircle, Sparkles, Loader2 } from 'lucide-react'
import { biographyContentService, type OneLiner } from '@/lib/api/services'
import { ContentInteractionBar } from './ContentInteractionBar'

interface BiographyOneLinersProps {
  /** 人物誌 ID */
  biographyId: string
  /** 自訂樣式 */
  className?: string
}

// 這些問題已經在核心故事組件中顯示，不需要重複顯示
const CORE_QUESTION_IDS = new Set([
  'climbing_origin',   // 核心故事: 相遇篇
  'climbing_meaning',  // 核心故事: 意義篇
  'advice_to_self',    // 核心故事: 給新手的話
])

/**
 * 一句話系列展示組件
 *
 * 顯示用戶填寫的一句話回答，支援按讚和留言
 */
export function BiographyOneLiners({
  biographyId,
  className,
}: BiographyOneLinersProps) {
  const [oneLiners, setOneLiners] = useState<OneLiner[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 獲取一句話列表
  const fetchOneLiners = useCallback(async () => {
    try {
      const response = await biographyContentService.getOneLiners(biographyId)
      if (response.success && response.data) {
        // 過濾掉核心故事的問題
        const filtered = response.data.filter(
          (item) => !CORE_QUESTION_IDS.has(item.question_id)
        )
        setOneLiners(filtered)
      }
    } catch (error) {
      console.error('Failed to fetch one-liners:', error)
    } finally {
      setIsLoading(false)
    }
  }, [biographyId])

  useEffect(() => {
    fetchOneLiners()
  }, [fetchOneLiners])

  // 按讚切換
  const handleToggleLike = async (oneLinerId: string) => {
    const response = await biographyContentService.toggleOneLinerLike(oneLinerId)
    if (response.success && response.data) {
      // 更新本地狀態
      setOneLiners((prev) =>
        prev.map((item) =>
          item.id === oneLinerId
            ? { ...item, is_liked: response.data!.liked, like_count: response.data!.like_count }
            : item
        )
      )
      return response.data
    }
    throw new Error('Failed to toggle like')
  }

  // 獲取留言
  const handleFetchComments = async (oneLinerId: string) => {
    const response = await biographyContentService.getOneLinerComments(oneLinerId)
    if (response.success && response.data) {
      return response.data
    }
    return []
  }

  // 新增留言
  const handleAddComment = async (oneLinerId: string, content: string) => {
    const response = await biographyContentService.addOneLinerComment(oneLinerId, { content })
    if (response.success && response.data) {
      // 更新留言數
      setOneLiners((prev) =>
        prev.map((item) =>
          item.id === oneLinerId
            ? { ...item, comment_count: item.comment_count + 1 }
            : item
        )
      )
      return response.data
    }
    throw new Error('Failed to add comment')
  }

  if (isLoading) {
    return (
      <section className={cn('py-6', className)}>
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </section>
    )
  }

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
        {oneLiners.map((item) => {
          const isCustom = !item.question // 自訂問題沒有系統問題文字
          const questionText = item.question || item.question_text || ''

          return (
            <div
              key={item.id}
              className={cn(
                'p-4 rounded-lg border',
                isCustom
                  ? 'bg-brand-accent/5 border-brand-accent/30'
                  : 'bg-white border-[#DBD8D8]'
              )}
            >
              <div className="flex items-center gap-1 mb-2">
                {isCustom && <Sparkles size={14} className="text-brand-accent" />}
                <h3 className="font-medium text-[#6D6C6C]">{questionText}</h3>
              </div>
              <p className="text-[#1B1A1A]">「{item.answer}」</p>

              {/* 互動按鈕 */}
              <ContentInteractionBar
                contentType="one-liners"
                contentId={item.id}
                isLiked={item.is_liked || false}
                likeCount={item.like_count}
                commentCount={item.comment_count}
                onToggleLike={() => handleToggleLike(item.id)}
                onFetchComments={() => handleFetchComments(item.id)}
                onAddComment={(content) => handleAddComment(item.id, content)}
                className="mt-3 pt-3 border-t border-[#EBEAEA]"
                showBorder={false}
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default BiographyOneLiners
