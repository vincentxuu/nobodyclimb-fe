'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Sparkles, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { evolutionApi } from '@/lib/api/evolution'
import { useEvolutionNotification } from '@/lib/hooks/useEvolutionNotification'

export default function EvolutionNotificationBanner() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [dismissed, setDismissed] = useState(false)

  const { data: notification } = useEvolutionNotification()

  const markReadMutation = useMutation({
    mutationFn: () => evolutionApi.markNotificationRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz', 'evolution', 'notification'] })
    },
  })

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDismissed(true)
    markReadMutation.mutate()
  }

  const handleClick = () => {
    markReadMutation.mutate()
    router.push('/profile/evolution')
  }

  if (!notification?.has_notification || dismissed) {
    return null
  }

  const evolution = notification.evolution

  return (
    <AnimatePresence>
      <motion.div
        className="mb-4 cursor-pointer overflow-hidden rounded-lg border border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100/50 shadow-sm"
        initial={{ opacity: 0, y: -10, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -10, height: 0 }}
        onClick={handleClick}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10">
              <Sparkles className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-800">
                {evolution?.from_type ? (
                  <>
                    你的攀岩人格已演化！從{' '}
                    <span className="font-semibold">{evolution.from_type}</span> 變為{' '}
                    <span className="font-semibold">{evolution.to_type}</span>
                  </>
                ) : (
                  <>
                    你的攀岩人格已計算完成：
                    <span className="font-semibold">{evolution?.to_type}</span>
                  </>
                )}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-emerald-600">
                點擊查看演化詳情 <ArrowRight className="h-3 w-3" />
              </p>
            </div>
          </div>

          <button
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-emerald-400 transition-colors hover:bg-emerald-200/50 hover:text-emerald-600"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
