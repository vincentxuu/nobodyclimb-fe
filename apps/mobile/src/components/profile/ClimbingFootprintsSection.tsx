import React from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import { Text } from '../ui/Text'
import { Icon } from '../ui/Icon'
import { COLORS, SEMANTIC_COLORS } from '@nobodyclimb/constants'

interface ClimbingFootprintsSectionProps {
  isEditing: boolean
  isMobile?: boolean
}

export default function ClimbingFootprintsSection({
  isEditing,
}: ClimbingFootprintsSectionProps) {
  // TODO: 實作攀岩足跡功能
  return (
    <View style={styles.container}>
      <View style={styles.placeholder}>
        <Icon name="MapPin" size="lg" color={COLORS.gray[400]} />
        <Text
          variant="body"
          style={{ color: SEMANTIC_COLORS.textMuted, marginTop: 12, textAlign: 'center' }}
        >
          攀岩足跡功能開發中
        </Text>
        <Text
          variant="caption"
          style={{ color: SEMANTIC_COLORS.textMuted, marginTop: 4, textAlign: 'center' }}
        >
          記錄你去過的岩場和攀爬地點
        </Text>
        {isEditing && (
          <Pressable style={styles.addButton}>
            <Icon name="Plus" size="sm" color={SEMANTIC_COLORS.textMain} />
            <Text variant="body" style={{ color: SEMANTIC_COLORS.textMain, marginLeft: 8 }}>
              新增地點
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  placeholder: {
    padding: 32,
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderStyle: 'dashed',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: SEMANTIC_COLORS.textMain,
  },
})
