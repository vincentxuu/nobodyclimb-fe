'use client'

import * as React from 'react'
import { useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useRopeGameStore, selectCurrentQuestion, selectProgress } from '@/store/ropeGameStore'
import { useGameSounds } from '@/lib/games/rope-system/sounds'
import { ROUTES, ANIMATION_DURATION } from '@/lib/games/rope-system/constants'
import type { Question, Category, Exam, GameMode } from '@/lib/games/rope-system/types'

import { ClimberCharacter } from './ClimberCharacter'
import { QuestionCard } from './QuestionCard'
import { ProgressBar } from './ProgressBar'
import { ScoreDisplay } from './ScoreDisplay'
import { LifeDisplay } from './LifeDisplay'
import { TimerDisplay } from './TimerDisplay'
import { SoundToggle } from './SoundToggle'
import { ExplanationPanel } from './ExplanationPanel'
import { ResultModal } from './ResultModal'

interface GameCanvasProps {
  mode: GameMode
  questions: Question[]
  category?: Category
  exam?: Exam
  className?: string
}

export function GameCanvas({
  mode,
  questions,
  category,
  exam,
  className,
}: GameCanvasProps) {
  // Store state
  const {
    currentIndex,
    score,
    lives,
    combo,
    timeRemaining,
    isAnswered,
    showExplanation,
    characterState,
    isComplete,
    answers,
    results,
    startGame,
    submitAnswer,
    nextQuestion,
    setCharacterState,
    updateTimeRemaining,
    resetGame,
    getStats,
  } = useRopeGameStore()

  const currentQuestion = useRopeGameStore(selectCurrentQuestion)
  const progress = useRopeGameStore(selectProgress)

  // Sounds
  const { playCorrect, playWrong, playLevelUp } = useGameSounds()

  // 初始化遊戲
  useEffect(() => {
    startGame(mode, questions, category, exam)
    return () => {
      resetGame()
    }
  }, [mode, questions, category, exam, startGame, resetGame])

  // 計時器
  useEffect(() => {
    if (!timeRemaining || timeRemaining <= 0 || isComplete || isAnswered) return

    const timer = setInterval(() => {
      updateTimeRemaining(timeRemaining - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeRemaining, isComplete, isAnswered, updateTimeRemaining])

  // 處理答題
  const handleAnswer = useCallback(
    (answer: string | string[]) => {
      const result = submitAnswer(answer)

      if (result.isCorrect) {
        playCorrect()
      } else {
        playWrong()
      }
    },
    [submitAnswer, playCorrect, playWrong]
  )

  // 處理繼續
  const handleContinue = useCallback(() => {
    // 等待掉落動畫完成後再進入下一題
    if (characterState === 'falling') {
      setTimeout(() => {
        nextQuestion()
        if (!isComplete) {
          playLevelUp()
        }
      }, ANIMATION_DURATION.FALL)
    } else {
      nextQuestion()
      if (!isComplete) {
        playLevelUp()
      }
    }
  }, [characterState, nextQuestion, isComplete, playLevelUp])

  // 處理掉落動畫完成
  const handleFallComplete = useCallback(() => {
    setCharacterState('idle')
  }, [setCharacterState])

  // 重玩
  const handlePlayAgain = useCallback(() => {
    startGame(mode, questions, category, exam)
  }, [mode, questions, category, exam, startGame])

  // 計算角色位置
  const characterPosition = useMemo(() => {
    // 根據當前題目進度計算位置 (0-100)
    const totalQuestions = questions.length
    if (totalQuestions === 0) return 50
    return ((currentIndex + 1) / totalQuestions) * 80 + 10
  }, [currentIndex, questions.length])

  // 取得遊戲統計
  const stats = getStats()

  // 取得當前答案的正確答案文字
  const getCorrectAnswerText = useCallback(() => {
    if (!currentQuestion) return ''
    if (typeof currentQuestion.correctAnswer === 'string') {
      const option = currentQuestion.options.find(
        (o) => o.id === currentQuestion.correctAnswer
      )
      return option?.text || ''
    }
    // 排序題
    return currentQuestion.correctAnswer
      .map((id, index) => {
        const option = currentQuestion.options.find((o) => o.id === id)
        return `${index + 1}. ${option?.text || ''}`
      })
      .join('\n')
  }, [currentQuestion])

  // 取得標題
  const title = category?.name || exam?.name || '攀岩系統練習'

  return (
    <div className={cn('flex min-h-screen flex-col bg-[#F5F5F5]', className)}>
      {/* 頂部導航 */}
      <header className="sticky top-0 z-40 border-b border-[#E5E5E5] bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link
              href={ROUTES.HOME}
              className="flex items-center gap-2 text-[#535353] hover:text-[#1B1A1A]"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">離開</span>
            </Link>
            <h1 className="font-medium text-[#1B1A1A]">{title}</h1>
          </div>
          <SoundToggle />
        </div>
      </header>

      {/* 主要內容 */}
      <main className="flex-1">
        <div className="mx-auto max-w-6xl p-4">
          <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
            {/* 左側：攀岩者角色（桌面版） */}
            <div className="hidden rounded-xl border border-[#E5E5E5] bg-white p-4 lg:block">
              <div className="relative h-[500px]">
                <ClimberCharacter
                  position={characterPosition}
                  state={characterState}
                  onFallComplete={handleFallComplete}
                />
              </div>
            </div>

            {/* 右側：題目區域 */}
            <div className="space-y-4">
              {/* 手機版：迷你角色 */}
              <div className="flex items-center justify-between rounded-xl border border-[#E5E5E5] bg-white p-4 lg:hidden">
                <div className="flex items-center gap-4">
                  <motion.div
                    className="text-3xl"
                    animate={
                      characterState === 'falling'
                        ? { rotate: [0, 15, -15, 0] }
                        : {}
                    }
                  >
                    {characterState === 'falling'
                      ? '😱'
                      : characterState === 'celebrating'
                        ? '🎉'
                        : '🧗'}
                  </motion.div>
                  <ScoreDisplay score={score} />
                </div>
                <LifeDisplay lives={lives} />
              </div>

              {/* 題目卡片 */}
              <AnimatePresence mode="wait">
                {currentQuestion && (
                  <QuestionCard
                    key={currentQuestion.id}
                    question={currentQuestion}
                    onAnswer={handleAnswer}
                    disabled={isAnswered}
                    showResult={isAnswered}
                    userAnswer={answers[currentQuestion.id]}
                  />
                )}
              </AnimatePresence>

              {/* 學習模式：解釋面板 */}
              {mode === 'learn' && currentQuestion && (
                <ExplanationPanel
                  isVisible={showExplanation}
                  isCorrect={
                    results[currentIndex]?.isCorrect ?? false
                  }
                  correctAnswer={getCorrectAnswerText()}
                  explanation={currentQuestion.explanation}
                  hint={currentQuestion.hint}
                  referenceSources={currentQuestion.referenceSources}
                  onContinue={handleContinue}
                />
              )}

              {/* 考試模式：直接顯示繼續按鈕 */}
              {mode === 'exam' && isAnswered && !isComplete && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={handleContinue}
                  className="w-full rounded-lg bg-[#1B1A1A] py-3 font-medium text-white hover:bg-[#292827]"
                >
                  下一題 →
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 底部狀態列 */}
      <footer className="sticky bottom-0 border-t border-[#E5E5E5] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          {/* 進度條 */}
          <div className="flex-1">
            <ProgressBar
              progress={progress}
              current={currentIndex + 1}
              total={questions.length}
            />
          </div>

          {/* 分數與生命值（桌面版） */}
          <div className="ml-6 hidden items-center gap-6 lg:flex">
            <ScoreDisplay score={score} />
            {combo > 1 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="rounded-full bg-[#F59E0B] px-3 py-1 text-sm font-medium text-white"
              >
                🔥 x{combo}
              </motion.div>
            )}
            <LifeDisplay lives={lives} />
            {timeRemaining !== null && <TimerDisplay seconds={timeRemaining} />}
          </div>
        </div>
      </footer>

      {/* 結果彈窗 */}
      <ResultModal
        isOpen={isComplete}
        stats={stats}
        totalQuestions={questions.length}
        categoryName={category?.name}
        isGameOver={lives <= 0}
        onPlayAgain={handlePlayAgain}
        onGoHome={() => window.location.href = ROUTES.HOME}
      />
    </div>
  )
}
