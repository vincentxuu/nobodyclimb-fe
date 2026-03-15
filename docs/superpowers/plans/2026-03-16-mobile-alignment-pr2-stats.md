# PR-2 Stats Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add personal statistics dashboard to mobile app, matching the web `/profile/stats` page.
**Architecture:** New `profile/stats` route composes chart components (CircularProgress, ProgressBar, BarChart, StatCard) already ported to React Native. A custom hook `useProfileStats` fetches data from `/users/me/stats`. All chart components live in `src/components/biography/stats/`.
**Tech Stack:** React Native, Expo 54, TanStack Query, Expo Router, @nobodyclimb/constants

---

## Files

### Audit (already exist)
- `apps/mobile/src/components/biography/stats/progress-chart.tsx` — contains CircularProgress, ProgressBar, StatCard, BarChart
- `apps/mobile/src/components/biography/stats/stats-overview.tsx`
- `apps/mobile/src/components/biography/stats/badge-showcase.tsx`
- `apps/mobile/src/components/biography/stats/index.ts`

### Create
- `apps/mobile/src/lib/hooks/useProfileStats.ts`
- `apps/mobile/app/profile/stats/index.tsx`

### Modify
- `apps/mobile/app/profile/_layout.tsx` — add `stats` screen
- `apps/mobile/app/(tabs)/profile.tsx` — add "統計" menu item (BarChart2 icon)

---

## Implementation Steps

### Task 1: Audit existing stats components

- [ ] Run existing tests (if any) to establish baseline:
  ```bash
  pnpm --filter @nobodyclimb/mobile test -- --testPathPattern=biography/stats
  ```

- [ ] Verify `progress-chart.tsx` exports: `CircularProgress`, `ProgressBar`, `StatCard`, `BarChart` with the required props:
  - `CircularProgress`: `value: number`, `size?: 'sm' | 'md' | 'lg' | 'xl'`, `color?: string`
  - `ProgressBar`: `label: string`, `value: number`, `maxValue: number`, `color?: string`
  - `BarChart`: `data: { label: string; value: number }[]`, `color?: string`, `height?: number`
  - `StatCard`: `title: string`, `value: string | number`, `subtitle?: string`, `icon?: React.ReactNode`

- [ ] Verify `stats-overview.tsx` exports `StatsOverview` (no-arg component that fetches its own data via hook or props).

- [ ] Verify `badge-showcase.tsx` exports `BadgeShowcase` with `badges: Badge[]` prop.

- [ ] Verify `index.ts` re-exports all of the above.

- [ ] If any component is missing a required prop or export, patch it in place (do not recreate).

- [ ] If the `__tests__` directory does not exist, create it and add smoke tests for each component:
  ```bash
  mkdir -p apps/mobile/src/components/biography/stats/__tests__
  ```

  Test file: `apps/mobile/src/components/biography/stats/__tests__/stats-components.test.tsx`

  ```typescript
  import { render } from '@testing-library/react-native'
  import { CircularProgress, ProgressBar, BarChart, StatCard } from '../progress-chart'
  import { BadgeShowcase } from '../badge-showcase'

  describe('CircularProgress', () => {
    it('renders percentage text', () => {
      const { getByText } = render(<CircularProgress value={75} />)
      expect(getByText('75%')).toBeTruthy()
    })
    it('renders all size variants without crashing', () => {
      (['sm', 'md', 'lg', 'xl'] as const).forEach(size => {
        expect(() => render(<CircularProgress value={50} size={size} />)).not.toThrow()
      })
    })
  })

  describe('ProgressBar', () => {
    it('renders label and value', () => {
      const { getByText } = render(<ProgressBar label="完攀率" value={60} maxValue={100} />)
      expect(getByText('完攀率')).toBeTruthy()
    })
  })

  describe('BarChart', () => {
    it('renders bar labels', () => {
      const data = [{ label: '1月', value: 5 }, { label: '2月', value: 12 }]
      const { getByText } = render(<BarChart data={data} />)
      expect(getByText('1月')).toBeTruthy()
      expect(getByText('2月')).toBeTruthy()
    })
    it('handles empty data without crashing', () => {
      expect(() => render(<BarChart data={[]} />)).not.toThrow()
    })
  })

  describe('StatCard', () => {
    it('renders title and value', () => {
      const { getByText } = render(<StatCard title="總完攀" value={42} />)
      expect(getByText('總完攀')).toBeTruthy()
      expect(getByText('42')).toBeTruthy()
    })
    it('renders subtitle when provided', () => {
      const { getByText } = render(<StatCard title="總完攀" value={42} subtitle="本月 +5" />)
      expect(getByText('本月 +5')).toBeTruthy()
    })
  })

  describe('BadgeShowcase', () => {
    const MOCK_BADGES = [
      { id: '1', name: '初登頂', category: 'achievement', description: '首次完攀', earned_at: '2024-01-01' },
    ]
    it('renders badge names', () => {
      const { getByText } = render(<BadgeShowcase badges={MOCK_BADGES} />)
      expect(getByText('初登頂')).toBeTruthy()
    })
    it('shows empty state when no badges', () => {
      const { getByText } = render(<BadgeShowcase badges={[]} />)
      expect(getByText('尚無徽章')).toBeTruthy()
    })
  })
  ```

- [ ] Run tests and confirm they pass:
  ```bash
  pnpm --filter @nobodyclimb/mobile test -- --testPathPattern=biography/stats
  # Expected: PASS
  ```

---

### Task 2: Add useProfileStats hook (TDD)

- [ ] Create test file: `apps/mobile/src/lib/hooks/__tests__/useProfileStats.test.ts`

```typescript
import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { useProfileStats } from '../useProfileStats'
import { apiClient } from '@/lib/api'

jest.mock('@/lib/api')

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useProfileStats', () => {
  it('calls GET /users/me/stats and returns data', async () => {
    const mockStats = { total_ascents: 42, max_grade: '5.12a', crags_visited: 10 }
    mockedApiClient.get.mockResolvedValueOnce({ data: { data: mockStats } })

    const { result } = renderHook(() => useProfileStats(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedApiClient.get).toHaveBeenCalledWith('/users/me/stats')
    expect(result.current.data).toEqual(mockStats)
  })

  it('sets isError when the request fails', async () => {
    mockedApiClient.get.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useProfileStats(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
```

- [ ] Run test and confirm it fails:
  ```bash
  pnpm --filter @nobodyclimb/mobile test -- --testPathPattern=useProfileStats
  ```

- [ ] Implement `apps/mobile/src/lib/hooks/useProfileStats.ts`:

```typescript
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export function useProfileStats() {
  return useQuery({
    queryKey: ['profile', 'stats'],
    queryFn: async () => {
      const { data } = await apiClient.get('/users/me/stats')
      return data.data
    },
  })
}
```

- [ ] Run test and confirm it passes:
  ```bash
  pnpm --filter @nobodyclimb/mobile test -- --testPathPattern=useProfileStats
  # Expected: PASS (2 tests)
  ```

---

### Task 3: Create Stats page

- [ ] Create `apps/mobile/app/profile/stats/index.tsx`:

```typescript
import { SafeAreaView } from 'react-native-safe-area-context'
import { View, StyleSheet, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { ChevronLeft } from 'lucide-react-native'
import { Text } from '@/components/ui'
import { SPACING, WB_COLORS } from '@nobodyclimb/constants'
import { StatsOverview } from '@/components/biography/stats'
import { BadgeShowcase } from '@/components/biography/stats'
import { useProfileStats } from '@/lib/hooks/useProfileStats'

export default function StatsScreen() {
  const router = useRouter()
  const { data: stats } = useProfileStats()

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={WB_COLORS[80]} />
        </Pressable>
        <Text style={styles.title}>個人統計</Text>
        <View style={{ width: 40 }} />
      </View>

      <StatsOverview />

      {stats?.badges && (
        <View style={styles.badgeSection}>
          <Text style={styles.sectionTitle}>成就徽章</Text>
          <BadgeShowcase badges={stats.badges} />
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING[4], paddingVertical: SPACING[3] },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '600' },
  badgeSection: { padding: SPACING[4], gap: SPACING[3] },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
})
```

---

### Task 4: Register route + add menu item

- [ ] Edit `apps/mobile/app/profile/_layout.tsx` — add `stats` screen inside `<Stack>`:

```tsx
<Stack.Screen name="stats/index" options={{ headerShown: false }} />
```

- [ ] Edit `apps/mobile/app/(tabs)/profile.tsx` — add "統計" menu item:

```tsx
import { BarChart2 } from 'lucide-react-native'

// Add to the menu items list:
{
  icon: <BarChart2 size={20} color={WB_COLORS[60]} />,
  label: '統計',
  onPress: () => router.push('/profile/stats'),
}
```

- [ ] Run all stats-related tests:
  ```bash
  pnpm --filter @nobodyclimb/mobile test -- --testPathPattern=stats
  # Expected: PASS (all tests in stats __tests__ folder)
  ```

---

## Verification Checklist

- [ ] Existing stats components pass audit (props API matches spec)
- [ ] `useProfileStats` calls `GET /users/me/stats` and returns `data.data`
- [ ] `StatsOverview` shows loading spinner and error state
- [ ] `BadgeShowcase` category filter works correctly
- [ ] Stats page navigates back properly
- [ ] "統計" entry appears in profile menu
- [ ] All tests pass: `pnpm --filter @nobodyclimb/mobile test`
