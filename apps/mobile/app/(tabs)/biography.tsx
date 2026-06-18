/**
 * 傳記列表頁面
 *
 * 對應 apps/web/src/app/biography/page.tsx
 */

import { SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowRightCircle, MessageCircle, Mountain, UserPlus } from 'lucide-react-native'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BiographyList } from '@/components/biography'
import { Avatar, Button, Card, SearchInput, Text } from '@/components/ui'
import { apiClient } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

type TabValue = 'stories' | 'people'

interface CoreStory {
  id: string
  biography_id: string
  question_id: string
  content: string
  title?: string
  like_count: number
  comment_count: number
  author_name: string
  author_avatar?: string
}

interface OneLiner {
  id: string
  biography_id: string
  question_id: string
  answer: string
  question?: string
  question_text?: string
  like_count: number
  comment_count: number
  author_name: string
  author_avatar?: string
}

interface Story {
  id: string
  biography_id: string
  question_id: string
  content: string
  title?: string
  category_name?: string
  like_count: number
  comment_count: number
  author_name: string
  author_avatar?: string
}

interface ApiResponse<T> {
  success: boolean
  data?: T
}

type FeaturedContent =
  | (CoreStory & { type: 'core-story' })
  | (OneLiner & { type: 'one-liner' })
  | (Story & { type: 'story' })

function interleaveByAuthor(items: FeaturedContent[]): FeaturedContent[] {
  if (items.length <= 1) return items

  const result: FeaturedContent[] = []
  const remaining = [...items]

  while (remaining.length > 0) {
    const lastAuthor = result.length > 0 ? result[result.length - 1]?.biography_id : null
    const differentAuthorIndex = remaining.findIndex((item) => item.biography_id !== lastAuthor)
    result.push(remaining.splice(differentAuthorIndex === -1 ? 0 : differentAuthorIndex, 1)[0])
  }

  return result
}

function getStoryRouteType(type: FeaturedContent['type']) {
  if (type === 'core-story') return 'core-stories'
  if (type === 'one-liner') return 'one-liners'
  return 'stories'
}

function getStoryDisplay(content: FeaturedContent) {
  if (content.type === 'core-story') {
    return { label: content.title || '核心故事', text: content.content }
  }
  if (content.type === 'one-liner') {
    return { label: content.question || content.question_text || '一句話', text: content.answer }
  }
  return { label: content.title || content.category_name || '小故事', text: content.content }
}

function StoryList({ searchTerm }: { searchTerm: string }) {
  const router = useRouter()
  const [contents, setContents] = useState<FeaturedContent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(12)
  const hasFetched = useRef(false)

  const loadStories = useCallback(async () => {
    if (hasFetched.current) return
    hasFetched.current = true

    try {
      const [coreStoriesRes, oneLinersRes, storiesRes] = await Promise.all([
        apiClient.get<ApiResponse<CoreStory[]>>('/content/popular/core-stories', {
          params: { limit: 50 },
        }),
        apiClient.get<ApiResponse<OneLiner[]>>('/content/popular/one-liners', {
          params: { limit: 50 },
        }),
        apiClient.get<ApiResponse<Story[]>>('/content/popular/stories', {
          params: { limit: 50 },
        }),
      ])

      const allContents: FeaturedContent[] = []
      if (coreStoriesRes.data?.success && coreStoriesRes.data.data) {
        allContents.push(
          ...coreStoriesRes.data.data.map((item) => ({ ...item, type: 'core-story' as const }))
        )
      }
      if (oneLinersRes.data?.success && oneLinersRes.data.data) {
        allContents.push(
          ...oneLinersRes.data.data.map((item) => ({ ...item, type: 'one-liner' as const }))
        )
      }
      if (storiesRes.data?.success && storiesRes.data.data) {
        allContents.push(
          ...storiesRes.data.data.map((item) => ({ ...item, type: 'story' as const }))
        )
      }

      allContents.sort((a, b) => b.like_count - a.like_count)
      setContents(interleaveByAuthor(allContents))
    } catch (err) {
      console.error('Failed to load stories:', err)
      setError('載入故事時發生錯誤')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStories()
  }, [loadStories])

  useEffect(() => {
    if (!searchTerm) setVisibleCount(12)
  }, [searchTerm])

  const filteredContents = useMemo(() => {
    if (!searchTerm.trim()) return contents
    const searchLower = searchTerm.trim().toLowerCase()
    return contents.filter((content) => {
      const { label, text } = getStoryDisplay(content)
      return (
        content.author_name?.toLowerCase().includes(searchLower) ||
        label.toLowerCase().includes(searchLower) ||
        text.toLowerCase().includes(searchLower)
      )
    })
  }, [contents, searchTerm])

  const displayedContents = searchTerm ? filteredContents : filteredContents.slice(0, visibleCount)
  const hasMore = !searchTerm && visibleCount < filteredContents.length

  if (loading) {
    return (
      <View style={styles.stateContainer}>
        <ActivityIndicator size="large" color={SEMANTIC_COLORS.textMain} />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.stateContainer}>
        <Text color="error">{error}</Text>
      </View>
    )
  }

  if (filteredContents.length === 0) {
    return (
      <View style={styles.stateContainer}>
        <Text color="textSubtle">{searchTerm ? '找不到符合的故事' : '目前沒有故事'}</Text>
      </View>
    )
  }

  return (
    <FlatList
      data={displayedContents}
      keyExtractor={(item) => `${item.type}-${item.id}`}
      contentContainerStyle={styles.storyListContent}
      ItemSeparatorComponent={() => <View style={styles.storySeparator} />}
      renderItem={({ item, index }) => {
        const { label, text } = getStoryDisplay(item)
        const routeType = getStoryRouteType(item.type)
        return (
          <Animated.View entering={FadeInDown.duration(300).delay(index * 30)}>
            <Pressable onPress={() => router.push(`/story/${routeType}/${item.id}` as never)}>
              <Card style={styles.storyCard}>
                <View style={styles.storyBody}>
                  <Text variant="small" color="textMuted" numberOfLines={1}>
                    {label}
                  </Text>
                  <Text style={styles.storyQuote} numberOfLines={4}>
                    "{text}"
                  </Text>
                </View>
                <View style={styles.storyFooter}>
                  <View style={styles.storyAuthor}>
                    <Avatar
                      size="sm"
                      source={item.author_avatar ? { uri: item.author_avatar } : undefined}
                    />
                    <View style={styles.storyAuthorText}>
                      <Text variant="body" fontWeight="500" numberOfLines={1}>
                        {item.author_name || '匿名'}
                      </Text>
                      <View style={styles.storyStats}>
                        <View style={styles.storyStat}>
                          <Mountain size={12} color={SEMANTIC_COLORS.textMuted} />
                          <Text variant="caption" color="textMuted">
                            {item.like_count}
                          </Text>
                        </View>
                        <View style={styles.storyStat}>
                          <MessageCircle size={12} color={SEMANTIC_COLORS.textMuted} />
                          <Text variant="caption" color="textMuted">
                            {item.comment_count}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  <ArrowRightCircle size={18} color={SEMANTIC_COLORS.textMuted} />
                </View>
              </Card>
            </Pressable>
          </Animated.View>
        )
      }}
      ListFooterComponent={
        hasMore ? (
          <View style={styles.loadMoreContainer}>
            <Button variant="outline" onPress={() => setVisibleCount((count) => count + 12)}>
              載入更多故事
            </Button>
          </View>
        ) : null
      }
    />
  )
}

export default function BiographyScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ tab?: string }>()
  const { isAuthenticated } = useAuthStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<TabValue>(
    params.tab === 'stories' ? 'stories' : 'people'
  )
  const [totalCount, setTotalCount] = useState(0)
  const [_hasMore, setHasMore] = useState(false)
  const [_refreshing, setRefreshing] = useState(false)

  // 處理搜尋
  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value)
  }, [])

  // 處理總數變更
  const handleTotalChange = useCallback((total: number, more: boolean) => {
    setTotalCount(total)
    setHasMore(more)
  }, [])

  const handleTabChange = useCallback((tab: TabValue) => {
    setActiveTab(tab)
    setSearchTerm('')
  }, [])

  // 處理刷新
  const _handleRefresh = useCallback(() => {
    setRefreshing(true)
    // 重置搜尋觸發刷新
    setSearchTerm('')
    setTimeout(() => setRefreshing(false), 500)
  }, [])

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 標題區 */}
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text variant="h2" fontWeight="700">
            攀岩傳記
          </Text>
          <Text variant="body" color="textSubtle">
            探索攀岩者的故事
          </Text>
        </View>

        {!isAuthenticated && (
          <View style={styles.guestBanner}>
            <View style={styles.guestIcon}>
              <UserPlus size={20} color={SEMANTIC_COLORS.textMain} />
            </View>
            <View style={styles.guestText}>
              <Text variant="body" fontWeight="600">
                也想留下你的攀岩故事嗎？
              </Text>
              <Text variant="caption" color="textSubtle">
                註冊後即可建立人物誌、分享故事與收藏目標。
              </Text>
            </View>
            <Button size="sm" onPress={() => router.push('/auth/register' as never)}>
              加入
            </Button>
          </View>
        )}

        <View style={styles.tabs}>
          <Pressable
            style={[styles.tabButton, activeTab === 'stories' && styles.tabButtonActive]}
            onPress={() => handleTabChange('stories')}
          >
            <Text
              variant="body"
              fontWeight="600"
              style={activeTab === 'stories' ? styles.tabTextActive : styles.tabText}
            >
              小故事
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabButton, activeTab === 'people' && styles.tabButtonActive]}
            onPress={() => handleTabChange('people')}
          >
            <Text
              variant="body"
              fontWeight="600"
              style={activeTab === 'people' ? styles.tabTextActive : styles.tabText}
            >
              小人物
            </Text>
          </Pressable>
        </View>

        {/* 搜尋欄 */}
        <SearchInput
          value={searchTerm}
          onChangeText={handleSearch}
          placeholder={activeTab === 'stories' ? '搜尋故事或作者...' : '搜尋人物...'}
          style={styles.searchInput}
        />

        {/* 總數顯示 */}
        {activeTab === 'people' && totalCount > 0 && (
          <Text variant="small" color="textMuted" style={styles.countText}>
            共 {totalCount} 位攀岩者
          </Text>
        )}
      </View>

      {/* 列表區 */}
      <View style={styles.listContainer}>
        {activeTab === 'stories' ? (
          <StoryList searchTerm={searchTerm} />
        ) : (
          <BiographyList searchTerm={searchTerm} onTotalChange={handleTotalChange} />
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SEMANTIC_COLORS.pageBg,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  titleSection: {
    marginBottom: SPACING.md,
  },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    padding: SPACING.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
  },
  guestIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  guestText: {
    flex: 1,
    gap: 2,
  },
  tabs: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: SEMANTIC_COLORS.textMain,
  },
  tabText: {
    color: SEMANTIC_COLORS.textSubtle,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  searchInput: {
    marginBottom: SPACING.sm,
  },
  countText: {
    marginTop: SPACING.xs,
  },
  listContainer: {
    flex: 1,
  },
  stateContainer: {
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  storyListContent: {
    padding: SPACING.md,
  },
  storySeparator: {
    height: SPACING.md,
  },
  storyCard: {
    padding: SPACING.md,
  },
  storyBody: {
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  storyQuote: {
    fontSize: 15,
    lineHeight: 23,
    color: SEMANTIC_COLORS.textMain,
    fontWeight: '500',
  },
  storyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  storyAuthor: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  storyAuthorText: {
    flex: 1,
  },
  storyStats: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: 2,
  },
  storyStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  loadMoreContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
})
