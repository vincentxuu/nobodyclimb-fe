'use client'

import { PERSONALITY_TYPES } from '@nobodyclimb/constants'
import { ArrowRight, Clock, Mountain } from 'lucide-react'
import { Link } from '@/i18n/navigation'

export function QuizLanding() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-12">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm text-amber-700">
          <Clock className="h-4 w-4" />
          <span>24 題 · 3-5 分鐘</span>
        </div>

        <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
          你是哪種<span className="text-amber-500">攀岩者</span>？
        </h1>

        <p className="mb-8 text-lg text-gray-600 md:text-xl">
          探索你的攀岩性格，找到最適合你的訓練方式和攀岩夥伴
        </p>

        <div className="mb-10 grid grid-cols-4 gap-3 md:grid-cols-8">
          {PERSONALITY_TYPES.map((type) => (
            <div key={type.code} className="flex flex-col items-center gap-1.5">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl md:h-14 md:w-14"
                style={{ backgroundColor: `${type.color}15` }}
              >
                <Mountain className="h-6 w-6 md:h-7 md:w-7" style={{ color: type.color }} />
              </div>
              <span className="text-xs text-gray-500">{type.nameZh}</span>
            </div>
          ))}
        </div>

        <Link
          href="/quiz/test"
          className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-gray-800 hover:shadow-lg active:scale-[0.98]"
        >
          開始測驗
          <ArrowRight className="h-5 w-5" />
        </Link>

        <p className="mt-4 text-sm text-gray-400">不需要登入 · 完全免費</p>
      </div>
    </div>
  )
}
