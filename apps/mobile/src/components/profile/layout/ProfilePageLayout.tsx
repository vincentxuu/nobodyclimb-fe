import React from 'react'
import { View, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ProfileProvider } from '../ProfileContext'
import { MobileNavProvider } from '../MobileNavContext'
import { COLORS } from '@nobodyclimb/constants'

interface ProfilePageLayoutProps {
  children: React.ReactNode
  showNav?: boolean
}

export default function ProfilePageLayout({
  children,
  showNav = false,
}: ProfilePageLayoutProps) {
  const insets = useSafeAreaInsets()

  return (
    <ProfileProvider>
      <MobileNavProvider>
        <View
          style={[
            styles.container,
            {
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
            },
          ]}
        >
          {children}
        </View>
      </MobileNavProvider>
    </ProfileProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
})
