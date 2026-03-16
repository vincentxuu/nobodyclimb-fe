import { useEffect, useRef, useState, useCallback } from 'react'
import { View, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { ChevronLeft, Sparkles } from 'lucide-react-native'
import { Text, Button } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { SPACING, WB_COLORS, SEMANTIC_COLORS } from '@nobodyclimb/constants'
import { useRecommendations, useTriggerRecommendation, type Recommendation } from '@/lib/hooks/useRecommendations'
import { RecommendationCard } from '@/components/ai'

const MAX_POLL_ATTEMPTS = 3
const POLL_INTERVAL_MS = 2000
const PAGE_SIZE = 10

export default function RecommendationsScreen() {
  const router = useRouter()
  const toast = useToast()

  const [offset, setOffset] = useState(0)
  const [allItems, setAllItems] = useState<Recommendation[]>([])
  const [total, setTotal] = useState(0)

  const { data, isLoading, refetch } = useRecommendations(offset, PAGE_SIZE)
  const triggerRecommendation = useTriggerRecommendation()

  // Use ref to avoid stale closure in poll loop
  const pollAttemptsRef = useRef(0)
  const [pollAttempts, setPollAttempts] = useState(0)
  const [isPolling, setIsPolling] = useState(false)
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Accumulate pages
  useEffect(() => {
    if (data?.items) {
      if (offset === 0) {
        setAllItems(data.items)
      } else {
        setAllItems(prev => [...prev, ...data.items])
      }
      setTotal(data.total)
    }
  }, [data, offset])

  // Start polling when initial load returns empty
  const dataIsEmpty = !isLoading && data !== undefined && (data.items?.length ?? 0) === 0 && offset === 0
  const pollingExhausted = pollAttempts >= MAX_POLL_ATTEMPTS

  useEffect(() => {
    if (dataIsEmpty && !pollingExhausted && !isPolling) {
      pollAttemptsRef.current = 0
      setPollAttempts(0)
      setIsPolling(true)
    }
  }, [dataIsEmpty, pollingExhausted, isPolling])

  useEffect(() => {
    if (!isPolling) return

    const poll = async () => {
      await refetch()
      pollAttemptsRef.current += 1
      setPollAttempts(pollAttemptsRef.current)

      if (pollAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
        setIsPolling(false)
        return
      }
      pollTimerRef.current = setTimeout(poll, POLL_INTERVAL_MS)
    }

    pollTimerRef.current = setTimeout(poll, POLL_INTERVAL_MS)
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current)
    }
  }, [isPolling])

  const handleTrigger = async () => {
    try {
      await triggerRecommendation.mutateAsync()
      setOffset(0)
      pollAttemptsRef.current = 0
      setPollAttempts(0)
      setIsPolling(true)
    } catch (error) {
      const isQuotaExceeded =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error === 'quota_exceeded'
      toast.show({
        message: isQuotaExceeded ? '今日 AI 配額已用完，明日重置' : '推薦生成失敗，請稍後再試',
        variant: 'error',
      })
    }
  }

  const handleLoadMore = () => {
    if (!isLoading && allItems.length < total) {
      setOffset(prev => prev + PAGE_SIZE)
    }
  }

  const renderItem = useCallback(({ item }: { item: Recommendation }) => (
    <RecommendationCard recommendation={item} />
  ), [])

  const showLoading = isLoading && allItems.length === 0
  const showPolling = isPolling && !pollingExhausted
  const showEmpty = !isLoading && !isPolling && allItems.length === 0
  const showList = !showLoading && !showPolling && allItems.length > 0

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={WB_COLORS[80]} />
        </Pressable>
        <Text style={styles.title}>路線推薦</Text>
        <View style={{ width: 40 }} />
      </View>

      {showLoading ? (
        <View style={styles.center} testID="loading-spinner">
          <ActivityIndicator color={SEMANTIC_COLORS.accent} />
        </View>
      ) : showPolling ? (
        <View style={styles.center}>
          <ActivityIndicator color={SEMANTIC_COLORS.accent} />
          <Text style={styles.pollingText}>推薦生成中...</Text>
        </View>
      ) : showEmpty ? (
        <View style={styles.center}>
          <Sparkles size={48} color={WB_COLORS[30]} />
          <Text style={styles.emptyText}>完成第一筆完攀後，AI 將為你推薦下一條路線</Text>
          <Button
            onPress={handleTrigger}
            loading={triggerRecommendation.isPending}
            style={styles.triggerBtn}
          >
            立即推薦
          </Button>
        </View>
      ) : showList ? (
        <FlatList
          data={allItems}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            allItems.length < total ? (
              <View style={styles.loadMoreContainer}>
                <ActivityIndicator color={SEMANTIC_COLORS.accent} />
              </View>
            ) : null
          }
        />
      ) : null}
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
  emptyText: { fontSize: 15, color: SEMANTIC_COLORS.textSubtle, textAlign: 'center', lineHeight: 24 },
  triggerBtn: { marginTop: SPACING[2] },
  list: { padding: SPACING[4] },
  separator: { height: SPACING[3] },
  loadMoreContainer: { padding: SPACING[4], alignItems: 'center' },
})
