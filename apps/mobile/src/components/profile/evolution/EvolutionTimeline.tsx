/**
 * EvolutionTimeline - 演化時間軸
 *
 * 垂直時間軸顯示人格演化記錄
 */
import {
  getPersonalityColor,
  getPersonalityType,
  SEMANTIC_COLORS,
  SPACING,
  WB_COLORS,
} from '@nobodyclimb/constants'
import type { PersonalityTypeCode } from '@nobodyclimb/types'
import { StyleSheet, View } from 'react-native'
import { Text } from '@/components/ui'
import type { EvolutionRecord } from '@/lib/api/evolution'

interface EvolutionTimelineProps {
  records: EvolutionRecord[]
}

const TRIGGER_LABELS: Record<string, string> = {
  manual: '手動計算',
  ascent: '完攀觸發',
  quiz: '測驗觸發',
  auto: '自動計算',
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}/${m}/${day}`
}

function getTypeColor(code: string): string {
  try {
    return getPersonalityColor(code as PersonalityTypeCode) ?? WB_COLORS[60]
  } catch {
    return WB_COLORS[60]
  }
}

function getTypeNameZh(code: string): string {
  try {
    return getPersonalityType(code as PersonalityTypeCode)?.nameZh ?? code
  } catch {
    return code
  }
}

function ProgressBar({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <View style={barStyles.row}>
      <Text style={barStyles.label}>{label}</Text>
      <View style={barStyles.track}>
        <View style={[barStyles.fill, { width: `${pct}%` }]} />
      </View>
      <Text style={barStyles.value}>{pct}%</Text>
    </View>
  )
}

function TimelineNode({ record, isLast }: { record: EvolutionRecord; isLast: boolean }) {
  const toColor = getTypeColor(record.to_type)
  const toName = getTypeNameZh(record.to_type)
  const fromName = record.from_type ? getTypeNameZh(record.from_type) : null
  const fromColor = record.from_type ? getTypeColor(record.from_type) : null
  const triggerLabel = TRIGGER_LABELS[record.trigger] ?? record.trigger

  return (
    <View style={nodeStyles.container}>
      {/* Left column: dot + line */}
      <View style={nodeStyles.leftCol}>
        <View style={[nodeStyles.dot, { backgroundColor: toColor }]} />
        {!isLast && <View style={nodeStyles.line} />}
      </View>

      {/* Right column: content */}
      <View style={nodeStyles.content}>
        {/* Date + trigger badge */}
        <View style={nodeStyles.headerRow}>
          <Text style={nodeStyles.date}>{formatDate(record.calculated_at)}</Text>
          <View style={nodeStyles.triggerBadge}>
            <Text style={nodeStyles.triggerText}>{triggerLabel}</Text>
          </View>
        </View>

        {/* Type change */}
        <View style={nodeStyles.typeRow}>
          {fromName ? (
            <>
              <Text style={[nodeStyles.typeName, { color: fromColor! }]}>{fromName}</Text>
              <Text style={nodeStyles.arrow}> → </Text>
              <Text style={[nodeStyles.typeName, { color: toColor }]}>{toName}</Text>
            </>
          ) : (
            <Text style={[nodeStyles.typeName, { color: toColor }]}>{toName}</Text>
          )}
        </View>

        {/* Progress bars */}
        <View style={nodeStyles.bars}>
          <ProgressBar label="力量" value={record.power_pct} />
          <ProgressBar label="目標" value={record.goal_pct} />
          <ProgressBar label="大膽" value={record.bold_pct} />
        </View>

        {record.consecutive_count > 1 && (
          <Text style={nodeStyles.consecutive}>連續 {record.consecutive_count} 次相同結果</Text>
        )}
      </View>
    </View>
  )
}

export default function EvolutionTimeline({ records }: EvolutionTimelineProps) {
  if (records.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>尚無演化記錄</Text>
        <Text style={styles.emptyText}>
          完成攀岩人格測驗並累積攀登紀錄後，系統會自動追蹤你的人格演化。
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {records.map((record, index) => (
        <TimelineNode key={record.id} record={record} isLast={index === records.length - 1} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 0,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: SEMANTIC_COLORS.border,
    gap: SPACING.xs,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: SEMANTIC_COLORS.textMain,
  },
  emptyText: {
    fontSize: 14,
    color: SEMANTIC_COLORS.textSubtle,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
    lineHeight: 22,
  },
})

const nodeStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    minHeight: 120,
  },
  leftCol: {
    width: 24,
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: SEMANTIC_COLORS.border,
    marginTop: 4,
  },
  content: {
    flex: 1,
    marginLeft: SPACING.sm,
    paddingBottom: SPACING.md,
    gap: SPACING.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  date: {
    fontSize: 13,
    color: SEMANTIC_COLORS.textSubtle,
  },
  triggerBadge: {
    backgroundColor: SEMANTIC_COLORS.pageBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  triggerText: {
    fontSize: 11,
    color: SEMANTIC_COLORS.textMuted,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeName: {
    fontSize: 16,
    fontWeight: '700',
  },
  arrow: {
    fontSize: 16,
    color: WB_COLORS[40],
  },
  bars: {
    gap: 6,
    marginTop: 4,
  },
  consecutive: {
    fontSize: 12,
    color: SEMANTIC_COLORS.textMuted,
    marginTop: 2,
  },
})

const barStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    width: 32,
    fontSize: 12,
    color: SEMANTIC_COLORS.textSubtle,
  },
  track: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: SEMANTIC_COLORS.pageBg,
    overflow: 'hidden',
  },
  fill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: SEMANTIC_COLORS.success,
  },
  value: {
    width: 32,
    fontSize: 12,
    color: SEMANTIC_COLORS.textSubtle,
    textAlign: 'right',
  },
})
