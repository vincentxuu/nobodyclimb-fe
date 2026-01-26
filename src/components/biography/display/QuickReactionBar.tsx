'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HandMetal, ThumbsUp, MessageSquareHeart, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/components/ui/use-toast'
import apiClient from '@/lib/api/client'

type ReactionType = 'me_too' | 'plus_one' | 'well_said'
type ContentType = 'core-stories' | 'one-liners' | 'stories'

interface ReactionConfig {
  type: ReactionType
  label: string
  icon: typeof HandMetal
  activeColor: string
  hoverColor: string
}

const REACTIONS: ReactionConfig[] = [
  {
    type: 'me_too',
    label: '我也是',
    icon: HandMetal,
    activeColor: 'text-amber-500',
    hoverColor: 'hover:text-amber-500',
  },
  {
    type: 'plus_one',
    label: '+1',
    icon: ThumbsUp,
    activeColor: 'text-blue-500',
    hoverColor: 'hover:text-blue-500',
  },
  {
    type: 'well_said',
    label: '說得好',
    icon: MessageSquareHeart,
    activeColor: 'text-rose-500',
    hoverColor: 'hover:text-rose-500',
  },
]

interface QuickReactionBarProps {
  contentType: ContentType
  contentId: string
  initialCounts?: Record<ReactionType, number>
  initialUserReactions?: ReactionType[]
  size?: 'sm' | 'md'
  className?: string
}

export function QuickReactionBar({
  contentType,
  contentId,
  initialCounts = { me_too: 0, plus_one: 0, well_said: 0 },
  initialUserReactions = [],
  size = 'md',
  className,
}: QuickReactionBarProps) {
  const { isAuthenticated } = useAuthStore()
  const { toast } = useToast()

  const [counts, setCounts] = useState<Record<ReactionType, number>>(initialCounts)
  const [userReactions, setUserReactions] = useState<Set<ReactionType>>(
    new Set(initialUserReactions)
  )
  const [loadingReaction, setLoadingReaction] = useState<ReactionType | null>(null)

  const handleReaction = useCallback(
    async (reactionType: ReactionType) => {
      if (!isAuthenticated) {
        toast({
          title: '請先登入',
          description: '登入後即可表達你的反應',
          variant: 'default',
        })
        return
      }

      if (loadingReaction) return

      setLoadingReaction(reactionType)

      // 樂觀更新
      const wasReacted = userReactions.has(reactionType)
      const newUserReactions = new Set(userReactions)
      const newCounts = { ...counts }

      if (wasReacted) {
        newUserReactions.delete(reactionType)
        newCounts[reactionType] = Math.max(0, newCounts[reactionType] - 1)
      } else {
        newUserReactions.add(reactionType)
        newCounts[reactionType] = newCounts[reactionType] + 1
      }

      setUserReactions(newUserReactions)
      setCounts(newCounts)

      try {
        // 對應 API 路徑
        const apiPath = `/content/${contentType}/${contentId}/reaction`
        await apiClient.post(apiPath, { reaction_type: reactionType })
      } catch (error) {
        // 回滾
        setUserReactions(userReactions)
        setCounts(counts)

        toast({
          title: '操作失敗',
          description: '請稍後再試',
          variant: 'destructive',
        })
      } finally {
        setLoadingReaction(null)
      }
    },
    [isAuthenticated, loadingReaction, userReactions, counts, contentType, contentId, toast]
  )

  const sizeClasses = size === 'sm' ? 'gap-2' : 'gap-3'
  const buttonSizeClasses =
    size === 'sm' ? 'h-7 px-2 text-xs gap-1' : 'h-8 px-3 text-sm gap-1.5'
  const iconSize = size === 'sm' ? 14 : 16

  return (
    <div className={cn('flex items-center', sizeClasses, className)}>
      {REACTIONS.map((reaction) => {
        const isActive = userReactions.has(reaction.type)
        const isLoading = loadingReaction === reaction.type
        const count = counts[reaction.type]
        const Icon = reaction.icon

        return (
          <button
            key={reaction.type}
            onClick={() => handleReaction(reaction.type)}
            disabled={isLoading}
            className={cn(
              'inline-flex items-center rounded-full border transition-all duration-200',
              buttonSizeClasses,
              isActive
                ? `border-current bg-current/10 ${reaction.activeColor}`
                : `border-gray-200 text-gray-500 ${reaction.hoverColor} hover:border-current hover:bg-gray-50`
            )}
          >
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.span
                  key="loading"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Loader2 size={iconSize} className="animate-spin" />
                </motion.span>
              ) : (
                <motion.span
                  key="icon"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Icon size={iconSize} />
                </motion.span>
              )}
            </AnimatePresence>
            <span>{reaction.label}</span>
            {count > 0 && (
              <motion.span
                key={count}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="ml-0.5 font-medium"
              >
                {count}
              </motion.span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default QuickReactionBar
