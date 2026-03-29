'use client'

import { AlertCircle, CheckCircle2 } from 'lucide-react'
import type { AILogDetail } from '@/lib/api/admin-ai'

export function QualitySection({ quality }: { quality: AILogDetail['quality'] }) {
  const { groundedness_score, auto_score, feedback_score, feedback_text, flags } = quality

  return (
    <div className="rounded-xl border border-wb-20 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-wb-100">品質評估</h2>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-[11px] text-wb-50 mb-0.5">Groundedness</p>
          <p className="text-[10px] text-wb-30 mb-1">0–1，回答有多少來自文件</p>
          {groundedness_score != null ? (
            <p
              className={`text-lg font-bold tabular-nums ${groundedness_score >= 0.7 ? 'text-emerald-600' : groundedness_score >= 0.5 ? 'text-yellow-600' : 'text-red-500'}`}
            >
              {(groundedness_score * 100).toFixed(0)}%
            </p>
          ) : (
            <p className="text-wb-40 text-lg">—</p>
          )}
          <p className="text-[9px] text-wb-25 mt-0.5">≥70% 良好</p>
        </div>
        <div className="text-center border-x border-wb-10">
          <p className="text-[11px] text-wb-50 mb-0.5">Auto 評分</p>
          <p className="text-[10px] text-wb-30 mb-1">LLM Judge 1–4 分</p>
          {auto_score != null ? (
            <p
              className={`text-lg font-bold tabular-nums ${auto_score >= 3 ? 'text-emerald-600' : auto_score >= 2 ? 'text-yellow-600' : 'text-red-500'}`}
            >
              {auto_score} / 4
            </p>
          ) : (
            <p className="text-wb-40 text-lg">—</p>
          )}
          <p className="text-[9px] text-wb-25 mt-0.5">1=不佳 2=普通 3=良好 4=優秀</p>
        </div>
        <div className="text-center">
          <p className="text-[11px] text-wb-50 mb-0.5">使用者回饋</p>
          <p className="text-[10px] text-wb-30 mb-1">用戶評分 1–5 星</p>
          {feedback_score != null ? (
            <p
              className={`text-lg font-bold tabular-nums ${feedback_score >= 4 ? 'text-emerald-600' : feedback_score >= 3 ? 'text-yellow-600' : 'text-red-500'}`}
            >
              {feedback_score} / 5
            </p>
          ) : (
            <p className="text-wb-40 text-lg">—</p>
          )}
          <p className="text-[9px] text-wb-25 mt-0.5">≥4 良好</p>
        </div>
      </div>

      {feedback_text && (
        <div className="mb-3 rounded-lg bg-wb-5 px-4 py-3">
          <p className="text-xs text-wb-50 mb-1">回饋文字</p>
          <p className="text-sm text-wb-80">{feedback_text}</p>
        </div>
      )}

      {(flags?.length ?? 0) > 0 && (
        <div className="space-y-1.5">
          {flags.map((f, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2"
            >
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-amber-700">{f.type}</span>
                {f.is_reviewed && <span className="text-[10px] text-amber-500">已審閱</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {(flags?.length ?? 0) === 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-xs text-emerald-700">無品質告警</span>
        </div>
      )}
    </div>
  )
}
