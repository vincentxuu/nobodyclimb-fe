import { useState } from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react-native'
import { Text, MarkdownText } from '@/components/ui'
import { SPACING, WB_COLORS, BORDER_RADIUS, SEMANTIC_COLORS } from '@nobodyclimb/constants'
import type { Recommendation } from '@/lib/hooks/useRecommendations'
import { SourceCard } from './SourceCard'

const TRIGGER_LABELS: Record<Recommendation['triggered_by'], string> = {
  ascent: '完攀後推薦',
  manual: '手動觸發',
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })
}

interface RecommendationCardProps {
  recommendation: Recommendation
}

export function RecommendationCard({ recommendation: rec }: RecommendationCardProps) {
  const [expanded, setExpanded] = useState(false)
  const ascentCount = rec.recommendation.context_ascents?.length ?? 0
  const isFailed = rec.status === 'failed'

  return (
    <View style={styles.card}>
      <Pressable
        testID="recommendation-header"
        style={styles.header}
        onPress={() => setExpanded(prev => !prev)}
      >
        <Sparkles size={16} color={SEMANTIC_COLORS.warning} />
        <View style={styles.headerInfo}>
          <Text style={styles.triggerLabel}>{TRIGGER_LABELS[rec.triggered_by]}</Text>
          {ascentCount > 0 && (
            <Text style={styles.ascentCount}>{ascentCount} 條完攀記錄</Text>
          )}
        </View>
        <Text style={styles.date}>{formatDate(rec.created_at)}</Text>
        {expanded ? (
          <ChevronUp size={16} color={WB_COLORS[40]} />
        ) : (
          <ChevronDown size={16} color={WB_COLORS[40]} />
        )}
      </Pressable>

      {expanded && (
        <View style={styles.body}>
          {isFailed ? (
            <Text style={styles.failedText}>推薦生成失敗，請稍後再試。</Text>
          ) : (
            <>
              <MarkdownText>{rec.recommendation.answer}</MarkdownText>
              {rec.recommendation.sources.length > 0 && (
                <View style={styles.sources}>
                  <Text style={styles.sourcesTitle}>參考資料</Text>
                  {rec.recommendation.sources.map(source => (
                    <SourceCard key={source.id} source={source} />
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: WB_COLORS[5],
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    padding: SPACING[4],
  },
  headerInfo: { flex: 1 },
  triggerLabel: { fontSize: 14, fontWeight: '600' },
  ascentCount: { fontSize: 12, color: WB_COLORS[50] },
  date: { fontSize: 12, color: WB_COLORS[40] },
  body: {
    paddingHorizontal: SPACING[4],
    paddingBottom: SPACING[4],
    gap: SPACING[3],
  },
  sources: { gap: SPACING[2] },
  sourcesTitle: { fontSize: 13, fontWeight: '600', color: WB_COLORS[60] },
  failedText: { fontSize: 14, color: SEMANTIC_COLORS.error },
})
