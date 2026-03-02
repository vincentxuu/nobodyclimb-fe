import React from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import { Text } from '../ui/Text'
import { COLORS, SEMANTIC_COLORS } from '@nobodyclimb/constants'

const ROUTE_TYPES = [
  { id: 'boulder', label: '抱石' },
  { id: 'sport', label: '運動攀登' },
  { id: 'trad', label: '傳統攀登' },
  { id: 'mixed', label: '混合' },
]

interface RouteTypeSelectorProps {
  value: string
  onChange: (value: string) => void
}

export default function RouteTypeSelector({
  value,
  onChange,
}: RouteTypeSelectorProps) {
  // 解析當前選中的類型
  const selectedTypes = value
    ? value.split(',').map((t) => t.trim())
    : []

  const toggleType = (typeId: string) => {
    const isSelected = selectedTypes.includes(typeId)
    let newTypes: string[]

    if (isSelected) {
      newTypes = selectedTypes.filter((t) => t !== typeId)
    } else {
      newTypes = [...selectedTypes, typeId]
    }

    onChange(newTypes.join(', '))
  }

  return (
    <View style={styles.container}>
      {ROUTE_TYPES.map((type) => {
        const isSelected = selectedTypes.includes(type.id)
        return (
          <Pressable
            key={type.id}
            onPress={() => toggleType(type.id)}
            style={[
              styles.chip,
              isSelected && styles.chipSelected,
            ]}
          >
            <Text
              variant="body"
              style={[
                styles.chipText,
                isSelected && styles.chipTextSelected,
              ]}
            >
              {type.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    backgroundColor: COLORS.white,
  },
  chipSelected: {
    backgroundColor: SEMANTIC_COLORS.textMain,
    borderColor: SEMANTIC_COLORS.textMain,
  },
  chipText: {
    color: SEMANTIC_COLORS.textMain,
  },
  chipTextSelected: {
    color: COLORS.white,
  },
})
