/**
 * SearchInput 組件
 *
 * 搜尋輸入框，與 apps/web/src/components/ui/search-input.tsx 對應
 */
import React, { useCallback } from 'react'
import { StyleSheet, TextInput, View, Pressable } from 'react-native'
import { Search, X } from 'lucide-react-native'
import { SEMANTIC_COLORS, FONT_SIZE, SPACING } from '@nobodyclimb/constants'

export interface SearchInputProps {
  /** 輸入值 */
  value: string
  /** 值變化時的回調 */
  onChangeText: (text: string) => void
  /** 佔位符文字 */
  placeholder?: string
  /** 是否自動聚焦 */
  autoFocus?: boolean
  /** 搜尋提交時的回調 */
  onSubmit?: () => void
  /** 是否顯示清除按鈕 */
  showClearButton?: boolean
  /** 是否禁用 */
  disabled?: boolean
}

export function SearchInput({
  value,
  onChangeText,
  placeholder = '搜尋...',
  autoFocus = false,
  onSubmit,
  showClearButton = true,
  disabled = false,
}: SearchInputProps) {
  const handleClear = useCallback(() => {
    onChangeText('')
  }, [onChangeText])

  const handleSubmit = useCallback(() => {
    onSubmit?.()
  }, [onSubmit])

  return (
    <View style={[styles.container, disabled && styles.containerDisabled]}>
      <Search
        size={20}
        color={SEMANTIC_COLORS.textMain}
        style={styles.searchIcon}
      />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={SEMANTIC_COLORS.textSubtle}
        autoFocus={autoFocus}
        onSubmitEditing={handleSubmit}
        returnKeyType="search"
        editable={!disabled}
      />
      {showClearButton && value.length > 0 && (
        <Pressable
          onPress={handleClear}
          style={styles.clearButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={16} color={SEMANTIC_COLORS.textSubtle} />
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: SEMANTIC_COLORS.textMain,
    borderRadius: 4,
    height: 40,
    paddingHorizontal: SPACING.sm,
  },
  containerDisabled: {
    opacity: 0.5,
  },
  searchIcon: {
    marginRight: SPACING.xs,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZE.base,
    color: SEMANTIC_COLORS.textMain,
    fontWeight: '300',
    padding: 0,
  },
  clearButton: {
    marginLeft: SPACING.xs,
    padding: 4,
  },
})
