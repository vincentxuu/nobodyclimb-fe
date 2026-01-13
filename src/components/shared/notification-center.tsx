'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  Sparkles,
  Check,
  CheckCheck,
  Trash2,
  Loader2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { notificationService } from '@/lib/api/services'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { zhTW } from 'date-fns/locale'

interface Notification {
  id: string
  user_id: string
  type: string
  actor_id: string | null
  target_id: string | null
  title: string
  message: string
  is_read: number
  created_at: string
  actor_name?: string
  actor_avatar?: string
}

interface NotificationCenterProps {
  className?: string
}

const notificationIcons: Record<string, React.ElementType> = {
  goal_liked: Heart,
  goal_commented: MessageCircle,
  goal_referenced: Sparkles,
  new_follower: UserPlus,
  story_featured: Sparkles,
}

const notificationColors: Record<string, string> = {
  goal_liked: 'text-red-500 bg-red-50',
  goal_commented: 'text-blue-500 bg-blue-50',
  goal_referenced: 'text-amber-500 bg-amber-50',
  new_follower: 'text-green-500 bg-green-50',
  story_featured: 'text-purple-500 bg-purple-50',
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const { isLoggedIn } = useAuthStore()

  const loadUnreadCount = useCallback(async () => {
    if (!isLoggedIn) return
    try {
      const response = await notificationService.getUnreadCount()
      if (response.success && response.data) {
        setUnreadCount(response.data.count)
      }
    } catch (error) {
      console.error('Failed to load unread count:', error)
    }
  }, [isLoggedIn])

  const loadNotifications = useCallback(async (pageNum = 1, append = false) => {
    if (!isLoggedIn) return
    setIsLoading(true)
    try {
      const response = await notificationService.getNotifications(pageNum, 10)
      if (response.success && response.data) {
        if (append) {
          setNotifications((prev) => [...prev, ...response.data])
        } else {
          setNotifications(response.data)
        }
        setHasMore(response.pagination.page < response.pagination.total_pages)
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }, [isLoggedIn])

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

  if (!isLoggedIn) return null

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
        aria-label="通知"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-lg border z-50 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-semibold">通知</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  >
                    <CheckCheck className="h-3 w-3" />
                    全部已讀
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoading && notifications.length === 0 ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>還沒有通知</p>
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
                          'px-4 py-3 border-b last:border-b-0 hover:bg-gray-50 transition-colors',
                          !notification.is_read && 'bg-blue-50/50'
                        )}
                      >
                        <div className="flex gap-3">
                          <div
                            className={cn(
                              'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                              colorClass
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatTime(notification.created_at)}
                            </p>
                          </div>
                          <div className="flex items-start gap-1">
                            {!notification.is_read && (
                              <button
                                onClick={() =>
                                  handleMarkAsRead(notification.id)
                                }
                                className="p-1 text-gray-400 hover:text-green-500"
                                title="標記為已讀"
                              >
                                <Check className="h-3 w-3" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(notification.id)}
                              className="p-1 text-gray-400 hover:text-red-500"
                              title="刪除"
                            >
                              <Trash2 className="h-3 w-3" />
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
          </div>
        </>
      )}
    </div>
  )
}
