/**
 * 路線列表項目組件
 *
 * 對應 apps/web/src/components/crag/route-list-item.tsx
 */

import { SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import { ChevronRight } from 'lucide-react-native'
import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from '@/components/ui'

interface RouteListItemProps {
  id: string
  name: string
  grade: string
  type: string
  areaName?: string
  sector?: string
  onPress?: () => void
}

export function RouteListItem({
  name,
  grade,
  type,
  areaName,
  sector,
  onPress,
}: RouteListItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={styles.content}>
        {/* 難度標籤 */}
        <View style={styles.gradeBadge}>
          <Text variant="small" fontWeight="600" style={styles.gradeText}>
            {grade}
          </Text>
        </View>

        {/* 路線資訊 */}
        <View style={styles.info}>
          <Text variant="body" fontWeight="500" numberOfLines={1}>
            {name}
          </Text>
          <View style={styles.metaRow}>
            <Text variant="caption" color="textMuted">
              {type}
            </Text>
            {sector && (
              <>
                <Text variant="caption" color="textMuted" style={styles.dot}>
                  ·
                </Text>
                <Text variant="caption" color="textMuted" numberOfLines={1}>
                  {sector}
                </Text>
              </>
            )}
            {areaName && !sector && (
              <>
                <Text variant="caption" color="textMuted" style={styles.dot}>
                  ·
                </Text>
                <Text variant="caption" color="textMuted" numberOfLines={1}>
                  {areaName}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* 箭頭 */}
        <ChevronRight size={18} color={SEMANTIC_COLORS.textMuted} />
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: 8,
    marginVertical: 2,
  },
  pressed: {
    backgroundColor: WB_COLORS[10],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    gap: SPACING.sm,
  },
  gradeBadge: {
    backgroundColor: '#FFF9D6',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 4,
    minWidth: 48,
    alignItems: 'center',
  },
  gradeText: {
    color: WB_COLORS[100],
  },
  info: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dot: {
    marginHorizontal: 4,
  },
})
