/**
 * SearchBar 組件
 *
 * 搜尋欄，對應 apps/web/src/components/layout/navbar/SearchBar.tsx
 */
import React, { useState, useCallback } from 'react'
import { StyleSheet, View, TextInput, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { Search, X } from 'lucide-react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

import { SEMANTIC_COLORS, SPACING, RADIUS, FONT_SIZE } from '@nobodyclimb/constants'

interface SearchBarProps {
  /** 初始搜尋值 */
  initialValue?: string
  /** 佔位符文字 */
  placeholder?: string
  /** 是否自動展開 */
  autoExpand?: boolean
  /** 搜尋提交時的回調 */
  onSearch?: (query: string) => void
}

export function SearchBar({
  initialValue = '',
  placeholder = '搜尋...',
  autoExpand = false,
  onSearch,
}: SearchBarProps) {
  const router = useRouter()
  const [query, setQuery] = useState(initialValue)
  const [isFocused, setIsFocused] = useState(autoExpand)

  const inputWidth = useSharedValue(autoExpand ? 200 : 40)

  const containerStyle = useAnimatedStyle(() => ({
    width: inputWidth.value,
  }))

  // 展開搜尋框
  const handleExpand = useCallback(() => {
    setIsFocused(true)
    inputWidth.value = withTiming(200, { duration: 200 })
  }, [inputWidth])

  // 收起搜尋框
  const handleCollapse = useCallback(() => {
    if (!query) {
      setIsFocused(false)
      inputWidth.value = withTiming(40, { duration: 200 })
    }
  }, [query, inputWidth])

  // 清除搜尋
  const handleClear = useCallback(() => {
    setQuery('')
  }, [])

  // 提交搜尋
  const handleSubmit = useCallback(() => {
    if (query.trim()) {
      if (onSearch) {
        onSearch(query.trim())
      } else {
        router.push(`/search?q=${encodeURIComponent(query.trim())}` as any)
      }
    }
  }, [query, onSearch, router])

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Pressable
        onPress={!isFocused ? handleExpand : undefined}
        style={styles.iconContainer}
      >
        <Search size={20} color={SEMANTIC_COLORS.textMain} />
      </Pressable>

      {isFocused && (
        <>
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder={placeholder}
            placeholderTextColor={SEMANTIC_COLORS.textMuted}
            onFocus={handleExpand}
            onBlur={handleCollapse}
            onSubmitEditing={handleSubmit}
            returnKeyType="search"
            autoFocus={autoExpand}
          />

          {query.length > 0 && (
            <Pressable
              onPress={handleClear}
              style={styles.clearButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={16} color={SEMANTIC_COLORS.textMuted} />
            </Pressable>
          )}
        </>
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: RADIUS.md,
    height: 40,
    paddingHorizontal: SPACING.sm,
    overflow: 'hidden',
  },
  iconContainer: {
    padding: 2,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: SEMANTIC_COLORS.textMain,
    marginLeft: SPACING.xs,
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
})

export default SearchBar
