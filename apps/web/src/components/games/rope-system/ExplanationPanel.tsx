'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Lightbulb, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface ExplanationPanelProps {
  isVisible: boolean
  isCorrect: boolean
  correctAnswer: string
  explanation?: string
  hint?: string
  referenceSources?: string[]
  onContinue: () => void
  className?: string
}

export function ExplanationPanel({
  isVisible,
  isCorrect,
  correctAnswer,
  explanation,
  hint,
  referenceSources,
  onContinue,
  className,
}: ExplanationPanelProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className={cn(
            'rounded-lg border bg-white p-6 shadow-lg',
            isCorrect ? 'border-[#22C55E]' : 'border-[#EF4444]',
            className
          )}
        >
          {/* 標題 */}
          <div className="mb-4 flex items-center gap-3">
            {isCorrect ? (
              <>
                <CheckCircle className="h-8 w-8 text-[#22C55E]" />
                <span className="text-xl font-bold text-[#22C55E]">
                  答對了！
                </span>
              </>
            ) : (
              <>
                <XCircle className="h-8 w-8 text-[#EF4444]" />
                <span className="text-xl font-bold text-[#EF4444]">答錯了</span>
              </>
            )}
          </div>

          {/* 正確答案 */}
          {!isCorrect && (
            <div className="mb-4">
              <div className="mb-1 text-sm font-medium text-[#535353]">
                正確答案
              </div>
              <div className="text-[#1B1A1A]">{correctAnswer}</div>
            </div>
          )}

          {/* 解釋 */}
          {explanation && (
            <div className="mb-4">
              <div className="mb-1 flex items-center gap-2 text-sm font-medium text-[#535353]">
                <BookOpen className="h-4 w-4" />
                解釋
              </div>
              <div className="text-[#1B1A1A]">{explanation}</div>
            </div>
          )}

          {/* 提示 */}
          {hint && !isCorrect && (
            <div className="mb-4 rounded-lg bg-[rgba(245,158,11,0.1)] p-3">
              <div className="mb-1 flex items-center gap-2 text-sm font-medium text-[#F59E0B]">
                <Lightbulb className="h-4 w-4" />
                提示
              </div>
              <div className="text-sm text-[#1B1A1A]">{hint}</div>
            </div>
          )}

          {/* 參考資料 */}
          {referenceSources && referenceSources.length > 0 && (
            <div className="mb-4">
              <div className="mb-1 text-sm font-medium text-[#535353]">
                參考資料
              </div>
              <ul className="list-inside list-disc text-sm text-[#535353]">
                {referenceSources.map((source, index) => (
                  <li key={index}>{source}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 繼續按鈕 */}
          <Button onClick={onContinue} className="w-full" size="lg">
            {isCorrect ? '下一題' : '繼續'} →
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
