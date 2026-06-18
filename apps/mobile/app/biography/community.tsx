import { SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { ArrowLeft, BookOpen, RefreshCw, Users } from 'lucide-react-native'
import { useCallback, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CommunityDashboard } from '@/components/biography/stats'
import { Breadcrumb, Button, EmptyState, Text } from '@/components/ui'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useCommunityStats, useLeaderboard } from '@/lib/hooks/useBiographyStats'

export default function CommunityStatsScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)

  const { data: stats, isLoading: statsLoading, error: statsError, refetch } = useCommunityStats()
  const { data: goalsLeaderboard, isLoading: goalsLoading } = useLeaderboard('goals_completed', 10)
  const { data: followersLeaderboard, isLoading: followersLoading } = useLeaderboard(
    'followers',
    10
  )
  const { data: likesLeaderboard, isLoading: likesLoading } = useLeaderboard('likes_received', 10)

  const isLoading = statsLoading || goalsLoading || followersLoading || likesLoading

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([
      refetch(),
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] }),
      queryClient.invalidateQueries({ queryKey: ['community-stats'] }),
    ])
    setRefreshing(false)
  }, [queryClient, refetch])

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.navbar}>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={ArrowLeft}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          返回
        </Button>
        <View style={styles.navTitle}>
          <Users size={18} color={SEMANTIC_COLORS.textMain} />
          <Text variant="h4" fontWeight="600">
            社群統計
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
          <Breadcrumb
            items={[
              { label: '首頁', onPress: () => router.push('/') },
              { label: '人物誌', onPress: () => router.push('/biography') },
              { label: '社群統計' },
            ]}
            style={styles.breadcrumb}
          />
          <Text variant="h2" fontWeight="700" style={styles.title}>
            攀岩人物誌社群
          </Text>
          <Text variant="body" color="textSubtle">
            查看人物誌總覽、目標完成率、熱門分類與排行榜。
          </Text>
        </View>

        {isLoading ? (
          <LoadingSpinner size="large" style={styles.loading} />
        ) : statsError ? (
          <EmptyState
            icon={Users}
            title="無法載入社群統計"
            description="請確認網路連線後再試一次。"
            actionLabel="重新載入"
            onAction={handleRefresh}
            style={styles.emptyState}
          />
        ) : stats ? (
          <CommunityDashboard
            stats={stats}
            leaderboards={{
              goalsCompleted: goalsLeaderboard ?? [],
              followers: followersLeaderboard ?? [],
              likesReceived: likesLeaderboard ?? [],
            }}
          />
        ) : null}

        <View style={styles.linkGrid}>
          <Pressable
            style={styles.linkCard}
            onPress={() => router.push('/biography/explore' as never)}
          >
            <BookOpen size={22} color={SEMANTIC_COLORS.textMain} />
            <View style={styles.linkText}>
              <Text variant="bodyBold">探索故事</Text>
              <Text variant="caption" color="textSubtle">
                看熱門目標與最新完成故事
              </Text>
            </View>
          </Pressable>
          <Pressable style={styles.linkCard} onPress={() => router.push('/biography' as never)}>
            <Users size={22} color={SEMANTIC_COLORS.textMain} />
            <View style={styles.linkText}>
              <Text variant="bodyBold">瀏覽人物誌</Text>
              <Text variant="caption" color="textSubtle">
                回到攀岩者故事列表
              </Text>
            </View>
          </Pressable>
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
  backButton: {
    minWidth: 72,
  },
  refreshButton: {
    minWidth: 44,
  },
  navTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  },
  breadcrumb: {
    marginBottom: SPACING.md,
  },
  title: {
    marginBottom: SPACING.xs,
  },
  loading: {
    paddingVertical: 80,
  },
  emptyState: {
    marginVertical: 32,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  linkGrid: {
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  linkText: {
    flex: 1,
    gap: 4,
  },
})
