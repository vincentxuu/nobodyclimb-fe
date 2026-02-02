import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Button } from '../ui/Button'

interface ProfileActionButtonsProps {
  onCancel: () => void
  onSave: () => Promise<void>
  isMobile?: boolean
  isLoading: boolean
}

export default function ProfileActionButtons({
  onCancel,
  onSave,
  isLoading,
}: ProfileActionButtonsProps) {
  return (
    <View style={styles.container}>
      <Button
        variant="secondary"
        onPress={onCancel}
        disabled={isLoading}
        style={styles.button}
      >
        取消
      </Button>
      <Button
        variant="primary"
        onPress={onSave}
        loading={isLoading}
        style={styles.button}
      >
        儲存變更
      </Button>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
  },
  button: {
    flex: 1,
  },
})
