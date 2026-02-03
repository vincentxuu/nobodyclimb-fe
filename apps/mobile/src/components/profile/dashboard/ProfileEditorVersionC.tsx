import React from 'react'
import { View, StyleSheet } from 'react-native'
import ProfileDashboard from './ProfileDashboard'
import { ProfileProvider } from '../ProfileContext'
import { COLORS } from '@nobodyclimb/constants'

/**
 * ProfileEditorVersionC - 卡片版編輯器
 * 使用 Dashboard 卡片式介面，點擊卡片開啟編輯面板
 */
export default function ProfileEditorVersionC() {
  return (
    <ProfileProvider>
      <View style={styles.container}>
        <ProfileDashboard />
      </View>
    </ProfileProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
})
