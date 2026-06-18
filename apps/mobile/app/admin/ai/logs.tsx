import { RADIUS, SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import {
  Activity,
  ArrowLeft,
  Brain,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  RefreshCw,
  Search,
  X,
  Zap,
} from 'lucide-react-native'
import type React from 'react'
import { useCallback, useMemo, useState } from 'react'
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, EmptyState, Text } from '@/components/ui'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { type AIQueryLog, useAILogs } from '@/lib/hooks/useAdminDashboard'
import { useAuthStore } from '@/store/authStore'

const queryTypes: Array<{ value: string; label: string }> = [
  { value: '', label: '全部' },
  { value: 'simple', label: '簡單' },
  { value: 'complex', label: '複雜' },
  { value: 'general-knowledge', label: '通識' },
  { value: 'guardrails_blocked', label: '攔截' },
  { value: 'pipeline_timeout', label: '超時' },
  { value: 'circuit_breaker_rejected', label: '熔斷' },
]

const typeLabels: Record<string, string> = {
  simple: '簡單',
  complex: '複雜',
  'general-knowledge': '通識',
  guardrails_blocked: '攔截',
  pipeline_timeout: '超時',
  circuit_breaker_rejected: '熔斷',
}

const feedbackOptions = ['', '1', '2', '3', '4', '5']

function todayTaipei() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' })
}

function formatTime(iso: string) {
  const date = new Date(iso)
  const diff = Date.now() - date.getTime()
  if (diff < 60_000) return '剛剛'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分前`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小時前`
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)} 天前`
  return date.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })
}

function formatLatency(ms: number | null, cacheHit: number | null) {
  if (cacheHit) return '快取'
  if (ms == null) return '-'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function QueryTypeBadge({ type }: { type: AIQueryLog['query_type'] }) {
  if (!type) return null
  const isWarning =
    type === 'guardrails_blocked' ||
    type === 'pipeline_timeout' ||
    type === 'circuit_breaker_rejected'
  return (
    <View style={[styles.badge, isWarning && styles.badgeWarning]}>
      <Text variant="caption" style={isWarning ? styles.badgeTextWarning : styles.badgeText}>
        {typeLabels[type] || type}
      </Text>
    </View>
  )
}

function ScoreBar({ label, score }: { label: string; score: number | null }) {
  const normalized = score == null ? null : label === 'Auto' ? score / 4 : score
  const percent = normalized == null ? 0 : Math.max(0, Math.min(100, Math.round(normalized * 100)))
  const color = percent >= 70 ? '#10B981' : percent >= 50 ? '#F59E0B' : '#EF4444'

  return (
    <View style={styles.scoreRow}>
      <Text variant="caption" color="textMuted" style={styles.scoreLabel}>
        {label}
      </Text>
      <View style={styles.scoreTrack}>
        {normalized != null && (
          <View style={[styles.scoreFill, { width: `${percent}%`, backgroundColor: color }]} />
        )}
      </View>
      <Text variant="caption" color="textSubtle" style={styles.scoreValue}>
        {score == null ? '-' : label === 'Auto' ? `${score}/4` : `${percent}%`}
      </Text>
    </View>
  )
}

function Tag({
  icon,
  label,
  tone = 'neutral',
}: {
  icon?: React.ReactNode
  label: string
  tone?: 'neutral' | 'warning'
}) {
  return (
    <View style={[styles.tag, tone === 'warning' && styles.tagWarning]}>
      {icon}
      <Text variant="caption" style={tone === 'warning' ? styles.tagTextWarning : styles.tagText}>
        {label}
      </Text>
    </View>
  )
}

function LogCard({ log, onPress }: { log: AIQueryLog; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.logCard, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.logHeader}>
        <View style={styles.logText}>
          <Text variant="bodyBold" numberOfLines={2}>
            {log.query}
          </Text>
          <Text variant="caption" color="textMuted" numberOfLines={1}>
            {log.display_name || log.username || '匿名'} · {formatTime(log.created_at)}
          </Text>
        </View>
        <Text variant="caption" color={log.cache_hit ? 'accent' : 'textSubtle'}>
          {formatLatency(log.latency_ms, log.cache_hit)}
        </Text>
      </View>

      <View style={styles.tagRow}>
        <QueryTypeBadge type={log.query_type} />
        {!!log.cache_hit && <Tag icon={<Zap size={11} color="#0284C7" />} label="快取" />}
        {!!log.hyde_triggered && <Tag icon={<Brain size={11} color="#7C3AED" />} label="HyDE" />}
        {!!log.is_high_consumption && <Tag label="高耗" tone="warning" />}
      </View>

      <View style={styles.scoreBlock}>
        <ScoreBar label="Groundedness" score={log.groundedness_score} />
        <ScoreBar label="Auto" score={log.auto_score} />
      </View>

      <View style={styles.metaRow}>
        <Text variant="caption" color="textMuted">
          Tokens {log.token_count?.toLocaleString() ?? '-'}
        </Text>
        <Text variant="caption" color="textMuted">
          Emb {formatLatency(log.embedding_ms, null)} · Ret {formatLatency(log.retrieval_ms, null)}{' '}
          · Gen {formatLatency(log.generation_ms, null)}
        </Text>
      </View>
    </Pressable>
  )
}

export default function AdminAILogsScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, isAuthenticated } = useAuthStore()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [queryType, setQueryType] = useState('')
  const [feedbackMin, setFeedbackMin] = useState('')
  const [feedbackMax, setFeedbackMax] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const isAdmin = user?.role === 'admin' || user?.role === 'moderator'
  const hasFilters = Boolean(search || from || to || queryType || feedbackMin || feedbackMax)
  const params = useMemo(
    () => ({
      page,
      limit: 25,
      from: from || undefined,
      to: to || undefined,
      search: search.trim() || undefined,
      query_type: queryType || undefined,
      feedback_min: feedbackMin ? Number(feedbackMin) : undefined,
      feedback_max: feedbackMax ? Number(feedbackMax) : undefined,
    }),
    [feedbackMax, feedbackMin, from, page, queryType, search, to]
  )
  const { data, isLoading, error } = useAILogs(params)
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await queryClient.invalidateQueries({ queryKey: ['admin-ai-logs'] })
    setRefreshing(false)
  }, [queryClient])

  const handleQueryType = useCallback((value: string) => {
    setQueryType(value)
    setPage(1)
  }, [])

  const handleSearch = useCallback((value: string) => {
    setSearch(value)
    setPage(1)
  }, [])

  const handleClearFilters = useCallback(() => {
    setSearch('')
    setFrom('')
    setTo('')
    setQueryType('')
    setFeedbackMin('')
    setFeedbackMax('')
    setPage(1)
  }, [])

  const handleExport = useCallback(async () => {
    if (!data?.logs.length) return

    const header = 'ID,使用者,查詢,類型,快取,延遲(ms),Groundedness,Auto評分,回饋,建立時間'
    const rows = data.logs.map((log) =>
      [
        log.id,
        log.display_name || log.username || '匿名',
        log.query,
        log.query_type ?? '',
        log.cache_hit ? '是' : '否',
        log.latency_ms ?? '',
        log.groundedness_score ?? '',
        log.auto_score ?? '',
        log.feedback_score ?? '',
        log.created_at,
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(',')
    )

    try {
      await Share.share({
        title: `ai-logs-${todayTaipei()}.csv`,
        message: [header, ...rows].join('\n'),
      })
    } catch {
      Alert.alert('匯出失敗', '無法分享 CSV，請稍後再試。')
    }
  }, [data?.logs])

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
          <Activity size={18} color={SEMANTIC_COLORS.textMain} />
          <Text variant="h4" fontWeight="600">
            查詢日誌
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
            AI 查詢日誌
          </Text>
          <Text variant="body" color="textSubtle">
            追蹤查詢類型、品質分數、延遲拆解與高耗用請求。
          </Text>
          {hasFilters && (
            <Text variant="caption" color="textMuted">
              已套用篩選條件
            </Text>
          )}
        </View>

        <View style={styles.filterCard}>
          <View style={styles.searchBox}>
            <Search size={16} color={SEMANTIC_COLORS.textMuted} />
            <TextInput
              value={search}
              onChangeText={handleSearch}
              placeholder="搜尋查詢內容"
              placeholderTextColor={SEMANTIC_COLORS.textMuted}
              style={styles.searchInput}
            />
            {search ? (
              <Pressable onPress={() => handleSearch('')} hitSlop={8}>
                <X size={16} color={SEMANTIC_COLORS.textMuted} />
              </Pressable>
            ) : null}
          </View>
          <View style={styles.dateRow}>
            <View style={styles.dateInputGroup}>
              <Text variant="caption" color="textSubtle">
                開始日期
              </Text>
              <TextInput
                value={from}
                onChangeText={(value) => {
                  setFrom(value)
                  setPage(1)
                }}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={SEMANTIC_COLORS.textMuted}
                keyboardType="numbers-and-punctuation"
                style={styles.filterInput}
              />
            </View>
            <View style={styles.dateInputGroup}>
              <Text variant="caption" color="textSubtle">
                結束日期
              </Text>
              <TextInput
                value={to}
                onChangeText={(value) => {
                  setTo(value)
                  setPage(1)
                }}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={SEMANTIC_COLORS.textMuted}
                keyboardType="numbers-and-punctuation"
                style={styles.filterInput}
              />
            </View>
          </View>
          <View style={styles.typeHeader}>
            <Filter size={15} color={SEMANTIC_COLORS.textSubtle} />
            <Text variant="caption" color="textSubtle">
              查詢類型
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.typeTabs}>
              {queryTypes.map((type) => (
                <Pressable
                  key={type.value}
                  style={[styles.typeTab, queryType === type.value && styles.typeTabActive]}
                  onPress={() => handleQueryType(type.value)}
                >
                  <Text
                    variant="caption"
                    fontWeight="600"
                    style={queryType === type.value ? styles.typeTextActive : styles.typeText}
                  >
                    {type.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
          <View style={styles.typeHeader}>
            <Text variant="caption" color="textSubtle">
              回饋最低
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.typeTabs}>
              {feedbackOptions.map((score) => (
                <Pressable
                  key={`min-${score || 'any'}`}
                  style={[styles.typeTab, feedbackMin === score && styles.typeTabActive]}
                  onPress={() => {
                    setFeedbackMin(score)
                    setPage(1)
                  }}
                >
                  <Text
                    variant="caption"
                    fontWeight="600"
                    style={feedbackMin === score ? styles.typeTextActive : styles.typeText}
                  >
                    {score ? `${score} 星` : '不限'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
          <View style={styles.typeHeader}>
            <Text variant="caption" color="textSubtle">
              回饋最高
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.typeTabs}>
              {feedbackOptions.map((score) => (
                <Pressable
                  key={`max-${score || 'any'}`}
                  style={[styles.typeTab, feedbackMax === score && styles.typeTabActive]}
                  onPress={() => {
                    setFeedbackMax(score)
                    setPage(1)
                  }}
                >
                  <Text
                    variant="caption"
                    fontWeight="600"
                    style={feedbackMax === score ? styles.typeTextActive : styles.typeText}
                  >
                    {score ? `${score} 星` : '不限'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
          <View style={styles.filterActions}>
            {hasFilters && (
              <Button variant="ghost" size="sm" leftIcon={X} onPress={handleClearFilters}>
                清除篩選
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              leftIcon={Download}
              onPress={handleExport}
              disabled={!data?.logs.length}
            >
              匯出 CSV
            </Button>
          </View>
        </View>

        {isLoading ? (
          <LoadingSpinner size="large" style={styles.loading} />
        ) : error || !data ? (
          <EmptyState
            icon={Activity}
            title="無法載入查詢日誌"
            description="請稍後重試，或確認帳號權限是否仍有效。"
            actionLabel="重新載入"
            onAction={handleRefresh}
            style={styles.stateCard}
          />
        ) : data.logs.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="沒有符合條件的日誌"
            description="調整搜尋字串或查詢類型後再試一次。"
            style={styles.stateCard}
          />
        ) : (
          <>
            <View style={styles.resultHeader}>
              <Text variant="caption" color="textSubtle">
                共 {data.total.toLocaleString()} 筆
              </Text>
              <Text variant="caption" color="textMuted">
                第 {data.page} / {totalPages} 頁
              </Text>
            </View>
            <View style={styles.logList}>
              {data.logs.map((log) => (
                <LogCard
                  key={log.id}
                  log={log}
                  onPress={() => router.push(`/admin/ai/logs/${log.id}` as never)}
                />
              ))}
            </View>
            <View style={styles.pagination}>
              <Button
                variant="outline"
                size="sm"
                leftIcon={ChevronLeft}
                disabled={page <= 1}
                onPress={() => setPage((current) => Math.max(1, current - 1))}
              >
                上一頁
              </Button>
              <Text variant="caption" color="textSubtle">
                {page} / {totalPages}
              </Text>
              <Button
                variant="outline"
                size="sm"
                rightIcon={ChevronRight}
                disabled={page >= totalPages}
                onPress={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                下一頁
              </Button>
            </View>
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
  filterCard: {
    gap: SPACING.sm,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  searchBox: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: WB_COLORS[10],
  },
  searchInput: {
    flex: 1,
    color: SEMANTIC_COLORS.textMain,
    fontSize: 15,
  },
  dateRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  dateInputGroup: {
    flex: 1,
    gap: 6,
  },
  filterInput: {
    minHeight: 42,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
    color: SEMANTIC_COLORS.textMain,
    backgroundColor: WB_COLORS[0],
  },
  typeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeTabs: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingRight: SPACING.md,
  },
  typeTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    backgroundColor: WB_COLORS[10],
  },
  typeTabActive: {
    backgroundColor: SEMANTIC_COLORS.textMain,
  },
  typeText: {
    color: SEMANTIC_COLORS.textSubtle,
  },
  typeTextActive: {
    color: WB_COLORS[0],
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  logList: {
    gap: SPACING.md,
  },
  logCard: {
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  pressed: {
    backgroundColor: WB_COLORS[10],
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  logText: {
    flex: 1,
    gap: 4,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#EFF6FF',
  },
  badgeWarning: {
    backgroundColor: '#FEF2F2',
  },
  badgeText: {
    color: '#2563EB',
  },
  badgeTextWarning: {
    color: '#DC2626',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: WB_COLORS[10],
  },
  tagWarning: {
    backgroundColor: '#FFF7ED',
  },
  tagText: {
    color: SEMANTIC_COLORS.textSubtle,
  },
  tagTextWarning: {
    color: '#EA580C',
  },
  scoreBlock: {
    gap: 6,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  scoreLabel: {
    width: 82,
  },
  scoreTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: WB_COLORS[10],
  },
  scoreFill: {
    height: '100%',
    borderRadius: 3,
  },
  scoreValue: {
    width: 40,
    textAlign: 'right',
  },
  metaRow: {
    gap: 2,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
})
