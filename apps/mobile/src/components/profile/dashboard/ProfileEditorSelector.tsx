import React from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import { Text } from '../../ui/Text'
import { COLORS, SEMANTIC_COLORS } from '@nobodyclimb/constants'

export type EditorVersion = 'A' | 'B' | 'C'

interface ProfileEditorSelectorProps {
  selectedVersion: EditorVersion
  onSelect: (version: EditorVersion) => void
}

const VERSIONS: { id: EditorVersion; label: string; description: string }[] = [
  { id: 'A', label: '標準版', description: '完整的個人資料編輯器' },
  { id: 'B', label: '精簡版', description: '快速編輯核心資訊' },
  { id: 'C', label: '卡片版', description: '卡片式 Dashboard 編輯' },
]

export default function ProfileEditorSelector({
  selectedVersion,
  onSelect,
}: ProfileEditorSelectorProps) {
  return (
    <View style={styles.container}>
      <Text variant="bodyBold" style={{ color: SEMANTIC_COLORS.textMain, marginBottom: 12 }}>
        選擇編輯器版本
      </Text>
      <View style={styles.options}>
        {VERSIONS.map((version) => {
          const isSelected = selectedVersion === version.id
          return (
            <Pressable
              key={version.id}
              onPress={() => onSelect(version.id)}
              style={[styles.option, isSelected && styles.optionSelected]}
            >
              <View style={styles.optionContent}>
                <View
                  style={[
                    styles.radio,
                    isSelected && styles.radioSelected,
                  ]}
                >
                  {isSelected && <View style={styles.radioInner} />}
                </View>
                <View style={styles.optionText}>
                  <Text
                    variant="body"
                    style={{ color: SEMANTIC_COLORS.textMain }}
                  >
                    {version.label}
                  </Text>
                  <Text
                    variant="caption"
                    style={{ color: SEMANTIC_COLORS.textMuted, marginTop: 2 }}
                  >
                    {version.description}
                  </Text>
                </View>
              </View>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  options: {
    gap: 8,
  },
  option: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    backgroundColor: COLORS.white,
  },
  optionSelected: {
    borderColor: SEMANTIC_COLORS.textMain,
    backgroundColor: COLORS.gray[50],
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: SEMANTIC_COLORS.textMain,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: SEMANTIC_COLORS.textMain,
  },
  optionText: {
    flex: 1,
  },
})
