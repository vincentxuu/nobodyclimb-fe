'use client'

import { Volume2, VolumeX } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { useRopeGameStore } from '@/store/ropeGameStore'

interface SoundToggleProps {
  className?: string
}

export function SoundToggle({ className }: SoundToggleProps) {
  const t = useTranslations('GamesPage')
  const soundEnabled = useRopeGameStore((state) => state.soundEnabled)
  const toggleSound = useRopeGameStore((state) => state.toggleSound)

  return (
    <button
      type="button"
      onClick={toggleSound}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
        'hover:bg-[#F5F5F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFE70C]',
        className
      )}
      aria-label={soundEnabled ? t('soundMute') : t('soundUnmute')}
    >
      {soundEnabled ? (
        <Volume2 className="h-5 w-5 text-[#1B1A1A]" />
      ) : (
        <VolumeX className="h-5 w-5 text-[#535353]" />
      )}
    </button>
  )
}
