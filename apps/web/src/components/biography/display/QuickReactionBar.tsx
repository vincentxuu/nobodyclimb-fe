'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HandMetal, ThumbsUp, MessageSquareHeart, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/components/ui/use-toast'
import apiClient from '@/lib/api/client'
import {
  ContentInteractorsPanel,
  type InteractorUser,
} from './ContentInteractorsPanel'

type ReactionType = 'me_too' | 'plus_one' | 'well_said'
type ContentType = 'core-stories' | 'one-liners' | 'stories'

interface ReactionConfig {
  type: ReactionType
  label: string
  icon: typeof HandMetal
  activeColor: string
  hoverColor: string
  emptyMessage: string
}

const REACTIONS: ReactionConfig[] = [
  {
    type: 'me_too',
    label: '我也是',
    icon: HandMetal,
    activeColor: 'text-amber-500',
    hoverColor: 'hover:text-amber-500',
    emptyMessage: '還沒有人說我也是',
  },
  {
    type: 'plus_one',
    label: '+1',
    icon: ThumbsUp,
    activeColor: 'text-blue-500',
    hoverColor: 'hover:text-blue-500',
    emptyMessage: '還沒有人說 +1',
  },
  {
    type: 'well_said',
    label: '說得好',
    icon: MessageSquareHeart,
    activeColor: 'text-rose-500',
    hoverColor: 'hover:text-rose-500',
    emptyMessage: '還沒有人說說得好',
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
  const { status } = useAuthStore()
  const { toast } = useToast()

  const [counts, setCounts] = useState<Record<ReactionType, number>>(initialCounts)
  const [userReactions, setUserReactions] = useState<Set<ReactionType>>(
    new Set(initialUserReactions)
  )
  const [loadingReaction, setLoadingReaction] = useState<ReactionType | null>(null)

  // 反應者 panel 狀態
  const [openReactorsPanel, setOpenReactorsPanel] = useState<ReactionType | null>(null)
  const [reactors, setReactors] = useState<Record<ReactionType, InteractorUser[]>>({
    me_too: [],
    plus_one: [],
    well_said: [],
  })
  const [loadingReactors, setLoadingReactors] = useState<ReactionType | null>(null)

  const handleReaction = useCallback(
    async (reactionType: ReactionType) => {
      if (status !== 'signIn') {
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
    [status, loadingReaction, userReactions, counts, contentType, contentId, toast]
  )

  const handleShowReactors = useCallback(
    async (e: React.MouseEvent, reactionType: ReactionType) => {
      e.preventDefault()
      e.stopPropagation()

      const next = openReactorsPanel === reactionType ? null : reactionType
      setOpenReactorsPanel(next)

      if (next && reactors[reactionType].length === 0) {
        setLoadingReactors(reactionType)
        try {
          const resp = await apiClient.get(
            `/content/${contentType}/${contentId}/reactors?reaction_type=${reactionType}`
          )
          setReactors((prev) => ({
            ...prev,
            [reactionType]: resp.data?.data?.reactors ?? [],
          }))
        } catch (error) {
          console.error('Failed to fetch reactors:', error)
        } finally {
          setLoadingReactors(null)
        }
      }
    },
    [openReactorsPanel, reactors, contentType, contentId]
  )

  const sizeClasses = size === 'sm' ? 'gap-2' : 'gap-3'
  const buttonSizeClasses =
    size === 'sm' ? 'h-7 px-2 text-xs gap-1' : 'h-8 px-3 text-sm gap-1.5'
  const iconSize = size === 'sm' ? 14 : 16

  return (
    <div className={cn('flex flex-wrap items-center', sizeClasses, className)}>
      {REACTIONS.map((reaction) => {
        const isActive = userReactions.has(reaction.type)
        const loading = loadingReaction === reaction.type
        const count = counts[reaction.type]
        const Icon = reaction.icon
        const isPanelOpen = openReactorsPanel === reaction.type

        return (
          <div key={reaction.type} className="contents">
            {/* 反應按鈕（icon + label） */}
            <button
              onClick={() => handleReaction(reaction.type)}
              disabled={loading}
              className={cn(
                'inline-flex items-center rounded-full border transition-all duration-200',
                buttonSizeClasses,
                isActive
                  ? `border-current bg-current/10 ${reaction.activeColor}`
                  : `border-gray-200 text-gray-500 ${reaction.hoverColor} hover:border-current hover:bg-gray-50`
              )}
            >
              <AnimatePresence mode="wait">
                {loading ? (
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
            </button>

            {/* 計數：獨立可點擊，展開反應者 panel */}
            {count > 0 && (
              <button
                onClick={(e) => handleShowReactors(e, reaction.type)}
                className={cn(
                  'text-xs font-medium leading-none transition-colors hover:underline',
                  isPanelOpen
                    ? reaction.activeColor
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <motion.span
                  key={count}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {count}
                </motion.span>
              </button>
            )}

            {/* 反應者 panel */}
            <ContentInteractorsPanel
              isOpen={isPanelOpen}
              users={reactors[reaction.type]}
              isLoading={loadingReactors === reaction.type}
              emptyMessage={reaction.emptyMessage}
              panelClassName="order-last"
            />
          </div>
        )
      })}
    </div>
  )
}

export default QuickReactionBar
