# PR-3 AI Memory Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add AI memory management page to mobile app, matching the web `/profile/ai-memory` page.
**Architecture:** Single route `profile/ai-memory` fetches the user's stored AI memories from `/ai/memory`, renders them as a `FlatList`, and supports deletion via `ConfirmDialog`. State is managed through two TanStack Query hooks: `useAiMemory` (query) and `useDeleteAiMemory` (mutation).
**Tech Stack:** React Native, Expo 54, TanStack Query, Expo Router, @nobodyclimb/constants

---

## Prerequisites

- **Track 1 must be completed first** — `ConfirmDialog` component must exist at `apps/mobile/src/components/ui/ConfirmDialog.tsx` and be exported from `apps/mobile/src/components/ui/index.ts` before implementing this plan.

## New Files

- `apps/mobile/app/profile/ai-memory/index.tsx`
- `apps/mobile/src/lib/hooks/useAiMemory.ts`

## Modified Files

- `apps/mobile/app/profile/_layout.tsx` — add `ai-memory` screen
- `apps/mobile/app/(tabs)/profile.tsx` — add "AI 記憶" menu item (Brain icon)

---

## Data Types

```typescript
type MemoryKey = 'climbing_level' | 'preferred_region' | 'preferred_style' | 'preferred_crag' | 'goals'
type MemoryType = 'preference' | 'behavior' | 'fact'

interface UserMemory {
  id: string
  memory_key: MemoryKey
  memory_type: MemoryType
  content: string
  updated_at: string
}

const KEY_LABELS: Record<MemoryKey, string> = {
  climbing_level: '攀岩程度',
  preferred_region: '偏好地區',
  preferred_style: '偏好類型',
  preferred_crag: '偏好岩場',
  goals: '攀岩目標',
}

const TYPE_CONFIG: Record<MemoryType, { label: string; color: string }> = {
  preference: { label: '偏好', color: '#3B82F6' },
  behavior: { label: '行為', color: '#A855F7' },
  fact: { label: '事實', color: '#10B981' },
}
```

---

## Implementation Steps

### Step 1: useAiMemory hook (TDD)

- [ ] Create test file: `apps/mobile/src/lib/hooks/__tests__/useAiMemory.test.ts`

```typescript
import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAiMemory, useDeleteAiMemory } from '../useAiMemory'
import { apiClient } from '@/lib/api/client'

jest.mock('@/lib/api/client')
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const MOCK_MEMORIES = [
  { id: '1', memory_key: 'climbing_level', memory_type: 'fact', content: '5.10a', updated_at: '2024-01-01T00:00:00Z' },
  { id: '2', memory_key: 'preferred_region', memory_type: 'preference', content: '龍洞', updated_at: '2024-01-02T00:00:00Z' },
]

describe('useAiMemory', () => {
  it('fetches AI memories from /ai/memory', async () => {
    mockedApiClient.get.mockResolvedValueOnce({ data: { data: MOCK_MEMORIES } })
    const { result } = renderHook(() => useAiMemory(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(2)
    expect(mockedApiClient.get).toHaveBeenCalledWith('/ai/memory')
  })

  it('returns empty array when no memories', async () => {
    mockedApiClient.get.mockResolvedValueOnce({ data: { data: [] } })
    const { result } = renderHook(() => useAiMemory(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(0)
  })
})

describe('useDeleteAiMemory', () => {
  it('calls DELETE /ai/memory/:id', async () => {
    mockedApiClient.delete.mockResolvedValueOnce({ data: {} })
    const { result } = renderHook(() => useDeleteAiMemory(), { wrapper: createWrapper() })
    await result.current.mutateAsync('1')
    expect(mockedApiClient.delete).toHaveBeenCalledWith('/ai/memory/1')
  })
})
```

- [ ] Run test and confirm it fails:
  ```bash
  pnpm --filter @nobodyclimb/mobile test -- --testPathPattern=useAiMemory
  ```

- [ ] Implement `apps/mobile/src/lib/hooks/useAiMemory.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'

export type MemoryKey = 'climbing_level' | 'preferred_region' | 'preferred_style' | 'preferred_crag' | 'goals'
export type MemoryType = 'preference' | 'behavior' | 'fact'

export interface UserMemory {
  id: string
  memory_key: MemoryKey
  memory_type: MemoryType
  content: string
  updated_at: string
}

export function useAiMemory() {
  return useQuery({
    queryKey: ['ai-memory'],
    queryFn: async () => {
      const { data } = await apiClient.get('/ai/memory')
      return data.data as UserMemory[]
    },
  })
}

export function useDeleteAiMemory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/ai/memory/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai-memory'] }),
  })
}
```

- [ ] Run test and confirm it passes:
  ```bash
  pnpm --filter @nobodyclimb/mobile test -- --testPathPattern=useAiMemory
  # Expected: PASS (3 tests)
  ```

---

### Step 2: Relative time helper utility

- [ ] Add `relativeTime` to a shared utils location or inline in the page:

```typescript
function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return '剛剛'
  if (hours < 24) return `${hours} 小時前`
  const days = Math.floor(hours / 24)
  return `${days} 天前`
}
```

---

### Step 3: AI Memory page (TDD)

- [ ] Create test file: `apps/mobile/app/profile/ai-memory/__tests__/AiMemoryScreen.test.tsx`

```typescript
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import AiMemoryScreen from '../index'
import { useAiMemory, useDeleteAiMemory } from '@/lib/hooks/useAiMemory'

jest.mock('@/lib/hooks/useAiMemory')
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn() }),
}))
jest.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ show: jest.fn() }),
}))

const MOCK_MEMORIES = [
  { id: '1', memory_key: 'climbing_level', memory_type: 'fact', content: '5.10a', updated_at: new Date().toISOString() },
  { id: '2', memory_key: 'preferred_region', memory_type: 'preference', content: '龍洞', updated_at: new Date().toISOString() },
]

describe('AiMemoryScreen', () => {
  const mockMutateAsync = jest.fn()

  beforeEach(() => {
    ;(useDeleteAiMemory as jest.Mock).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    })
  })

  it('renders loading state', () => {
    ;(useAiMemory as jest.Mock).mockReturnValue({ data: undefined, isLoading: true })
    const { getByTestId } = render(<AiMemoryScreen />)
    expect(getByTestId('loading-spinner')).toBeTruthy()
  })

  it('renders memories list', () => {
    ;(useAiMemory as jest.Mock).mockReturnValue({ data: MOCK_MEMORIES, isLoading: false })
    const { getByText } = render(<AiMemoryScreen />)
    expect(getByText('攀岩程度')).toBeTruthy()
    expect(getByText('5.10a')).toBeTruthy()
    expect(getByText('偏好地區')).toBeTruthy()
    expect(getByText('龍洞')).toBeTruthy()
  })

  it('renders empty state when no memories', () => {
    ;(useAiMemory as jest.Mock).mockReturnValue({ data: [], isLoading: false })
    const { getByText } = render(<AiMemoryScreen />)
    expect(getByText('AI 會在你提問後自動學習你的偏好，目前尚無記憶')).toBeTruthy()
  })

  it('shows confirm dialog when delete button pressed', () => {
    ;(useAiMemory as jest.Mock).mockReturnValue({ data: MOCK_MEMORIES, isLoading: false })
    const { getAllByTestId, getByText } = render(<AiMemoryScreen />)
    fireEvent.press(getAllByTestId('delete-btn')[0])
    expect(getByText('確定刪除此記憶？')).toBeTruthy()
  })

  it('calls deleteMemory on confirm', async () => {
    ;(useAiMemory as jest.Mock).mockReturnValue({ data: MOCK_MEMORIES, isLoading: false })
    const { getAllByTestId, getByText } = render(<AiMemoryScreen />)
    fireEvent.press(getAllByTestId('delete-btn')[0])
    fireEvent.press(getByText('刪除'))
    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledWith('1'))
  })
})
```

- [ ] Run test and confirm it fails:
  ```bash
  pnpm --filter @nobodyclimb/mobile test -- --testPathPattern=AiMemoryScreen
  ```

- [ ] Implement `apps/mobile/app/profile/ai-memory/index.tsx`:

```typescript
import { useState } from 'react'
import { View, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { ChevronLeft, Brain, Trash2 } from 'lucide-react-native'
import { Text, ConfirmDialog } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { SPACING, WB_COLORS, RADIUS, SEMANTIC_COLORS } from '@nobodyclimb/constants'
import { useAiMemory, useDeleteAiMemory, UserMemory, MemoryKey, MemoryType } from '@/lib/hooks/useAiMemory'

const KEY_LABELS: Record<MemoryKey, string> = {
  climbing_level: '攀岩程度',
  preferred_region: '偏好地區',
  preferred_style: '偏好類型',
  preferred_crag: '偏好岩場',
  goals: '攀岩目標',
}

const TYPE_CONFIG: Record<MemoryType, { label: string; color: string }> = {
  preference: { label: '偏好', color: '#3B82F6' },
  behavior: { label: '行為', color: '#A855F7' },
  fact: { label: '事實', color: '#10B981' },
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return '剛剛'
  if (hours < 24) return `${hours} 小時前`
  const days = Math.floor(hours / 24)
  return `${days} 天前`
}

export default function AiMemoryScreen() {
  const router = useRouter()
  const { data: memories, isLoading } = useAiMemory()
  const deleteMemory = useDeleteAiMemory()
  const toast = useToast()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!deletingId) return
    await deleteMemory.mutateAsync(deletingId)
    setDeletingId(null)
    toast.show({ message: '記憶已刪除', variant: 'success' })
  }

  const renderItem = ({ item }: { item: UserMemory }) => {
    const typeConfig = TYPE_CONFIG[item.memory_type]
    return (
      <View style={styles.item}>
        <View style={styles.itemHeader}>
          <Text style={styles.keyLabel}>{KEY_LABELS[item.memory_key] ?? item.memory_key}</Text>
          <View style={[styles.typeBadge, { backgroundColor: typeConfig.color + '20' }]}>
            <Text style={[styles.typeLabel, { color: typeConfig.color }]}>{typeConfig.label}</Text>
          </View>
        </View>
        <Text style={styles.content}>{item.content}</Text>
        <View style={styles.itemFooter}>
          <Text style={styles.time}>{relativeTime(item.updated_at)}</Text>
          <Pressable
            testID="delete-btn"
            onPress={() => setDeletingId(item.id)}
            style={styles.deleteBtn}
          >
            <Trash2 size={16} color="#EF4444" />
          </Pressable>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={WB_COLORS[80]} />
        </Pressable>
        <Text style={styles.title}>AI 記憶</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Description */}
      <View style={styles.desc}>
        <Text style={styles.descText}>AI 根據你的使用行為自動記錄的個人化資訊，幫助提供更精準的建議。</Text>
      </View>

      {isLoading ? (
        <View style={styles.center} testID="loading-spinner">
          <ActivityIndicator color={SEMANTIC_COLORS.primary} />
        </View>
      ) : memories && memories.length > 0 ? (
        <FlatList
          data={memories}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      ) : (
        <View style={styles.center}>
          <Brain size={48} color={WB_COLORS[30]} />
          <Text style={styles.emptyText}>AI 會在你提問後自動學習你的偏好，目前尚無記憶</Text>
        </View>
      )}

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={!!deletingId}
        title="確定刪除此記憶？"
        message="刪除後 AI 將不再記得此資訊。"
        confirmLabel="刪除"
        cancelLabel="取消"
        loading={deleteMemory.isPending}
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING[4], paddingVertical: SPACING[3] },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '600' },
  desc: { paddingHorizontal: SPACING[4], paddingBottom: SPACING[3] },
  descText: { fontSize: 13, color: WB_COLORS[50], lineHeight: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING[3] },
  list: { padding: SPACING[4], gap: SPACING[3] },
  separator: { height: SPACING[3] },
  item: {
    backgroundColor: WB_COLORS[5],
    borderRadius: RADIUS.lg,
    padding: SPACING[4],
    gap: SPACING[2],
  },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING[2] },
  keyLabel: { fontSize: 15, fontWeight: '600', flex: 1 },
  typeBadge: { paddingHorizontal: SPACING[2], paddingVertical: 2, borderRadius: RADIUS.full },
  typeLabel: { fontSize: 11, fontWeight: '500' },
  content: { fontSize: 14, color: WB_COLORS[70], lineHeight: 22 },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  time: { fontSize: 12, color: WB_COLORS[40] },
  deleteBtn: { padding: SPACING[1] },
  emptyText: { fontSize: 16, fontWeight: '600', color: WB_COLORS[60] },
  emptySubtext: { fontSize: 13, color: WB_COLORS[40], textAlign: 'center', paddingHorizontal: SPACING[8] },
})
```

- [ ] Run test and confirm it passes:
  ```bash
  pnpm --filter @nobodyclimb/mobile test -- --testPathPattern=AiMemoryScreen
  # Expected: PASS (5 tests)
  ```

---

### Step 4: Register route + add menu item

- [ ] Edit `apps/mobile/app/profile/_layout.tsx` — add `ai-memory` screen:

```tsx
<Stack.Screen name="ai-memory/index" options={{ headerShown: false }} />
```

- [ ] Edit `apps/mobile/app/(tabs)/profile.tsx` — add "AI 記憶" menu item:

```tsx
import { Brain } from 'lucide-react-native'

// Add to menu items list:
{
  icon: <Brain size={20} color={WB_COLORS[60]} />,
  label: 'AI 記憶',
  onPress: () => router.push('/profile/ai-memory'),
}
```

- [ ] Run all AI memory tests:
  ```bash
  pnpm --filter @nobodyclimb/mobile test -- --testPathPattern="useAiMemory|AiMemoryScreen"
  # Expected: PASS (8 tests total)
  ```

---

## Verification Checklist

- [ ] Loading spinner shows while fetching
- [ ] Memory items display key label, type badge, content, and relative time
- [ ] KEY_LABELS maps all 5 memory keys correctly
- [ ] TYPE_CONFIG maps all 3 memory types with correct colors
- [ ] Tapping trash icon opens ConfirmDialog with correct item ID
- [ ] Confirming deletion calls `DELETE /ai/memory/:id`
- [ ] Success toast shows after deletion
- [ ] Empty state shows Brain icon + text: 'AI 會在你提問後自動學習你的偏好，目前尚無記憶'
- [ ] "AI 記憶" entry appears in profile menu
- [ ] All new tests pass: `pnpm --filter @nobodyclimb/mobile test`
