import { FONT_SIZE, RADIUS, SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import { ArrowUp, CircleDot, Eye, Repeat2, Sword, Target, Users, Zap } from 'lucide-react-native'
import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { AscentType } from '@/lib/constants/ascent'
import { ASCENT_TYPE_COLORS, ASCENT_TYPE_LABELS } from '@/lib/constants/ascent'

interface AscentTypeOption {
  type: AscentType
  label: string
  Icon: React.ElementType
}

const ASCENT_TYPES: AscentTypeOption[] = [
  { type: 'redpoint', label: ASCENT_TYPE_LABELS.redpoint, Icon: CircleDot },
  { type: 'flash', label: ASCENT_TYPE_LABELS.flash, Icon: Zap },
  { type: 'onsight', label: ASCENT_TYPE_LABELS.onsight, Icon: Eye },
  { type: 'attempt', label: ASCENT_TYPE_LABELS.attempt, Icon: Target },
  { type: 'toprope', label: ASCENT_TYPE_LABELS.toprope, Icon: ArrowUp },
  { type: 'lead', label: ASCENT_TYPE_LABELS.lead, Icon: Sword },
  { type: 'seconding', label: ASCENT_TYPE_LABELS.seconding, Icon: Users },
  { type: 'repeat', label: ASCENT_TYPE_LABELS.repeat, Icon: Repeat2 },
]

interface AscentTypeSelectProps {
  value: AscentType
  onChange: (type: AscentType) => void
}

export function AscentTypeSelect({ value, onChange }: AscentTypeSelectProps) {
  return (
    <View style={styles.grid}>
      {ASCENT_TYPES.map(({ type, label, Icon }) => {
        const selected = value === type
        const color = ASCENT_TYPE_COLORS[type]
        return (
          <Pressable
            key={type}
            testID={`ascent-type-${type}`}
            role="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(type)}
            style={[
              styles.cell,
              selected && { borderColor: SEMANTIC_COLORS.success, backgroundColor: '#10B98115' },
            ]}
          >
            <Icon size={20} color={selected ? color : SEMANTIC_COLORS.textSubtle} />
            <Text style={[styles.label, selected && { color: SEMANTIC_COLORS.textMain }]}>
              {label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  cell: {
    width: '23%',
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: SEMANTIC_COLORS.border,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs / 2,
    padding: SPACING.xs,
  },
  label: {
    fontSize: FONT_SIZE.xs,
    color: SEMANTIC_COLORS.textSubtle,
    textAlign: 'center',
  },
})
