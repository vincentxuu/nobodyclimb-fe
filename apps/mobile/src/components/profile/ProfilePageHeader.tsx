import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Text } from '../ui/Text'
import { Button } from '../ui/Button'
import { SEMANTIC_COLORS } from '@nobodyclimb/constants'

interface ProfilePageHeaderProps {
  title: string
  isEditing: boolean
  onEdit: () => void
  isMobile?: boolean
}

export default function ProfilePageHeader({
  title,
  isEditing,
  onEdit,
}: ProfilePageHeaderProps) {
  return (
    <View style={styles.container}>
      <Text variant="h2" style={{ color: SEMANTIC_COLORS.textMain }}>
        {title}
      </Text>
      {!isEditing && (
        <Button
          variant="secondary"
          size="sm"
          onPress={onEdit}
        >
          編輯資料
        </Button>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
})
