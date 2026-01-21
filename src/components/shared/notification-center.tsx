'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  Mountain,
  MessageCircle,
  UserPlus,
  Sparkles,
  Check,
  CheckCheck,
  Trash2,
  Loader2,
  X,
  FileText,
  Megaphone,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { notificationService } from '@/lib/api/services'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { NotificationType, type Notification } from '@/lib/types'

interface NotificationCenterProps {
  className?: string
}

// 通知類型對應的 Icon（使用 enum 值作為 key，兼容後端 string）
const notificationIcons: Partial<Record<string, React.ElementType>> = {
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

// 通知類型對應的顏色（使用 Tailwind 主題色）
const notificationColors: Partial<Record<string, string>> = {
  [NotificationType.GOAL_LIKED]: 'text-brand-dark bg-brand-accent/20',
  [NotificationType.GOAL_COMMENTED]: 'text-blue-500 bg-blue-50',
  [NotificationType.GOAL_REFERENCED]: 'text-amber-500 bg-amber-50',
  [NotificationType.NEW_FOLLOWER]: 'text-green-500 bg-green-50',
  [NotificationType.STORY_FEATURED]: 'text-purple-500 bg-purple-50',
  [NotificationType.BIOGRAPHY_COMMENTED]: 'text-indigo-500 bg-indigo-50',
  [NotificationType.POST_LIKED]: 'text-brand-dark bg-brand-accent/20',
  [NotificationType.POST_COMMENTED]: 'text-cyan-500 bg-cyan-50',
  [NotificationType.SYSTEM_ANNOUNCEMENT]: 'text-brand-dark bg-brand-accent/30',
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const { isAuthenticated } = useAuthStore()

  const loadUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const response = await notificationService.getUnreadCount()
      if (response.success && response.data) {
        setUnreadCount(response.data.count)
      }
    } catch (error) {
      console.error('Failed to load unread count:', error)
    }
  }, [isAuthenticated])

  const loadNotifications = useCallback(async (pageNum = 1, append = false) => {
    if (!isAuthenticated) return
    setIsLoading(true)
    try {
      const response = await notificationService.getNotifications(pageNum, 10)
      if (response.success && response.data) {
        const newData = response.data
        if (append) {
          setNotifications((prev) => [...prev, ...newData])
        } else {
          setNotifications(newData)
        }
        setHasMore(response.pagination.page < response.pagination.total_pages)
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    loadUnreadCount()
    const interval = setInterval(loadUnreadCount, 60000)
    return () => clearInterval(interval)
  }, [loadUnreadCount])

  useEffect(() => {
    if (isOpen) {
      setPage(1)
      loadNotifications(1)
    }
  }, [isOpen, loadNotifications])

  // 鎖定背景滾動
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await notificationService.deleteNotification(id)
      const notification = notifications.find((n) => n.id === id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      if (notification && !notification.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    loadNotifications(nextPage, true)
  }

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

  if (!isAuthenticated) return null

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
        aria-label="通知"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-brand-accent text-brand-dark text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* 背景遮罩 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-40 bg-black/50"
              onClick={() => setIsOpen(false)}
            />
            {/* 滿版通知面板 - 從下往上滑出 */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-50 bg-white flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-4 border-b safe-area-top">
                <h3 className="text-lg font-semibold">通知</h3>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                      <CheckCheck className="h-4 w-4" />
                      全部已讀
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="關閉通知"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* 通知列表 */}
              <div className="flex-1 overflow-y-auto safe-area-bottom">
                {isLoading && notifications.length === 0 ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-16 text-center text-gray-500">
                    <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg">還沒有通知</p>
                  </div>
                ) : (
                  <div>
                    {notifications.map((notification) => {
                      const Icon =
                        notificationIcons[notification.type] || Bell
                      const colorClass =
                        notificationColors[notification.type] ||
                        'text-gray-500 bg-gray-50'

                      return (
                        <div
                          key={notification.id}
                          className={cn(
                            'px-4 py-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors',
                            !notification.is_read && 'bg-brand-accent/10'
                          )}
                        >
                          <div className="flex gap-3">
                            <div
                              className={cn(
                                'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                                colorClass
                              )}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-medium text-gray-900">
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-3">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-2">
                                {formatTime(notification.created_at)}
                              </p>
                            </div>
                            <div className="flex items-start gap-2">
                              {!notification.is_read && (
                                <button
                                  onClick={() =>
                                    handleMarkAsRead(notification.id)
                                  }
                                  className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-full transition-colors"
                                  title="標記為已讀"
                                  aria-label="標記為已讀"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(notification.id)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                title="刪除"
                                aria-label="刪除通知"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {hasMore && (
                      <div className="p-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleLoadMore}
                          disabled={isLoading}
                          className="w-full"
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            '載入更多'
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
