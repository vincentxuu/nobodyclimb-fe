/**
 * HeroSection 組件
 *
 * 傳記頁面 Hero 區，對應 apps/web/src/components/biography/profile/HeroSection.tsx
 */

import { RADIUS, SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import { formatDistanceToNow } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { useRouter } from 'expo-router'
import { Eye, MessageCircle, Users } from 'lucide-react-native'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native'
import Animated, { FadeIn } from 'react-native-reanimated'
import { ShareButton } from '@/components/shared/ShareButton'
import { Avatar, Text } from '@/components/ui'
import { type BiographyComment, biographyService } from '@/lib/biographyService'
import { useAuthStore } from '@/store/authStore'
import { BiographyLikeButton } from '../biography-like-button'
import { FollowButton } from '../follow-button'
import { ProfileAvatar } from '../shared/ProfileAvatar'
import { CompactSocialLinks } from '../social-links'

// 類型定義
interface Biography {
  id: string
  name: string
  title?: string
  avatar_url?: string
  cover_image?: string
  social_links?: string
  total_views?: number
  total_likes?: number
  comment_count?: number
}

interface HeroSectionProps {
  person: Biography
  followerCount: number
  isOwner: boolean
  onFollowChange?: (isFollowing: boolean) => void
}

/**
 * Hero Section - 標題區
 * 封面圖橫幅 + 頭像疊在左下角
 */
export function HeroSection({ person, followerCount, isOwner, onFollowChange }: HeroSectionProps) {
  const router = useRouter()
  const { width: screenWidth } = useWindowDimensions()
  const coverHeight = screenWidth / 3 // 3:1 比例
  const { user, isAuthenticated } = useAuthStore()

  const [likesCount, setLikesCount] = useState(person.total_likes || 0)
  const [showComments, setShowComments] = useState(false)
  const [commentsCount, setCommentsCount] = useState(person.comment_count || 0)
  const [comments, setComments] = useState<BiographyComment[]>([])
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [commentInput, setCommentInput] = useState('')

  // 解析社群連結
  const socialLinks = useMemo(() => {
    if (!person.social_links) return null
    try {
      return JSON.parse(person.social_links)
    } catch {
      return null
    }
  }, [person.social_links])

  // 預設封面圖
  const coverImage = person.cover_image || `https://picsum.photos/seed/${person.id}/800/300`

  const loadComments = useCallback(async () => {
    if (!person.id) return
    setIsLoadingComments(true)
    try {
      const response = await biographyService.getComments(person.id)
      if (!response.success || !response.data) {
        throw new Error(response.message || response.error || '留言載入失敗')
      }
      setComments(response.data)
      setCommentsCount(response.data.length)
    } catch (error) {
      const message = error instanceof Error ? error.message : '請稍後再試'
      Alert.alert('留言載入失敗', message)
    } finally {
      setIsLoadingComments(false)
    }
  }, [person.id])

  useEffect(() => {
    if (showComments) {
      void loadComments()
    }
  }, [loadComments, showComments])

  const handleSubmitComment = async () => {
    if (!isAuthenticated) {
      router.push('/auth/login' as never)
      return
    }
    if (!commentInput.trim() || isSubmittingComment) return

    setIsSubmittingComment(true)
    try {
      const response = await biographyService.addComment(person.id, commentInput.trim())
      if (!response.success || !response.data) {
        throw new Error(response.message || response.error || '留言送出失敗')
      }
      setComments((prev) => [response.data as BiographyComment, ...prev])
      setCommentsCount((prev) => prev + 1)
      setCommentInput('')
    } catch (error) {
      const message = error instanceof Error ? error.message : '請稍後再試'
      Alert.alert('留言送出失敗', message)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await biographyService.deleteComment(commentId)
      if (!response.success) {
        throw new Error(response.message || response.error || '留言刪除失敗')
      }
      setComments((prev) => prev.filter((comment) => comment.id !== commentId))
      setCommentsCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      const message = error instanceof Error ? error.message : '請稍後再試'
      Alert.alert('留言刪除失敗', message)
    }
  }

  const formatCommentTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: zhTW })
    } catch {
      return dateString
    }
  }

  const getCommentName = (comment: BiographyComment) =>
    comment.display_name || comment.username || '匿名'

  return (
    <View style={styles.container}>
      {/* 封面圖片區域 */}
      <View style={[styles.coverContainer, { height: coverHeight }]}>
        <Image source={{ uri: coverImage }} style={styles.coverImage} resizeMode="cover" />
      </View>

      {/* 內容區域 */}
      <View style={styles.contentContainer}>
        {/* 頭像 - 疊在封面底部 */}
        <View style={styles.avatarContainer}>
          <ProfileAvatar src={person.avatar_url} name={person.name || 'anonymous'} size={100} />
        </View>

        {/* 資訊區域 */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.infoContainer}>
          {/* 名字與描述 */}
          <View style={styles.nameContainer}>
            <Text variant="h2" fontWeight="700">
              {person.name}
            </Text>
            {person.title && (
              <Text variant="body" color="textSubtle" style={styles.title}>
                {person.title}
              </Text>
            )}
            {/* 社群連結 */}
            {socialLinks && (
              <CompactSocialLinks socialLinks={socialLinks} style={styles.socialLinks} />
            )}
          </View>

          {/* 操作按鈕與統計 */}
          <View style={styles.actionsContainer}>
            {!isOwner && person.id && (
              <FollowButton biographyId={person.id} onFollowChange={onFollowChange} />
            )}

            {/* 社群統計 */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Eye size={16} color={SEMANTIC_COLORS.textMuted} />
                <Text variant="small" color="textMuted">
                  {person.total_views || 0}
                </Text>
              </View>

              <BiographyLikeButton
                biographyId={person.id}
                initialCount={likesCount}
                onLikeChange={(_isLiked, count) => setLikesCount(count)}
                showCount
              />

              <View style={styles.statItem}>
                <Users size={16} color={SEMANTIC_COLORS.textMuted} />
                <Text variant="small" color="textMuted">
                  {followerCount}
                </Text>
              </View>

              <Pressable style={styles.statItem} onPress={() => setShowComments(!showComments)}>
                <MessageCircle size={16} color={SEMANTIC_COLORS.textMuted} />
                <Text variant="small" color="textMuted">
                  {commentsCount}
                </Text>
              </Pressable>

              <ShareButton
                title={`${person.name} 的攀岩人物誌 - NobodyClimb`}
                description={person.title || `來看看 ${person.name} 的攀岩故事`}
              />
            </View>
          </View>
        </Animated.View>

        {showComments && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.commentsContainer}>
            <View style={styles.commentsHeader}>
              <Text variant="bodyBold">留言 ({commentsCount})</Text>
              <Pressable onPress={() => setShowComments(false)}>
                <Text variant="small" color="textMuted">
                  收合
                </Text>
              </Pressable>
            </View>

            {isAuthenticated ? (
              <View style={styles.commentInputRow}>
                <TextInput
                  style={styles.commentInput}
                  value={commentInput}
                  onChangeText={setCommentInput}
                  placeholder="寫下你的留言..."
                  placeholderTextColor={SEMANTIC_COLORS.textMuted}
                  multiline
                  maxLength={500}
                />
                <Pressable
                  style={[
                    styles.commentSubmitButton,
                    (!commentInput.trim() || isSubmittingComment) && styles.commentSubmitDisabled,
                  ]}
                  onPress={handleSubmitComment}
                  disabled={!commentInput.trim() || isSubmittingComment}
                >
                  {isSubmittingComment ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text variant="small" fontWeight="600" style={styles.commentSubmitText}>
                      送出
                    </Text>
                  )}
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={styles.loginPrompt}
                onPress={() => router.push('/auth/login' as never)}
              >
                <Text variant="small" color="textMuted">
                  登入後即可留言
                </Text>
              </Pressable>
            )}

            {isLoadingComments ? (
              <View style={styles.commentsLoading}>
                <ActivityIndicator color={SEMANTIC_COLORS.textMain} />
              </View>
            ) : comments.length === 0 ? (
              <Text variant="small" color="textMuted" style={styles.emptyComments}>
                還沒有留言，來說點什麼吧！
              </Text>
            ) : (
              <View style={styles.commentList}>
                {comments.map((comment) => {
                  const isCommentOwner = user?.id === comment.user_id
                  return (
                    <View key={comment.id} style={styles.commentItem}>
                      <Avatar
                        size="sm"
                        source={comment.avatar_url ? { uri: comment.avatar_url } : undefined}
                      />
                      <View style={styles.commentBody}>
                        <View style={styles.commentMetaRow}>
                          <Text variant="small" fontWeight="600">
                            {getCommentName(comment)}
                          </Text>
                          <Text variant="small" color="textMuted">
                            {formatCommentTime(comment.created_at)}
                          </Text>
                          {isCommentOwner && (
                            <Pressable onPress={() => handleDeleteComment(comment.id)}>
                              <Text variant="small" style={styles.deleteCommentText}>
                                刪除
                              </Text>
                            </Pressable>
                          )}
                        </View>
                        <Text variant="body" style={styles.commentText}>
                          {comment.content}
                        </Text>
                      </View>
                    </View>
                  )
                })}
              </View>
            )}
          </Animated.View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: WB_COLORS[0],
  },
  coverContainer: {
    width: '100%',
    backgroundColor: '#E5E5E5',
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    paddingHorizontal: SPACING.md,
  },
  avatarContainer: {
    marginTop: -50,
    marginBottom: SPACING.md,
  },
  infoContainer: {
    paddingBottom: SPACING.md,
  },
  nameContainer: {
    marginBottom: SPACING.md,
  },
  title: {
    marginTop: 4,
  },
  socialLinks: {
    marginTop: SPACING.sm,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    gap: SPACING.md,
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  commentInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderRadius: RADIUS.md,
    backgroundColor: WB_COLORS[10],
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: SEMANTIC_COLORS.textMain,
    fontSize: 14,
  },
  commentSubmitButton: {
    minHeight: 44,
    minWidth: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    backgroundColor: SEMANTIC_COLORS.textMain,
    paddingHorizontal: SPACING.sm,
  },
  commentSubmitDisabled: {
    opacity: 0.45,
  },
  commentSubmitText: {
    color: '#FFFFFF',
  },
  loginPrompt: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: WB_COLORS[10],
  },
  commentsLoading: {
    paddingVertical: SPACING.lg,
  },
  emptyComments: {
    textAlign: 'center',
    paddingVertical: SPACING.md,
  },
  commentList: {
    gap: SPACING.md,
  },
  commentItem: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  commentBody: {
    flex: 1,
    gap: 2,
  },
  commentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  commentText: {
    lineHeight: 20,
  },
  deleteCommentText: {
    color: '#D94A4A',
  },
})

export default HeroSection
