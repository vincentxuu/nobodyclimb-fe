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
import { X, Loader2, Tag, ChevronDown } from 'lucide-react-native'
import { SEMANTIC_COLORS, COLORS } from '@nobodyclimb/constants'
import type { TagDimension, TagOption, ContentSource } from '@nobodyclimb/types'

interface AddCustomTagModalProps {
  /** 是否開啟 */
  isOpen: boolean
  /** 關閉回調 */
  onClose: () => void
  /** 可選擇的維度列表 */
  dimensions: TagDimension[]
  /** 預設選擇的維度 ID */
  defaultDimensionId?: string
  /** 儲存回調 */
  onSave: (tag: TagOption) => void
  /** 是否正在儲存 */
  isSaving?: boolean
}

/**
 * 新增自訂標籤 Modal
 *
 * 用於用戶新增自訂標籤
 */
export function AddCustomTagModal({
  isOpen,
  onClose,
  dimensions,
  defaultDimensionId,
  onSave,
  isSaving = false,
}: AddCustomTagModalProps) {
  const insets = useSafeAreaInsets()
  const [label, setLabel] = useState('')
  const [description, setDescription] = useState('')
  const [dimensionId, setDimensionId] = useState(defaultDimensionId || '')
  const [showDimensionPicker, setShowDimensionPicker] = useState(false)

  // 重置表單狀態
  useEffect(() => {
    if (isOpen) {
      setLabel('')
      setDescription('')
      setDimensionId(defaultDimensionId || dimensions[0]?.id || '')
      setShowDimensionPicker(false)
    }
  }, [isOpen, defaultDimensionId, dimensions])

  const handleSave = () => {
    if (!label.trim() || !dimensionId) return

    const newTag: TagOption = {
      id: `usr_tag_${Date.now()}`,
      source: 'user' as ContentSource,
      dimension_id: dimensionId,
      label: label.trim().startsWith('#') ? label.trim() : `#${label.trim()}`,
      description: description.trim(),
      order: 999,
    }

    onSave(newTag)
  }

  const canSave = label.trim().length > 0 && dimensionId
  const selectedDimension = dimensions.find((d) => d.id === dimensionId)

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
                <Tag size={20} color={SEMANTIC_COLORS.textSubtle} />
                <Text fontSize={16} fontWeight="600" color={SEMANTIC_COLORS.textMain}>
                  新增自訂標籤
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
              {/* 標籤名稱 */}
              <YStack gap="$2">
                <Text fontSize={14} fontWeight="500" color={SEMANTIC_COLORS.textMain}>
                  標籤名稱 <Text color={COLORS.status.error}>*</Text>
                </Text>
                <TextInput
                  value={label}
                  onChangeText={setLabel}
                  placeholder="例如：深夜岩館族"
                  placeholderTextColor={COLORS.text.disabled}
                  maxLength={20}
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
                  會自動加上 # 符號，最多 20 字
                </Text>
              </YStack>

              {/* 標籤說明 */}
              <YStack gap="$2">
                <Text fontSize={14} fontWeight="500" color={SEMANTIC_COLORS.textMain}>
                  標籤說明{' '}
                  <Text fontSize={14} color={COLORS.text.muted}>
                    (選填)
                  </Text>
                </Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="例如：十點後才開始爬"
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
                  幫助其他人了解這個標籤，最多 50 字
                </Text>
              </YStack>

              {/* 所屬維度 */}
              <YStack gap="$2">
                <Text fontSize={14} fontWeight="500" color={SEMANTIC_COLORS.textMain}>
                  所屬類別 <Text color={COLORS.status.error}>*</Text>
                </Text>
                <Pressable
                  onPress={() => setShowDimensionPicker(!showDimensionPicker)}
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
                    {selectedDimension?.emoji} {selectedDimension?.name || '選擇類別'}
                  </Text>
                  <ChevronDown
                    size={20}
                    color={COLORS.text.muted}
                    style={{
                      transform: [{ rotate: showDimensionPicker ? '180deg' : '0deg' }],
                    }}
                  />
                </Pressable>
                {showDimensionPicker && (
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: COLORS.border.light,
                      borderRadius: 12,
                      overflow: 'hidden',
                    }}
                  >
                    {dimensions.map((dim) => (
                      <Pressable
                        key={dim.id}
                        onPress={() => {
                          setDimensionId(dim.id)
                          setShowDimensionPicker(false)
                        }}
                        style={({ pressed }) => ({
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                          padding: 14,
                          backgroundColor:
                            dim.id === dimensionId
                              ? COLORS.background.subtle
                              : pressed
                                ? COLORS.background.muted
                                : 'white',
                          borderBottomWidth: 1,
                          borderBottomColor: COLORS.border.light,
                        })}
                      >
                        <Text fontSize={16}>{dim.emoji}</Text>
                        <Text fontSize={16} color={SEMANTIC_COLORS.textMain}>
                          {dim.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </YStack>

              {/* 預覽 */}
              {label.trim() && (
                <View
                  style={{
                    backgroundColor: COLORS.background.subtle,
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <Text fontSize={14} color={COLORS.text.muted} marginBottom="$2">
                    預覽
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      backgroundColor: 'white',
                      borderWidth: 1,
                      borderColor: COLORS.border.light,
                      borderRadius: 20,
                      alignSelf: 'flex-start',
                    }}
                  >
                    <Text fontSize={14} fontWeight="500" color={SEMANTIC_COLORS.textMain}>
                      {label.trim().startsWith('#') ? label.trim() : `#${label.trim()}`}
                    </Text>
                  </View>
                  {description.trim() && (
                    <Text fontSize={12} color={COLORS.text.muted} marginTop="$2">
                      {description.trim()}
                    </Text>
                  )}
                </View>
              )}
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
                  {isSaving ? '新增中...' : '新增標籤'}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

export default AddCustomTagModal
