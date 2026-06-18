import { RADIUS, SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import {
  AlertCircle,
  ArrowLeft,
  Bot,
  CheckCircle,
  ExternalLink,
  Play,
  Power,
  RefreshCw,
  RotateCcw,
  Zap,
} from 'lucide-react-native'
import { useCallback, useMemo, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, EmptyState, Text } from '@/components/ui'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
  type AILogDetail,
  useAIConfig,
  useAILogDetail,
  useAskAdminAI,
  useUpdateAIConfig,
} from '@/lib/hooks/useAdminDashboard'
import { useAuthStore } from '@/store/authStore'

type PerModelStat = {
  provider?: string
  model?: string
  prompt_tokens?: number
  completion_tokens?: number
  cost_usd?: number
  cost_twd?: number
}

type ReactTraceData = {
  strategy?: string
  turn_count?: number
  tool_call_count?: number
  per_model_stats?: PerModelStat[]
}

function getReactTrace(log?: AILogDetail): ReactTraceData | null {
  const trace = log?.pipeline_trace
  if (!trace || typeof trace !== 'object') return null
  return trace as ReactTraceData
}

function formatMoney(value: number | undefined, currency: 'usd' | 'twd') {
  if (value == null) return currency === 'usd' ? '$0.000000' : 'NT$0.0000'
  return currency === 'usd' ? `$${value.toFixed(6)}` : `NT$${value.toFixed(4)}`
}

function parseOrchestratorModel(config?: Record<string, string>) {
  const fallback = '@cf/meta/llama-4-scout-17b-16e-instruct'
  try {
    const models = JSON.parse(config?.react_models ?? '{}') as Record<string, { model?: string }>
    return models.orchestrator?.model || fallback
  } catch {
    return fallback
  }
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: 'green' | 'muted'
}) {
  return (
    <View style={styles.statCard}>
      <Text variant="caption" color="textSubtle">
        {label}
      </Text>
      <Text
        variant="bodyBold"
        numberOfLines={2}
        style={accent === 'green' ? styles.greenText : accent === 'muted' ? styles.mutedText : null}
      >
        {value}
      </Text>
    </View>
  )
}

function TraceMetric({ label, value, desc }: { label: string; value: string; desc: string }) {
  return (
    <View style={styles.traceMetric}>
      <Text variant="caption" color="textSubtle">
        {label}
      </Text>
      <Text variant="h4" fontWeight="700">
        {value}
      </Text>
      <Text variant="caption" color="textMuted">
        {desc}
      </Text>
    </View>
  )
}

function ReactTrace({ logId }: { logId: string }) {
  const router = useRouter()
  const { data: log, isLoading, error } = useAILogDetail(logId)
  const trace = getReactTrace(log)
  const isReact = trace?.strategy === 'react'
  const strategy =
    trace?.strategy ?? (log?.pipeline?.query_parsing?.query_type as string | undefined) ?? '-'
  const perModelStats = trace?.per_model_stats ?? []

  if (isLoading) {
    return (
      <View style={styles.card}>
        <LoadingSpinner />
      </View>
    )
  }

  if (error || !log) {
    return (
      <View style={styles.card}>
        <Text variant="bodyBold">無法載入 Trace</Text>
        <Text variant="caption" color="textSubtle">
          查詢已完成，但無法取得執行細節。
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.inlineTitle}>
          <Zap size={16} color={SEMANTIC_COLORS.textMuted} />
          <Text variant="bodyBold">執行 Trace</Text>
        </View>
        <View style={[styles.strategyPill, isReact ? styles.greenPill : styles.grayPill]}>
          <Text variant="caption" style={isReact ? styles.greenText : styles.mutedText}>
            {strategy}
          </Text>
        </View>
      </View>

      <View style={styles.metricGrid}>
        <TraceMetric
          label="Turn 數"
          value={String(trace?.turn_count ?? '-')}
          desc="orchestrator calls"
        />
        <TraceMetric
          label="Tool 呼叫"
          value={String(trace?.tool_call_count ?? '-')}
          desc="tool executions"
        />
        <TraceMetric
          label="總延遲"
          value={log.latency.total_ms ? `${log.latency.total_ms}ms` : '-'}
          desc="end-to-end"
        />
      </View>

      {perModelStats.length > 0 && (
        <View style={styles.modelList}>
          <Text variant="caption" color="textSubtle" fontWeight="600">
            各模型用量
          </Text>
          {perModelStats.map((item, index) => (
            <View key={`${item.model}-${index}`} style={styles.modelRow}>
              <View style={styles.modelText}>
                <Text variant="caption" fontWeight="600" numberOfLines={1}>
                  {item.model?.split('/').pop() || item.model || '-'}
                </Text>
                <Text variant="caption" color="textMuted" numberOfLines={1}>
                  {item.provider || '-'}
                </Text>
              </View>
              <View style={styles.modelUsage}>
                <Text variant="caption" color="textSubtle">
                  In {(item.prompt_tokens ?? 0).toLocaleString()} / Out{' '}
                  {(item.completion_tokens ?? 0).toLocaleString()}
                </Text>
                <Text variant="caption" color="textSubtle">
                  {formatMoney(item.cost_usd, 'usd')} · {formatMoney(item.cost_twd, 'twd')}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <Button
        variant="outline"
        size="sm"
        leftIcon={ExternalLink}
        onPress={() => router.push(`/admin/ai/logs/${logId}` as never)}
      >
        完整日誌：{logId.slice(0, 8)}
      </Button>
    </View>
  )
}

export default function AdminReactAgentScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, isAuthenticated } = useAuthStore()
  const [refreshing, setRefreshing] = useState(false)
  const [query, setQuery] = useState('')
  const [answer, setAnswer] = useState<string | null>(null)
  const [logId, setLogId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const isAdmin = user?.role === 'admin' || user?.role === 'moderator'
  const { data: config, isLoading, error: configError } = useAIConfig()
  const updateConfig = useUpdateAIConfig()
  const askAI = useAskAdminAI()

  const isReact = config?.rag_strategy === 'react'
  const orchestratorModel = useMemo(() => parseOrchestratorModel(config), [config])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await queryClient.invalidateQueries({ queryKey: ['admin-ai-config'] })
    if (logId) {
      await queryClient.invalidateQueries({ queryKey: ['admin-ai-log', logId] })
    }
    setRefreshing(false)
  }, [logId, queryClient])

  const handleToggle = useCallback(async () => {
    try {
      await updateConfig.mutateAsync({ rag_strategy: isReact ? 'baseline' : 'react' })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (_error) {
      setError('更新 ReAct Agent 策略失敗')
    }
  }, [isReact, updateConfig])

  const handleRun = useCallback(async () => {
    if (!query.trim() || askAI.isPending) return
    setAnswer(null)
    setLogId(null)
    setError(null)

    try {
      const result = await askAI.mutateAsync({ query: query.trim(), no_cache: true })
      setAnswer(result.answer)
      setLogId(result.query_id)
    } catch (_error) {
      setError('查詢失敗，請稍後再試。')
    }
  }, [askAI, query])

  const handleReset = useCallback(() => {
    setQuery('')
    setAnswer(null)
    setLogId(null)
    setError(null)
  }, [])

  if (!isAuthenticated || !isAdmin) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.navbar}>
          <Button variant="ghost" size="sm" leftIcon={ArrowLeft} onPress={() => router.back()}>
            返回
          </Button>
        </View>
        <EmptyState
          icon={Bot}
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
          <Bot size={18} color={SEMANTIC_COLORS.textMain} />
          <Text variant="h4" fontWeight="600">
            ReAct Agent
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
            ReAct Agent
          </Text>
          <Text variant="body" color="textSubtle">
            啟用或停用 ReAct 策略，並直接測試查詢效果。
          </Text>
        </View>

        {isLoading ? (
          <LoadingSpinner size="large" style={styles.loading} />
        ) : configError || !config ? (
          <EmptyState
            icon={AlertCircle}
            title="無法載入 AI 設定"
            description="請稍後重試，或確認帳號權限是否仍有效。"
            actionLabel="重新載入"
            onAction={handleRefresh}
            style={styles.stateCard}
          />
        ) : (
          <>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.inlineTitle}>
                  <Bot size={18} color={SEMANTIC_COLORS.textMuted} />
                  <View>
                    <Text variant="bodyBold">ReAct Agent 狀態</Text>
                    <Text variant="caption" color="textSubtle">
                      當前 RAG 策略設定
                    </Text>
                  </View>
                </View>
                {saved && <CheckCircle size={18} color="#059669" />}
              </View>

              <View style={styles.statusGrid}>
                <StatCard
                  label="目前策略"
                  value={config.rag_strategy ?? 'baseline'}
                  accent={isReact ? 'green' : 'muted'}
                />
                <StatCard label="最大 Turn 數" value={config.react_max_turns ?? '3'} />
                <StatCard label="Token 預算" value={config.react_token_budget ?? '8000'} />
                <StatCard
                  label="Orchestrator"
                  value={orchestratorModel.split('/').pop() ?? orchestratorModel}
                />
              </View>

              <Button
                variant={isReact ? 'outline' : 'primary'}
                leftIcon={Power}
                onPress={handleToggle}
                loading={updateConfig.isPending}
              >
                {isReact ? '停用 ReAct Agent' : '啟用 ReAct Agent'}
              </Button>
            </View>

            <View style={styles.card}>
              <Text variant="bodyBold">測試查詢</Text>
              <Text variant="caption" color="textSubtle">
                以管理員身份直接呼叫 AI 問答 API，不使用快取。
              </Text>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="例如：台灣有哪些適合初學者的攀岩路線？"
                placeholderTextColor={SEMANTIC_COLORS.textMuted}
                multiline
                style={styles.textarea}
              />
              <View style={styles.actions}>
                {(answer || error) && (
                  <Button variant="outline" leftIcon={RotateCcw} onPress={handleReset}>
                    重置
                  </Button>
                )}
                <Button
                  variant="primary"
                  leftIcon={Play}
                  onPress={handleRun}
                  loading={askAI.isPending}
                  disabled={!query.trim()}
                >
                  執行查詢
                </Button>
              </View>
            </View>

            {error && (
              <View style={styles.errorCard}>
                <Text variant="bodyBold" style={styles.errorText}>
                  查詢失敗
                </Text>
                <Text variant="caption" style={styles.errorText}>
                  {error}
                </Text>
              </View>
            )}

            {answer && (
              <View style={styles.card}>
                <View style={styles.inlineTitle}>
                  <Bot size={16} color={SEMANTIC_COLORS.textMuted} />
                  <Text variant="bodyBold">回答</Text>
                </View>
                <Text variant="body" style={styles.answerText}>
                  {answer}
                </Text>
              </View>
            )}

            {logId && <ReactTrace logId={logId} />}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
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
  card: {
    gap: SPACING.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  inlineTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  statCard: {
    width: '48%',
    minHeight: 76,
    gap: 4,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: WB_COLORS[10],
  },
  greenText: {
    color: '#047857',
  },
  mutedText: {
    color: SEMANTIC_COLORS.textMuted,
  },
  textarea: {
    minHeight: 112,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: WB_COLORS[30],
    color: SEMANTIC_COLORS.textMain,
    backgroundColor: SEMANTIC_COLORS.pageBg,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  errorCard: {
    gap: 4,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: '#B91C1C',
  },
  answerText: {
    lineHeight: 22,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  traceMetric: {
    flex: 1,
    gap: 4,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
    backgroundColor: WB_COLORS[10],
  },
  strategyPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  greenPill: {
    backgroundColor: '#D1FAE5',
  },
  grayPill: {
    backgroundColor: WB_COLORS[10],
  },
  modelList: {
    gap: SPACING.sm,
  },
  modelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  modelText: {
    flex: 1,
    gap: 2,
  },
  modelUsage: {
    alignItems: 'flex-end',
    gap: 2,
  },
})
