import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import {
  CircleDot, Zap, Eye, Target, ArrowUp, Sword, Users, Repeat2,
} from 'lucide-react-native'
import { SEMANTIC_COLORS, SPACING, RADIUS, FONT_SIZE } from '@nobodyclimb/constants'
import type { AscentType } from '@/lib/hooks/useAscents'

interface AscentTypeOption {
  type: AscentType
  label: string
  Icon: React.ElementType
  color: string
}

const ASCENT_TYPES: AscentTypeOption[] = [
  { type: 'redpoint',  label: 'Redpoint', Icon: CircleDot, color: '#EF4444' },
  { type: 'flash',     label: 'Flash',    Icon: Zap,       color: '#EAB308' },
  { type: 'onsight',   label: 'Onsight',  Icon: Eye,       color: '#10B981' },
  { type: 'attempt',   label: 'Attempt',  Icon: Target,    color: '#6B7280' },
  { type: 'toprope',   label: 'Top Rope', Icon: ArrowUp,   color: '#3B82F6' },
  { type: 'lead',      label: 'Lead',     Icon: Sword,     color: '#A855F7' },
  { type: 'seconding', label: 'Second',   Icon: Users,     color: '#06B6D4' },
  { type: 'repeat',    label: 'Repeat',   Icon: Repeat2,   color: '#6366F1' },
]

interface AscentTypeSelectProps {
  value: AscentType
  onChange: (type: AscentType) => void
}

export function AscentTypeSelect({ value, onChange }: AscentTypeSelectProps) {
  return (
    <View style={styles.grid}>
      {ASCENT_TYPES.map(({ type, label, Icon, color }) => {
        const selected = value === type
        return (
          <Pressable
            key={type}
            testID={`ascent-type-${type}`}
            role="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(type)}
            style={[
              styles.cell,
              selected && { borderColor: '#10B981', backgroundColor: '#10B98115' },
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
