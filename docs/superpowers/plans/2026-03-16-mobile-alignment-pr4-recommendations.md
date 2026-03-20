# PR-4 Recommendations Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add AI route recommendations page to mobile app, matching the web `/profile/recommendations` page.
**Architecture:** New `profile/recommendations` route uses two hooks (`useRecommendations`, `useTriggerRecommendation`) and two shared components (`SourceCard`, `RecommendationCard`). `RecommendationCard` is collapsible and renders `MarkdownText` (from Track 1). The page implements polling (every 2s, max 3 attempts) when the list is empty to handle async generation.
**Tech Stack:** React Native, Expo 54, TanStack Query, Expo Router, @nobodyclimb/constants

---

## New Files

- `apps/mobile/app/profile/recommendations/index.tsx`
- `apps/mobile/src/components/ai/SourceCard.tsx`
- `apps/mobile/src/components/ai/RecommendationCard.tsx`
- `apps/mobile/src/components/ai/index.ts`
- `apps/mobile/src/lib/hooks/useRecommendations.ts`

## Modified Files

- `apps/mobile/app/profile/_layout.tsx` — add `recommendations` screen
- `apps/mobile/app/(tabs)/profile.tsx` — add "路線推薦" menu item (Sparkles icon)

---

## Data Types

```typescript
interface AISource {
  id: string
  type: 'route' | 'crag' | 'video'
  title: string
  excerpt: string
  url: string
  score: number
}

interface Recommendation {
  id: string
  triggered_by: 'ascent' | 'manual'
  status: 'success' | 'failed'
  recommendation: {
    answer: string
    sources: AISource[]
    context_ascents: any[]
  }
  created_at: string
}

interface RecommendationsResponse {
  items: Recommendation[]
  total: number
}
```

---

## Implementation Steps

### Step 1: useRecommendations + useTriggerRecommendation hooks (TDD)

- [ ] Create test file: `apps/mobile/src/lib/hooks/__tests__/useRecommendations.test.ts`

```typescript
import { renderHook, waitFor, act } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRecommendations, useTriggerRecommendation } from '../useRecommendations'
import { apiClient } from '@/lib/api/client'

jest.mock('@/lib/api/client')
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const MOCK_RESPONSE = {
  items: [
    {
      id: 'r1',
      triggered_by: 'ascent',
      status: 'success',
      recommendation: {
        answer: '推薦你嘗試龍洞南壁的 5.10a 路線',
        sources: [
          { id: 's1', type: 'route', title: '藍色海灣', excerpt: '適合初中級者', url: 'https://example.com', score: 0.9 },
        ],
        context_ascents: [],
      },
      created_at: '2024-01-01T00:00:00Z',
    },
  ],
  total: 1,
}

describe('useRecommendations', () => {
  it('fetches recommendations with default pagination', async () => {
    mockedApiClient.get.mockResolvedValueOnce({ data: { data: MOCK_RESPONSE } })
    const { result } = renderHook(() => useRecommendations(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.items).toHaveLength(1)
    expect(mockedApiClient.get).toHaveBeenCalledWith('/ai/recommendations?offset=0&limit=10')
  })

  it('fetches recommendations with custom pagination', async () => {
    mockedApiClient.get.mockResolvedValueOnce({ data: { data: { items: [], total: 0 } } })
    const { result } = renderHook(() => useRecommendations(10, 5), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedApiClient.get).toHaveBeenCalledWith('/ai/recommendations?offset=10&limit=5')
  })
})

describe('useTriggerRecommendation', () => {
  it('posts to /ai/recommendations', async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: { data: {} } })
    const { result } = renderHook(() => useTriggerRecommendation(), { wrapper: createWrapper() })
    await act(async () => { await result.current.mutateAsync() })
    expect(mockedApiClient.post).toHaveBeenCalledWith('/ai/recommendations')
  })
})
```

- [ ] Run test and confirm it fails:
  ```bash
  pnpm --filter @nobodyclimb/mobile test -- --testPathPattern=useRecommendations
  ```

- [ ] Implement `apps/mobile/src/lib/hooks/useRecommendations.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'

export interface AISource {
  id: string
  type: 'route' | 'crag' | 'video'
  title: string
  excerpt: string
  url: string
  score: number
}

export interface Recommendation {
  id: string
  triggered_by: 'ascent' | 'manual'
  status: 'success' | 'failed'
  recommendation: {
    answer: string
    sources: AISource[]
    context_ascents: any[]
  }
  created_at: string
}

export function useRecommendations(offset = 0, limit = 10) {
  return useQuery({
    queryKey: ['recommendations', offset],
    queryFn: async () => {
      const { data } = await apiClient.get(`/ai/recommendations?offset=${offset}&limit=${limit}`)
      return data.data as { items: Recommendation[]; total: number }
    },
  })
}

export function useTriggerRecommendation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post('/ai/recommendations')
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recommendations'] }),
  })
}
```

- [ ] Run test and confirm it passes:
  ```bash
  pnpm --filter @nobodyclimb/mobile test -- --testPathPattern=useRecommendations
  # Expected: PASS (3 tests)
  ```

---

### Step 2: SourceCard component (TDD)

- [ ] Create test file: `apps/mobile/src/components/ai/__tests__/SourceCard.test.tsx`

```typescript
import { render, fireEvent } from '@testing-library/react-native'
import { Linking } from 'react-native'
import { SourceCard } from '../SourceCard'

jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined)

const MOCK_SOURCE = {
  id: 's1',
  type: 'route' as const,
  title: '藍色海灣',
  excerpt: '適合初中級者的經典路線',
  url: 'https://example.com/route/1',
  score: 0.9,
}

describe('SourceCard', () => {
  it('renders title and excerpt', () => {
    const { getByText } = render(<SourceCard source={MOCK_SOURCE} />)
    expect(getByText('藍色海灣')).toBeTruthy()
    expect(getByText('適合初中級者的經典路線')).toBeTruthy()
  })

  it('opens URL on press', () => {
    const { getByText } = render(<SourceCard source={MOCK_SOURCE} />)
    fireEvent.press(getByText('藍色海灣'))
    expect(Linking.openURL).toHaveBeenCalledWith('https://example.com/route/1')
  })

  it('renders route, crag, and video types without crashing', () => {
    const types = ['route', 'crag', 'video'] as const
    types.forEach(type => {
      expect(() => render(<SourceCard source={{ ...MOCK_SOURCE, type }} />)).not.toThrow()
    })
  })
})
```

- [ ] Run test and confirm it fails:
  ```bash
  pnpm --filter @nobodyclimb/mobile test -- --testPathPattern=SourceCard
  ```

- [ ] Implement `apps/mobile/src/components/ai/SourceCard.tsx`:

```typescript
import { View, Pressable, StyleSheet, Linking } from 'react-native'
import { Mountain, MapPin, Play, ExternalLink } from 'lucide-react-native'
import { Text } from '@/components/ui'
import { SPACING, WB_COLORS, RADIUS } from '@nobodyclimb/constants'
import { AISource } from '@/lib/hooks/useRecommendations'

const SOURCE_ICONS = {
  route: Mountain,
  crag: MapPin,
  video: Play,
}

interface SourceCardProps {
  source: AISource
}

export function SourceCard({ source }: SourceCardProps) {
  const Icon = SOURCE_ICONS[source.type]

  return (
    <Pressable
      style={styles.card}
      onPress={() => Linking.openURL(source.url)}
    >
      <View style={styles.iconWrapper}>
        <Icon size={16} color={WB_COLORS[60]} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{source.title}</Text>
        <Text style={styles.excerpt} numberOfLines={2}>{source.excerpt}</Text>
      </View>
      <ExternalLink size={14} color={WB_COLORS[40]} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING[2],
    padding: SPACING[3],
    backgroundColor: WB_COLORS[5],
    borderRadius: RADIUS.md,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    backgroundColor: WB_COLORS[10],
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1 },
  title: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  excerpt: { fontSize: 12, color: WB_COLORS[50], lineHeight: 18 },
})
```

- [ ] Run test and confirm it passes:
  ```bash
  pnpm --filter @nobodyclimb/mobile test -- --testPathPattern=SourceCard
  # Expected: PASS (3 tests)
  ```

---

### Step 3: RecommendationCard component (TDD)

- [ ] Create test file: `apps/mobile/src/components/ai/__tests__/RecommendationCard.test.tsx`

```typescript
import { render, fireEvent } from '@testing-library/react-native'
import { RecommendationCard } from '../RecommendationCard'

jest.mock('@/components/ui', () => ({
  ...jest.requireActual('@/components/ui'),
  // MarkdownText renders children as plain Text for tests
}))

const MOCK_REC = {
  id: 'r1',
  triggered_by: 'ascent' as const,
  status: 'success' as const,
  recommendation: {
    answer: '推薦你嘗試龍洞南壁的 5.10a 路線，適合你目前的程度。',
    sources: [
      { id: 's1', type: 'route' as const, title: '藍色海灣', excerpt: '經典路線', url: 'https://example.com', score: 0.9 },
    ],
    context_ascents: [{ id: 'a1' }],
  },
  created_at: '2024-01-15T10:00:00Z',
}

describe('RecommendationCard', () => {
  it('renders trigger label and date', () => {
    const { getByText } = render(<RecommendationCard recommendation={MOCK_REC} />)
    expect(getByText('完攀後推薦')).toBeTruthy()
    expect(getByText('1 條完攀記錄')).toBeTruthy()
  })

  it('is collapsed by default', () => {
    const { queryByText } = render(<RecommendationCard recommendation={MOCK_REC} />)
    expect(queryByText('藍色海灣')).toBeNull()
  })

  it('expands when header is pressed', () => {
    const { getByTestId, getByText } = render(<RecommendationCard recommendation={MOCK_REC} />)
    fireEvent.press(getByTestId('recommendation-header'))
    expect(getByText('藍色海灣')).toBeTruthy()
  })

  it('collapses when header is pressed again', () => {
    const { getByTestId, queryByText } = render(<RecommendationCard recommendation={MOCK_REC} />)
    fireEvent.press(getByTestId('recommendation-header'))
    fireEvent.press(getByTestId('recommendation-header'))
    expect(queryByText('藍色海灣')).toBeNull()
  })

  it('renders manual trigger label', () => {
    const { getByText } = render(<RecommendationCard recommendation={{ ...MOCK_REC, triggered_by: 'manual' }} />)
    expect(getByText('手動觸發')).toBeTruthy()
  })

  it('renders failed status gracefully', () => {
    expect(() => render(<RecommendationCard recommendation={{ ...MOCK_REC, status: 'failed' }} />)).not.toThrow()
  })
})
```

- [ ] Run test and confirm it fails:
  ```bash
  pnpm --filter @nobodyclimb/mobile test -- --testPathPattern=RecommendationCard
  ```

- [ ] Implement `apps/mobile/src/components/ai/RecommendationCard.tsx`:

```typescript
import { useState } from 'react'
import { View, Pressable, FlatList, StyleSheet } from 'react-native'
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react-native'
import { Text, MarkdownText } from '@/components/ui'
import { SPACING, WB_COLORS, RADIUS } from '@nobodyclimb/constants'
import { Recommendation } from '@/lib/hooks/useRecommendations'
import { SourceCard } from './SourceCard'

const TRIGGER_LABELS: Record<Recommendation['triggered_by'], string> = {
  ascent: '完攀後推薦',
  manual: '手動觸發',
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })
}

interface RecommendationCardProps {
  recommendation: Recommendation
}

export function RecommendationCard({ recommendation: rec }: RecommendationCardProps) {
  const [expanded, setExpanded] = useState(false)
  const ascentCount = rec.recommendation.context_ascents?.length ?? 0
  const isFailed = rec.status === 'failed'

  return (
    <View style={styles.card}>
      {/* Header */}
      <Pressable
        testID="recommendation-header"
        style={styles.header}
        onPress={() => setExpanded(prev => !prev)}
      >
        <Sparkles size={16} color="#F59E0B" />
        <View style={styles.headerInfo}>
          <Text style={styles.triggerLabel}>{TRIGGER_LABELS[rec.triggered_by]}</Text>
          {ascentCount > 0 && (
            <Text style={styles.ascentCount}>{ascentCount} 條完攀記錄</Text>
          )}
        </View>
        <Text style={styles.date}>{formatDate(rec.created_at)}</Text>
        {expanded ? (
          <ChevronUp size={16} color={WB_COLORS[40]} />
        ) : (
          <ChevronDown size={16} color={WB_COLORS[40]} />
        )}
      </Pressable>

      {/* Expanded content */}
      {expanded && (
        <View style={styles.body}>
          {isFailed ? (
            <Text style={styles.failedText}>推薦生成失敗，請稍後再試。</Text>
          ) : (
            <>
              <MarkdownText>{rec.recommendation.answer}</MarkdownText>
              {rec.recommendation.sources.length > 0 && (
                <View style={styles.sources}>
                  <Text style={styles.sourcesTitle}>參考資料</Text>
                  {rec.recommendation.sources.map(source => (
                    <SourceCard key={source.id} source={source} />
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: WB_COLORS[5],
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    padding: SPACING[4],
  },
  headerInfo: { flex: 1 },
  triggerLabel: { fontSize: 14, fontWeight: '600' },
  ascentCount: { fontSize: 12, color: WB_COLORS[50] },
  date: { fontSize: 12, color: WB_COLORS[40] },
  body: {
    paddingHorizontal: SPACING[4],
    paddingBottom: SPACING[4],
    gap: SPACING[3],
  },
  sources: { gap: SPACING[2] },
  sourcesTitle: { fontSize: 13, fontWeight: '600', color: WB_COLORS[60] },
  failedText: { fontSize: 14, color: '#EF4444' },
})
```

- [ ] Run test and confirm it passes:
  ```bash
  pnpm --filter @nobodyclimb/mobile test -- --testPathPattern=RecommendationCard
  # Expected: PASS (6 tests)
  ```

---

### Step 4: Barrel export

- [ ] Create `apps/mobile/src/components/ai/index.ts`:

```typescript
export { SourceCard } from './SourceCard'
export { RecommendationCard } from './RecommendationCard'
```

---

### Step 5: Recommendations page with polling (TDD)

- [ ] Create test file: `apps/mobile/app/profile/recommendations/__tests__/RecommendationsScreen.test.tsx`

```typescript
import { render, waitFor, act } from '@testing-library/react-native'
import RecommendationsScreen from '../index'
import { useRecommendations, useTriggerRecommendation } from '@/lib/hooks/useRecommendations'

jest.mock('@/lib/hooks/useRecommendations')
jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn() }) }))
jest.useFakeTimers()

const EMPTY_RESPONSE = { items: [], total: 0 }
const MOCK_RESPONSE = {
  items: [
    {
      id: 'r1', triggered_by: 'ascent', status: 'success',
      recommendation: { answer: '推薦路線', sources: [], context_ascents: [] },
      created_at: '2024-01-01T00:00:00Z',
    },
  ],
  total: 1,
}

describe('RecommendationsScreen', () => {
  const mockTrigger = jest.fn()

  beforeEach(() => {
    ;(useTriggerRecommendation as jest.Mock).mockReturnValue({
      mutateAsync: mockTrigger,
      isPending: false,
    })
  })

  it('shows loading state', () => {
    ;(useRecommendations as jest.Mock).mockReturnValue({ data: undefined, isLoading: true })
    const { getByTestId } = render(<RecommendationsScreen />)
    expect(getByTestId('loading-spinner')).toBeTruthy()
  })

  it('renders recommendation cards', () => {
    ;(useRecommendations as jest.Mock).mockReturnValue({ data: MOCK_RESPONSE, isLoading: false })
    const { getByText } = render(<RecommendationsScreen />)
    expect(getByText('完攀後推薦')).toBeTruthy()
  })

  it('shows polling message when list is empty', () => {
    ;(useRecommendations as jest.Mock).mockReturnValue({ data: EMPTY_RESPONSE, isLoading: false })
    const { getByText } = render(<RecommendationsScreen />)
    expect(getByText('推薦生成中...')).toBeTruthy()
  })

  it('shows empty state after max poll attempts with no data', async () => {
    ;(useRecommendations as jest.Mock).mockReturnValue({ data: EMPTY_RESPONSE, isLoading: false })
    const { getByText } = render(<RecommendationsScreen />)

    // Advance through 3 poll intervals (2s each)
    await act(async () => {
      jest.advanceTimersByTime(2000)
      jest.advanceTimersByTime(2000)
      jest.advanceTimersByTime(2000)
    })
    await waitFor(() => expect(getByText('目前沒有推薦路線')).toBeTruthy())
  })
})
```

- [ ] Run test and confirm it fails:
  ```bash
  pnpm --filter @nobodyclimb/mobile test -- --testPathPattern=RecommendationsScreen
  ```

- [ ] Implement `apps/mobile/app/profile/recommendations/index.tsx`:

```typescript
import { useEffect, useRef, useState } from 'react'
import { View, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { ChevronLeft, Sparkles } from 'lucide-react-native'
import { Text, Button } from '@/components/ui'
import { SPACING, WB_COLORS, SEMANTIC_COLORS } from '@nobodyclimb/constants'
import { useRecommendations, useTriggerRecommendation, Recommendation } from '@/lib/hooks/useRecommendations'
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

  // Start polling when list is empty on first load
  useEffect(() => {
    if (isEmpty && !pollingExhausted && !isPolling) {
      setIsPolling(true)
    }
  }, [isEmpty])

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

  const renderItem = ({ item }: { item: Recommendation }) => (
    <RecommendationCard recommendation={item} />
  )

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={WB_COLORS[80]} />
        </Pressable>
        <Text style={styles.title}>路線推薦</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.center} testID="loading-spinner">
          <ActivityIndicator color={SEMANTIC_COLORS.primary} />
        </View>
      ) : isPolling && !pollingExhausted ? (
        <View style={styles.center}>
          <ActivityIndicator color={SEMANTIC_COLORS.primary} />
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
          ListFooterComponent={
            data && data.total > items.length ? (
              <Pressable style={styles.loadMore}>
                <Text style={styles.loadMoreText}>載入更多</Text>
              </Pressable>
            ) : null
          }
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
  loadMore: { padding: SPACING[4], alignItems: 'center' },
  loadMoreText: { fontSize: 14, color: SEMANTIC_COLORS.primary, fontWeight: '500' },
})
```

- [ ] Run test and confirm it passes:
  ```bash
  pnpm --filter @nobodyclimb/mobile test -- --testPathPattern=RecommendationsScreen
  # Expected: PASS (4 tests)
  ```

---

### Step 6: Register route + add menu item

- [ ] Edit `apps/mobile/app/profile/_layout.tsx` — add `recommendations` screen:

```tsx
<Stack.Screen name="recommendations/index" options={{ headerShown: false }} />
```

- [ ] Edit `apps/mobile/app/(tabs)/profile.tsx` — add "路線推薦" menu item:

```tsx
import { Sparkles } from 'lucide-react-native'

// Add to menu items list:
{
  icon: <Sparkles size={20} color={WB_COLORS[60]} />,
  label: '路線推薦',
  onPress: () => router.push('/profile/recommendations'),
}
```

- [ ] Run all recommendations tests:
  ```bash
  pnpm --filter @nobodyclimb/mobile test -- --testPathPattern="useRecommendations|SourceCard|RecommendationCard|RecommendationsScreen"
  # Expected: PASS (16 tests total)
  ```

---

## Verification Checklist

- [ ] `SourceCard` opens correct URL via `Linking.openURL` for all 3 source types
- [ ] `RecommendationCard` starts collapsed; expands and collapses on press
- [ ] `RecommendationCard` shows correct trigger label for 'ascent' and 'manual'
- [ ] Failed recommendation renders gracefully without crashing
- [ ] Page polls every 2s up to 3 times when list is initially empty
- [ ] Empty state with "目前沒有推薦路線" shows after 3 failed poll attempts
- [ ] "推薦生成中..." shown during active polling
- [ ] Manual trigger button resets poll counter and starts new polling cycle
- [ ] "路線推薦" entry appears in profile menu
- [ ] All new tests pass: `pnpm --filter @nobodyclimb/mobile test`
