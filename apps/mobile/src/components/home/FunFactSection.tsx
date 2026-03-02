/**
 * FunFactSection 組件
 *
 * 趣味冷知識區塊，對應 apps/web/src/components/home/fun-fact-section.tsx
 */
import React, { useState, useEffect, useCallback } from 'react'
import { StyleSheet, View, Pressable, Linking } from 'react-native'
import { YStack, XStack } from 'tamagui'
import { Lightbulb, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated'

import { Text, Spinner } from '@/components/ui'
import { FadeIn } from '@/components/animation'
import { SEMANTIC_COLORS, SPACING, BORDER_RADIUS, BRAND_YELLOW, DURATION } from '@nobodyclimb/constants'
import { springConfigStandard, EASING } from '@/theme/animations'

interface FunFact {
  id: string
  question: string
  answer: string
  detail: string
  category: string
  source?: string
  link?: {
    href: string
    text: string
  }
  tags?: string[]
}

interface FunFactsData {
  featured?: string
  facts: FunFact[]
  meta: {
    total: number
    lastUpdated: string
    categories: Record<string, string>
  }
}

// 每週七天對應的類別
const DAILY_CATEGORIES = [
  'taiwan',      // 週日
  'record',      // 週一
  'history',     // 週二
  'technique',   // 週三
  'gear',        // 週四
  'culture',     // 週五
  'competition', // 週六
] as const

// 類別顯示名稱
const CATEGORY_LABELS: Record<string, string> = {
  taiwan: '台灣攀岩',
  record: '世界紀錄',
  history: '攀岩歷史',
  technique: '技術知識',
  gear: '裝備知識',
  culture: '攀岩文化',
  competition: '競技攀岩',
}

// 根據日期生成穩定的偽隨機數
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// 判斷是否為有效的 URL
function isValidUrl(str: string): boolean {
  return str.startsWith('http://') || str.startsWith('https://')
}

export function FunFactSection() {
  const [isRevealed, setIsRevealed] = useState(false)
  const [currentFact, setCurrentFact] = useState<FunFact | null>(null)
  const [categoryLabel, setCategoryLabel] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  // 動畫值
  const contentHeight = useSharedValue(0)
  const contentOpacity = useSharedValue(0)

  useEffect(() => {
    async function loadFunFacts() {
      try {
        // TODO: 替換為實際的 API 端點
        const response = await fetch('https://nobodyclimb.cc/data/fun-facts.json')
        const data: FunFactsData = await response.json()

        if (data.facts && data.facts.length > 0) {
          // 優先檢查是否有指定的 featured 題目
          if (data.featured) {
            const featuredFact = data.facts.find((fact) => fact.id === data.featured)
            if (featuredFact) {
              setCurrentFact(featuredFact)
              setCategoryLabel(CATEGORY_LABELS[featuredFact.category] || featuredFact.category)
              setIsLoading(false)
              return
            }
          }

          // 使用每日類別邏輯
          const today = new Date()
          const dayOfWeek = today.getDay()
          const todayCategory = DAILY_CATEGORIES[dayOfWeek]

          const categoryFacts = data.facts.filter((fact) => fact.category === todayCategory)

          if (categoryFacts.length > 0) {
            const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
            const index = Math.floor(seededRandom(dateSeed) * categoryFacts.length)
            setCurrentFact(categoryFacts[index])
            setCategoryLabel(CATEGORY_LABELS[todayCategory] || todayCategory)
          }
        }
      } catch (error) {
        console.error('Failed to load fun facts:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadFunFacts()
  }, [])

  useEffect(() => {
    if (isRevealed) {
      contentHeight.value = withSpring(1, springConfigStandard)
      contentOpacity.value = withTiming(1, { duration: DURATION.normal, easing: EASING.standard })
    } else {
      contentHeight.value = withTiming(0, { duration: DURATION.fast })
      contentOpacity.value = withTiming(0, { duration: DURATION.fast })
    }
  }, [isRevealed, contentHeight, contentOpacity])

  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    maxHeight: contentHeight.value * 300,
  }))

  const handleToggle = useCallback(() => {
    setIsRevealed((prev) => !prev)
  }, [])

  const handleLinkPress = useCallback(async (url: string) => {
    if (await Linking.canOpenURL(url)) {
      await Linking.openURL(url)
    }
  }, [])

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <XStack alignItems="center" gap={SPACING[3]}>
            <View style={styles.iconContainer}>
              <View style={styles.iconPlaceholder} />
            </View>
            <YStack flex={1} gap={SPACING[1]}>
              <View style={[styles.placeholder, { width: 60 }]} />
              <View style={[styles.placeholder, { width: '80%' }]} />
            </YStack>
          </XStack>
        </View>
      </View>
    )
  }

  if (!currentFact) {
    return null
  }

  return (
    <FadeIn>
      <View style={styles.container}>
        <Pressable onPress={handleToggle} style={styles.card}>
          {/* 標題區 */}
          <XStack alignItems="center" justifyContent="space-between">
            <XStack alignItems="center" gap={SPACING[3]} flex={1}>
              <View style={styles.iconContainer}>
                <Lightbulb size={20} color={SEMANTIC_COLORS.textMain} />
              </View>
              <YStack flex={1}>
                <XStack alignItems="center" gap={SPACING[2]}>
                  <Text style={styles.label}>你知道嗎？</Text>
                  {categoryLabel && (
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{categoryLabel}</Text>
                    </View>
                  )}
                </XStack>
                <Text style={styles.question} numberOfLines={2}>
                  {currentFact.question}
                </Text>
              </YStack>
            </XStack>
            <View style={styles.toggleButton}>
              {isRevealed ? (
                <ChevronUp size={16} color={SEMANTIC_COLORS.textMain} />
              ) : (
                <ChevronDown size={16} color={SEMANTIC_COLORS.textMain} />
              )}
            </View>
          </XStack>

          {/* 答案區 */}
          <Animated.View style={[styles.answerContainer, animatedContentStyle]}>
            <View style={styles.answerDivider} />
            <YStack gap={SPACING[2]}>
              <Text style={styles.answer}>{currentFact.answer}</Text>
              <Text style={styles.detail}>{currentFact.detail}</Text>

              {currentFact.source && isValidUrl(currentFact.source) && (
                <Pressable
                  onPress={() => handleLinkPress(currentFact.source!)}
                  style={styles.sourceLink}
                >
                  <Text style={styles.sourceLinkText}>了解更多</Text>
                  <ExternalLink size={12} color={SEMANTIC_COLORS.textMuted} />
                </Pressable>
              )}

              {currentFact.link && (
                <Pressable
                  onPress={() => handleLinkPress(currentFact.link!.href)}
                  style={styles.ctaButton}
                >
                  <Text style={styles.ctaButtonText}>{currentFact.link.text}</Text>
                  <ExternalLink size={14} color={SEMANTIC_COLORS.textMain} />
                </Pressable>
              )}
            </YStack>
          </Animated.View>
        </Pressable>
      </View>
    </FadeIn>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING[4],
    paddingHorizontal: SPACING[4],
    backgroundColor: `${BRAND_YELLOW[100]}20`,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING[4],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${BRAND_YELLOW[100]}40`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: `${BRAND_YELLOW[100]}40`,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: SEMANTIC_COLORS.textSubtle,
    letterSpacing: 0.5,
  },
  categoryBadge: {
    backgroundColor: `${BRAND_YELLOW[100]}50`,
    paddingHorizontal: SPACING[2],
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '500',
    color: SEMANTIC_COLORS.textMain,
  },
  question: {
    fontSize: 14,
    fontWeight: '500',
    color: SEMANTIC_COLORS.textMain,
    marginTop: 2,
  },
  toggleButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${BRAND_YELLOW[100]}40`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerContainer: {
    overflow: 'hidden',
  },
  answerDivider: {
    height: 1,
    backgroundColor: `${BRAND_YELLOW[100]}40`,
    marginTop: SPACING[4],
    marginBottom: SPACING[4],
  },
  answer: {
    fontSize: 18,
    fontWeight: '700',
    color: SEMANTIC_COLORS.textMain,
  },
  detail: {
    fontSize: 14,
    color: SEMANTIC_COLORS.textSubtle,
    lineHeight: 20,
  },
  sourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING[2],
  },
  sourceLinkText: {
    fontSize: 12,
    color: SEMANTIC_COLORS.textMuted,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[1.5],
    backgroundColor: `${BRAND_YELLOW[100]}90`,
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[4],
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING[3],
    alignSelf: 'flex-start',
  },
  ctaButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: SEMANTIC_COLORS.textMain,
  },
  placeholder: {
    height: 12,
    borderRadius: 4,
    backgroundColor: `${BRAND_YELLOW[100]}30`,
  },
})

export default FunFactSection
