import { RADIUS, SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import { useRouter } from 'expo-router'
import {
  ArrowLeft,
  BarChart3,
  Calculator,
  CalendarDays,
  Database,
  Info,
  RefreshCw,
  TrendingDown,
  Zap,
} from 'lucide-react-native'
import type React from 'react'
import { useCallback, useMemo, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, EmptyState, Text } from '@/components/ui'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
  type CostProvider,
  DEFAULT_COST_PROVIDERS,
  useAIConfig,
  useAIStats,
} from '@/lib/hooks/useAdminDashboard'
import { useAuthStore } from '@/store/authStore'

type RangePreset = 'today' | '7d' | '30d' | '90d' | 'custom'

const presets: Array<{ key: RangePreset; label: string; days?: number }> = [
  { key: 'today', label: '今日', days: 0 },
  { key: '7d', label: '7 天', days: 7 },
  { key: '30d', label: '30 天', days: 30 },
  { key: '90d', label: '90 天', days: 90 },
  { key: 'custom', label: '自訂' },
]

function dateTaipei(daysAgo = 0) {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' })
}

function formatNumber(value: number) {
  return value.toLocaleString('en-US')
}

function formatUSD(value: number) {
  if (value < 0.001) return `$${value.toFixed(6)}`
  if (value < 1) return `$${value.toFixed(4)}`
  return `$${value.toFixed(2)}`
}

function calcCost(inputTokens: number, outputTokens: number, provider: CostProvider) {
  return (inputTokens * provider.input_per_1m + outputTokens * provider.output_per_1m) / 1_000_000
}

function parseProviders(config?: Record<string, string>) {
  try {
    const raw = config?.cost_providers
    const parsed = raw ? JSON.parse(raw) : []
    if (Array.isArray(parsed) && parsed.length > 0) return parsed as CostProvider[]
  } catch {
    /* use defaults */
  }
  return DEFAULT_COST_PROVIDERS
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

function CostRows({
  providers,
  inputTokens,
  outputTokens,
}: {
  providers: CostProvider[]
  inputTokens: number
  outputTokens: number
}) {
  const rows = useMemo(
    () =>
      providers
        .map((provider) => ({ provider, usd: calcCost(inputTokens, outputTokens, provider) }))
        .sort((a, b) => a.usd - b.usd),
    [inputTokens, outputTokens, providers]
  )
  const cheapest = rows[0]?.usd ?? Infinity

  return (
    <View style={styles.providerList}>
      {rows.map(({ provider, usd }) => {
        const isCheapest = usd <= cheapest
        return (
          <View key={provider.id} style={[styles.providerRow, isCheapest && styles.providerBest]}>
            <View style={styles.providerInfo}>
              <Text
                variant="bodyBold"
                numberOfLines={1}
                style={isCheapest ? styles.bestText : undefined}
              >
                {provider.name}
              </Text>
              <Text variant="caption" color="textMuted">
                in ${provider.input_per_1m}/1M · out ${provider.output_per_1m}/1M
              </Text>
            </View>
            <View style={styles.providerCost}>
              <Text variant="bodyBold" style={isCheapest ? styles.bestText : undefined}>
                {formatUSD(usd)}
              </Text>
              <Text variant="caption" color="textMuted">
                NT${(usd * 32).toFixed(2)}
              </Text>
            </View>
          </View>
        )
      })}
    </View>
  )
}

export default function AdminAICostsScreen() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [preset, setPreset] = useState<RangePreset>('30d')
  const [refreshing, setRefreshing] = useState(false)
  const [simInput, setSimInput] = useState('10000')
  const [simOutput, setSimOutput] = useState('5000')
  const [customFrom, setCustomFrom] = useState(dateTaipei(30))
  const [customTo, setCustomTo] = useState(dateTaipei(0))

  const isAdmin = user?.role === 'admin' || user?.role === 'moderator'
  const selected = presets.find((item) => item.key === preset) ?? presets[2]
  const range = useMemo(
    () => ({
      from: selected.key === 'custom' ? customFrom : dateTaipei(selected.days ?? 30),
      to: selected.key === 'custom' ? customTo : dateTaipei(0),
    }),
    [customFrom, customTo, selected.days, selected.key]
  )
  const statsQuery = useAIStats(range)
  const configQuery = useAIConfig()
  const providers = useMemo(() => parseProviders(configQuery.data), [configQuery.data])
  const stats = statsQuery.data

  const promptTokens = stats
    ? stats.trace_count > 0
      ? stats.total_prompt_tokens
      : Math.round(stats.total_tokens * 0.4)
    : 0
  const completionTokens = stats
    ? stats.trace_count > 0
      ? stats.total_completion_tokens
      : stats.total_tokens - Math.round(stats.total_tokens * 0.4)
    : 0
  const cacheHitRate =
    stats && stats.total_queries > 0
      ? `${((stats.cache_hits / stats.total_queries) * 100).toFixed(1)}%`
      : '0%'
  const hasPartialTrace = stats
    ? stats.trace_count > 0 && stats.trace_count < stats.total_queries
    : false

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([statsQuery.refetch(), configQuery.refetch()])
    setRefreshing(false)
  }, [configQuery, statsQuery])

  if (!isAuthenticated || !isAdmin) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.navbar}>
          <Button variant="ghost" size="sm" leftIcon={ArrowLeft} onPress={() => router.back()}>
            返回
          </Button>
        </View>
        <EmptyState
          icon={Calculator}
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
          <Calculator size={18} color={SEMANTIC_COLORS.textMain} />
          <Text variant="h4" fontWeight="600">
            費用估算
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
            AI 費用估算
          </Text>
          <Text variant="body" color="textSubtle">
            依 token 使用量比較不同模型供應商成本，並支援未來用量模擬。
          </Text>
        </View>

        <View style={styles.tabs}>
          {presets.map((item) => (
            <Pressable
              key={item.key}
              style={[styles.tabButton, preset === item.key && styles.tabButtonActive]}
              onPress={() => setPreset(item.key)}
            >
              <Text
                variant="caption"
                fontWeight="600"
                style={preset === item.key ? styles.tabTextActive : styles.tabText}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text variant="caption" color="textMuted" style={styles.rangeText}>
          {range.from} - {range.to}
        </Text>

        {preset === 'custom' && (
          <View style={styles.customRangeCard}>
            <View style={styles.customRangeTitle}>
              <CalendarDays size={16} color={SEMANTIC_COLORS.textMain} />
              <Text variant="bodyBold">自訂時間區間</Text>
            </View>
            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text variant="caption" color="textSubtle">
                  開始日期
                </Text>
                <TextInput
                  value={customFrom}
                  onChangeText={setCustomFrom}
                  placeholder="YYYY-MM-DD"
                  keyboardType="numbers-and-punctuation"
                  style={styles.input}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text variant="caption" color="textSubtle">
                  結束日期
                </Text>
                <TextInput
                  value={customTo}
                  onChangeText={setCustomTo}
                  placeholder="YYYY-MM-DD"
                  keyboardType="numbers-and-punctuation"
                  style={styles.input}
                />
              </View>
            </View>
          </View>
        )}

        {statsQuery.isLoading ? (
          <LoadingSpinner size="large" style={styles.loading} />
        ) : !stats ? (
          <EmptyState
            icon={BarChart3}
            title="無法載入成本資料"
            description="請稍後重試，或確認帳號權限是否仍有效。"
            actionLabel="重新載入"
            onAction={handleRefresh}
            style={styles.stateCard}
          />
        ) : (
          <>
            <View style={styles.statGrid}>
              <StatCard
                label="查詢次數"
                value={formatNumber(stats.total_queries)}
                icon={<BarChart3 size={20} color={SEMANTIC_COLORS.textMain} />}
              />
              <StatCard
                label="Input tokens"
                value={formatNumber(promptTokens)}
                subtitle={stats.trace_count > 0 ? '實際數據' : '40% 估算'}
                icon={<Zap size={20} color={SEMANTIC_COLORS.textMain} />}
              />
              <StatCard
                label="Output tokens"
                value={formatNumber(completionTokens)}
                subtitle={stats.trace_count > 0 ? '實際數據' : '60% 估算'}
                icon={<TrendingDown size={20} color={SEMANTIC_COLORS.textMain} />}
              />
              <StatCard
                label="快取命中率"
                value={cacheHitRate}
                subtitle={`${formatNumber(stats.cache_hits)} 次命中`}
                icon={<Database size={20} color={SEMANTIC_COLORS.textMain} />}
              />
            </View>

            <View style={styles.averageRow}>
              <TrendingDown size={14} color={SEMANTIC_COLORS.textMuted} />
              <Text variant="caption" color="textMuted">
                平均每查詢 tokens：
              </Text>
              <Text variant="caption" fontWeight="700">
                {formatNumber(stats.avg_tokens)}
              </Text>
            </View>

            {hasPartialTrace && (
              <View style={styles.warningCard}>
                <Info size={16} color="#B45309" />
                <Text variant="caption" style={styles.warningText}>
                  部分舊記錄無詳細 token 分拆（{formatNumber(stats.trace_count)} /{' '}
                  {formatNumber(stats.total_queries)} 筆有詳細資料），費用數據已略過無 trace
                  的記錄。
                </Text>
              </View>
            )}

            <View style={styles.card}>
              <Text variant="bodyBold" style={styles.cardTitle}>
                供應商費用對照
              </Text>
              <Text variant="caption" color="textSubtle" style={styles.cardSubtitle}>
                基於 Input {formatNumber(promptTokens)} + Output {formatNumber(completionTokens)}{' '}
                tokens
              </Text>
              <CostRows
                providers={providers}
                inputTokens={promptTokens}
                outputTokens={completionTokens}
              />
            </View>
          </>
        )}

        <View style={styles.card}>
          <Text variant="bodyBold" style={styles.cardTitle}>
            未來費用模擬
          </Text>
          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text variant="caption" color="textSubtle">
                Input tokens
              </Text>
              <TextInput
                value={simInput}
                onChangeText={setSimInput}
                keyboardType="number-pad"
                style={styles.input}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text variant="caption" color="textSubtle">
                Output tokens
              </Text>
              <TextInput
                value={simOutput}
                onChangeText={setSimOutput}
                keyboardType="number-pad"
                style={styles.input}
              />
            </View>
          </View>
          <CostRows
            providers={providers}
            inputTokens={Number(simInput) || 0}
            outputTokens={Number(simOutput) || 0}
          />
        </View>
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
  tabs: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  tabButton: {
    minWidth: 60,
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: WB_COLORS[10],
  },
  tabButtonActive: { backgroundColor: SEMANTIC_COLORS.textMain },
  tabText: { color: SEMANTIC_COLORS.textSubtle },
  tabTextActive: { color: WB_COLORS[0] },
  rangeText: { marginBottom: SPACING.lg },
  customRangeCard: {
    gap: SPACING.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  customRangeTitle: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginBottom: SPACING.lg },
  averageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: -SPACING.sm,
    marginBottom: SPACING.md,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#FCD34D',
    backgroundColor: '#FFFBEB',
  },
  warningText: { flex: 1, color: '#B45309' },
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
    gap: SPACING.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  cardTitle: { marginBottom: -SPACING.xs },
  cardSubtitle: { marginBottom: SPACING.xs },
  providerList: { gap: SPACING.sm },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: WB_COLORS[10],
  },
  providerBest: { backgroundColor: '#ECFDF5' },
  providerInfo: { flex: 1 },
  providerCost: { alignItems: 'flex-end' },
  bestText: { color: '#047857' },
  inputRow: { flexDirection: 'row', gap: SPACING.md },
  inputGroup: { flex: 1, gap: 6 },
  input: {
    minHeight: 44,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
    color: SEMANTIC_COLORS.textMain,
    backgroundColor: WB_COLORS[0],
  },
})
