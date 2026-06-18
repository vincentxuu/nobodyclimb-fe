/**
 * BiographyList 組件
 *
 * 人物誌列表，對應 apps/web/src/components/biography/biography-list.tsx
 */

import { BRAND_YELLOW, SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import { useRouter } from 'expo-router'
import { ArrowRightCircle, Sparkles } from 'lucide-react-native'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { Avatar, Card, Text } from '@/components/ui'
import { apiClient } from '@/lib/api'
import { getTagOptionById, SYSTEM_TAG_DIMENSIONS } from '@/lib/constants/biography-tags'

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

interface TagSelection {
  tag_id: string
  source?: 'system' | 'user'
}

interface TagOptionLike {
  id: string
  label: string
  dimension_id?: string
}

interface TagsDataStorage {
  selections?: TagSelection[]
  display_tags?: string[]
  custom_tags?: TagOptionLike[]
  custom_dimensions?: Array<{ options: TagOptionLike[] }>
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
    return '匿名岩友'
  }
  return name || '未知'
}

const DEFAULT_DISPLAY_DIMENSIONS = [
  SYSTEM_TAG_DIMENSIONS.STYLE_CULT,
  SYSTEM_TAG_DIMENSIONS.SHOE_FACTION,
  SYSTEM_TAG_DIMENSIONS.TRAINING_APPROACH,
]

function getDefaultDisplayTags(
  selections: TagSelection[],
  maxCount = 3,
  customTagsMap?: Map<string, TagOptionLike>
): DisplayTag[] {
  const result: DisplayTag[] = []
  const usedTagIds = new Set<string>()

  const findTagOption = (tagId: string): TagOptionLike | undefined =>
    customTagsMap?.get(tagId) || getTagOptionById(tagId)

  const isCustomTag = (selection: TagSelection) =>
    selection.source === 'user' ||
    customTagsMap?.has(selection.tag_id) ||
    selection.tag_id.startsWith('usr_')

  for (const selection of selections) {
    if (result.length >= maxCount) break
    if (!isCustomTag(selection)) continue
    const option = findTagOption(selection.tag_id)
    if (option) {
      result.push({ id: selection.tag_id, label: option.label, isCustom: true })
      usedTagIds.add(selection.tag_id)
    }
  }

  for (const dimensionId of DEFAULT_DISPLAY_DIMENSIONS) {
    if (result.length >= maxCount) break
    const tagInDimension = selections.find((selection) => {
      const option = findTagOption(selection.tag_id)
      return option?.dimension_id === dimensionId && !usedTagIds.has(selection.tag_id)
    })
    if (tagInDimension) {
      const option = findTagOption(tagInDimension.tag_id)
      if (option) {
        result.push({ id: tagInDimension.tag_id, label: option.label, isCustom: false })
        usedTagIds.add(tagInDimension.tag_id)
      }
    }
  }

  for (const selection of selections) {
    if (result.length >= maxCount) break
    if (usedTagIds.has(selection.tag_id)) continue
    const option = findTagOption(selection.tag_id)
    if (option) {
      result.push({
        id: selection.tag_id,
        label: option.label,
        isCustom: isCustomTag(selection),
      })
      usedTagIds.add(selection.tag_id)
    }
  }

  return result
}

// 取得顯示標籤
function getDisplayTags(tagsData: string | null | undefined): DisplayTag[] {
  if (!tagsData) return []
  try {
    const parsed = JSON.parse(tagsData) as TagsDataStorage | TagSelection[]

    if (Array.isArray(parsed)) {
      return getDefaultDisplayTags(parsed, 3)
    }

    const customTagsMap = new Map<string, TagOptionLike>()
    if (parsed.custom_tags) {
      for (const tag of parsed.custom_tags) {
        customTagsMap.set(tag.id, tag)
      }
    }
    if (parsed.custom_dimensions) {
      for (const dimension of parsed.custom_dimensions) {
        for (const tag of dimension.options) {
          customTagsMap.set(tag.id, tag)
        }
      }
    }

    const selections = parsed.selections ?? []
    if (parsed.display_tags && parsed.display_tags.length > 0) {
      return parsed.display_tags.slice(0, 3).flatMap((tagId) => {
        const option = customTagsMap.get(tagId) || getTagOptionById(tagId)
        if (!option) return []
        const selection = selections.find((item) => item.tag_id === tagId)
        return {
          id: tagId,
          label: option.label,
          isCustom:
            selection?.source === 'user' || customTagsMap.has(tagId) || tagId.startsWith('usr_'),
        }
      })
    }

    return getDefaultDisplayTags(selections, 3, customTagsMap)
  } catch {
    return []
  }
}

// 預設引言
const DEFAULT_QUOTES = [
  '正在岩壁上尋找人生的意義...',
  '手指還在長繭中，故事正在醞釀',
  '專注攀爬，無暇寫字',
  '話不多說，先爬再說',
  '故事？都刻在岩壁上了',
  '正忙著挑戰下一條路線',
  '低調的小人物，低調的攀登',
]

function getDefaultQuote(id: string): string {
  const index =
    id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % DEFAULT_QUOTES.length
  return DEFAULT_QUOTES[index]
}

interface SelectedCardContent {
  question: string
  answer: string
  questionId: string
}

const ONE_LINER_QUESTIONS: Record<string, string> = {
  climbing_origin: '你與攀岩的相遇',
  climbing_meaning: '攀岩對你來說是什麼？',
  advice_to_self: '給剛開始攀岩的自己',
  best_moment: '爬岩最爽的是？',
  favorite_place: '最喜歡在哪裡爬？',
  current_goal: '目前的攀岩小目標？',
  climbing_takeaway: '攀岩教會我的一件事？',
  climbing_style_desc: '用一句話形容你的攀岩風格？',
  life_outside: '攀岩之外，你是誰？',
  bucket_list: '攀岩人生清單上有什麼？',
}

const STORY_QUESTIONS: Record<string, string> = {
  climbing_origin_story: '你與攀岩的故事',
  memorable_route: '最難忘的一條路線',
  climbing_philosophy: '攀岩教會你的事',
  community_story: '岩友之間的故事',
  injury_recovery: '受傷與復原的經歷',
  memorable_moment: '最難忘的攀岩時刻',
  biggest_challenge: '最大的挑戰',
  breakthrough_story: '突破的故事',
  first_outdoor: '第一次戶外攀岩',
  first_grade: '第一次完成的難度',
  frustrating_climb: '最挫折的一次',
  fear_management: '如何面對恐懼',
  climbing_lesson: '攀岩教會我的事',
  flow_moment: '心流時刻',
  life_balance: '攀岩與生活的平衡',
  unexpected_gain: '意外的收穫',
  climbing_mentor: '攀岩導師',
  climbing_partner: '攀岩夥伴',
  funny_moment: '有趣的攀岩經歷',
  favorite_spot: '最愛的攀岩地點',
  advice_to_group: '給岩友的建議',
  climbing_space: '攀岩的空間',
  training_method: '訓練方式',
  effective_practice: '有效的練習',
  technique_tip: '技巧心得',
  gear_choice: '裝備選擇',
  dream_climb: '夢想中的路線',
  climbing_trip: '攀岩旅行',
  bucket_list_story: '願望清單',
  climbing_goal: '攀岩目標',
  climbing_style: '攀岩風格',
  climbing_inspiration: '攀岩的啟發',
  life_outside_climbing: '攀岩以外的生活',
}

const CARD_QUESTION_PRIORITY = [
  'climbing_meaning',
  'climbing_origin',
  'advice_to_self',
  'best_moment',
  'favorite_place',
]

function selectByHash(
  id: string,
  content: Array<{ key: string; question: string; answer: string }>
): SelectedCardContent {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const selected = content[hash % content.length]
  return {
    question: selected.question,
    answer: selected.answer,
    questionId: selected.key,
  }
}

// 選擇卡片內容
function selectCardContent(
  id: string,
  oneLinersData: string | null | undefined,
  storiesData: string | null | undefined
): SelectedCardContent | null {
  const availableContent: Array<{ key: string; question: string; answer: string }> = []

  // 優先使用 one_liners
  if (oneLinersData) {
    try {
      const oneLiners = JSON.parse(oneLinersData) as
        | Record<string, { answer?: string; visibility?: string }>
        | Array<{ id: string; question?: string; answer?: string }>

      if (Array.isArray(oneLiners)) {
        for (const item of oneLiners) {
          if (item.answer?.trim()) {
            availableContent.push({
              key: item.id,
              question: item.question || ONE_LINER_QUESTIONS[item.id] || '攀岩對你來說是什麼？',
              answer: item.answer,
            })
          }
        }
      } else {
        const oneLinerKeys = Object.keys(oneLiners)
        const prioritySet = new Set(CARD_QUESTION_PRIORITY)
        const orderedKeys = [
          ...CARD_QUESTION_PRIORITY,
          ...oneLinerKeys.filter((key) => !prioritySet.has(key)).sort(),
        ]

        for (const key of orderedKeys) {
          const data = oneLiners[key]
          if (data?.answer?.trim() && data.visibility === 'public') {
            availableContent.push({
              key,
              question: ONE_LINER_QUESTIONS[key] || '攀岩對你來說是什麼？',
              answer: data.answer,
            })
          }
        }
      }
    } catch {
      // ignore
    }
  }

  // 嘗試使用 stories
  if (storiesData) {
    try {
      const stories = JSON.parse(storiesData) as
        | Record<string, Record<string, { answer?: string; visibility?: string }>>
        | Array<{ id: string; title?: string; content?: string }>

      if (Array.isArray(stories)) {
        for (const item of stories) {
          if (item.content?.trim()) {
            availableContent.push({
              key: item.id,
              question: item.title || STORY_QUESTIONS[item.id] || '攀岩故事',
              answer: item.content.length > 100 ? `${item.content.slice(0, 100)}...` : item.content,
            })
          }
        }
      } else {
        for (const category of Object.values(stories)) {
          if (!category) continue
          for (const [key, data] of Object.entries(category)) {
            if (data?.answer?.trim() && data.visibility === 'public') {
              availableContent.push({
                key,
                question: STORY_QUESTIONS[key] || '攀岩故事',
                answer: data.answer.length > 100 ? `${data.answer.slice(0, 100)}...` : data.answer,
              })
            }
          }
        }
      }
    } catch {
      // ignore
    }
  }

  return availableContent.length > 0 ? selectByHash(id, availableContent) : null
}

interface BiographyCardProps {
  person: Biography
  selectedContent: SelectedCardContent | null
  onPress: () => void
}

function BiographyCard({ person, selectedContent, onPress }: BiographyCardProps) {
  const basicInfo = parseBasicInfoData(person.basic_info_data)
  const displayName = getDisplayNameForVisibility(person.visibility, basicInfo?.name || person.name)
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
              style={[styles.quote, selectedContent ? styles.quoteReal : styles.quoteDefault]}
              numberOfLines={3}
            >
              {selectedContent ? `"${selectedContent.answer}"` : getDefaultQuote(person.id)}
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
                            <Sparkles size={10} color={BRAND_YELLOW[100]} />
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
                    {climbingYears !== null ? `攀岩 ${climbingYears}年` : '從入坑那天起算'}
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

export function BiographyList({ searchTerm = '', onTotalChange }: BiographyListProps) {
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
        const params: Record<string, any> = { page, limit: 20 }
        if (searchTerm) params.search = searchTerm

        const response = await apiClient.get('/biographies', { params })
        const result = response.data?.data ?? response.data
        const items: Biography[] = Array.isArray(result) ? result : (result?.items ?? [])
        const pagination = response.data?.pagination ?? result?.pagination

        if (append) {
          setBiographies((prev) => [...prev, ...items])
        } else {
          setBiographies(items)
        }

        const hasMoreData = pagination ? pagination.page < pagination.total_pages : false
        setHasMore(hasMoreData)
        setCurrentPage(page)
        onTotalChange?.(pagination?.total ?? items.length, hasMoreData)
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
      content: selectCardContent(person.id, person.one_liners_data, person.stories_data),
    }))
  }, [biographies])

  // 渲染項目
  const renderItem = ({ item }: { item: (typeof biographiesWithContent)[0] }) => (
    <BiographyCard
      person={item.person}
      selectedContent={item.content}
      onPress={() => router.push(`/biography/profile/${item.person.slug}` as any)}
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
          {searchTerm ? `找不到符合「${searchTerm}」的人物` : '目前沒有人物誌'}
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
