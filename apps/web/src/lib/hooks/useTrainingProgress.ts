'use client'

import type { PersonalityTypeCode, TrainingProgressRecord } from '@nobodyclimb/types'
import { useQuery } from '@tanstack/react-query'
import { trainingService } from '@/lib/api/training'

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
