import { RADIUS, SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Clock,
  Globe,
  RefreshCw,
  Server,
  Zap,
} from 'lucide-react-native'
import type React from 'react'
import { useCallback, useMemo, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, EmptyState, Text } from '@/components/ui'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
  type AccessLogEntry,
  type AccessLogError,
  type AccessLogSlow,
  useAccessLogErrors,
  useAccessLogSlowRequests,
  useAccessLogSummary,
  useAccessLogs,
} from '@/lib/hooks/useAdminDashboard'
import { useAuthStore } from '@/store/authStore'

type TabType = 'summary' | 'logs' | 'errors' | 'slow'

const tabs: Array<{ id: TabType; label: string }> = [
  { id: 'summary', label: '總覽' },
  { id: 'logs', label: '請求' },
  { id: 'errors', label: '錯誤' },
  { id: 'slow', label: '慢請求' },
]

const hourOptions = [
  { value: 1, label: '1 小時' },
  { value: 6, label: '6 小時' },
  { value: 24, label: '24 小時' },
  { value: 72, label: '3 天' },
  { value: 168, label: '7 天' },
]

function formatTime(timestamp: string) {
  return new Date(timestamp).toLocaleString('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatResponseTime(ms: number | null | undefined) {
  if (ms == null) return '-'
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`
  return `${Math.round(ms)}ms`
}

function formatUserId(userId: string | null | undefined) {
  if (!userId || userId === 'anonymous') return '匿名'
  return userId
}

function statusTone(status: string | number) {
  const value = typeof status === 'string' ? Number.parseInt(status, 10) : status
  if (value >= 500) return styles.statusError
  if (value >= 400) return styles.statusWarn
  if (value >= 300) return styles.statusNeutral
  return styles.statusSuccess
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string
  value: number | string
  icon: React.ReactNode
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
      </View>
    </View>
  )
}

function BarList<T extends Record<string, unknown>>({
  title,
  data,
  labelKey,
  valueKey,
}: {
  title: string
  data: T[]
  labelKey: keyof T
  valueKey: keyof T
}) {
  const max = Math.max(...data.map((item) => Number(item[valueKey]) || 0), 1)

  return (
    <View style={styles.card}>
      <Text variant="bodyBold" style={styles.cardTitle}>
        {title}
      </Text>
      {data.length === 0 ? (
        <Text variant="body" color="textSubtle" align="center" style={styles.emptyText}>
          暫無數據
        </Text>
      ) : (
        <View style={styles.barList}>
          {data.slice(0, 10).map((item, index) => {
            const label = String(item[labelKey] || '-')
            const value = Number(item[valueKey]) || 0
            return (
              <View key={`${label}-${index}`} style={styles.barItem}>
                <View style={styles.barLabelRow}>
                  <Text
                    variant="caption"
                    color="textSubtle"
                    numberOfLines={1}
                    style={styles.barLabel}
                  >
                    {label}
                  </Text>
                  <Text variant="caption" fontWeight="600">
                    {value.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[styles.barFill, { width: `${Math.max(4, (value / max) * 100)}%` }]}
                  />
                </View>
              </View>
            )
          })}
        </View>
      )}
    </View>
  )
}

function AccessLogCard({ log }: { log: AccessLogEntry }) {
  return (
    <View style={styles.logCard}>
      <View style={styles.logHeader}>
        <View style={styles.methodBadge}>
          <Text variant="caption" fontWeight="700" style={styles.methodText}>
            {log.method}
          </Text>
        </View>
        <Text variant="bodyBold" numberOfLines={1} style={styles.logPath}>
          {log.path}
        </Text>
        <View style={[styles.statusBadge, statusTone(log.statusCodeNum || log.statusCode)]}>
          <Text variant="caption" fontWeight="700">
            {log.statusCode}
          </Text>
        </View>
      </View>
      <View style={styles.metaRow}>
        <Text variant="caption" color="textMuted">
          {formatTime(log.timestamp)}
        </Text>
        <Text variant="caption" color="textMuted">
          {formatResponseTime(log.responseTime)} · {log.country || '-'} · {log.ip || '-'}
        </Text>
        <Text variant="caption" color="textMuted" numberOfLines={1}>
          用戶：{formatUserId(log.userId)}
        </Text>
      </View>
      {log.errorMessage ? (
        <Text variant="caption" color="error" numberOfLines={2}>
          {log.errorMessage}
        </Text>
      ) : null}
    </View>
  )
}

function ErrorCard({ item }: { item: AccessLogError | AccessLogSlow }) {
  return (
    <View style={styles.logCard}>
      <View style={styles.logHeader}>
        <View style={styles.methodBadge}>
          <Text variant="caption" fontWeight="700" style={styles.methodText}>
            {item.method}
          </Text>
        </View>
        <Text variant="bodyBold" numberOfLines={1} style={styles.logPath}>
          {item.path}
        </Text>
        <View style={[styles.statusBadge, statusTone(item.statusCode)]}>
          <Text variant="caption" fontWeight="700">
            {item.statusCode}
          </Text>
        </View>
      </View>
      <View style={styles.metaRow}>
        <Text variant="caption" color="textMuted">
          {formatTime(item.timestamp)}
        </Text>
        <Text variant="caption" color="textMuted">
          {formatResponseTime(item.responseTime)} · {formatUserId(item.userId)}
        </Text>
      </View>
      {'errorMessage' in item && item.errorMessage ? (
        <Text variant="caption" color="error" numberOfLines={2}>
          {item.errorMessage}
        </Text>
      ) : null}
    </View>
  )
}

export default function AdminAccessLogsScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, isAuthenticated } = useAuthStore()
  const [activeTab, setActiveTab] = useState<TabType>('summary')
  const [hours, setHours] = useState(24)
  const [refreshing, setRefreshing] = useState(false)

  const isAdmin = user?.role === 'admin' || user?.role === 'moderator'
  const summaryQuery = useAccessLogSummary(hours)
  const logsQuery = useAccessLogs({ limit: 100 })
  const errorsQuery = useAccessLogErrors({ hours, limit: 50 })
  const slowQuery = useAccessLogSlowRequests({ hours, threshold: 1000, limit: 50 })

  const activeState = useMemo(() => {
    if (activeTab === 'summary') return summaryQuery
    if (activeTab === 'logs') return logsQuery
    if (activeTab === 'errors') return errorsQuery
    return slowQuery
  }, [activeTab, errorsQuery, logsQuery, slowQuery, summaryQuery])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await queryClient.invalidateQueries({ queryKey: ['admin-access'] })
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-access-log-summary'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-access-logs'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-access-log-errors'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-access-log-slow'] }),
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
          icon={Activity}
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
          <Activity size={18} color={SEMANTIC_COLORS.textMain} />
          <Text variant="h4" fontWeight="600">
            訪問日誌
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
            訪問日誌
          </Text>
          <Text variant="body" color="textSubtle">
            監控 API 請求量、錯誤、慢請求與地區分佈。
          </Text>
        </View>

        <View style={styles.tabs}>
          {tabs.map((tab) => (
            <Pressable
              key={tab.id}
              style={[styles.tabButton, activeTab === tab.id && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text
                variant="caption"
                fontWeight="600"
                style={activeTab === tab.id ? styles.tabTextActive : styles.tabText}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hoursScroll}>
          <View style={styles.hourTabs}>
            {hourOptions.map((option) => (
              <Pressable
                key={option.value}
                style={[styles.hourTab, hours === option.value && styles.hourTabActive]}
                onPress={() => setHours(option.value)}
              >
                <Text
                  variant="caption"
                  fontWeight="600"
                  style={hours === option.value ? styles.hourTextActive : styles.hourText}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {activeState.isLoading ? (
          <LoadingSpinner size="large" style={styles.loading} />
        ) : activeState.error ? (
          <EmptyState
            icon={AlertCircle}
            title="無法載入訪問日誌"
            description="Analytics Engine 可能尚未設定，或目前帳號沒有權限。"
            actionLabel="重新載入"
            onAction={handleRefresh}
            style={styles.stateCard}
          />
        ) : (
          <>
            {activeTab === 'summary' && summaryQuery.data && (
              <SummaryPanel summary={summaryQuery.data} />
            )}
            {activeTab === 'logs' && logsQuery.data && <LogList logs={logsQuery.data} />}
            {activeTab === 'errors' && errorsQuery.data && (
              <IssueList items={errorsQuery.data} emptyLabel="沒有錯誤日誌" />
            )}
            {activeTab === 'slow' && slowQuery.data && (
              <IssueList items={slowQuery.data} emptyLabel="沒有慢請求" />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function SummaryPanel({
  summary,
}: {
  summary: NonNullable<ReturnType<typeof useAccessLogSummary>['data']>
}) {
  return (
    <View>
      <View style={styles.metricGrid}>
        <MetricCard
          label="總請求"
          value={summary.summary.totalRequests}
          icon={<Activity size={20} color={SEMANTIC_COLORS.textMain} />}
        />
        <MetricCard
          label="平均響應"
          value={formatResponseTime(summary.summary.avgResponseTime)}
          icon={<Zap size={20} color={SEMANTIC_COLORS.textMain} />}
        />
        <MetricCard
          label="成功請求"
          value={summary.summary.successCount}
          icon={<Server size={20} color={SEMANTIC_COLORS.textMain} />}
        />
        <MetricCard
          label="客戶端錯誤"
          value={summary.summary.clientErrorCount}
          icon={<AlertTriangle size={20} color={SEMANTIC_COLORS.textMain} />}
        />
        <MetricCard
          label="伺服器錯誤"
          value={summary.summary.serverErrorCount}
          icon={<AlertCircle size={20} color={SEMANTIC_COLORS.textMain} />}
        />
      </View>
      <BarList title="熱門 API 路徑" data={summary.topPaths} labelKey="path" valueKey="count" />
      <BarList
        title="HTTP 方法分佈"
        data={summary.methodDistribution}
        labelKey="method"
        valueKey="count"
      />
      <BarList
        title="訪問國家分佈"
        data={summary.countryDistribution}
        labelKey="country"
        valueKey="count"
      />
      <BarList
        title="每小時請求量"
        data={summary.hourlyRequests}
        labelKey="hour"
        valueKey="count"
      />
    </View>
  )
}

function LogList({ logs }: { logs: AccessLogEntry[] }) {
  if (logs.length === 0) {
    return <EmptyState icon={Clock} title="沒有請求日誌" description="目前沒有符合條件的資料。" />
  }

  return (
    <View style={styles.list}>
      {logs.map((log, index) => (
        <AccessLogCard key={`${log.timestamp}-${log.path}-${index}`} log={log} />
      ))}
    </View>
  )
}

function IssueList({
  items,
  emptyLabel,
}: {
  items: Array<AccessLogError | AccessLogSlow>
  emptyLabel: string
}) {
  if (items.length === 0) {
    return <EmptyState icon={Globe} title={emptyLabel} description="目前沒有符合條件的資料。" />
  }

  return (
    <View style={styles.list}>
      {items.map((item, index) => (
        <ErrorCard key={`${item.timestamp}-${item.path}-${index}`} item={item} />
      ))}
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
  tabs: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: WB_COLORS[10],
  },
  tabButtonActive: {
    backgroundColor: SEMANTIC_COLORS.textMain,
  },
  tabText: {
    color: SEMANTIC_COLORS.textSubtle,
  },
  tabTextActive: {
    color: WB_COLORS[0],
  },
  hoursScroll: {
    marginBottom: SPACING.lg,
  },
  hourTabs: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingRight: SPACING.md,
  },
  hourTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    backgroundColor: WB_COLORS[10],
  },
  hourTabActive: {
    backgroundColor: SEMANTIC_COLORS.textMain,
  },
  hourText: {
    color: SEMANTIC_COLORS.textSubtle,
  },
  hourTextActive: {
    color: WB_COLORS[0],
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  metricCard: {
    width: '47%',
    minHeight: 98,
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
  barList: {
    gap: SPACING.sm,
  },
  barItem: {
    gap: 6,
  },
  barLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  barLabel: {
    flex: 1,
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: WB_COLORS[10],
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: SEMANTIC_COLORS.textMain,
  },
  emptyText: {
    paddingVertical: SPACING.xl,
  },
  list: {
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
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  methodBadge: {
    minWidth: 44,
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    backgroundColor: WB_COLORS[10],
  },
  methodText: {
    color: SEMANTIC_COLORS.textMain,
  },
  logPath: {
    flex: 1,
  },
  statusBadge: {
    minWidth: 44,
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  statusSuccess: {
    backgroundColor: '#ECFDF5',
  },
  statusWarn: {
    backgroundColor: '#FEF3C7',
  },
  statusError: {
    backgroundColor: '#FEE2E2',
  },
  statusNeutral: {
    backgroundColor: WB_COLORS[10],
  },
  metaRow: {
    gap: 2,
  },
})
