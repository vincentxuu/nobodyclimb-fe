import React from 'react'
import { View, StyleSheet } from 'react-native'
import { COLORS } from '@nobodyclimb/constants'

interface ProfileDividerProps {
  marginVertical?: number
}

export default function ProfileDivider({ marginVertical = 16 }: ProfileDividerProps) {
  return (
    <View
      style={[
        styles.divider,
        { marginVertical },
      ]}
    />
  )
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: COLORS.gray[200],
    width: '100%',
  },
})
