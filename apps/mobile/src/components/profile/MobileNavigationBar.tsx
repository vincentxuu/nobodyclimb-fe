import React from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import { Text } from '../ui/Text'
import { Icon } from '../ui/Icon'
import { SEMANTIC_COLORS, WB_COLORS } from '@nobodyclimb/constants'

interface MobileNavigationBarProps {
  title: string
  showBackButton?: boolean
  rightAction?: React.ReactNode
}

export default function MobileNavigationBar({
  title,
  showBackButton = true,
  rightAction,
}: MobileNavigationBarProps) {
  const router = useRouter()

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {showBackButton && (
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={8}
          >
            <Icon icon={ArrowLeft} size="md" color={SEMANTIC_COLORS.textMain} />
          </Pressable>
        )}
      </View>

      <View style={styles.centerSection}>
        <Text variant="bodyBold" style={{ color: SEMANTIC_COLORS.textMain }}>
          {title}
        </Text>
      </View>

      <View style={styles.rightSection}>{rightAction}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: WB_COLORS[0],
    borderBottomWidth: 1,
    borderBottomColor: WB_COLORS[20],
  },
  leftSection: {
    width: 48,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  rightSection: {
    width: 48,
    alignItems: 'flex-end',
  },
  backButton: {
    padding: 4,
  },
})
