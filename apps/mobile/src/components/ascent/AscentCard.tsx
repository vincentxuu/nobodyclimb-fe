import {
  BORDER_RADIUS,
  FONT_SIZE,
  SEMANTIC_COLORS,
  SPACING,
  WB_COLORS,
} from '@nobodyclimb/constants'
import { Instagram, MapPin, Pencil, Star, Trash2, Youtube } from 'lucide-react-native'
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import type { AscentType } from '@/lib/constants/ascent'
import { ASCENT_TYPE_COLORS, ASCENT_TYPE_LABELS } from '@/lib/constants/ascent'

interface Ascent {
  id: string
  ascent_type: AscentType
  route_name: string
  crag_name: string
  grade?: string
  route_grade?: string
  date?: string
  ascent_date?: string
  attempts?: number
  attempts_count?: number
  rating?: number
  perceived_grade?: string | null
  notes?: string
  youtube_url?: string | null
  instagram_url?: string | null
}

interface AscentCardProps {
  ascent: Ascent
  onEdit: (ascent: Ascent) => void
  onDelete: (id: string) => void
}

export function AscentCard({ ascent, onEdit, onDelete }: AscentCardProps) {
  const typeColor = ASCENT_TYPE_COLORS[ascent.ascent_type] ?? SEMANTIC_COLORS.textSubtle
  const typeLabel = ASCENT_TYPE_LABELS[ascent.ascent_type] ?? ascent.ascent_type
  const routeGrade = ascent.grade ?? ascent.route_grade
  const ascentDate = ascent.date ?? ascent.ascent_date
  const attempts = ascent.attempts ?? ascent.attempts_count

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
            <Trash2 size={16} color={SEMANTIC_COLORS.error} />
          </Pressable>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <MapPin size={13} color={SEMANTIC_COLORS.textSubtle} />
          <Text style={styles.metaText}>{ascent.crag_name}</Text>
        </View>
        {routeGrade ? <Text style={styles.grade}>{routeGrade}</Text> : null}
        {ascentDate ? <Text style={styles.date}>{ascentDate}</Text> : null}
      </View>

      {(attempts && attempts > 1) || ascent.perceived_grade ? (
        <View style={styles.detailRow}>
          {attempts && attempts > 1 ? (
            <Text style={styles.detailText}>{attempts} 次嘗試</Text>
          ) : null}
          {ascent.perceived_grade ? (
            <Text style={styles.detailText}>感受：{ascent.perceived_grade}</Text>
          ) : null}
        </View>
      ) : null}

      {ascent.rating != null && (
        <View style={styles.ratingRow}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={12}
              color={i < ascent.rating! ? SEMANTIC_COLORS.warning : SEMANTIC_COLORS.border}
            />
          ))}
        </View>
      )}

      {ascent.notes ? (
        <Text style={styles.notes} numberOfLines={2}>
          {ascent.notes}
        </Text>
      ) : null}

      {ascent.youtube_url || ascent.instagram_url ? (
        <View style={styles.mediaRow}>
          {ascent.youtube_url ? (
            <Pressable
              style={styles.mediaPill}
              onPress={() => Linking.openURL(ascent.youtube_url!)}
            >
              <Youtube size={14} color="#EF4444" />
              <Text style={styles.mediaText}>YouTube</Text>
            </Pressable>
          ) : null}
          {ascent.instagram_url ? (
            <Pressable
              style={styles.mediaPill}
              onPress={() => Linking.openURL(ascent.instagram_url!)}
            >
              <Instagram size={14} color="#EC4899" />
              <Text style={styles.mediaText}>Instagram</Text>
            </Pressable>
          ) : null}
        </View>
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
  detailRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  detailText: { fontSize: FONT_SIZE.xs, color: SEMANTIC_COLORS.textSubtle },
  ratingRow: { flexDirection: 'row', gap: 2 },
  notes: {
    fontSize: FONT_SIZE.sm,
    color: SEMANTIC_COLORS.textSubtle,
    lineHeight: FONT_SIZE.sm * 1.5,
  },
  mediaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  mediaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: WB_COLORS[0],
  },
  mediaText: { fontSize: FONT_SIZE.xs, color: SEMANTIC_COLORS.textMain },
})
