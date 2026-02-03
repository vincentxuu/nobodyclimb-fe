import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Input } from '../ui/Input'
import ProfileFormField from './ProfileFormField'
import ProfileTextDisplay from './ProfileTextDisplay'

interface BasicInfoSectionProps {
  name: string
  title: string
  isEditing: boolean
  isMobile?: boolean
  onChange: (field: string, value: string | boolean) => void
}

export default function BasicInfoSection({
  name,
  title,
  isEditing,
  onChange,
}: BasicInfoSectionProps) {
  return (
    <View style={styles.container}>
      <ProfileFormField label="暱稱">
        {isEditing ? (
          <Input
            value={name}
            onChangeText={(text) => onChange('name', text)}
            placeholder="輸入你的暱稱"
          />
        ) : (
          <ProfileTextDisplay text={name || '未設定'} />
        )}
      </ProfileFormField>
      <ProfileFormField label="一句話形容自己">
        {isEditing ? (
          <Input
            value={title}
            onChangeText={(text) => onChange('title', text)}
            placeholder="例如：抱石愛好者"
          />
        ) : (
          <ProfileTextDisplay text={title || '未設定'} />
        )}
      </ProfileFormField>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
})
