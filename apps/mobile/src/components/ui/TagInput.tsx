/**
 * TagInput 組件
 *
 * 多標籤輸入，與 apps/web/src/components/ui/tag-input.tsx 對應
 */
import React, { useCallback, useState } from 'react'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'
import { X, Plus } from 'lucide-react-native'
import { XStack, YStack } from 'tamagui'
import { SEMANTIC_COLORS, FONT_SIZE, SPACING, RADIUS } from '@nobodyclimb/constants'
import { Text } from './Text'

export interface TagInputProps {
  /** 標籤列表 */
  tags: string[]
  /** 標籤變化時的回調 */
  onTagsChange: (tags: string[]) => void
  /** 佔位符文字 */
  placeholder?: string
  /** 最大標籤數量 */
  maxTags?: number
  /** 是否禁用 */
  disabled?: boolean
  /** 標籤樣式 */
  tagStyle?: 'default' | 'outline'
}

export function TagInput({
  tags,
  onTagsChange,
  placeholder = '輸入標籤後按 Enter',
  maxTags = 10,
  disabled = false,
  tagStyle = 'default',
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('')

  const handleAddTag = useCallback(() => {
    const trimmedValue = inputValue.trim()
    if (
      trimmedValue &&
      !tags.includes(trimmedValue) &&
      tags.length < maxTags
    ) {
      onTagsChange([...tags, trimmedValue])
      setInputValue('')
    }
  }, [inputValue, tags, maxTags, onTagsChange])

  const handleRemoveTag = useCallback(
    (tagToRemove: string) => {
      onTagsChange(tags.filter((tag) => tag !== tagToRemove))
    },
    [tags, onTagsChange]
  )

  const handleSubmit = useCallback(() => {
    handleAddTag()
  }, [handleAddTag])

  const canAddMore = tags.length < maxTags

  return (
    <YStack gap={SPACING.sm}>
      {/* 標籤列表 */}
      {tags.length > 0 && (
        <XStack flexWrap="wrap" gap={SPACING.xs}>
          {tags.map((tag) => (
            <View
              key={tag}
              style={[
                styles.tag,
                tagStyle === 'outline' && styles.tagOutline,
              ]}
            >
              <Text
                variant="small"
                color={tagStyle === 'outline' ? 'textMain' : 'textMain'}
                style={styles.tagText}
              >
                {tag}
              </Text>
              {!disabled && (
                <Pressable
                  onPress={() => handleRemoveTag(tag)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.removeButton}
                >
                  <X
                    size={14}
                    color={
                      tagStyle === 'outline'
                        ? SEMANTIC_COLORS.textSubtle
                        : SEMANTIC_COLORS.textSubtle
                    }
                  />
                </Pressable>
              )}
            </View>
          ))}
        </XStack>
      )}

      {/* 輸入框 */}
      {canAddMore && !disabled && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputValue}
            onChangeText={setInputValue}
            placeholder={placeholder}
            placeholderTextColor={SEMANTIC_COLORS.textMuted}
            onSubmitEditing={handleSubmit}
            returnKeyType="done"
            editable={!disabled}
          />
          {inputValue.trim() && (
            <Pressable
              onPress={handleAddTag}
              style={styles.addButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Plus size={20} color={SEMANTIC_COLORS.textMain} />
            </Pressable>
          )}
        </View>
      )}

      {/* 剩餘數量提示 */}
      {maxTags && (
        <Text variant="caption" color="textMuted">
          {tags.length}/{maxTags} 個標籤
        </Text>
      )}
    </YStack>
  )
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  tagOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: SEMANTIC_COLORS.textMain,
  },
  tagText: {
    marginRight: 4,
  },
  removeButton: {
    marginLeft: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    height: 40,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: SEMANTIC_COLORS.textMain,
    padding: 0,
  },
  addButton: {
    marginLeft: SPACING.xs,
    padding: 4,
  },
})
