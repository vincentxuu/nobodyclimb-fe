/**
 * 攀岩人格測驗頁
 *
 * 24 道 Likert 量表題目，每次顯示一題
 */

import { QUIZ_QUESTIONS, SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import { ChevronLeft } from 'lucide-react-native'
import { useCallback, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, { SlideInRight, SlideOutLeft } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { QuizProgressBar } from '@/components/quiz/QuizProgressBar'
import { QuizQuestion } from '@/components/quiz/QuizQuestion'
import { Button, ConfirmDialog, IconButton } from '@/components/ui'
import { useQuizStore } from '@/store/quizStore'

const TOTAL_QUESTIONS = QUIZ_QUESTIONS.length

export default function QuizTestScreen() {
  const router = useRouter()
  const { answers, currentIndex, setAnswer, goNext, goPrev, complete } = useQuizStore()
  const [showExitDialog, setShowExitDialog] = useState(false)
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentQuestion = QUIZ_QUESTIONS[currentIndex]

  // 取得目前題目已選值
  const selectedValue = answers.find((a) => a.questionId === currentQuestion.id)?.value ?? null

  const handleSelect = useCallback(
    (value: 1 | 2 | 3 | 4 | 5) => {
      // 觸覺回饋
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

      // 儲存答案
      setAnswer(currentQuestion.id, value)

      // 清除先前的計時器
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current)
      }

      // 延遲自動切換
      autoAdvanceTimer.current = setTimeout(() => {
        if (currentIndex < TOTAL_QUESTIONS - 1) {
          goNext()
        } else {
          // 最後一題，完成測驗
          complete()
          // complete() 會同步計算 result，從 store 取得
          const { result: latestResult } = useQuizStore.getState()
          if (latestResult) {
            router.replace(`/quiz/result/${latestResult.typeCode}` as any)
          }
        }
      }, 300)
    },
    [currentIndex, currentQuestion.id, setAnswer, goNext, complete, router]
  )

  const handleBack = useCallback(() => {
    setShowExitDialog(true)
  }, [])

  const handleConfirmExit = useCallback(() => {
    setShowExitDialog(false)
    router.back()
  }, [router])

  const handlePrev = useCallback(() => {
    goPrev()
  }, [goPrev])

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 頂部導航 */}
      <View style={styles.header}>
        <IconButton
          icon={ChevronLeft}
          variant="ghost"
          onPress={handleBack}
          accessibilityLabel="離開測驗"
        />
        <View style={styles.progressWrapper}>
          <QuizProgressBar current={currentIndex} total={TOTAL_QUESTIONS} />
        </View>
      </View>

      {/* 題目區域 */}
      <View style={styles.questionContainer}>
        <Animated.View
          key={currentIndex}
          entering={SlideInRight.duration(300)}
          exiting={SlideOutLeft.duration(200)}
          style={styles.questionInner}
        >
          <QuizQuestion
            questionText={currentQuestion.textZh}
            axis={currentQuestion.axis}
            selectedValue={selectedValue}
            onSelect={handleSelect}
          />
        </Animated.View>
      </View>

      {/* 底部按鈕 */}
      <View style={styles.footer}>
        {currentIndex > 0 ? (
          <Button variant="outline" size="md" onPress={handlePrev}>
            上一題
          </Button>
        ) : (
          <View />
        )}
      </View>

      {/* 離開確認對話框 */}
      <ConfirmDialog
        open={showExitDialog}
        title="確定要離開？"
        message="你的進度會保留，下次可以繼續作答。"
        confirmLabel="離開"
        cancelLabel="繼續作答"
        onConfirm={handleConfirmExit}
        onCancel={() => setShowExitDialog(false)}
      />
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
    paddingHorizontal: SPACING[2],
    paddingVertical: SPACING[2],
    gap: SPACING[2],
  },
  progressWrapper: {
    flex: 1,
  },
  questionContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING[4],
  },
  questionInner: {
    width: '100%',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: SPACING[6],
    paddingVertical: SPACING[4],
    paddingBottom: SPACING[6],
  },
})
