/**
 * 繩索系統學習頁面
 *
 * 對應 apps/web/src/app/games/rope-system/learn/[categoryId]/page.tsx
 */
import React, { useState, useEffect, useCallback } from 'react'
import {
  StyleSheet,
  View,
  Pressable,
  Alert,
  Vibration,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import {
  ChevronLeft,
  X,
  CheckCircle,
  XCircle,
  ArrowRight,
} from 'lucide-react-native'
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated'

import { Text, IconButton, Button } from '@/components/ui'
import { useRopeGameStore } from '@/store/ropeGameStore'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

interface Question {
  id: string
  categoryId: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
}

// 模擬問題資料
const MOCK_QUESTIONS: Record<string, Question[]> = {
  basics: [
    {
      id: '1',
      categoryId: 'basics',
      question: '攀岩繩的主要材質是什麼？',
      options: ['棉', '尼龍', '聚酯纖維', '鋼絲'],
      correctAnswer: 1,
      explanation: '現代攀岩繩主要由尼龍製成，具有良好的彈性和強度。',
      difficulty: 'easy',
    },
    {
      id: '2',
      categoryId: 'basics',
      question: '動力繩的延展性約為多少？',
      options: ['1-3%', '5-10%', '15-20%', '30-40%'],
      correctAnswer: 1,
      explanation: '動力繩的延展性通常在 5-10% 之間，可以吸收墜落衝擊力。',
      difficulty: 'easy',
    },
    {
      id: '3',
      categoryId: 'basics',
      question: '繩子應該避免什麼？',
      options: ['陽光', '水分', '尖銳邊緣', '以上皆是'],
      correctAnswer: 3,
      explanation: '繩子應該避免長時間日曬、潮濕和尖銳邊緣的接觸，以延長使用壽命。',
      difficulty: 'easy',
    },
  ],
  knots: [
    {
      id: '4',
      categoryId: 'knots',
      question: '八字結通常用於什麼？',
      options: ['連接兩條繩子', '綁在安全吊帶上', '固定點設置', '繩子收納'],
      correctAnswer: 1,
      explanation: '八字結是最常用的攀岩繩結，用於將繩子連接到安全吊帶上。',
      difficulty: 'easy',
    },
    {
      id: '5',
      categoryId: 'knots',
      question: '雙漁人結的主要用途是？',
      options: ['打繩頭', '連接兩條繩子', '製作繩圈', '緊急下降'],
      correctAnswer: 1,
      explanation: '雙漁人結用於連接兩條繩子，非常牢固且可靠。',
      difficulty: 'medium',
    },
  ],
  belaying: [
    {
      id: '6',
      categoryId: 'belaying',
      question: 'PBUS 確保口訣代表什麼？',
      options: [
        'Pull, Brake, Under, Slide',
        'Push, Brake, Up, Slide',
        'Pull, Back, Under, Stop',
        'Push, Back, Up, Stop',
      ],
      correctAnswer: 0,
      explanation: 'PBUS 代表 Pull, Brake, Under, Slide，是確保的基本動作流程。',
      difficulty: 'medium',
    },
  ],
}

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
  question: Question
  selectedAnswer: number | null
  showResult: boolean
  onSelectAnswer: (index: number) => void
}

function QuestionCard({
  question,
  selectedAnswer,
  showResult,
  onSelectAnswer,
}: QuestionCardProps) {
  const getOptionStyle = (index: number) => {
    if (!showResult) {
      return selectedAnswer === index ? styles.optionSelected : styles.option
    }

    if (index === question.correctAnswer) {
      return styles.optionCorrect
    }

    if (selectedAnswer === index) {
      return styles.optionWrong
    }

    return styles.option
  }

  return (
    <Animated.View
      entering={SlideInRight.duration(300)}
      exiting={SlideOutLeft.duration(300)}
      style={styles.questionCard}
    >
      <Text variant="h4" fontWeight="600" style={styles.questionText}>
        {question.question}
      </Text>

      <View style={styles.optionsContainer}>
        {question.options.map((option, index) => (
          <Pressable
            key={index}
            style={[styles.optionBase, getOptionStyle(index)]}
            onPress={() => !showResult && onSelectAnswer(index)}
            disabled={showResult}
          >
            <Text
              variant="body"
              style={[
                styles.optionText,
                showResult && index === question.correctAnswer && styles.optionTextCorrect,
                showResult && selectedAnswer === index && index !== question.correctAnswer && styles.optionTextWrong,
              ]}
            >
              {option}
            </Text>
            {showResult && index === question.correctAnswer && (
              <CheckCircle size={20} color="#10B981" />
            )}
            {showResult && selectedAnswer === index && index !== question.correctAnswer && (
              <XCircle size={20} color="#EF4444" />
            )}
          </Pressable>
        ))}
      </View>

      {showResult && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.explanationBox}>
          <Text variant="body" color="textSubtle">
            {question.explanation}
          </Text>
        </Animated.View>
      )}
    </Animated.View>
  )
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
    soundEnabled,
    vibrationEnabled,
    startGame,
    submitAnswer,
    nextQuestion,
    endGame,
    quitGame,
  } = useRopeGameStore()

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [gameEnded, setGameEnded] = useState(false)
  const [finalResult, setFinalResult] = useState<{
    score: number
    totalQuestions: number
    correctAnswers: number
  } | null>(null)

  // 初始化遊戲
  useEffect(() => {
    if (categoryId) {
      const questions = MOCK_QUESTIONS[categoryId] || []
      if (questions.length > 0) {
        startGame(categoryId, questions)
      }
    }
  }, [categoryId, startGame])

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

  const handleSelectAnswer = (index: number) => {
    if (showResult) return
    setSelectedAnswer(index)
  }

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
    if (categoryId) {
      const questions = MOCK_QUESTIONS[categoryId] || []
      startGame(categoryId, questions)
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

  if (!currentSession && !gameEnded) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text color="textMuted">載入中...</Text>
        </View>
      </SafeAreaView>
    )
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
          <Button
            variant="primary"
            size="lg"
            onPress={handleNext}
            style={styles.actionButton}
          >
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
  },
  questionCard: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  questionText: {
    marginBottom: SPACING.lg,
    lineHeight: 28,
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
