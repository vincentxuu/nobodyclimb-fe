import React, { useState, useEffect } from 'react'
import {
  View,
  Pressable,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { YStack, XStack, Text } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { X, Loader2, MessageCircle } from 'lucide-react-native'
import { SEMANTIC_COLORS, COLORS } from '@nobodyclimb/constants'
import type { OneLinerQuestion, ContentSource } from '@nobodyclimb/types'

interface AddCustomOneLinerModalProps {
  /** 是否開啟 */
  isOpen: boolean
  /** 關閉回調 */
  onClose: () => void
  /** 儲存回調 */
  onSave: (question: OneLinerQuestion) => void
  /** 是否正在儲存 */
  isSaving?: boolean
}

/**
 * 新增自訂一句話問題 Modal
 *
 * 用於用戶新增自訂一句話問題
 */
export function AddCustomOneLinerModal({
  isOpen,
  onClose,
  onSave,
  isSaving = false,
}: AddCustomOneLinerModalProps) {
  const insets = useSafeAreaInsets()
  const [question, setQuestion] = useState('')
  const [formatHint, setFormatHint] = useState('')
  const [placeholder, setPlaceholder] = useState('')

  // 重置表單狀態
  useEffect(() => {
    if (isOpen) {
      setQuestion('')
      setFormatHint('')
      setPlaceholder('')
    }
  }, [isOpen])

  const handleSave = () => {
    if (!question.trim()) return

    const newQuestion: OneLinerQuestion = {
      id: `usr_ol_${Date.now()}`,
      source: 'user' as ContentSource,
      question: question.trim().endsWith('？') ? question.trim() : `${question.trim()}？`,
      format_hint: formatHint.trim() || null,
      placeholder: placeholder.trim() || '寫下你的答案...',
      display_order: 999,
      is_active: 1,
      order: 999,
    }

    onSave(newQuestion)
  }

  const canSave = question.trim().length > 0

  if (!isOpen) return null

  return (
    <Modal visible={isOpen} animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: `${COLORS.brand.dark}4D`,
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View
            style={{
              backgroundColor: 'white',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              maxHeight: '90%',
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: COLORS.border.light,
              }}
            >
              <XStack alignItems="center" gap="$2">
                <MessageCircle size={20} color={SEMANTIC_COLORS.textSubtle} />
                <Text fontSize={16} fontWeight="600" color={SEMANTIC_COLORS.textMain}>
                  新增一句話問題
                </Text>
              </XStack>
              <Pressable
                onPress={onClose}
                style={{
                  padding: 8,
                  borderRadius: 20,
                }}
              >
                <X size={20} color={COLORS.text.muted} />
              </Pressable>
            </View>

            {/* Content */}
            <ScrollView
              contentContainerStyle={{
                padding: 16,
                gap: 16,
              }}
              keyboardShouldPersistTaps="handled"
            >
              {/* 問題文字 */}
              <YStack gap="$2">
                <Text fontSize={14} fontWeight="500" color={SEMANTIC_COLORS.textMain}>
                  問題內容 <Text color={COLORS.status.error}>*</Text>
                </Text>
                <TextInput
                  value={question}
                  onChangeText={setQuestion}
                  placeholder="例如：最喜歡的攀岩電影是？"
                  placeholderTextColor={COLORS.text.disabled}
                  maxLength={50}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderWidth: 1,
                    borderColor: COLORS.border.default,
                    borderRadius: 12,
                    fontSize: 16,
                    color: SEMANTIC_COLORS.textMain,
                  }}
                />
                <Text fontSize={12} color={COLORS.text.muted}>
                  會自動加上問號，最多 50 字
                </Text>
              </YStack>

              {/* 格式引導 */}
              <YStack gap="$2">
                <Text fontSize={14} fontWeight="500" color={SEMANTIC_COLORS.textMain}>
                  格式引導{' '}
                  <Text fontSize={14} color={COLORS.text.muted}>
                    (選填)
                  </Text>
                </Text>
                <TextInput
                  value={formatHint}
                  onChangeText={setFormatHint}
                  placeholder="例如：因為＿＿＿、我覺得＿＿＿"
                  placeholderTextColor={COLORS.text.disabled}
                  maxLength={30}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderWidth: 1,
                    borderColor: COLORS.border.default,
                    borderRadius: 12,
                    fontSize: 16,
                    color: SEMANTIC_COLORS.textMain,
                  }}
                />
                <Text fontSize={12} color={COLORS.text.muted}>
                  幫助回答者知道該怎麼回答
                </Text>
              </YStack>

              {/* 範例答案 */}
              <YStack gap="$2">
                <Text fontSize={14} fontWeight="500" color={SEMANTIC_COLORS.textMain}>
                  範例答案{' '}
                  <Text fontSize={14} color={COLORS.text.muted}>
                    (選填)
                  </Text>
                </Text>
                <TextInput
                  value={placeholder}
                  onChangeText={setPlaceholder}
                  placeholder="例如：Free Solo，看完整個人都燃起來了"
                  placeholderTextColor={COLORS.text.disabled}
                  maxLength={50}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderWidth: 1,
                    borderColor: COLORS.border.default,
                    borderRadius: 12,
                    fontSize: 16,
                    color: SEMANTIC_COLORS.textMain,
                  }}
                />
                <Text fontSize={12} color={COLORS.text.muted}>
                  作為回答的參考範例
                </Text>
              </YStack>

              {/* 預覽 */}
              {question.trim() && (
                <View
                  style={{
                    backgroundColor: COLORS.background.subtle,
                    borderRadius: 12,
                    padding: 16,
                    gap: 12,
                  }}
                >
                  <Text fontSize={14} color={COLORS.text.muted}>
                    預覽
                  </Text>
                  <View
                    style={{
                      backgroundColor: 'white',
                      borderRadius: 8,
                      padding: 16,
                      gap: 8,
                    }}
                  >
                    <Text fontSize={16} fontWeight="500" color={SEMANTIC_COLORS.textMain}>
                      {question.trim().endsWith('？') ? question.trim() : `${question.trim()}？`}
                    </Text>
                    {formatHint.trim() && (
                      <Text fontSize={14} color={COLORS.text.muted}>
                        {formatHint.trim()}
                      </Text>
                    )}
                    <View
                      style={{
                        borderTopWidth: 1,
                        borderTopColor: COLORS.border.light,
                        paddingTop: 8,
                      }}
                    >
                      <Text fontSize={14} color={COLORS.text.disabled} fontStyle="italic">
                        {placeholder.trim() || '寫下你的答案...'}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* 提示 */}
              <View
                style={{
                  backgroundColor: `${COLORS.brand.accent}1A`,
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <Text fontSize={14} color={SEMANTIC_COLORS.textSubtle}>
                  一句話問題適合簡短、有趣的回答。想深入分享可以用「深度故事」。
                </Text>
              </View>
            </ScrollView>

            {/* Footer */}
            <View
              style={{
                flexDirection: 'row',
                gap: 12,
                padding: 16,
                paddingBottom: insets.bottom + 16,
                borderTopWidth: 1,
                borderTopColor: COLORS.border.light,
              }}
            >
              <Pressable
                onPress={onClose}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 14,
                  borderWidth: 1,
                  borderColor: COLORS.border.default,
                  borderRadius: 12,
                  alignItems: 'center',
                  backgroundColor: pressed ? COLORS.background.subtle : 'white',
                })}
              >
                <Text fontSize={16} fontWeight="500" color={SEMANTIC_COLORS.textSubtle}>
                  取消
                </Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                disabled={!canSave || isSaving}
                style={({ pressed }) => ({
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor:
                    canSave && !isSaving
                      ? pressed
                        ? COLORS.brand.darkHover
                        : COLORS.brand.dark
                      : COLORS.background.muted,
                })}
              >
                {isSaving && <Loader2 size={18} color="white" />}
                <Text
                  fontSize={16}
                  fontWeight="500"
                  color={canSave && !isSaving ? 'white' : COLORS.text.disabled}
                >
                  {isSaving ? '新增中...' : '新增問題'}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

export default AddCustomOneLinerModal
