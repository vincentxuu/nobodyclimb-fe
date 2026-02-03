import React from 'react'
import { View } from 'react-native'
import { Text } from '../ui/Text'
import { SEMANTIC_COLORS } from '@nobodyclimb/constants'

interface ProfileFormFieldProps {
  label: React.ReactNode
  hint?: string
  children: React.ReactNode
  isMobile?: boolean
}

export default function ProfileFormField({
  label,
  hint,
  children,
}: ProfileFormFieldProps) {
  return (
    <View style={{ width: '100%', gap: 8 }}>
      <View>
        {typeof label === 'string' ? (
          <Text
            variant="bodyBold"
            style={{ color: SEMANTIC_COLORS.textMain }}
          >
            {label}
          </Text>
        ) : (
          label
        )}
        {hint && (
          <Text
            variant="caption"
            style={{ marginTop: 4, color: SEMANTIC_COLORS.textMuted }}
          >
            {hint}
          </Text>
        )}
      </View>
      {children}
    </View>
  )
}
