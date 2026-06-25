'use client'

import type { PersonalityType } from '@nobodyclimb/types'
import { RefreshCw, Share2, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { Link } from '@/i18n/navigation'
import type { DecodedScores } from '@/lib/quiz/decode-scores'
import { ShareModal } from './ShareModal'

interface Props {
  personality: PersonalityType
  scores: DecodedScores | null
  hasPersonalScores: boolean
}

export function ResultActions({ personality, scores, hasPersonalScores }: Props) {
  const [shareOpen, setShareOpen] = useState(false)

  return (
    <div className="space-y-3 border-t border-gray-100 pt-8">
      <button
        onClick={() => setShareOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-base font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
        style={{ backgroundColor: personality.color }}
      >
        <Share2 className="h-5 w-5" />
        分享結果
      </button>

      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/quiz/test"
          className="flex items-center justify-center gap-2 rounded-full border-2 border-gray-200 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          重新測驗
        </Link>
        <Link
          href="/auth/register"
          className="flex items-center justify-center gap-2 rounded-full bg-gray-900 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          <UserPlus className="h-4 w-4" />
          加入 NobodyClimb
        </Link>
      </div>

      {!hasPersonalScores && (
        <div className="pt-2 text-center">
          <Link
            href="/quiz/test"
            className="text-sm font-medium text-gray-500 underline transition-colors hover:text-gray-700"
          >
            測測你自己 →
          </Link>
        </div>
      )}

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        personality={personality}
        scores={scores}
      />
    </div>
  )
}
