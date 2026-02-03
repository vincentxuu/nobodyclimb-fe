/**
 * ContentInteractionBar 組件
 *
 * 內容互動列，對應 apps/web/src/components/biography/display/ContentInteractionBar.tsx
 */
import React from 'react'
import { StyleSheet, View } from 'react-native'

import { SPACING } from '@nobodyclimb/constants'
import { ContentLikeButton } from './ContentLikeButton'
import { ContentCommentSheet } from './ContentCommentSheet'
import { QuickReactionBar } from './QuickReactionBar'

type ContentType = 'core-stories' | 'one-liners' | 'stories'

interface ContentComment {
  id: string
  content: string
  user_id: string
  user_name: string
  user_avatar?: string
  created_at: string
}

interface ContentInteractionBarProps {
  /** 內容類型 */
  contentType: ContentType
  /** 內容 ID */
  contentId: string
  /** 是否已按讚 */
  isLiked: boolean
  /** 按讚數 */
  likeCount: number
  /** 留言數 */
  commentCount: number
  /** 按讚切換回呼 */
  onToggleLike: () => Promise<{ liked: boolean; like_count: number }>
  /** 獲取留言回呼 */
  onFetchComments: () => Promise<ContentComment[]>
  /** 新增留言回呼 */
  onAddComment: (content: string) => Promise<ContentComment>
  /** 刪除留言回呼 */
  onDeleteComment?: (commentId: string) => Promise<void>
  /** 按鈕大小 */
  size?: 'sm' | 'md'
  /** 是否顯示分隔線 */
  showBorder?: boolean
  /** 是否置中對齊 */
  centered?: boolean
}

export function ContentInteractionBar({
  contentType,
  contentId,
  isLiked,
  likeCount,
  commentCount,
  onToggleLike,
  onFetchComments,
  onAddComment,
  onDeleteComment,
  size = 'sm',
  showBorder = true,
  centered = false,
}: ContentInteractionBarProps) {
  return (
    <View
      style={[
        styles.container,
        showBorder && styles.withBorder,
        centered && styles.centered,
      ]}
    >
      <QuickReactionBar
        contentType={contentType}
        contentId={contentId}
        size={size}
      />
      <View style={[styles.actionsRow, centered && styles.actionsCentered]}>
        <ContentLikeButton
          isLiked={isLiked}
          likeCount={likeCount}
          onToggle={onToggleLike}
          size={size}
        />
        <ContentCommentSheet
          commentCount={commentCount}
          onFetchComments={onFetchComments}
          onAddComment={onAddComment}
          onDeleteComment={onDeleteComment}
          size={size}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
  },
  withBorder: {
    borderTopWidth: 1,
    borderTopColor: '#EBEAEA',
  },
  centered: {
    alignItems: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.xs,
    paddingLeft: 2,
  },
  actionsCentered: {
    justifyContent: 'center',
  },
})

export default ContentInteractionBar
