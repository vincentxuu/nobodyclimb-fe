'use client'

import React, { use } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Target,
  MapPin,
  Calendar,
  Heart,
  MessageCircle,
  Link as LinkIcon,
  Check,
  Mountain,
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
import { ProgressTracker, ProgressBar } from '@/components/bucket-list'
import { bucketListService, biographyService } from '@/lib/api/services'
import { cn } from '@/lib/utils'
import type { BucketListItem, BucketListCategory, Biography } from '@/lib/types'

// 分類圖標和標籤映射
const categoryConfig: Record<
  BucketListCategory,
  { icon: React.ElementType; label: string; color: string }
> = {
  outdoor_route: { icon: Mountain, label: '戶外路線', color: 'bg-green-100 text-green-700' },
  indoor_grade: { icon: Home, label: '室內難度', color: 'bg-blue-100 text-blue-700' },
  competition: { icon: Trophy, label: '比賽目標', color: 'bg-yellow-100 text-yellow-700' },
  training: { icon: Dumbbell, label: '訓練目標', color: 'bg-purple-100 text-purple-700' },
  adventure: { icon: Plane, label: '冒險挑戰', color: 'bg-orange-100 text-orange-700' },
  skill: { icon: Award, label: '技能學習', color: 'bg-pink-100 text-pink-700' },
  injury_recovery: { icon: Activity, label: '受傷復原', color: 'bg-red-100 text-red-700' },
  other: { icon: Target, label: '其他', color: 'bg-gray-100 text-gray-700' },
}

interface BucketListDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function BucketListDetailPage({ params }: BucketListDetailPageProps) {
  const { id } = use(params)
  const queryClient = useQueryClient()
  const [commentText, setCommentText] = React.useState('')
  const [isSubmittingComment, setIsSubmittingComment] = React.useState(false)

  // 獲取目標詳情
  const { data: itemData, isLoading: isItemLoading, error } = useQuery({
    queryKey: ['bucket-list-item', id],
    queryFn: () => bucketListService.getBucketListItem(id),
  })

  const item = itemData?.data

  // 獲取作者資訊
  const { data: biographyData } = useQuery({
    queryKey: ['biography', item?.biography_id],
    queryFn: () => biographyService.getBiographyById(item!.biography_id),
    enabled: !!item?.biography_id,
  })

  const biography = biographyData?.data

  // 獲取留言
  const { data: commentsData, refetch: refetchComments } = useQuery({
    queryKey: ['bucket-list-comments', id],
    queryFn: () => bucketListService.getComments(id),
    enabled: !!id,
  })

  const comments = commentsData?.data || []

  // 提交留言
  const handleSubmitComment = async () => {
    if (!commentText.trim()) return

    setIsSubmittingComment(true)
    try {
      await bucketListService.addComment(id, commentText.trim())
      setCommentText('')
      refetchComments()
      queryClient.invalidateQueries({ queryKey: ['bucket-list-item', id] })
    } catch (err) {
      console.error('Failed to add comment:', err)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  if (isItemLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page-content-bg">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-lg text-[#6D6C6C]">找不到此目標</p>
        <Link href="/biography">
          <Button variant="outline" className="mt-4">
            返回人物誌
          </Button>
        </Link>
      </div>
    )
  }

  const category = categoryConfig[item.category]
  const CategoryIcon = category.icon
  const isCompleted = item.status === 'completed'

  // 計算進度（防止除以零）
  const displayProgress = item.enable_progress
    ? item.progress_mode === 'milestone' && item.milestones && item.milestones.length > 0
      ? Math.round(
          (item.milestones.filter((m) => m.completed).length / item.milestones.length) * 100
        )
      : item.progress
    : null

  return (
    <div className="min-h-screen bg-page-content-bg">
      <div className="container relative mx-auto px-4 pb-4 pt-20">
        {/* 麵包屑 */}
        <div className="mb-8">
          <Breadcrumb
            items={[
              { label: '首頁', href: '/' },
              { label: '人物誌', href: '/biography' },
              ...(biography ? [{ label: biography.name, href: `/biography/profile/${biography.id}` }] : []),
              { label: item.title },
            ]}
          />
        </div>

        {/* 返回按鈕 */}
        <div className="mb-4">
          <motion.div
            className="w-fit"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Link href={biography ? `/biography/profile/${biography.id}` : '/biography'}>
              <Button
                variant="ghost"
                className="flex items-center gap-2 bg-white shadow-sm hover:bg-[#dbd8d8]"
              >
                <ArrowLeft size={16} />
                <span>返回</span>
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* 主要內容 */}
        <motion.div
          className="mx-auto mt-8 max-w-3xl overflow-hidden rounded-lg bg-white shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className={cn('p-6', isCompleted && 'bg-[#FAF40A]/10')}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                {/* 分類標籤 */}
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-medium',
                    category.color
                  )}
                >
                  <CategoryIcon className="h-4 w-4" />
                  {category.label}
                </span>

                {/* 標題 */}
                <h1
                  className={cn(
                    'mt-3 text-2xl font-bold text-[#1B1A1A]',
                    isCompleted && 'line-through decoration-[#FAF40A] decoration-2'
                  )}
                >
                  {item.title}
                </h1>

                {/* 作者 */}
                {biography && (
                  <Link
                    href={`/biography/profile/${biography.id}`}
                    className="mt-2 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#1B1A1A]"
                  >
                    <span>by {biography.name}</span>
                  </Link>
                )}
              </div>

              {/* 完成狀態 */}
              {isCompleted && (
                <span className="flex items-center gap-1.5 rounded-full bg-[#FAF40A] px-3 py-1.5 text-sm font-medium text-[#1B1A1A]">
                  <Check className="h-4 w-4" />
                  已完成
                </span>
              )}
            </div>

            {/* 目標資訊 */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-600">
              {item.target_grade && (
                <span className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  {item.target_grade}
                </span>
              )}
              {item.target_location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {item.target_location}
                </span>
              )}
              {item.target_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  目標：{item.target_date}
                </span>
              )}
              {isCompleted && item.completed_at && (
                <span className="flex items-center gap-1 text-green-600">
                  <Check className="h-4 w-4" />
                  完成於 {new Date(item.completed_at).toLocaleDateString('zh-TW')}
                </span>
              )}
            </div>

            {/* 進度 */}
            {item.enable_progress && displayProgress !== null && !isCompleted && (
              <div className="mt-6">
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

          {/* 描述 */}
          {item.description && (
            <div className="border-t px-6 py-4">
              <h2 className="text-lg font-medium text-[#1B1A1A]">目標描述</h2>
              <p className="mt-2 whitespace-pre-line text-gray-600">{item.description}</p>
            </div>
          )}

          {/* 完成故事 */}
          {isCompleted && (item.completion_story || item.psychological_insights || item.technical_insights) && (
            <div className="border-t bg-yellow-50/50 px-6 py-6">
              <h2 className="text-lg font-medium text-[#1B1A1A]">完成故事</h2>

              {item.completion_story && (
                <div className="mt-4">
                  <p className="whitespace-pre-line text-gray-700">{item.completion_story}</p>
                </div>
              )}

              {item.psychological_insights && (
                <div className="mt-6">
                  <h3 className="flex items-center gap-2 font-medium text-[#1B1A1A]">
                    💭 心理層面
                  </h3>
                  <p className="mt-2 whitespace-pre-line text-gray-600">
                    {item.psychological_insights}
                  </p>
                </div>
              )}

              {item.technical_insights && (
                <div className="mt-6">
                  <h3 className="flex items-center gap-2 font-medium text-[#1B1A1A]">
                    🧗 技術層面
                  </h3>
                  <p className="mt-2 whitespace-pre-line text-gray-600">
                    {item.technical_insights}
                  </p>
                </div>
              )}

              {/* 完成媒體 */}
              {item.completion_media && (
                <div className="mt-6">
                  {/* YouTube */}
                  {item.completion_media.youtube_videos &&
                    item.completion_media.youtube_videos.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="flex items-center gap-2 font-medium text-[#1B1A1A]">
                          <Youtube className="h-4 w-4 text-red-500" />
                          相關影片
                        </h3>
                        <div className="grid gap-2">
                          {item.completion_media.youtube_videos.map((videoId) => (
                            <a
                              key={videoId}
                              href={`https://youtube.com/watch?v=${videoId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 rounded bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                            >
                              <Youtube className="h-4 w-4 text-red-500" />
                              youtube.com/watch?v={videoId}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Instagram */}
                  {item.completion_media.instagram_posts &&
                    item.completion_media.instagram_posts.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <h3 className="flex items-center gap-2 font-medium text-[#1B1A1A]">
                          <Instagram className="h-4 w-4 text-pink-500" />
                          相關貼文
                        </h3>
                        <div className="grid gap-2">
                          {item.completion_media.instagram_posts.map((shortcode) => (
                            <a
                              key={shortcode}
                              href={`https://instagram.com/p/${shortcode}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 rounded bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
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

          {/* 社群互動 */}
          <div className="border-t px-6 py-4">
            <div className="flex items-center gap-6">
              <button className="flex items-center gap-1.5 text-gray-500 hover:text-red-500">
                <Heart className="h-5 w-5" />
                <span>{item.likes_count || 0}</span>
              </button>
              <button className="flex items-center gap-1.5 text-gray-500 hover:text-blue-500">
                <MessageCircle className="h-5 w-5" />
                <span>{item.comments_count || 0}</span>
              </button>
              <button className="flex items-center gap-1.5 text-gray-500 hover:text-green-500">
                <LinkIcon className="h-5 w-5" />
                <span>{item.inspired_count || 0} 人也想做</span>
              </button>
            </div>
          </div>

          {/* 留言區 */}
          <div className="border-t px-6 py-6">
            <h2 className="text-lg font-medium text-[#1B1A1A]">
              留言 ({comments.length})
            </h2>

            {comments.length === 0 ? (
              <p className="mt-4 text-center text-gray-500">還沒有留言，成為第一個留言的人吧！</p>
            ) : (
              <div className="mt-4 space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="rounded-lg bg-gray-50 p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#1B1A1A]">
                        {comment.display_name || comment.username || '匿名用戶'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(comment.created_at).toLocaleDateString('zh-TW')}
                      </span>
                    </div>
                    <p className="mt-2 text-gray-600">{comment.content}</p>
                  </div>
                ))}
              </div>
            )}

            {/* 留言輸入框 */}
            <div className="mt-6">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="分享你的想法..."
                className="w-full rounded-lg border px-4 py-3 text-sm focus:border-[#FAF40A] focus:outline-none"
                rows={3}
                disabled={isSubmittingComment}
              />
              <div className="mt-2 flex justify-end">
                <Button
                  size="sm"
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim() || isSubmittingComment}
                >
                  {isSubmittingComment ? '發表中...' : '發表留言'}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
