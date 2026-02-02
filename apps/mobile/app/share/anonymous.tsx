/**
 * 匿名分享頁面
 *
 * 對應 apps/web/src/app/share/anonymous/page.tsx
 */
import React, { useState, useMemo, useCallback } from 'react'
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { ChevronLeft } from 'lucide-react-native'

import { Text, Button, IconButton, Spinner } from '@/components/ui'
import {
  QuestionEditor,
  QuestionList,
  SubmissionComplete,
  EligibilityCheck,
  AlreadyAuthenticated,
  type Question,
  type StoryInput,
} from '@/components/anonymous-share'
import { useGuestSession } from '@/lib/hooks/useGuestSession'
import { useAuthStore } from '@/store/authStore'
import { apiClient } from '@/lib/api'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

type ViewMode = 'list' | 'edit' | 'complete'

export default function AnonymousShareScreen() {
  const router = useRouter()
  const { status } = useAuthStore()
  const { session, isEligibleToShare, sessionId } = useGuestSession()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [stories, setStories] = useState<StoryInput[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [contactEmail, setContactEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{ slug: string; anonymousName: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showEmailInput, setShowEmailInput] = useState(false)

  // 統計
  const stats = useMemo(
    () => ({
      total: stories.length,
    }),
    [stories]
  )

  // 已登入用戶
  if (status === 'signIn') {
    return <AlreadyAuthenticated />
  }

  // 未達分享資格
  if (!isEligibleToShare && session) {
    return <EligibilityCheck session={session} />
  }

  // 完成提交
  if (viewMode === 'complete' && result) {
    return (
      <SubmissionComplete
        slug={result.slug}
        anonymousName={result.anonymousName}
        totalStories={stats.total}
      />
    )
  }

  // 開始編輯某題
  const handleSelectQuestion = (question: Question) => {
    setCurrentQuestion(question)
    setViewMode('edit')
  }

  // 儲存當前題目
  const handleSaveStory = (newStory: StoryInput) => {
    setStories((prev) => {
      const filtered = prev.filter((s) => s.question_id !== newStory.question_id)
      return [...filtered, newStory]
    })
    setCurrentQuestion(null)
    setViewMode('list')
  }

  // 刪除某題
  const handleRemoveStory = (questionId: string) => {
    Alert.alert('刪除回答', '確定要刪除這個回答嗎？', [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除',
        style: 'destructive',
        onPress: () => {
          setStories((prev) => prev.filter((s) => s.question_id !== questionId))
        },
      },
    ])
  }

  // 取消編輯
  const handleCancelEdit = () => {
    setCurrentQuestion(null)
    setViewMode('list')
  }

  // 提交
  const handleSubmit = async () => {
    if (stories.length === 0) {
      setError('請至少填寫一個故事')
      return
    }

    if (!sessionId) {
      setError('Session 遺失，請重新開啟頁面')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await apiClient.post('/guest/anonymous/biography', {
        session_id: sessionId,
        core_stories: stories.filter((s) => s.type === 'core_story'),
        one_liners: stories
          .filter((s) => s.type === 'one_liner')
          .map((s) => ({
            question_id: s.question_id,
            answer: s.content,
            question_text: s.question_text,
          })),
        stories: stories
          .filter((s) => s.type === 'story')
          .map((s) => ({
            question_id: s.question_id,
            content: s.content,
            question_text: s.question_text,
            category_id: s.category_id,
          })),
        contact_email: contactEmail || undefined,
      })

      if (response.data.success) {
        setResult({
          slug: response.data.biography.slug,
          anonymousName: response.data.biography.anonymous_name,
        })
        setViewMode('complete')
      } else {
        setError(response.data.error || '提交失敗')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || '提交失敗，請稍後再試')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 編輯模式
  if (viewMode === 'edit' && currentQuestion) {
    const existingContent = stories.find((s) => s.question_id === currentQuestion.id)?.content

    return (
      <QuestionEditor
        question={currentQuestion}
        initialContent={existingContent}
        onSave={handleSaveStory}
        onCancel={handleCancelEdit}
      />
    )
  }

  // 列表模式（主頁面）
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon={<ChevronLeft size={24} color={SEMANTIC_COLORS.textSubtle} />}
          onPress={() => router.back()}
          variant="ghost"
        />
        <Text variant="h4" fontWeight="600">
          匿名分享故事
        </Text>
        <View style={{ width: 48 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* 問題列表 */}
          <QuestionList
            stories={stories}
            onSelectQuestion={handleSelectQuestion}
            onRemoveStory={handleRemoveStory}
          />

          {/* Email 輸入 */}
          {showEmailInput && (
            <View style={styles.emailSection}>
              <View style={styles.emailCard}>
                <Text variant="body" fontWeight="600" style={styles.emailLabel}>
                  Email（可選）
                </Text>
                <Text variant="caption" color="textMuted" style={styles.emailHint}>
                  留下 email，之後用同一個 email 註冊就能自動認領
                </Text>
                <TextInput
                  style={styles.emailInput}
                  value={contactEmail}
                  onChangeText={setContactEmail}
                  placeholder="your@email.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
          )}

          {/* 錯誤訊息 */}
          {error && (
            <View style={styles.errorBox}>
              <Text variant="caption" style={styles.errorText}>
                {error}
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 底部操作列 */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomContent}>
          <Text variant="caption" color="textMuted">
            {stats.total > 0 ? `已填寫 ${stats.total} 題` : '選擇題目開始分享'}
          </Text>
          <View style={styles.bottomActions}>
            {!showEmailInput && stories.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onPress={() => setShowEmailInput(true)}
              >
                留 Email
              </Button>
            )}
            <Button
              variant="primary"
              onPress={handleSubmit}
              disabled={isSubmitting || stories.length === 0}
              loading={isSubmitting}
              style={styles.submitButton}
            >
              匿名發布
            </Button>
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: SEMANTIC_COLORS.cardBg,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 120,
  },
  emailSection: {
    marginTop: SPACING.lg,
  },
  emailCard: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  emailLabel: {
    marginBottom: SPACING.xxs,
  },
  emailHint: {
    marginBottom: SPACING.sm,
  },
  emailInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    fontSize: 14,
    color: SEMANTIC_COLORS.textMain,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginTop: SPACING.md,
  },
  errorText: {
    color: '#DC2626',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  bottomContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  submitButton: {
    minWidth: 100,
  },
})
