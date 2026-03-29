import { SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import { useRouter } from 'expo-router'
import { ChevronLeft } from 'lucide-react-native'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BadgeShowcase, StatsOverview } from '@/components/biography/stats'
import { Text } from '@/components/ui'
import { useProfileStats } from '@/lib/hooks/useProfileStats'
export default function StatsScreen() {
  const router = useRouter()
  const { data: stats, isLoading } = useProfileStats()

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={WB_COLORS[70]} />
        </Pressable>
        <Text style={styles.title}>個人統計</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView>
        {isLoading && (
          <ActivityIndicator style={{ marginTop: SPACING.xl }} color={SEMANTIC_COLORS.success} />
        )}
        {stats && <StatsOverview stats={stats} />}
        {stats?.badges && (
          <View style={styles.badgeSection}>
            <Text style={styles.sectionTitle}>成就徽章</Text>
            <BadgeShowcase badges={stats.badges} />
          </View>
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
  badgeSection: { padding: SPACING.md, gap: SPACING.sm },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
})
