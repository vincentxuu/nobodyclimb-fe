import { SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import { useRouter } from 'expo-router'
import { ChevronLeft, RefreshCw, Sparkles } from 'lucide-react-native'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { RecommendationCard } from '@/components/ai'
import { Button, Text } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import {
  type Recommendation,
  useRecommendations,
  useTriggerRecommendation,
} from '@/lib/hooks/useRecommendations'

function isQuotaExceededError(error: unknown): boolean {
  return (
    (error as { response?: { data?: { error?: string } } })?.response?.data?.error ===
    'quota_exceeded'
  )
}

const ItemSeparator = () => <View style={styles.separator} />

const MAX_POLL_ATTEMPTS = 3
const POLL_INTERVAL_MS = 2000
const PAGE_SIZE = 10

export default function RecommendationsScreen() {
  const router = useRouter()
  const toast = useToast()

  const [offset, setOffset] = useState(0)
  const [allItems, setAllItems] = useState<Recommendation[]>([])
  const [total, setTotal] = useState(0)

  const { data, isLoading, isError, refetch } = useRecommendations(offset, PAGE_SIZE)
  const triggerRecommendation = useTriggerRecommendation()

  // pollAttemptsRef avoids stale closure in the async poll callback;
  // pollAttempts state drives re-renders for pollingExhausted derived value.
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
        setAllItems((prev) => [...prev, ...data.items])
      }
      setTotal(data.total)
    }
  }, [data, offset])

  // Start polling when initial load returns empty
  const dataIsEmpty =
    !isLoading && data !== undefined && (data.items?.length ?? 0) === 0 && offset === 0
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
      const newRecommendation = await triggerRecommendation.mutateAsync()
      if (newRecommendation) {
        setAllItems((prev) => [
          newRecommendation,
          ...prev.filter((item) => item.id !== newRecommendation.id),
        ])
        setTotal((prev) => prev + 1)
      }
      setOffset(0)
      pollAttemptsRef.current = 0
      setPollAttempts(0)
      setIsPolling(!newRecommendation)
    } catch (error) {
      toast.show({
        message: isQuotaExceededError(error)
          ? '今日 AI 配額已用完，明日重置'
          : '推薦生成失敗，請稍後再試',
        variant: 'error',
      })
    }
  }

  const handleLoadMore = () => {
    if (!isLoading && allItems.length < total) {
      setOffset((prev) => prev + PAGE_SIZE)
    }
  }

  const renderItem = useCallback(
    ({ item, index }: { item: Recommendation; index: number }) => (
      <RecommendationCard recommendation={item} defaultExpanded={index === 0} />
    ),
    []
  )

  const showLoading = isLoading && allItems.length === 0
  const showPolling = isPolling && !pollingExhausted
  const showError = isError && allItems.length === 0
  const showEmpty = !isLoading && !isPolling && allItems.length === 0
  const showList = !showLoading && !showPolling && allItems.length > 0

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={WB_COLORS[70]} />
        </Pressable>
        <Text style={styles.title}>路線推薦</Text>
        <Pressable
          onPress={handleTrigger}
          disabled={triggerRecommendation.isPending}
          style={({ pressed }) => [
            styles.refreshBtn,
            pressed && styles.refreshBtnPressed,
            triggerRecommendation.isPending && styles.refreshBtnDisabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel="重新推薦"
        >
          <RefreshCw size={18} color={WB_COLORS[70]} />
        </Pressable>
      </View>

      {showLoading ? (
        <View style={styles.center} testID="loading-spinner">
          <ActivityIndicator color={SEMANTIC_COLORS.accent} />
        </View>
      ) : showError ? (
        <View style={styles.center}>
          <Sparkles size={48} color={WB_COLORS[30]} />
          <Text style={styles.emptyText}>載入推薦失敗，請稍後再試</Text>
          <Button onPress={() => refetch()} style={styles.triggerBtn}>
            重新載入
          </Button>
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
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={ItemSeparator}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  refreshBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  refreshBtnPressed: { opacity: 0.65 },
  refreshBtnDisabled: { opacity: 0.45 },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '600' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[3],
    padding: SPACING[6],
  },
  pollingText: { fontSize: 14, color: WB_COLORS[50] },
  emptyText: {
    fontSize: 15,
    color: SEMANTIC_COLORS.textSubtle,
    textAlign: 'center',
    lineHeight: 24,
  },
  triggerBtn: { marginTop: SPACING[2] },
  list: { padding: SPACING[4] },
  separator: { height: SPACING[3] },
  loadMoreContainer: { padding: SPACING[4], alignItems: 'center' },
})
