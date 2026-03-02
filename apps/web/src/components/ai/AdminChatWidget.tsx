'use client'

import { useAuthStore } from '@/store/authStore'
import { ChatWidget } from './ChatWidget'

export function AdminChatWidget() {
  const user = useAuthStore((s) => s.user)
  const status = useAuthStore((s) => s.status)

  // 等待 auth 初始化完成（idle = 尚未確認身份）
  if (status === 'idle') return null
  if (user?.role !== 'admin') return null

  return <ChatWidget />
}
