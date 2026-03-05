'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, Brain } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import ProfilePageLayout from '@/components/profile/layout/ProfilePageLayout'
import ProfilePageTitle from '@/components/profile/ProfilePageTitle'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import apiClient from '@/lib/api/client'
import { useState } from 'react'
import { useToast } from '@/components/ui/use-toast'

interface UserMemory {
  id: string
  user_id: string
  memory_key: string
  memory_type: 'preference' | 'behavior' | 'fact'
  content: string
  updated_at: string
}

const MEMORY_TYPE_LABEL: Record<string, string> = {
  preference: '偏好',
  behavior: '行為',
  fact: '事實',
}

const MEMORY_TYPE_COLOR: Record<string, string> = {
  preference: 'bg-blue-100 text-blue-700',
  behavior: 'bg-purple-100 text-purple-700',
  fact: 'bg-emerald-100 text-emerald-700',
}

const MEMORY_KEY_LABEL: Record<string, string> = {
  climbing_level: '攀岩程度',
  preferred_region: '偏好地區',
  preferred_style: '偏好類型',
  preferred_crag: '偏好岩場',
  goals: '攀岩目標',
}

export default function AiMemoryPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['ai-memory'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: UserMemory[] }>('/ai/memory')
      return res.data.data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/ai/memory/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-memory'] })
      toast({ description: '記憶已刪除' })
    },
    onError: () => {
      toast({ variant: 'destructive', description: '刪除失敗，請稍後再試' })
    },
  })

  const memories = data ?? []

  return (
    <ProfilePageLayout>
      <div className="mx-auto max-w-2xl px-4 py-6">
        <ProfilePageTitle
          title="記憶"
          subtitle="AI 會在你提問後自動學習你的偏好，並在回答時參考這些資訊提供個人化建議。"
          isAI
        />

        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : memories.length === 0 ? (
          // Task 7.5: 空狀態
          <div className="rounded-lg border border-dashed border-gray-200 py-12 text-center">
            <Brain className="mx-auto mb-3 h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-400">
              AI 會在你提問後自動學習你的偏好，目前尚無記憶
            </p>
          </div>
        ) : (
          // Task 7.3: 渲染記憶列表
          <ul className="space-y-3">
            {memories.map((memory) => (
              <li
                key={memory.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 bg-white px-4 py-3 shadow-sm"
              >
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">
                      {MEMORY_KEY_LABEL[memory.memory_key] ?? memory.memory_key}
                    </span>
                    <Badge
                      className={`px-1.5 py-0 text-[10px] font-medium ${MEMORY_TYPE_COLOR[memory.memory_type] ?? ''}`}
                    >
                      {MEMORY_TYPE_LABEL[memory.memory_type] ?? memory.memory_type}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-800">{memory.content}</p>
                  <p className="text-[11px] text-gray-400">
                    {formatDistanceToNow(new Date(memory.updated_at), {
                      addSuffix: true,
                      locale: zhTW,
                    })}
                    更新
                  </p>
                </div>
                {/* Task 7.4: 刪除按鈕 */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="mt-0.5 h-7 w-7 shrink-0 text-gray-400 hover:text-red-500"
                  onClick={() => setDeletingId(memory.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 刪除確認 dialog */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        title="刪除記憶"
        message="確定要刪除這筆 AI 記憶嗎？AI 將不再參考此資訊。"
        confirmText="刪除"
        variant="danger"
        onConfirm={() => {
          if (deletingId) {
            deleteMutation.mutate(deletingId)
            setDeletingId(null)
          }
        }}
        isLoading={deleteMutation.isPending}
      />
    </ProfilePageLayout>
  )
}
