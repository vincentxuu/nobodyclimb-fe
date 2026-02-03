/**
 * BiographyList 組件
 *
 * 人物誌列表，對應 apps/web/src/components/biography/biography-list.tsx
 */
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { StyleSheet, View, FlatList, ActivityIndicator, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { ArrowRightCircle, Sparkles } from 'lucide-react-native'
import Animated, {
  FadeInDown,
} from 'react-native-reanimated'

import { Text, Avatar, Card } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

// 模擬類型定義 (實際應從 @nobodyclimb/types 導入)
interface Biography {
  id: string
  slug: string
  name: string
  avatar_url?: string | null
  visibility?: string
  climbing_start_year?: number | string | null
  basic_info_data?: string | null
  tags_data?: string | null
  one_liners_data?: string | null
  stories_data?: string | null
}

interface BasicInfoData {
  name?: string
  title?: string
  bio?: string
  climbing_start_year?: number | string
  frequent_locations?: string
  home_gym?: string
}

interface DisplayTag {
  id: string
  label: string
  isCustom?: boolean
}

// 解析 basic_info_data JSON
function parseBasicInfoData(json: string | null | undefined): BasicInfoData | null {
  if (!json) return null
  try {
    return JSON.parse(json) as BasicInfoData
  } catch {
    return null
  }
}

// 計算攀岩年資
function calculateClimbingYears(startYear: string | null): number | null {
  if (!startYear) return null
  const year = parseInt(startYear, 10)
  if (isNaN(year)) return null
  const currentYear = new Date().getFullYear()
  return currentYear - year
}

// 取得顯示名稱
function getDisplayNameForVisibility(visibility: string | undefined, name: string): string {
  if (visibility === 'anonymous') {
    return '匿名攀岩者'
  }
  return name || '未知'
}

// 取得顯示標籤
function getDisplayTags(tagsData: string | null | undefined): DisplayTag[] {
  if (!tagsData) return []
  try {
    const tags = JSON.parse(tagsData) as Array<{ id: string; label: string; is_custom?: boolean }>
    return tags.slice(0, 3).map((tag) => ({
      id: tag.id,
      label: tag.label,
      isCustom: tag.is_custom,
    }))
  } catch {
    return []
  }
}

// 預設引言
const DEFAULT_QUOTES = [
  '攀岩是一場與自己的對話',
  '每一步都是成長',
  '在岩壁上找到自由',
  '挑戰自我，超越極限',
  '享受攀登的每一刻',
]

function getDefaultQuote(id: string): string {
  const index = id.charCodeAt(0) % DEFAULT_QUOTES.length
  return DEFAULT_QUOTES[index]
}

interface SelectedCardContent {
  question: string
  answer: string
  questionId: string
}

// 選擇卡片內容
function selectCardContent(
  id: string,
  oneLinersData: string | null | undefined,
  storiesData: string | null | undefined
): SelectedCardContent | null {
  // 優先使用 one_liners
  if (oneLinersData) {
    try {
      const oneLiners = JSON.parse(oneLinersData) as Array<{
        id: string
        question: string
        answer: string
      }>
      const answered = oneLiners.filter((item) => item.answer)
      if (answered.length > 0) {
        const item = answered[0]
        return {
          question: item.question,
          answer: item.answer,
          questionId: item.id,
        }
      }
    } catch {
      // ignore
    }
  }

  // 嘗試使用 stories
  if (storiesData) {
    try {
      const stories = JSON.parse(storiesData) as Array<{
        id: string
        title: string
        content: string
      }>
      const hasContent = stories.filter((item) => item.content)
      if (hasContent.length > 0) {
        const item = hasContent[0]
        return {
          question: item.title,
          answer: item.content.slice(0, 100),
          questionId: item.id,
        }
      }
    } catch {
      // ignore
    }
  }

  return null
}

interface BiographyCardProps {
  person: Biography
  selectedContent: SelectedCardContent | null
  onPress: () => void
}

function BiographyCard({ person, selectedContent, onPress }: BiographyCardProps) {
  const basicInfo = parseBasicInfoData(person.basic_info_data)
  const displayName = getDisplayNameForVisibility(
    person.visibility,
    basicInfo?.name || person.name
  )
  const climbingStartYear = basicInfo?.climbing_start_year ?? person.climbing_start_year
  const climbingYears = calculateClimbingYears(
    climbingStartYear != null ? String(climbingStartYear) : null
  )
  const displayTags = getDisplayTags(person.tags_data)

  return (
    <Animated.View entering={FadeInDown.duration(400)}>
      <Pressable onPress={onPress}>
        <Card style={styles.card}>
          {/* 引言區域 */}
          <View style={styles.quoteSection}>
            <Text variant="small" color="textMuted" style={styles.question}>
              {selectedContent?.question || '攀岩對你來說是什麼？'}
            </Text>
            <Text
              style={[
                styles.quote,
                selectedContent
                  ? styles.quoteReal
                  : styles.quoteDefault,
              ]}
              numberOfLines={3}
            >
              {selectedContent
                ? `"${selectedContent.answer}"`
                : getDefaultQuote(person.id)}
            </Text>
          </View>

          {/* 底部資訊 */}
          <View style={styles.footer}>
            <View style={styles.personInfo}>
              <Avatar
                size="sm"
                source={person.avatar_url ? { uri: person.avatar_url } : undefined}
              />
              <View style={styles.personText}>
                <Text variant="body" fontWeight="500">
                  {displayName}
                </Text>
                {displayTags.length > 0 ? (
                  <View style={styles.tagsRow}>
                    {displayTags.map((tag, index) => (
                      <React.Fragment key={tag.id}>
                        {tag.isCustom ? (
                          <View style={styles.customTag}>
                            <Sparkles size={10} color="#FFE70C" />
                            <Text variant="small" style={styles.customTagText}>
                              {tag.label}
                            </Text>
                          </View>
                        ) : (
                          <Text variant="small" color="textSubtle">
                            {tag.label}
                          </Text>
                        )}
                        {index < displayTags.length - 1 &&
                          !tag.isCustom &&
                          !displayTags[index + 1]?.isCustom && (
                            <Text variant="small" color="textSubtle">
                              {' · '}
                            </Text>
                          )}
                      </React.Fragment>
                    ))}
                  </View>
                ) : (
                  <Text variant="small" color="textMuted">
                    {climbingYears !== null
                      ? `攀岩 ${climbingYears}年`
                      : '從入坑那天起算'}
                  </Text>
                )}
              </View>
            </View>
            <ArrowRightCircle size={18} color={SEMANTIC_COLORS.textMuted} />
          </View>
        </Card>
      </Pressable>
    </Animated.View>
  )
}

interface BiographyListProps {
  /** 搜尋關鍵字 */
  searchTerm?: string
  /** 總數變更回調 */
  onTotalChange?: (total: number, hasMore: boolean) => void
}

export function BiographyList({
  searchTerm = '',
  onTotalChange,
}: BiographyListProps) {
  const router = useRouter()
  const [biographies, setBiographies] = useState<Biography[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const initialLoadDone = useRef(false)
  const prevSearchTerm = useRef(searchTerm)

  // 載入資料
  const loadBiographies = useCallback(
    async (page: number, append: boolean = false) => {
      if (append) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }
      setError(null)

      try {
        // TODO: 整合 biographyService
        // const response = await biographyService.getBiographies(page, 20, searchTerm || undefined)
        // if (response.success) {
        //   setBiographies(prev => append ? [...prev, ...response.data] : response.data)
        //   const hasMoreData = response.pagination.page < response.pagination.total_pages
        //   setHasMore(hasMoreData)
        //   setCurrentPage(page)
        //   onTotalChange?.(response.pagination.total, hasMoreData)
        // }

        // 模擬資料
        const mockData: Biography[] = [
          {
            id: '1',
            slug: 'test-user-1',
            name: '測試用戶 1',
            avatar_url: null,
            one_liners_data: JSON.stringify([
              { id: 'q1', question: '攀岩對你來說是什麼？', answer: '是一種生活方式' },
            ]),
          },
          {
            id: '2',
            slug: 'test-user-2',
            name: '測試用戶 2',
            avatar_url: null,
            climbing_start_year: 2018,
          },
        ]

        await new Promise((resolve) => setTimeout(resolve, 500))
        setBiographies(mockData)
        setHasMore(false)
        setCurrentPage(1)
        onTotalChange?.(mockData.length, false)
      } catch (err) {
        console.error('Failed to load biographies:', err)
        setError('載入人物誌時發生錯誤')
        if (!append) {
          setBiographies([])
        }
        setHasMore(false)
        onTotalChange?.(0, false)
      } finally {
        setLoading(false)
        setLoadingMore(false)
        initialLoadDone.current = true
      }
    },
    [searchTerm, onTotalChange]
  )

  // 載入更多
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadBiographies(currentPage + 1, true)
    }
  }, [currentPage, hasMore, loadingMore, loadBiographies])

  // 搜尋時重新載入
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      const isSearchTermChanged = prevSearchTerm.current !== searchTerm
      prevSearchTerm.current = searchTerm

      if (isSearchTermChanged || !initialLoadDone.current) {
        setCurrentPage(1)
        loadBiographies(1, false)
      }
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchTerm, loadBiographies])

  // 預先計算每張卡片的內容
  const biographiesWithContent = useMemo(() => {
    if (biographies.length === 0) return []
    return biographies.map((person) => ({
      person,
      content: selectCardContent(
        person.id,
        person.one_liners_data,
        person.stories_data
      ),
    }))
  }, [biographies])

  // 渲染項目
  const renderItem = ({ item }: { item: typeof biographiesWithContent[0] }) => (
    <BiographyCard
      person={item.person}
      selectedContent={item.content}
      onPress={() => router.push(`/biography/${item.person.slug}` as any)}
    />
  )

  // 渲染底部
  const renderFooter = () => {
    if (!loadingMore) return null
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={SEMANTIC_COLORS.textMain} />
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={SEMANTIC_COLORS.textMain} />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text color="error">{error}</Text>
      </View>
    )
  }

  if (biographies.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text color="textSubtle">
          {searchTerm
            ? `找不到符合「${searchTerm}」的人物`
            : '目前沒有人物誌'}
        </Text>
      </View>
    )
  }

  return (
    <FlatList
      data={biographiesWithContent}
      renderItem={renderItem}
      keyExtractor={(item) => item.person.id}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
    />
  )
}

const styles = StyleSheet.create({
  listContent: {
    padding: SPACING.md,
  },
  separator: {
    height: SPACING.md,
  },
  card: {
    padding: SPACING.md,
  },
  quoteSection: {
    marginBottom: SPACING.md,
  },
  question: {
    marginBottom: SPACING.xs,
  },
  quote: {
    fontSize: 15,
    lineHeight: 22,
  },
  quoteReal: {
    fontWeight: '500',
    color: SEMANTIC_COLORS.textMain,
  },
  quoteDefault: {
    fontStyle: 'italic',
    color: SEMANTIC_COLORS.textMuted,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: SPACING.sm,
  },
  personInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.sm,
  },
  personText: {
    flex: 1,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 2,
  },
  customTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(255, 231, 12, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 231, 12, 0.3)',
  },
  customTagText: {
    color: SEMANTIC_COLORS.textMain,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  loadingMore: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
})

export default BiographyList
