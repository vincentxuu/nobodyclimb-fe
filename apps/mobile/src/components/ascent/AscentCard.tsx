import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Pencil, Trash2, MapPin, Star } from 'lucide-react-native'
import { SEMANTIC_COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, WB_COLORS } from '@nobodyclimb/constants'

const ASCENT_TYPE_LABELS: Record<string, string> = {
  redpoint: 'Redpoint',
  flash: 'Flash',
  onsight: 'Onsight',
  attempt: 'Attempt',
  toprope: 'Top Rope',
  lead: 'Lead',
  seconding: 'Second',
  repeat: 'Repeat',
}

const ASCENT_TYPE_COLORS: Record<string, string> = {
  redpoint: '#EF4444',
  flash: '#EAB308',
  onsight: '#10B981',
  attempt: '#6B7280',
  toprope: '#3B82F6',
  lead: '#A855F7',
  seconding: '#06B6D4',
  repeat: '#6366F1',
}

interface Ascent {
  id: string
  ascent_type: string
  route_name: string
  crag_name: string
  grade: string
  date: string
  attempts?: number
  rating?: number
  notes?: string
}

interface AscentCardProps {
  ascent: Ascent
  onEdit: (ascent: Ascent) => void
  onDelete: (id: string) => void
}

export function AscentCard({ ascent, onEdit, onDelete }: AscentCardProps) {
  const typeColor = ASCENT_TYPE_COLORS[ascent.ascent_type] ?? SEMANTIC_COLORS.textSubtle
  const typeLabel = ASCENT_TYPE_LABELS[ascent.ascent_type] ?? ascent.ascent_type

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.routeName}>{ascent.route_name}</Text>
          <Text style={[styles.typeBadge, { color: typeColor, borderColor: typeColor }]}>
            {typeLabel}
          </Text>
        </View>
        <View style={styles.actions}>
          <Pressable
            testID="ascent-card-edit"
            onPress={() => onEdit(ascent)}
            hitSlop={8}
            style={styles.actionBtn}
          >
            <Pencil size={16} color={SEMANTIC_COLORS.textSubtle} />
          </Pressable>
          <Pressable
            testID="ascent-card-delete"
            onPress={() => onDelete(ascent.id)}
            hitSlop={8}
            style={styles.actionBtn}
          >
            <Trash2 size={16} color='#EF4444' />
          </Pressable>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <MapPin size={13} color={SEMANTIC_COLORS.textSubtle} />
          <Text style={styles.metaText}>{ascent.crag_name}</Text>
        </View>
        <Text style={styles.grade}>{ascent.grade}</Text>
        <Text style={styles.date}>{ascent.date}</Text>
      </View>

      {ascent.rating != null && (
        <View style={styles.ratingRow}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={12}
              color={i < ascent.rating! ? '#F59E0B' : SEMANTIC_COLORS.border}
            />
          ))}
        </View>
      )}

      {ascent.notes ? (
        <Text style={styles.notes} numberOfLines={2}>
          {ascent.notes}
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: WB_COLORS[5],
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    flex: 1,
  },
  routeName: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: SEMANTIC_COLORS.textMain,
    flex: 1,
  },
  typeBadge: {
    fontSize: FONT_SIZE.xs,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.xs,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  actionBtn: { padding: 4 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  metaText: { fontSize: FONT_SIZE.sm, color: SEMANTIC_COLORS.textSubtle },
  grade: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: SEMANTIC_COLORS.textMain },
  date: { fontSize: FONT_SIZE.sm, color: SEMANTIC_COLORS.textSubtle },
  ratingRow: { flexDirection: 'row', gap: 2 },
  notes: {
    fontSize: FONT_SIZE.sm,
    color: SEMANTIC_COLORS.textSubtle,
    lineHeight: FONT_SIZE.sm * 1.5,
  },
})
