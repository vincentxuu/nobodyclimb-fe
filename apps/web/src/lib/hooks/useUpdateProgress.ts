'use client'

import type { PersonalityTypeCode, TrainingProgressRecord } from '@nobodyclimb/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'
import { trainingService } from '@/lib/api/training'
import type { ApiResponse } from '@/lib/types'

type ProgressCache = ApiResponse<TrainingProgressRecord[]>

export function useUpdateProgress(type: PersonalityTypeCode) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: trainingService.updateTrainingProgress,
    onMutate: async (newProgress) => {
      await queryClient.cancelQueries({ queryKey: ['training-progress', type] })

      const previous = queryClient.getQueryData<ProgressCache>(['training-progress', type])

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
      toast({
        variant: 'destructive',
        title: '更新失敗',
        description: '訓練進度更新失敗，請稍後再試',
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['training-progress', type] })
    },
  })
}
