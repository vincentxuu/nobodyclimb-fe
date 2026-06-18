/**
 * Profile Setup - 標籤選擇頁面
 *
 * 對應 apps/web/src/app/auth/profile-setup/tags/page.tsx
 */

import { RADIUS, SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import type { TagDimension } from '@nobodyclimb/types'
import { useRouter } from 'expo-router'
import {
  Check,
  ChevronDown,
  Clock,
  Dumbbell,
  Footprints,
  Hand,
  HeartPulse,
  type LucideIcon,
  MapPin,
  Music,
  Sparkles,
  Tag,
  Target,
  Tent,
  Users,
} from 'lucide-react-native'
import { useCallback, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { XStack, YStack } from 'tamagui'
import { Button, ProgressBar, Text } from '@/components/ui'
import biographyService from '@/lib/biographyService'
import { SYSTEM_TAG_DIMENSION_LIST, SYSTEM_TAG_DIMENSIONS } from '@/lib/constants/biography-tags'

const REGISTRATION_TAG_DIMENSIONS: string[] = [
  SYSTEM_TAG_DIMENSIONS.STYLE_CULT,
  SYSTEM_TAG_DIMENSIONS.INJURY_BADGE,
  SYSTEM_TAG_DIMENSIONS.SOCIAL_TYPE,
]

const TAG_DIMENSIONS = SYSTEM_TAG_DIMENSION_LIST.filter((dimension) =>
  REGISTRATION_TAG_DIMENSIONS.includes(dimension.id)
)

const iconMap: Record<string, LucideIcon> = {
  Sparkles,
  HeartPulse,
  Footprints,
  Clock,
  Tent,
  Music,
  Target,
  Users,
  Hand,
  Dumbbell,
  MapPin,
}

export default function TagsScreen() {
  const router = useRouter()

  const [selections, setSelections] = useState<Record<string, string[]>>({})
  const [expandedDimensions, setExpandedDimensions] = useState<Set<string>>(
    new Set(TAG_DIMENSIONS.map((dimension) => dimension.id))
  )
  const [isLoading, setIsLoading] = useState(false)

  const selectedCount = Object.values(selections).reduce((sum, ids) => sum + ids.length, 0)

  // 處理標籤選擇
  const handleTagToggle = useCallback((dimension: TagDimension, tagId: string) => {
    setSelections((prev) => {
      const current = prev[dimension.id] || []

      if (dimension.selection_mode === 'single') {
        return {
          ...prev,
          [dimension.id]: current.includes(tagId) ? [] : [tagId],
        }
      }

      return {
        ...prev,
        [dimension.id]: current.includes(tagId)
          ? current.filter((id) => id !== tagId)
          : [...current, tagId],
      }
    })
  }, [])

  const toggleDimension = useCallback((dimensionId: string) => {
    setExpandedDimensions((prev) => {
      const next = new Set(prev)
      if (next.has(dimensionId)) {
        next.delete(dimensionId)
      } else {
        next.add(dimensionId)
      }
      return next
    })
  }, [])

  // 處理下一步
  const handleNext = useCallback(async () => {
    setIsLoading(true)
    try {
      const tagsData = Object.values(selections)
        .flat()
        .map((tagId) => ({
          tag_id: tagId,
          source: 'system' as const,
        }))

      if (tagsData.length > 0) {
        const response = await biographyService.updateRegistrationBiography({
          tags_data: JSON.stringify(tagsData),
        })

        if (!response.success) {
          throw new Error(response.error || '儲存標籤失敗')
        }
      }
      router.push('/auth/profile-setup/self-intro')
    } catch (error) {
      console.error('儲存失敗', error)
      const message = error instanceof Error ? error.message : '請稍後再試'
      Alert.alert('儲存失敗', message)
    } finally {
      setIsLoading(false)
    }
  }, [router, selections])

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <YStack gap={SPACING.lg}>
            {/* 進度條 */}
            <YStack gap={SPACING.xs}>
              <XStack justifyContent="space-between">
                <Text variant="small" color="textSubtle">
                  步驟 2/4
                </Text>
                <Text variant="small" color="textSubtle">
                  攀岩興趣
                </Text>
              </XStack>
              <ProgressBar value={50} />
            </YStack>

            {/* 標題 */}
            <YStack gap={SPACING.xs}>
              <Text variant="h2">選擇你的攀岩標籤</Text>
              <Text color="textSubtle">用幾個小標籤，讓其他岩友更快認識你</Text>
            </YStack>

            {/* 標籤選擇 */}
            <YStack gap={SPACING.md}>
              {TAG_DIMENSIONS.map((dimension) => {
                const selectedIds = selections[dimension.id] || []
                const isExpanded = expandedDimensions.has(dimension.id)
                const Icon = iconMap[dimension.icon ?? ''] ?? Tag

                return (
                  <View key={dimension.id} style={styles.dimensionCard}>
                    <Pressable
                      onPress={() => toggleDimension(dimension.id)}
                      style={styles.dimensionHeader}
                      accessibilityRole="button"
                      accessibilityLabel={`${isExpanded ? '收合' : '展開'}${dimension.name}`}
                    >
                      <XStack alignItems="center" gap={SPACING.sm} flex={1}>
                        <Icon size={20} color={SEMANTIC_COLORS.textMain} />
                        <YStack flex={1} gap={2}>
                          <XStack alignItems="center" gap={SPACING.xs}>
                            <Text fontWeight="600">{dimension.name}</Text>
                            {selectedIds.length > 0 && (
                              <View style={styles.selectedBadge}>
                                <Text variant="caption" style={styles.selectedBadgeText}>
                                  {selectedIds.length}
                                </Text>
                              </View>
                            )}
                          </XStack>
                          <Text variant="small" color="textMuted">
                            {dimension.description}
                            {dimension.selection_mode === 'multiple' ? '（可複選）' : '（單選）'}
                          </Text>
                        </YStack>
                      </XStack>
                      <ChevronDown
                        size={18}
                        color={SEMANTIC_COLORS.textMuted}
                        style={isExpanded ? styles.chevronExpanded : undefined}
                      />
                    </Pressable>

                    {isExpanded && (
                      <XStack flexWrap="wrap" gap={SPACING.sm} style={styles.tagList}>
                        {dimension.options.map((tag) => {
                          const isSelected = selectedIds.includes(tag.id)
                          return (
                            <Pressable
                              key={tag.id}
                              onPress={() => handleTagToggle(dimension, tag.id)}
                              style={[styles.tag, isSelected && styles.tagSelected]}
                              accessibilityRole="button"
                              accessibilityState={{ selected: isSelected }}
                            >
                              {isSelected && <Check size={14} color="#FFFFFF" />}
                              <YStack gap={2} flexShrink={1}>
                                <Text
                                  style={[styles.tagText, isSelected && styles.tagTextSelected]}
                                >
                                  {tag.label}
                                </Text>
                                <Text
                                  variant="caption"
                                  style={[
                                    styles.tagDescription,
                                    isSelected && styles.tagDescriptionSelected,
                                  ]}
                                >
                                  {tag.description}
                                </Text>
                              </YStack>
                            </Pressable>
                          )
                        })}
                      </XStack>
                    )}
                  </View>
                )
              })}
            </YStack>

            {/* 已選數量 */}
            <Text variant="small" color="textSubtle">
              已選擇 {selectedCount} 個標籤
            </Text>

            {/* 按鈕 */}
            <YStack gap={SPACING.sm} marginTop={SPACING.lg}>
              <Button
                variant="primary"
                onPress={handleNext}
                disabled={isLoading}
                style={styles.nextButton}
              >
                <Text style={styles.buttonText}>{isLoading ? '處理中...' : '下一步'}</Text>
              </Button>
              <Button
                variant="ghost"
                onPress={() => router.push('/auth/profile-setup/self-intro')}
                style={styles.skipButton}
              >
                <Text color="textSubtle">跳過此步驟</Text>
              </Button>
            </YStack>
          </YStack>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SEMANTIC_COLORS.pageBg,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.lg,
  },
  dimensionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  dimensionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: '#F9FAFB',
  },
  selectedBadge: {
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: SEMANTIC_COLORS.textMain,
  },
  selectedBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  chevronExpanded: {
    transform: [{ rotate: '180deg' }],
  },
  tagList: {
    padding: SPACING.md,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    maxWidth: '100%',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tagSelected: {
    backgroundColor: SEMANTIC_COLORS.textMain,
    borderColor: SEMANTIC_COLORS.textMain,
  },
  tagText: {
    fontSize: 14,
    color: SEMANTIC_COLORS.textMain,
    fontWeight: '600',
  },
  tagTextSelected: {
    color: '#FFFFFF',
  },
  tagDescription: {
    color: SEMANTIC_COLORS.textMuted,
  },
  tagDescriptionSelected: {
    color: '#F5F5F5',
  },
  nextButton: {
    width: '100%',
    height: 44,
  },
  skipButton: {
    width: '100%',
    height: 44,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
})
