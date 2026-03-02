/**
 * 富文字編輯器
 *
 * 對應 apps/web/src/components/editor/RichTextEditor.tsx
 * React Native 版本使用簡化的實現
 */
import React, { useState, useRef, useCallback } from 'react'
import {
  StyleSheet,
  View,
  TextInput,
  ScrollView,
  Pressable,
  Platform,
  KeyboardAvoidingView,
} from 'react-native'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Link,
  Image,
} from 'lucide-react-native'

import { Text } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: number
  maxHeight?: number
  onImageInsert?: () => void
}

interface ToolbarButtonProps {
  icon: React.ReactNode
  onPress: () => void
  active?: boolean
  disabled?: boolean
}

function ToolbarButton({ icon, onPress, active = false, disabled = false }: ToolbarButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.toolbarButton,
        active && styles.toolbarButtonActive,
        pressed && styles.toolbarButtonPressed,
        disabled && styles.toolbarButtonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {icon}
    </Pressable>
  )
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = '開始寫作...',
  minHeight = 200,
  maxHeight = 400,
  onImageInsert,
}: RichTextEditorProps) {
  const inputRef = useRef<TextInput>(null)
  const [selection, setSelection] = useState({ start: 0, end: 0 })

  // 插入 Markdown 格式
  const insertMarkdown = useCallback(
    (prefix: string, suffix: string = '') => {
      const { start, end } = selection
      const selectedText = value.substring(start, end)
      const beforeText = value.substring(0, start)
      const afterText = value.substring(end)

      if (selectedText) {
        // 如果有選取文字，包裹它
        const newText = `${beforeText}${prefix}${selectedText}${suffix}${afterText}`
        onChange(newText)
      } else {
        // 沒有選取文字，直接插入
        const newText = `${beforeText}${prefix}${suffix}${afterText}`
        onChange(newText)
        // 將游標移到前綴後面
        setTimeout(() => {
          inputRef.current?.setNativeProps({
            selection: { start: start + prefix.length, end: start + prefix.length },
          })
        }, 0)
      }
    },
    [value, selection, onChange]
  )

  const handleBold = () => insertMarkdown('**', '**')
  const handleItalic = () => insertMarkdown('*', '*')
  const handleH1 = () => insertMarkdown('\n# ', '\n')
  const handleH2 = () => insertMarkdown('\n## ', '\n')
  const handleList = () => insertMarkdown('\n- ')
  const handleOrderedList = () => insertMarkdown('\n1. ')
  const handleQuote = () => insertMarkdown('\n> ')
  const handleLink = () => insertMarkdown('[', '](url)')

  const handleImagePress = () => {
    if (onImageInsert) {
      onImageInsert()
    } else {
      insertMarkdown('![alt](', ')')
    }
  }

  const handleSelectionChange = (event: { nativeEvent: { selection: { start: number; end: number } } }) => {
    setSelection(event.nativeEvent.selection)
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* 工具欄 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.toolbar}
        style={styles.toolbarContainer}
      >
        <ToolbarButton
          icon={<Bold size={18} color={SEMANTIC_COLORS.textMain} />}
          onPress={handleBold}
        />
        <ToolbarButton
          icon={<Italic size={18} color={SEMANTIC_COLORS.textMain} />}
          onPress={handleItalic}
        />
        <View style={styles.toolbarDivider} />
        <ToolbarButton
          icon={<Heading1 size={18} color={SEMANTIC_COLORS.textMain} />}
          onPress={handleH1}
        />
        <ToolbarButton
          icon={<Heading2 size={18} color={SEMANTIC_COLORS.textMain} />}
          onPress={handleH2}
        />
        <View style={styles.toolbarDivider} />
        <ToolbarButton
          icon={<List size={18} color={SEMANTIC_COLORS.textMain} />}
          onPress={handleList}
        />
        <ToolbarButton
          icon={<ListOrdered size={18} color={SEMANTIC_COLORS.textMain} />}
          onPress={handleOrderedList}
        />
        <ToolbarButton
          icon={<Quote size={18} color={SEMANTIC_COLORS.textMain} />}
          onPress={handleQuote}
        />
        <View style={styles.toolbarDivider} />
        <ToolbarButton
          icon={<Link size={18} color={SEMANTIC_COLORS.textMain} />}
          onPress={handleLink}
        />
        <ToolbarButton
          icon={<Image size={18} color={SEMANTIC_COLORS.textMain} />}
          onPress={handleImagePress}
        />
      </ScrollView>

      {/* 編輯區 */}
      <TextInput
        ref={inputRef}
        style={[
          styles.editor,
          { minHeight, maxHeight },
        ]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={SEMANTIC_COLORS.textMuted}
        multiline
        textAlignVertical="top"
        onSelectionChange={handleSelectionChange}
      />

      {/* 字數統計 */}
      <View style={styles.footer}>
        <Text variant="small" color="textMuted">
          {value.length} 字
        </Text>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  toolbarContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs,
    gap: 2,
  },
  toolbarButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.sm,
  },
  toolbarButtonActive: {
    backgroundColor: '#F0F0F0',
  },
  toolbarButtonPressed: {
    backgroundColor: '#E0E0E0',
  },
  toolbarButtonDisabled: {
    opacity: 0.5,
  },
  toolbarDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E0E0E0',
    marginHorizontal: SPACING.xs,
  },
  editor: {
    padding: SPACING.md,
    fontSize: 16,
    lineHeight: 24,
    color: SEMANTIC_COLORS.textMain,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
})
