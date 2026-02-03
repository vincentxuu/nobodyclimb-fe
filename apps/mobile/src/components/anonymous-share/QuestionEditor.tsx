/**
 * 問題編輯器組件
 *
 * 對應 apps/web/src/components/anonymous-share/QuestionEditor.tsx
 */
import React, { useState } from 'react'
import {
  StyleSheet,
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ChevronLeft } from 'lucide-react-native'

import { Text, Button, Chip } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, BORDER_RADIUS } from '@nobodyclimb/constants'
import type { Question, StoryInput } from './questions'

interface QuestionEditorProps {
  question: Question
  initialContent?: string
  onSave: (story: StoryInput) => void
  onCancel: () => void
}

/**
 * 問題編輯器組件
 * 用於編輯單一問題的回答
 */
export function QuestionEditor({
  question,
  initialContent = '',
  onSave,
  onCancel,
}: QuestionEditorProps) {
  const [content, setContent] = useState(initialContent)

  const minLength = question.type === 'one_liner' ? 1 : 10
  const canSave = content.trim().length >= minLength

  const handleSave = () => {
    if (!canSave) return

    const story: StoryInput = {
      question_id: question.id,
      content: content.trim(),
      type: question.type,
      question_text: question.title,
      category_id: question.category,
    }

    onSave(story)
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={onCancel}>
          <ChevronLeft size={24} color={SEMANTIC_COLORS.textSubtle} />
          <Text variant="body" color="subtle">返回</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Button
          variant={canSave ? 'primary' : 'secondary'}
          size="sm"
          onPress={handleSave}
          disabled={!canSave}
        >
          儲存
        </Button>
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
          {/* Question Info */}
          <View style={styles.questionInfo}>
            <Text variant="h2" style={styles.questionTitle}>
              {question.title}
            </Text>
            {question.subtitle && (
              <Text variant="body" color="subtle" style={styles.questionSubtitle}>
                {question.subtitle}
              </Text>
            )}
            {question.categoryName && (
              <Chip variant="secondary" size="sm" style={styles.categoryChip}>
                {question.categoryName}
              </Chip>
            )}
          </View>

          {/* Text Input */}
          <TextInput
            style={[
              styles.textInput,
              question.type === 'one_liner' ? styles.shortInput : styles.longInput,
            ]}
            value={content}
            onChangeText={setContent}
            placeholder={question.placeholder}
            placeholderTextColor="#9CA3AF"
            multiline
            textAlignVertical="top"
            autoFocus
          />

          {/* Status */}
          <View style={styles.statusRow}>
            <Text
              variant="caption"
              style={{
                color: content.length < minLength ? '#9CA3AF' : '#16A34A',
              }}
            >
              {content.length < minLength
                ? `還需要 ${minLength - content.length} 個字`
                : '可以儲存了'}
            </Text>
            <Text variant="caption" color="muted">
              {content.length} 字
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: SEMANTIC_COLORS.cardBg,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING[4],
    paddingBottom: SPACING[10],
  },
  questionInfo: {
    marginBottom: SPACING[5],
  },
  questionTitle: {
    color: SEMANTIC_COLORS.textMain,
    marginBottom: SPACING[2],
  },
  questionSubtitle: {
    marginBottom: SPACING[3],
  },
  categoryChip: {
    alignSelf: 'flex-start',
  },
  textInput: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: SPACING[4],
    fontSize: 18,
    lineHeight: 28,
    color: SEMANTIC_COLORS.textMain,
  },
  shortInput: {
    minHeight: 80,
  },
  longInput: {
    minHeight: 200,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING[3],
  },
})
