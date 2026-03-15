# PR-5 Story Type Route Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add dynamic story type routing to the mobile app (`/story/[type]/[id]`), matching the web `/story/[type]/[id]` page.
**Architecture:** Two nested Stack layout files (`story/_layout.tsx` and `story/[type]/_layout.tsx`) wrap a single detail screen at `story/[type]/[id]/index.tsx`. A `useStoryDetail` hook dispatches to the correct API endpoint based on story type. The detail screen reuses the existing `ContentInteractionBar` component and renders story content via `MarkdownText` (Track 1). A "查看更多" link to the author's biography page is shown at the bottom (no related stories list — there is no related-stories-by-author backend endpoint).
**Tech Stack:** React Native, Expo 54, TanStack Query, Expo Router, @nobodyclimb/constants

---

## Prerequisites

- **Track 1 must be completed first** — `MarkdownText` component must exist at `apps/mobile/src/components/ui/MarkdownText.tsx` before implementing this plan.

## New Files

- `apps/mobile/app/story/_layout.tsx`
- `apps/mobile/app/story/[type]/_layout.tsx`
- `apps/mobile/app/story/[type]/[id]/index.tsx`
- `apps/mobile/src/lib/hooks/useStoryDetail.ts`

---

## Story Types & Endpoints

```typescript
type StoryType = 'core-stories' | 'one-liners' | 'stories'

const STORY_ENDPOINTS: Record<StoryType, (id: string) => string> = {
  'core-stories': (id) => `/content/core-stories/${id}/detail`,
  'one-liners': (id) => `/content/one-liners/${id}/detail`,
  'stories': (id) => `/content/stories/${id}/detail`,
}

function isValidStoryType(type: string): type is StoryType {
  return ['core-stories', 'one-liners', 'stories'].includes(type)
}
```

---

## Implementation Steps

### Step 1: isValidStoryType utility (TDD)

- [ ] Create test file: `apps/mobile/src/lib/hooks/__tests__/useStoryDetail.test.ts`

```typescript
import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useStoryDetail, isValidStoryType } from '../useStoryDetail'
import { apiClient } from '@/lib/api/client'

jest.mock('@/lib/api/client')
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('isValidStoryType', () => {
  it('returns true for valid story types', () => {
    expect(isValidStoryType('core-stories')).toBe(true)
    expect(isValidStoryType('one-liners')).toBe(true)
    expect(isValidStoryType('stories')).toBe(true)
  })

  it('returns false for invalid types', () => {
    expect(isValidStoryType('invalid')).toBe(false)
    expect(isValidStoryType('')).toBe(false)
    expect(isValidStoryType('STORIES')).toBe(false)
    expect(isValidStoryType('core_stories')).toBe(false)
  })
})

describe('useStoryDetail', () => {
  const MOCK_STORY = { id: '1', title: '攀岩初體驗', content: '## 第一次' }

  it.each([
    ['core-stories', '/content/core-stories/1/detail'],
    ['one-liners', '/content/one-liners/1/detail'],
    ['stories', '/content/stories/1/detail'],
  ] as const)('fetches %s from correct endpoint', async (type, endpoint) => {
    mockedApiClient.get.mockResolvedValueOnce({ data: { data: MOCK_STORY } })
    const { result } = renderHook(
      () => useStoryDetail(type, '1'),
      { wrapper: createWrapper() }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedApiClient.get).toHaveBeenCalledWith(endpoint)
    expect(result.current.data).toEqual(MOCK_STORY)
  })

  it('does not fetch for invalid story type', () => {
    const { result } = renderHook(
      () => useStoryDetail('invalid' as any, '1'),
      { wrapper: createWrapper() }
    )
    expect(result.current.fetchStatus).toBe('idle')
    expect(mockedApiClient.get).not.toHaveBeenCalled()
  })
})

```

- [ ] Run test and confirm it fails:
  ```bash
  pnpm --filter @nobodyclimb/mobile test -- --testPathPattern=useStoryDetail
  ```

- [ ] Implement `apps/mobile/src/lib/hooks/useStoryDetail.ts`:

```typescript
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'

export type StoryType = 'core-stories' | 'one-liners' | 'stories'

const STORY_ENDPOINTS: Record<StoryType, (id: string) => string> = {
  'core-stories': (id) => `/content/core-stories/${id}/detail`,
  'one-liners': (id) => `/content/one-liners/${id}/detail`,
  'stories': (id) => `/content/stories/${id}/detail`,
}

export function isValidStoryType(type: string): type is StoryType {
  return ['core-stories', 'one-liners', 'stories'].includes(type)
}

export function useStoryDetail(type: StoryType, id: string) {
  return useQuery({
    queryKey: ['story', type, id],
    queryFn: async () => {
      const { data } = await apiClient.get(STORY_ENDPOINTS[type](id))
      return data.data
    },
    enabled: isValidStoryType(type) && !!id,
  })
}

```

- [ ] Run test and confirm it passes:
  ```bash
  pnpm --filter @nobodyclimb/mobile test -- --testPathPattern=useStoryDetail
  # Expected: PASS (7 tests)
  ```

---

### Step 2: Layout files (simple Stack wrappers)

- [ ] Create `apps/mobile/app/story/_layout.tsx`:

```typescript
import { Stack } from 'expo-router'

export default function StoryLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
```

- [ ] Create `apps/mobile/app/story/[type]/_layout.tsx`:

```typescript
import { Stack } from 'expo-router'

export default function StoryTypeLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
```

- [ ] Verify layout files render without errors (these are trivial; no dedicated test needed).

---

### Step 3: Story detail page (TDD)

- [ ] Create test file: `apps/mobile/app/story/[type]/[id]/__tests__/StoryDetailScreen.test.tsx`

```typescript
import { render, waitFor } from '@testing-library/react-native'
import StoryDetailScreen from '../index'
import { useStoryDetail } from '@/lib/hooks/useStoryDetail'

jest.mock('@/lib/hooks/useStoryDetail')
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  useRouter: jest.fn(() => ({ back: jest.fn(), replace: jest.fn() })),
  Link: ({ children }: any) => children,
}))
jest.mock('@/components/biography/display/ContentInteractionBar', () => ({
  ContentInteractionBar: () => null,
}))

const { useLocalSearchParams } = require('expo-router')

const MOCK_CORE_STORY = {
  id: '1', title: '核心故事標題', content: '## 內容\n\n這是一個故事。',
  author: { id: 'u1', name: '小明', biography_id: 'b1' },
  is_liked: false, like_count: 5, comment_count: 2,
}

const MOCK_ONE_LINER = {
  id: '2', question: '你為什麼爬山？', answer: '因為山在那裡。',
  author: { id: 'u1', name: '小明', biography_id: 'b1' },
  is_liked: false, like_count: 3, comment_count: 1,
}

const MOCK_STORY = {
  id: '3', title: '小故事', content: '一個小小的故事。',
  category_name: '岩場故事',
  author: { id: 'u1', name: '小明', biography_id: 'b1' },
  is_liked: false, like_count: 1, comment_count: 0,
}

describe('StoryDetailScreen', () => {
  it('renders loading state', () => {
    useLocalSearchParams.mockReturnValue({ type: 'core-stories', id: '1' })
    ;(useStoryDetail as jest.Mock).mockReturnValue({ data: undefined, isLoading: true })
    const { getByTestId } = render(<StoryDetailScreen />)
    expect(getByTestId('loading-spinner')).toBeTruthy()
  })

  it('renders core-stories with title', () => {
    useLocalSearchParams.mockReturnValue({ type: 'core-stories', id: '1' })
    ;(useStoryDetail as jest.Mock).mockReturnValue({ data: MOCK_CORE_STORY, isLoading: false })
    const { getByText } = render(<StoryDetailScreen />)
    expect(getByText('核心故事標題')).toBeTruthy()
    expect(getByText('小明')).toBeTruthy()
  })

  it('renders one-liners with question', () => {
    useLocalSearchParams.mockReturnValue({ type: 'one-liners', id: '2' })
    ;(useStoryDetail as jest.Mock).mockReturnValue({ data: MOCK_ONE_LINER, isLoading: false })
    const { getByText } = render(<StoryDetailScreen />)
    expect(getByText('你為什麼爬山？')).toBeTruthy()
  })

  it('renders stories with category name fallback', () => {
    useLocalSearchParams.mockReturnValue({ type: 'stories', id: '3' })
    ;(useStoryDetail as jest.Mock).mockReturnValue({ data: MOCK_STORY, isLoading: false })
    const { getByText } = render(<StoryDetailScreen />)
    expect(getByText('小故事')).toBeTruthy()
  })

  it('redirects to tabs when type is invalid', () => {
    const mockReplace = jest.fn()
    const { useRouter } = require('expo-router')
    useRouter.mockReturnValue({ back: jest.fn(), replace: mockReplace })
    useLocalSearchParams.mockReturnValue({ type: 'invalid-type', id: '1' })
    ;(useStoryDetail as jest.Mock).mockReturnValue({ data: undefined, isLoading: false })
    render(<StoryDetailScreen />)
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)')
  })

  it('shows biography link when author biography_id is present', () => {
    useLocalSearchParams.mockReturnValue({ type: 'core-stories', id: '1' })
    ;(useStoryDetail as jest.Mock).mockReturnValue({ data: MOCK_CORE_STORY, isLoading: false })
    const { getByText } = render(<StoryDetailScreen />)
    expect(getByText('查看更多')).toBeTruthy()
  })
})
```

- [ ] Run test and confirm it fails:
  ```bash
  pnpm --filter @nobodyclimb/mobile test -- --testPathPattern=StoryDetailScreen
  ```

- [ ] Implement `apps/mobile/app/story/[type]/[id]/index.tsx`:

```typescript
import { View, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter, Link } from 'expo-router'
import { ChevronLeft } from 'lucide-react-native'
import { Text, MarkdownText, Badge } from '@/components/ui'
import { SPACING, WB_COLORS, RADIUS, SEMANTIC_COLORS } from '@nobodyclimb/constants'
import { ContentInteractionBar } from '@/components/biography/display/ContentInteractionBar'
import { useStoryDetail, isValidStoryType, StoryType } from '@/lib/hooks/useStoryDetail'
import { apiClient } from '@/lib/api/client'

const STORY_TYPE_LABELS: Record<StoryType, string> = {
  'core-stories': '核心故事',
  'one-liners': '一句話',
  'stories': '小故事',
}

export default function StoryDetailScreen() {
  const { type, id } = useLocalSearchParams<{ type: string; id: string }>()
  const router = useRouter()

  // Redirect if invalid type
  // Note: spec says "404 page" but mobile has no dedicated 404 route; redirect to home tab is the practical equivalent.
  if (!isValidStoryType(type)) {
    router.replace('/(tabs)')
    return null
  }

  const storyType = type as StoryType
  const { data: story, isLoading } = useStoryDetail(storyType, id)
  const biographySlug = story?.author?.biography_id ?? ''

  const getTitle = () => {
    if (!story) return STORY_TYPE_LABELS[storyType]
    if (storyType === 'core-stories') return story.title || '核心故事'
    if (storyType === 'one-liners') return story.question || '一句話'
    return story.title || story.category_name || '小故事'
  }

  const getContent = () => {
    if (!story) return ''
    if (storyType === 'one-liners') return story.answer || ''
    return story.content || ''
  }

  const handleToggleLike = async () => {
    const endpoints: Record<StoryType, string> = {
      'core-stories': `/content/core-stories/${id}/like`,
      'one-liners': `/content/one-liners/${id}/like`,
      'stories': `/content/stories/${id}/like`,
    }
    const { data } = await apiClient.post(endpoints[storyType])
    return data.data
  }

  const handleFetchComments = async () => {
    const endpoints: Record<StoryType, string> = {
      'core-stories': `/content/core-stories/${id}/comments`,
      'one-liners': `/content/one-liners/${id}/comments`,
      'stories': `/content/stories/${id}/comments`,
    }
    const { data } = await apiClient.get(endpoints[storyType])
    return data.data
  }

  const handleAddComment = async (text: string) => {
    const endpoints: Record<StoryType, string> = {
      'core-stories': `/content/core-stories/${id}/comments`,
      'one-liners': `/content/one-liners/${id}/comments`,
      'stories': `/content/stories/${id}/comments`,
    }
    const { data } = await apiClient.post(endpoints[storyType], { content: text })
    return data.data
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={WB_COLORS[80]} />
        </Pressable>
        <Badge variant="outline" style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{STORY_TYPE_LABELS[storyType]}</Text>
        </Badge>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.center} testID="loading-spinner">
          <ActivityIndicator color={SEMANTIC_COLORS.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Author section */}
          {story?.author && (
            <View style={styles.authorSection}>
              <Text style={styles.authorName}>{story.author.name}</Text>
            </View>
          )}

          {/* Title */}
          <Text style={styles.title}>{getTitle()}</Text>

          {/* Content */}
          {getContent() ? (
            <MarkdownText>{getContent()}</MarkdownText>
          ) : null}

          {/* Type-specific metadata */}
          {storyType === 'stories' && story?.category_name && (
            <View style={styles.meta}>
              <Badge variant="secondary">
                <Text style={styles.metaText}>{story.category_name}</Text>
              </Badge>
            </View>
          )}

          {/* Interaction bar */}
          {story && (
            <ContentInteractionBar
              contentType={storyType}
              contentId={id}
              isLiked={story.is_liked ?? false}
              likeCount={story.like_count ?? 0}
              commentCount={story.comment_count ?? 0}
              onToggleLike={handleToggleLike}
              onFetchComments={handleFetchComments}
              onAddComment={handleAddComment}
              size="sm"
            />
          )}

          {/* Biography link — no related-stories-by-author endpoint exists in backend */}
          {biographySlug ? (
            <Link href={`/biography/${biographySlug}`} style={styles.biographyLink}>
              <Text style={styles.biographyLinkText}>查看更多</Text>
            </Link>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING[4], paddingVertical: SPACING[3] },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  typeBadge: { flex: 1, alignItems: 'center' },
  typeBadgeText: { fontSize: 13, fontWeight: '500' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: SPACING[4], gap: SPACING[4] },
  authorSection: { flexDirection: 'row', alignItems: 'center', gap: SPACING[2] },
  authorName: { fontSize: 15, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '700', lineHeight: 32 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING[2] },
  metaText: { fontSize: 12 },
  biographyLink: { marginTop: SPACING[4], alignSelf: 'flex-start' },
  biographyLinkText: { fontSize: 14, fontWeight: '500', color: SEMANTIC_COLORS.primary },
})
```

- [ ] Run test and confirm it passes:
  ```bash
  pnpm --filter @nobodyclimb/mobile test -- --testPathPattern=StoryDetailScreen
  # Expected: PASS (5 tests)
  ```

---

### Step 4: ContentInteractionBar integration verification

- [ ] Verify the existing `ContentInteractionBar` at `apps/mobile/src/components/biography/display/ContentInteractionBar.tsx` accepts `contentType` as `'core-stories' | 'one-liners' | 'stories'`.

- [ ] If the type definition is narrower (e.g., only `'stories'`), update it to accept all 3 story types:

```typescript
// In ContentInteractionBar.tsx, update contentType prop:
interface ContentInteractionBarProps {
  contentType: 'core-stories' | 'one-liners' | 'stories'
  // ... rest of props
}
```

- [ ] Run existing ContentInteractionBar tests to ensure no regression:
  ```bash
  pnpm --filter @nobodyclimb/mobile test -- --testPathPattern=ContentInteractionBar
  # Expected: PASS (all existing tests)
  ```

---

### Step 5: Biography link verification

There is NO related stories endpoint in the backend (only `/posts/{id}/related` exists, not for stories). The "查看更多" link navigates to the author's biography page using `story.author.biography_id` as the slug.

- [ ] Confirm `story.author.biography_id` is returned by all three detail endpoints (`/content/core-stories/:id/detail`, `/content/one-liners/:id/detail`, `/content/stories/:id/detail`). If the field name differs (e.g., `biography_slug`), update the `biographySlug` assignment in `index.tsx` accordingly.

- [ ] Verify the `Link` component navigates to `/biography/[slug]` (already handled by Expo Router file-based routing).

---

### Step 6: Run all story-related tests

- [ ] Run the full story test suite:
  ```bash
  pnpm --filter @nobodyclimb/mobile test -- --testPathPattern="useStoryDetail|StoryDetailScreen"
  # Expected: PASS (12 tests total)
  ```

- [ ] Run the full mobile test suite to check for regressions:
  ```bash
  pnpm --filter @nobodyclimb/mobile test
  # Expected: all tests pass
  ```

---

## Verification Checklist

- [ ] `isValidStoryType` correctly validates all 3 valid types and rejects invalid ones
- [ ] `useStoryDetail` dispatches to the correct endpoint for each of the 3 story types
- [ ] `useStoryDetail` does not fetch when type is invalid (`enabled: false`)
- [ ] "查看更多" link is shown when `story.author.biography_id` is present
- [ ] Story page shows loading spinner while fetching
- [ ] Core story renders `title` in the title position
- [ ] One-liner renders `question` in the title position and `answer` as content
- [ ] Story renders `title` with `category_name` fallback
- [ ] Invalid `type` param triggers redirect to `/(tabs)` without crashing
- [ ] `ContentInteractionBar` is wired up with correct `contentType`, `contentId`, and handlers
- [ ] Like endpoint uses correct URL per story type
- [ ] Comment fetch and add endpoints use correct URL per story type
- [ ] "查看更多" link navigates to `/biography/[biography_id]`
- [ ] "查看更多" link is hidden when `biography_id` is absent
- [ ] Layout files (`story/_layout.tsx`, `story/[type]/_layout.tsx`) are present and use `headerShown: false`
- [ ] All new tests pass: `pnpm --filter @nobodyclimb/mobile test`
