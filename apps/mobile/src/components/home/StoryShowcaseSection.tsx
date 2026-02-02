/**
 * StoryShowcaseSection 組件
 *
 * 故事展示區，對應 apps/web/src/components/home/story-showcase-section.tsx
 * 設計目標：讓用戶覺得「原來我也可以寫」
 */
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { StyleSheet, View, Pressable } from 'react-native'
import { YStack, XStack } from 'tamagui'
import { useRouter } from 'expo-router'
import { HandMetal, MapPin, Users, BookOpen } from 'lucide-react-native'

import { Text, Button, Spinner } from '@/components/ui'
import { FadeIn, SlideUp } from '@/components/animation'
import { SEMANTIC_COLORS, SPACING, BORDER_RADIUS, WB_COLORS } from '@nobodyclimb/constants'

interface FeaturedStory {
  content: string
  author: {
    slug: string
    displayName: string
  }
  reactions: {
    me_too: number
  }
}

interface CommunityStats {
  totalStories: number
  friendInvited: number
  topLocations: string[]
}

interface CommunityData {
  featuredStory?: FeaturedStory
  stats: CommunityStats
}

export function StoryShowcaseSection() {
  const router = useRouter()
  const [data, setData] = useState<CommunityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasFetched = useRef(false)

  const loadCommunityStats = useCallback(async () => {
    if (hasFetched.current) return
    hasFetched.current = true

    try {
      // TODO: 替換為實際的 API 端點
      const response = await fetch('https://api.nobodyclimb.cc/api/v1/stats/community')
      const result = await response.json()
      if (result.success && result.data) {
        setData(result.data)
      }
    } catch (err) {
      console.error('Failed to load community stats:', err)
      setError('載入社群統計時發生錯誤')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCommunityStats()
  }, [loadCommunityStats])

  const handleAuthorPress = (slug: string) => {
    router.push(`/biography/${slug}`)
  }

  const handleRegisterPress = () => {
    router.push('/auth/register')
  }

  // 如果沒有資料，不顯示此區塊
  if (!loading && !data?.featuredStory && !data?.stats.totalStories) {
    return null
  }

  return (
    <View style={styles.container}>
      <FadeIn>
        <YStack style={styles.content}>
          {/* 區塊標題 */}
          <View style={styles.header}>
            <Text style={styles.title}>
              他們也曾經覺得自己{'\n'}「沒什麼特別」
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <Spinner size="md" />
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            <SlideUp delay={100}>
              {/* 精選故事引言 */}
              {data?.featuredStory && (
                <View style={styles.quoteCard}>
                  <Text style={styles.quoteText}>
                    「{data.featuredStory.content}」
                  </Text>
                  <XStack
                    justifyContent="space-between"
                    alignItems="center"
                    marginTop={SPACING[3]}
                  >
                    <Pressable
                      onPress={() => handleAuthorPress(data.featuredStory!.author.slug)}
                    >
                      <Text style={styles.authorText}>
                        — @{data.featuredStory.author.displayName}
                      </Text>
                    </Pressable>
                    <XStack alignItems="center" gap={4}>
                      <HandMetal size={16} color="#F59E0B" />
                      <Text style={styles.reactionText}>
                        我也是 {data.featuredStory.reactions.me_too}
                      </Text>
                    </XStack>
                  </XStack>
                </View>
              )}

              {/* 分隔線 */}
              <View style={styles.divider} />

              {/* 社群統計 */}
              <YStack gap={SPACING[3]}>
                <Text style={styles.statsTitle}>這裡的岩友們</Text>
                <YStack gap={SPACING[2]}>
                  {data?.stats.friendInvited != null && data.stats.friendInvited > 0 && (
                    <XStack alignItems="center" gap={SPACING[2]}>
                      <Users size={16} color={SEMANTIC_COLORS.textMuted} />
                      <Text style={styles.statsText}>
                        {data.stats.friendInvited} 人被朋友拉進攀岩坑
                      </Text>
                    </XStack>
                  )}
                  {data?.stats.topLocations && data.stats.topLocations.length > 0 && (
                    <XStack alignItems="center" gap={SPACING[2]}>
                      <MapPin size={16} color={SEMANTIC_COLORS.textMuted} />
                      <Text style={styles.statsText}>
                        最常出沒：{data.stats.topLocations.join('、')}
                      </Text>
                    </XStack>
                  )}
                  {data?.stats.totalStories && data.stats.totalStories > 0 && (
                    <XStack alignItems="center" gap={SPACING[2]}>
                      <BookOpen size={16} color={SEMANTIC_COLORS.textMuted} />
                      <Text style={styles.statsText}>
                        {data.stats.totalStories} 個攀岩故事正在累積中
                      </Text>
                    </XStack>
                  )}
                </YStack>
              </YStack>

              {/* CTA 按鈕 */}
              <View style={styles.ctaContainer}>
                <Button
                  variant="primary"
                  size="lg"
                  onPress={handleRegisterPress}
                >
                  我也想分享我的故事
                </Button>
              </View>
            </SlideUp>
          )}
        </YStack>
      </FadeIn>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingVertical: SPACING[8],
  },
  content: {
    paddingHorizontal: SPACING[4],
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    marginBottom: SPACING[6],
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: SEMANTIC_COLORS.textMain,
    textAlign: 'center',
    lineHeight: 34,
  },
  loadingContainer: {
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: SEMANTIC_COLORS.textMuted,
  },
  quoteCard: {
    backgroundColor: WB_COLORS[10],
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING[6],
    marginBottom: SPACING[6],
  },
  quoteText: {
    fontSize: 18,
    lineHeight: 28,
    color: SEMANTIC_COLORS.textMain,
  },
  authorText: {
    fontSize: 14,
    color: SEMANTIC_COLORS.textSubtle,
  },
  reactionText: {
    fontSize: 14,
    color: '#F59E0B',
  },
  divider: {
    height: 1,
    backgroundColor: WB_COLORS[20],
    marginBottom: SPACING[6],
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: SEMANTIC_COLORS.textMain,
    marginBottom: SPACING[2],
  },
  statsText: {
    fontSize: 14,
    color: SEMANTIC_COLORS.textSubtle,
  },
  ctaContainer: {
    marginTop: SPACING[6],
    alignItems: 'center',
  },
})

export default StoryShowcaseSection
