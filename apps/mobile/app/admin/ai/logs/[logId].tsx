import { RADIUS, SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  Activity,
  ArrowLeft,
  CheckCircle,
  Clock,
  FileText,
  Gauge,
  MessageSquare,
  RefreshCw,
  Shield,
  User,
  Zap,
} from 'lucide-react-native'
import type React from 'react'
import { useCallback, useMemo, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, EmptyState, Text } from '@/components/ui'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { type AILogDetail, useAILogDetail } from '@/lib/hooks/useAdminDashboard'
import { useAuthStore } from '@/store/authStore'

function formatTime(value: string) {
  return new Date(value).toLocaleString('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatLatency(value: number | null | undefined) {
  if (value == null) return '-'
  if (value < 1000) return `${Math.round(value)}ms`
  return `${(value / 1000).toFixed(1)}s`
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>{icon}</View>
      <View style={styles.statText}>
        <Text variant="caption" color="textSubtle">
          {label}
        </Text>
        <Text variant="bodyBold" numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  )
}

function ScoreBar({
  label,
  value,
  max = 1,
}: {
  label: string
  value: number | null | undefined
  max?: number
}) {
  const normalized = value == null ? 0 : Math.max(0, Math.min(1, value / max))
  const color = normalized >= 0.7 ? '#10B981' : normalized >= 0.5 ? '#F59E0B' : '#EF4444'

  return (
    <View style={styles.scoreRow}>
      <Text variant="caption" color="textMuted" style={styles.scoreLabel}>
        {label}
      </Text>
      <View style={styles.scoreTrack}>
        {value != null && (
          <View
            style={[styles.scoreFill, { width: `${normalized * 100}%`, backgroundColor: color }]}
          />
        )}
      </View>
      <Text variant="caption" color="textSubtle" style={styles.scoreValue}>
        {value == null ? '-' : max === 4 ? `${value}/4` : `${Math.round(normalized * 100)}%`}
      </Text>
    </View>
  )
}

function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {icon}
        <Text variant="bodyBold">{title}</Text>
      </View>
      {children}
    </View>
  )
}

function PipelineSection({ log }: { log: AILogDetail }) {
  const stages = useMemo(() => Object.entries(log.pipeline ?? {}), [log.pipeline])

  if (stages.length === 0) return null

  return (
    <Section title="Pipeline 流程" icon={<Activity size={18} color={SEMANTIC_COLORS.textSubtle} />}>
      <View style={styles.pipelineList}>
        {stages.map(([key, stage], index) => {
          const skipped = Boolean(stage.skipped)
          return (
            <View key={key} style={styles.pipelineItem}>
              <View style={[styles.pipelineDot, skipped && styles.pipelineDotMuted]}>
                <Text variant="caption" fontWeight="700" style={styles.pipelineIndex}>
                  {index + 1}
                </Text>
              </View>
              <View style={styles.pipelineBody}>
                <Text variant="bodyBold" numberOfLines={1}>
                  {stage.service || key}
                </Text>
                <Text variant="caption" color="textSubtle" numberOfLines={2}>
                  {stage.description || (skipped ? '已跳過' : '已執行')}
                </Text>
              </View>
              <View style={[styles.stageBadge, skipped ? styles.stageSkipped : styles.stageDone]}>
                <Text
                  variant="caption"
                  style={skipped ? styles.stageTextSkipped : styles.stageTextDone}
                >
                  {skipped ? 'skip' : 'done'}
                </Text>
              </View>
            </View>
          )
        })}
      </View>
    </Section>
  )
}

function TokenSection({ log }: { log: AILogDetail }) {
  const breakdown = log.pipeline_trace?.token_breakdown
  if (!breakdown?.total) return null

  return (
    <Section title="費用與 Token" icon={<Zap size={18} color={SEMANTIC_COLORS.textSubtle} />}>
      <View style={styles.metricGrid}>
        <StatCard
          label="Prompt"
          value={breakdown.total.prompt_tokens.toLocaleString()}
          icon={<FileText size={18} color={SEMANTIC_COLORS.textMain} />}
        />
        <StatCard
          label="Completion"
          value={breakdown.total.completion_tokens.toLocaleString()}
          icon={<MessageSquare size={18} color={SEMANTIC_COLORS.textMain} />}
        />
        <StatCard
          label="Total"
          value={breakdown.total.total_tokens.toLocaleString()}
          icon={<Gauge size={18} color={SEMANTIC_COLORS.textMain} />}
        />
        <StatCard
          label="USD"
          value={breakdown.total.cost_usd == null ? '-' : `$${breakdown.total.cost_usd.toFixed(6)}`}
          icon={<Zap size={18} color={SEMANTIC_COLORS.textMain} />}
        />
      </View>
    </Section>
  )
}

export default function AdminAILogDetailScreen() {
  const router = useRouter()
  const { logId } = useLocalSearchParams<{ logId: string }>()
  const { user, isAuthenticated } = useAuthStore()
  const [refreshing, setRefreshing] = useState(false)
  const isAdmin = user?.role === 'admin' || user?.role === 'moderator'
  const logQuery = useAILogDetail(logId ?? '')
  const log = logQuery.data

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await logQuery.refetch()
    setRefreshing(false)
  }, [logQuery])

  if (!isAuthenticated || !isAdmin) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.navbar}>
          <Button variant="ghost" size="sm" leftIcon={ArrowLeft} onPress={() => router.back()}>
            返回
          </Button>
        </View>
        <EmptyState
          icon={Activity}
          title="需要管理員權限"
          description="請使用具備管理權限的帳號登入。"
          actionLabel="回到 AI 日誌"
          onAction={() => router.replace('/admin/ai/logs' as never)}
          style={styles.fullState}
        />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.navbar}>
        <Button variant="ghost" size="sm" leftIcon={ArrowLeft} onPress={() => router.back()}>
          返回
        </Button>
        <View style={styles.navTitle}>
          <Activity size={18} color={SEMANTIC_COLORS.textMain} />
          <Text variant="h4" fontWeight="600">
            日誌詳情
          </Text>
        </View>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={RefreshCw}
          onPress={handleRefresh}
          loading={refreshing}
          style={styles.refreshButton}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {logQuery.isLoading ? (
          <LoadingSpinner size="large" style={styles.loading} />
        ) : logQuery.error || !log ? (
          <EmptyState
            icon={Activity}
            title="找不到此日誌記錄"
            description="此記錄可能已不存在，或目前帳號沒有權限。"
            actionLabel="回到日誌列表"
            onAction={() => router.replace('/admin/ai/logs' as never)}
            style={styles.stateCard}
          />
        ) : (
          <>
            <View style={styles.header}>
              <Text variant="h2" fontWeight="700">
                AI 查詢詳情
              </Text>
              <Text variant="caption" color="textMuted">
                ID: {log.id}
              </Text>
            </View>

            <View style={styles.metricGrid}>
              <StatCard
                label="使用者"
                value={log.user?.display_name || log.user?.username || '匿名'}
                icon={<User size={18} color={SEMANTIC_COLORS.textMain} />}
              />
              <StatCard
                label="總延遲"
                value={formatLatency(log.latency?.total_ms)}
                icon={<Clock size={18} color={SEMANTIC_COLORS.textMain} />}
              />
              <StatCard
                label="時間"
                value={formatTime(log.created_at)}
                icon={<Clock size={18} color={SEMANTIC_COLORS.textMain} />}
              />
              <StatCard
                label="來源"
                value={`${log.sources?.length ?? 0} 筆`}
                icon={<FileText size={18} color={SEMANTIC_COLORS.textMain} />}
              />
            </View>

            <TokenSection log={log} />

            <Section
              title="使用者查詢"
              icon={<MessageSquare size={18} color={SEMANTIC_COLORS.textSubtle} />}
            >
              <Text variant="body" style={styles.longText}>
                {log.query}
              </Text>
            </Section>

            <PipelineSection log={log} />

            <Section title="延遲分解" icon={<Clock size={18} color={SEMANTIC_COLORS.textSubtle} />}>
              <View style={styles.latencyGrid}>
                <Text variant="caption" color="textSubtle">
                  Embedding {formatLatency(log.latency?.embedding_ms)}
                </Text>
                <Text variant="caption" color="textSubtle">
                  Retrieval {formatLatency(log.latency?.retrieval_ms)}
                </Text>
                <Text variant="caption" color="textSubtle">
                  Generation {formatLatency(log.latency?.generation_ms)}
                </Text>
              </View>
            </Section>

            <Section
              title="品質評估"
              icon={<Shield size={18} color={SEMANTIC_COLORS.textSubtle} />}
            >
              <View style={styles.scoreBlock}>
                <ScoreBar label="Groundedness" value={log.quality?.groundedness_score} />
                <ScoreBar label="Auto" value={log.quality?.auto_score} max={4} />
                <ScoreBar label="Feedback" value={log.quality?.feedback_score} max={5} />
              </View>
              {log.quality?.feedback_text && (
                <Text variant="caption" color="textSubtle" style={styles.feedbackText}>
                  {log.quality.feedback_text}
                </Text>
              )}
              {log.quality?.flags?.length > 0 && (
                <View style={styles.flagList}>
                  {log.quality.flags.map((flag, index) => (
                    <View key={`${flag.type}-${index}`} style={styles.flagItem}>
                      <CheckCircle size={13} color={flag.is_reviewed ? '#059669' : '#D97706'} />
                      <Text variant="caption" color="textSubtle">
                        {flag.type} · {flag.is_reviewed ? '已審核' : '未審核'}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </Section>

            {log.response && (
              <Section
                title="AI 回答"
                icon={<MessageSquare size={18} color={SEMANTIC_COLORS.textSubtle} />}
              >
                <Text variant="body" style={styles.longText}>
                  {log.response}
                </Text>
              </Section>
            )}

            {log.sources?.length > 0 && (
              <Section
                title={`參考來源 (${log.sources.length})`}
                icon={<FileText size={18} color={SEMANTIC_COLORS.textSubtle} />}
              >
                <View style={styles.sourceList}>
                  {log.sources.map((source, index) => (
                    <View key={`${source.title}-${index}`} style={styles.sourceItem}>
                      <View style={styles.sourceType}>
                        <Text variant="caption" color="textSubtle">
                          {source.type || '-'}
                        </Text>
                      </View>
                      <Text variant="body" numberOfLines={2} style={styles.sourceTitle}>
                        {source.title || '未命名來源'}
                      </Text>
                      {source.score != null && (
                        <Text variant="caption" color="textMuted">
                          {(source.score * 100).toFixed(1)}%
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              </Section>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SEMANTIC_COLORS.pageBg },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: WB_COLORS[20],
  },
  navTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  refreshButton: { minWidth: 44 },
  scrollView: { flex: 1 },
  scrollContent: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  header: { gap: 6, marginBottom: SPACING.lg },
  fullState: { flex: 1 },
  loading: { paddingVertical: 80 },
  stateCard: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginBottom: SPACING.lg },
  statCard: {
    width: '47%',
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WB_COLORS[10],
  },
  statText: { flex: 1 },
  card: {
    gap: SPACING.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  longText: { lineHeight: 22 },
  pipelineList: { gap: SPACING.sm },
  pipelineItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  pipelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SEMANTIC_COLORS.textMain,
  },
  pipelineDotMuted: { backgroundColor: WB_COLORS[30] },
  pipelineIndex: { color: WB_COLORS[0] },
  pipelineBody: { flex: 1 },
  stageBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  stageDone: { backgroundColor: '#ECFDF5' },
  stageSkipped: { backgroundColor: WB_COLORS[10] },
  stageTextDone: { color: '#047857' },
  stageTextSkipped: { color: SEMANTIC_COLORS.textMuted },
  latencyGrid: { gap: SPACING.sm },
  scoreBlock: { gap: SPACING.sm },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  scoreLabel: { width: 88 },
  scoreTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: WB_COLORS[10],
  },
  scoreFill: { height: '100%', borderRadius: 3 },
  scoreValue: { width: 42, textAlign: 'right' },
  feedbackText: { marginTop: SPACING.sm },
  flagList: { gap: 6, marginTop: SPACING.sm },
  flagItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sourceList: { gap: SPACING.sm },
  sourceItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  sourceType: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    backgroundColor: WB_COLORS[10],
  },
  sourceTitle: { flex: 1 },
})
