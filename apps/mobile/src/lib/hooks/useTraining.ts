/**
 * 訓練計畫 hooks
 *
 * 對應 apps/web/src/lib/hooks/useTrainingProgress.ts 與 useUpdateProgress.ts
 */

import type { PersonalityTypeCode, TrainingProgressRecord } from '@nobodyclimb/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { trainingService } from '@/lib/api/training'

interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
}

type ProgressCache = ApiResponse<TrainingProgressRecord[]>

export function useTrainingProgress(type: PersonalityTypeCode) {
  return useQuery({
    queryKey: ['training-progress', type],
    queryFn: () => trainingService.fetchTrainingProgress(type),
    select: (data): TrainingProgressRecord[] =>
      (data.data ?? []).map((p: TrainingProgressRecord) => ({
        ...p,
        completed: !!p.completed,
      })),
  })
}

export function useUpdateTrainingProgress(type: PersonalityTypeCode, onError?: () => void) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: trainingService.updateTrainingProgress,
    onMutate: async (newProgress) => {
      await queryClient.cancelQueries({ queryKey: ['training-progress', type] })

      const previous = queryClient.getQueryData<ProgressCache>(['training-progress', type])

      // 樂觀更新：先寫入快取，失敗時 onError 回滾
      queryClient.setQueryData<ProgressCache>(['training-progress', type], (old) => {
        if (!old?.data) return old
        const records = old.data
        const idx = records.findIndex(
          (p) => p.week === newProgress.week && p.day === newProgress.day
        )
        if (idx >= 0) {
          const updated = [...records]
          updated[idx] = {
            ...updated[idx],
            completed: newProgress.completed,
            notes: newProgress.notes ?? updated[idx].notes,
          }
          return { ...old, data: updated }
        }
        return {
          ...old,
          data: [
            ...records,
            {
              id: 'optimistic',
              user_id: '',
              personality_type: type,
              week: newProgress.week,
              day: newProgress.day,
              completed: newProgress.completed,
              notes: newProgress.notes ?? null,
              created_at: new Date().toISOString(),
            },
          ],
        }
      })

      return { previous }
    },
    onError: (_err, _newProgress, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['training-progress', type], context.previous)
      }
      onError?.()
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['training-progress', type] })
    },
  })
}
