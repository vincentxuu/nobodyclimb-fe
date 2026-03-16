import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { ImageOff } from 'lucide-react-native'
import { SEMANTIC_COLORS, SPACING, RADIUS, WB_COLORS, FONT_SIZE } from '@nobodyclimb/constants'

interface PlaceholderImageProps {
  width: number
  height: number
  label?: string
  iconSize?: number
  testID?: string
}

export function PlaceholderImage({
  width,
  height,
  label,
  iconSize = 32,
  testID,
}: PlaceholderImageProps) {
  return (
    <View
      testID={testID}
      style={[
        styles.container,
        { width, height, borderRadius: RADIUS.md },
      ]}
    >
      <ImageOff size={iconSize} color={SEMANTIC_COLORS.textSubtle} />
      {label ? (
        <Text style={styles.label}>{label}</Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: WB_COLORS[10],
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  label: {
    color: SEMANTIC_COLORS.textSubtle,
    fontSize: FONT_SIZE.sm,
    marginTop: SPACING.xs,
  },
})
