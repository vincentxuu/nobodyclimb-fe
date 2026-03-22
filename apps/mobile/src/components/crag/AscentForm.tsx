/**
 * 攀登紀錄建立表單
 *
 * 使用 BottomSheet 的攀登紀錄表單，支援攀登類型、日期、評分與筆記
 */
import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react'
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet'
import { X, Star } from 'lucide-react-native'

import { Text, IconButton } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'
import { ASCENT_TYPE_LABELS, ASCENT_TYPE_COLORS } from '@/lib/constants/ascent'
import type { AscentType } from '@/lib/constants/ascent'

// ── Types ──────────────────────────────────────────────

interface AscentFormProps {
  routeId: string
  routeName: string
  routeGrade: string
  onSubmit: (data: {
    ascent_type: string
    ascent_date: string
    rating?: number
    notes?: string
  }) => Promise<void>
  isLoading?: boolean
}

export interface AscentFormRef {
  open: () => void
  close: () => void
}

// ── Helpers ────────────────────────────────────────────

const ASCENT_TYPES: AscentType[] = [
  'redpoint',
  'flash',
  'onsight',
  'attempt',
  'toprope',
  'lead',
  'seconding',
  'repeat',
]

function getTodayString(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ── Component ──────────────────────────────────────────

export const AscentForm = forwardRef<AscentFormRef, AscentFormProps>(
  ({ routeId, routeName, routeGrade, onSubmit, isLoading }, ref) => {
    const bottomSheetRef = useRef<BottomSheet>(null)
    const [ascentType, setAscentType] = useState<AscentType>('redpoint')
    const [ascentDate, setAscentDate] = useState(getTodayString())
    const [rating, setRating] = useState<number | undefined>(undefined)
    const [notes, setNotes] = useState('')

    const snapPoints = useMemo(() => ['75%'], [])

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
      if (!ascentType || !ascentDate.trim() || isLoading) return

      await onSubmit({
        ascent_type: ascentType,
        ascent_date: ascentDate.trim(),
        rating,
        notes: notes.trim() || undefined,
      })

      // 清空表單並關閉
      setAscentType('redpoint')
      setAscentDate(getTodayString())
      setRating(undefined)
      setNotes('')
      bottomSheetRef.current?.close()
    }, [ascentType, ascentDate, rating, notes, isLoading, onSubmit])

    const handleStarPress = useCallback((starIndex: number) => {
      setRating((prev) => (prev === starIndex ? undefined : starIndex))
    }, [])

    const isSubmitDisabled = !ascentType || !ascentDate.trim() || isLoading

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
                記錄攀登
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
            {/* 攀登類型 */}
            <View style={styles.field}>
              <Text variant="caption" color="textSubtle" style={styles.fieldLabel}>
                攀登類型
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                {ASCENT_TYPES.map((type) => {
                  const isSelected = ascentType === type
                  const color = ASCENT_TYPE_COLORS[type]
                  return (
                    <Pressable
                      key={type}
                      style={[
                        styles.chip,
                        isSelected
                          ? { backgroundColor: color }
                          : { backgroundColor: `${color}18`, borderColor: `${color}40`, borderWidth: 1 },
                      ]}
                      onPress={() => setAscentType(type)}
                    >
                      <Text
                        variant="caption"
                        fontWeight="600"
                        style={{ color: isSelected ? '#FFFFFF' : color }}
                      >
                        {ASCENT_TYPE_LABELS[type]}
                      </Text>
                    </Pressable>
                  )
                })}
              </ScrollView>
            </View>

            {/* 攀登日期 */}
            <View style={styles.field}>
              <Text variant="caption" color="textSubtle" style={styles.fieldLabel}>
                攀登日期
              </Text>
              <TextInput
                style={styles.input}
                value={ascentDate}
                onChangeText={setAscentDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={SEMANTIC_COLORS.textMuted}
                maxLength={10}
              />
            </View>

            {/* 評分 */}
            <View style={styles.field}>
              <Text variant="caption" color="textSubtle" style={styles.fieldLabel}>
                評分
              </Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Pressable key={i} onPress={() => handleStarPress(i)}>
                    <Star
                      size={28}
                      color={rating != null && i <= rating ? '#EAB308' : '#D1D5DB'}
                      fill={rating != null && i <= rating ? '#EAB308' : 'transparent'}
                    />
                  </Pressable>
                ))}
              </View>
            </View>

            {/* 攀登筆記 */}
            <View style={styles.field}>
              <Text variant="caption" color="textSubtle" style={styles.fieldLabel}>
                攀登筆記（選填）
              </Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                value={notes}
                onChangeText={setNotes}
                placeholder="攀登筆記..."
                placeholderTextColor={SEMANTIC_COLORS.textMuted}
                multiline
                textAlignVertical="top"
                maxLength={1000}
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
                  記錄攀登
                </Text>
              )}
            </Pressable>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    )
  }
)

AscentForm.displayName = 'AscentForm'

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
  notesInput: {
    height: 80,
  },

  // Chips
  chipRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: 16,
  },

  // Stars
  starsRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    paddingVertical: 4,
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
