/**
 * ChoiceQuestion 組件
 *
 * 選擇題組件，用於新手引導流程
 * 對應 apps/web/src/components/onboarding/ChoiceQuestion.tsx
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
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import {
  Check,
  Users,
  ChevronRight,
  X,
  Sparkles,
  MessageCircle,
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
import { springConfigLight } from '@/theme/animations'

// ═══════════════════════════════════════════
// 類型定義
// ═══════════════════════════════════════════

export interface ChoiceOption {
  id: string
  label: string
  value: string
  isOther: boolean
  responseTemplate: string
  count: number
}

export interface ChoiceQuestionData {
  id: string
  question: string
  hint: string | null
  followUpPrompt: string | null
  followUpPlaceholder: string | null
  options: ChoiceOption[]
}

interface ChoiceQuestionProps {
  question: ChoiceQuestionData
  onSubmit: (
    optionId: string,
    customText?: string,
    followUpText?: string
  ) => Promise<{
    responseMessage: string
    communityCount: number
  }>
  onSkip: () => void
  onComplete: () => void
}

type Phase = 'selecting' | 'response' | 'followup' | 'complete'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// ═══════════════════════════════════════════
// 選項按鈕組件
// ═══════════════════════════════════════════

interface OptionButtonProps {
  option: ChoiceOption
  isSelected: boolean
  disabled: boolean
  onPress: () => void
}

function OptionButton({ option, isSelected, disabled, onPress }: OptionButtonProps) {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = useCallback(() => {
    if (!disabled) {
      scale.value = withSpring(0.98, springConfigLight)
    }
  }, [disabled, scale])

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, springConfigLight)
  }, [scale])

  return (
    <AnimatedPressable
      style={[
        styles.optionButton,
        isSelected && styles.optionButtonSelected,
        disabled && styles.optionButtonDisabled,
        animatedStyle,
      ]}
      disabled={disabled}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <View style={styles.optionContent}>
        <Text
          style={[
            styles.optionLabel,
            isSelected && styles.optionLabelSelected,
          ]}
        >
          {option.label}
        </Text>
        {option.count > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{option.count} 人</Text>
          </View>
        )}
      </View>
    </AnimatedPressable>
  )
}

// ═══════════════════════════════════════════
// 主組件
// ═══════════════════════════════════════════

export function ChoiceQuestion({
  question,
  onSubmit,
  onSkip,
  onComplete,
}: ChoiceQuestionProps) {
  const [phase, setPhase] = useState<Phase>('selecting')
  const [selectedOption, setSelectedOption] = useState<ChoiceOption | null>(null)
  const [customText, setCustomText] = useState('')
  const [followUpText, setFollowUpText] = useState('')
  const [responseMessage, setResponseMessage] = useState('')
  const [communityCount, setCommunityCount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 計算總人數
  const totalCount = question.options.reduce((sum, opt) => sum + opt.count, 0)

  const handleOptionSelect = useCallback(
    async (option: ChoiceOption) => {
      setSelectedOption(option)

      // 如果是「其他」選項，先不提交，等用戶輸入
      if (option.isOther) {
        return
      }

      setIsSubmitting(true)
      try {
        const result = await onSubmit(option.id)
        setResponseMessage(result.responseMessage)
        setCommunityCount(result.communityCount)
        setPhase('response')
      } catch (error) {
        console.error('Failed to submit answer:', error)
      } finally {
        setIsSubmitting(false)
      }
    },
    [onSubmit]
  )

  const handleOtherSubmit = useCallback(async () => {
    if (!selectedOption || !customText.trim()) return

    setIsSubmitting(true)
    try {
      const result = await onSubmit(selectedOption.id, customText)
      setResponseMessage(result.responseMessage)
      setCommunityCount(result.communityCount)
      setPhase('response')
    } catch (error) {
      console.error('Failed to submit answer:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [selectedOption, customText, onSubmit])

  const handleContinueToFollowUp = useCallback(() => {
    if (question.followUpPrompt) {
      setPhase('followup')
    } else {
      onComplete()
    }
  }, [question.followUpPrompt, onComplete])

  const handleFollowUpSubmit = useCallback(async () => {
    if (!selectedOption) return

    setIsSubmitting(true)
    try {
      await onSubmit(
        selectedOption.id,
        customText || undefined,
        followUpText || undefined
      )
      setPhase('complete')
      // 短暫顯示完成狀態後繼續
      setTimeout(() => {
        onComplete()
      }, 1000)
    } catch (error) {
      console.error('Failed to submit follow-up:', error)
      onComplete() // 即使失敗也繼續
    } finally {
      setIsSubmitting(false)
    }
  }, [selectedOption, customText, followUpText, onSubmit, onComplete])

  const handleSkipFollowUp = useCallback(() => {
    onComplete()
  }, [onComplete])

  // ═══════════════════════════════════════════
  // 選擇階段
  // ═══════════════════════════════════════════
  if (phase === 'selecting') {
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
              <Text style={styles.tagText}>快速認識你</Text>
            </View>
            <Text style={styles.questionTitle}>{question.question}</Text>
            {question.hint && (
              <Text style={styles.questionHint}>{question.hint}</Text>
            )}
          </Animated.View>

          {/* 社群驗證 */}
          {totalCount > 0 && (
            <Animated.View
              entering={FadeIn.delay(100).duration(300)}
              style={styles.socialProof}
            >
              <Icon icon={Users} size="sm" color={SEMANTIC_COLORS.textMuted} />
              <Text style={styles.socialProofText}>
                已有 {totalCount} 人回答過這個問題
              </Text>
            </Animated.View>
          )}

          {/* 選項列表 */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(300)}
            style={styles.optionsList}
          >
            {question.options.map((option, index) => (
              <Animated.View
                key={option.id}
                entering={FadeInDown.delay(200 + index * 50).duration(300)}
              >
                <OptionButton
                  option={option}
                  isSelected={selectedOption?.id === option.id}
                  disabled={isSubmitting}
                  onPress={() => handleOptionSelect(option)}
                />
              </Animated.View>
            ))}
          </Animated.View>

          {/* 其他選項的輸入框 */}
          {selectedOption?.isOther && (
            <Animated.View
              entering={FadeInDown.duration(300)}
              style={styles.otherInputContainer}
              layout={Layout}
            >
              <TextInput
                style={styles.otherInput}
                value={customText}
                onChangeText={setCustomText}
                placeholder="請描述你的開始..."
                placeholderTextColor={SEMANTIC_COLORS.textMuted}
                autoFocus
              />
              <Button
                onPress={handleOtherSubmit}
                disabled={!customText.trim() || isSubmitting}
                loading={isSubmitting}
                fullWidth
              >
                送出
              </Button>
            </Animated.View>
          )}

          {/* 跳過按鈕 */}
          <Animated.View
            entering={FadeIn.delay(400).duration(300)}
            style={styles.skipContainer}
          >
            <Pressable onPress={onSkip}>
              <Text style={styles.skipText}>先跳過，之後再回答</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    )
  }

  // ═══════════════════════════════════════════
  // 回應階段
  // ═══════════════════════════════════════════
  if (phase === 'response') {
    return (
      <View style={styles.container}>
        <Animated.View
          entering={FadeIn.duration(300)}
          style={styles.responseContainer}
        >
          <View style={styles.successIcon}>
            <Icon icon={Check} size="lg" color="#16A34A" />
          </View>

          <Text style={styles.responseTitle}>{responseMessage}</Text>

          <Text style={styles.responseSubtitle}>
            已有{' '}
            <Text style={styles.highlightText}>{communityCount}</Text>{' '}
            人和你一樣
          </Text>

          <Button
            onPress={handleContinueToFollowUp}
            rightIcon={ChevronRight}
            style={styles.continueButton}
          >
            {question.followUpPrompt ? '繼續' : '完成'}
          </Button>
        </Animated.View>
      </View>
    )
  }

  // ═══════════════════════════════════════════
  // 跟進問題階段
  // ═══════════════════════════════════════════
  if (phase === 'followup') {
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
          <Animated.View
            entering={FadeInRight.duration(300)}
            style={styles.followUpContainer}
          >
            {/* 標題 */}
            <View style={styles.header}>
              <View style={styles.tagBadge}>
                <Icon icon={MessageCircle} size="xs" color={SEMANTIC_COLORS.accent} />
                <Text style={styles.tagText}>一句話就好</Text>
              </View>
              <Text style={styles.followUpTitle}>{question.followUpPrompt}</Text>
              <Text style={styles.followUpHint}>
                可選填，讓其他人更了解你的故事
              </Text>
            </View>

            {/* 輸入框 */}
            <TextInput
              style={styles.followUpInput}
              value={followUpText}
              onChangeText={setFollowUpText}
              placeholder={question.followUpPlaceholder || '輸入你的故事...'}
              placeholderTextColor={SEMANTIC_COLORS.textMuted}
              autoFocus
            />

            {/* 按鈕 */}
            <View style={styles.followUpButtons}>
              <Button
                variant="outline"
                onPress={handleSkipFollowUp}
                style={styles.followUpButton}
              >
                跳過
              </Button>
              <Button
                onPress={handleFollowUpSubmit}
                loading={isSubmitting}
                disabled={isSubmitting}
                style={styles.followUpButton}
              >
                送出
              </Button>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    )
  }

  // ═══════════════════════════════════════════
  // 完成階段
  // ═══════════════════════════════════════════
  return (
    <View style={styles.container}>
      <Animated.View
        entering={FadeIn.duration(300)}
        exiting={FadeOut.duration(200)}
        style={styles.responseContainer}
      >
        <View style={styles.successIcon}>
          <Icon icon={Check} size="lg" color="#16A34A" />
        </View>
        <Text style={styles.responseTitle}>完成！</Text>
      </Animated.View>
    </View>
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
  questionTitle: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: FONT_WEIGHT.bold,
    color: SEMANTIC_COLORS.textMain,
    textAlign: 'center',
    marginBottom: SPACING[2],
  },
  questionHint: {
    fontSize: FONT_SIZE.base,
    color: SEMANTIC_COLORS.textSubtle,
    textAlign: 'center',
  },
  socialProof: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    marginBottom: SPACING[6],
  },
  socialProofText: {
    fontSize: FONT_SIZE.sm,
    color: SEMANTIC_COLORS.textMuted,
  },
  optionsList: {
    gap: SPACING[3],
    marginBottom: SPACING[4],
  },
  optionButton: {
    borderWidth: 2,
    borderColor: WB_COLORS[20],
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING[4],
    backgroundColor: SEMANTIC_COLORS.cardBg,
  },
  optionButtonSelected: {
    borderColor: SEMANTIC_COLORS.accent,
    backgroundColor: `${SEMANTIC_COLORS.accent}08`,
  },
  optionButtonDisabled: {
    opacity: 0.5,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionLabel: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.medium,
    color: SEMANTIC_COLORS.textMain,
    flex: 1,
  },
  optionLabelSelected: {
    color: SEMANTIC_COLORS.accent,
  },
  countBadge: {
    backgroundColor: WB_COLORS[10],
    paddingHorizontal: SPACING[2],
    paddingVertical: SPACING[0.5],
    borderRadius: BORDER_RADIUS.full,
  },
  countText: {
    fontSize: FONT_SIZE.xs,
    color: SEMANTIC_COLORS.textMuted,
  },
  otherInputContainer: {
    gap: SPACING[3],
    marginTop: SPACING[4],
  },
  otherInput: {
    borderWidth: 1,
    borderColor: WB_COLORS[20],
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING[4],
    fontSize: FONT_SIZE.base,
    color: SEMANTIC_COLORS.textMain,
    backgroundColor: SEMANTIC_COLORS.cardBg,
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
  // Response phase
  responseContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING[4],
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
  responseTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.medium,
    color: SEMANTIC_COLORS.textMain,
    textAlign: 'center',
    marginBottom: SPACING[2],
  },
  responseSubtitle: {
    fontSize: FONT_SIZE.base,
    color: SEMANTIC_COLORS.textSubtle,
    textAlign: 'center',
    marginBottom: SPACING[6],
  },
  highlightText: {
    fontWeight: FONT_WEIGHT.medium,
    color: SEMANTIC_COLORS.accent,
  },
  continueButton: {
    minWidth: 120,
  },
  // Follow-up phase
  followUpContainer: {
    paddingTop: SPACING[8],
  },
  followUpTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: SEMANTIC_COLORS.textMain,
    textAlign: 'center',
    marginBottom: SPACING[2],
  },
  followUpHint: {
    fontSize: FONT_SIZE.sm,
    color: SEMANTIC_COLORS.textMuted,
    textAlign: 'center',
  },
  followUpInput: {
    borderWidth: 1,
    borderColor: WB_COLORS[20],
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING[4],
    fontSize: FONT_SIZE.base,
    color: SEMANTIC_COLORS.textMain,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    marginTop: SPACING[6],
  },
  followUpButtons: {
    flexDirection: 'row',
    gap: SPACING[3],
    marginTop: SPACING[6],
  },
  followUpButton: {
    flex: 1,
  },
})

export default ChoiceQuestion
