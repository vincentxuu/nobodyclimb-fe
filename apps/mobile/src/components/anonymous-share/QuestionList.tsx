/**
 * 問題列表組件
 *
 * 對應 apps/web/src/components/anonymous-share/QuestionList.tsx
 */
import React, { useState, useMemo } from 'react'
import { StyleSheet, View, Pressable, ActivityIndicator } from 'react-native'
import {
  Check,
  Plus,
  X,
  ChevronRight,
  ChevronDown,
  Pencil,
  MessageCircle,
  BookOpen,
  Sparkles,
} from 'lucide-react-native'

import { Text } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, BORDER_RADIUS } from '@nobodyclimb/constants'
import { useQuestions } from '@/lib/hooks/useQuestions'
import type { Question, StoryInput } from './questions'
import { convertApiQuestionsToQuestions } from './questions'

interface QuestionListProps {
  stories: StoryInput[]
  onSelectQuestion: (question: Question) => void
  onRemoveStory: (questionId: string) => void
}

/**
 * 已回答的故事列表
 */
function AnsweredStories({
  stories,
  allQuestions,
  onSelectQuestion,
  onRemoveStory,
}: {
  stories: StoryInput[]
  allQuestions: Question[]
  onSelectQuestion: (question: Question) => void
  onRemoveStory: (questionId: string) => void
}) {
  if (stories.length === 0) return null

  return (
    <View style={styles.section}>
      <Text variant="caption" color="muted" style={styles.sectionTitle}>
        已填寫 ({stories.length})
      </Text>
      <View style={styles.listContainer}>
        {stories.map((story) => {
          const q = allQuestions.find((q) => q.id === story.question_id)
          return (
            <View key={story.question_id} style={styles.answeredItem}>
              <View style={styles.checkIcon}>
                <Check size={16} color="#16A34A" />
              </View>
              <View style={styles.answeredContent}>
                <Text variant="bodyBold" numberOfLines={1}>
                  {q?.title || story.question_id}
                </Text>
                <Text variant="caption" color="muted" numberOfLines={1}>
                  {story.content}
                </Text>
              </View>
              <View style={styles.actionButtons}>
                <Pressable
                  style={styles.actionButton}
                  onPress={() => q && onSelectQuestion(q)}
                >
                  <Pencil size={16} color="#9CA3AF" />
                </Pressable>
                <Pressable
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => onRemoveStory(story.question_id)}
                >
                  <X size={16} color="#9CA3AF" />
                </Pressable>
              </View>
            </View>
          )
        })}
      </View>
    </View>
  )
}

/**
 * 問題項目按鈕
 */
function QuestionButton({
  question,
  iconBgColor,
  onPress,
}: {
  question: Question
  iconBgColor: string
  onPress: () => void
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.questionButton,
        pressed && styles.questionButtonPressed,
      ]}
      onPress={onPress}
    >
      <View style={[styles.plusIcon, { backgroundColor: iconBgColor }]}>
        <Plus size={16} color={SEMANTIC_COLORS.textMain} />
      </View>
      <View style={styles.questionContent}>
        <Text variant="bodyBold">
          {question.title}
        </Text>
        {question.subtitle && (
          <Text variant="caption" color="muted">
            {question.subtitle}
          </Text>
        )}
        {question.categoryName && !question.subtitle && (
          <Text variant="small" color="muted">
            {question.categoryName}
          </Text>
        )}
      </View>
      <ChevronRight size={20} color="#D1D5DB" />
    </Pressable>
  )
}

/**
 * 問題類別區塊
 */
function QuestionSection({
  title,
  subtitle,
  icon,
  questions,
  answeredIds,
  iconBgColor,
  onSelectQuestion,
}: {
  title: string
  subtitle: string
  icon: React.ReactNode
  questions: Question[]
  answeredIds: Set<string>
  iconBgColor: string
  onSelectQuestion: (question: Question) => void
}) {
  const unanswered = questions.filter((q) => !answeredIds.has(q.id))
  if (unanswered.length === 0) return null

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        {icon}
        <Text variant="caption" color="subtle" style={styles.sectionLabel}>
          {title}
        </Text>
        <Text variant="small" color="muted">
          {subtitle}
        </Text>
      </View>
      <View style={styles.listContainer}>
        {unanswered.map((question) => (
          <QuestionButton
            key={question.id}
            question={question}
            iconBgColor={iconBgColor}
            onPress={() => onSelectQuestion(question)}
          />
        ))}
      </View>
    </View>
  )
}

/**
 * 問題列表組件
 * 預設顯示一題，點擊展開更多
 */
export function QuestionList({
  stories,
  onSelectQuestion,
  onRemoveStory,
}: QuestionListProps) {
  const [showMore, setShowMore] = useState(false)
  const { data: questionsData, isLoading } = useQuestions()
  const answeredIds = new Set(stories.map((s) => s.question_id))

  // 從 API 資料轉換問題格式
  const questions = useMemo(() => {
    if (!questionsData) return null
    return convertApiQuestionsToQuestions(questionsData)
  }, [questionsData])

  // 載入中狀態
  if (isLoading || !questions) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={SEMANTIC_COLORS.textMuted} />
      </View>
    )
  }

  // 預設顯示的題目（核心故事第一題）
  const defaultQuestion = questions.coreStories[0]
  const isDefaultAnswered = defaultQuestion ? answeredIds.has(defaultQuestion.id) : true

  // 如果已經有回答任何題目，自動展開更多選項
  const shouldShowMore = showMore || stories.length > 0

  return (
    <>
      {/* 已填寫的故事 */}
      <AnsweredStories
        stories={stories}
        allQuestions={questions.all}
        onSelectQuestion={onSelectQuestion}
        onRemoveStory={onRemoveStory}
      />

      {/* 預設題目（未展開且未回答時顯示） */}
      {!shouldShowMore && defaultQuestion && !isDefaultAnswered && (
        <View style={styles.section}>
          <Text variant="caption" color="subtle" style={styles.sectionTitle}>
            從這題開始
          </Text>
          <View style={styles.listContainer}>
            <QuestionButton
              question={defaultQuestion}
              iconBgColor="rgba(255, 231, 12, 0.2)"
              onPress={() => onSelectQuestion(defaultQuestion)}
            />
          </View>
        </View>
      )}

      {/* 展開後顯示所有問題 */}
      {shouldShowMore && (
        <>
          {/* 核心故事 */}
          <QuestionSection
            title="核心故事"
            subtitle="深度分享"
            icon={<BookOpen size={16} color="#FFE70C" />}
            questions={questions.coreStories}
            answeredIds={answeredIds}
            iconBgColor="rgba(255, 231, 12, 0.2)"
            onSelectQuestion={onSelectQuestion}
          />

          {/* 一句話 */}
          <QuestionSection
            title="一句話"
            subtitle="快速回答"
            icon={<MessageCircle size={16} color={SEMANTIC_COLORS.textMain} />}
            questions={questions.oneLiners}
            answeredIds={answeredIds}
            iconBgColor="#F3F4F6"
            onSelectQuestion={onSelectQuestion}
          />

          {/* 深度故事 */}
          <QuestionSection
            title="更多故事"
            subtitle="選填"
            icon={<Sparkles size={16} color="#FFE70C" />}
            questions={questions.stories}
            answeredIds={answeredIds}
            iconBgColor="rgba(255, 231, 12, 0.1)"
            onSelectQuestion={onSelectQuestion}
          />
        </>
      )}

      {/* 想寫更多按鈕（未展開時顯示） */}
      {!shouldShowMore && (
        <Pressable
          style={({ pressed }) => [
            styles.showMoreButton,
            pressed && styles.showMoreButtonPressed,
          ]}
          onPress={() => setShowMore(true)}
        >
          <ChevronDown size={16} color="#6B7280" />
          <Text variant="caption" color="subtle">
            想寫更多
          </Text>
        </Pressable>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    paddingVertical: SPACING[10],
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: SPACING[5],
  },
  sectionTitle: {
    marginBottom: SPACING[3],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    marginBottom: SPACING[3],
  },
  sectionLabel: {
    marginLeft: SPACING[2],
    fontWeight: '600',
  },
  listContainer: {
    gap: SPACING[2],
  },
  answeredItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING[4],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  checkIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  answeredContent: {
    flex: 1,
    marginLeft: SPACING[3],
    marginRight: SPACING[3],
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING[2],
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: 'transparent',
  },
  questionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING[4],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  questionButtonPressed: {
    backgroundColor: '#F9FAFB',
  },
  plusIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionContent: {
    flex: 1,
    marginLeft: SPACING[3],
    marginRight: SPACING[3],
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    paddingVertical: SPACING[4],
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
  },
  showMoreButtonPressed: {
    borderColor: '#9CA3AF',
  },
})
