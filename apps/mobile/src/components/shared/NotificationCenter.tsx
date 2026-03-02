/**
 * NotificationCenter 組件
 *
 * 通知中心，對應 apps/web/src/components/shared/notification-center.tsx
 */
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { StyleSheet, View, Pressable, FlatList, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet'
import {
  Bell,
  Mountain,
  MessageCircle,
  UserPlus,
  Sparkles,
  Check,
  CheckCheck,
  Trash2,
  X,
  FileText,
  Megaphone,
} from 'lucide-react-native'
import { formatDistanceToNow } from 'date-fns'
import { zhTW } from 'date-fns/locale'

import { useAuthStore } from '@/store/authStore'
import { Text, Button, IconButton } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

// 通知類型枚舉
enum NotificationType {
  GOAL_LIKED = 'goal_liked',
  GOAL_COMMENTED = 'goal_commented',
  GOAL_REFERENCED = 'goal_referenced',
  NEW_FOLLOWER = 'new_follower',
  STORY_FEATURED = 'story_featured',
  BIOGRAPHY_COMMENTED = 'biography_commented',
  POST_LIKED = 'post_liked',
  POST_COMMENTED = 'post_commented',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
}

interface Notification {
  id: string
  type: string
  title: string
  message: string
  is_read: number
  created_at: string
  data?: Record<string, unknown>
}

// 通知類型對應的 Icon
const notificationIcons: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  [NotificationType.GOAL_LIKED]: Mountain,
  [NotificationType.GOAL_COMMENTED]: MessageCircle,
  [NotificationType.GOAL_REFERENCED]: Sparkles,
  [NotificationType.NEW_FOLLOWER]: UserPlus,
  [NotificationType.STORY_FEATURED]: Sparkles,
  [NotificationType.BIOGRAPHY_COMMENTED]: MessageCircle,
  [NotificationType.POST_LIKED]: Mountain,
  [NotificationType.POST_COMMENTED]: FileText,
  [NotificationType.SYSTEM_ANNOUNCEMENT]: Megaphone,
}

// 通知類型對應的顏色
const notificationColors: Record<string, { text: string; bg: string }> = {
  [NotificationType.GOAL_LIKED]: { text: '#1B1A1A', bg: 'rgba(255, 231, 12, 0.2)' },
  [NotificationType.GOAL_COMMENTED]: { text: '#3B82F6', bg: '#EFF6FF' },
  [NotificationType.GOAL_REFERENCED]: { text: '#F59E0B', bg: '#FFFBEB' },
  [NotificationType.NEW_FOLLOWER]: { text: '#22C55E', bg: '#F0FDF4' },
  [NotificationType.STORY_FEATURED]: { text: '#A855F7', bg: '#FAF5FF' },
  [NotificationType.BIOGRAPHY_COMMENTED]: { text: '#6366F1', bg: '#EEF2FF' },
  [NotificationType.POST_LIKED]: { text: '#1B1A1A', bg: 'rgba(255, 231, 12, 0.2)' },
  [NotificationType.POST_COMMENTED]: { text: '#06B6D4', bg: '#ECFEFF' },
  [NotificationType.SYSTEM_ANNOUNCEMENT]: { text: '#1B1A1A', bg: 'rgba(255, 231, 12, 0.3)' },
}

interface NotificationCenterProps {
  /** 自訂樣式 */
  style?: object
}

export function NotificationCenter({ style }: NotificationCenterProps) {
  const router = useRouter()
  const bottomSheetRef = useRef<BottomSheet>(null)
  const { isAuthenticated, status } = useAuthStore()
  const isInitialized = status !== 'idle'

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  // 載入未讀數量
  const loadUnreadCount = useCallback(async () => {
    if (!isInitialized || !isAuthenticated) return
    try {
      // TODO: 整合 notificationService
      // const response = await notificationService.getUnreadCount()
      // if (response.success && response.data) {
      //   setUnreadCount(response.data.count)
      // }
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to load unread count:', error)
      }
    }
  }, [isAuthenticated, isInitialized])

  // 載入通知列表
  const loadNotifications = useCallback(
    async (pageNum = 1, append = false) => {
      if (!isInitialized || !isAuthenticated) return
      setIsLoading(true)
      try {
        // TODO: 整合 notificationService
        // const response = await notificationService.getNotifications(pageNum, 10)
        // if (response.success && response.data) {
        //   const newData = response.data
        //   if (append) {
        //     setNotifications((prev) => [...prev, ...newData])
        //   } else {
        //     setNotifications(newData)
        //   }
        //   setHasMore(response.pagination.page < response.pagination.total_pages)
        // }
      } catch (error) {
        if (__DEV__) {
          console.error('Failed to load notifications:', error)
        }
      } finally {
        setIsLoading(false)
      }
    },
    [isAuthenticated, isInitialized]
  )

  // 初始載入
  useEffect(() => {
    loadUnreadCount()
    const interval = setInterval(loadUnreadCount, 60000)
    return () => clearInterval(interval)
  }, [loadUnreadCount])

  // 打開通知面板
  const handleOpen = useCallback(() => {
    setPage(1)
    loadNotifications(1)
    bottomSheetRef.current?.expand()
  }, [loadNotifications])

  // 標記為已讀
  const handleMarkAsRead = async (id: string) => {
    try {
      // TODO: 整合 notificationService
      // await notificationService.markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  // 全部標記為已讀
  const handleMarkAllAsRead = async () => {
    try {
      // TODO: 整合 notificationService
      // await notificationService.markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  // 刪除通知
  const handleDelete = async (id: string) => {
    try {
      // TODO: 整合 notificationService
      // await notificationService.deleteNotification(id)
      const notification = notifications.find((n) => n.id === id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      if (notification && !notification.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  // 載入更多
  const handleLoadMore = () => {
    if (isLoading || !hasMore) return
    const nextPage = page + 1
    setPage(nextPage)
    loadNotifications(nextPage, true)
  }

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

  // 渲染通知項目
  const renderNotificationItem = ({ item }: { item: Notification }) => {
    const Icon = notificationIcons[item.type] || Bell
    const colors = notificationColors[item.type] || { text: '#6B7280', bg: '#F3F4F6' }

    return (
      <Pressable
        style={[
          styles.notificationItem,
          !item.is_read && styles.notificationItemUnread,
        ]}
        onPress={() => handleMarkAsRead(item.id)}
      >
        <View style={[styles.iconContainer, { backgroundColor: colors.bg }]}>
          <Icon size={20} color={colors.text} />
        </View>

        <View style={styles.notificationContent}>
          <Text fontWeight="500" numberOfLines={1}>
            {item.title}
          </Text>
          <Text variant="small" color="textSubtle" numberOfLines={2} style={styles.message}>
            {item.message}
          </Text>
          <Text variant="small" color="textMuted" style={styles.time}>
            {formatTime(item.created_at)}
          </Text>
        </View>

        <View style={styles.actions}>
          {!item.is_read && (
            <Pressable
              style={styles.actionButton}
              onPress={() => handleMarkAsRead(item.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Check size={16} color="#22C55E" />
            </Pressable>
          )}
          <Pressable
            style={styles.actionButton}
            onPress={() => handleDelete(item.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Trash2 size={16} color="#EF4444" />
          </Pressable>
        </View>
      </Pressable>
    )
  }

  if (!isAuthenticated) return null

  return (
    <View style={style}>
      {/* 通知按鈕 */}
      <Pressable style={styles.bellButton} onPress={handleOpen}>
        <Bell size={20} color={SEMANTIC_COLORS.textMain} />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </Pressable>

      {/* 通知 BottomSheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={['80%']}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetIndicator}
      >
        <BottomSheetView style={styles.sheetContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text variant="h4" fontWeight="600">
              通知
            </Text>
            <View style={styles.headerActions}>
              {unreadCount > 0 && (
                <Pressable style={styles.headerButton} onPress={handleMarkAllAsRead}>
                  <CheckCheck size={16} color={SEMANTIC_COLORS.textSubtle} />
                  <Text variant="small" color="textSubtle">
                    全部已讀
                  </Text>
                </Pressable>
              )}
              <Pressable
                style={styles.closeButton}
                onPress={() => bottomSheetRef.current?.close()}
              >
                <X size={20} color={SEMANTIC_COLORS.textMuted} />
              </Pressable>
            </View>
          </View>

          {/* 通知列表 */}
          {isLoading && notifications.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={SEMANTIC_COLORS.textMuted} />
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Bell size={48} color={SEMANTIC_COLORS.textMuted} />
              <Text variant="body" color="textSubtle" style={styles.emptyText}>
                還沒有通知
              </Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              renderItem={renderNotificationItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                hasMore ? (
                  <View style={styles.loadMoreContainer}>
                    {isLoading ? (
                      <ActivityIndicator size="small" color={SEMANTIC_COLORS.textMuted} />
                    ) : (
                      <Button variant="ghost" size="sm" onPress={handleLoadMore}>
                        <Text color="textSubtle">載入更多</Text>
                      </Button>
                    )}
                  </View>
                ) : null
              }
            />
          )}
        </BottomSheetView>
      </BottomSheet>
    </View>
  )
}

const styles = StyleSheet.create({
  bellButton: {
    position: 'relative',
    padding: SPACING.sm,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FFE70C',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#1B1A1A',
    fontSize: 11,
    fontWeight: '600',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  closeButton: {
    padding: SPACING.xs,
    borderRadius: 999,
  },
  listContent: {
    paddingBottom: SPACING.xl,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  notificationItemUnread: {
    backgroundColor: 'rgba(255, 231, 12, 0.1)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  message: {
    marginTop: 2,
  },
  time: {
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  actionButton: {
    padding: SPACING.xs,
    borderRadius: 999,
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
  loadMoreContainer: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
})

export default NotificationCenter
