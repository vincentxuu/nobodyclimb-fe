/**
 * ResultStrengths
 *
 * 優勢與盲點列表
 */

import { BORDER_RADIUS, SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import type { PersonalityType } from '@nobodyclimb/types'
import { AlertTriangle, Check } from 'lucide-react-native'
import { StyleSheet, View } from 'react-native'

import { Text } from '@/components/ui'

interface ResultStrengthsProps {
  /** 人格類型資料 */
  personalityType: PersonalityType
}

export function ResultStrengths({ personalityType }: ResultStrengthsProps) {
  return (
    <View style={styles.card}>
      {/* 優勢 */}
      <View style={styles.section}>
        <Text variant="h4">優勢</Text>
        <View style={styles.itemList}>
          {personalityType.strengths.map((strength, index) => (
            <View key={index} style={styles.item}>
              <Check size={18} color="#10B981" strokeWidth={2.5} />
              <Text variant="body" style={styles.itemText}>
                {strength}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* 分隔線 */}
      <View style={styles.divider} />

      {/* 盲點 */}
      <View style={styles.section}>
        <Text variant="h4">盲點</Text>
        <View style={styles.itemList}>
          {personalityType.blindSpots.map((blindSpot, index) => (
            <View key={index} style={styles.item}>
              <AlertTriangle size={18} color="#F59E0B" strokeWidth={2.5} />
              <Text variant="body" style={styles.itemText}>
                {blindSpot}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: SEMANTIC_COLORS.border,
    padding: SPACING[4],
    gap: SPACING[4],
  },
  section: {
    gap: SPACING[3],
  },
  itemList: {
    gap: SPACING[3],
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING[3],
  },
  itemText: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: SEMANTIC_COLORS.border,
  },
})
