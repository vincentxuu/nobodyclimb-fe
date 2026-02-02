import React, { useState, useEffect, useMemo } from 'react'
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
import { X, Loader2, BookOpen, ChevronDown } from 'lucide-react-native'
import { SEMANTIC_COLORS, COLORS } from '@nobodyclimb/constants'
import type { StoryQuestion, StoryCategoryDefinition, ContentSource } from '@nobodyclimb/types'

interface AddCustomStoryModalProps {
  /** 是否開啟 */
  isOpen: boolean
  /** 關閉回調 */
  onClose: () => void
  /** 可選擇的分類列表 */
  categories: StoryCategoryDefinition[]
  /** 預設選擇的分類 ID */
  defaultCategoryId?: string
  /** 儲存回調 */
  onSave: (question: StoryQuestion) => void
  /** 是否正在儲存 */
  isSaving?: boolean
}

/**
 * 新增自訂故事問題 Modal
 *
 * 用於用戶新增自訂故事問題
 */
export function AddCustomStoryModal({
  isOpen,
  onClose,
  categories,
  defaultCategoryId,
  onSave,
  isSaving = false,
}: AddCustomStoryModalProps) {
  const insets = useSafeAreaInsets()
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [placeholder, setPlaceholder] = useState('')
  const [categoryId, setCategoryId] = useState(defaultCategoryId || '')
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)

  // 重置表單狀態
  useEffect(() => {
    if (isOpen) {
      setTitle('')
      setSubtitle('')
      setPlaceholder('')
      setCategoryId(defaultCategoryId || categories[0]?.id || '')
      setShowCategoryPicker(false)
    }
  }, [isOpen, defaultCategoryId, categories])

  const handleSave = () => {
    if (!title.trim() || !categoryId) return

    const newQuestion: StoryQuestion = {
      id: `usr_story_${Date.now()}`,
      source: 'user' as ContentSource,
      category_id: categoryId,
      title: title.trim().endsWith('？') ? title.trim() : `${title.trim()}？`,
      subtitle: subtitle.trim(),
      placeholder: placeholder.trim() || '寫下你的故事...',
      difficulty: 'easy',
      order: 999,
    }

    onSave(newQuestion)
  }

  const canSave = title.trim().length > 0 && categoryId
  const selectedCategory = categories.find((c) => c.id === categoryId)

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
                <BookOpen size={20} color={SEMANTIC_COLORS.textSubtle} />
                <Text fontSize={16} fontWeight="600" color={SEMANTIC_COLORS.textMain}>
                  新增故事問題
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
              {/* 問題標題 */}
              <YStack gap="$2">
                <Text fontSize={14} fontWeight="500" color={SEMANTIC_COLORS.textMain}>
                  問題標題 <Text color={COLORS.status.error}>*</Text>
                </Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="例如：有沒有印象深刻的攀岩經歷"
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

              {/* 問題說明 */}
              <YStack gap="$2">
                <Text fontSize={14} fontWeight="500" color={SEMANTIC_COLORS.textMain}>
                  問題說明{' '}
                  <Text fontSize={14} color={COLORS.text.muted}>
                    (選填)
                  </Text>
                </Text>
                <TextInput
                  value={subtitle}
                  onChangeText={setSubtitle}
                  placeholder="例如：不一定要很厲害，只要對你有意義"
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
                  幫助作答者理解問題
                </Text>
              </YStack>

              {/* 所屬分類 */}
              <YStack gap="$2">
                <Text fontSize={14} fontWeight="500" color={SEMANTIC_COLORS.textMain}>
                  所屬分類 <Text color={COLORS.status.error}>*</Text>
                </Text>
                <Pressable
                  onPress={() => setShowCategoryPicker(!showCategoryPicker)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderWidth: 1,
                    borderColor: COLORS.border.default,
                    borderRadius: 12,
                  }}
                >
                  <Text fontSize={16} color={SEMANTIC_COLORS.textMain}>
                    {selectedCategory?.name || '選擇分類'}
                  </Text>
                  <ChevronDown
                    size={20}
                    color={COLORS.text.muted}
                    style={{
                      transform: [{ rotate: showCategoryPicker ? '180deg' : '0deg' }],
                    }}
                  />
                </Pressable>
                {showCategoryPicker && (
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: COLORS.border.light,
                      borderRadius: 12,
                      overflow: 'hidden',
                    }}
                  >
                    {categories.map((cat) => (
                      <Pressable
                        key={cat.id}
                        onPress={() => {
                          setCategoryId(cat.id)
                          setShowCategoryPicker(false)
                        }}
                        style={({ pressed }) => ({
                          padding: 14,
                          backgroundColor:
                            cat.id === categoryId
                              ? COLORS.background.subtle
                              : pressed
                                ? COLORS.background.muted
                                : 'white',
                          borderBottomWidth: 1,
                          borderBottomColor: COLORS.border.light,
                        })}
                      >
                        <Text fontSize={16} color={SEMANTIC_COLORS.textMain}>
                          {cat.name}
                        </Text>
                        {cat.description && (
                          <Text fontSize={12} color={COLORS.text.muted} marginTop="$1">
                            {cat.description}
                          </Text>
                        )}
                      </Pressable>
                    ))}
                  </View>
                )}
              </YStack>

              {/* 範例答案 */}
              <YStack gap="$2">
                <Text fontSize={14} fontWeight="500" color={SEMANTIC_COLORS.textMain}>
                  範例開頭{' '}
                  <Text fontSize={14} color={COLORS.text.muted}>
                    (選填)
                  </Text>
                </Text>
                <TextInput
                  value={placeholder}
                  onChangeText={setPlaceholder}
                  placeholder="例如：記得有一次..."
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
              </YStack>

              {/* 預覽 */}
              {title.trim() && (
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
                    <Text fontSize={12} color={COLORS.text.muted}>
                      {selectedCategory?.name || '未分類'}
                    </Text>
                    <Text fontSize={16} fontWeight="500" color={SEMANTIC_COLORS.textMain}>
                      {title.trim().endsWith('？') ? title.trim() : `${title.trim()}？`}
                    </Text>
                    {subtitle.trim() && (
                      <Text fontSize={14} color={COLORS.text.muted}>
                        {subtitle.trim()}
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
                        {placeholder.trim() || '寫下你的故事...'}
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
                  故事問題適合需要深入分享的內容，可以寫長一點。
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

export default AddCustomStoryModal
