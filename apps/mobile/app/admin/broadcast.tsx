import { RADIUS, SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Megaphone,
  RefreshCw,
  Send,
  Users,
} from 'lucide-react-native'
import { useCallback, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, EmptyState, Input, Select, Text, TextArea } from '@/components/ui'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
  type BroadcastTargetRole,
  useAdminBroadcasts,
  useAdminUserStats,
  useSendAdminBroadcast,
} from '@/lib/hooks/useAdminDashboard'
import { useAuthStore } from '@/store/authStore'

export default function AdminBroadcastScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, isAuthenticated } = useAuthStore()
  const [refreshing, setRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [targetRole, setTargetRole] = useState<BroadcastTargetRole>('all')
  const [result, setResult] = useState<{
    success: boolean
    message: string
    data?: { totalUsers: number; successCount: number; failedCount: number }
  } | null>(null)

  const isAdmin = user?.role === 'admin' || user?.role === 'moderator'
  const { data: userStats } = useAdminUserStats()
  const { data, isLoading, error } = useAdminBroadcasts(page, 10)
  const sendBroadcast = useSendAdminBroadcast()

  const broadcasts = data?.broadcasts ?? []
  const totalPages = data?.pagination.total_pages ?? 1

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-broadcasts'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] }),
    ])
    setRefreshing(false)
  }, [queryClient])

  const handleSend = useCallback(async () => {
    const trimmedTitle = title.trim()
    const trimmedMessage = message.trim()
    if (!trimmedTitle || !trimmedMessage) {
      setResult({ success: false, message: '請填寫標題和內容' })
      return
    }

    setResult(null)
    try {
      const response = await sendBroadcast.mutateAsync({
        title: trimmedTitle,
        message: trimmedMessage,
        targetRole,
      })

      if (response.success) {
        setResult({
          success: true,
          message: response.message || '廣播已發送',
          data: response.data,
        })
        setTitle('')
        setMessage('')
        setPage(1)
      } else {
        setResult({ success: false, message: response.message || '發送失敗' })
      }
    } catch (err) {
      setResult({ success: false, message: err instanceof Error ? err.message : '發送失敗' })
    }
  }, [message, sendBroadcast, targetRole, title])

  if (!isAuthenticated || !isAdmin) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.navbar}>
          <Button variant="ghost" size="sm" leftIcon={ArrowLeft} onPress={() => router.back()}>
            返回
          </Button>
        </View>
        <EmptyState
          icon={Megaphone}
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
          <Megaphone size={18} color={SEMANTIC_COLORS.textMain} />
          <Text variant="h4" fontWeight="600">
            廣播通知
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
            廣播通知
          </Text>
          <Text variant="body" color="textSubtle">
            發送系統公告給指定角色群組，並追蹤歷史廣播的接收與已讀狀態。
          </Text>
          {userStats && (
            <Text variant="caption" color="textMuted" style={styles.userSummary}>
              目前活躍用戶 {userStats.active.toLocaleString()} / {userStats.total.toLocaleString()}
            </Text>
          )}
        </View>

        <View style={styles.formCard}>
          <View style={styles.cardTitleRow}>
            <Send size={18} color={SEMANTIC_COLORS.textMain} />
            <Text variant="bodyBold">發送新公告</Text>
          </View>
          <Input
            value={title}
            onChangeText={(value) => setTitle(value.slice(0, 100))}
            placeholder="輸入公告標題..."
          />
          <View>
            <TextArea
              value={message}
              onChangeText={(value) => setMessage(value.slice(0, 500))}
              placeholder="輸入公告內容..."
              numberOfLines={5}
            />
            <Text variant="caption" color="textMuted" style={styles.counter}>
              {message.length} / 500
            </Text>
          </View>
          <Select
            value={targetRole}
            onValueChange={(value) => setTargetRole(value as BroadcastTargetRole)}
            title="發送對象"
            options={[
              { value: 'all', label: '所有用戶' },
              { value: 'user', label: '僅一般用戶' },
              { value: 'moderator', label: '僅版主' },
              { value: 'admin', label: '僅管理員' },
            ]}
          />

          {result && (
            <View style={[styles.resultBox, result.success ? styles.successBox : styles.errorBox]}>
              {result.success ? (
                <CheckCircle size={20} color="#15803D" />
              ) : (
                <AlertCircle size={20} color="#B91C1C" />
              )}
              <View style={styles.resultText}>
                <Text
                  variant="bodyBold"
                  style={result.success ? styles.successText : styles.errorText}
                >
                  {result.message}
                </Text>
                {result.data && (
                  <Text variant="caption" color="textSubtle">
                    已發送給 {result.data.successCount} 位用戶
                    {result.data.failedCount > 0 ? `，${result.data.failedCount} 位發送失敗` : ''}
                  </Text>
                )}
              </View>
            </View>
          )}

          <Button
            variant="primary"
            size="lg"
            leftIcon={Send}
            fullWidth
            loading={sendBroadcast.isPending}
            disabled={!title.trim() || !message.trim() || sendBroadcast.isPending}
            onPress={handleSend}
          >
            發送廣播
          </Button>
        </View>

        <View style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <View style={styles.cardTitleRow}>
              <Clock size={18} color={SEMANTIC_COLORS.textMain} />
              <Text variant="bodyBold">發送歷史</Text>
            </View>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={RefreshCw}
              onPress={handleRefresh}
              loading={refreshing}
            >
              重新整理
            </Button>
          </View>

          {isLoading && broadcasts.length === 0 ? (
            <LoadingSpinner size="large" style={styles.loading} />
          ) : error ? (
            <EmptyState
              icon={Activity}
              title="無法載入廣播歷史"
              description="請稍後重試，或確認帳號權限是否仍有效。"
              actionLabel="重新載入"
              onAction={handleRefresh}
              style={styles.stateCard}
            />
          ) : broadcasts.length === 0 ? (
            <EmptyState
              icon={Megaphone}
              title="尚無廣播記錄"
              description="發送第一則公告後會顯示在這裡。"
              style={styles.stateCard}
            />
          ) : (
            <View style={styles.broadcastList}>
              {broadcasts.map((broadcast) => {
                const readRate =
                  broadcast.recipient_count > 0
                    ? Math.round((broadcast.read_count / broadcast.recipient_count) * 100)
                    : 0
                return (
                  <View key={broadcast.id} style={styles.broadcastItem}>
                    <Text variant="bodyBold" numberOfLines={1}>
                      {broadcast.title}
                    </Text>
                    <Text variant="body" color="textSubtle" numberOfLines={3}>
                      {broadcast.message}
                    </Text>
                    <View style={styles.broadcastMeta}>
                      <MetaPill
                        icon={<Users size={13} color={SEMANTIC_COLORS.textMuted} />}
                        label={`${broadcast.recipient_count} 位接收者`}
                      />
                      <MetaPill
                        icon={<Eye size={13} color={SEMANTIC_COLORS.textMuted} />}
                        label={`${broadcast.read_count} 已讀 (${readRate}%)`}
                      />
                    </View>
                    <Text variant="caption" color="textMuted">
                      發送者：{broadcast.actor_name || '系統'} ·{' '}
                      {new Date(broadcast.created_at).toLocaleString('zh-TW')}
                    </Text>
                  </View>
                )
              })}
            </View>
          )}

          <View style={styles.pagination}>
            <Text variant="caption" color="textSubtle">
              第 {page} / {totalPages} 頁
            </Text>
            <View style={styles.pageButtons}>
              <Button
                variant="outline"
                size="sm"
                leftIcon={ChevronLeft}
                disabled={page <= 1}
                onPress={() => setPage((current) => Math.max(1, current - 1))}
              >
                上一頁
              </Button>
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
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function MetaPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View style={styles.metaPill}>
      {icon}
      <Text variant="caption" color="textSubtle">
        {label}
      </Text>
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
  userSummary: {
    marginTop: SPACING.xs,
  },
  fullState: {
    flex: 1,
  },
  formCard: {
    gap: SPACING.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  counter: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  resultBox: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  successBox: {
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  resultText: {
    flex: 1,
    gap: 4,
  },
  successText: {
    color: '#15803D',
  },
  errorText: {
    color: '#B91C1C',
  },
  historyCard: {
    padding: SPACING.md,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  loading: {
    paddingVertical: 80,
  },
  stateCard: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
  },
  broadcastList: {
    gap: SPACING.md,
  },
  broadcastItem: {
    gap: SPACING.sm,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: WB_COLORS[10],
  },
  broadcastMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: WB_COLORS[10],
  },
  pagination: {
    gap: SPACING.sm,
    alignItems: 'center',
    paddingTop: SPACING.lg,
  },
  pageButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
})
