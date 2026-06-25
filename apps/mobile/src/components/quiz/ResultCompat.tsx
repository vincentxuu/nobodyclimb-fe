/**
 * ResultCompat
 *
 * 最佳拍檔與最大剋星相性配對
 */

import {
  BORDER_RADIUS,
  FONT_SIZE,
  FONT_WEIGHT,
  getPersonalityType,
  SEMANTIC_COLORS,
  SPACING,
  WB_COLORS,
} from '@nobodyclimb/constants'
import type { PersonalityType } from '@nobodyclimb/types'
import { Heart, Shield } from 'lucide-react-native'
import { Pressable, StyleSheet, View } from 'react-native'

import { Text } from '@/components/ui'

interface ResultCompatProps {
  /** 人格類型資料 */
  personalityType: PersonalityType
  /** 點擊類型時的回調 */
  onTypePress?: (code: string) => void
}

export function ResultCompat({ personalityType, onTypePress }: ResultCompatProps) {
  const bestPartner = getPersonalityType(personalityType.bestPartner)
  const worstMatch = getPersonalityType(personalityType.worstMatch)

  return (
    <View style={styles.card}>
      {/* 最佳拍檔 */}
      {bestPartner && (
        <Pressable
          style={({ pressed }) => [styles.compatRow, { opacity: pressed ? 0.7 : 1 }]}
          onPress={() => onTypePress?.(bestPartner.code)}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#D1FAE5' }]}>
            <Heart size={20} color="#10B981" fill="#10B981" />
          </View>
          <View style={styles.compatInfo}>
            <Text
              style={{
                fontSize: FONT_SIZE.xs,
                fontWeight: FONT_WEIGHT.medium,
                color: WB_COLORS[50],
              }}
            >
              最佳拍檔
            </Text>
            <View style={styles.typeNameRow}>
              <View style={[styles.colorDot, { backgroundColor: bestPartner.color }]} />
              <Text
                style={{
                  fontSize: FONT_SIZE.base,
                  fontWeight: FONT_WEIGHT.semibold,
                  color: SEMANTIC_COLORS.textMain,
                }}
              >
                {bestPartner.nameZh}
              </Text>
              <Text
                style={{
                  fontSize: FONT_SIZE.sm,
                  fontWeight: FONT_WEIGHT.normal,
                  color: WB_COLORS[50],
                }}
              >
                {bestPartner.nameEn}
              </Text>
            </View>
          </View>
        </Pressable>
      )}

      {/* 分隔線 */}
      <View style={styles.divider} />

      {/* 最大剋星 */}
      {worstMatch && (
        <Pressable
          style={({ pressed }) => [styles.compatRow, { opacity: pressed ? 0.7 : 1 }]}
          onPress={() => onTypePress?.(worstMatch.code)}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#FEE2E2' }]}>
            <Shield size={20} color="#EF4444" />
          </View>
          <View style={styles.compatInfo}>
            <Text
              style={{
                fontSize: FONT_SIZE.xs,
                fontWeight: FONT_WEIGHT.medium,
                color: WB_COLORS[50],
              }}
            >
              最大剋星
            </Text>
            <View style={styles.typeNameRow}>
              <View style={[styles.colorDot, { backgroundColor: worstMatch.color }]} />
              <Text
                style={{
                  fontSize: FONT_SIZE.base,
                  fontWeight: FONT_WEIGHT.semibold,
                  color: SEMANTIC_COLORS.textMain,
                }}
              >
                {worstMatch.nameZh}
              </Text>
              <Text
                style={{
                  fontSize: FONT_SIZE.sm,
                  fontWeight: FONT_WEIGHT.normal,
                  color: WB_COLORS[50],
                }}
              >
                {worstMatch.nameEn}
              </Text>
            </View>
          </View>
        </Pressable>
      )}
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
  compatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3],
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compatInfo: {
    flex: 1,
    gap: SPACING[0.5],
  },
  typeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  divider: {
    height: 1,
    backgroundColor: SEMANTIC_COLORS.border,
  },
})
