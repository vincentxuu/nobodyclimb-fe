import { RADIUS, SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Bell,
  Bot,
  Building2,
  FileText,
  MapPin,
  Megaphone,
  RefreshCw,
  Shield,
  TrendingUp,
  UserCheck,
  Users,
  Video,
} from 'lucide-react-native'
import type React from 'react'
import { useCallback, useMemo, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, EmptyState, Text } from '@/components/ui'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAdminNotificationStats, useAdminSiteStats } from '@/lib/hooks/useAdminDashboard'
import { useAuthStore } from '@/store/authStore'

interface StatTileProps {
  label: string
  value: number | string
  icon: React.ReactNode
}

function StatTile({ label, value, icon }: StatTileProps) {
  return (
    <View style={styles.statTile}>
      <View style={styles.statIcon}>{icon}</View>
      <View>
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

interface AdminLinkProps {
  title: string
  description: string
  icon: React.ReactNode
  onPress?: () => void
  disabled?: boolean
}

function AdminLink({ title, description, icon, onPress, disabled }: AdminLinkProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.linkCard, pressed && styles.pressed]}
      onPress={onPress}
      disabled={disabled || !onPress}
    >
      <View style={[styles.linkIcon, disabled && styles.linkIconDisabled]}>{icon}</View>
      <View style={styles.linkText}>
        <Text variant="bodyBold">{title}</Text>
        <Text variant="caption" color="textSubtle">
          {description}
        </Text>
      </View>
      {disabled && (
        <Text variant="caption" color="textMuted">
          待接上
        </Text>
      )}
    </Pressable>
  )
}

export default function AdminDashboardScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, isAuthenticated } = useAuthStore()
  const [refreshing, setRefreshing] = useState(false)

  const isAdmin = user?.role === 'admin' || user?.role === 'moderator'
  const { data: siteStats, isLoading: statsLoading, error: statsError } = useAdminSiteStats()
  const { data: notificationStats, isLoading: notificationsLoading } = useAdminNotificationStats()

  const isLoading = statsLoading || notificationsLoading
  const hasError = Boolean(statsError)

  const readRate = useMemo(() => {
    const overview = notificationStats?.overview
    if (!overview || overview.total === 0) return 0
    return Math.round(((overview.total - overview.unread) / overview.total) * 100)
  }, [notificationStats])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-site-stats'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-notification-stats'] }),
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
          icon={Shield}
          title="需要管理員權限"
          description="請使用具備管理權限的帳號登入。"
          actionLabel="回到個人頁"
          onAction={() => router.replace('/profile')}
          style={styles.permissionState}
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
          <Shield size={18} color={SEMANTIC_COLORS.textMain} />
          <Text variant="h4" fontWeight="600">
            管理後台
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
            管理後台總覽
          </Text>
          <Text variant="body" color="textSubtle">
            網站數據概覽、通知監控與管理功能入口。
          </Text>
          {siteStats?.updatedAt && (
            <Text variant="caption" color="textMuted" style={styles.updatedAt}>
              更新於 {new Date(siteStats.updatedAt).toLocaleString('zh-TW')}
            </Text>
          )}
        </View>

        {isLoading ? (
          <LoadingSpinner size="large" style={styles.loading} />
        ) : hasError ? (
          <EmptyState
            icon={Activity}
            title="無法載入管理資料"
            description="請稍後重試，或確認帳號權限是否仍有效。"
            actionLabel="重新載入"
            onAction={handleRefresh}
            style={styles.errorState}
          />
        ) : (
          <>
            <View style={styles.section}>
              <Text variant="h4" fontWeight="600" style={styles.sectionTitle}>
                內容統計
              </Text>
              <View style={styles.statsGrid}>
                <StatTile
                  label="岩場"
                  value={siteStats?.crags ?? 0}
                  icon={<MapPin size={20} color={SEMANTIC_COLORS.textMain} />}
                />
                <StatTile
                  label="路線"
                  value={siteStats?.routes ?? 0}
                  icon={<TrendingUp size={20} color={SEMANTIC_COLORS.textMain} />}
                />
                <StatTile
                  label="人物誌"
                  value={siteStats?.biographies ?? 0}
                  icon={<Users size={20} color={SEMANTIC_COLORS.textMain} />}
                />
                <StatTile
                  label="影片"
                  value={siteStats?.videos ?? 0}
                  icon={<Video size={20} color={SEMANTIC_COLORS.textMain} />}
                />
                <StatTile
                  label="文章"
                  value={siteStats?.posts ?? 0}
                  icon={<FileText size={20} color={SEMANTIC_COLORS.textMain} />}
                />
                <StatTile
                  label="岩館"
                  value={siteStats?.gyms ?? 0}
                  icon={<Building2 size={20} color={SEMANTIC_COLORS.textMain} />}
                />
              </View>
            </View>

            {notificationStats && (
              <View style={styles.section}>
                <Text variant="h4" fontWeight="600" style={styles.sectionTitle}>
                  通知系統
                </Text>
                <View style={styles.statsGrid}>
                  <StatTile
                    label="發送總數"
                    value={notificationStats.overview.total}
                    icon={<Bell size={20} color={SEMANTIC_COLORS.textMain} />}
                  />
                  <StatTile
                    label="未讀通知"
                    value={notificationStats.overview.unread}
                    icon={<Activity size={20} color={SEMANTIC_COLORS.textMain} />}
                  />
                  <StatTile
                    label="有通知用戶"
                    value={notificationStats.overview.usersWithNotifications}
                    icon={<Users size={20} color={SEMANTIC_COLORS.textMain} />}
                  />
                  <StatTile
                    label="已讀率"
                    value={`${readRate}%`}
                    icon={<BarChart3 size={20} color={SEMANTIC_COLORS.textMain} />}
                  />
                </View>
              </View>
            )}
          </>
        )}

        <View style={styles.section}>
          <Text variant="h4" fontWeight="600" style={styles.sectionTitle}>
            管理功能
          </Text>
          <View style={styles.linkList}>
            <AdminLink
              title="通知監控"
              description="查看通知統計、發送狀態與廣播紀錄"
              icon={<Bell size={20} color={WB_COLORS[0]} />}
              onPress={() => router.push('/admin/notifications' as never)}
            />
            <AdminLink
              title="用戶管理"
              description="管理用戶帳號、啟用狀態與角色權限"
              icon={<UserCheck size={20} color={WB_COLORS[0]} />}
              onPress={() => router.push('/admin/users' as never)}
            />
            <AdminLink
              title="岩場管理"
              description="維護岩場、區域、路線與關聯影片"
              icon={<MapPin size={20} color={WB_COLORS[0]} />}
              onPress={() => router.push('/admin/crags' as never)}
            />
            <AdminLink
              title="岩館管理"
              description="管理室內攀岩館資訊"
              icon={<Building2 size={20} color={WB_COLORS[0]} />}
              onPress={() => router.push('/admin/gyms' as never)}
            />
            <AdminLink
              title="數據分析"
              description="追蹤社群互動、內容與活躍趨勢"
              icon={<BarChart3 size={20} color={WB_COLORS[0]} />}
              onPress={() => router.push('/admin/analytics' as never)}
            />
            <AdminLink
              title="訪問日誌"
              description="監控 API 請求、錯誤、慢請求與地區分佈"
              icon={<Activity size={20} color={WB_COLORS[0]} />}
              onPress={() => router.push('/admin/logs' as never)}
            />
            <AdminLink
              title="廣播通知"
              description="對用戶群組發送系統通知"
              icon={<Megaphone size={20} color={WB_COLORS[0]} />}
              onPress={() => router.push('/admin/broadcast' as never)}
            />
            <AdminLink
              title="AI 管理"
              description="查看 AI KPI、成本、日誌、Prompt 與知識庫"
              icon={<Bot size={20} color={WB_COLORS[0]} />}
              onPress={() => router.push('/admin/ai' as never)}
            />
          </View>
        </View>

        <View style={styles.systemInfo}>
          <Text variant="h4" fontWeight="600" style={styles.sectionTitle}>
            系統資訊
          </Text>
          <View style={styles.systemGrid}>
            <View style={styles.systemItem}>
              <Text variant="caption" color="textSubtle">
                平台
              </Text>
              <Text variant="bodyBold">NobodyClimb 攀岩社群</Text>
            </View>
            <View style={styles.systemItem}>
              <Text variant="caption" color="textSubtle">
                行動端框架
              </Text>
              <Text variant="bodyBold">Expo + React Native</Text>
            </View>
            <View style={styles.systemItem}>
              <Text variant="caption" color="textSubtle">
                API 部署環境
              </Text>
              <Text variant="bodyBold">Cloudflare Workers</Text>
            </View>
          </View>
        </View>
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
    marginBottom: SPACING.lg,
    gap: 6,
  },
  updatedAt: {
    marginTop: SPACING.xs,
  },
  loading: {
    paddingVertical: 80,
  },
  permissionState: {
    flex: 1,
  },
  errorState: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
    marginBottom: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    marginBottom: SPACING.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  statTile: {
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
  linkIconDisabled: {
    backgroundColor: WB_COLORS[50],
  },
  linkText: {
    flex: 1,
    gap: 4,
  },
  systemInfo: {
    gap: SPACING.sm,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
    backgroundColor: WB_COLORS[10],
    borderRadius: RADIUS.md,
  },
  systemGrid: {
    gap: SPACING.md,
  },
  systemItem: {
    gap: 4,
  },
})
