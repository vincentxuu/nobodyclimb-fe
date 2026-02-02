import React from 'react'
import { View, StyleSheet } from 'react-native'
import ProfileContainer from '../ProfileContainer'
import { ProfileProvider } from '../ProfileContext'
import { COLORS } from '@nobodyclimb/constants'

/**
 * ProfileEditorVersionA - 標準版編輯器
 * 完整的個人資料編輯器，所有欄位以滾動列表形式展示
 */
export default function ProfileEditorVersionA() {
  return (
    <ProfileProvider>
      <View style={styles.container}>
        <ProfileContainer />
      </View>
    </ProfileProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
})
