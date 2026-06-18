import { RADIUS, SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Bot,
  Calculator,
  CheckCircle,
  Clock,
  Database,
  FileText,
  ListChecks,
  MessageSquare,
  RefreshCw,
  Settings,
  TrendingUp,
  Zap,
} from 'lucide-react-native'
import type React from 'react'
import { useCallback, useMemo, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, EmptyState, Text } from '@/components/ui'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAIConfig, useAIDashboard, useAIStats } from '@/lib/hooks/useAdminDashboard'
import { useAuthStore } from '@/store/authStore'

const FREE_TIER_NEURONS = 10_000
const COST_PER_1K_NEURONS = 0.011
const NEURONS_PER_TOKEN = (0.4 * 31.371 + 0.6 * 50.56) / 1000

function todayTaipei() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function estimateNeurons(tokens: number) {
  return Math.round(tokens * NEURONS_PER_TOKEN)
}

function formatNumber(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toLocaleString()
}

function formatLatency(value: number | null) {
  if (value == null) return '-'
  if (value < 1000) return `${value}ms`
  return `${(value / 1000).toFixed(1)}s`
}

function MetricCard({
  label,
  value,
  icon,
  subtitle,
}: {
  label: string
  value: number | string
  icon: React.ReactNode
  subtitle?: string
}) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricIcon}>{icon}</View>
      <View style={styles.metricText}>
        <Text variant="caption" color="textSubtle">
          {label}
        </Text>
        <Text variant="h3" fontWeight="700">
          {typeof value === 'number' ? value.toLocaleString() : value}
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

function AdminLink({
  title,
  description,
  icon,
  onPress,
  disabled,
}: {
  title: string
  description: string
  icon: React.ReactNode
  onPress?: () => void
  disabled?: boolean
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.linkCard, pressed && styles.pressed]}
      onPress={onPress}
      disabled={disabled || !onPress}
    >
      <View style={[styles.linkIcon, disabled && styles.disabledIcon]}>{icon}</View>
      <View style={styles.linkText}>
        <Text variant="bodyBold">{title}</Text>
        <Text variant="caption" color="textSubtle">
          {description}
        </Text>
      </View>
      {disabled && (
        <Text variant="caption" color="textMuted">
          待補
        </Text>
      )}
    </Pressable>
  )
}

function MiniBarChart({
  title,
  data,
  valueKey,
}: {
  title: string
  data: Array<{ day: string; count?: number; tokens?: number }>
  valueKey: 'count' | 'tokens'
}) {
  const max = Math.max(...data.map((item) => item[valueKey] ?? 0), 1)

  return (
    <View style={styles.card}>
      <Text variant="bodyBold" style={styles.cardTitle}>
        {title}
      </Text>
      {data.length === 0 ? (
        <Text variant="body" color="textSubtle" align="center" style={styles.emptyText}>
          尚無資料
        </Text>
      ) : (
        <View style={styles.chart}>
          {data.map((item) => {
            const value = item[valueKey] ?? 0
            return (
              <View key={item.day} style={styles.chartColumn}>
                <Text variant="caption" color="textMuted" numberOfLines={1}>
                  {valueKey === 'tokens' ? formatNumber(value) : value}
                </Text>
                <View style={styles.chartTrack}>
                  <View
                    style={[styles.chartBar, { height: `${Math.max(4, (value / max) * 100)}%` }]}
                  />
                </View>
                <Text variant="caption" color="textMuted" numberOfLines={1}>
                  {item.day.slice(5)}
                </Text>
              </View>
            )
          })}
        </View>
      )}
    </View>
  )
}

export default function AdminAIIndexScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, isAuthenticated } = useAuthStore()
  const [refreshing, setRefreshing] = useState(false)

  const isAdmin = user?.role === 'admin' || user?.role === 'moderator'
  const { data, isLoading, error } = useAIDashboard()
  const { data: aiConfig } = useAIConfig()
  const today = useMemo(() => todayTaipei(), [])
  const { data: todayStats } = useAIStats({ from: today, to: today })

  const providerCount = useMemo(() => {
    try {
      const raw = aiConfig?.cost_providers
      const parsed = raw ? JSON.parse(raw) : []
      return Array.isArray(parsed) ? parsed.length : 0
    } catch {
      return 0
    }
  }, [aiConfig])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-ai-dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-ai-config'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-ai-stats'] }),
    ])
    setRefreshing(false)
  }, [queryClient])

  if (!isAuthenticated || !isAdmin) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.navbar}>
          <Button variant="ghost" size="sm" leftIcon={ArrowLeft} onPress={() => router.back()}>
            返回
          </Button>
        </View>
        <EmptyState
          icon={BarChart3}
          title="需要管理員權限"
          description="請使用具備管理權限的帳號登入。"
          actionLabel="回到管理後台"
          onAction={() => router.replace('/admin' as never)}
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
          <BarChart3 size={18} color={SEMANTIC_COLORS.textMain} />
          <Text variant="h4" fontWeight="600">
            AI 管理
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
            AI 助理儀表板
          </Text>
          <Text variant="body" color="textSubtle">
            查詢統計、Neurons 用量、健康狀態與管理入口。
          </Text>
        </View>

        {isLoading ? (
          <LoadingSpinner size="large" style={styles.loading} />
        ) : error || !data ? (
          <EmptyState
            icon={AlertCircle}
            title="無法載入 AI 資料"
            description="請稍後重試，或確認帳號權限是否仍有效。"
            actionLabel="重新載入"
            onAction={handleRefresh}
            style={styles.stateCard}
          />
        ) : (
          <>
            <View style={styles.healthCard}>
              <View style={styles.healthLeft}>
                {data.health.status === 'healthy' ? (
                  <CheckCircle size={20} color="#059669" />
                ) : (
                  <AlertCircle size={20} color="#DC2626" />
                )}
                <View>
                  <Text variant="bodyBold">
                    {data.health.status === 'healthy' ? '服務正常' : '服務異常'}
                  </Text>
                  <Text variant="caption" color="textSubtle">
                    今日 {data.queries_today.toLocaleString()} 次查詢
                  </Text>
                </View>
              </View>
              <Text variant="caption" color="textMuted">
                {providerCount > 0 ? `${providerCount} 個成本模型` : '使用預設成本模型'}
              </Text>
            </View>

            <View style={styles.metricGrid}>
              <MetricCard
                label="總查詢"
                value={data.total_queries}
                icon={<MessageSquare size={20} color={SEMANTIC_COLORS.textMain} />}
              />
              <MetricCard
                label="成功率"
                value={data.success_rate == null ? '-' : `${Math.round(data.success_rate)}%`}
                icon={<CheckCircle size={20} color={SEMANTIC_COLORS.textMain} />}
              />
              <MetricCard
                label="平均延遲"
                value={formatLatency(data.avg_latency_ms)}
                icon={<Clock size={20} color={SEMANTIC_COLORS.textMain} />}
              />
              <MetricCard
                label="Token 總量"
                value={formatNumber(data.total_tokens)}
                icon={<Activity size={20} color={SEMANTIC_COLORS.textMain} />}
                subtitle={`今日 ${formatNumber(data.tokens_today)}`}
              />
            </View>

            <QuotaCard tokensToday={data.tokens_today} />

            <View style={styles.metricGrid}>
              <MetricCard
                label="今日查詢"
                value={todayStats?.total_queries ?? data.queries_today}
                icon={<ListChecks size={20} color={SEMANTIC_COLORS.textMain} />}
              />
              <MetricCard
                label="今日成本"
                value={
                  todayStats?.total_cost_usd == null
                    ? `$${((estimateNeurons(data.tokens_today) / 1000) * COST_PER_1K_NEURONS).toFixed(4)}`
                    : `$${todayStats.total_cost_usd.toFixed(4)}`
                }
                icon={<Zap size={20} color={SEMANTIC_COLORS.textMain} />}
                subtitle={
                  todayStats?.total_cost_twd == null
                    ? undefined
                    : `NT$${todayStats.total_cost_twd.toFixed(2)}`
                }
              />
            </View>

            <MiniBarChart title="過去 7 天查詢量" data={data.queries_weekly} valueKey="count" />
            <MiniBarChart
              title="過去 7 天 Token 用量"
              data={data.tokens_weekly}
              valueKey="tokens"
            />

            <View style={styles.card}>
              <Text variant="bodyBold" style={styles.cardTitle}>
                熱門查詢
              </Text>
              {data.top_queries.length === 0 ? (
                <Text variant="body" color="textSubtle" align="center" style={styles.emptyText}>
                  尚無資料
                </Text>
              ) : (
                <View style={styles.queryList}>
                  {data.top_queries.slice(0, 5).map((item, index) => (
                    <View key={`${item.query}-${index}`} style={styles.queryItem}>
                      <View style={styles.queryBadge}>
                        <Text variant="caption" fontWeight="700">
                          {index + 1}
                        </Text>
                      </View>
                      <Text variant="body" numberOfLines={2} style={styles.queryText}>
                        {item.query}
                      </Text>
                      <Text variant="caption" color="textSubtle">
                        {item.count}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}

        <View style={styles.section}>
          <Text variant="h4" fontWeight="600" style={styles.sectionTitle}>
            AI 管理功能
          </Text>
          <View style={styles.linkList}>
            <AdminLink
              title="查詢日誌"
              description="篩選查詢、品質分數、延遲與高耗用標記"
              icon={<FileText size={20} color={WB_COLORS[0]} />}
              onPress={() => router.push('/admin/ai/logs' as never)}
            />
            <AdminLink
              title="知識庫"
              description="檢視 RAG 資料來源與索引狀態"
              icon={<Database size={20} color={WB_COLORS[0]} />}
              onPress={() => router.push('/admin/ai/knowledge' as never)}
            />
            <AdminLink
              title="費用估算"
              description="比較模型供應商成本並模擬未來 token 用量"
              icon={<Calculator size={20} color={WB_COLORS[0]} />}
              onPress={() => router.push('/admin/ai/costs' as never)}
            />
            <AdminLink
              title="趨勢分析"
              description="追蹤延遲、品質、快取與查詢類型趨勢"
              icon={<TrendingUp size={20} color={WB_COLORS[0]} />}
              onPress={() => router.push('/admin/ai/metrics' as never)}
            />
            <AdminLink
              title="模板與設定"
              description="管理 Prompt 版本與核心提示詞"
              icon={<Settings size={20} color={WB_COLORS[0]} />}
              onPress={() => router.push('/admin/ai/prompts' as never)}
            />
            <AdminLink
              title="ReAct Agent"
              description="啟用 / 停用 ReAct 策略並直接測試查詢 trace"
              icon={<Bot size={20} color={WB_COLORS[0]} />}
              onPress={() => router.push('/admin/ai/react-agent' as never)}
            />
            <AdminLink
              title="Pipeline 設定"
              description="調整模型、檢索、品質、防護、Pipeline 與費用 provider"
              icon={<Settings size={20} color={WB_COLORS[0]} />}
              onPress={() => router.push('/admin/ai/settings' as never)}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function QuotaCard({ tokensToday }: { tokensToday: number }) {
  const neuronsToday = estimateNeurons(tokensToday)
  const usageRatio = Math.min(neuronsToday / FREE_TIER_NEURONS, 1)
  const remaining = Math.max(FREE_TIER_NEURONS - neuronsToday, 0)
  const fillColor = usageRatio >= 0.9 ? '#DC2626' : usageRatio >= 0.7 ? '#F59E0B' : '#10B981'

  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderBetween}>
        <View>
          <Text variant="bodyBold">今日免費額度</Text>
          <Text variant="caption" color="textSubtle">
            10,000 Neurons / 天，UTC 00:00 重置
          </Text>
        </View>
        <Zap size={18} color={fillColor} />
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${usageRatio * 100}%`, backgroundColor: fillColor },
          ]}
        />
      </View>
      <View style={styles.progressMeta}>
        <Text variant="caption" color="textSubtle">
          已用 {neuronsToday.toLocaleString()} ({(usageRatio * 100).toFixed(1)}%)
        </Text>
        <Text variant="caption" color="textSubtle">
          剩餘 {remaining.toLocaleString()}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SEMANTIC_COLORS.pageBg,
  },
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
  navTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refreshButton: {
    minWidth: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  header: {
    gap: 6,
    marginBottom: SPACING.lg,
  },
  fullState: {
    flex: 1,
  },
  loading: {
    paddingVertical: 80,
  },
  stateCard: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  healthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  healthLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  metricCard: {
    width: '47%',
    minHeight: 102,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WB_COLORS[10],
  },
  metricText: {
    flex: 1,
  },
  card: {
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  cardTitle: {
    marginBottom: SPACING.md,
  },
  cardHeaderBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: WB_COLORS[10],
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  chart: {
    height: 164,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  chartTrack: {
    width: '100%',
    height: 112,
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    backgroundColor: SEMANTIC_COLORS.textMain,
  },
  queryList: {
    gap: SPACING.sm,
  },
  queryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  queryBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WB_COLORS[10],
  },
  queryText: {
    flex: 1,
  },
  emptyText: {
    paddingVertical: SPACING.xl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    marginBottom: SPACING.md,
  },
  linkList: {
    gap: SPACING.md,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  pressed: {
    backgroundColor: WB_COLORS[10],
  },
  linkIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SEMANTIC_COLORS.textMain,
  },
  disabledIcon: {
    backgroundColor: WB_COLORS[50],
  },
  linkText: {
    flex: 1,
    gap: 4,
  },
})
