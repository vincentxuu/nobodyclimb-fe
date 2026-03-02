import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Animated,
  Dimensions,
} from 'react-native'
import { YStack, XStack, Text } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { X, Check, Lightbulb, Loader2, Trash2 } from 'lucide-react-native'
import { SEMANTIC_COLORS, COLORS } from '@nobodyclimb/constants'
import type { StoryQuestion, Story } from '@nobodyclimb/types'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

interface StoryEditFullscreenProps {
  /** 是否開啟 */
  isOpen: boolean
  /** 關閉回調 */
  onClose: () => void
  /** 問題資料 */
  question: StoryQuestion | null
  /** 已存在的故事資料 */
  story?: Story | null
  /** 儲存回調 */
  onSave: (content: string) => void
  /** 刪除回調 */
  onDelete?: () => void
  /** 是否正在儲存 */
  isSaving?: boolean
}

/**
 * 全螢幕故事編輯器
 *
 * 手機版專用的全螢幕故事編輯介面
 */
export function StoryEditFullscreen({
  isOpen,
  onClose,
  question,
  story,
  onSave,
  onDelete,
  isSaving = false,
}: StoryEditFullscreenProps) {
  const insets = useSafeAreaInsets()
  const [content, setContent] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current
  const textInputRef = useRef<TextInput>(null)

  // 初始化內容與動畫
  useEffect(() => {
    if (isOpen) {
      // 初始化內容
      if (story?.content) {
        setContent(story.content)
      } else {
        setContent('')
      }
      setShowDeleteConfirm(false)

      // 滑入動畫
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // 動畫完成後聚焦輸入框
        setTimeout(() => {
          textInputRef.current?.focus()
        }, 100)
      })
    } else {
      // 滑出動畫
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }).start()
    }
  }, [isOpen, story, slideAnim])

  const handleSave = () => {
    if (content.trim()) {
      onSave(content)
    }
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete()
      setShowDeleteConfirm(false)
    }
  }

  const handleClose = () => {
    onClose()
  }

  const hasContent = !!story?.content?.trim()
  const hasChanges = content !== (story?.content || '')
  const canSave = content.trim().length > 0 && hasChanges

  // 寫作提示
  const writingTips = [
    '不用追求完美，想到什麼就寫什麼',
    '可以先寫幾句，之後再慢慢補充',
    '真實的故事最動人',
    '你的經驗對其他人可能很有幫助',
  ]
  const randomTip = writingTips[Math.floor(Math.random() * writingTips.length)]

  return (
    <Modal
      visible={isOpen}
      animationType="none"
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: 'white',
          transform: [{ translateY: slideAnim }],
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingTop: insets.top + 8,
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: COLORS.border.light,
              backgroundColor: 'white',
            }}
          >
            <Pressable
              onPress={handleClose}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <X size={20} color={COLORS.text.muted} />
              <Text fontSize={14} color={COLORS.text.muted}>
                取消
              </Text>
            </Pressable>

            <Text fontSize={14} fontWeight="500" color={SEMANTIC_COLORS.textMain}>
              編輯故事
            </Text>

            <Pressable
              onPress={handleSave}
              disabled={!canSave || isSaving}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                opacity: !canSave || isSaving ? 0.5 : pressed ? 0.7 : 1,
              })}
            >
              {isSaving ? (
                <Loader2 size={18} color={COLORS.brand.dark} />
              ) : (
                <Check size={18} color={canSave ? COLORS.brand.dark : COLORS.text.disabled} />
              )}
              <Text
                fontSize={14}
                fontWeight="500"
                color={canSave ? COLORS.brand.dark : COLORS.text.disabled}
              >
                {isSaving ? '儲存中' : '儲存'}
              </Text>
            </Pressable>
          </View>

          {/* Question Header */}
          {question && (
            <View
              style={{
                paddingHorizontal: 16,
                paddingVertical: 16,
                backgroundColor: COLORS.background.subtle,
                borderBottomWidth: 1,
                borderBottomColor: COLORS.border.light,
              }}
            >
              <Text fontSize={16} fontWeight="500" color={SEMANTIC_COLORS.textMain}>
                {question.title}
              </Text>
              {question.subtitle && (
                <XStack alignItems="flex-start" gap="$1" marginTop="$1">
                  <Lightbulb size={14} color={COLORS.text.muted} style={{ marginTop: 2 }} />
                  <Text fontSize={14} color={COLORS.text.muted} flex={1}>
                    {question.subtitle}
                  </Text>
                </XStack>
              )}
            </View>
          )}

          {/* Content Area */}
          <View style={{ flex: 1 }}>
            {/* Text Area */}
            <View style={{ flex: 1, padding: 16 }}>
              <TextInput
                ref={textInputRef}
                value={content}
                onChangeText={setContent}
                placeholder={question?.placeholder || '寫下你的故事...'}
                placeholderTextColor={COLORS.text.disabled}
                multiline
                textAlignVertical="top"
                maxLength={5000}
                style={{
                  flex: 1,
                  fontSize: 16,
                  lineHeight: 24,
                  color: SEMANTIC_COLORS.textMain,
                }}
              />
            </View>

            {/* Footer */}
            <View
              style={{
                paddingHorizontal: 16,
                paddingTop: 12,
                paddingBottom: insets.bottom + 12,
                borderTopWidth: 1,
                borderTopColor: COLORS.border.light,
                gap: 12,
              }}
            >
              {/* Character Count & Delete */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text fontSize={12} color={COLORS.text.muted}>
                  {content.length}/5000
                </Text>
                {hasContent && onDelete && (
                  <>
                    {showDeleteConfirm ? (
                      <XStack alignItems="center" gap="$2">
                        <Text fontSize={12} color={COLORS.text.muted}>
                          確定刪除？
                        </Text>
                        <Pressable onPress={handleDelete}>
                          <Text fontSize={12} fontWeight="500" color={COLORS.status.error}>
                            確定
                          </Text>
                        </Pressable>
                        <Pressable onPress={() => setShowDeleteConfirm(false)}>
                          <Text fontSize={12} color={COLORS.text.muted}>
                            取消
                          </Text>
                        </Pressable>
                      </XStack>
                    ) : (
                      <Pressable
                        onPress={() => setShowDeleteConfirm(true)}
                        style={({ pressed }) => ({
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                          opacity: pressed ? 0.7 : 1,
                        })}
                      >
                        <Trash2 size={14} color={COLORS.text.muted} />
                        <Text fontSize={12} color={COLORS.text.muted}>
                          刪除
                        </Text>
                      </Pressable>
                    )}
                  </>
                )}
              </View>

              {/* Writing Tip */}
              <View
                style={{
                  backgroundColor: `${COLORS.brand.accent}1A`,
                  borderRadius: 8,
                  padding: 12,
                }}
              >
                <XStack alignItems="center" gap="$1.5">
                  <Lightbulb size={14} color={SEMANTIC_COLORS.textSubtle} />
                  <Text fontSize={12} fontWeight="500" color={SEMANTIC_COLORS.textSubtle}>
                    寫作小提示：
                  </Text>
                  <Text fontSize={12} color={SEMANTIC_COLORS.textSubtle} flex={1}>
                    {randomTip}
                  </Text>
                </XStack>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  )
}

export default StoryEditFullscreen
