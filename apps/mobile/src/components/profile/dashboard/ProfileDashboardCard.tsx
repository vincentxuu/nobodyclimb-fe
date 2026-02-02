import React from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import { Text } from '../../ui/Text'
import { Icon } from '../../ui/Icon'
import { COLORS, SEMANTIC_COLORS } from '@nobodyclimb/constants'

interface ProfileDashboardCardProps {
  icon: React.ReactNode
  title: string
  description: string
  onPress: () => void
  isComplete?: boolean
  progress?: { current: number; total: number }
  preview?: React.ReactNode
  size?: 'normal' | 'large'
}

export default function ProfileDashboardCard({
  icon,
  title,
  description,
  onPress,
  isComplete = false,
  progress,
  preview,
  size = 'normal',
}: ProfileDashboardCardProps) {
  const progressPercent = progress
    ? Math.round((progress.current / progress.total) * 100)
    : 0

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        size === 'large' && styles.containerLarge,
        pressed && styles.containerPressed,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.iconWrapper}>{icon}</View>
        {isComplete && (
          <View style={styles.completeBadge}>
            <Icon name="Check" size="xs" color={COLORS.white} />
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text variant="bodyBold" style={{ color: SEMANTIC_COLORS.textMain }}>
          {title}
        </Text>
        <Text
          variant="caption"
          style={{ color: SEMANTIC_COLORS.textMuted, marginTop: 4 }}
          numberOfLines={2}
        >
          {description}
        </Text>
      </View>

      {preview && <View style={styles.preview}>{preview}</View>}

      {progress && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${progressPercent}%` },
              ]}
            />
          </View>
          <Text variant="caption" style={{ color: SEMANTIC_COLORS.textMuted }}>
            {progress.current}/{progress.total}
          </Text>
        </View>
      )}

      <View style={styles.arrow}>
        <Icon name="ChevronRight" size="sm" color={SEMANTIC_COLORS.textMuted} />
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    position: 'relative',
  },
  containerLarge: {
    padding: 20,
  },
  containerPressed: {
    backgroundColor: COLORS.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.green[500],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  content: {
    flex: 1,
  },
  preview: {
    marginTop: 12,
    padding: 12,
    backgroundColor: COLORS.gray[50],
    borderRadius: 8,
  },
  progressContainer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.gray[200],
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.green[500],
    borderRadius: 2,
  },
  arrow: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
})
