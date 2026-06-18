import { RADIUS, SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import { useRouter } from 'expo-router'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Clock,
  Database,
  RefreshCw,
  Shield,
  TrendingUp,
} from 'lucide-react-native'
import type React from 'react'
import { useCallback, useMemo, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, EmptyState, Text } from '@/components/ui'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { type MetricsDaily, type MetricsRange, useAIMetrics } from '@/lib/hooks/useAdminDashboard'
import { useAuthStore } from '@/store/authStore'

const ranges: Array<{ value: MetricsRange; label: string }> = [
  { value: '7d', label: '7 天' },
  { value: '30d', label: '30 天' },
  { value: '90d', label: '90 天' },
]

const queryTypeLabels: Record<string, string> = {
  simple: '簡單',
  complex: '複雜',
  'general-knowledge': '通識',
  guardrails_blocked: '攔截',
}

const latencySeries: Array<{ key: keyof MetricsDaily['latency']; label: string }> = [
  { key: 'embedding_p50', label: 'Embed P50' },
  { key: 'embedding_p95', label: 'Embed P95' },
  { key: 'retrieval_p50', label: 'Retrieval P50' },
  { key: 'retrieval_p95', label: 'Retrieval P95' },
  { key: 'generation_p50', label: 'Gen P50' },
  { key: 'generation_p95', label: 'Gen P95' },
]

const qualitySeries: Array<{ key: keyof MetricsDaily['quality']; label: string; max: number }> = [
  { key: 'avg_groundedness', label: 'Groundedness', max: 1 },
  { key: 'avg_auto_score', label: 'Auto Score', max: 4 },
  { key: 'avg_feedback_score', label: 'Feedback', max: 5 },
]

function formatLatency(value: number | null) {
  if (value == null) return '-'
  if (value < 1000) return `${Math.round(value)}ms`
  return `${(value / 1000).toFixed(1)}s`
}

function StatCard({
  label,
  value,
  subtitle,
  icon,
}: {
  label: string
  value: string
  subtitle?: string
  icon: React.ReactNode
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>{icon}</View>
      <View style={styles.statText}>
        <Text variant="caption" color="textSubtle">
          {label}
        </Text>
        <Text variant="h3" fontWeight="700">
          {value}
        </Text>
        {subtitle && (
          <Text variant="caption" color="textMuted" numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  )
}

function BarChart({
  title,
  data,
  getValue,
  formatValue = (value) => String(Math.round(value)),
  anomalyPrefix,
}: {
  title: string
  data: MetricsDaily[]
  getValue: (_day: MetricsDaily) => number | null
  formatValue?: (_value: number) => string
  anomalyPrefix?: string
}) {
  const values = data.map((item) => getValue(item) ?? 0)
  const max = Math.max(...values, 1)
  const hasAnomaly = anomalyPrefix
    ? data.some((item) => item.anomalies.some((anomaly) => anomaly.startsWith(anomalyPrefix)))
    : false

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text variant="bodyBold">{title}</Text>
        {hasAnomaly && <AlertTriangle size={16} color="#DC2626" />}
      </View>
      {data.length === 0 ? (
        <Text variant="body" color="textSubtle" align="center" style={styles.emptyText}>
          尚無資料
        </Text>
      ) : (
        <>
          <View style={styles.chart}>
            {data.map((item) => {
              const value = getValue(item) ?? 0
              const anomalous =
                anomalyPrefix && item.anomalies.some((anomaly) => anomaly.startsWith(anomalyPrefix))
              return (
                <View key={item.date} style={styles.chartColumn}>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        height: `${Math.max(3, (value / max) * 100)}%`,
                        backgroundColor: anomalous ? '#DC2626' : SEMANTIC_COLORS.textMain,
                      },
                    ]}
                  />
                </View>
              )
            })}
          </View>
          <View style={styles.chartFooter}>
            <Text variant="caption" color="textMuted">
              {data[0]?.date.slice(5)}
            </Text>
            <Text variant="caption" color="textSubtle">
              最高 {formatValue(max)}
            </Text>
            <Text variant="caption" color="textMuted">
              {data[data.length - 1]?.date.slice(5)}
            </Text>
          </View>
        </>
      )}
    </View>
  )
}

function QueryTypeDistribution({ data }: { data: MetricsDaily[] }) {
  const totals = useMemo(() => {
    const result: Record<string, number> = {}
    for (const day of data) {
      for (const [key, value] of Object.entries(day.query_types)) {
        result[key] = (result[key] ?? 0) + value
      }
    }
    return Object.entries(result).sort((a, b) => b[1] - a[1])
  }, [data])
  const max = Math.max(...totals.map(([, value]) => value), 1)

  return (
    <View style={styles.card}>
      <Text variant="bodyBold" style={styles.cardTitle}>
        查詢類型分佈
      </Text>
      {totals.length === 0 ? (
        <Text variant="body" color="textSubtle" align="center" style={styles.emptyText}>
          尚無資料
        </Text>
      ) : (
        <View style={styles.typeList}>
          {totals.map(([key, value]) => (
            <View key={key} style={styles.typeItem}>
              <View style={styles.typeLabelRow}>
                <Text variant="caption" color="textSubtle">
                  {queryTypeLabels[key] ?? key}
                </Text>
                <Text variant="caption" fontWeight="600">
                  {value.toLocaleString()}
                </Text>
              </View>
              <View style={styles.typeTrack}>
                <View
                  style={[styles.typeFill, { width: `${Math.max(4, (value / max) * 100)}%` }]}
                />
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

function LatestMetricBreakdown({ data }: { data: MetricsDaily[] }) {
  const latest = data[data.length - 1]
  if (!latest) return null

  return (
    <View style={styles.card}>
      <Text variant="bodyBold" style={styles.cardTitle}>
        最新分項指標
      </Text>

      <View style={styles.breakdownSection}>
        <Text variant="caption" color="textMuted">
          延遲
        </Text>
        {latencySeries.map((item) => (
          <View key={item.key} style={styles.breakdownRow}>
            <Text variant="caption" color="textSubtle" style={styles.breakdownLabel}>
              {item.label}
            </Text>
            <Text variant="caption" fontWeight="600">
              {formatLatency(latest.latency[item.key])}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.breakdownSection}>
        <Text variant="caption" color="textMuted">
          品質
        </Text>
        {qualitySeries.map((item) => {
          const value = latest.quality[item.key]
          const percent = value == null ? 0 : Math.min(100, Math.max(0, (value / item.max) * 100))
          return (
            <View key={item.key} style={styles.qualityRow}>
              <Text variant="caption" color="textSubtle" style={styles.breakdownLabel}>
                {item.label}
              </Text>
              <View style={styles.qualityTrack}>
                {value != null && <View style={[styles.qualityFill, { width: `${percent}%` }]} />}
              </View>
              <Text variant="caption" fontWeight="600" style={styles.qualityValue}>
                {value == null ? '-' : item.max === 1 ? value.toFixed(2) : value.toFixed(1)}
              </Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

function AnomalySummary({ data }: { data: MetricsDaily[] }) {
  const items = data.flatMap((day) =>
    day.anomalies.map((anomaly) => ({
      date: day.date,
      anomaly,
    }))
  )

  if (items.length === 0) return null

  return (
    <View style={[styles.card, styles.anomalyCard]}>
      <View style={styles.cardHeader}>
        <View style={styles.anomalyTitle}>
          <AlertTriangle size={16} color="#B91C1C" />
          <Text variant="bodyBold" style={styles.anomalyText}>
            異常偵測
          </Text>
        </View>
        <Text variant="caption" style={styles.anomalyText}>
          {items.length} 筆
        </Text>
      </View>
      <View style={styles.anomalyList}>
        {items.slice(-8).map((item, index) => (
          <View key={`${item.date}-${item.anomaly}-${index}`} style={styles.anomalyItem}>
            <Text variant="caption" style={styles.anomalyText}>
              {item.date.slice(5)}
            </Text>
            <Text variant="caption" style={[styles.anomalyText, styles.anomalyDescription]}>
              {item.anomaly}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}

export default function AdminAIMetricsScreen() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [range, setRange] = useState<MetricsRange>('30d')
  const [refreshing, setRefreshing] = useState(false)
  const isAdmin = user?.role === 'admin' || user?.role === 'moderator'
  const metricsQuery = useAIMetrics(range)
  const data = metricsQuery.data

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await metricsQuery.refetch()
    setRefreshing(false)
  }, [metricsQuery])

  if (!isAuthenticated || !isAdmin) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.navbar}>
          <Button variant="ghost" size="sm" leftIcon={ArrowLeft} onPress={() => router.back()}>
            返回
          </Button>
        </View>
        <EmptyState
          icon={TrendingUp}
          title="需要管理員權限"
          description="請使用具備管理權限的帳號登入。"
          actionLabel="回到 AI 管理"
          onAction={() => router.replace('/admin/ai' as never)}
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
          <TrendingUp size={18} color={SEMANTIC_COLORS.textMain} />
          <Text variant="h4" fontWeight="600">
            趨勢分析
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
        <View style={styles.header}>
          <Text variant="h2" fontWeight="700">
            AI 趨勢分析
          </Text>
          <Text variant="body" color="textSubtle">
            追蹤延遲、品質、快取效率與查詢類型分佈。
          </Text>
        </View>

        <View style={styles.tabs}>
          {ranges.map((item) => (
            <Pressable
              key={item.value}
              style={[styles.tabButton, range === item.value && styles.tabButtonActive]}
              onPress={() => setRange(item.value)}
            >
              <Text
                variant="caption"
                fontWeight="600"
                style={range === item.value ? styles.tabTextActive : styles.tabText}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {metricsQuery.isLoading ? (
          <LoadingSpinner size="large" style={styles.loading} />
        ) : metricsQuery.error || !data ? (
          <EmptyState
            icon={AlertCircle}
            title="無法載入趨勢資料"
            description="請稍後重試，或確認帳號權限是否仍有效。"
            actionLabel="重新載入"
            onAction={handleRefresh}
            style={styles.stateCard}
          />
        ) : (
          <>
            <View style={styles.statGrid}>
              <StatCard
                label="總查詢"
                value={data.summary.total_queries.toLocaleString()}
                subtitle={`過去 ${range.replace('d', ' 天')}`}
                icon={<TrendingUp size={20} color={SEMANTIC_COLORS.textMain} />}
              />
              <StatCard
                label="平均延遲"
                value={formatLatency(data.summary.avg_latency_ms)}
                icon={<Clock size={20} color={SEMANTIC_COLORS.textMain} />}
              />
              <StatCard
                label="Groundedness"
                value={
                  data.summary.avg_groundedness == null
                    ? '-'
                    : data.summary.avg_groundedness.toFixed(2)
                }
                icon={<Shield size={20} color={SEMANTIC_COLORS.textMain} />}
              />
              <StatCard
                label="快取命中率"
                value={
                  data.summary.cache_hit_rate == null
                    ? '-'
                    : `${(data.summary.cache_hit_rate * 100).toFixed(0)}%`
                }
                icon={<Database size={20} color={SEMANTIC_COLORS.textMain} />}
              />
            </View>

            <BarChart title="每日查詢量" data={data.daily} getValue={(day) => day.query_count} />
            <LatestMetricBreakdown data={data.daily} />
            <AnomalySummary data={data.daily} />
            <BarChart
              title="總延遲 P95"
              data={data.daily}
              getValue={(day) => day.latency.total_p95}
              formatValue={(value) => `${Math.round(value)}ms`}
              anomalyPrefix="latency"
            />
            <BarChart
              title="品質 Groundedness"
              data={data.daily}
              getValue={(day) => day.quality.avg_groundedness}
              formatValue={(value) => value.toFixed(2)}
              anomalyPrefix="quality"
            />
            <BarChart
              title="快取命中率"
              data={data.daily}
              getValue={(day) => day.cache.hit_rate}
              formatValue={(value) => `${Math.round(value * 100)}%`}
              anomalyPrefix="cache"
            />
            <QueryTypeDistribution data={data.daily} />
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
  tabs: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: WB_COLORS[10],
  },
  tabButtonActive: { backgroundColor: SEMANTIC_COLORS.textMain },
  tabText: { color: SEMANTIC_COLORS.textSubtle },
  tabTextActive: { color: WB_COLORS[0] },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginBottom: SPACING.lg },
  statCard: {
    width: '47%',
    minHeight: 104,
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
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WB_COLORS[10],
  },
  statText: { flex: 1 },
  card: {
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  cardTitle: { marginBottom: SPACING.md },
  breakdownSection: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  breakdownLabel: {
    width: 100,
  },
  qualityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  qualityTrack: {
    flex: 1,
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: WB_COLORS[10],
  },
  qualityFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: SEMANTIC_COLORS.textMain,
  },
  qualityValue: {
    width: 42,
    textAlign: 'right',
  },
  anomalyCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  anomalyTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  anomalyList: {
    gap: SPACING.xs,
  },
  anomalyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  anomalyText: {
    color: '#B91C1C',
  },
  anomalyDescription: {
    flex: 1,
  },
  chart: {
    height: 150,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  chartColumn: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  chartFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  emptyText: { paddingVertical: SPACING.xl },
  typeList: { gap: SPACING.sm },
  typeItem: { gap: 6 },
  typeLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  typeTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: WB_COLORS[10],
  },
  typeFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: SEMANTIC_COLORS.textMain,
  },
})
