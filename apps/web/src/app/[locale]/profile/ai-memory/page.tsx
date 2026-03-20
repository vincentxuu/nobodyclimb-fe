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
import { useTranslations } from 'next-intl'

interface UserMemory {
  id: string
  user_id: string
  memory_key: string
  memory_type: 'preference' | 'behavior' | 'fact'
  content: string
  updated_at: string
}

const MEMORY_TYPE_LABEL_KEYS: Record<string, string> = {
  preference: 'memoryTypePreference',
  behavior: 'memoryTypeBehavior',
  fact: 'memoryTypeFact',
}

const MEMORY_TYPE_COLOR: Record<string, string> = {
  preference: 'bg-blue-100 text-blue-700',
  behavior: 'bg-purple-100 text-purple-700',
  fact: 'bg-emerald-100 text-emerald-700',
}

const MEMORY_KEY_LABEL_KEYS: Record<string, string> = {
  climbing_level: 'memoryKeyClimbingLevel',
  preferred_region: 'memoryKeyPreferredRegion',
  preferred_style: 'memoryKeyPreferredStyle',
  preferred_crag: 'memoryKeyPreferredCrag',
  goals: 'memoryKeyGoals',
}

export default function AiMemoryPage() {
  const t = useTranslations('ProfilePage')
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
      toast({ description: t('toastMemoryDeleted') })
    },
    onError: () => {
      toast({ variant: 'destructive', description: t('toastDeleteFailedRetry') })
    },
  })

  const memories = data ?? []

  return (
    <ProfilePageLayout>
      <div className="mx-auto max-w-2xl px-4 py-6">
        <ProfilePageTitle
          title={t('aiMemoryTitle')}
          subtitle={t('aiMemorySubtitle')}
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
              {t('aiMemoryEmpty')}
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
                      {MEMORY_KEY_LABEL_KEYS[memory.memory_key] ? t(MEMORY_KEY_LABEL_KEYS[memory.memory_key] as Parameters<typeof t>[0]) : memory.memory_key}
                    </span>
                    <Badge
                      className={`px-1.5 py-0 text-[10px] font-medium ${MEMORY_TYPE_COLOR[memory.memory_type] ?? ''}`}
                    >
                      {MEMORY_TYPE_LABEL_KEYS[memory.memory_type] ? t(MEMORY_TYPE_LABEL_KEYS[memory.memory_type] as Parameters<typeof t>[0]) : memory.memory_type}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-800">{memory.content}</p>
                  <p className="text-[11px] text-gray-400">
                    {t('memoryUpdated', { time: formatDistanceToNow(new Date(memory.updated_at), {
                      addSuffix: true,
                      locale: zhTW,
                    }) })}
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
        title={t('deleteMemory')}
        message={t('confirmDeleteMemoryMessage')}
        confirmText={t('delete')}
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
