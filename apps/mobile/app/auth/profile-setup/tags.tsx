/**
 * Profile Setup - 標籤選擇頁面
 *
 * 對應 apps/web/src/app/auth/profile-setup/tags/page.tsx
 */
import React, { useState, useCallback } from 'react'
import { StyleSheet, Pressable, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { YStack, XStack } from 'tamagui'
import { Check } from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'

import { Text, Button, ProgressBar } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

// 興趣標籤選項
const TAG_OPTIONS = [
  { id: 'bouldering', label: '抱石' },
  { id: 'lead', label: '先鋒' },
  { id: 'top-rope', label: '上方確保' },
  { id: 'trad', label: '傳統攀岩' },
  { id: 'sport', label: '運動攀登' },
  { id: 'outdoor', label: '戶外攀岩' },
  { id: 'indoor', label: '室內攀岩' },
  { id: 'competition', label: '競技比賽' },
  { id: 'beginner', label: '新手' },
  { id: 'intermediate', label: '進階' },
  { id: 'advanced', label: '高階' },
  { id: 'training', label: '訓練' },
]

export default function TagsScreen() {
  const router = useRouter()

  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // 處理標籤選擇
  const handleTagToggle = useCallback((tagId: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tagId)) {
        return prev.filter((id) => id !== tagId)
      }
      if (prev.length >= 5) {
        return prev // 最多選擇 5 個
      }
      return [...prev, tagId]
    })
  }, [])

  // 處理下一步
  const handleNext = useCallback(async () => {
    setIsLoading(true)
    try {
      // TODO: 儲存標籤到後端
      router.push('/auth/profile-setup/self-intro')
    } catch (error) {
      console.error('儲存失敗', error)
    } finally {
      setIsLoading(false)
    }
  }, [router])

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
              <Text variant="h2">您對什麼類型的攀岩感興趣？</Text>
              <Text color="textSubtle">
                選擇最多 5 個標籤，幫助我們推薦適合您的內容
              </Text>
            </YStack>

            {/* 標籤選擇 */}
            <XStack flexWrap="wrap" gap={SPACING.sm}>
              {TAG_OPTIONS.map((tag) => {
                const isSelected = selectedTags.includes(tag.id)
                return (
                  <Pressable
                    key={tag.id}
                    onPress={() => handleTagToggle(tag.id)}
                    style={[
                      styles.tag,
                      isSelected && styles.tagSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        isSelected && styles.tagTextSelected,
                      ]}
                    >
                      {tag.label}
                    </Text>
                    {isSelected && (
                      <Check size={14} color="#FFFFFF" />
                    )}
                  </Pressable>
                )
              })}
            </XStack>

            {/* 已選數量 */}
            <Text variant="small" color="textSubtle">
              已選擇 {selectedTags.length}/5
            </Text>

            {/* 按鈕 */}
            <YStack gap={SPACING.sm} marginTop={SPACING.lg}>
              <Button
                variant="primary"
                onPress={handleNext}
                disabled={isLoading}
                style={styles.nextButton}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? '處理中...' : '下一步'}
                </Text>
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
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tagSelected: {
    backgroundColor: SEMANTIC_COLORS.textMain,
    borderColor: SEMANTIC_COLORS.textMain,
  },
  tagText: {
    fontSize: 14,
    color: SEMANTIC_COLORS.textMain,
  },
  tagTextSelected: {
    color: '#FFFFFF',
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
