/**
 * CollectionCard
 *
 * 人格收藏集卡片，對應 apps/web/src/components/quiz/CollectionCard.tsx
 */

import { BORDER_RADIUS, SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import type { PersonalityType } from '@nobodyclimb/types'
import { useRouter } from 'expo-router'
import { Mountain } from 'lucide-react-native'
import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from '@/components/ui'

export function CollectionCard({ personality }: { personality: PersonalityType }) {
  const router = useRouter()

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => router.push(`/quiz/result/${personality.code.toLowerCase()}` as any)}
      accessibilityRole="button"
      accessibilityLabel={`查看 ${personality.nameZh} 人格`}
    >
      <View style={[styles.iconBox, { backgroundColor: `${personality.color}15` }]}>
        <Mountain size={32} color={personality.color} />
      </View>

      <Text variant="small" fontWeight="600" style={[styles.code, { color: personality.color }]}>
        {personality.code}
      </Text>
      <Text variant="bodyBold">{personality.nameZh}</Text>
      <Text variant="small" color="textMuted">
        {personality.nameEn}
      </Text>
      <Text variant="small" color="textMuted" style={styles.tagline}>
        「{personality.tagline}」
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: SEMANTIC_COLORS.border,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    padding: SPACING[4],
    gap: SPACING[1],
  },
  cardPressed: {
    borderColor: SEMANTIC_COLORS.borderSubtle,
    opacity: 0.85,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING[3],
  },
  code: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tagline: {
    marginTop: SPACING[1],
    fontStyle: 'italic',
  },
})
