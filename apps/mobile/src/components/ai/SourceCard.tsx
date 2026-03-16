import { View, Pressable, StyleSheet, Linking } from 'react-native'
import { Mountain, MapPin, Play, ExternalLink } from 'lucide-react-native'
import { Text } from '@/components/ui'
import { SPACING, WB_COLORS, BORDER_RADIUS } from '@nobodyclimb/constants'
import type { AISource } from '@/lib/hooks/useRecommendations'

const SOURCE_ICONS = {
  route: Mountain,
  crag: MapPin,
  video: Play,
}

interface SourceCardProps {
  source: AISource
}

export function SourceCard({ source }: SourceCardProps) {
  const Icon = SOURCE_ICONS[source.type]

  return (
    <Pressable
      style={styles.card}
      onPress={() => Linking.openURL(source.url).catch(() => {})}
    >
      <View style={styles.iconWrapper}>
        <Icon size={16} color={WB_COLORS[60]} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{source.title}</Text>
        <Text style={styles.excerpt} numberOfLines={2}>{source.excerpt}</Text>
      </View>
      <ExternalLink size={14} color={WB_COLORS[40]} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING[2],
    padding: SPACING[3],
    backgroundColor: WB_COLORS[5],
    borderRadius: BORDER_RADIUS.md,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: WB_COLORS[10],
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1 },
  title: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  excerpt: { fontSize: 12, color: WB_COLORS[50], lineHeight: 18 },
})
