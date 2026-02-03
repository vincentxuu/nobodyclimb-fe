import React from 'react'
import { View, StyleSheet } from 'react-native'
import { TextArea } from '../ui/TextArea'
import ProfileFormField from './ProfileFormField'
import ProfileTextDisplay from './ProfileTextDisplay'

interface ClimbingExperienceSectionProps {
  climbingReason: string
  climbingMeaning: string
  adviceForBeginners: string
  isEditing: boolean
  isMobile?: boolean
  onChange: (field: string, value: string | boolean) => void
}

export default function ClimbingExperienceSection({
  climbingReason,
  climbingMeaning,
  adviceForBeginners,
  isEditing,
  onChange,
}: ClimbingExperienceSectionProps) {
  return (
    <View style={styles.container}>
      <ProfileFormField label="你與攀岩的相遇">
        {isEditing ? (
          <TextArea
            value={climbingReason}
            onChangeText={(text) => onChange('climbingReason', text)}
            placeholder="描述你是如何開始攀岩的..."
            minHeight={120}
          />
        ) : (
          <ProfileTextDisplay
            text={climbingReason || '未設定'}
            minHeight={80}
          />
        )}
      </ProfileFormField>
      <ProfileFormField label="攀岩對你來說是什麼">
        {isEditing ? (
          <TextArea
            value={climbingMeaning}
            onChangeText={(text) => onChange('climbingMeaning', text)}
            placeholder="攀岩在你生活中扮演什麼角色..."
            minHeight={120}
          />
        ) : (
          <ProfileTextDisplay
            text={climbingMeaning || '未設定'}
            minHeight={80}
          />
        )}
      </ProfileFormField>
      <ProfileFormField label="給剛開始攀岩的自己">
        {isEditing ? (
          <TextArea
            value={adviceForBeginners}
            onChangeText={(text) => onChange('adviceForBeginners', text)}
            placeholder="如果能對剛開始攀岩的自己說一句話..."
            minHeight={120}
          />
        ) : (
          <ProfileTextDisplay
            text={adviceForBeginners || '未設定'}
            minHeight={80}
          />
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
