/**
 * AuthInitializer 組件
 *
 * 認證初始化組件，對應 apps/web/src/components/shared/auth-initializer.tsx
 * 在應用程序啟動時檢查使用者認證狀態
 */
import { SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import { MessageCircle, Shuffle, X } from 'lucide-react-native'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native'
import { apiClient } from '@/lib/api'
import { biographyService } from '@/lib/biographyService'
import {
  calculatePromptProgress,
  convertToPromptQuestions,
  getUnfilledPromptQuestions,
  type PromptStoryQuestion,
  useQuestions,
} from '@/lib/hooks/useQuestions'
import { tokenStorage } from '@/lib/tokenStorage'
import { useAuthStore } from '@/store/authStore'
import { Button, Text, TextArea } from '../ui'

const STORY_PROMPT_SHOW_DELAY = 1500

function selectNextPrompt(
  questions: PromptStoryQuestion[],
  initialField?: string | null,
  lastField?: string | null
) {
  if (questions.length === 0) return null

  if (initialField) {
    const initial = questions.find((question) => question.field === initialField)
    if (initial) return initial
  }

  const easyQuestions = questions.filter(
    (question) =>
      question.difficulty === 'easy' ||
      question.title.includes('推薦') ||
      question.title.includes('旅行') ||
      question.title.includes('有趣')
  )
  const candidates = (easyQuestions.length > 0 ? easyQuestions : questions).filter(
    (question) => question.field !== lastField
  )
  const pool = candidates.length > 0 ? candidates : questions
  return pool[Math.floor(Math.random() * pool.length)]
}

/**
 * 認證初始化組件
 * 使用 hydrate 方法恢復認證狀態
 */
export function AuthInitializer() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const hydrate = useAuthStore((state) => state.hydrate)
  const { data: questionsData, isLoading: isLoadingQuestions } = useQuestions()

  const [isPromptVisible, setIsPromptVisible] = useState(false)
  const [biography, setBiography] = useState<Record<string, unknown> | null>(null)
  const [promptedQuestionId, setPromptedQuestionId] = useState<string | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<PromptStoryQuestion | null>(null)
  const [lastPromptedField, setLastPromptedField] = useState<string | null>(null)
  const [answer, setAnswer] = useState('')
  const [isPromptLoading, setIsPromptLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // 追蹤是否已經檢查過故事推薦
  const hasCheckedStoryPrompt = useRef(false)
  const hasHydrated = useRef(false)
  const hasShownBiographyPrompt = useRef(false)

  const promptQuestions = useMemo(() => {
    if (!questionsData) return []
    return convertToPromptQuestions(questionsData)
  }, [questionsData])

  const progress = useMemo(() => {
    if (!biography) return { completed: 0, total: 0, percentage: 0 }
    return calculatePromptProgress(promptQuestions, biography)
  }, [biography, promptQuestions])

  const loadPromptData = useCallback(async () => {
    setIsPromptLoading(true)
    try {
      const [biographyResponse, promptResponse] = await Promise.all([
        biographyService.getMyBiography(),
        apiClient.get('/story-prompts/next', { params: { strategy: 'easy_first' } }),
      ])

      const biographyData =
        biographyResponse.data && typeof biographyResponse.data === 'object'
          ? ((biographyResponse.data as { data?: unknown }).data ?? biographyResponse.data)
          : null
      setBiography((biographyData ?? {}) as Record<string, unknown>)

      const promptData = promptResponse.data?.data ?? promptResponse.data
      setPromptedQuestionId(promptData?.questionId ?? null)
      setIsPromptVisible(true)
    } catch (error) {
      console.error('載入故事推薦失敗:', error)
    } finally {
      setIsPromptLoading(false)
    }
  }, [])

  // 檢查是否應該顯示故事推薦彈窗
  const checkStoryPrompt = useCallback(async () => {
    // 避免重複檢查
    if (hasCheckedStoryPrompt.current) return
    hasCheckedStoryPrompt.current = true

    // 確保有 access token 才發送請求，避免未登入時產生錯誤
    const token = await tokenStorage.getAccessToken()
    if (!token) {
      return
    }

    try {
      const response = await apiClient.get('/story-prompts/should-prompt')
      const result = response.data?.data ?? response.data
      if (result?.should_prompt) {
        setTimeout(() => {
          loadPromptData()
        }, STORY_PROMPT_SHOW_DELAY)
      } else if (result?.reason === 'no_biography' && !hasShownBiographyPrompt.current) {
        hasShownBiographyPrompt.current = true
        setTimeout(() => {
          Alert.alert('歡迎加入 NobodyClimb！', '建立你的人物誌，讓更多岩友認識你吧。')
        }, STORY_PROMPT_SHOW_DELAY)
      }
    } catch (error) {
      console.error('檢查故事推薦失敗:', error)
    }
  }, [loadPromptData])

  useEffect(() => {
    if (!isPromptVisible || isLoadingQuestions || !biography || promptQuestions.length === 0) {
      return
    }

    const unfilled = getUnfilledPromptQuestions(promptQuestions, biography)
    const nextQuestion = selectNextPrompt(unfilled, promptedQuestionId, lastPromptedField)
    setCurrentQuestion(nextQuestion)
    setAnswer('')
  }, [
    isPromptVisible,
    isLoadingQuestions,
    biography,
    promptQuestions,
    promptedQuestionId,
    lastPromptedField,
  ])

  const handleClosePrompt = useCallback(() => {
    setIsPromptVisible(false)
    setPromptedQuestionId(null)
    setCurrentQuestion(null)
    setAnswer('')
  }, [])

  const handleSkipPrompt = useCallback(async () => {
    if (!currentQuestion) {
      handleClosePrompt()
      return
    }

    try {
      await apiClient.post(`/story-prompts/${currentQuestion.field}/dismiss`)
    } catch (error) {
      console.error('記錄故事推薦跳過失敗:', error)
    } finally {
      setLastPromptedField(currentQuestion.field)
      handleClosePrompt()
    }
  }, [currentQuestion, handleClosePrompt])

  const handleChangeQuestion = useCallback(() => {
    if (!biography) return
    const unfilled = getUnfilledPromptQuestions(promptQuestions, biography)
    const nextQuestion = selectNextPrompt(unfilled, null, currentQuestion?.field)
    setCurrentQuestion(nextQuestion)
    setAnswer('')
  }, [biography, currentQuestion, promptQuestions])

  const handleSavePrompt = useCallback(async () => {
    if (!currentQuestion || !answer.trim()) return

    setIsSaving(true)
    try {
      const response = await biographyService.updateMyBiography({
        [currentQuestion.field]: answer.trim(),
      })
      if (!response.success) {
        throw new Error(response.error || '故事儲存失敗')
      }

      await apiClient.post(`/story-prompts/${currentQuestion.field}/complete`)
      setBiography((current) => ({
        ...(current ?? {}),
        [currentQuestion.field]: answer.trim(),
      }))
      handleClosePrompt()
    } catch (error) {
      const message = error instanceof Error ? error.message : '請稍後再試'
      Alert.alert('故事儲存失敗', message)
    } finally {
      setIsSaving(false)
    }
  }, [answer, currentQuestion, handleClosePrompt])

  // 在組件掛載時使用 hydrate 恢復認證狀態
  useEffect(() => {
    const initAuth = async () => {
      if (hasHydrated.current) return
      hasHydrated.current = true

      // 使用 hydrate 恢復認證狀態
      await hydrate()
    }

    initAuth()
  }, [hydrate])

  // 追蹤前一次的認證狀態，用於偵測登入事件
  const prevIsAuthenticated = useRef(isAuthenticated)

  // 當用戶登入時（isAuthenticated 從 false 變成 true），檢查故事推薦
  useEffect(() => {
    // 偵測登入事件：從未認證變成已認證
    const justLoggedIn = isAuthenticated && !prevIsAuthenticated.current

    if (justLoggedIn) {
      // 重置檢查標記，允許重新檢查故事推薦
      hasCheckedStoryPrompt.current = false
    }

    // 更新前一次狀態
    prevIsAuthenticated.current = isAuthenticated

    // 如果已認證且尚未檢查過，執行檢查
    if (isAuthenticated && !hasCheckedStoryPrompt.current) {
      checkStoryPrompt()
    }
  }, [isAuthenticated, checkStoryPrompt])

  const isLoadingPromptContent = isPromptLoading || isLoadingQuestions || !currentQuestion
  const userName = user?.displayName || user?.username || '你'

  return (
    <Modal
      visible={isPromptVisible}
      transparent
      animationType="fade"
      onRequestClose={handleClosePrompt}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.modal}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.iconCircle}>
                <MessageCircle size={20} color={SEMANTIC_COLORS.textMain} />
              </View>
              <View style={styles.titleContent}>
                <Text variant="h3" fontWeight="600">
                  {userName}，補一段攀岩故事
                </Text>
                <Text variant="small" color="textMuted">
                  讓你的人物誌更完整
                </Text>
              </View>
            </View>
            <Pressable onPress={handleClosePrompt} style={styles.closeButton}>
              <X size={20} color={SEMANTIC_COLORS.textMuted} />
            </Pressable>
          </View>

          {isLoadingPromptContent ? (
            <View style={styles.loadingContent}>
              <ActivityIndicator size="small" color={SEMANTIC_COLORS.textMain} />
              <Text variant="small" color="textMuted">
                正在準備題目...
              </Text>
            </View>
          ) : (
            <View style={styles.content}>
              <View style={styles.questionCard}>
                <Text variant="body" fontWeight="600" style={styles.questionTitle}>
                  {currentQuestion.title}
                </Text>
                {currentQuestion.subtitle ? (
                  <Text variant="small" color="textMuted" style={styles.questionSubtitle}>
                    {currentQuestion.subtitle}
                  </Text>
                ) : null}
                <TextArea
                  value={answer}
                  onChangeText={setAnswer}
                  placeholder={currentQuestion.placeholder}
                  minRows={5}
                  maxRows={8}
                  style={styles.answerInput}
                />
                <Text variant="caption" color="textMuted" style={styles.charCount}>
                  {answer.length} 字
                </Text>
              </View>

              <View style={styles.progressRow}>
                <Text variant="caption" color="textMuted">
                  人物誌進度 {progress.completed}/{progress.total}
                </Text>
                <Text variant="caption" color="textMuted">
                  {progress.percentage}%
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress.percentage}%` }]} />
              </View>

              <View style={styles.actions}>
                <Button variant="ghost" size="sm" onPress={handleSkipPrompt} disabled={isSaving}>
                  稍後再說
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={handleChangeQuestion}
                  disabled={isSaving}
                  leftIcon={Shuffle}
                >
                  換一題
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onPress={handleSavePrompt}
                  disabled={!answer.trim() || isSaving}
                  loading={isSaving}
                >
                  儲存
                </Button>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

export default AuthInitializer

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    padding: SPACING.md,
  },
  modal: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE70C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContent: {
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  loadingContent: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  content: {
    padding: SPACING.md,
  },
  questionCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    padding: SPACING.md,
  },
  questionTitle: {
    marginBottom: 4,
  },
  questionSubtitle: {
    marginBottom: SPACING.sm,
  },
  answerInput: {
    backgroundColor: '#FFFFFF',
  },
  charCount: {
    marginTop: SPACING.xs,
    textAlign: 'right',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E5E5',
    overflow: 'hidden',
    marginTop: SPACING.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#FFE70C',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
})
