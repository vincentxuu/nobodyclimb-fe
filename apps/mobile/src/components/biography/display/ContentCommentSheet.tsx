/**
 * ContentCommentSheet 組件
 *
 * 內容留言面板，對應 apps/web/src/components/biography/display/ContentCommentSheet.tsx
 */
import React, { useState, useCallback, useRef } from 'react'
import {
  StyleSheet,
  View,
  Pressable,
  TextInput,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet'
import { MessageCircle, Send, Trash2 } from 'lucide-react-native'
import { formatDistanceToNow } from 'date-fns'
import { zhTW } from 'date-fns/locale'

import { Text, Avatar, Button } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'
import { useAuthStore } from '@/store/authStore'

interface ContentComment {
  id: string
  content: string
  user_id: string
  user_name: string
  user_avatar?: string
  created_at: string
}

interface ContentCommentSheetProps {
  /** 留言數 */
  commentCount: number
  /** 獲取留言回呼 */
  onFetchComments: () => Promise<ContentComment[]>
  /** 新增留言回呼 */
  onAddComment: (content: string) => Promise<ContentComment>
  /** 刪除留言回呼 */
  onDeleteComment?: (commentId: string) => Promise<void>
  /** 按鈕大小 */
  size?: 'sm' | 'md'
}

export function ContentCommentSheet({
  commentCount,
  onFetchComments,
  onAddComment,
  onDeleteComment,
  size = 'sm',
}: ContentCommentSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null)
  const { user, isAuthenticated } = useAuthStore()

  const [comments, setComments] = useState<ContentComment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [localCount, setLocalCount] = useState(commentCount)

  // 開啟面板
  const handleOpen = useCallback(async () => {
    bottomSheetRef.current?.expand()
    setIsLoading(true)
    try {
      const data = await onFetchComments()
      setComments(data)
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    } finally {
      setIsLoading(false)
    }
  }, [onFetchComments])

  // 發送留言
  const handleSend = useCallback(async () => {
    if (!newComment.trim() || isSending) return

    setIsSending(true)
    try {
      const comment = await onAddComment(newComment.trim())
      setComments((prev) => [comment, ...prev])
      setLocalCount((prev) => prev + 1)
      setNewComment('')
    } catch (error) {
      console.error('Failed to add comment:', error)
    } finally {
      setIsSending(false)
    }
  }, [newComment, isSending, onAddComment])

  // 刪除留言
  const handleDelete = useCallback(
    async (commentId: string) => {
      if (!onDeleteComment) return

      try {
        await onDeleteComment(commentId)
        setComments((prev) => prev.filter((c) => c.id !== commentId))
        setLocalCount((prev) => Math.max(0, prev - 1))
      } catch (error) {
        console.error('Failed to delete comment:', error)
      }
    },
    [onDeleteComment]
  )

  // 格式化時間
  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: zhTW,
      })
    } catch {
      return dateString
    }
  }

  // 渲染背景遮罩
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  )

  // 渲染留言項目
  const renderComment = ({ item }: { item: ContentComment }) => {
    const isOwner = user?.id === item.user_id

    return (
      <View style={styles.commentItem}>
        <Avatar
          size="sm"
          source={item.user_avatar ? { uri: item.user_avatar } : undefined}
        />
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <Text variant="small" fontWeight="500">
              {item.user_name}
            </Text>
            <Text variant="small" color="textMuted">
              {formatTime(item.created_at)}
            </Text>
          </View>
          <Text variant="body" style={styles.commentText}>
            {item.content}
          </Text>
        </View>
        {isOwner && onDeleteComment && (
          <Pressable
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id)}
          >
            <Trash2 size={14} color="#EF4444" />
          </Pressable>
        )}
      </View>
    )
  }

  const iconSize = size === 'sm' ? 16 : 20

  return (
    <>
      {/* 觸發按鈕 */}
      <Pressable style={styles.triggerButton} onPress={handleOpen}>
        <MessageCircle size={iconSize} color={SEMANTIC_COLORS.textSubtle} />
        <Text variant="small" color="textSubtle">
          {localCount}
        </Text>
      </Pressable>

      {/* 留言面板 */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={['70%']}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetIndicator}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
      >
        <BottomSheetView style={styles.sheetContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text variant="h4" fontWeight="600">
              留言 ({localCount})
            </Text>
          </View>

          {/* 留言列表 */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={SEMANTIC_COLORS.textMuted} />
            </View>
          ) : comments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MessageCircle size={32} color={SEMANTIC_COLORS.textMuted} />
              <Text variant="body" color="textSubtle" style={styles.emptyText}>
                還沒有留言，來說點什麼吧！
              </Text>
            </View>
          ) : (
            <FlatList
              data={comments}
              renderItem={renderComment}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* 輸入區 */}
          {isAuthenticated && (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={100}
            >
              <View style={styles.inputContainer}>
                <BottomSheetTextInput
                  style={styles.input}
                  value={newComment}
                  onChangeText={setNewComment}
                  placeholder="寫下你的留言..."
                  placeholderTextColor={SEMANTIC_COLORS.textMuted}
                  multiline
                  maxLength={500}
                />
                <Pressable
                  style={[
                    styles.sendButton,
                    (!newComment.trim() || isSending) && styles.sendButtonDisabled,
                  ]}
                  onPress={handleSend}
                  disabled={!newComment.trim() || isSending}
                >
                  {isSending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Send size={18} color="#FFFFFF" />
                  )}
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          )}
        </BottomSheetView>
      </BottomSheet>
    </>
  )
}

const styles = StyleSheet.create({
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    padding: SPACING.xs,
  },
  sheetBackground: {
    backgroundColor: '#FFFFFF',
  },
  sheetIndicator: {
    backgroundColor: '#D3D3D3',
    width: 40,
  },
  sheetContent: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  listContent: {
    padding: SPACING.md,
  },
  commentItem: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: 2,
  },
  commentText: {
    lineHeight: 20,
  },
  deleteButton: {
    padding: SPACING.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#F5F5F5',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 14,
    color: SEMANTIC_COLORS.textMain,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1B1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#D3D3D3',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyText: {
    marginTop: SPACING.sm,
  },
})

export default ContentCommentSheet
