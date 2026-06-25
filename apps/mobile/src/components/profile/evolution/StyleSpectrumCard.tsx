/**
 * StyleSpectrumCard - 攀岩光譜卡片
 *
 * 顯示使用者在 onsight/redpoint 光譜上的位置
 * 對應 apps/web/src/components/profile/evolution/StyleSpectrumCard.tsx
 */
import { SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import { Compass, Mountain, Target } from 'lucide-react-native'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { Text } from '@/components/ui'
import type { StyleSpectrumData } from '@/lib/api/evolution'

interface StyleSpectrumCardProps {
  data: StyleSpectrumData | null | undefined
  isLoading: boolean
}

export default function StyleSpectrumCard({ data, isLoading }: StyleSpectrumCardProps) {
  if (isLoading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator style={{ marginVertical: SPACING.xl }} color={SEMANTIC_COLORS.success} />
      </View>
    )
  }

  if (!data || data.spectrum === null || !data.position) {
    return (
      <View style={styles.card}>
        <View style={styles.titleRow}>
          <Compass size={20} color={SEMANTIC_COLORS.success} />
          <Text style={styles.titleText}>攀岩光譜</Text>
        </View>
        <View style={styles.emptyBox}>
          <Compass size={32} color={WB_COLORS[30]} />
          <Text style={styles.emptyText}>尚未有足夠數據</Text>
          <Text style={styles.emptySubtext}>需要攀登紀錄才能計算你的攀岩光譜</Text>
        </View>
      </View>
    )
  }

  const { spectrum, position, onsight_max_grade, redpoint_max_grade } = data
  // spectrum ranges from -100 (pure onsight) to +100 (pure redpoint)
  // Map to percentage: -100 -> 0%, 0 -> 50%, +100 -> 100%
  const markerPercent = ((spectrum! + 100) / 200) * 100

  return (
    <View style={styles.card}>
      {/* Title */}
      <View style={styles.titleRow}>
        <Compass size={20} color={SEMANTIC_COLORS.success} />
        <Text style={styles.titleText}>攀岩光譜</Text>
      </View>

      {/* Position Name */}
      <View style={styles.positionRow}>
        <Text style={styles.positionName}>{position.nameZh}</Text>
        <Text style={styles.positionNameEn}>{position.name}</Text>
      </View>

      {/* Spectrum Bar */}
      <View style={styles.spectrumSection}>
        <View style={styles.spectrumLabels}>
          <Text style={styles.spectrumLabel}>深耕型 (Redpoint)</Text>
          <Text style={styles.spectrumLabel}>即興型 (Onsight)</Text>
        </View>
        <View style={styles.spectrumTrack}>
          {/* Gradient approximated with 3 sections */}
          <View style={styles.spectrumGradientLeft} />
          <View style={styles.spectrumGradientCenter} />
          <View style={styles.spectrumGradientRight} />
          {/* Marker */}
          <View style={[styles.marker, { left: `${markerPercent}%` }]} />
        </View>
      </View>

      {/* Description */}
      <Text style={styles.description}>{position.description}</Text>

      {/* Growth Direction */}
      <View style={styles.growthBox}>
        <Text style={styles.growthText}>
          <Text style={styles.growthLabel}>成長方向：</Text>
          {position.growthDirection}
        </Text>
      </View>

      {/* Grade Comparison */}
      <View style={styles.gradeRow}>
        <View style={styles.gradeCard}>
          <View style={styles.gradeHeader}>
            <Target size={14} color={WB_COLORS[50]} />
            <Text style={styles.gradeLabel}>Onsight 最高</Text>
          </View>
          <Text style={styles.gradeValue}>{onsight_max_grade || '--'}</Text>
        </View>
        <View style={styles.gradeCard}>
          <View style={styles.gradeHeader}>
            <Mountain size={14} color={WB_COLORS[50]} />
            <Text style={styles.gradeLabel}>Redpoint 最高</Text>
          </View>
          <Text style={styles.gradeValue}>{redpoint_max_grade || '--'}</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: SEMANTIC_COLORS.border,
    backgroundColor: WB_COLORS[0],
    gap: SPACING.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '600',
    color: SEMANTIC_COLORS.textMain,
  },
  positionRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.xs,
  },
  positionName: {
    fontSize: 24,
    fontWeight: '700',
    color: SEMANTIC_COLORS.textMain,
  },
  positionNameEn: {
    fontSize: 14,
    color: WB_COLORS[40],
  },
  spectrumSection: {
    gap: 4,
  },
  spectrumLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  spectrumLabel: {
    fontSize: 11,
    color: WB_COLORS[40],
  },
  spectrumTrack: {
    height: 12,
    borderRadius: 6,
    flexDirection: 'row',
    overflow: 'hidden',
    position: 'relative',
  },
  spectrumGradientLeft: {
    flex: 1,
    backgroundColor: '#818CF8', // indigo-400
  },
  spectrumGradientCenter: {
    flex: 1,
    backgroundColor: '#34D399', // emerald-400
  },
  spectrumGradientRight: {
    flex: 1,
    backgroundColor: '#FBBF24', // amber-400
  },
  marker: {
    position: 'absolute',
    top: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: SEMANTIC_COLORS.textMain,
    borderWidth: 2,
    borderColor: WB_COLORS[0],
    marginLeft: -8,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: WB_COLORS[60],
  },
  growthBox: {
    backgroundColor: '#ECFDF5', // emerald-50
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  growthText: {
    fontSize: 14,
    color: '#047857', // emerald-700
    lineHeight: 20,
  },
  growthLabel: {
    fontWeight: '600',
    fontSize: 14,
    color: '#047857',
  },
  gradeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  gradeCard: {
    flex: 1,
    backgroundColor: SEMANTIC_COLORS.pageBg,
    borderRadius: 8,
    padding: SPACING.sm,
    gap: 4,
  },
  gradeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gradeLabel: {
    fontSize: 12,
    color: WB_COLORS[50],
  },
  gradeValue: {
    fontSize: 18,
    fontWeight: '600',
    color: SEMANTIC_COLORS.textMain,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: SEMANTIC_COLORS.border,
    gap: SPACING.xs,
  },
  emptyText: {
    fontSize: 14,
    color: WB_COLORS[40],
  },
  emptySubtext: {
    fontSize: 12,
    color: WB_COLORS[30],
  },
})
