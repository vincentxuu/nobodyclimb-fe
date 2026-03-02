/**
 * 願望清單詳情頁面
 *
 * 對應 apps/web/src/app/bucket-list/[id]/page.tsx
 */
import React, { useState, useCallback, useMemo } from 'react'
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  TextInput,
  Linking,
  Platform,
} from 'react-native'
import { useLocalSearchParams, useRouter, Link } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Target,
  MapPin,
  Calendar,
  Mountain,
  MessageCircle,
  Link as LinkIcon,
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
  ChevronRight,
} from 'lucide-react-native'
import type { LucideIcon } from 'lucide-react-native'

import { Text, Button, IconButton } from '@/components/ui'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Badge } from '@/components/ui/Badge'
import { FadeIn, SlideUp } from '@/components/animations'
import { api } from '@/lib/api'
import { SEMANTIC_COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '@nobodyclimb/constants'
import type { BucketListItem, BucketListCategory, Milestone, Biography } from '@nobodyclimb/types'

// 分類配置
interface CategoryConfig {
  icon: LucideIcon
  label: string
  bgColor: string
  textColor: string
}

const categoryConfig: Record<BucketListCategory, CategoryConfig> = {
  outdoor_route: { icon: Tent, label: '戶外路線', bgColor: '#D1FAE5', textColor: '#065F46' },
  indoor_grade: { icon: Home, label: '室內難度', bgColor: '#DBEAFE', textColor: '#1E40AF' },
  competition: { icon: Trophy, label: '比賽目標', bgColor: '#FEF3C7', textColor: '#92400E' },
  training: { icon: Dumbbell, label: '訓練目標', bgColor: '#E9D5FF', textColor: '#6B21A8' },
  adventure: { icon: Plane, label: '冒險挑戰', bgColor: '#FFEDD5', textColor: '#C2410C' },
  skill: { icon: Award, label: '技能學習', bgColor: '#FCE7F3', textColor: '#9D174D' },
  injury_recovery: { icon: Activity, label: '受傷復原', bgColor: '#FEE2E2', textColor: '#B91C1C' },
  other: { icon: Target, label: '其他', bgColor: '#F3F4F6', textColor: '#374151' },
}

// 留言類型
interface Comment {
  id: string
  content: string
  user_id: string
  username?: string
  display_name?: string
  avatar_url?: string | null
  created_at: string
}

// API 回應類型
interface BucketListItemResponse {
  data: BucketListItem
}

interface BiographyResponse {
  data: Biography
}

interface CommentsResponse {
  data: Comment[]
}

// 里程碑進度追蹤組件
function MilestoneTracker({
  progress,
  milestones,
  showLabels = true,
}: {
  progress: number
  milestones: Milestone[]
  showLabels?: boolean
}) {
  const sortedMilestones = useMemo(
    () => [...milestones].sort((a, b) => a.percentage - b.percentage),
    [milestones]
  )

  return (
    <View style={milestoneStyles.container}>
      {/* 進度條背景 */}
      <View style={milestoneStyles.trackContainer}>
        <View style={milestoneStyles.track} />
        <View style={[milestoneStyles.progress, { width: `${progress}%` }]} />

        {/* 里程碑點 */}
        <View style={milestoneStyles.milestonesRow}>
          {sortedMilestones.map((milestone) => (
            <View
              key={milestone.id}
              style={[
                milestoneStyles.point,
                milestone.completed && milestoneStyles.pointCompleted,
              ]}
            >
              {milestone.completed ? (
                <Check size={12} color="#1B1A1A" />
              ) : (
                <View style={milestoneStyles.pointInner} />
              )}
            </View>
          ))}
        </View>
      </View>

      {/* 標籤 */}
      {showLabels && (
        <View style={milestoneStyles.labelsRow}>
          {sortedMilestones.map((milestone) => (
            <View key={milestone.id} style={milestoneStyles.labelContainer}>
              <Text
                variant="small"
                color={milestone.completed ? 'textMain' : 'textMuted'}
                numberOfLines={2}
                style={milestoneStyles.labelText}
              >
                {milestone.title}
              </Text>
              <Text variant="small" color="textMuted">
                {milestone.percentage}%
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

const milestoneStyles = StyleSheet.create({
  container: {
    width: '100%',
  },
  trackContainer: {
    position: 'relative',
    height: 24,
    justifyContent: 'center',
  },
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  progress: {
    position: 'absolute',
    left: 0,
    height: 8,
    backgroundColor: 'rgba(250, 244, 10, 0.7)',
    borderRadius: 4,
  },
  milestonesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
  },
  point: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointCompleted: {
    borderColor: '#1B1A1A',
    backgroundColor: 'rgba(250, 244, 10, 0.7)',
  },
  pointInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING[2],
  },
  labelContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  labelText: {
    textAlign: 'center',
    marginBottom: 2,
  },
})

export default function BucketListDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const queryClient = useQueryClient()

  const [commentText, setCommentText] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // 獲取目標詳情
  const {
    data: itemResponse,
    isLoading: isItemLoading,
    error: itemError,
    refetch: refetchItem,
  } = useQuery<BucketListItemResponse>({
    queryKey: ['bucket-list-item', id],
    queryFn: () => api.get(`/bucket-list/${id}`),
    enabled: !!id,
  })

  const item = itemResponse?.data

  // 獲取作者資訊
  const { data: biographyResponse } = useQuery<BiographyResponse>({
    queryKey: ['biography', item?.biography_id],
    queryFn: () => api.get(`/biography/${item!.biography_id}`),
    enabled: !!item?.biography_id,
  })

  const biography = biographyResponse?.data

  // 獲取留言
  const { data: commentsResponse, refetch: refetchComments } = useQuery<CommentsResponse>({
    queryKey: ['bucket-list-comments', id],
    queryFn: () => api.get(`/bucket-list/${id}/comments`),
    enabled: !!id,
  })

  const comments = commentsResponse?.data || []

  // 刷新
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([refetchItem(), refetchComments()])
    setRefreshing(false)
  }, [refetchItem, refetchComments])

  // 提交留言
  const handleSubmitComment = useCallback(async () => {
    if (!commentText.trim() || !id) return

    setIsSubmittingComment(true)
    try {
      await api.post(`/bucket-list/${id}/comments`, { content: commentText.trim() })
      setCommentText('')
      refetchComments()
      queryClient.invalidateQueries({ queryKey: ['bucket-list-item', id] })
    } catch (err) {
      console.error('Failed to add comment:', err)
    } finally {
      setIsSubmittingComment(false)
    }
  }, [id, commentText, refetchComments, queryClient])

  // 計算進度
  const displayProgress = useMemo(() => {
    if (!item?.enable_progress) return null

    let milestones = item.milestones
    if (typeof milestones === 'string') {
      try {
        milestones = JSON.parse(milestones)
      } catch {
        milestones = null
      }
    }

    if (item.progress_mode === 'milestone' && milestones && Array.isArray(milestones) && milestones.length > 0) {
      const completed = milestones.filter((m: Milestone) => m.completed).length
      return Math.round((completed / milestones.length) * 100)
    }
    return item.progress
  }, [item])

  // 返回
  const handleBack = useCallback(() => {
    router.back()
  }, [router])

  // 打開 URL
  const handleOpenUrl = useCallback((url: string) => {
    Linking.openURL(url).catch((err) => console.error('Failed to open URL:', err))
  }, [])

  // 載入中
  if (isItemLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <IconButton
            icon={ArrowLeft}
            size="md"
            variant="ghost"
            onPress={handleBack}
          />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={SEMANTIC_COLORS.textMain} />
        </View>
      </SafeAreaView>
    )
  }

  // 錯誤或找不到
  if (itemError || !item) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <IconButton
            icon={ArrowLeft}
            size="md"
            variant="ghost"
            onPress={handleBack}
          />
        </View>
        <View style={styles.errorContainer}>
          <Text variant="body" color="textMuted" style={styles.errorText}>
            找不到此目標
          </Text>
          <Button
            variant="secondary"
            onPress={() => router.push('/biography')}
            style={styles.errorButton}
          >
            返回人物誌
          </Button>
        </View>
      </SafeAreaView>
    )
  }

  const category = categoryConfig[item.category]
  const CategoryIcon = category.icon
  const isCompleted = item.status === 'completed'

  // 解析里程碑
  let milestones: Milestone[] | null = item.milestones
  if (typeof milestones === 'string') {
    try {
      milestones = JSON.parse(milestones)
    } catch {
      milestones = null
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <FadeIn>
        <View style={styles.header}>
          <IconButton
            icon={ArrowLeft}
            size="md"
            variant="ghost"
            onPress={handleBack}
          />
        </View>
      </FadeIn>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* 主要卡片 */}
        <SlideUp delay={100}>
          <View style={[styles.card, isCompleted && styles.cardCompleted]}>
            {/* Header 區塊 */}
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                {/* 分類標籤 */}
                <View style={[styles.categoryBadge, { backgroundColor: category.bgColor }]}>
                  <CategoryIcon size={14} color={category.textColor} />
                  <Text style={[styles.categoryText, { color: category.textColor }]}>
                    {category.label}
                  </Text>
                </View>

                {/* 標題 */}
                <Text
                  variant="h3"
                  fontWeight="700"
                  style={[styles.title, isCompleted && styles.titleCompleted]}
                >
                  {item.title}
                </Text>

                {/* 作者 */}
                {biography && (
                  <Pressable
                    onPress={() => router.push(`/biography/${biography.slug || biography.id}`)}
                    style={styles.authorLink}
                  >
                    <Text variant="small" color="textMuted">
                      by {biography.name}
                    </Text>
                    <ChevronRight size={14} color={SEMANTIC_COLORS.textMuted} />
                  </Pressable>
                )}
              </View>

              {/* 完成狀態 */}
              {isCompleted && (
                <View style={styles.completedBadge}>
                  <Check size={14} color="#1B1A1A" />
                  <Text style={styles.completedText}>已完成</Text>
                </View>
              )}
            </View>

            {/* 目標資訊 */}
            <View style={styles.metaInfo}>
              {item.target_grade && (
                <View style={styles.metaItem}>
                  <Target size={14} color={SEMANTIC_COLORS.textMuted} />
                  <Text variant="small" color="textMuted" style={styles.metaText}>
                    {item.target_grade}
                  </Text>
                </View>
              )}
              {item.target_location && (
                <View style={styles.metaItem}>
                  <MapPin size={14} color={SEMANTIC_COLORS.textMuted} />
                  <Text variant="small" color="textMuted" style={styles.metaText}>
                    {item.target_location}
                  </Text>
                </View>
              )}
              {item.target_date && (
                <View style={styles.metaItem}>
                  <Calendar size={14} color={SEMANTIC_COLORS.textMuted} />
                  <Text variant="small" color="textMuted" style={styles.metaText}>
                    目標：{item.target_date}
                  </Text>
                </View>
              )}
              {isCompleted && item.completed_at && (
                <View style={styles.metaItem}>
                  <Check size={14} color="#059669" />
                  <Text variant="small" style={[styles.metaText, { color: '#059669' }]}>
                    完成於 {new Date(item.completed_at).toLocaleDateString('zh-TW')}
                  </Text>
                </View>
              )}
            </View>

            {/* 進度 */}
            {item.enable_progress && displayProgress !== null && !isCompleted && (
              <View style={styles.progressSection}>
                {item.progress_mode === 'milestone' && milestones && Array.isArray(milestones) ? (
                  <MilestoneTracker
                    progress={displayProgress}
                    milestones={milestones}
                    showLabels={true}
                  />
                ) : (
                  <View>
                    <ProgressBar value={displayProgress} height={8} />
                    <View style={styles.progressLabelRow}>
                      <Text variant="small" color="textMuted">進度</Text>
                      <Text variant="small" color="textMuted">{displayProgress}%</Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        </SlideUp>

        {/* 描述 */}
        {item.description && (
          <SlideUp delay={200}>
            <View style={styles.section}>
              <Text variant="bodyBold" style={styles.sectionTitle}>目標描述</Text>
              <Text variant="body" color="textSubtle" style={styles.descriptionText}>
                {item.description}
              </Text>
            </View>
          </SlideUp>
        )}

        {/* 完成故事 */}
        {isCompleted && (item.completion_story || item.psychological_insights || item.technical_insights) && (
          <SlideUp delay={300}>
            <View style={[styles.section, styles.completionSection]}>
              <Text variant="bodyBold" style={styles.sectionTitle}>完成故事</Text>

              {item.completion_story && (
                <Text variant="body" color="textSubtle" style={styles.storyText}>
                  {item.completion_story}
                </Text>
              )}

              {item.psychological_insights && (
                <View style={styles.insightBlock}>
                  <Text variant="bodyBold">心理層面</Text>
                  <Text variant="body" color="textSubtle" style={styles.insightText}>
                    {item.psychological_insights}
                  </Text>
                </View>
              )}

              {item.technical_insights && (
                <View style={styles.insightBlock}>
                  <Text variant="bodyBold">技術層面</Text>
                  <Text variant="body" color="textSubtle" style={styles.insightText}>
                    {item.technical_insights}
                  </Text>
                </View>
              )}

              {/* 完成媒體 */}
              {item.completion_media && (
                <View style={styles.mediaSection}>
                  {/* YouTube */}
                  {item.completion_media.youtube_videos && item.completion_media.youtube_videos.length > 0 && (
                    <View style={styles.mediaBlock}>
                      <View style={styles.mediaHeader}>
                        <Youtube size={16} color="#EF4444" />
                        <Text variant="bodyBold" style={styles.mediaTitle}>相關影片</Text>
                      </View>
                      {item.completion_media.youtube_videos.map((videoId) => (
                        <Pressable
                          key={videoId}
                          style={styles.mediaLink}
                          onPress={() => handleOpenUrl(`https://youtube.com/watch?v=${videoId}`)}
                        >
                          <Youtube size={14} color="#EF4444" />
                          <Text variant="small" color="textMuted" style={styles.mediaLinkText}>
                            youtube.com/watch?v={videoId}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}

                  {/* Instagram */}
                  {item.completion_media.instagram_posts && item.completion_media.instagram_posts.length > 0 && (
                    <View style={styles.mediaBlock}>
                      <View style={styles.mediaHeader}>
                        <Instagram size={16} color="#EC4899" />
                        <Text variant="bodyBold" style={styles.mediaTitle}>相關貼文</Text>
                      </View>
                      {item.completion_media.instagram_posts.map((shortcode) => (
                        <Pressable
                          key={shortcode}
                          style={styles.mediaLink}
                          onPress={() => handleOpenUrl(`https://instagram.com/p/${shortcode}`)}
                        >
                          <Instagram size={14} color="#EC4899" />
                          <Text variant="small" color="textMuted" style={styles.mediaLinkText}>
                            instagram.com/p/{shortcode}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          </SlideUp>
        )}

        {/* 社群互動 */}
        <SlideUp delay={400}>
          <View style={styles.section}>
            <View style={styles.socialStats}>
              <Pressable style={styles.socialItem}>
                <Mountain size={20} color={SEMANTIC_COLORS.textMuted} />
                <Text variant="body" color="textMuted">{item.likes_count || 0}</Text>
              </Pressable>
              <Pressable style={styles.socialItem}>
                <MessageCircle size={20} color={SEMANTIC_COLORS.textMuted} />
                <Text variant="body" color="textMuted">{item.comments_count || 0}</Text>
              </Pressable>
              <Pressable style={styles.socialItem}>
                <LinkIcon size={20} color={SEMANTIC_COLORS.textMuted} />
                <Text variant="body" color="textMuted">{item.inspired_count || 0} 人也想做</Text>
              </Pressable>
            </View>
          </View>
        </SlideUp>

        {/* 留言區 */}
        <SlideUp delay={500}>
          <View style={styles.section}>
            <Text variant="bodyBold" style={styles.sectionTitle}>
              留言 ({comments.length})
            </Text>

            {comments.length === 0 ? (
              <Text variant="body" color="textMuted" style={styles.emptyComments}>
                還沒有留言，成為第一個留言的人吧！
              </Text>
            ) : (
              <View style={styles.commentsList}>
                {comments.map((comment) => (
                  <View key={comment.id} style={styles.commentItem}>
                    <View style={styles.commentHeader}>
                      <Text variant="bodyBold">
                        {comment.display_name || comment.username || '匿名用戶'}
                      </Text>
                      <Text variant="small" color="textMuted">
                        {new Date(comment.created_at).toLocaleDateString('zh-TW')}
                      </Text>
                    </View>
                    <Text variant="body" color="textSubtle" style={styles.commentContent}>
                      {comment.content}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* 留言輸入框 */}
            <View style={styles.commentInput}>
              <TextInput
                style={styles.textInput}
                value={commentText}
                onChangeText={setCommentText}
                placeholder="分享你的想法..."
                placeholderTextColor={SEMANTIC_COLORS.textMuted}
                multiline
                numberOfLines={3}
                editable={!isSubmittingComment}
              />
              <View style={styles.commentActions}>
                <Button
                  size="sm"
                  onPress={handleSubmitComment}
                  disabled={!commentText.trim() || isSubmittingComment}
                >
                  {isSubmittingComment ? '發表中...' : '發表留言'}
                </Button>
              </View>
            </View>
          </View>
        </SlideUp>

        {/* 底部留白 */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SEMANTIC_COLORS.pageBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING[2],
    paddingVertical: SPACING[2],
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING[4],
    paddingTop: SPACING[4],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING[4],
  },
  errorText: {
    textAlign: 'center',
    marginBottom: SPACING[4],
  },
  errorButton: {
    minWidth: 120,
  },

  // 主要卡片
  card: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING[4],
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  cardCompleted: {
    backgroundColor: 'rgba(250, 244, 10, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: SPACING[2],
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING[2],
    paddingVertical: SPACING[1],
    borderRadius: BORDER_RADIUS.full,
    gap: 4,
  },
  categoryText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  title: {
    marginTop: SPACING[3],
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    textDecorationColor: '#FAF40A',
  },
  authorLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING[2],
    gap: 2,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF40A',
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[1.5],
    borderRadius: BORDER_RADIUS.full,
    gap: 4,
  },
  completedText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: '#1B1A1A',
  },

  // Meta 資訊
  metaInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING[4],
    gap: SPACING[4],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    marginLeft: 2,
  },

  // 進度區塊
  progressSection: {
    marginTop: SPACING[6],
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING[1],
  },

  // 區塊
  section: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING[4],
    marginTop: SPACING[3],
  },
  sectionTitle: {
    marginBottom: SPACING[3],
  },
  descriptionText: {
    lineHeight: 24,
  },

  // 完成故事
  completionSection: {
    backgroundColor: 'rgba(254, 249, 195, 0.5)',
  },
  storyText: {
    lineHeight: 24,
  },
  insightBlock: {
    marginTop: SPACING[4],
  },
  insightText: {
    marginTop: SPACING[2],
    lineHeight: 24,
  },
  mediaSection: {
    marginTop: SPACING[4],
  },
  mediaBlock: {
    marginTop: SPACING[3],
  },
  mediaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    marginBottom: SPACING[2],
  },
  mediaTitle: {
    marginLeft: 4,
  },
  mediaLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SEMANTIC_COLORS.cardBg,
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING[2],
    marginBottom: SPACING[2],
  },
  mediaLinkText: {
    flex: 1,
  },

  // 社群互動
  socialStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[6],
  },
  socialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1.5],
  },

  // 留言區
  emptyComments: {
    textAlign: 'center',
    paddingVertical: SPACING[4],
  },
  commentsList: {
    gap: SPACING[3],
  },
  commentItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING[4],
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING[2],
  },
  commentContent: {
    lineHeight: 22,
  },
  commentInput: {
    marginTop: SPACING[4],
  },
  textInput: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
    fontSize: FONT_SIZE.sm,
    color: SEMANTIC_COLORS.textMain,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  commentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: SPACING[2],
  },

  bottomPadding: {
    height: SPACING[8],
  },
})
