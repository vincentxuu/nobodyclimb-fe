/**
 * GuidedQuestions 組件
 *
 * 引導問題組件，用於新手引導流程中的多步驟問題收集
 * 對應 apps/web/src/components/onboarding/GuidedQuestions.tsx
 */
import React, { useState, useCallback } from 'react'
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  FadeOut,
  FadeOutLeft,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated'
import {
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  Check,
} from 'lucide-react-native'
import {
  SEMANTIC_COLORS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZE,
  FONT_WEIGHT,
  WB_COLORS,
  BRAND_YELLOW,
} from '@nobodyclimb/constants'
import { Text } from '@/components/ui/Text'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { ProgressBar } from '@/components/ui/ProgressBar'

// ═══════════════════════════════════════════
// 類型定義
// ═══════════════════════════════════════════

export interface GuidedQuestion {
  id: string
  question: string
  subtitle?: string
  placeholder?: string
  type: 'text' | 'textarea'
  category: string
}

export interface GuidedQuestionsProps {
  /** 問題列表 */
  questions: GuidedQuestion[]
  /** 完成回調，返回所有答案 */
  onComplete: (answers: Record<string, string>) => void
  /** 跳過回調 */
  onSkip: () => void
  /** 標題 */
  title?: string
  /** 副標題 */
  subtitle?: string
}

// ═══════════════════════════════════════════
// 鼓勵文字
// ═══════════════════════════════════════════

const ENCOURAGEMENTS = [
  '太棒了！讓我們繼續',
  '很好的回答！',
  '精彩！再來一題',
  '完美！你做得很好',
  '讚！保持下去',
]

// ═══════════════════════════════════════════
// 組件
// ═══════════════════════════════════════════

export function GuidedQuestions({
  questions,
  onComplete,
  onSkip,
  title = '讓更多人認識你',
  subtitle = '回答幾個簡單的問題，讓你的人物誌更加完整',
}: GuidedQuestionsProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showEncouragement, setShowEncouragement] = useState(false)
  const [encouragementText, setEncouragementText] = useState('')

  const currentQuestion = questions[currentIndex]
  const progress = ((currentIndex + 1) / questions.length) * 100
  const isLastQuestion = currentIndex === questions.length - 1

  const handleAnswerChange = useCallback(
    (value: string) => {
      if (!currentQuestion) return
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: value,
      }))
    },
    [currentQuestion]
  )

  const handleNext = useCallback(() => {
    if (!currentQuestion) return

    if (isLastQuestion) {
      onComplete(answers)
      return
    }

    // 顯示鼓勵文字
    if (answers[currentQuestion.id]?.trim()) {
      const randomEncouragement =
        ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]
      setEncouragementText(randomEncouragement)
      setShowEncouragement(true)
      setTimeout(() => {
        setShowEncouragement(false)
        setCurrentIndex((prev) => prev + 1)
      }, 800)
    } else {
      setCurrentIndex((prev) => prev + 1)
    }
  }, [isLastQuestion, answers, currentQuestion, onComplete])

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }, [currentIndex])

  const handleSkipQuestion = useCallback(() => {
    if (isLastQuestion) {
      onComplete(answers)
    } else {
      setCurrentIndex((prev) => prev + 1)
    }
  }, [isLastQuestion, answers, onComplete])

  if (!currentQuestion) return null

  const hasAnswer = !!answers[currentQuestion.id]?.trim()

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 關閉按鈕 */}
        <Pressable style={styles.closeButton} onPress={onSkip}>
          <Icon icon={X} size="sm" color={SEMANTIC_COLORS.textMuted} />
        </Pressable>

        {/* 標題 */}
        <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
          <View style={styles.tagBadge}>
            <Icon icon={Sparkles} size="xs" color={SEMANTIC_COLORS.accent} />
            <Text style={styles.tagText}>快速設定</Text>
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </Animated.View>

        {/* 進度條 */}
        <Animated.View
          entering={FadeIn.delay(100).duration(300)}
          style={styles.progressContainer}
        >
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              第 {currentIndex + 1} 題，共 {questions.length} 題
            </Text>
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>
          <ProgressBar value={progress} height={8} />
        </Animated.View>

        {/* 問題卡片 */}
        {showEncouragement ? (
          <Animated.View
            key="encouragement"
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            style={styles.encouragementContainer}
          >
            <View style={styles.successIcon}>
              <Icon icon={Check} size="lg" color="#16A34A" />
            </View>
            <Text style={styles.encouragementText}>{encouragementText}</Text>
          </Animated.View>
        ) : (
          <Animated.View
            key={currentQuestion.id}
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(300)}
            style={styles.questionContainer}
          >
            {/* 分類標籤 */}
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{currentQuestion.category}</Text>
            </View>

            {/* 問題 */}
            <View style={styles.questionContent}>
              <Text style={styles.questionTitle}>{currentQuestion.question}</Text>
              {currentQuestion.subtitle && (
                <Text style={styles.questionSubtitle}>
                  {currentQuestion.subtitle}
                </Text>
              )}
            </View>

            {/* 輸入框 */}
            {currentQuestion.type === 'textarea' ? (
              <TextInput
                style={styles.textareaInput}
                value={answers[currentQuestion.id] || ''}
                onChangeText={handleAnswerChange}
                placeholder={currentQuestion.placeholder || '輸入你的回答...'}
                placeholderTextColor={SEMANTIC_COLORS.textMuted}
                multiline
                textAlignVertical="top"
                autoFocus
              />
            ) : (
              <TextInput
                style={styles.textInput}
                value={answers[currentQuestion.id] || ''}
                onChangeText={handleAnswerChange}
                placeholder={currentQuestion.placeholder || '輸入你的回答...'}
                placeholderTextColor={SEMANTIC_COLORS.textMuted}
                autoFocus
              />
            )}
          </Animated.View>
        )}

        {/* 按鈕區 */}
        {!showEncouragement && (
          <Animated.View
            entering={FadeIn.delay(200).duration(300)}
            style={styles.buttonsContainer}
          >
            <View style={styles.leftButtons}>
              {currentIndex > 0 && (
                <Button
                  variant="ghost"
                  leftIcon={ChevronLeft}
                  onPress={handlePrev}
                >
                  上一題
                </Button>
              )}
            </View>

            <View style={styles.rightButtons}>
              <Button
                variant="ghost"
                onPress={handleSkipQuestion}
                style={styles.skipButton}
              >
                <Text style={styles.skipButtonText}>跳過此題</Text>
              </Button>
              <Button
                variant={hasAnswer ? 'primary' : 'secondary'}
                rightIcon={isLastQuestion ? undefined : ChevronRight}
                onPress={handleNext}
              >
                {isLastQuestion ? '完成' : '下一題'}
              </Button>
            </View>
          </Animated.View>
        )}

        {/* 稍後再填提示 */}
        <Animated.View
          entering={FadeIn.delay(400).duration(300)}
          style={styles.skipContainer}
        >
          <Pressable onPress={onSkip}>
            <Text style={styles.skipText}>稍後再填，先去逛逛</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

// ═══════════════════════════════════════════
// 樣式
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SEMANTIC_COLORS.pageBg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[8],
    flexGrow: 1,
  },
  closeButton: {
    position: 'absolute',
    top: SPACING[4],
    right: SPACING[4],
    padding: SPACING[2],
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: WB_COLORS[10],
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING[6],
    paddingTop: SPACING[8],
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
    backgroundColor: `${SEMANTIC_COLORS.accent}15`,
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[1],
    borderRadius: BORDER_RADIUS.full,
    marginBottom: SPACING[2],
  },
  tagText: {
    fontSize: FONT_SIZE.sm,
    color: SEMANTIC_COLORS.accent,
  },
  title: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: FONT_WEIGHT.bold,
    color: SEMANTIC_COLORS.textMain,
    textAlign: 'center',
    marginBottom: SPACING[2],
  },
  subtitle: {
    fontSize: FONT_SIZE.base,
    color: SEMANTIC_COLORS.textSubtle,
    textAlign: 'center',
  },
  progressContainer: {
    marginBottom: SPACING[8],
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING[2],
  },
  progressText: {
    fontSize: FONT_SIZE.sm,
    color: SEMANTIC_COLORS.textMuted,
  },
  questionContainer: {
    flex: 1,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: WB_COLORS[10],
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[1],
    borderRadius: BORDER_RADIUS.full,
    marginBottom: SPACING[3],
  },
  categoryText: {
    fontSize: FONT_SIZE.xs,
    color: SEMANTIC_COLORS.textSubtle,
  },
  questionContent: {
    marginBottom: SPACING[6],
  },
  questionTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.medium,
    color: SEMANTIC_COLORS.textMain,
    marginBottom: SPACING[2],
  },
  questionSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: SEMANTIC_COLORS.textMuted,
  },
  textInput: {
    borderWidth: 1,
    borderColor: WB_COLORS[20],
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
    fontSize: FONT_SIZE.base,
    color: SEMANTIC_COLORS.textMain,
    backgroundColor: SEMANTIC_COLORS.cardBg,
  },
  textareaInput: {
    borderWidth: 1,
    borderColor: WB_COLORS[20],
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING[4],
    fontSize: FONT_SIZE.base,
    color: SEMANTIC_COLORS.textMain,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    minHeight: 150,
  },
  encouragementContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING[4],
  },
  encouragementText: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.medium,
    color: SEMANTIC_COLORS.textMain,
    textAlign: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING[8],
  },
  leftButtons: {
    flexDirection: 'row',
    gap: SPACING[2],
  },
  rightButtons: {
    flexDirection: 'row',
    gap: SPACING[2],
    alignItems: 'center',
  },
  skipButton: {
    opacity: 0.7,
  },
  skipButtonText: {
    fontSize: FONT_SIZE.sm,
    color: SEMANTIC_COLORS.textMuted,
  },
  skipContainer: {
    alignItems: 'center',
    marginTop: SPACING[8],
  },
  skipText: {
    fontSize: FONT_SIZE.sm,
    color: SEMANTIC_COLORS.textMuted,
    textDecorationLine: 'underline',
  },
})

export default GuidedQuestions
