import { COLORS, SEMANTIC_COLORS } from '@nobodyclimb/constants'
import type { ContentSource, TagDimension } from '@nobodyclimb/types'
import { Layers, Loader2, X } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text, XStack, YStack } from 'tamagui'

// 常用 emoji 選項
const EMOJI_OPTIONS = [
  '🎯',
  '🎨',
  '🎸',
  '🎮',
  '🏆',
  '🌟',
  '💡',
  '🔥',
  '🌈',
  '🎭',
  '🎪',
  '🎬',
  '📚',
  '🎤',
  '🎹',
  '🎻',
  '🏋️',
  '🧗',
  '🚴',
  '🏃',
  '⛷️',
  '🏄',
  '🧘',
  '🤸',
  '🍕',
  '🍜',
  '🍵',
  '🍺',
  '☕',
  '🥤',
  '🧋',
  '🍦',
]

interface AddCustomDimensionModalProps {
  /** 是否開啟 */
  isOpen: boolean
  /** 關閉回調 */
  onClose: () => void
  /** 儲存回調 */
  onSave: (dimension: TagDimension) => void
  /** 是否正在儲存 */
  isSaving?: boolean
}

/**
 * 新增自訂標籤維度 Modal
 *
 * 用於用戶新增自訂標籤類別
 */
export function AddCustomDimensionModal({
  isOpen,
  onClose,
  onSave,
  isSaving = false,
}: AddCustomDimensionModalProps) {
  const insets = useSafeAreaInsets()
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🎯')
  const [description, setDescription] = useState('')
  const [selectionMode, setSelectionMode] = useState<'single' | 'multiple'>('multiple')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  // 重置表單狀態
  useEffect(() => {
    if (isOpen) {
      setName('')
      setEmoji('🎯')
      setDescription('')
      setSelectionMode('multiple')
      setShowEmojiPicker(false)
    }
  }, [isOpen])

  const handleSave = () => {
    if (!name.trim()) return

    const newDimension: TagDimension = {
      id: `usr_dim_${Date.now()}`,
      source: 'user' as ContentSource,
      name: name.trim(),
      emoji,
      icon: 'Tag', // 用戶自訂維度使用預設 icon
      description: description.trim(),
      selection_mode: selectionMode,
      options: [],
      order: 999,
      is_active: true,
    }

    onSave(newDimension)
  }

  const canSave = name.trim().length > 0

  if (!isOpen) return null

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
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
                <Layers size={20} color={SEMANTIC_COLORS.textSubtle} />
                <Text fontSize={16} fontWeight="600" color={SEMANTIC_COLORS.textMain}>
                  新增標籤類別
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
              {/* Emoji 選擇 */}
              <YStack gap="$2">
                <Text fontSize={14} fontWeight="500" color={SEMANTIC_COLORS.textMain}>
                  圖示
                </Text>
                <Pressable
                  onPress={() => setShowEmojiPicker(!showEmojiPicker)}
                  style={{
                    width: 64,
                    height: 64,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: COLORS.background.subtle,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: COLORS.border.light,
                  }}
                >
                  <Text fontSize={32}>{emoji}</Text>
                </Pressable>

                {/* Emoji Picker */}
                {showEmojiPicker && (
                  <View
                    style={{
                      padding: 12,
                      backgroundColor: 'white',
                      borderWidth: 1,
                      borderColor: COLORS.border.light,
                      borderRadius: 12,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        gap: 4,
                      }}
                    >
                      {EMOJI_OPTIONS.map((e) => (
                        <Pressable
                          key={e}
                          onPress={() => {
                            setEmoji(e)
                            setShowEmojiPicker(false)
                          }}
                          style={({ pressed }) => ({
                            width: 40,
                            height: 40,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 8,
                            backgroundColor:
                              emoji === e
                                ? `${COLORS.brand.accent}33`
                                : pressed
                                  ? COLORS.background.subtle
                                  : 'transparent',
                          })}
                        >
                          <Text fontSize={24}>{e}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}
              </YStack>

              {/* 維度名稱 */}
              <YStack gap="$2">
                <Text fontSize={14} fontWeight="500" color={SEMANTIC_COLORS.textMain}>
                  類別名稱 <Text color={COLORS.status.error}>*</Text>
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="例如：裝備偏好"
                  placeholderTextColor={COLORS.text.disabled}
                  maxLength={10}
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
                  最多 10 字
                </Text>
              </YStack>

              {/* 維度說明 */}
              <YStack gap="$2">
                <Text fontSize={14} fontWeight="500" color={SEMANTIC_COLORS.textMain}>
                  類別說明{' '}
                  <Text fontSize={14} color={COLORS.text.muted}>
                    (選填)
                  </Text>
                </Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="例如：你喜歡什麼裝備？"
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
              </YStack>

              {/* 選擇模式 */}
              <YStack gap="$2">
                <Text fontSize={14} fontWeight="500" color={SEMANTIC_COLORS.textMain}>
                  選擇模式
                </Text>
                <XStack gap="$3">
                  <Pressable
                    onPress={() => setSelectionMode('single')}
                    style={{
                      flex: 1,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor:
                        selectionMode === 'single' ? COLORS.brand.dark : COLORS.border.light,
                      backgroundColor:
                        selectionMode === 'single' ? `${COLORS.brand.accent}1A` : 'white',
                    }}
                  >
                    <Text fontSize={16} fontWeight="500" color={SEMANTIC_COLORS.textMain}>
                      單選
                    </Text>
                    <Text fontSize={12} color={COLORS.text.muted} marginTop="$1">
                      只能選一個標籤
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setSelectionMode('multiple')}
                    style={{
                      flex: 1,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor:
                        selectionMode === 'multiple' ? COLORS.brand.dark : COLORS.border.light,
                      backgroundColor:
                        selectionMode === 'multiple' ? `${COLORS.brand.accent}1A` : 'white',
                    }}
                  >
                    <Text fontSize={16} fontWeight="500" color={SEMANTIC_COLORS.textMain}>
                      複選
                    </Text>
                    <Text fontSize={12} color={COLORS.text.muted} marginTop="$1">
                      可以選多個標籤
                    </Text>
                  </Pressable>
                </XStack>
              </YStack>

              {/* 預覽 */}
              {name.trim() && (
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
                  <XStack alignItems="center" gap="$2">
                    <Text fontSize={20}>{emoji}</Text>
                    <Text fontSize={16} fontWeight="500" color={SEMANTIC_COLORS.textMain}>
                      {name.trim()}
                    </Text>
                    <View
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        backgroundColor: 'white',
                        borderRadius: 12,
                      }}
                    >
                      <Text fontSize={12} color={COLORS.text.muted}>
                        {selectionMode === 'single' ? '單選' : '可複選'}
                      </Text>
                    </View>
                  </XStack>
                  {description.trim() && (
                    <Text fontSize={12} color={COLORS.text.muted} marginTop="$2">
                      {description.trim()}
                    </Text>
                  )}
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
                  建立類別後，你可以在裡面新增自訂標籤。
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
                  {isSaving ? '建立中...' : '建立類別'}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

export default AddCustomDimensionModal
