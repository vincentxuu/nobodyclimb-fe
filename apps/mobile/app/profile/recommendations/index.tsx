import { useEffect, useRef, useState, useCallback } from 'react'
import { View, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { ChevronLeft, Sparkles } from 'lucide-react-native'
import { Text, Button } from '@/components/ui'
import { SPACING, WB_COLORS, SEMANTIC_COLORS } from '@nobodyclimb/constants'
import { useRecommendations, useTriggerRecommendation, type Recommendation } from '@/lib/hooks/useRecommendations'
import { RecommendationCard } from '@/components/ai'

const MAX_POLL_ATTEMPTS = 3
const POLL_INTERVAL_MS = 2000

export default function RecommendationsScreen() {
  const router = useRouter()
  const { data, isLoading, refetch } = useRecommendations()
  const triggerRecommendation = useTriggerRecommendation()

  const [pollAttempts, setPollAttempts] = useState(0)
  const [isPolling, setIsPolling] = useState(false)
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const items = data?.items ?? []
  const isEmpty = !isLoading && items.length === 0
  const pollingExhausted = pollAttempts >= MAX_POLL_ATTEMPTS

  useEffect(() => {
    if (isEmpty && !pollingExhausted && !isPolling) {
      setIsPolling(true)
    }
  }, [isEmpty, pollingExhausted, isPolling])

  useEffect(() => {
    if (!isPolling) return

    const poll = async () => {
      if (pollAttempts >= MAX_POLL_ATTEMPTS) {
        setIsPolling(false)
        return
      }
      await refetch()
      setPollAttempts(prev => prev + 1)
      pollTimerRef.current = setTimeout(poll, POLL_INTERVAL_MS)
    }

    pollTimerRef.current = setTimeout(poll, POLL_INTERVAL_MS)
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current)
    }
  }, [isPolling])

  const handleTrigger = async () => {
    await triggerRecommendation.mutateAsync()
    setPollAttempts(0)
    setIsPolling(true)
  }

  const renderItem = useCallback(({ item }: { item: Recommendation }) => (
    <RecommendationCard recommendation={item} />
  ), [])

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={WB_COLORS[80]} />
        </Pressable>
        <Text style={styles.title}>路線推薦</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.center} testID="loading-spinner">
          <ActivityIndicator color={SEMANTIC_COLORS.accent} />
        </View>
      ) : isPolling && !pollingExhausted ? (
        <View style={styles.center}>
          <ActivityIndicator color={SEMANTIC_COLORS.accent} />
          <Text style={styles.pollingText}>推薦生成中...</Text>
        </View>
      ) : isEmpty && pollingExhausted ? (
        <View style={styles.center}>
          <Sparkles size={48} color={WB_COLORS[30]} />
          <Text style={styles.emptyTitle}>目前沒有推薦路線</Text>
          <Text style={styles.emptySubtext}>完攀路線後系統會自動生成推薦，或你可以手動觸發。</Text>
          <Button
            onPress={handleTrigger}
            loading={triggerRecommendation.isPending}
            style={styles.triggerBtn}
          >
            立即生成推薦
          </Button>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING[4], paddingVertical: SPACING[3] },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING[3], padding: SPACING[6] },
  pollingText: { fontSize: 14, color: WB_COLORS[50] },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: WB_COLORS[60] },
  emptySubtext: { fontSize: 13, color: WB_COLORS[40], textAlign: 'center' },
  triggerBtn: { marginTop: SPACING[2] },
  list: { padding: SPACING[4] },
  separator: { height: SPACING[3] },
})
