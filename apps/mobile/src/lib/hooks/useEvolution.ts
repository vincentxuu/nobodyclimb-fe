/**
 * Evolution Hooks
 *
 * 攀岩人格演化相關 hooks
 * 對應 apps/web/src/lib/hooks/useEvolutionTimeline.ts, useStyleSpectrum.ts, useEvolutionNotification.ts
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  type EvolutionNotification,
  type EvolutionRecord,
  type EvolutionResult,
  evolutionApi,
  type StyleSpectrumData,
} from '@/lib/api/evolution'

export function useEvolutionTimeline(enabled = true) {
  return useQuery<EvolutionRecord[]>({
    queryKey: ['quiz', 'evolution', 'timeline'],
    queryFn: async () => {
      const response = await evolutionApi.getTimeline()
      const data = response.data?.data ?? response.data
      return (data ?? []) as EvolutionRecord[]
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}

export function useStyleSpectrum(enabled = true) {
  return useQuery<StyleSpectrumData | null>({
    queryKey: ['quiz', 'evolution', 'style-spectrum'],
    queryFn: async () => {
      const response = await evolutionApi.getStyleSpectrum()
      const data = response.data?.data ?? response.data
      return (data ?? null) as StyleSpectrumData | null
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}

export function useEvolutionNotification(enabled = true) {
  return useQuery<EvolutionNotification | null>({
    queryKey: ['quiz', 'evolution', 'notification'],
    queryFn: async () => {
      const response = await evolutionApi.getNotification()
      const data = response.data?.data ?? response.data
      return (data ?? null) as EvolutionNotification | null
    },
    enabled,
    staleTime: 2 * 60 * 1000,
    retry: false,
  })
}

export function useCalculateEvolution() {
  const qc = useQueryClient()
  return useMutation<EvolutionResult>({
    mutationFn: async () => {
      const response = await evolutionApi.calculateEvolution()
      const data = response.data?.data ?? response.data
      return data as EvolutionResult
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quiz', 'evolution', 'timeline'] })
      qc.invalidateQueries({ queryKey: ['quiz', 'evolution', 'style-spectrum'] })
      qc.invalidateQueries({ queryKey: ['quiz', 'evolution', 'notification'] })
    },
  })
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await evolutionApi.markNotificationRead()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quiz', 'evolution', 'notification'] })
    },
  })
}
