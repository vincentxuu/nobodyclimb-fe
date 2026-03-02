/**
 * CommentSection 組件
 *
 * 部落格文章評論區塊
 * 對應 apps/web/src/components/blog/CommentSection.tsx
 */
import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Keyboard,
  ActivityIndicator,
} from 'react-native'
import { MessageCircle, Send, Trash2 } from 'lucide-react-native'
import { formatDistanceToNow } from 'date-fns'
import { zhTW } from 'date-fns/locale'

import { Text, Button, TextArea, Avatar, useToast } from '@/components/ui'
import { Link } from '@/components/ui/Link'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import {
  SEMANTIC_COLORS,
  SPACING,
  BORDER_RADIUS,
  WB_COLORS,
} from '@nobodyclimb/constants'

// 評論類型定義
interface CommentData {
  id: string
  content: string
  created_at: string
  user_id: string
  username: string
  display_name?: string
  avatar_url?: string
}

interface CommentSectionProps {
  /** 文章 ID */
  postId: string
  /** 是否已登入 */
  isLoggedIn?: boolean
}

/**
 * 格式化時間
 */
function formatTime(dateString: string): string {
  try {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: zhTW,
    })
  } catch {
    return dateString
  }
}

// ============================================
// CommentItem 單個評論元件
// ============================================

interface CommentItemProps {
  comment: CommentData
  currentUserId?: string
  onDelete: (id: string) => void
}

function CommentItem({ comment, currentUserId, onDelete }: CommentItemProps) {
  const displayName = comment.display_name || comment.username || '匿名用戶'
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <View style={styles.commentItem}>
      <Avatar
        source={comment.avatar_url ? { uri: comment.avatar_url } : undefined}
        alt={displayName}
        size="sm"
      />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text variant="body" fontWeight="500">
            {displayName}
          </Text>
          <Text variant="small" color="textMuted" style={styles.commentTime}>
            {formatTime(comment.created_at)}
          </Text>
          {currentUserId === comment.user_id && (
            <Pressable
              onPress={() => onDelete(comment.id)}
              style={styles.deleteButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Trash2 size={14} color={SEMANTIC_COLORS.textMuted} />
            </Pressable>
          )}
        </View>
        <Text variant="body" color="textSubtle" style={styles.commentText}>
          {comment.content}
        </Text>
      </View>
    </View>
  )
}

// ============================================
// CommentForm 評論輸入框元件
// ============================================

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>
  isSubmitting: boolean
  isLoggedIn: boolean
}

function CommentForm({ onSubmit, isSubmitting, isLoggedIn }: CommentFormProps) {
  const [content, setContent] = useState('')

  const handleSubmit = useCallback(async () => {
    if (!content.trim()) return

    Keyboard.dismiss()
    await onSubmit(content)
    setContent('')
  }, [content, onSubmit])

  if (!isLoggedIn) {
    return (
      <View style={styles.loginPrompt}>
        <Link href="/auth/login" style={styles.loginLink}>
          <Text variant="body" color="textSubtle">
            <Text
              variant="body"
              style={{ color: SEMANTIC_COLORS.brandPrimary }}
            >
              登入
            </Text>
            {' 後才能留言'}
          </Text>
        </Link>
      </View>
    )
  }

  return (
    <View style={styles.form}>
      <TextArea
        value={content}
        onChangeText={setContent}
        placeholder="寫下你的留言..."
        minRows={2}
        maxRows={4}
        editable={!isSubmitting}
        style={styles.textarea}
      />
      <Button
        variant="primary"
        size="sm"
        onPress={handleSubmit}
        disabled={!content.trim() || isSubmitting}
        loading={isSubmitting}
        style={styles.submitButton}
      >
        {!isSubmitting && <Send size={16} color="#FFFFFF" />}
      </Button>
    </View>
  )
}

// ============================================
// EmptyComments 空評論狀態
// ============================================

function EmptyComments() {
  return (
    <View style={styles.emptyState}>
      <Text variant="body" color="textMuted" style={styles.emptyText}>
        還沒有留言，成為第一個留言的人吧！
      </Text>
    </View>
  )
}

// ============================================
// LoadingComments 載入狀態
// ============================================

function LoadingComments() {
  return (
    <View style={styles.loadingState}>
      <ActivityIndicator size="small" color={SEMANTIC_COLORS.textMuted} />
    </View>
  )
}

// ============================================
// CommentSection 主組件
// ============================================

export function CommentSection({
  postId,
  isLoggedIn = false,
}: CommentSectionProps) {
  const toast = useToast()
  const { user } = useAuthStore()
  const [comments, setComments] = useState<CommentData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [totalComments, setTotalComments] = useState(0)

  // 獲取評論列表
  const fetchComments = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await api.get<{ success: boolean; data: CommentData[] }>(
        `/posts/${postId}/comments`
      )
      if (response.data.success && response.data.data) {
        setComments(response.data.data)
        setTotalComments(response.data.data.length)
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err)
    } finally {
      setIsLoading(false)
    }
  }, [postId])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  // 提交評論
  const handleSubmitComment = useCallback(
    async (content: string) => {
      setIsSubmitting(true)
      try {
        const response = await api.post<{ success: boolean; data: CommentData }>(
          `/posts/${postId}/comments`,
          { content }
        )
        if (response.data.success && response.data.data) {
          const newComment = response.data.data
          setComments((prev) => [newComment, ...prev])
          setTotalComments((prev) => prev + 1)
          toast.show({
            message: '留言發表成功',
            variant: 'success',
          })
        }
      } catch (err) {
        console.error('Failed to submit comment:', err)
        toast.show({
          message: '留言發表失敗，請稍後再試',
          variant: 'error',
        })
      } finally {
        setIsSubmitting(false)
      }
    },
    [postId, toast]
  )

  // 刪除評論
  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      try {
        await api.delete(`/posts/${postId}/comments/${commentId}`)
        setComments((prev) => prev.filter((c) => c.id !== commentId))
        setTotalComments((prev) => Math.max(0, prev - 1))
        toast.show({
          message: '留言已刪除',
          variant: 'success',
        })
      } catch (err) {
        console.error('Failed to delete comment:', err)
        toast.show({
          message: '刪除留言失敗，請稍後再試',
          variant: 'error',
        })
      }
    },
    [postId, toast]
  )

  // 渲染單個評論
  const renderComment = useCallback(
    ({ item }: { item: CommentData }) => (
      <CommentItem
        comment={item}
        currentUserId={user?.id}
        onDelete={handleDeleteComment}
      />
    ),
    [user?.id, handleDeleteComment]
  )

  const keyExtractor = useCallback((item: CommentData) => item.id, [])

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <MessageCircle size={18} color={SEMANTIC_COLORS.textSubtle} />
        <Text variant="body" color="textSubtle" style={styles.headerText}>
          {totalComments} 則留言
        </Text>
      </View>

      {/* Comment Form */}
      <CommentForm
        onSubmit={handleSubmitComment}
        isSubmitting={isSubmitting}
        isLoggedIn={isLoggedIn}
      />

      {/* Comments List */}
      {isLoading ? (
        <LoadingComments />
      ) : comments.length > 0 ? (
        <FlatList
          data={comments}
          renderItem={renderComment}
          keyExtractor={keyExtractor}
          scrollEnabled={false}
          contentContainerStyle={styles.commentsList}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      ) : (
        <EmptyComments />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: WB_COLORS[10],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerText: {
    marginLeft: SPACING.xs,
  },
  // Form styles
  form: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  textarea: {
    flex: 1,
  },
  submitButton: {
    marginBottom: 2,
  },
  loginPrompt: {
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
  },
  loginLink: {
    // Link 樣式
  },
  // Comment list styles
  commentsList: {
    // List 內容樣式
  },
  separator: {
    height: SPACING.md,
  },
  // Comment item styles
  commentItem: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  commentContent: {
    flex: 1,
    minWidth: 0,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  commentTime: {
    marginLeft: SPACING.xs,
  },
  deleteButton: {
    marginLeft: 'auto',
    padding: SPACING.xs,
  },
  commentText: {
    marginTop: SPACING.xs,
  },
  // Empty state
  emptyState: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
  // Loading state
  loadingState: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export default CommentSection
