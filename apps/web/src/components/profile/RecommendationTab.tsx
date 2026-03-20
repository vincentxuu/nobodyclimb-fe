'use client'

import React, { useState, useEffect, useRef } from 'react'
import ProfilePageTitle from '@/components/profile/ProfilePageTitle'
import { RefreshCw, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SourceCard } from '@/components/ai/SourceCard'
import { MarkdownContent } from '@/components/ai/ChatMessage'
import { useToast } from '@/components/ui/use-toast'
import {
  useRecommendations,
  useTriggerRecommendation,
  type Recommendation,
} from '@/lib/api/ai'
import { useTranslations } from 'next-intl'

const ITEMS_PER_PAGE = 10

function RecommendationCard({
  recommendation,
  defaultExpanded = false,
}: {
  recommendation: Recommendation
  defaultExpanded?: boolean
}) {
  const t = useTranslations('ProfilePage')
  const [expanded, setExpanded] = useState(defaultExpanded)
  const { answer, sources, context_ascents } = recommendation.recommendation
  const triggeredLabel = recommendation.triggered_by === 'ascent' ? t('triggeredByAscent') : t('triggeredManual')
  const date = new Date(recommendation.created_at).toLocaleDateString('zh-TW')

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* 標頭列（點擊折疊/展開）*/}
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 text-xs text-muted-foreground hover:bg-muted/40 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="flex items-center gap-1.5">
          <Sparkles className="h-3 w-3" />
          {triggeredLabel}
          {context_ascents.length > 0 && (
            <span className="text-muted-foreground/60">
              · {t('basedOnAscents', { count: context_ascents.length })}
            </span>
          )}
        </span>
        <span className="flex items-center gap-2">
          <span>{date}</span>
          {expanded
            ? <ChevronUp className="h-3.5 w-3.5" />
            : <ChevronDown className="h-3.5 w-3.5" />}
        </span>
      </button>

      {/* 展開內容 */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border">
          {answer && (
            <div className="pt-3 text-sm text-foreground leading-relaxed">
              <MarkdownContent text={answer} />
            </div>
          )}

          {sources.length > 0 && (
            <div className="space-y-2">
              {sources.map((source) => (
                <SourceCard key={source.id} source={source} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function RecommendationSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3 animate-pulse">
      <div className="h-4 w-32 rounded bg-muted" />
      <div className="h-16 w-full rounded bg-muted" />
      <div className="h-12 w-full rounded bg-muted" />
      <div className="h-12 w-full rounded bg-muted" />
    </div>
  )
}

export default function RecommendationTab() {
  const t = useTranslations('ProfilePage')
  const { toast } = useToast()
  const [offset, setOffset] = useState(0)
  const [allItems, setAllItems] = useState<Recommendation[]>([])
  const [total, setTotal] = useState(0)
  const pollingCount = useRef(0)
  const pollingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [pollingDone, setPollingDone] = useState(false)

  const { data, isLoading, refetch } = useRecommendations({ limit: ITEMS_PER_PAGE, offset: 0 })
  const triggerMutation = useTriggerRecommendation()

  // 初始資料載入
  useEffect(() => {
    if (data) {
      setAllItems(data.data)
      setTotal(data.total)
    }
  }, [data])

  // 首次載入為空時，polling 等待系統推薦（最多 3 次，間隔 2s）
  // 注意：只依賴 isLoading，避免 refetch() 觸發 data 變動導致 effect 重跑、計時器被取消的無限循環
  useEffect(() => {
    if (!isLoading && data?.data.length === 0) {
      setPollingDone(false)
      pollingCount.current = 0
      const poll = () => {
        if (pollingCount.current >= 3) {
          setPollingDone(true)
          return
        }
        pollingCount.current += 1
        pollingTimer.current = setTimeout(async () => {
          const result = await refetch()
          if ((result.data?.data.length ?? 0) > 0) {
            setPollingDone(true)
          } else if (pollingCount.current >= 3) {
            setPollingDone(true)
          } else {
            poll()
          }
        }, 2000)
      }
      poll()
    }
    return () => {
      if (pollingTimer.current) clearTimeout(pollingTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading])

  const handleLoadMore = async () => {
    const newOffset = offset + ITEMS_PER_PAGE
    setOffset(newOffset)
    const { fetchRecommendations } = await import('@/lib/api/ai')
    const more = await fetchRecommendations({ limit: ITEMS_PER_PAGE, offset: newOffset })
    setAllItems((prev) => [...prev, ...more.data])
    setTotal(more.total)
  }

  const handleRetrigger = () => {
    triggerMutation.mutate(undefined, {
      onSuccess: (newRec) => {
        setAllItems((prev) => [newRec, ...prev])
        setTotal((prev) => prev + 1)
      },
      onError: (error: unknown) => {
        const msg =
          (error as { response?: { data?: { error?: string } } })?.response?.data?.error ===
          'quota_exceeded'
            ? t('toastQuotaExceeded')
            : t('toastRecommendationFailed')
        toast({ title: msg, variant: 'destructive' })
      },
    })
  }

  const isPolling = !isLoading && allItems.length === 0 && !pollingDone
  const hasMore = allItems.length < total

  return (
    <div className="space-y-4">
      <ProfilePageTitle
        title={t('routeRecommendations')}
        isAI
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetrigger}
            disabled={triggerMutation.isPending}
            className="gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${triggerMutation.isPending ? 'animate-spin' : ''}`} />
            {t('reRecommend')}
          </Button>
        }
      />

      {/* 骨架屏（loading 或 polling 中）*/}
      {(isLoading || isPolling) && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{t('recommendationGenerating')}</p>
          <RecommendationSkeleton />
        </div>
      )}

      {/* 空狀態（polling 結束仍無資料）*/}
      {!isLoading && !isPolling && allItems.length === 0 && (
        <div className="rounded-lg border border-dashed border-border py-12 text-center space-y-2">
          <Sparkles className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            {t('recommendationEmpty')}
          </p>
          <Button variant="outline" size="sm" onClick={handleRetrigger} className="mt-2">
            {t('recommendNow')}
          </Button>
        </div>
      )}

      {/* 推薦列表 */}
      {allItems.length > 0 && (
        <div className="space-y-3">
          {allItems.map((rec, idx) => (
            <RecommendationCard key={rec.id} recommendation={rec} defaultExpanded={idx === 0} />
          ))}

          {hasMore && (
            <Button
              variant="ghost"
              className="w-full gap-1 text-muted-foreground"
              onClick={handleLoadMore}
            >
              <ChevronDown className="h-4 w-4" />
              {t('loadMore')}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
