'use client'

import type { PersonalityTypeCode } from '@nobodyclimb/types'
import { useQuery } from '@tanstack/react-query'
import { trainingService } from '@/lib/api/training'

export function useTrainingPlan(type: PersonalityTypeCode) {
  return useQuery({
    queryKey: ['training-plan', type],
    queryFn: () => trainingService.fetchTrainingPlan(type),
    staleTime: Infinity,
    select: (data) => data.data,
  })
}
