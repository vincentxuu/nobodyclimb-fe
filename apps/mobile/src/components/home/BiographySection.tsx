/**
 * BiographySection 組件
 *
 * 傳記區塊，對應 apps/web/src/components/home/biography-section.tsx
 * 串接 GET /biographies/featured API 取得真實資料
 * 豐富卡片設計：封面圖 + 頭像 + 名稱 + 標語 + 一句話 + 標籤 + CTA
 */

import { BORDER_RADIUS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import type { Biography } from '@nobodyclimb/types'
import { useRouter } from 'expo-router'
import { ArrowRight, Mountain, Sparkles } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import { Image, Pressable, StyleSheet, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { YStack } from 'tamagui'
import { Avatar, Button, Skeleton, Text } from '@/components/ui'
import { apiClient } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

// ============================================
// 一句話問題定義與解析
// ============================================

const ONE_LINER_QUESTIONS: Record<string, string> = {
  climbing_origin: '你與攀岩的相遇',
  climbing_meaning: '攀岩對你來說是什麼？',
  advice_to_self: '給剛開始攀岩的自己',
  best_moment: '爬岩最爽的是？',
  favorite_place: '最喜歡在哪裡爬？',
  current_goal: '目前的攀岩小目標？',
}

const PRIORITY_KEYS = [
  'climbing_meaning',
  'climbing_origin',
  'advice_to_self',
  'best_moment',
  'favorite_place',
  'current_goal',
]

/**
 * 從 one_liners_data JSON 取得最多 maxCount 個一句話
 */
function getDisplayOneLiners(
  oneLinersJson: string | null | undefined,
  maxCount = 3
): Array<{ question: string; answer: string }> {
  if (!oneLinersJson) return []

  try {
    const parsed = JSON.parse(oneLinersJson) as Record<
      string,
      { answer: string; visibility?: string } | undefined
    >

    const result: Array<{ question: string; answer: string }> = []

    // 按優先順序取得一句話
    for (const key of PRIORITY_KEYS) {
      if (result.length >= maxCount) break
      const data = parsed[key]
      if (data?.answer && data.answer.trim() && data.visibility === 'public') {
        result.push({
          question: ONE_LINER_QUESTIONS[key] || key,
          answer: data.answer.length > 30 ? data.answer.slice(0, 30) + '...' : data.answer,
        })
      }
    }

    // 如果不夠，從其他問題補充
    const prioritySet = new Set(PRIORITY_KEYS)
    for (const [key, data] of Object.entries(parsed)) {
      if (result.length >= maxCount) break
      if (prioritySet.has(key)) continue
      if (data?.answer && data.answer.trim() && data.visibility === 'public') {
        result.push({
          question: ONE_LINER_QUESTIONS[key] || key,
          answer: data.answer.length > 30 ? data.answer.slice(0, 30) + '...' : data.answer,
        })
      }
    }

    return result
  } catch {
    return []
  }
}

// ============================================
// 標籤解析
// ============================================

interface DisplayTag {
  id: string
  label: string
  isCustom: boolean
}

/**
 * 從 tags_data JSON 取得最多 maxCount 個標籤
 */
function getDisplayTags(tagsJson: string | null | undefined, maxCount = 3): DisplayTag[] {
  if (!tagsJson) return []

  try {
    const parsed = JSON.parse(tagsJson)
    const result: DisplayTag[] = []

    // 陣列格式：[{ dimension_id, tag_id, label }]
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (result.length >= maxCount) break
        if (item && item.label) {
          result.push({
            id: item.tag_id || item.id || String(result.length),
            label: item.label,
            isCustom: false,
          })
        }
      }
      return result
    }

    // 物件格式：{ selections: [...], custom_tags: [...], custom_dimensions: [...] }
    if (typeof parsed === 'object' && parsed !== null) {
      // 先加入 selections
      if (Array.isArray(parsed.selections)) {
        for (const item of parsed.selections) {
          if (result.length >= maxCount) break
          if (item && item.label) {
            result.push({
              id: item.tag_id || item.id || String(result.length),
              label: item.label,
              isCustom: false,
            })
          }
        }
      }

      // 再加入自訂標籤
      if (Array.isArray(parsed.custom_tags)) {
        for (const item of parsed.custom_tags) {
          if (result.length >= maxCount) break
          const label = typeof item === 'string' ? item : item?.label
          if (label) {
            result.push({
              id: `custom-${result.length}`,
              label,
              isCustom: true,
            })
          }
        }
      }

      // 自訂維度的標籤
      if (Array.isArray(parsed.custom_dimensions)) {
        for (const dim of parsed.custom_dimensions) {
          if (result.length >= maxCount) break
          if (dim && dim.label) {
            result.push({
              id: `dim-${result.length}`,
              label: dim.label,
              isCustom: true,
            })
          }
        }
      }
    }

    return result
  } catch {
    return []
  }
}

// ============================================
// 卡片組件
// ============================================

function BiographyCard({ item, index }: { item: Biography; index: number }) {
  const router = useRouter()

  const handlePress = () => {
    router.push(`/biography/${item.slug}`)
  }

  // 顯示名稱
  const displayName = item.visibility === 'anonymous' ? '匿名岩友' : item.name

  // 一句話
  const oneLiners = getDisplayOneLiners(item.one_liners_data, 3)

  // 標籤
  const tags = getDisplayTags(item.tags_data, 3)

  // 是否有封面圖
  const hasCover = !!item.cover_image

  return (
    <Animated.View entering={FadeInDown.delay(index * 120).duration(500)}>
      <Pressable onPress={handlePress}>
        <View style={styles.card}>
          {/* 封面圖區域 (aspect ratio ~3:1) */}
          <View style={styles.coverContainer}>
            {hasCover ? (
              <Image
                source={{ uri: item.cover_image! }}
                style={styles.coverImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.coverPlaceholder}>
                <Mountain size={32} color={WB_COLORS[40]} />
              </View>
            )}
            {/* 漸層遮罩 */}
            <View style={styles.coverGradient} />
          </View>

          {/* 內容區 */}
          <View style={styles.contentContainer}>
            {/* 頭像 - 與封面重疊 */}
            <View style={styles.avatarWrapper}>
              <Avatar size="lg" source={item.avatar_url ? { uri: item.avatar_url } : undefined} />
            </View>

            {/* 姓名 + 標語 */}
            <View style={styles.nameSection}>
              <Text fontWeight="600" style={styles.nameText}>
                {displayName}
              </Text>
              {item.title ? (
                <Text variant="small" color="textSubtle" numberOfLines={1}>
                  「{item.title}」
                </Text>
              ) : null}
            </View>

            {/* 一句話 */}
            {oneLiners.length > 0 && (
              <View style={styles.oneLinersContainer}>
                {oneLiners.map((liner, i) => (
                  <View key={i} style={styles.oneLinerRow}>
                    <Text style={styles.oneLinerQuestion}>{liner.question}：</Text>
                    <Text style={styles.oneLinerAnswer}>{liner.answer}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* 標籤 */}
            {tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {tags.map((tag) => (
                  <View
                    key={tag.id}
                    style={[styles.tag, tag.isCustom ? styles.tagCustom : styles.tagDefault]}
                  >
                    {tag.isCustom && (
                      <Sparkles size={10} color={WB_COLORS[100]} style={{ marginRight: 2 }} />
                    )}
                    <Text
                      style={[
                        styles.tagText,
                        tag.isCustom ? styles.tagTextCustom : styles.tagTextDefault,
                      ]}
                    >
                      {tag.label}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* CTA 按鈕 */}
            <View style={styles.cardCta}>
              <Text style={styles.cardCtaText}>看 {displayName} 的故事</Text>
              <ArrowRight size={14} color={WB_COLORS[100]} />
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  )
}

// ============================================
// 骨架屏
// ============================================

function BiographySkeleton() {
  return (
    <View style={styles.card}>
      {/* 封面骨架 */}
      <Skeleton style={styles.coverSkeleton} />

      {/* 內容骨架 */}
      <View style={styles.contentContainer}>
        {/* 頭像骨架 */}
        <View style={styles.avatarWrapper}>
          <Skeleton style={{ width: 48, height: 48, borderRadius: 24 }} />
        </View>

        <View style={styles.nameSection}>
          <Skeleton style={{ width: 100, height: 16, borderRadius: 4 }} />
          <Skeleton style={{ width: 160, height: 12, borderRadius: 4, marginTop: 4 }} />
        </View>

        {/* 一句話骨架 */}
        <View style={{ marginTop: 12, gap: 6 }}>
          <Skeleton style={{ width: '90%', height: 12, borderRadius: 4 }} />
          <Skeleton style={{ width: '80%', height: 12, borderRadius: 4 }} />
          <Skeleton style={{ width: '70%', height: 12, borderRadius: 4 }} />
        </View>

        {/* 標籤骨架 */}
        <View style={{ flexDirection: 'row', marginTop: 12, gap: 6 }}>
          <Skeleton style={{ width: 60, height: 22, borderRadius: 11 }} />
          <Skeleton style={{ width: 50, height: 22, borderRadius: 11 }} />
          <Skeleton style={{ width: 70, height: 22, borderRadius: 11 }} />
        </View>

        {/* CTA 骨架 */}
        <Skeleton style={{ width: '100%', height: 36, borderRadius: 8, marginTop: 16 }} />
      </View>
    </View>
  )
}

// ============================================
// 主組件
// ============================================

export function BiographySection() {
  const router = useRouter()
  const { status } = useAuthStore()
  const [biographies, setBiographies] = useState<Biography[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const hasFetched = useRef(false)

  const isLoggedIn = status === 'signIn'

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true

    async function fetchBiographies() {
      try {
        const response = await apiClient.get<{ success: boolean; data: Biography[] }>(
          '/biographies/featured',
          { params: { limit: 3 } }
        )
        if (response.data?.success && response.data.data) {
          setBiographies(response.data.data)
        }
      } catch (error) {
        console.error('[BiographySection] Failed to fetch featured biographies:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBiographies()
  }, [])

  const handleViewAll = () => {
    router.push('/biography?tab=people' as any)
  }

  const handleCreateStory = () => {
    router.push('/auth/register')
  }

  return (
    <YStack gap={SPACING.md} paddingHorizontal={SPACING[4]} paddingVertical={SPACING[8]}>
      {/* 標題區塊（置中，對齊 Web） */}
      <YStack alignItems="center" gap={4}>
        <Text variant="h3">寫紀錄</Text>
        <Text variant="small" color="textSubtle">
          建立你的攀岩人物誌，分享你的攀岩旅程
        </Text>
      </YStack>

      {/* 傳記列表 */}
      <YStack gap={SPACING.md}>
        {isLoading ? (
          <>
            <BiographySkeleton />
            <BiographySkeleton />
            <BiographySkeleton />
          </>
        ) : biographies.length === 0 ? (
          <Text
            variant="small"
            color="textSubtle"
            style={{ textAlign: 'center', paddingVertical: SPACING.lg }}
          >
            目前沒有精選傳記
          </Text>
        ) : (
          biographies.map((item, index) => (
            <BiographyCard key={item.id} item={item} index={index} />
          ))
        )}
      </YStack>

      {/* 雙重 CTA */}
      <YStack gap={SPACING.sm} style={{ marginTop: SPACING.sm }}>
        {!isLoggedIn && (
          <Button variant="primary" onPress={handleCreateStory} fullWidth style={styles.ctaAccent}>
            <Text style={styles.ctaAccentText}>建立我的人物誌</Text>
          </Button>
        )}
        <Button variant="outline" onPress={handleViewAll} fullWidth>
          <Text style={styles.ctaOutlineText}>認識更多小人物</Text>
        </Button>
      </YStack>
    </YStack>
  )
}

// ============================================
// 樣式
// ============================================

const COVER_ASPECT = 3 // width / height ratio (3:1)
const AVATAR_SIZE = 48
const AVATAR_OVERLAP = AVATAR_SIZE / 2

const styles = StyleSheet.create({
  // 卡片
  card: {
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: WB_COLORS[0],
    borderWidth: 1,
    borderColor: WB_COLORS[20],
    overflow: 'hidden',
  },

  // 封面
  coverContainer: {
    aspectRatio: COVER_ASPECT,
    width: '100%',
    backgroundColor: WB_COLORS[20],
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WB_COLORS[10],
  },
  coverGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
    // React Native 不支援 CSS gradient，用半透明黑色近似
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  coverSkeleton: {
    aspectRatio: COVER_ASPECT,
    width: '100%',
    borderRadius: 0,
  },

  // 內容
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  // 頭像
  avatarWrapper: {
    marginTop: -AVATAR_OVERLAP,
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 2,
    borderColor: WB_COLORS[0],
    overflow: 'hidden',
    backgroundColor: WB_COLORS[10],
    // 陰影
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // 姓名
  nameSection: {
    marginTop: 8,
    gap: 2,
  },
  nameText: {
    fontSize: 16,
    color: WB_COLORS[100],
  },

  // 一句話
  oneLinersContainer: {
    marginTop: 12,
    gap: 6,
  },
  oneLinerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  oneLinerQuestion: {
    fontSize: 12,
    color: WB_COLORS[60],
  },
  oneLinerAnswer: {
    fontSize: 12,
    color: WB_COLORS[90],
  },

  // 標籤
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 6,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
  },
  tagDefault: {
    backgroundColor: WB_COLORS[10],
  },
  tagCustom: {
    backgroundColor: 'rgba(255,231,12,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,231,12,0.3)',
  },
  tagText: {
    fontSize: 12,
  },
  tagTextDefault: {
    color: WB_COLORS[70],
  },
  tagTextCustom: {
    color: WB_COLORS[100],
  },

  // 卡片內 CTA
  cardCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    marginTop: 16,
    borderWidth: 1,
    borderColor: WB_COLORS[100],
    borderRadius: BORDER_RADIUS.md,
  },
  cardCtaText: {
    fontSize: 14,
    color: WB_COLORS[100],
    marginRight: 4,
  },

  // 底部 CTA
  ctaAccent: {
    backgroundColor: 'rgba(255,231,12,0.7)',
    borderColor: 'rgba(255,231,12,0.7)',
  },
  ctaAccentText: {
    fontSize: 15,
    fontWeight: '600',
    color: WB_COLORS[100],
  },
  ctaOutlineText: {
    fontSize: 15,
    fontWeight: '600',
    color: WB_COLORS[100],
  },
})

export default BiographySection
