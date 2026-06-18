/**
 * 繩索系統學習頁面
 *
 * 對應 apps/web/src/app/games/rope-system/learn/[categoryId]/page.tsx
 */

import { RADIUS, SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BookOpen,
  CheckCircle,
  GripVertical,
  Lightbulb,
  X,
  XCircle,
} from 'lucide-react-native'
import { useCallback, useEffect, useState } from 'react'
import { Alert, Image, Pressable, StyleSheet, Vibration, View } from 'react-native'
import Animated, { FadeIn, SlideInRight, SlideOutLeft } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, IconButton, Text } from '@/components/ui'
import {
  fetchRopeQuestionsByCategory,
  ROPE_CATEGORIES,
  type RopeQuestion,
} from '@/lib/games/rope-system'
import { useRopeGameStore } from '@/store/ropeGameStore'

interface ProgressBarProps {
  current: number
  total: number
  correctCount: number
}

function ProgressBar({ current, total, correctCount }: ProgressBarProps) {
  const progress = ((current + 1) / total) * 100

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressInfo}>
        <Text variant="small" color="textMuted">
          問題 {current + 1}/{total}
        </Text>
        <Text variant="small" color="textMuted">
          正確 {correctCount}
        </Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
    </View>
  )
}

interface QuestionCardProps {
  question: RopeQuestion
  selectedAnswer: string | string[] | null
  showResult: boolean
  onSelectAnswer: (answer: string | string[]) => void
}

function QuestionCard({ question, selectedAnswer, showResult, onSelectAnswer }: QuestionCardProps) {
  const [orderedOptions, setOrderedOptions] = useState(question.options)

  useEffect(() => {
    if (question.type !== 'ordering') return

    const shuffledOptions = [...question.options].sort(() => Math.random() - 0.5)
    setOrderedOptions(shuffledOptions)
    onSelectAnswer(shuffledOptions.map((option) => option.id))
  }, [onSelectAnswer, question.id, question.options, question.type])

  const moveOption = (index: number, direction: -1 | 1) => {
    if (showResult) return

    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= orderedOptions.length) return

    const nextOptions = [...orderedOptions]
    const currentOption = nextOptions[index]
    nextOptions[index] = nextOptions[nextIndex]
    nextOptions[nextIndex] = currentOption
    setOrderedOptions(nextOptions)
    onSelectAnswer(nextOptions.map((option) => option.id))
  }

  const isSelectedChoice = (optionId: string) =>
    typeof selectedAnswer === 'string' && selectedAnswer === optionId

  const isCorrectChoice = (optionId: string) =>
    typeof question.correctAnswer === 'string' && question.correctAnswer === optionId

  const getOptionStyle = (optionId: string) => {
    if (!showResult) {
      return isSelectedChoice(optionId) ? styles.optionSelected : styles.option
    }

    if (isCorrectChoice(optionId)) {
      return styles.optionCorrect
    }

    if (isSelectedChoice(optionId)) {
      return styles.optionWrong
    }

    return styles.option
  }

  const isOrderingPositionCorrect = (optionId: string, index: number) =>
    Array.isArray(question.correctAnswer) && question.correctAnswer[index] === optionId

  const correctAnswerText = getCorrectAnswerText(question)
  const isCorrectAnswer =
    selectedAnswer !== null ? isAnswerCorrect(selectedAnswer, question.correctAnswer) : false

  return (
    <Animated.View
      entering={SlideInRight.duration(300)}
      exiting={SlideOutLeft.duration(300)}
      style={styles.questionCard}
    >
      {question.scenario && (
        <View style={styles.scenarioBox}>
          <Text variant="small" fontWeight="600" color="textMuted" style={styles.sectionLabel}>
            情境
          </Text>
          <Text variant="body" color="textSubtle">
            {question.scenario}
          </Text>
        </View>
      )}

      <Text variant="small" fontWeight="600" color="textMuted" style={styles.sectionLabel}>
        問題
      </Text>
      <Text variant="h4" fontWeight="600" style={styles.questionText}>
        {question.question}
      </Text>

      {question.imageUrl && (
        <Image source={{ uri: question.imageUrl }} style={styles.questionImage} />
      )}

      {question.type === 'ordering' ? (
        <View style={styles.optionsContainer}>
          {!showResult && (
            <Text variant="small" color="textMuted">
              使用上下箭頭調整步驟順序，完成後確認答案。
            </Text>
          )}
          {orderedOptions.map((option, index) => {
            const isCorrectPosition = isOrderingPositionCorrect(option.id, index)

            return (
              <View
                key={option.id}
                style={[
                  styles.orderingItem,
                  showResult && isCorrectPosition && styles.optionCorrect,
                  showResult && !isCorrectPosition && styles.optionWrong,
                ]}
              >
                <GripVertical size={18} color={SEMANTIC_COLORS.textMuted} />
                <View
                  style={[
                    styles.orderingIndex,
                    showResult && isCorrectPosition && styles.orderingIndexCorrect,
                    showResult && !isCorrectPosition && styles.orderingIndexWrong,
                  ]}
                >
                  <Text variant="small" fontWeight="700" style={styles.orderingIndexText}>
                    {index + 1}
                  </Text>
                </View>
                {option.image && (
                  <Image source={{ uri: option.image }} style={styles.optionImage} />
                )}
                <Text variant="body" style={styles.optionText}>
                  {option.text}
                </Text>
                {showResult ? (
                  isCorrectPosition ? (
                    <CheckCircle size={20} color="#10B981" />
                  ) : (
                    <XCircle size={20} color="#EF4444" />
                  )
                ) : (
                  <View style={styles.orderingControls}>
                    <IconButton
                      icon={<ArrowUp size={16} color={SEMANTIC_COLORS.textMain} />}
                      size="sm"
                      variant="ghost"
                      disabled={index === 0}
                      onPress={() => moveOption(index, -1)}
                    />
                    <IconButton
                      icon={<ArrowDown size={16} color={SEMANTIC_COLORS.textMain} />}
                      size="sm"
                      variant="ghost"
                      disabled={index === orderedOptions.length - 1}
                      onPress={() => moveOption(index, 1)}
                    />
                  </View>
                )}
              </View>
            )
          })}
        </View>
      ) : (
        <View style={styles.optionsContainer}>
          {question.options.map((option) => (
            <Pressable
              key={option.id}
              style={[styles.optionBase, getOptionStyle(option.id)]}
              onPress={() => !showResult && onSelectAnswer(option.id)}
              disabled={showResult}
            >
              {option.image && <Image source={{ uri: option.image }} style={styles.optionImage} />}
              <Text
                variant="body"
                style={[
                  styles.optionText,
                  showResult && isCorrectChoice(option.id) && styles.optionTextCorrect,
                  showResult &&
                    isSelectedChoice(option.id) &&
                    !isCorrectChoice(option.id) &&
                    styles.optionTextWrong,
                ]}
              >
                {option.text}
              </Text>
              {showResult && isCorrectChoice(option.id) && (
                <CheckCircle size={20} color="#10B981" />
              )}
              {showResult && isSelectedChoice(option.id) && !isCorrectChoice(option.id) && (
                <XCircle size={20} color="#EF4444" />
              )}
            </Pressable>
          ))}
        </View>
      )}

      {showResult && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.explanationBox}>
          <View style={styles.explanationHeader}>
            {isCorrectAnswer ? (
              <CheckCircle size={24} color="#10B981" />
            ) : (
              <XCircle size={24} color="#EF4444" />
            )}
            <Text
              variant="h4"
              fontWeight="700"
              style={isCorrectAnswer ? styles.optionTextCorrect : styles.optionTextWrong}
            >
              {isCorrectAnswer ? '答對了！' : '答錯了'}
            </Text>
          </View>

          {!isCorrectAnswer && (
            <View style={styles.explanationSection}>
              <Text variant="small" fontWeight="600" color="textMuted">
                正確答案
              </Text>
              <Text variant="body">{correctAnswerText}</Text>
            </View>
          )}

          {question.explanation && (
            <View style={styles.explanationSection}>
              <View style={styles.explanationLabel}>
                <BookOpen size={16} color={SEMANTIC_COLORS.textMuted} />
                <Text variant="small" fontWeight="600" color="textMuted">
                  解釋
                </Text>
              </View>
              <Text variant="body" color="textSubtle">
                {question.explanation}
              </Text>
            </View>
          )}

          {question.hint && !isCorrectAnswer && (
            <View style={styles.hintBox}>
              <View style={styles.explanationLabel}>
                <Lightbulb size={16} color="#F59E0B" />
                <Text variant="small" fontWeight="600" style={styles.hintTitle}>
                  提示
                </Text>
              </View>
              <Text variant="small">{question.hint}</Text>
            </View>
          )}

          {question.referenceSources && question.referenceSources.length > 0 && (
            <View style={styles.explanationSection}>
              <Text variant="small" fontWeight="600" color="textMuted">
                參考資料
              </Text>
              {question.referenceSources.map((source) => (
                <Text key={source} variant="small" color="textMuted">
                  {source}
                </Text>
              ))}
            </View>
          )}
        </Animated.View>
      )}
    </Animated.View>
  )
}

function isAnswerCorrect(userAnswer: string | string[], correctAnswer: string | string[]): boolean {
  if (typeof correctAnswer === 'string') {
    return userAnswer === correctAnswer
  }

  return (
    Array.isArray(userAnswer) &&
    userAnswer.length === correctAnswer.length &&
    userAnswer.every((answer, index) => answer === correctAnswer[index])
  )
}

function getCorrectAnswerText(question: RopeQuestion): string {
  if (typeof question.correctAnswer === 'string') {
    return question.options.find((option) => option.id === question.correctAnswer)?.text ?? ''
  }

  return question.correctAnswer
    .map((answerId, index) => {
      const option = question.options.find((item) => item.id === answerId)
      return `${index + 1}. ${option?.text ?? answerId}`
    })
    .join('\n')
}

interface ResultScreenProps {
  score: number
  totalQuestions: number
  correctAnswers: number
  onRestart: () => void
  onExit: () => void
}

function ResultScreen({
  score,
  totalQuestions,
  correctAnswers,
  onRestart,
  onExit,
}: ResultScreenProps) {
  const percentage = Math.round((correctAnswers / totalQuestions) * 100)
  const isPassed = percentage >= 80

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.resultContainer}>
      <View style={styles.resultContent}>
        {isPassed ? (
          <CheckCircle size={64} color="#10B981" />
        ) : (
          <XCircle size={64} color="#EF4444" />
        )}
        <Text variant="h2" fontWeight="700" style={styles.resultTitle}>
          {isPassed ? '恭喜通過！' : '繼續加油！'}
        </Text>
        <Text variant="body" color="textSubtle" style={styles.resultSubtitle}>
          {isPassed ? '你已經掌握了這個章節' : '再試一次，你可以做得更好'}
        </Text>

        <View style={styles.resultStats}>
          <View style={styles.resultStatItem}>
            <Text variant="h3" fontWeight="700">
              {score}
            </Text>
            <Text variant="small" color="textMuted">
              得分
            </Text>
          </View>
          <View style={styles.resultStatDivider} />
          <View style={styles.resultStatItem}>
            <Text variant="h3" fontWeight="700">
              {correctAnswers}/{totalQuestions}
            </Text>
            <Text variant="small" color="textMuted">
              正確數
            </Text>
          </View>
          <View style={styles.resultStatDivider} />
          <View style={styles.resultStatItem}>
            <Text variant="h3" fontWeight="700">
              {percentage}%
            </Text>
            <Text variant="small" color="textMuted">
              正確率
            </Text>
          </View>
        </View>

        <View style={styles.resultActions}>
          <Button variant="secondary" onPress={onExit} style={styles.resultButton}>
            <Text fontWeight="600">返回</Text>
          </Button>
          <Button variant="primary" onPress={onRestart} style={styles.resultButton}>
            <Text fontWeight="600" style={{ color: '#FFFFFF' }}>
              再玩一次
            </Text>
          </Button>
        </View>
      </View>
    </Animated.View>
  )
}

export default function LearnScreen() {
  const router = useRouter()
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>()
  const {
    currentSession,
    vibrationEnabled,
    startGame,
    submitAnswer,
    nextQuestion,
    endGame,
    quitGame,
  } = useRopeGameStore()

  const [selectedAnswer, setSelectedAnswer] = useState<string | string[] | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [gameEnded, setGameEnded] = useState(false)
  const [questions, setQuestions] = useState<RopeQuestion[]>([])
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [finalResult, setFinalResult] = useState<{
    score: number
    totalQuestions: number
    correctAnswers: number
  } | null>(null)

  // 初始化遊戲
  useEffect(() => {
    if (!categoryId) return

    const category = ROPE_CATEGORIES.find((item) => item.id === categoryId)
    if (!category) {
      router.replace('/games/rope-system' as any)
      return
    }

    let cancelled = false

    const loadQuestions = async () => {
      setIsLoadingQuestions(true)
      setLoadError(null)

      try {
        const loadedQuestions = await fetchRopeQuestionsByCategory(categoryId)

        if (cancelled) return

        if (loadedQuestions.length === 0) {
          throw new Error('題庫目前沒有題目')
        }

        const shuffledQuestions = [...loadedQuestions].sort(() => Math.random() - 0.5)
        setQuestions(shuffledQuestions)
        startGame(categoryId, shuffledQuestions)
        setSelectedAnswer(null)
        setShowResult(false)
        setCorrectCount(0)
        setGameEnded(false)
        setFinalResult(null)
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : '題目載入失敗'
          setLoadError(message)
        }
      } finally {
        if (!cancelled) {
          setIsLoadingQuestions(false)
        }
      }
    }

    loadQuestions()

    return () => {
      cancelled = true
    }
  }, [categoryId, router, startGame])

  const handleBack = () => {
    Alert.alert('確定離開？', '你的進度將不會被保存', [
      { text: '取消', style: 'cancel' },
      {
        text: '確定',
        style: 'destructive',
        onPress: () => {
          quitGame()
          router.back()
        },
      },
    ])
  }

  const handleSelectAnswer = useCallback((answer: string | string[]) => {
    setSelectedAnswer(answer)
  }, [])

  const handleSubmit = () => {
    if (selectedAnswer === null) return

    const result = submitAnswer(selectedAnswer)

    if (result.isCorrect) {
      setCorrectCount((prev) => prev + 1)
      if (vibrationEnabled) {
        Vibration.vibrate(100)
      }
    } else {
      if (vibrationEnabled) {
        Vibration.vibrate([0, 50, 50, 50])
      }
    }

    setShowResult(true)
  }

  const handleNext = () => {
    const hasMore = nextQuestion()

    if (!hasMore) {
      const result = endGame()
      setFinalResult(result)
      setGameEnded(true)
    } else {
      setSelectedAnswer(null)
      setShowResult(false)
    }
  }

  const handleRestart = () => {
    if (categoryId && questions.length > 0) {
      const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5)
      startGame(categoryId, shuffledQuestions)
      setSelectedAnswer(null)
      setShowResult(false)
      setCorrectCount(0)
      setGameEnded(false)
      setFinalResult(null)
    }
  }

  const handleExit = () => {
    router.back()
  }

  if (isLoadingQuestions) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text color="textMuted">正在載入題目...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (loadError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text variant="body" color="textMuted" style={styles.errorMessage}>
            {loadError}
          </Text>
          <Button variant="secondary" onPress={() => router.back()}>
            返回
          </Button>
        </View>
      </SafeAreaView>
    )
  }

  if (!currentSession && !gameEnded) {
    return null
  }

  if (gameEnded && finalResult) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ResultScreen
          score={finalResult.score}
          totalQuestions={finalResult.totalQuestions}
          correctAnswers={finalResult.correctAnswers}
          onRestart={handleRestart}
          onExit={handleExit}
        />
      </SafeAreaView>
    )
  }

  const currentQuestion = currentSession?.questions[currentSession.currentIndex]

  if (!currentQuestion) {
    return null
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 導航列 */}
      <View style={styles.header}>
        <IconButton
          icon={<X size={24} color={SEMANTIC_COLORS.textMain} />}
          onPress={handleBack}
          variant="ghost"
        />
        <ProgressBar
          current={currentSession?.currentIndex || 0}
          total={currentSession?.questions.length || 0}
          correctCount={correctCount}
        />
        <View style={{ width: 40 }} />
      </View>

      {/* 問題區 */}
      <View style={styles.content}>
        <QuestionCard
          key={currentQuestion.id}
          question={currentQuestion}
          selectedAnswer={selectedAnswer}
          showResult={showResult}
          onSelectAnswer={handleSelectAnswer}
        />
      </View>

      {/* 底部按鈕 */}
      <View style={styles.footer}>
        {!showResult ? (
          <Button
            variant="primary"
            size="lg"
            onPress={handleSubmit}
            disabled={selectedAnswer === null}
            style={styles.actionButton}
          >
            <Text fontWeight="600" style={{ color: '#FFFFFF' }}>
              確認答案
            </Text>
          </Button>
        ) : (
          <Button variant="primary" size="lg" onPress={handleNext} style={styles.actionButton}>
            <Text fontWeight="600" style={{ color: '#FFFFFF' }}>
              {currentSession?.currentIndex === (currentSession?.questions.length || 0) - 1
                ? '查看結果'
                : '下一題'}
            </Text>
            <ArrowRight size={20} color="#FFFFFF" />
          </Button>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SEMANTIC_COLORS.pageBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  progressContainer: {
    flex: 1,
    marginHorizontal: SPACING.md,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFE70C',
    borderRadius: 3,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  errorMessage: {
    textAlign: 'center',
  },
  questionCard: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  sectionLabel: {
    marginBottom: SPACING.xs,
  },
  scenarioBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  questionText: {
    marginBottom: SPACING.lg,
    lineHeight: 28,
  },
  questionImage: {
    width: '100%',
    height: 180,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
  },
  optionsContainer: {
    gap: SPACING.sm,
  },
  optionBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 2,
  },
  option: {
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  optionSelected: {
    borderColor: '#FFE70C',
    backgroundColor: '#FFFEF0',
  },
  optionCorrect: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  optionWrong: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  optionText: {
    flex: 1,
  },
  optionImage: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    marginRight: SPACING.sm,
  },
  optionTextCorrect: {
    color: '#10B981',
    fontWeight: '600',
  },
  optionTextWrong: {
    color: '#EF4444',
    fontWeight: '600',
  },
  explanationBox: {
    marginTop: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: '#F5F5F5',
    borderRadius: RADIUS.md,
    gap: SPACING.md,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  explanationSection: {
    gap: SPACING.xs,
  },
  explanationLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  hintBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  hintTitle: {
    color: '#F59E0B',
  },
  orderingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  orderingIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFE70C',
  },
  orderingIndexCorrect: {
    backgroundColor: '#10B981',
  },
  orderingIndexWrong: {
    backgroundColor: '#EF4444',
  },
  orderingIndexText: {
    color: SEMANTIC_COLORS.textMain,
  },
  orderingControls: {
    flexDirection: 'row',
  },
  footer: {
    padding: SPACING.md,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  resultContent: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    width: '100%',
  },
  resultTitle: {
    marginTop: SPACING.md,
  },
  resultSubtitle: {
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  resultStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
  },
  resultStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  resultStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
  },
  resultActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xl,
    width: '100%',
  },
  resultButton: {
    flex: 1,
  },
})
