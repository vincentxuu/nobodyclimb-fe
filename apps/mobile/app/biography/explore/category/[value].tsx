/**
 * Biography explore category detail.
 */

import { SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ChevronLeft } from 'lucide-react-native'
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { RecentCompletedStories, TrendingGoals } from '@/components/biography/explore'
import { Breadcrumb, IconButton, Text } from '@/components/ui'

const BUCKET_LIST_CATEGORIES = [
  { value: 'outdoor_route', label: '戶外路線' },
  { value: 'indoor_grade', label: '室內難度' },
  { value: 'competition', label: '比賽' },
  { value: 'training', label: '訓練' },
  { value: 'adventure', label: '冒險' },
  { value: 'skill', label: '技巧' },
  { value: 'injury_recovery', label: '傷後復健' },
  { value: 'other', label: '其他' },
] as const

function getCategoryLabel(value: string) {
  return BUCKET_LIST_CATEGORIES.find((category) => category.value === value)?.label ?? value
}

export default function ExploreCategoryScreen() {
  const router = useRouter()
  const { value } = useLocalSearchParams<{ value: string }>()
  const category = Array.isArray(value) ? value[0] : value
  const label = category ? getCategoryLabel(category) : '分類'

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.navbar}>
        <IconButton
          icon={<ChevronLeft size={24} color={SEMANTIC_COLORS.textMain} />}
          onPress={() => router.back()}
          variant="ghost"
        />
        <Text variant="h4" fontWeight="600" numberOfLines={1} style={styles.navTitle}>
          {label}
        </Text>
        <View style={styles.navSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => undefined} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.breadcrumbContainer}>
          <Breadcrumb
            items={[
              { label: '人物誌', href: '/biography' },
              { label: '探索', href: '/biography/explore' },
              { label },
            ]}
          />
        </View>

        <View style={styles.hero}>
          <Text variant="h2" fontWeight="700">
            {label}
          </Text>
          <Text variant="body" color="textSubtle" style={styles.heroDescription}>
            查看這個分類下最受歡迎的攀岩目標，以及最近完成的真實故事。
          </Text>
        </View>

        {category ? (
          <>
            <View style={styles.section}>
              <TrendingGoals
                category={category}
                title={`${label}熱門目標`}
                emptyMessage={`目前沒有 ${label} 的熱門目標`}
              />
            </View>

            <View style={styles.section}>
              <RecentCompletedStories
                category={category}
                title={`${label}完成故事`}
                emptyMessage={`目前沒有 ${label} 的完成故事`}
              />
            </View>
          </>
        ) : null}

        <View style={styles.bottomPadding} />
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
    borderBottomColor: '#F0F0F0',
  },
  navTitle: {
    flex: 1,
    textAlign: 'center',
  },
  navSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  breadcrumbContainer: {
    marginBottom: SPACING.md,
  },
  hero: {
    marginBottom: SPACING.lg,
  },
  heroDescription: {
    marginTop: SPACING.xs,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  bottomPadding: {
    height: SPACING.xxl,
  },
})
