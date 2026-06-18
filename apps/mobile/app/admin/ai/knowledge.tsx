import { RADIUS, SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import { useRouter } from 'expo-router'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Database,
  RefreshCw,
  Route,
} from 'lucide-react-native'
import { useCallback, useMemo, useState } from 'react'
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, EmptyState, Text } from '@/components/ui'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
  type AIKnowledgeSource,
  useAIKnowledge,
  useReindexAIKnowledge,
} from '@/lib/hooks/useAdminDashboard'
import { useAuthStore } from '@/store/authStore'

const BATCH_SIZE = 10

function formatTime(value: string | null) {
  if (!value) return '從未索引'
  return new Date(value).toLocaleString('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function SourceCard({
  source,
  onReindex,
  disabled,
}: {
  source: AIKnowledgeSource
  onReindex: (_source: AIKnowledgeSource) => void
  disabled: boolean
}) {
  const ratio = source.total > 0 ? source.indexed / source.total : 0
  const percent = Math.round(ratio * 100)
  const complete = ratio >= 0.99
  const icon =
    source.type === 'route' ? (
      <Route size={20} color={SEMANTIC_COLORS.textMain} />
    ) : (
      <Database size={20} color={SEMANTIC_COLORS.textMain} />
    )

  return (
    <View style={styles.sourceCard}>
      <View style={styles.sourceHeader}>
        <View style={styles.sourceTitle}>
          <View style={styles.sourceIcon}>{icon}</View>
          <View>
            <Text variant="bodyBold">{source.label}</Text>
            <Text variant="caption" color="textMuted">
              {source.type}
            </Text>
          </View>
        </View>
        {complete ? (
          <CheckCircle size={18} color="#059669" />
        ) : (
          <AlertCircle size={18} color="#D97706" />
        )}
      </View>

      <View style={styles.metricRow}>
        <View>
          <Text variant="caption" color="textSubtle">
            資料總數
          </Text>
          <Text variant="h3" fontWeight="700">
            {source.total.toLocaleString()}
          </Text>
        </View>
        <View>
          <Text variant="caption" color="textSubtle" align="right">
            已索引
          </Text>
          <Text variant="h3" fontWeight="700" align="right">
            {source.indexed.toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.min(100, percent)}%`,
              backgroundColor: complete ? '#10B981' : '#F59E0B',
            },
          ]}
        />
      </View>

      <View style={styles.metaRow}>
        <Text variant="caption" color="textSubtle">
          覆蓋率 {percent}%
        </Text>
        <Text variant="caption" color="textMuted">
          {formatTime(source.last_indexed_at)}
        </Text>
      </View>

      <Button
        variant="outline"
        size="sm"
        leftIcon={RefreshCw}
        onPress={() => onReindex(source)}
        disabled={disabled}
        style={styles.actionButton}
      >
        重新索引
      </Button>
    </View>
  )
}

export default function AdminAIKnowledgeScreen() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [refreshing, setRefreshing] = useState(false)
  const [indexingType, setIndexingType] = useState<'route' | 'crag' | 'all' | null>(null)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [message, setMessage] = useState<{ success: boolean; text: string } | null>(null)

  const isAdmin = user?.role === 'admin' || user?.role === 'moderator'
  const knowledgeQuery = useAIKnowledge()
  const reindexMutation = useReindexAIKnowledge()

  const routeTotal = useMemo(
    () => knowledgeQuery.data?.sources.find((source) => source.type === 'route')?.total ?? 0,
    [knowledgeQuery.data]
  )

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await knowledgeQuery.refetch()
    setRefreshing(false)
  }, [knowledgeQuery])

  const runReindex = useCallback(
    async (type: 'route' | 'crag' | 'all') => {
      setIndexingType(type)
      setProgress(null)
      setMessage(null)
      let totalIndexed = 0
      let totalFailed = 0

      try {
        if (type === 'crag' || type === 'all') {
          const result = await reindexMutation.mutateAsync({
            type: 'crag',
            offset: 0,
            limit: BATCH_SIZE,
          })
          totalIndexed += result.indexed
          totalFailed += result.failed
          await knowledgeQuery.refetch()
        }

        if (type === 'route' || type === 'all') {
          let offset = 0
          let hasMore = true
          const total = routeTotal || 946
          setProgress({ done: 0, total })

          while (hasMore) {
            const result = await reindexMutation.mutateAsync({
              type: 'route',
              offset,
              limit: BATCH_SIZE,
            })
            totalIndexed += result.indexed
            totalFailed += result.failed
            hasMore = result.hasMore
            offset = result.nextOffset
            setProgress({ done: Math.min(offset, total), total })
          }
          await knowledgeQuery.refetch()
        }

        setMessage({
          success: true,
          text: `索引完成：成功 ${totalIndexed} 筆，失敗 ${totalFailed} 筆`,
        })
      } catch {
        setMessage({ success: false, text: '索引操作失敗，請稍後再試。' })
      } finally {
        setIndexingType(null)
        setProgress(null)
      }
    },
    [knowledgeQuery, reindexMutation, routeTotal]
  )

  const confirmReindex = useCallback(
    (type: 'route' | 'crag' | 'all') => {
      const label = type === 'all' ? '所有資料' : type === 'route' ? '攀岩路線' : '岩場'
      Alert.alert('確認重新索引', `即將重新建立「${label}」的向量索引，路線資料會分批處理。`, [
        { text: '取消', style: 'cancel' },
        { text: '確認', style: 'destructive', onPress: () => runReindex(type) },
      ])
    },
    [runReindex]
  )

  if (!isAuthenticated || !isAdmin) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.navbar}>
          <Button variant="ghost" size="sm" leftIcon={ArrowLeft} onPress={() => router.back()}>
            返回
          </Button>
        </View>
        <EmptyState
          icon={Database}
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
          <Database size={18} color={SEMANTIC_COLORS.textMain} />
          <Text variant="h4" fontWeight="600">
            知識庫
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
            知識庫管理
          </Text>
          <Text variant="body" color="textSubtle">
            查看索引狀態，並手動觸發路線與岩場向量索引。
          </Text>
        </View>

        {message && (
          <View
            style={[
              styles.messageCard,
              message.success ? styles.messageSuccess : styles.messageError,
            ]}
          >
            {message.success ? (
              <CheckCircle size={18} color="#047857" />
            ) : (
              <AlertCircle size={18} color="#B91C1C" />
            )}
            <Text
              variant="caption"
              style={message.success ? styles.messageTextSuccess : styles.messageTextError}
            >
              {message.text}
            </Text>
          </View>
        )}

        {progress && (
          <View style={styles.progressCard}>
            <Text variant="bodyBold">路線索引中...</Text>
            <Text variant="caption" color="textSubtle">
              {progress.done} / {progress.total}，每批 {BATCH_SIZE} 筆
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%`,
                    backgroundColor: SEMANTIC_COLORS.textMain,
                  },
                ]}
              />
            </View>
          </View>
        )}

        {knowledgeQuery.isLoading ? (
          <LoadingSpinner size="large" style={styles.loading} />
        ) : knowledgeQuery.error || !knowledgeQuery.data ? (
          <EmptyState
            icon={AlertCircle}
            title="無法載入知識庫狀態"
            description="請稍後重試，或確認帳號權限是否仍有效。"
            actionLabel="重新載入"
            onAction={handleRefresh}
            style={styles.stateCard}
          />
        ) : (
          <>
            <View style={styles.sourceList}>
              {knowledgeQuery.data.sources.map((source) => (
                <SourceCard
                  key={source.type}
                  source={source}
                  onReindex={(item) => confirmReindex(item.type)}
                  disabled={Boolean(indexingType)}
                />
              ))}
            </View>
            <Button
              variant="primary"
              leftIcon={indexingType ? undefined : RefreshCw}
              onPress={() => confirmReindex('all')}
              loading={Boolean(indexingType)}
              disabled={Boolean(indexingType)}
              style={styles.fullButton}
            >
              全部重新索引
            </Button>
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
  sourceList: {
    gap: SPACING.md,
  },
  sourceCard: {
    gap: SPACING.md,
    padding: SPACING.md,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  sourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  sourceTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  sourceIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WB_COLORS[10],
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  actionButton: {
    alignSelf: 'flex-start',
  },
  fullButton: {
    marginTop: SPACING.lg,
  },
  progressCard: {
    gap: SPACING.sm,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  messageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  messageSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  messageError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  messageTextSuccess: {
    color: '#047857',
    flex: 1,
  },
  messageTextError: {
    color: '#B91C1C',
    flex: 1,
  },
})
