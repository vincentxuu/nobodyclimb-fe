import { RADIUS, SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import {
  Activity,
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Mail,
  Mountain,
  RefreshCw,
  Shield,
  TrendingUp,
  UserCheck,
  Users,
  UserX,
  X,
} from 'lucide-react-native'
import { useCallback, useMemo, useState } from 'react'
import {
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, EmptyState, SearchInput, Select, Text } from '@/components/ui'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
  type AdminUser,
  type AdminUsersOptions,
  type RankId,
  useAdminUserRankDetail,
  useAdminUserStats,
  useAdminUsers,
  useOverrideAdminUserRank,
  useRecalculateAdminUserRank,
  useUpdateAdminUserRole,
  useUpdateAdminUserStatus,
} from '@/lib/hooks/useAdminDashboard'
import { useAuthStore } from '@/store/authStore'

const roleLabels: Record<string, string> = {
  user: '一般用戶',
  admin: '管理員',
  moderator: '版主',
}

const authProviderLabels: Record<string, string> = {
  local: '本地註冊',
  google: 'Google',
}

const rankLabels: Record<string, string> = {
  foothill: '麓',
  wall: '壁',
  ridge: '稜',
  summit: '巔',
}

const rankColors: Record<string, { bg: string; text: string }> = {
  foothill: { bg: '#F5F5F4', text: '#57534E' },
  wall: { bg: '#DBEAFE', text: '#1D4ED8' },
  ridge: { bg: '#EDE9FE', text: '#6D28D9' },
  summit: { bg: '#FEF3C7', text: '#B45309' },
}

const rankOptions: { id: RankId; label: string }[] = [
  { id: 'summit', label: '巔' },
  { id: 'ridge', label: '稜' },
  { id: 'wall', label: '壁' },
  { id: 'foothill', label: '麓' },
]

export default function AdminUsersScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, isAuthenticated } = useAuthStore()
  const [refreshing, setRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [activityFilter, setActivityFilter] = useState('')
  const [sortBy, setSortBy] = useState<'created_at' | 'last_active_at'>('created_at')
  const [rankModalUser, setRankModalUser] = useState<{ id: string; username: string } | null>(null)

  const isAdmin = user?.role === 'admin' || user?.role === 'moderator'
  const options = useMemo<AdminUsersOptions>(
    () => ({
      page,
      limit: 20,
      search: search.trim() || undefined,
      role: roleFilter || undefined,
      status: statusFilter || undefined,
      sort: sortBy,
      activity: (activityFilter as AdminUsersOptions['activity']) || undefined,
    }),
    [activityFilter, page, roleFilter, search, sortBy, statusFilter]
  )

  const { data: usersData, isLoading, error } = useAdminUsers(options)
  const { data: stats } = useAdminUserStats()
  const updateStatus = useUpdateAdminUserStatus()
  const updateRole = useUpdateAdminUserRole()
  const recalculateRank = useRecalculateAdminUserRank()

  const totalPages = usersData?.pagination.total_pages ?? 1
  const total = usersData?.pagination.total ?? 0
  const users = usersData?.users ?? []
  const actionPending = updateStatus.isPending || updateRole.isPending

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] }),
    ])
    setRefreshing(false)
  }, [queryClient])

  const handleToggleStatus = useCallback(
    (target: AdminUser) => {
      Alert.alert(
        target.is_active ? '停用帳號' : '啟用帳號',
        `確定要${target.is_active ? '停用' : '啟用'} ${target.display_name || target.username}？`,
        [
          { text: '取消', style: 'cancel' },
          {
            text: '確定',
            style: target.is_active ? 'destructive' : 'default',
            onPress: () => updateStatus.mutate({ id: target.id, isActive: target.is_active === 0 }),
          },
        ]
      )
    },
    [updateStatus]
  )

  const handleChangeRole = useCallback(
    (target: AdminUser, role: 'user' | 'admin' | 'moderator') => {
      if (target.role === role) return
      Alert.alert(
        '更改角色',
        `確定要將 ${target.display_name || target.username} 設為${roleLabels[role]}？`,
        [
          { text: '取消', style: 'cancel' },
          {
            text: '確定',
            style: role === 'admin' ? 'destructive' : 'default',
            onPress: () => updateRole.mutate({ id: target.id, role }),
          },
        ]
      )
    },
    [updateRole]
  )

  const handleRecalculateAll = useCallback(() => {
    Alert.alert('全體重算積分', '確定要重算所有用戶積分嗎？此操作會在背景執行。', [
      { text: '取消', style: 'cancel' },
      {
        text: '確定',
        onPress: () => recalculateRank.mutate('all'),
      },
    ])
  }, [recalculateRank])

  if (!isAuthenticated || !isAdmin) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.navbar}>
          <Button variant="ghost" size="sm" leftIcon={ArrowLeft} onPress={() => router.back()}>
            返回
          </Button>
        </View>
        <EmptyState
          icon={Shield}
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
          <UserCheck size={18} color={SEMANTIC_COLORS.textMain} />
          <Text variant="h4" fontWeight="600">
            用戶管理
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
            用戶管理
          </Text>
          <Text variant="body" color="textSubtle">
            管理平台用戶帳號、啟用狀態、角色權限與活躍篩選。
          </Text>
          <Button
            variant="outline"
            size="sm"
            leftIcon={Mountain}
            onPress={handleRecalculateAll}
            loading={recalculateRank.isPending}
            style={styles.recalculateAllButton}
          >
            全體重算積分
          </Button>
        </View>

        {stats && (
          <View style={styles.statsGrid}>
            <StatCard
              label="總用戶數"
              value={stats.total}
              icon={<Users size={20} color={SEMANTIC_COLORS.textMain} />}
            />
            <StatCard
              label="已啟用帳號"
              value={stats.active}
              icon={<UserCheck size={20} color={SEMANTIC_COLORS.textMain} />}
            />
            <StatCard
              label="本週新增"
              value={stats.newThisWeek}
              icon={<TrendingUp size={20} color={SEMANTIC_COLORS.textMain} />}
            />
            <StatCard
              label="本月新增"
              value={stats.newThisMonth}
              icon={<Calendar size={20} color={SEMANTIC_COLORS.textMain} />}
            />
          </View>
        )}

        <View style={styles.filterCard}>
          <SearchInput
            value={search}
            onChangeText={(value) => {
              setSearch(value)
              setPage(1)
            }}
            placeholder="搜尋用戶名稱、Email..."
            style={styles.searchInput}
          />
          <View style={styles.filterGrid}>
            <Select
              value={roleFilter}
              onValueChange={(value) => {
                setRoleFilter(value)
                setPage(1)
              }}
              title="角色"
              options={[
                { value: '', label: '所有角色' },
                { value: 'user', label: '一般用戶' },
                { value: 'moderator', label: '版主' },
                { value: 'admin', label: '管理員' },
              ]}
            />
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value)
                setPage(1)
              }}
              title="帳號狀態"
              options={[
                { value: '', label: '所有狀態' },
                { value: 'active', label: '已啟用' },
                { value: 'inactive', label: '已停用' },
              ]}
            />
            <Select
              value={activityFilter}
              onValueChange={(value) => {
                setActivityFilter(value)
                setPage(1)
              }}
              title="活躍度"
              options={[
                { value: '', label: '全部活躍度' },
                { value: 'recent_7d', label: '近 7 天活躍' },
                { value: 'recent_30d', label: '近 30 天活躍' },
                { value: 'inactive_30d', label: '超過 30 天未登入' },
              ]}
            />
            <Select
              value={sortBy}
              onValueChange={(value) => {
                setSortBy(value as 'created_at' | 'last_active_at')
                setPage(1)
              }}
              title="排序"
              options={[
                { value: 'created_at', label: '註冊時間' },
                { value: 'last_active_at', label: '最近活躍' },
              ]}
            />
          </View>
        </View>

        {isLoading && users.length === 0 ? (
          <LoadingSpinner size="large" style={styles.loading} />
        ) : error ? (
          <EmptyState
            icon={Activity}
            title="無法載入用戶資料"
            description="請稍後重試，或確認帳號權限是否仍有效。"
            actionLabel="重新載入"
            onAction={handleRefresh}
            style={styles.stateCard}
          />
        ) : (
          <View style={styles.userList}>
            {users.map((item) => (
              <UserCard
                key={item.id}
                user={item}
                actionPending={actionPending}
                onToggleStatus={handleToggleStatus}
                onChangeRole={handleChangeRole}
                onOpenRank={(target) =>
                  setRankModalUser({
                    id: target.id,
                    username: target.display_name || target.username,
                  })
                }
              />
            ))}
            {users.length === 0 && (
              <EmptyState
                icon={Users}
                title="沒有找到符合條件的用戶"
                description="請調整搜尋或篩選條件。"
                style={styles.stateCard}
              />
            )}
          </View>
        )}

        <View style={styles.pagination}>
          <Text variant="caption" color="textSubtle">
            共 {total} 位用戶，第 {page} / {totalPages} 頁
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
      </ScrollView>
      <UserRankModal user={rankModalUser} onClose={() => setRankModalUser(null)} />
    </SafeAreaView>
  )
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>{icon}</View>
      <View>
        <Text variant="caption" color="textSubtle">
          {label}
        </Text>
        <Text variant="h3" fontWeight="700">
          {value.toLocaleString()}
        </Text>
      </View>
    </View>
  )
}

function UserCard({
  user,
  actionPending,
  onToggleStatus,
  onChangeRole,
  onOpenRank,
}: {
  user: AdminUser
  actionPending: boolean
  onToggleStatus: (user: AdminUser) => void
  onChangeRole: (user: AdminUser, role: 'user' | 'admin' | 'moderator') => void
  onOpenRank: (user: AdminUser) => void
}) {
  return (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        {user.avatar_url ? (
          <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Users size={20} color={SEMANTIC_COLORS.textMuted} />
          </View>
        )}
        <View style={styles.userInfo}>
          <Text variant="bodyBold" numberOfLines={1}>
            {user.display_name || user.username}
          </Text>
          <Text variant="caption" color="textSubtle" numberOfLines={1}>
            @{user.username}
          </Text>
        </View>
        <View style={[styles.statusPill, user.is_active ? styles.activePill : styles.inactivePill]}>
          {user.is_active ? (
            <UserCheck size={12} color="#15803D" />
          ) : (
            <UserX size={12} color="#B91C1C" />
          )}
          <Text variant="caption" style={user.is_active ? styles.activeText : styles.inactiveText}>
            {user.is_active ? '已啟用' : '已停用'}
          </Text>
        </View>
      </View>

      <View style={styles.metaRows}>
        <MetaRow
          icon={<Mail size={14} color={SEMANTIC_COLORS.textMuted} />}
          label="Email"
          value={user.email}
        />
        <MetaRow
          icon={<Shield size={14} color={SEMANTIC_COLORS.textMuted} />}
          label="角色"
          value={roleLabels[user.role] || user.role}
        />
        <MetaRow
          icon={<Clock size={14} color={SEMANTIC_COLORS.textMuted} />}
          label="最後活躍"
          value={formatRelativeTime(user.last_active_at)}
        />
        <MetaRow
          icon={<Calendar size={14} color={SEMANTIC_COLORS.textMuted} />}
          label="註冊"
          value={formatDate(user.created_at)}
        />
      </View>

      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Text variant="caption" color="textSubtle">
            {authProviderLabels[user.auth_provider] || user.auth_provider}
          </Text>
        </View>
        {user.rank_id && (
          <View style={styles.badge}>
            <Text variant="caption" color="textSubtle">
              {rankLabels[user.rank_id] ?? user.rank_id}
              {user.rank_score != null ? ` ${user.rank_score}分` : ''}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <Button
          variant="outline"
          size="sm"
          leftIcon={Mountain}
          onPress={() => onOpenRank(user)}
          style={styles.actionButton}
        >
          等級
        </Button>
        <Button
          variant={user.is_active ? 'outline' : 'secondary'}
          size="sm"
          leftIcon={user.is_active ? UserX : UserCheck}
          disabled={actionPending}
          onPress={() => onToggleStatus(user)}
          style={styles.actionButton}
        >
          {user.is_active ? '停用' : '啟用'}
        </Button>
        {(['user', 'moderator', 'admin'] as const).map((role) => (
          <Button
            key={role}
            variant={user.role === role ? 'secondary' : 'ghost'}
            size="sm"
            disabled={actionPending || user.role === role}
            onPress={() => onChangeRole(user, role)}
            style={styles.roleButton}
          >
            {roleLabels[role]}
          </Button>
        ))}
      </View>
    </View>
  )
}

function UserRankModal({
  user,
  onClose,
}: {
  user: { id: string; username: string } | null
  onClose: () => void
}) {
  const { data: rank, isLoading, error, refetch } = useAdminUserRankDetail(user?.id ?? null)
  const recalculateRank = useRecalculateAdminUserRank()
  const overrideRank = useOverrideAdminUserRank()
  const isMutating = recalculateRank.isPending || overrideRank.isPending

  const handleRecalculate = async () => {
    if (!user) return
    await recalculateRank.mutateAsync(user.id)
    refetch()
  }

  const handleOverride = async (rankId: RankId | null) => {
    if (!user) return
    await overrideRank.mutateAsync({ userId: user.id, rank: rankId })
    refetch()
  }

  const scoreItems = rank
    ? [
        { label: '個人頁文字欄位', value: rank.score_breakdown.biography_fields, max: 15 },
        { label: '人生清單欄位', value: rank.score_breakdown.biography_bucket_list, max: 3 },
        { label: '公開個人頁', value: rank.score_breakdown.biography_public, max: 5 },
        { label: '核心故事', value: rank.score_breakdown.core_stories, max: 24 },
        { label: 'One-liners', value: rank.score_breakdown.one_liners, max: 20 },
        { label: 'Stories', value: rank.score_breakdown.stories, max: 15 },
        { label: '攀爬記錄', value: rank.score_breakdown.route_ascents, max: 20 },
        { label: '人生清單項目', value: rank.score_breakdown.bucket_list_items, max: 10 },
        { label: '人生清單已完成', value: rank.score_breakdown.bucket_list_completed, max: 10 },
      ]
    : []

  return (
    <Modal visible={Boolean(user)} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.rankModal}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleRow}>
              <Mountain size={18} color={SEMANTIC_COLORS.textMain} />
              <Text variant="bodyBold" numberOfLines={1} style={styles.modalTitle}>
                {user?.username} 的等級詳情
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.modalCloseButton}>
              <X size={18} color={SEMANTIC_COLORS.textMuted} />
            </Pressable>
          </View>

          {isLoading ? (
            <LoadingSpinner size="large" style={styles.modalLoading} />
          ) : error ? (
            <View style={styles.modalBody}>
              <View style={styles.warningBox}>
                <Text variant="body" style={styles.warningText}>
                  該用戶尚無等級記錄，可建立並計算積分。
                </Text>
              </View>
              <Button
                fullWidth
                leftIcon={RefreshCw}
                loading={recalculateRank.isPending}
                onPress={handleRecalculate}
              >
                建立積分記錄
              </Button>
            </View>
          ) : rank ? (
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.rankSummary}>
                <View style={styles.rankBadgeRow}>
                  <View
                    style={[
                      styles.rankBadge,
                      { backgroundColor: rankColors[rank.rank_id]?.bg ?? WB_COLORS[10] },
                    ]}
                  >
                    <Text
                      variant="bodyBold"
                      style={{ color: rankColors[rank.rank_id]?.text ?? SEMANTIC_COLORS.textMain }}
                    >
                      {rank.rank_display_name}
                    </Text>
                  </View>
                  {rank.rank_override_id && (
                    <View style={styles.overrideBadge}>
                      <Text variant="caption" style={styles.overrideText}>
                        手動覆寫
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.scoreBlock}>
                  <Text variant="h2" fontWeight="700">
                    {rank.score}
                  </Text>
                  <Text variant="caption" color="textMuted">
                    積分
                  </Text>
                </View>
              </View>

              <View style={styles.aiQuotaRow}>
                <Text variant="body" color="textSubtle">
                  今日 AI 使用量
                </Text>
                <Text variant="bodyBold">
                  {rank.daily_ai_used} / {rank.daily_ai_limit} 次
                </Text>
              </View>

              <View style={styles.scoreBreakdown}>
                <Text variant="caption" color="textMuted" style={styles.sectionLabel}>
                  積分明細
                </Text>
                {scoreItems.map((item) => (
                  <View key={item.label} style={styles.scoreRow}>
                    <Text variant="caption" color="textSubtle" style={styles.scoreLabel}>
                      {item.label}
                    </Text>
                    <Text variant="caption" style={item.value > 0 ? undefined : styles.zeroScore}>
                      {item.value} / {item.max}
                    </Text>
                  </View>
                ))}
              </View>

              {rank.last_score_calculated_at && (
                <Text
                  variant="caption"
                  color="textMuted"
                  align="center"
                  style={styles.calculatedAt}
                >
                  最後計算：{new Date(rank.last_score_calculated_at).toLocaleString('zh-TW')}
                </Text>
              )}

              <View style={styles.rankActions}>
                <Text variant="caption" color="textMuted" style={styles.sectionLabel}>
                  手動操作
                </Text>
                <Button
                  variant="outline"
                  fullWidth
                  leftIcon={RefreshCw}
                  loading={recalculateRank.isPending}
                  disabled={isMutating}
                  onPress={handleRecalculate}
                >
                  立即重算積分
                </Button>
                <View style={styles.overrideOptions}>
                  {rankOptions.map((option) => (
                    <Button
                      key={option.id}
                      variant={rank.rank_override_id === option.id ? 'secondary' : 'ghost'}
                      size="sm"
                      disabled={isMutating}
                      onPress={() => handleOverride(option.id)}
                      style={styles.rankOptionButton}
                    >
                      {option.label}
                    </Button>
                  ))}
                  {rank.rank_override_id && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isMutating}
                      onPress={() => handleOverride(null)}
                      style={styles.clearOverrideButton}
                    >
                      清除覆寫
                    </Button>
                  )}
                </View>
              </View>
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  )
}

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      {icon}
      <Text variant="caption" color="textMuted" style={styles.metaLabel}>
        {label}
      </Text>
      <Text variant="caption" color="textSubtle" numberOfLines={1} style={styles.metaValue}>
        {value}
      </Text>
    </View>
  )
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('zh-TW')
}

function formatRelativeTime(value: string | null) {
  if (!value) return '從未登入'
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes} 分鐘前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小時前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} 天前`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} 個月前`
  return `${Math.floor(months / 12)} 年前`
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
  recalculateAllButton: {
    alignSelf: 'flex-start',
    marginTop: SPACING.xs,
  },
  fullState: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
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
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WB_COLORS[10],
  },
  filterCard: {
    gap: SPACING.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  searchInput: {
    marginBottom: 0,
  },
  filterGrid: {
    gap: SPACING.sm,
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
  userList: {
    gap: SPACING.md,
  },
  userCard: {
    gap: SPACING.md,
    padding: SPACING.md,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WB_COLORS[20],
  },
  userInfo: {
    flex: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  activePill: {
    backgroundColor: '#DCFCE7',
  },
  inactivePill: {
    backgroundColor: '#FEE2E2',
  },
  activeText: {
    color: '#15803D',
  },
  inactiveText: {
    color: '#B91C1C',
  },
  metaRows: {
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaLabel: {
    width: 58,
  },
  metaValue: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: WB_COLORS[10],
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  actionButton: {
    minWidth: 86,
  },
  roleButton: {
    minWidth: 84,
  },
  pagination: {
    gap: SPACING.sm,
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  pageButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  rankModal: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '86%',
    padding: SPACING.md,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  modalTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    flex: 1,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: WB_COLORS[10],
  },
  modalLoading: {
    paddingVertical: 80,
  },
  modalBody: {
    gap: SPACING.md,
  },
  modalScroll: {
    maxHeight: 560,
  },
  warningBox: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
    backgroundColor: '#FEF3C7',
  },
  warningText: {
    color: '#92400E',
  },
  rankSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: WB_COLORS[5],
    borderWidth: 1,
    borderColor: WB_COLORS[10],
  },
  rankBadgeRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  rankBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: 999,
  },
  overrideBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  overrideText: {
    color: '#B45309',
  },
  scoreBlock: {
    alignItems: 'flex-end',
  },
  aiQuotaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
  },
  scoreBreakdown: {
    gap: 8,
    paddingTop: SPACING.sm,
  },
  sectionLabel: {
    marginBottom: SPACING.xs,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  scoreLabel: {
    flex: 1,
  },
  zeroScore: {
    color: SEMANTIC_COLORS.textMuted,
  },
  calculatedAt: {
    marginTop: SPACING.md,
  },
  rankActions: {
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: WB_COLORS[10],
  },
  overrideOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  rankOptionButton: {
    minWidth: 56,
  },
  clearOverrideButton: {
    minWidth: 96,
  },
})
