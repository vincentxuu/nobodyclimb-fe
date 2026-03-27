'use client'

import React, { use } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@/i18n/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Target,
  MapPin,
  Calendar,
  Check,
  Tent,
  Home,
  Trophy,
  Dumbbell,
  Plane,
  Award,
  Activity,
  Youtube,
  Instagram,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { ContentActions } from '@/components/biography/display/ContentActions'
import { ProgressTracker, ProgressBar } from '@/components/bucket-list'
import {
  bucketListService,
  biographyService,
  type ContentComment,
} from '@/lib/api/services'
import { cn } from '@/lib/utils'
import type { BucketListCategory, BucketListComment } from '@/lib/types'
import { useTranslations } from 'next-intl'

function renderFormattedText(text: string): React.ReactNode {
  const normalized = text.replace(/\\n/g, '\n')
  const segments = normalized.split(/(\*\*[^*]+\*\*)/)
  return segments.map((seg, i) =>
    seg.startsWith('**') && seg.endsWith('**')
      ? <strong key={i}>{seg.slice(2, -2)}</strong>
      : seg
  )
}

function formatDate(dateString: string | undefined, t: ReturnType<typeof useTranslations>): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) return t('dateToday')
  if (diffInDays === 1) return t('dateYesterday')
  if (diffInDays < 7) return t('dateDaysAgo', { days: diffInDays })
  if (diffInDays < 30) return t('dateWeeksAgo', { weeks: Math.floor(diffInDays / 7) })
  if (diffInDays < 365) return t('dateMonthsAgo', { months: Math.floor(diffInDays / 30) })

  return date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })
}

function getCategoryConfig(
  t: ReturnType<typeof useTranslations>
): Record<BucketListCategory, { icon: React.ElementType; label: string; color: string }> {
  return {
    outdoor_route: { icon: Tent, label: t('categoryLabels.outdoor_route'), color: 'border border-brand-accent/30 bg-brand-accent/10 text-brand-dark' },
    indoor_grade: { icon: Home, label: t('categoryLabels.indoor_grade'), color: 'border border-brand-accent/30 bg-brand-accent/10 text-brand-dark' },
    competition: { icon: Trophy, label: t('categoryLabels.competition'), color: 'border border-brand-accent/30 bg-brand-accent/10 text-brand-dark' },
    training: { icon: Dumbbell, label: t('categoryLabels.training'), color: 'border border-brand-accent/30 bg-brand-accent/10 text-brand-dark' },
    adventure: { icon: Plane, label: t('categoryLabels.adventure'), color: 'border border-brand-accent/30 bg-brand-accent/10 text-brand-dark' },
    skill: { icon: Award, label: t('categoryLabels.skill'), color: 'border border-brand-accent/30 bg-brand-accent/10 text-brand-dark' },
    injury_recovery: { icon: Activity, label: t('categoryLabels.injury_recovery'), color: 'border border-brand-accent/30 bg-brand-accent/10 text-brand-dark' },
    other: { icon: Target, label: t('categoryLabels.other'), color: 'border border-brand-accent/30 bg-brand-accent/10 text-brand-dark' },
  }
}

interface BucketListDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function BucketListDetailPage({ params }: BucketListDetailPageProps) {
  const { id } = use(params)
  const queryClient = useQueryClient()
  const t = useTranslations('BucketListPage')
  const tCommon = useTranslations('Common')
  const [isLiked, setIsLiked] = React.useState(false)
  const [likeCount, setLikeCount] = React.useState(0)

  const { data: itemData, isLoading: isItemLoading, error } = useQuery({
    queryKey: ['bucket-list-item', id],
    queryFn: () => bucketListService.getBucketListItem(id),
  })

  const item = itemData?.data

  React.useEffect(() => {
    if (!item) return
    setIsLiked(!!item.is_liked)
    setLikeCount(item.likes_count || 0)
  }, [item])

  const { data: biographyData } = useQuery({
    queryKey: ['biography', item?.biography_id],
    queryFn: () => biographyService.getBiographyById(item!.biography_id),
    enabled: !!item?.biography_id,
  })

  const biography = biographyData?.data

  const mapComment = React.useCallback((comment: BucketListComment & {
    updated_at?: string
    like_count?: number
    parent_id?: string
  }): ContentComment => ({
    id: comment.id,
    user_id: comment.user_id,
    content: comment.content,
    parent_id: comment.parent_id,
    like_count: comment.like_count || 0,
    username: comment.username || 'anonymous',
    display_name: comment.display_name,
    avatar_url: comment.avatar_url,
    created_at: comment.created_at,
    updated_at: comment.updated_at || comment.created_at,
  }), [])

  const handleToggleLike = React.useCallback(async () => {
    const nextLiked = !isLiked
    if (nextLiked) {
      await bucketListService.likeItem(id)
    } else {
      await bucketListService.unlikeItem(id)
    }

    const nextLikeCount = Math.max(0, likeCount + (nextLiked ? 1 : -1))
    setIsLiked(nextLiked)
    setLikeCount(nextLikeCount)
    queryClient.setQueryData(['bucket-list-item', id], (prev: any) => {
      if (!prev?.data) return prev
      return {
        ...prev,
        data: {
          ...prev.data,
          is_liked: nextLiked,
          likes_count: nextLikeCount,
        },
      }
    })

    return { liked: nextLiked, like_count: nextLikeCount }
  }, [id, isLiked, likeCount, queryClient])

  const handleFetchComments = React.useCallback(async (): Promise<ContentComment[]> => {
    const response = await bucketListService.getComments(id)
    return (response.data || []).map(mapComment)
  }, [id, mapComment])

  const handleAddComment = React.useCallback(async (content: string): Promise<ContentComment> => {
    const response = await bucketListService.addComment(id, content.trim())
    if (!response.data) {
      throw new Error(t('addCommentFailed'))
    }
    queryClient.invalidateQueries({ queryKey: ['bucket-list-item', id] })
    return mapComment(response.data)
  }, [id, mapComment, queryClient])

  const handleDeleteComment = React.useCallback(async (commentId: string): Promise<void> => {
    await bucketListService.deleteComment(commentId)
    queryClient.invalidateQueries({ queryKey: ['bucket-list-item', id] })
  }, [id, queryClient])

  if (isItemLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page-content-bg">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-page-content-bg">
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-lg text-text-subtle">{t('notFound')}</p>
          <Link href="/biography">
            <Button variant="outline" className="mt-4">
              {t('backToBiography')}
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const categoryConfig = getCategoryConfig(t)
  const category = categoryConfig[item.category]
  const CategoryIcon = category.icon
  const isCompleted = item.status === 'completed'

  const displayProgress = item.enable_progress
    ? item.progress_mode === 'milestone' && item.milestones && item.milestones.length > 0
      ? Math.round(
        (item.milestones.filter((m) => m.completed).length / item.milestones.length) * 100
      )
      : item.progress
    : null

  const backHref = biography
    ? `/biography/profile/${biography.slug || biography.id}`
    : '/biography'

  return (
    <div className="min-h-screen bg-page-content-bg">
      <div className="container relative mx-auto px-4 pb-4 pt-4 md:pt-8">
        <div className="mb-4 md:mb-8">
          <Breadcrumb
            items={[
              { label: '首頁', href: '/' },
              { label: '人物誌', href: '/biography' },
              ...(biography
                ? [{ label: biography.name, href: `/biography/profile/${biography.slug || biography.id}` }]
                : []),
              { label: item.title },
            ]}
            hideOnMobile
          />
        </div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Link href={backHref}>
            <Button
              variant="ghost"
              className="flex items-center gap-2 bg-white text-brand-dark shadow-sm hover:bg-brand-light"
            >
              <ArrowLeft size={16} />
              <span>{tCommon('back')}</span>
            </Button>
          </Link>
        </motion.div>
      </div>

      <div className="container mx-auto max-w-3xl px-4 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-8">
            <h1
              className="mb-4 text-3xl font-bold leading-tight text-brand-dark md:text-4xl"
            >
              {item.title}
            </h1>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-brand-accent px-3 py-1 text-xs font-medium text-brand-dark">
                {t('tagBucketList')}
              </span>

              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium',
                  category.color
                )}
              >
                <CategoryIcon className="h-3.5 w-3.5" />
                {category.label}
              </span>

              {isCompleted && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-accent px-3 py-1 text-xs font-medium text-brand-dark">
                  <Check className="h-3.5 w-3.5" />
                  {t('tagCompleted')}
                </span>
              )}

              {item.created_at && (
                <span className="inline-flex items-center gap-1 text-xs text-text-subtle">
                  <Calendar size={12} />
                  <span>{formatDate(item.created_at, t)}</span>
                </span>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-subtle">
              {item.target_grade && (
                <span className="inline-flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  {item.target_grade}
                </span>
              )}
              {item.target_location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {item.target_location}
                </span>
              )}
              {item.target_date && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {t('targetLabel')}{item.target_date}
                </span>
              )}
              {isCompleted && item.completed_at && (
                <span className="inline-flex items-center gap-1 text-brand-dark">
                  <Check className="h-4 w-4" />
                  {t('completedAt')} {new Date(item.completed_at).toLocaleDateString('zh-TW')}
                </span>
              )}
              {biography && (
                <Link
                  href={`/biography/profile/${biography.slug || biography.id}`}
                  className="inline-flex items-center text-sm text-text-subtle hover:text-brand-dark"
                >
                  by {biography.name}
                </Link>
              )}
            </div>
          </div>

          <div className="relative mb-8 overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className={cn('px-6 py-8 md:px-10 md:py-10', isCompleted && 'bg-brand-accent/10')}>
              <h2 className="mb-3 text-lg font-semibold text-brand-dark">{t('goalDescription')}</h2>
              {item.description ? (
                <p className="whitespace-pre-line text-[15px] leading-relaxed text-brand-dark">
                  {renderFormattedText(item.description)}
                </p>
              ) : (
                <p className="text-sm text-text-subtle">{t('noDescription')}</p>
              )}

              {!!item.enable_progress && displayProgress !== null && !isCompleted && (
                <div className="mt-6 border-t border-brand-accent/20 pt-5">
                  {item.progress_mode === 'milestone' && item.milestones ? (
                    <ProgressTracker
                      mode="milestone"
                      progress={displayProgress}
                      milestones={item.milestones}
                      size="md"
                    />
                  ) : (
                    <ProgressBar progress={displayProgress} size="md" />
                  )}
                </div>
              )}
            </div>
          </div>

          {isCompleted && (item.completion_story || item.psychological_insights || item.technical_insights) && (
            <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm md:p-8">
              <h2 className="text-lg font-semibold text-brand-dark">{t('completionStory')}</h2>

              {item.completion_story && (
                <p className="mt-4 whitespace-pre-line leading-relaxed text-brand-dark">
                  {renderFormattedText(item.completion_story)}
                </p>
              )}

              {item.psychological_insights && (
                <div className="mt-6">
                  <h3 className="font-medium text-brand-dark">{t('psychologicalInsights')}</h3>
                  <p className="mt-2 whitespace-pre-line text-text-subtle">
                    {renderFormattedText(item.psychological_insights)}
                  </p>
                </div>
              )}

              {item.technical_insights && (
                <div className="mt-6">
                  <h3 className="font-medium text-brand-dark">{t('technicalInsights')}</h3>
                  <p className="mt-2 whitespace-pre-line text-text-subtle">
                    {renderFormattedText(item.technical_insights)}
                  </p>
                </div>
              )}

              {item.completion_media && (
                <div className="mt-6 space-y-4">
                  {item.completion_media.youtube_videos &&
                    item.completion_media.youtube_videos.length > 0 && (
                      <div>
                        <h3 className="flex items-center gap-2 font-medium text-brand-dark">
                          <Youtube className="h-4 w-4 text-red-500" />
                          {t('relatedVideos')}
                        </h3>
                        <div className="mt-2 grid gap-2">
                          {item.completion_media.youtube_videos.map((videoId) => (
                            <a
                              key={videoId}
                              href={`https://youtube.com/watch?v=${videoId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 rounded border border-brand-accent/20 bg-brand-light px-3 py-2 text-sm text-text-subtle hover:bg-brand-accent/10"
                            >
                              <Youtube className="h-4 w-4 text-red-500" />
                              youtube.com/watch?v={videoId}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                  {item.completion_media.instagram_posts &&
                    item.completion_media.instagram_posts.length > 0 && (
                      <div>
                        <h3 className="flex items-center gap-2 font-medium text-brand-dark">
                          <Instagram className="h-4 w-4 text-pink-500" />
                          {t('relatedPosts')}
                        </h3>
                        <div className="mt-2 grid gap-2">
                          {item.completion_media.instagram_posts.map((shortcode) => (
                            <a
                              key={shortcode}
                              href={`https://instagram.com/p/${shortcode}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 rounded border border-brand-accent/20 bg-brand-light px-3 py-2 text-sm text-text-subtle hover:bg-brand-accent/10"
                            >
                              <Instagram className="h-4 w-4 text-pink-500" />
                              instagram.com/p/{shortcode}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>
          )}

          <div className="mb-8 rounded-2xl bg-white p-5 shadow-sm md:p-6">
            <ContentActions
              isLiked={isLiked}
              likeCount={likeCount}
              commentCount={item.comments_count || 0}
              onToggleLike={handleToggleLike}
              onFetchComments={handleFetchComments}
              onAddComment={handleAddComment}
              onDeleteComment={handleDeleteComment}
              size="md"
              shareUrl={typeof window !== 'undefined' ? window.location.href : ''}
              shareTitle={item.title}
            />
          </div>
        </motion.div>
      </div>
    </div>
  )
}
