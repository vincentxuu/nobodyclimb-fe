/**
 * Biography explore topic detail.
 */

import { SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ChevronLeft, Dumbbell, Lightbulb, Mountain } from 'lucide-react-native'
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { RecentCompletedStories, TrendingGoals } from '@/components/biography/explore'
import { Breadcrumb, Card, IconButton, Text } from '@/components/ui'

const TOPICS: Record<
  string,
  {
    title: string
    description: string
    filter: string
    icon: React.ElementType
    iconColor: string
    iconBg: string
  }
> = {
  fear: {
    title: '克服恐懼經驗',
    description: '分享如何面對和克服攀岩中的恐懼。',
    filter: 'experience',
    icon: Mountain,
    iconColor: '#DB2777',
    iconBg: '#FCE7F3',
  },
  recovery: {
    title: '受傷復原故事',
    description: '受傷後的復健、調整與重返岩壁的歷程。',
    filter: 'recovery',
    icon: Mountain,
    iconColor: '#DC2626',
    iconBg: '#FEE2E2',
  },
  experience: {
    title: '攀登經驗分享',
    description: '難忘的攀登經歷、目標與完成心得。',
    filter: 'experience',
    icon: Mountain,
    iconColor: '#16A34A',
    iconBg: '#DCFCE7',
  },
  training: {
    title: '訓練心得',
    description: '有效的訓練方法、技巧累積與成長故事。',
    filter: 'growth',
    icon: Dumbbell,
    iconColor: '#9333EA',
    iconBg: '#F3E8FF',
  },
}

export default function ExploreTopicScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const topicId = Array.isArray(id) ? id[0] : id
  const topic = TOPICS[topicId ?? ''] ?? {
    title: '技巧與經驗分享',
    description: '探索攀岩者分享的目標、完成故事與實戰心得。',
    filter: 'all',
    icon: Lightbulb,
    iconColor: SEMANTIC_COLORS.warning,
    iconBg: '#FEF3C7',
  }
  const Icon = topic.icon

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.navbar}>
        <IconButton
          icon={<ChevronLeft size={24} color={SEMANTIC_COLORS.textMain} />}
          onPress={() => router.back()}
          variant="ghost"
        />
        <Text variant="h4" fontWeight="600" numberOfLines={1} style={styles.navTitle}>
          {topic.title}
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
              { label: topic.title },
            ]}
          />
        </View>

        <Card style={styles.heroCard}>
          <View style={[styles.heroIcon, { backgroundColor: topic.iconBg }]}>
            <Icon size={28} color={topic.iconColor} />
          </View>
          <View style={styles.heroText}>
            <Text variant="h3" fontWeight="700">
              {topic.title}
            </Text>
            <Text variant="body" color="textSubtle" style={styles.heroDescription}>
              {topic.description}
            </Text>
          </View>
        </Card>

        <View style={styles.section}>
          <RecentCompletedStories
            filter={topic.filter}
            title="相關完成故事"
            emptyMessage="目前沒有相關完成故事"
          />
        </View>

        <View style={styles.section}>
          <TrendingGoals
            filter={topic.filter}
            title="相關熱門目標"
            emptyMessage="目前沒有相關熱門目標"
          />
        </View>

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
  heroCard: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    flex: 1,
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
