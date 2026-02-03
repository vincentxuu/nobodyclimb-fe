import React from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import { Text } from '../../ui/Text'
import { Icon } from '../../ui/Icon'
import { ImageLayout } from '../types'
import { COLORS, SEMANTIC_COLORS } from '@nobodyclimb/constants'

interface LayoutSelectorProps {
  value: ImageLayout
  onChange: (layout: ImageLayout) => void
}

const LAYOUTS: { id: ImageLayout; label: string; icon: string }[] = [
  { id: 'single', label: '單張', icon: 'Square' },
  { id: 'double', label: '雙欄', icon: 'LayoutGrid' },
  { id: 'grid', label: '網格', icon: 'Grid3x3' },
]

export default function LayoutSelector({
  value,
  onChange,
}: LayoutSelectorProps) {
  return (
    <View style={styles.container}>
      <Text variant="caption" style={{ color: SEMANTIC_COLORS.textMuted, marginBottom: 8 }}>
        排版方式
      </Text>
      <View style={styles.options}>
        {LAYOUTS.map((layout) => {
          const isSelected = value === layout.id
          return (
            <Pressable
              key={layout.id}
              onPress={() => onChange(layout.id)}
              style={[styles.option, isSelected && styles.optionSelected]}
            >
              <Icon
                name={layout.icon as any}
                size="sm"
                color={isSelected ? COLORS.white : SEMANTIC_COLORS.textSubtle}
              />
              <Text
                variant="caption"
                style={{
                  color: isSelected ? COLORS.white : SEMANTIC_COLORS.textSubtle,
                  marginTop: 4,
                }}
              >
                {layout.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  options: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: COLORS.gray[100],
    alignItems: 'center',
  },
  optionSelected: {
    backgroundColor: SEMANTIC_COLORS.textMain,
  },
})
