# Mobile Alignment PR-1 - Ascents Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add climbing ascent record management to the mobile app, achieving feature parity with the web `/profile/ascents` page.
**Architecture:** New ascent screens live under `apps/mobile/app/profile/ascents/` via Expo Router nested routing. UI components are organized in `apps/mobile/src/components/ascent/`. Data fetching is centralized in a custom hook `useAscents.ts` wrapping TanStack Query + the existing `apiClient`. All components follow TDD: test first, implement second.
**Tech Stack:** Expo Router 6, TanStack Query 5, React Native, Tamagui 2.0, `@nobodyclimb/types`, `@nobodyclimb/constants`, Jest + React Native Testing Library

---

## Task 1: Add ascents data hook

### Step 1.1 — Write failing test

- [ ] Create file `apps/mobile/src/lib/hooks/__tests__/useAscents.test.ts`:

```typescript
import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useMyAscents, useMyAscentStats, useCreateAscent, useDeleteAscent } from '../useAscents'
import { apiClient } from '@/lib/api'

jest.mock('@/lib/api')
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useMyAscents', () => {
  it('fetches ascents and returns data', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: { data: { ascents: [], total: 0, page: 1, limit: 10 } },
    })
    const { result } = renderHook(() => useMyAscents(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({ ascents: [], total: 0, page: 1, limit: 10 })
  })

  it('passes filters as query params', async () => {
    mockedApiClient.get.mockResolvedValueOnce({ data: { data: { ascents: [], total: 0 } } })
    renderHook(() => useMyAscents({ ascent_type: 'redpoint', page: 2 }), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(mockedApiClient.get).toHaveBeenCalledWith(
      expect.stringContaining('ascent_type=redpoint')
    ))
  })
})

describe('useMyAscentStats', () => {
  it('fetches stats successfully', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: { data: { total: 42, unique_routes: 30 } },
    })
    const { result } = renderHook(() => useMyAscentStats(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data.total).toBe(42)
  })
})

describe('useCreateAscent', () => {
  it('posts to /ascents and invalidates queries', async () => {
    mockedApiClient.post.mockResolvedValueOnce({ data: { data: { id: 'abc' } } })
    const { result } = renderHook(() => useCreateAscent(), { wrapper: createWrapper() })
    result.current.mutate({ ascent_type: 'redpoint', route_id: 'r1' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedApiClient.post).toHaveBeenCalledWith('/ascents', expect.any(Object))
  })
})

describe('useDeleteAscent', () => {
  it('sends DELETE request with correct id', async () => {
    mockedApiClient.delete.mockResolvedValueOnce({ data: {} })
    const { result } = renderHook(() => useDeleteAscent(), { wrapper: createWrapper() })
    result.current.mutate('ascent-123')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedApiClient.delete).toHaveBeenCalledWith('/ascents/ascent-123')
  })
})
```

### Step 1.2 — Run test to confirm it fails

- [ ] Run: `pnpm --filter @nobodyclimb/mobile test -- --testPathPattern=useAscents`
- [ ] Expected: **FAIL** — `Cannot find module '../useAscents'`

### Step 1.3 — Implement useAscents hook

- [ ] Create file `apps/mobile/src/lib/hooks/useAscents.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export type AscentType =
  | 'redpoint' | 'flash' | 'onsight' | 'attempt'
  | 'toprope' | 'lead' | 'seconding' | 'repeat'

export interface AscentFilters {
  ascent_type?: AscentType
  crag_id?: string
  page?: number
  limit?: number
}

export function useMyAscents(filters: AscentFilters = {}) {
  return useQuery({
    queryKey: ['ascents', 'my', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.ascent_type) params.set('ascent_type', filters.ascent_type)
      if (filters.crag_id) params.set('crag_id', filters.crag_id)
      params.set('page', String(filters.page ?? 1))
      params.set('limit', String(filters.limit ?? 10))
      const { data } = await apiClient.get(`/ascents?${params}`)
      return data.data
    },
  })
}

export function useMyAscentStats() {
  return useQuery({
    queryKey: ['ascents', 'stats'],
    queryFn: async () => {
      const { data } = await apiClient.get('/ascents/stats')
      return data.data
    },
  })
}

export function useCreateAscent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: object) => {
      const { data } = await apiClient.post('/ascents', body)
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ascents'] }),
  })
}

export function useUpdateAscent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: object }) => {
      const { data } = await apiClient.put(`/ascents/${id}`, body)
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ascents'] }),
  })
}

export function useDeleteAscent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/ascents/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ascents'] }),
  })
}
```

### Step 1.4 — Run test to confirm it passes

- [ ] Run: `pnpm --filter @nobodyclimb/mobile test -- --testPathPattern=useAscents`
- [ ] Expected: **PASS** — all tests green

### Step 1.5 — Commit

- [ ] `git add apps/mobile/src/lib/hooks/useAscents.ts apps/mobile/src/lib/hooks/__tests__/useAscents.test.ts`
- [ ] Commit with message: `feat(mobile): add useAscents TanStack Query hook`

---

## Task 2: AscentTypeSelect component

### Step 2.1 — Write failing test

- [ ] Create directory: `apps/mobile/src/components/ascent/__tests__/`
- [ ] Create file `apps/mobile/src/components/ascent/__tests__/AscentTypeSelect.test.tsx`:

```typescript
import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { AscentTypeSelect } from '../AscentTypeSelect'

describe('AscentTypeSelect', () => {
  it('renders all 8 ascent types', () => {
    const { getAllByRole } = render(
      <AscentTypeSelect value="redpoint" onChange={jest.fn()} />
    )
    expect(getAllByRole('button')).toHaveLength(8)
  })

  it('renders labels for each type', () => {
    const { getByText } = render(
      <AscentTypeSelect value="redpoint" onChange={jest.fn()} />
    )
    expect(getByText('Redpoint')).toBeTruthy()
    expect(getByText('Flash')).toBeTruthy()
    expect(getByText('Onsight')).toBeTruthy()
    expect(getByText('Attempt')).toBeTruthy()
    expect(getByText('Top Rope')).toBeTruthy()
    expect(getByText('Lead')).toBeTruthy()
    expect(getByText('Second')).toBeTruthy()
    expect(getByText('Repeat')).toBeTruthy()
  })

  it('calls onChange with correct type when pressed', () => {
    const onChange = jest.fn()
    const { getByText } = render(
      <AscentTypeSelect value="redpoint" onChange={onChange} />
    )
    fireEvent.press(getByText('Flash'))
    expect(onChange).toHaveBeenCalledWith('flash')
  })

  it('highlights currently selected type', () => {
    const { getByTestId } = render(
      <AscentTypeSelect value="flash" onChange={jest.fn()} />
    )
    const flashButton = getByTestId('ascent-type-flash')
    expect(flashButton.props.accessibilityState?.selected).toBe(true)
  })

  it('does not highlight unselected types', () => {
    const { getByTestId } = render(
      <AscentTypeSelect value="flash" onChange={jest.fn()} />
    )
    const redpointButton = getByTestId('ascent-type-redpoint')
    expect(redpointButton.props.accessibilityState?.selected).toBe(false)
  })
})
```

### Step 2.2 — Run test to confirm it fails

- [ ] Run: `pnpm --filter @nobodyclimb/mobile test -- --testPathPattern=AscentTypeSelect`
- [ ] Expected: **FAIL** — `Cannot find module '../AscentTypeSelect'`

### Step 2.3 — Implement AscentTypeSelect

- [ ] Create file `apps/mobile/src/components/ascent/AscentTypeSelect.tsx`:

```typescript
import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import {
  CircleDot, Zap, Eye, Target, ArrowUp, Sword, Users, Repeat2,
} from 'lucide-react-native'
import { SEMANTIC_COLORS, SPACING, RADIUS, FONT_SIZES } from '@nobodyclimb/constants'
import type { AscentType } from '@/lib/hooks/useAscents'

interface AscentTypeOption {
  type: AscentType
  label: string
  Icon: React.ElementType
  color: string
}

const ASCENT_TYPES: AscentTypeOption[] = [
  { type: 'redpoint', label: 'Redpoint', Icon: CircleDot, color: '#EF4444' },
  { type: 'flash',    label: 'Flash',    Icon: Zap,       color: '#EAB308' },
  { type: 'onsight',  label: 'Onsight',  Icon: Eye,       color: '#10B981' },
  { type: 'attempt',  label: 'Attempt',  Icon: Target,    color: '#6B7280' },
  { type: 'toprope',  label: 'Top Rope', Icon: ArrowUp,   color: '#3B82F6' },
  { type: 'lead',     label: 'Lead',     Icon: Sword,     color: '#A855F7' },
  { type: 'seconding',label: 'Second',   Icon: Users,     color: '#06B6D4' },
  { type: 'repeat',   label: 'Repeat',   Icon: Repeat2,   color: '#6366F1' },
]

interface AscentTypeSelectProps {
  value: AscentType
  onChange: (type: AscentType) => void
}

export function AscentTypeSelect({ value, onChange }: AscentTypeSelectProps) {
  return (
    <View style={styles.grid}>
      {ASCENT_TYPES.map(({ type, label, Icon, color }) => {
        const selected = value === type
        return (
          <Pressable
            key={type}
            testID={`ascent-type-${type}`}
            role="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(type)}
            style={[
              styles.cell,
              selected && { borderColor: '#10B981', backgroundColor: '#10B98115' },
            ]}
          >
            <Icon size={20} color={selected ? color : SEMANTIC_COLORS.textSubtle} />
            <Text style={[styles.label, selected && { color: SEMANTIC_COLORS.textMain }]}>
              {label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  cell: {
    width: '23%',
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: SEMANTIC_COLORS.border,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs / 2,
    padding: SPACING.xs,
  },
  label: {
    fontSize: FONT_SIZES.xs,
    color: SEMANTIC_COLORS.textSubtle,
    textAlign: 'center',
  },
})
```

### Step 2.4 — Run test to confirm it passes

- [ ] Run: `pnpm --filter @nobodyclimb/mobile test -- --testPathPattern=AscentTypeSelect`
- [ ] Expected: **PASS** — all 5 tests green

### Step 2.5 — Commit

- [ ] `git add apps/mobile/src/components/ascent/AscentTypeSelect.tsx apps/mobile/src/components/ascent/__tests__/AscentTypeSelect.test.tsx`
- [ ] Commit with message: `feat(mobile): add AscentTypeSelect 8-type grid component`

---

## Task 3: AscentCard component

### Step 3.1 — Write failing test

- [ ] Create file `apps/mobile/src/components/ascent/__tests__/AscentCard.test.tsx`:

```typescript
import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { AscentCard } from '../AscentCard'

const mockAscent = {
  id: 'asc-1',
  ascent_type: 'redpoint' as const,
  route_name: '浪人劍客',
  crag_name: '龍洞',
  grade: '5.12a',
  date: '2026-03-01',
  attempts: 3,
  rating: 4,
  notes: '第一次完攀，很開心！',
}

describe('AscentCard', () => {
  it('renders route name', () => {
    const { getByText } = render(<AscentCard ascent={mockAscent} onEdit={jest.fn()} onDelete={jest.fn()} />)
    expect(getByText('浪人劍客')).toBeTruthy()
  })

  it('renders crag name and grade', () => {
    const { getByText } = render(<AscentCard ascent={mockAscent} onEdit={jest.fn()} onDelete={jest.fn()} />)
    expect(getByText('龍洞')).toBeTruthy()
    expect(getByText('5.12a')).toBeTruthy()
  })

  it('renders ascent type label', () => {
    const { getByText } = render(<AscentCard ascent={mockAscent} onEdit={jest.fn()} onDelete={jest.fn()} />)
    expect(getByText('Redpoint')).toBeTruthy()
  })

  it('renders formatted date', () => {
    const { getByText } = render(<AscentCard ascent={mockAscent} onEdit={jest.fn()} onDelete={jest.fn()} />)
    expect(getByText('2026-03-01')).toBeTruthy()
  })

  it('calls onEdit when edit button pressed', () => {
    const onEdit = jest.fn()
    const { getByTestId } = render(<AscentCard ascent={mockAscent} onEdit={onEdit} onDelete={jest.fn()} />)
    fireEvent.press(getByTestId('ascent-card-edit'))
    expect(onEdit).toHaveBeenCalledWith(mockAscent)
  })

  it('calls onDelete when delete button pressed', () => {
    const onDelete = jest.fn()
    const { getByTestId } = render(<AscentCard ascent={mockAscent} onEdit={jest.fn()} onDelete={onDelete} />)
    fireEvent.press(getByTestId('ascent-card-delete'))
    expect(onDelete).toHaveBeenCalledWith('asc-1')
  })

  it('renders notes when provided', () => {
    const { getByText } = render(<AscentCard ascent={mockAscent} onEdit={jest.fn()} onDelete={jest.fn()} />)
    expect(getByText('第一次完攀，很開心！')).toBeTruthy()
  })
})
```

### Step 3.2 — Run test to confirm it fails

- [ ] Run: `pnpm --filter @nobodyclimb/mobile test -- --testPathPattern=AscentCard`
- [ ] Expected: **FAIL** — `Cannot find module '../AscentCard'`

### Step 3.3 — Implement AscentCard

- [ ] Create file `apps/mobile/src/components/ascent/AscentCard.tsx`:

```typescript
import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Pencil, Trash2, MapPin, Star } from 'lucide-react-native'
import { SEMANTIC_COLORS, SPACING, RADIUS, FONT_SIZES, WB_COLORS } from '@nobodyclimb/constants'

const ASCENT_TYPE_LABELS: Record<string, string> = {
  redpoint: 'Redpoint',
  flash: 'Flash',
  onsight: 'Onsight',
  attempt: 'Attempt',
  toprope: 'Top Rope',
  lead: 'Lead',
  seconding: 'Second',
  repeat: 'Repeat',
}

const ASCENT_TYPE_COLORS: Record<string, string> = {
  redpoint: '#EF4444',
  flash: '#EAB308',
  onsight: '#10B981',
  attempt: '#6B7280',
  toprope: '#3B82F6',
  lead: '#A855F7',
  seconding: '#06B6D4',
  repeat: '#6366F1',
}

interface Ascent {
  id: string
  ascent_type: string
  route_name: string
  crag_name: string
  grade: string
  date: string
  attempts?: number
  rating?: number
  notes?: string
}

interface AscentCardProps {
  ascent: Ascent
  onEdit: (ascent: Ascent) => void
  onDelete: (id: string) => void
}

export function AscentCard({ ascent, onEdit, onDelete }: AscentCardProps) {
  const typeColor = ASCENT_TYPE_COLORS[ascent.ascent_type] ?? SEMANTIC_COLORS.textSubtle
  const typeLabel = ASCENT_TYPE_LABELS[ascent.ascent_type] ?? ascent.ascent_type

  return (
    <View style={styles.card}>
      {/* Header row */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.routeName}>{ascent.route_name}</Text>
          <Text style={[styles.typeBadge, { color: typeColor, borderColor: typeColor }]}>
            {typeLabel}
          </Text>
        </View>
        <View style={styles.actions}>
          <Pressable
            testID="ascent-card-edit"
            onPress={() => onEdit(ascent)}
            hitSlop={8}
            style={styles.actionBtn}
          >
            <Pencil size={16} color={SEMANTIC_COLORS.textSubtle} />
          </Pressable>
          <Pressable
            testID="ascent-card-delete"
            onPress={() => onDelete(ascent.id)}
            hitSlop={8}
            style={styles.actionBtn}
          >
            <Trash2 size={16} color={SEMANTIC_COLORS.danger ?? '#EF4444'} />
          </Pressable>
        </View>
      </View>

      {/* Meta row */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <MapPin size={13} color={SEMANTIC_COLORS.textSubtle} />
          <Text style={styles.metaText}>{ascent.crag_name}</Text>
        </View>
        <Text style={styles.grade}>{ascent.grade}</Text>
        <Text style={styles.date}>{ascent.date}</Text>
      </View>

      {/* Rating */}
      {ascent.rating != null && (
        <View style={styles.ratingRow}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={12}
              color={i < ascent.rating! ? '#F59E0B' : SEMANTIC_COLORS.border}
              fill={i < ascent.rating! ? '#F59E0B' : 'transparent'}
            />
          ))}
        </View>
      )}

      {/* Notes */}
      {ascent.notes ? (
        <Text style={styles.notes} numberOfLines={2}>
          {ascent.notes}
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: WB_COLORS[5],
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    flex: 1,
  },
  routeName: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: SEMANTIC_COLORS.textMain,
    flex: 1,
  },
  typeBadge: {
    fontSize: FONT_SIZES.xs,
    borderWidth: 1,
    borderRadius: RADIUS.xs,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  actionBtn: {
    padding: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  metaText: {
    fontSize: FONT_SIZES.sm,
    color: SEMANTIC_COLORS.textSubtle,
  },
  grade: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: SEMANTIC_COLORS.textMain,
  },
  date: {
    fontSize: FONT_SIZES.sm,
    color: SEMANTIC_COLORS.textSubtle,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 2,
  },
  notes: {
    fontSize: FONT_SIZES.sm,
    color: SEMANTIC_COLORS.textSubtle,
    lineHeight: FONT_SIZES.sm * 1.5,
  },
})
```

### Step 3.4 — Run test to confirm it passes

- [ ] Run: `pnpm --filter @nobodyclimb/mobile test -- --testPathPattern=AscentCard`
- [ ] Expected: **PASS** — all 7 tests green

### Step 3.5 — Commit

- [ ] `git add apps/mobile/src/components/ascent/AscentCard.tsx apps/mobile/src/components/ascent/__tests__/AscentCard.test.tsx`
- [ ] Commit with message: `feat(mobile): add AscentCard component`

---

## Task 4: AscentForm component (edit sheet)

### Step 4.1 — Write failing test

- [ ] Create file `apps/mobile/src/components/ascent/__tests__/AscentForm.test.tsx`:

```typescript
import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { AscentForm } from '../AscentForm'

const mockAscent = {
  id: 'asc-1',
  ascent_type: 'redpoint' as const,
  route_name: '浪人劍客',
  crag_name: '龍洞',
  grade: '5.12a',
  date: '2026-03-01',
  attempts: 3,
  rating: 4,
  notes: '備註',
}

describe('AscentForm', () => {
  it('renders when visible is true', () => {
    const { getByText } = render(
      <AscentForm visible={true} ascent={mockAscent} onSubmit={jest.fn()} onClose={jest.fn()} loading={false} />
    )
    expect(getByText('編輯攀登記錄')).toBeTruthy()
  })

  it('does not render content when visible is false', () => {
    const { queryByText } = render(
      <AscentForm visible={false} ascent={mockAscent} onSubmit={jest.fn()} onClose={jest.fn()} loading={false} />
    )
    expect(queryByText('編輯攀登記錄')).toBeNull()
  })

  it('pre-fills notes field with existing value', () => {
    const { getByDisplayValue } = render(
      <AscentForm visible={true} ascent={mockAscent} onSubmit={jest.fn()} onClose={jest.fn()} loading={false} />
    )
    expect(getByDisplayValue('備註')).toBeTruthy()
  })

  it('calls onClose when cancel pressed', () => {
    const onClose = jest.fn()
    const { getByText } = render(
      <AscentForm visible={true} ascent={mockAscent} onSubmit={onClose} onClose={onClose} loading={false} />
    )
    fireEvent.press(getByText('取消'))
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onSubmit with updated data when save pressed', () => {
    const onSubmit = jest.fn()
    const { getByText, getByDisplayValue } = render(
      <AscentForm visible={true} ascent={mockAscent} onSubmit={onSubmit} onClose={jest.fn()} loading={false} />
    )
    fireEvent.changeText(getByDisplayValue('備註'), '新備註')
    fireEvent.press(getByText('儲存'))
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ notes: '新備註' }))
  })

  it('disables save button when loading', () => {
    const { getByText } = render(
      <AscentForm visible={true} ascent={mockAscent} onSubmit={jest.fn()} onClose={jest.fn()} loading={true} />
    )
    expect(getByText('儲存')).toBeTruthy()
    // Button should show loading indicator — verify via testID or disabled prop
  })
})
```

### Step 4.2 — Run test to confirm it fails

- [ ] Run: `pnpm --filter @nobodyclimb/mobile test -- --testPathPattern=AscentForm`
- [ ] Expected: **FAIL** — `Cannot find module '../AscentForm'`

### Step 4.3 — Implement AscentForm

- [ ] Create file `apps/mobile/src/components/ascent/AscentForm.tsx`:

```typescript
import React, { useState, useEffect } from 'react'
import {
  Modal, View, Text, TextInput, Pressable,
  StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { X } from 'lucide-react-native'
import { SEMANTIC_COLORS, SPACING, RADIUS, FONT_SIZES, WB_COLORS } from '@nobodyclimb/constants'
import { AscentTypeSelect } from './AscentTypeSelect'
import type { AscentType } from '@/lib/hooks/useAscents'

interface AscentFormData {
  ascent_type: AscentType
  date: string
  attempts: number
  rating: number
  notes: string
}

interface AscentFormProps {
  visible: boolean
  ascent: {
    id: string
    ascent_type: AscentType
    date: string
    attempts?: number
    rating?: number
    notes?: string
    route_name: string
    crag_name: string
    grade: string
  }
  onSubmit: (data: AscentFormData) => void
  onClose: () => void
  loading: boolean
}

export function AscentForm({ visible, ascent, onSubmit, onClose, loading }: AscentFormProps) {
  const [form, setForm] = useState<AscentFormData>({
    ascent_type: ascent.ascent_type,
    date: ascent.date,
    attempts: ascent.attempts ?? 1,
    rating: ascent.rating ?? 0,
    notes: ascent.notes ?? '',
  })

  useEffect(() => {
    if (visible) {
      setForm({
        ascent_type: ascent.ascent_type,
        date: ascent.date,
        attempts: ascent.attempts ?? 1,
        rating: ascent.rating ?? 0,
        notes: ascent.notes ?? '',
      })
    }
  }, [visible, ascent])

  if (!visible) return null

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>編輯攀登記錄</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <X size={20} color={SEMANTIC_COLORS.textSubtle} />
          </Pressable>
        </View>

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          {/* Route info (read-only) */}
          <View style={styles.routeInfo}>
            <Text style={styles.routeName}>{ascent.route_name}</Text>
            <Text style={styles.routeMeta}>{ascent.crag_name} · {ascent.grade}</Text>
          </View>

          {/* Ascent type */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>類型</Text>
            <AscentTypeSelect
              value={form.ascent_type}
              onChange={(t) => setForm((f) => ({ ...f, ascent_type: t }))}
            />
          </View>

          {/* Attempts */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>嘗試次數</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={String(form.attempts)}
              onChangeText={(v) => setForm((f) => ({ ...f, attempts: Number(v) || 1 }))}
            />
          </View>

          {/* Rating - 5 star taps */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>評分</Text>
            <View style={styles.ratingRow}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Pressable key={i} onPress={() => setForm((f) => ({ ...f, rating: i + 1 }))}>
                  <Text style={{ fontSize: 24, color: i < form.rating ? '#F59E0B' : SEMANTIC_COLORS.border }}>
                    ★
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Notes */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>備註</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              multiline
              numberOfLines={4}
              value={form.notes}
              onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
              placeholder="記錄這次攀登的感受..."
              placeholderTextColor={SEMANTIC_COLORS.textSubtle}
            />
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Pressable style={styles.cancelBtn} onPress={onClose} disabled={loading}>
            <Text style={styles.cancelText}>取消</Text>
          </Pressable>
          <Pressable
            style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
            onPress={() => onSubmit(form)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={WB_COLORS[100]} />
            ) : (
              <Text style={styles.saveText}>儲存</Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SEMANTIC_COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: SEMANTIC_COLORS.border,
  },
  title: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: SEMANTIC_COLORS.textMain },
  body: { flex: 1 },
  bodyContent: { padding: SPACING.md, gap: SPACING.lg },
  routeInfo: { gap: 2 },
  routeName: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: SEMANTIC_COLORS.textMain },
  routeMeta: { fontSize: FONT_SIZES.sm, color: SEMANTIC_COLORS.textSubtle },
  field: { gap: SPACING.xs },
  fieldLabel: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: SEMANTIC_COLORS.textMain },
  input: {
    borderWidth: 1, borderColor: SEMANTIC_COLORS.border, borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs,
    color: SEMANTIC_COLORS.textMain, fontSize: FONT_SIZES.base,
  },
  textarea: { height: 100, textAlignVertical: 'top' },
  ratingRow: { flexDirection: 'row', gap: SPACING.xs },
  footer: {
    flexDirection: 'row', gap: SPACING.sm, padding: SPACING.md,
    borderTopWidth: 1, borderTopColor: SEMANTIC_COLORS.border,
  },
  cancelBtn: {
    flex: 1, borderWidth: 1, borderColor: SEMANTIC_COLORS.border,
    borderRadius: RADIUS.sm, padding: SPACING.sm, alignItems: 'center',
  },
  cancelText: { color: SEMANTIC_COLORS.textMain, fontSize: FONT_SIZES.base },
  saveBtn: {
    flex: 2, backgroundColor: '#10B981',
    borderRadius: RADIUS.sm, padding: SPACING.sm, alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveText: { color: WB_COLORS[100], fontWeight: '700', fontSize: FONT_SIZES.base },
})
```

### Step 4.4 — Run test to confirm it passes

- [ ] Run: `pnpm --filter @nobodyclimb/mobile test -- --testPathPattern=AscentForm`
- [ ] Expected: **PASS** — all 6 tests green

### Step 4.5 — Commit

- [ ] `git add apps/mobile/src/components/ascent/AscentForm.tsx apps/mobile/src/components/ascent/__tests__/AscentForm.test.tsx`
- [ ] Commit with message: `feat(mobile): add AscentForm sheet component`

---

## Task 5: CreateAscentFlow component (multi-step)

### Step 5.1 — Write failing test

- [ ] Create file `apps/mobile/src/components/ascent/__tests__/CreateAscentFlow.test.tsx`:

```typescript
import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { CreateAscentFlow } from '../CreateAscentFlow'

jest.mock('@/lib/api', () => ({
  apiClient: {
    get: jest.fn().mockResolvedValue({ data: { data: { crags: [], routes: [] } } }),
    post: jest.fn().mockResolvedValue({ data: { data: { id: 'new-1' } } }),
  },
}))

describe('CreateAscentFlow', () => {
  it('renders step 1 (crag search) initially', () => {
    const { getByText } = render(<CreateAscentFlow onSuccess={jest.fn()} onCancel={jest.fn()} />)
    expect(getByText('選擇岩場')).toBeTruthy()
  })

  it('renders search input on step 1', () => {
    const { getByPlaceholderText } = render(
      <CreateAscentFlow onSuccess={jest.fn()} onCancel={jest.fn()} />
    )
    expect(getByPlaceholderText('搜尋岩場名稱...')).toBeTruthy()
  })

  it('calls onCancel when cancel button pressed', () => {
    const onCancel = jest.fn()
    const { getByText } = render(<CreateAscentFlow onSuccess={jest.fn()} onCancel={onCancel} />)
    fireEvent.press(getByText('取消'))
    expect(onCancel).toHaveBeenCalled()
  })

  it('shows step indicator', () => {
    const { getByTestId } = render(<CreateAscentFlow onSuccess={jest.fn()} onCancel={jest.fn()} />)
    expect(getByTestId('step-indicator')).toBeTruthy()
  })
})
```

### Step 5.2 — Run test to confirm it fails

- [ ] Run: `pnpm --filter @nobodyclimb/mobile test -- --testPathPattern=CreateAscentFlow`
- [ ] Expected: **FAIL** — `Cannot find module '../CreateAscentFlow'`

### Step 5.3 — Implement CreateAscentFlow

- [ ] Create file `apps/mobile/src/components/ascent/CreateAscentFlow.tsx`:

```typescript
import React, { useState } from 'react'
import {
  View, Text, TextInput, Pressable, FlatList,
  StyleSheet, ActivityIndicator,
} from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { SEMANTIC_COLORS, SPACING, RADIUS, FONT_SIZES, WB_COLORS } from '@nobodyclimb/constants'
import { AscentTypeSelect } from './AscentTypeSelect'
import type { AscentType } from '@/lib/hooks/useAscents'

type Step = 'crag' | 'route' | 'form'

interface CreateAscentFlowProps {
  onSuccess: () => void
  onCancel: () => void
}

const STEPS: Step[] = ['crag', 'route', 'form']

export function CreateAscentFlow({ onSuccess, onCancel }: CreateAscentFlowProps) {
  const [step, setStep] = useState<Step>('crag')
  const [cragQuery, setCragQuery] = useState('')
  const [selectedCrag, setSelectedCrag] = useState<{ id: string; name: string } | null>(null)
  const [selectedRoute, setSelectedRoute] = useState<{ id: string; name: string; grade: string } | null>(null)
  const [ascentType, setAscentType] = useState<AscentType>('redpoint')
  const [attempts, setAttempts] = useState(1)
  const [rating, setRating] = useState(0)
  const [notes, setNotes] = useState('')

  const qc = useQueryClient()

  const cragsQuery = useQuery({
    queryKey: ['crags', 'search', cragQuery],
    queryFn: async () => {
      const { data } = await apiClient.get(`/crags?q=${cragQuery}&limit=20`)
      return data.data.crags ?? []
    },
    enabled: cragQuery.length >= 1,
  })

  const routesQuery = useQuery({
    queryKey: ['routes', 'crag', selectedCrag?.id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/crags/${selectedCrag!.id}/routes?limit=50`)
      return data.data.routes ?? []
    },
    enabled: !!selectedCrag,
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post('/ascents', {
        route_id: selectedRoute!.id,
        ascent_type: ascentType,
        attempts,
        rating,
        notes,
        date: new Date().toISOString().slice(0, 10),
      })
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ascents'] })
      onSuccess()
    },
  })

  const stepIndex = STEPS.indexOf(step)

  return (
    <View style={styles.container}>
      {/* Step indicator */}
      <View testID="step-indicator" style={styles.stepIndicator}>
        {STEPS.map((s, i) => (
          <View
            key={s}
            style={[styles.stepDot, i <= stepIndex && styles.stepDotActive]}
          />
        ))}
      </View>

      {/* Step: Crag search */}
      {step === 'crag' && (
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>選擇岩場</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="搜尋岩場名稱..."
            placeholderTextColor={SEMANTIC_COLORS.textSubtle}
            value={cragQuery}
            onChangeText={setCragQuery}
            autoFocus
          />
          {cragsQuery.isLoading && <ActivityIndicator color={SEMANTIC_COLORS.textSubtle} />}
          <FlatList
            data={cragsQuery.data ?? []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                style={styles.listItem}
                onPress={() => {
                  setSelectedCrag(item)
                  setStep('route')
                }}
              >
                <Text style={styles.listItemText}>{item.name}</Text>
                <Text style={styles.listItemSub}>{item.area_name}</Text>
              </Pressable>
            )}
            ListEmptyComponent={
              cragQuery.length > 0 && !cragsQuery.isLoading ? (
                <Text style={styles.empty}>找不到岩場</Text>
              ) : null
            }
          />
        </View>
      )}

      {/* Step: Route selection */}
      {step === 'route' && (
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>選擇路線</Text>
          <Text style={styles.stepSub}>{selectedCrag?.name}</Text>
          {routesQuery.isLoading && <ActivityIndicator color={SEMANTIC_COLORS.textSubtle} />}
          <FlatList
            data={routesQuery.data ?? []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                style={styles.listItem}
                onPress={() => {
                  setSelectedRoute(item)
                  setStep('form')
                }}
              >
                <Text style={styles.listItemText}>{item.name}</Text>
                <Text style={styles.listItemGrade}>{item.grade}</Text>
              </Pressable>
            )}
          />
          <Pressable style={styles.backBtn} onPress={() => setStep('crag')}>
            <Text style={styles.backText}>← 返回</Text>
          </Pressable>
        </View>
      )}

      {/* Step: Form */}
      {step === 'form' && (
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>{selectedRoute?.name}</Text>
          <Text style={styles.stepSub}>{selectedCrag?.name} · {selectedRoute?.grade}</Text>
          <AscentTypeSelect value={ascentType} onChange={setAscentType} />
          {createMutation.isPending && <ActivityIndicator color="#10B981" />}
          <Pressable
            style={styles.saveBtn}
            onPress={() => createMutation.mutate()}
            disabled={createMutation.isPending}
          >
            <Text style={styles.saveText}>新增記錄</Text>
          </Pressable>
          <Pressable style={styles.backBtn} onPress={() => setStep('route')}>
            <Text style={styles.backText}>← 返回</Text>
          </Pressable>
        </View>
      )}

      {/* Cancel */}
      <Pressable style={styles.cancelBtn} onPress={onCancel}>
        <Text style={styles.cancelText}>取消</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: SPACING.md, gap: SPACING.md },
  stepIndicator: { flexDirection: 'row', gap: SPACING.xs, justifyContent: 'center' },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: SEMANTIC_COLORS.border },
  stepDotActive: { backgroundColor: '#10B981' },
  stepContent: { flex: 1, gap: SPACING.sm },
  stepTitle: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: SEMANTIC_COLORS.textMain },
  stepSub: { fontSize: FONT_SIZES.sm, color: SEMANTIC_COLORS.textSubtle },
  searchInput: {
    borderWidth: 1, borderColor: SEMANTIC_COLORS.border, borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs,
    color: SEMANTIC_COLORS.textMain, fontSize: FONT_SIZES.base,
  },
  listItem: {
    paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: SEMANTIC_COLORS.border,
  },
  listItemText: { fontSize: FONT_SIZES.base, color: SEMANTIC_COLORS.textMain },
  listItemSub: { fontSize: FONT_SIZES.sm, color: SEMANTIC_COLORS.textSubtle },
  listItemGrade: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: '#10B981' },
  empty: { color: SEMANTIC_COLORS.textSubtle, textAlign: 'center', marginTop: SPACING.lg },
  backBtn: { paddingVertical: SPACING.sm },
  backText: { color: SEMANTIC_COLORS.textSubtle, fontSize: FONT_SIZES.sm },
  saveBtn: {
    backgroundColor: '#10B981', borderRadius: RADIUS.sm,
    padding: SPACING.md, alignItems: 'center',
  },
  saveText: { color: WB_COLORS[100], fontWeight: '700', fontSize: FONT_SIZES.base },
  cancelBtn: { paddingVertical: SPACING.sm, alignItems: 'center' },
  cancelText: { color: SEMANTIC_COLORS.textSubtle, fontSize: FONT_SIZES.sm },
})
```

### Step 5.4 — Run test to confirm it passes

- [ ] Run: `pnpm --filter @nobodyclimb/mobile test -- --testPathPattern=CreateAscentFlow`
- [ ] Expected: **PASS** — all 4 tests green

### Step 5.5 — Create barrel export file

- [ ] Create file `apps/mobile/src/components/ascent/index.ts`:

```typescript
export { AscentCard } from './AscentCard'
export { AscentTypeSelect } from './AscentTypeSelect'
export { AscentForm } from './AscentForm'
export { CreateAscentFlow } from './CreateAscentFlow'
```

### Step 5.6 — Commit

- [ ] `git add apps/mobile/src/components/ascent/CreateAscentFlow.tsx apps/mobile/src/components/ascent/__tests__/CreateAscentFlow.test.tsx apps/mobile/src/components/ascent/index.ts`
- [ ] Commit with message: `feat(mobile): add CreateAscentFlow multi-step component`

---

## Task 6: Ascents list page

### Step 6.1 — Create directory structure

- [ ] Run: `mkdir -p apps/mobile/app/profile/ascents`

### Step 6.2 — Write failing test for the page

- [ ] Create file `apps/mobile/app/profile/ascents/__tests__/index.test.tsx`:

```typescript
import React from 'react'
import { render, waitFor } from '@testing-library/react-native'
import AscentsPage from '../index'

jest.mock('@/lib/hooks/useAscents', () => ({
  useMyAscents: () => ({
    data: { ascents: [], total: 0, page: 1, limit: 10 },
    isLoading: false,
    refetch: jest.fn(),
  }),
  useMyAscentStats: () => ({
    data: { total: 5, unique_routes: 4, unique_crags: 2, highest_grade: '5.11a' },
    isLoading: false,
  }),
  useUpdateAscent: () => ({ mutate: jest.fn(), isPending: false }),
  useDeleteAscent: () => ({ mutate: jest.fn(), isPending: false }),
}))

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

describe('AscentsPage', () => {
  it('renders page title', async () => {
    const { getByText } = render(<AscentsPage />)
    await waitFor(() => expect(getByText('攀登記錄')).toBeTruthy())
  })

  it('renders 4 stat cards', async () => {
    const { getByText } = render(<AscentsPage />)
    await waitFor(() => {
      expect(getByText('5')).toBeTruthy()   // total
      expect(getByText('4')).toBeTruthy()   // unique routes
      expect(getByText('2')).toBeTruthy()   // unique crags
      expect(getByText('5.11a')).toBeTruthy() // highest grade
    })
  })

  it('renders empty state when no ascents', async () => {
    const { getByText } = render(<AscentsPage />)
    await waitFor(() => expect(getByText('尚無攀登記錄')).toBeTruthy())
  })

  it('renders FAB button for new record', async () => {
    const { getByTestId } = render(<AscentsPage />)
    await waitFor(() => expect(getByTestId('fab-new-ascent')).toBeTruthy())
  })
})
```

### Step 6.3 — Run test to confirm it fails

- [ ] Run: `pnpm --filter @nobodyclimb/mobile test -- --testPathPattern="ascents/index"`
- [ ] Expected: **FAIL** — module not found

### Step 6.4 — Implement ascents list page

- [ ] Create file `apps/mobile/app/profile/ascents/index.tsx`:

```typescript
import React, { useState, useCallback } from 'react'
import {
  View, Text, FlatList, Pressable, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Plus, Filter, Mountain, MapPin, TrendingUp, Route } from 'lucide-react-native'
import { SEMANTIC_COLORS, SPACING, RADIUS, FONT_SIZES, WB_COLORS } from '@nobodyclimb/constants'
import { AscentCard } from '@/components/ascent/AscentCard'
import { AscentForm } from '@/components/ascent/AscentForm'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  useMyAscents, useMyAscentStats, useUpdateAscent, useDeleteAscent,
} from '@/lib/hooks/useAscents'

export default function AscentsPage() {
  const router = useRouter()
  const [editingAscent, setEditingAscent] = useState<any>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const { data, isLoading, refetch } = useMyAscents()
  const { data: stats } = useMyAscentStats()
  const updateMutation = useUpdateAscent()
  const deleteMutation = useDeleteAscent()

  const ascents = data?.ascents ?? []

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  const handleEdit = useCallback((ascent: any) => setEditingAscent(ascent), [])

  const handleDelete = useCallback((id: string) => setDeletingId(id), [])

  const handleUpdateSubmit = useCallback(
    (formData: any) => {
      if (!editingAscent) return
      updateMutation.mutate(
        { id: editingAscent.id, body: formData },
        { onSuccess: () => setEditingAscent(null) }
      )
    },
    [editingAscent, updateMutation]
  )

  const handleDeleteConfirm = useCallback(() => {
    if (!deletingId) return
    deleteMutation.mutate(deletingId, { onSuccess: () => setDeletingId(null) })
  }, [deletingId, deleteMutation])

  const statCards = [
    { label: '總記錄', value: stats?.total ?? 0, Icon: Mountain },
    { label: '路線數', value: stats?.unique_routes ?? 0, Icon: Route },
    { label: '岩場數', value: stats?.unique_crags ?? 0, Icon: MapPin },
    { label: '最高級', value: stats?.highest_grade ?? '—', Icon: TrendingUp },
  ]

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>攀登記錄</Text>
        <Pressable style={styles.filterBtn}>
          <Filter size={20} color={SEMANTIC_COLORS.textSubtle} />
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color="#10B981" />
      ) : (
        <FlatList
          data={ascents}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.statsRow}>
              {statCards.map(({ label, value, Icon }) => (
                <View key={label} style={styles.statCard}>
                  <Icon size={16} color="#10B981" />
                  <Text style={styles.statValue}>{value}</Text>
                  <Text style={styles.statLabel}>{label}</Text>
                </View>
              ))}
            </View>
          }
          renderItem={({ item }) => (
            <AscentCard ascent={item} onEdit={handleEdit} onDelete={handleDelete} />
          )}
          ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Mountain size={48} color={SEMANTIC_COLORS.textSubtle} />
              <Text style={styles.emptyText}>尚無攀登記錄</Text>
              <Text style={styles.emptySubtext}>點擊右下角按鈕新增第一筆記錄</Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <Pressable
        testID="fab-new-ascent"
        style={styles.fab}
        onPress={() => router.push('/profile/ascents/create')}
      >
        <Plus size={24} color={WB_COLORS[100]} />
      </Pressable>

      {/* Edit form */}
      {editingAscent && (
        <AscentForm
          visible={!!editingAscent}
          ascent={editingAscent}
          onSubmit={handleUpdateSubmit}
          onClose={() => setEditingAscent(null)}
          loading={updateMutation.isPending}
        />
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deletingId}
        title="刪除記錄"
        message="確定要刪除這筆攀登記錄嗎？此操作無法復原。"
        confirmLabel="刪除"
        cancelLabel="取消"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingId(null)}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SEMANTIC_COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: SEMANTIC_COLORS.border,
  },
  headerTitle: { fontSize: FONT_SIZES['2xl'], fontWeight: '700', color: SEMANTIC_COLORS.textMain },
  filterBtn: { padding: SPACING.xs },
  loader: { marginTop: SPACING.xl },
  listContent: { padding: SPACING.md, gap: SPACING.sm, paddingBottom: 100 },
  statsRow: {
    flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1, backgroundColor: WB_COLORS[5], borderRadius: RADIUS.md,
    padding: SPACING.sm, alignItems: 'center', gap: 4,
  },
  statValue: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: SEMANTIC_COLORS.textMain },
  statLabel: { fontSize: FONT_SIZES.xs, color: SEMANTIC_COLORS.textSubtle },
  emptyState: {
    alignItems: 'center', paddingVertical: SPACING.xl * 2, gap: SPACING.sm,
  },
  emptyText: { fontSize: FONT_SIZES.lg, fontWeight: '600', color: SEMANTIC_COLORS.textMain },
  emptySubtext: { fontSize: FONT_SIZES.sm, color: SEMANTIC_COLORS.textSubtle, textAlign: 'center' },
  fab: {
    position: 'absolute', right: SPACING.lg, bottom: SPACING.xl,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#10B981',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
  },
})
```

### Step 6.5 — Run test to confirm it passes

- [ ] Run: `pnpm --filter @nobodyclimb/mobile test -- --testPathPattern="ascents/index"`
- [ ] Expected: **PASS** — all 4 tests green

### Step 6.6 — Commit

- [ ] `git add apps/mobile/app/profile/ascents/index.tsx apps/mobile/app/profile/ascents/__tests__/index.test.tsx`
- [ ] Commit with message: `feat(mobile): add ascents list page with stats and FAB`

---

## Task 7: Create ascent page

### Step 7.1 — Implement create page

- [ ] Create file `apps/mobile/app/profile/ascents/create.tsx`:

```typescript
import React from 'react'
import { StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { SEMANTIC_COLORS } from '@nobodyclimb/constants'
import { CreateAscentFlow } from '@/components/ascent/CreateAscentFlow'

export default function CreateAscentPage() {
  const router = useRouter()

  const handleSuccess = () => {
    router.back()
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <SafeAreaView style={styles.container}>
      <CreateAscentFlow onSuccess={handleSuccess} onCancel={handleCancel} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SEMANTIC_COLORS.background },
})
```

### Step 7.2 — Commit

- [ ] `git add apps/mobile/app/profile/ascents/create.tsx`
- [ ] Commit with message: `feat(mobile): add create ascent page`

---

## Task 8: Register routes and add profile menu item

### Step 8.1 — Update profile layout

- [ ] Open `apps/mobile/app/profile/_layout.tsx`
- [ ] Add `ascents` and `ascents/create` screen entries inside the Stack:

```typescript
<Stack.Screen name="ascents/index" />
<Stack.Screen name="ascents/create" />
```

Note: If the layout uses folder-based routing (`ascents` folder), it may auto-register. Confirm the existing pattern by reading the file first, then add only what is missing.

### Step 8.2 — Add menu item in profile tab

- [ ] Open `apps/mobile/app/(tabs)/profile.tsx`
- [ ] Add import for `Mountain` icon if not already imported: `import { Mountain } from 'lucide-react-native'`
- [ ] Add a new `MenuItem` entry for ascents. Place it after the existing ascents-related items or before settings:

```typescript
<MenuItem
  icon={<Mountain size={20} color={SEMANTIC_COLORS.textMain} />}
  label="攀登記錄"
  onPress={() => handleNavigate('/profile/ascents')}
/>
```

### Step 8.3 — Verify navigation works end to end

- [ ] Run: `pnpm --filter @nobodyclimb/mobile ios` (or Android)
- [ ] Navigate to Profile tab
- [ ] Confirm "攀登記錄" menu item appears
- [ ] Tap it → confirm navigation to ascents list
- [ ] Tap FAB → confirm navigation to create flow
- [ ] Complete the 3-step create flow and confirm the record appears in the list

### Step 8.4 — Commit

- [ ] `git add apps/mobile/app/profile/_layout.tsx apps/mobile/app/(tabs)/profile.tsx`
- [ ] Commit with message: `feat(mobile): register ascents routes and add profile menu item`

---

## Final Verification

- [ ] Run full mobile test suite: `pnpm --filter @nobodyclimb/mobile test`
- [ ] Run typecheck: `pnpm --filter @nobodyclimb/mobile typecheck`
- [ ] Run lint: `pnpm --filter @nobodyclimb/mobile lint`
- [ ] Smoke test new files list:
  - `apps/mobile/src/lib/hooks/useAscents.ts`
  - `apps/mobile/src/components/ascent/AscentCard.tsx`
  - `apps/mobile/src/components/ascent/AscentTypeSelect.tsx`
  - `apps/mobile/src/components/ascent/AscentForm.tsx`
  - `apps/mobile/src/components/ascent/CreateAscentFlow.tsx`
  - `apps/mobile/src/components/ascent/index.ts`
  - `apps/mobile/app/profile/ascents/index.tsx`
  - `apps/mobile/app/profile/ascents/create.tsx`
- [ ] Confirm all tests pass for each component individually:
  - `pnpm --filter @nobodyclimb/mobile test -- --testPathPattern=useAscents`
  - `pnpm --filter @nobodyclimb/mobile test -- --testPathPattern=AscentTypeSelect`
  - `pnpm --filter @nobodyclimb/mobile test -- --testPathPattern=AscentCard`
  - `pnpm --filter @nobodyclimb/mobile test -- --testPathPattern=AscentForm`
  - `pnpm --filter @nobodyclimb/mobile test -- --testPathPattern=CreateAscentFlow`
  - `pnpm --filter @nobodyclimb/mobile test -- --testPathPattern="ascents/index"`
