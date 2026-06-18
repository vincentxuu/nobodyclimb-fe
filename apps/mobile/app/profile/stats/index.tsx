import { SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import { useRouter } from 'expo-router'
import { Award, BarChart3, ChevronLeft, Target, TrendingUp, Trophy } from 'lucide-react-native'
import type React from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BadgeShowcase, StatsOverview } from '@/components/biography/stats'
import { Button, Text } from '@/components/ui'
import { useBiographyBadges } from '@/lib/hooks/useBiographyStats'
import { useProfileStats } from '@/lib/hooks/useProfileStats'

function SummaryCard({
  icon,
  label,
  value,
  accent = false,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  accent?: boolean
}) {
  return (
    <View style={[styles.summaryCard, accent && styles.summaryCardAccent]}>
      <View style={styles.summaryHeader}>
        {icon}
        <Text style={styles.summaryLabel}>{label}</Text>
      </View>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  )
}

export default function StatsScreen() {
  const router = useRouter()
  const {
    data: stats,
    biography,
    hasBiography,
    isLoading,
    isBiographyLoading,
    isBiographyError,
    isStatsError,
    refetch: refetchStats,
  } = useProfileStats()
  const {
    data: badgesData,
    isLoading: badgesLoading,
    isError: isBadgesError,
    refetch: refetchBadges,
  } = useBiographyBadges(biography?.id)

  const unlockedBadges = badgesData?.progress?.filter((badge) => badge.unlocked).length ?? 0
  const totalBadges = badgesData?.progress?.length ?? 0

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={WB_COLORS[70]} />
        </Pressable>
        <Text style={styles.title}>個人統計</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {isBiographyLoading ? (
          <ActivityIndicator style={{ marginTop: SPACING.xl }} color={SEMANTIC_COLORS.success} />
        ) : !hasBiography ? (
          <View style={styles.emptyCard}>
            <BarChart3 size={48} color={WB_COLORS[40]} />
            <Text style={styles.emptyTitle}>尚未建立人物誌</Text>
            <Text style={styles.emptyText}>建立人物誌後，就能查看瀏覽、目標、故事與徽章進度。</Text>
            <Button onPress={() => router.push('/profile')} style={styles.emptyButton}>
              建立人物誌
            </Button>
          </View>
        ) : isBiographyError ? (
          <View style={styles.emptyCard}>
            <BarChart3 size={48} color={WB_COLORS[40]} />
            <Text style={styles.emptyTitle}>統計載入失敗</Text>
            <Text style={styles.emptyText}>請稍後再試。</Text>
            <Button onPress={() => refetchStats()} style={styles.emptyButton}>
              重新載入
            </Button>
          </View>
        ) : (
          <>
            <View>
              <Text style={styles.pageTitle}>成就統計</Text>
              <Text style={styles.pageSubtitle}>追蹤你的人物誌、人生清單與社群互動進度。</Text>
            </View>

            <View style={styles.summaryGrid}>
              <SummaryCard
                icon={<TrendingUp size={20} color={SEMANTIC_COLORS.textMain} />}
                label="瀏覽次數"
                value={isStatsError ? '—' : (stats?.total_views ?? 0)}
              />
              <SummaryCard
                icon={<Award size={20} color={SEMANTIC_COLORS.textMain} />}
                label="收到的讚"
                value={isStatsError ? '—' : (stats?.total_likes ?? 0)}
              />
              <SummaryCard
                icon={<Trophy size={20} color={SEMANTIC_COLORS.textMain} />}
                label="解鎖徽章"
                value={isBadgesError ? '—' : `${unlockedBadges}/${totalBadges}`}
                accent
              />
              <SummaryCard
                icon={<Target size={20} color={SEMANTIC_COLORS.textMain} />}
                label="完成目標"
                value={isStatsError ? '—' : (stats?.bucket_list?.completed ?? 0)}
              />
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <BarChart3 size={20} color={SEMANTIC_COLORS.textMain} />
                <Text style={styles.sectionTitle}>詳細統計</Text>
              </View>
              {isLoading ? (
                <ActivityIndicator color={SEMANTIC_COLORS.success} />
              ) : isStatsError ? (
                <View style={styles.inlineEmpty}>
                  <Text style={styles.emptyText}>統計資料載入失敗，請稍後再試。</Text>
                  <Button onPress={() => refetchStats()} style={styles.emptyButton}>
                    重新載入統計
                  </Button>
                </View>
              ) : stats ? (
                <StatsOverview stats={stats} />
              ) : (
                <Text style={styles.emptyText}>目前沒有統計資料。</Text>
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Award size={20} color={SEMANTIC_COLORS.textMain} />
                <Text style={styles.sectionTitle}>徽章收藏</Text>
              </View>
              {badgesLoading ? (
                <ActivityIndicator color={SEMANTIC_COLORS.success} />
              ) : isBadgesError ? (
                <View style={styles.inlineEmpty}>
                  <Text style={styles.emptyText}>徽章資料載入失敗，請稍後再試。</Text>
                  <Button onPress={() => refetchBadges()} style={styles.emptyButton}>
                    重新載入徽章
                  </Button>
                </View>
              ) : (
                <BadgeShowcase badgeProgress={badgesData?.progress ?? []} />
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SEMANTIC_COLORS.pageBg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: SEMANTIC_COLORS.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '600' },
  content: { padding: SPACING.md, gap: SPACING.lg },
  pageTitle: { fontSize: 22, fontWeight: '700', color: SEMANTIC_COLORS.textMain },
  pageSubtitle: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: SEMANTIC_COLORS.textSubtle,
  },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  summaryCard: {
    width: '48%',
    minHeight: 96,
    padding: SPACING.md,
    borderRadius: 8,
    backgroundColor: WB_COLORS[0],
    borderWidth: 1,
    borderColor: SEMANTIC_COLORS.border,
  },
  summaryCardAccent: { backgroundColor: '#FFF4CC' },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  summaryLabel: { flex: 1, fontSize: 13, color: SEMANTIC_COLORS.textSubtle },
  summaryValue: {
    marginTop: SPACING.sm,
    fontSize: 24,
    fontWeight: '700',
    color: SEMANTIC_COLORS.textMain,
  },
  section: {
    padding: SPACING.md,
    gap: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: SEMANTIC_COLORS.border,
    backgroundColor: WB_COLORS[0],
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: SEMANTIC_COLORS.textMain },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.xl,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: SEMANTIC_COLORS.border,
    backgroundColor: WB_COLORS[0],
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: SEMANTIC_COLORS.textMain },
  emptyText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    color: SEMANTIC_COLORS.textSubtle,
  },
  inlineEmpty: {
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
  },
  emptyButton: { marginTop: SPACING.sm },
})
