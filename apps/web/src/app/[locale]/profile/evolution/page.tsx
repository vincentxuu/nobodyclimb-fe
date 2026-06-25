'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { RefreshCw, TrendingUp } from 'lucide-react'
import EvolutionTimeline from '@/components/profile/evolution/EvolutionTimeline'
import StyleSpectrumCard from '@/components/profile/evolution/StyleSpectrumCard'
import ProfilePageLayout from '@/components/profile/layout/ProfilePageLayout'
import ProfilePageTitle from '@/components/profile/ProfilePageTitle'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/components/ui/use-toast'
import { evolutionApi } from '@/lib/api/evolution'
import { useEvolutionTimeline } from '@/lib/hooks/useEvolutionTimeline'
import { useStyleSpectrum } from '@/lib/hooks/useStyleSpectrum'

export default function EvolutionPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: timeline, isLoading: timelineLoading } = useEvolutionTimeline()
  const { data: spectrum, isLoading: spectrumLoading } = useStyleSpectrum()

  const calculateMutation = useMutation({
    mutationFn: async () => {
      const { data } = await evolutionApi.calculateEvolution()
      return data.data
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['quiz', 'evolution'] })
      if (result.changed) {
        toast({
          description: `人格已演化為 ${result.personality_type}`,
        })
      } else {
        toast({
          description: result.reason || '人格類型未改變',
        })
      }
    },
    onError: (error: Error & { response?: { status?: number } }) => {
      const status = error?.response?.status
      if (status === 429) {
        toast({
          variant: 'destructive',
          description: '每日只能手動計算一次，請明天再試',
        })
      } else {
        toast({
          variant: 'destructive',
          description: '計算失敗，請稍後再試',
        })
      }
    },
  })

  return (
    <ProfilePageLayout>
      <div className="space-y-6">
        <ProfilePageTitle
          title="攀岩人格演化"
          subtitle="追蹤你的攀岩人格隨時間的變化軌跡"
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => calculateMutation.mutate()}
              disabled={calculateMutation.isPending}
              className="gap-1.5"
            >
              <RefreshCw
                className={`h-4 w-4 ${calculateMutation.isPending ? 'animate-spin' : ''}`}
              />
              手動計算
            </Button>
          }
        />

        {/* 攀岩光譜卡片 */}
        <StyleSpectrumCard data={spectrum} isLoading={spectrumLoading} />

        {/* 演化時間軸 */}
        <motion.div
          className="rounded-lg bg-white p-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-[#1B1A1A]">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            演化歷程
          </h2>

          {timelineLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : (
            <EvolutionTimeline records={timeline ?? []} />
          )}
        </motion.div>
      </div>
    </ProfilePageLayout>
  )
}
