/**
 * 路線故事分享表單
 *
 * 使用 BottomSheet 的故事分享表單，支援標題與內容輸入
 */
import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react'
import { StyleSheet, View, TextInput, Pressable, ActivityIndicator } from 'react-native'
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet'
import { X } from 'lucide-react-native'

import { Text, IconButton } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

// ── Types ──────────────────────────────────────────────

interface RouteStoryFormProps {
  routeId: string
  routeName: string
  routeGrade: string
  onSubmit: (data: { title?: string; content: string }) => Promise<void>
  isLoading?: boolean
}

export interface RouteStoryFormRef {
  open: () => void
  close: () => void
}

// ── Component ──────────────────────────────────────────

export const RouteStoryForm = forwardRef<RouteStoryFormRef, RouteStoryFormProps>(
  ({ routeId, routeName, routeGrade, onSubmit, isLoading }, ref) => {
    const bottomSheetRef = useRef<BottomSheet>(null)
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')

    const snapPoints = useMemo(() => ['70%'], [])

    useImperativeHandle(ref, () => ({
      open: () => {
        bottomSheetRef.current?.expand()
      },
      close: () => {
        bottomSheetRef.current?.close()
      },
    }))

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
        />
      ),
      []
    )

    const handleClose = useCallback(() => {
      bottomSheetRef.current?.close()
    }, [])

    const handleSubmit = useCallback(async () => {
      if (!content.trim() || isLoading) return

      await onSubmit({
        title: title.trim() || undefined,
        content: content.trim(),
      })

      // 清空表單並關閉
      setTitle('')
      setContent('')
      bottomSheetRef.current?.close()
    }, [content, title, isLoading, onSubmit])

    const isSubmitDisabled = !content.trim() || isLoading

    return (
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.indicator}
        backgroundStyle={styles.background}
        keyboardBehavior="interactive"
      >
        <BottomSheetScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* 標題列 */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text variant="h4" fontWeight="600">
                分享攀岩故事
              </Text>
              <Text variant="caption" color="textMuted">
                {routeName} · {routeGrade}
              </Text>
            </View>
            <IconButton
              icon={<X size={20} color={SEMANTIC_COLORS.textMain} />}
              onPress={handleClose}
              variant="ghost"
              size="sm"
            />
          </View>

          {/* 表單 */}
          <View style={styles.form}>
            {/* 標題（選填） */}
            <View style={styles.field}>
              <Text variant="caption" color="textSubtle" style={styles.fieldLabel}>
                標題（選填）
              </Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="為你的故事加個標題..."
                placeholderTextColor={SEMANTIC_COLORS.textMuted}
                maxLength={100}
              />
            </View>

            {/* 內容（必填） */}
            <View style={styles.field}>
              <Text variant="caption" color="textSubtle" style={styles.fieldLabel}>
                內容
              </Text>
              <TextInput
                style={[styles.input, styles.contentInput]}
                value={content}
                onChangeText={setContent}
                placeholder="分享你的攀登體驗、beta、心得..."
                placeholderTextColor={SEMANTIC_COLORS.textMuted}
                multiline
                textAlignVertical="top"
                maxLength={2000}
              />
            </View>

            {/* 提交按鈕 */}
            <Pressable
              style={[
                styles.submitButton,
                isSubmitDisabled && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitDisabled}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text
                  variant="body"
                  fontWeight="600"
                  style={styles.submitButtonText}
                >
                  分享故事
                </Text>
              )}
            </Pressable>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    )
  }
)

RouteStoryForm.displayName = 'RouteStoryForm'

// ── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  background: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  indicator: {
    backgroundColor: '#D4D4D4',
    width: 36,
    height: 4,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerContent: {
    flex: 1,
  },

  // Form
  form: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  field: {
    gap: SPACING.xs,
  },
  fieldLabel: {
    marginLeft: 2,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    fontSize: 15,
    color: SEMANTIC_COLORS.textMain,
  },
  contentInput: {
    height: 120,
  },

  // Submit
  submitButton: {
    backgroundColor: '#2563EB',
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  submitButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  submitButtonText: {
    color: '#FFFFFF',
  },
})
