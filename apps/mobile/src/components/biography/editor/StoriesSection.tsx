import React, { useState, useMemo } from 'react'
import { View, Pressable } from 'react-native'
import { YStack, XStack, Text } from 'tamagui'
import {
  BookOpen,
  Clock,
  ChevronRight,
  ChevronDown,
  Check,
  Lightbulb,
  Sparkles,
  TrendingUp,
  Brain,
  Users,
  Wrench,
  Compass,
  Palette,
  Shuffle,
} from 'lucide-react-native'
import type { LucideIcon } from 'lucide-react-native'
import { SEMANTIC_COLORS, COLORS } from '@nobodyclimb/constants'
import type { StoryQuestion, Story, StoryCategory } from '@nobodyclimb/types'
import { RandomRecommend } from './RandomRecommend'

interface StoriesSectionProps {
  /** 故事問題列表，按類別分組 */
  questionsByCategory: Record<StoryCategory, StoryQuestion[]>
  /** 已填寫的故事 */
  stories: Story[]
  /** 故事點擊回調 */
  onStoryClick: (questionId: string) => void
  /** 新增自訂問題回調 */
  onAddCustomQuestion?: (category: StoryCategory) => void
  /** 是否顯示隨機推薦 */
  showRandomRecommend?: boolean
}

interface CategoryMeta {
  label: string
  icon: LucideIcon
  description: string
}

const categoryMeta: Record<StoryCategory, CategoryMeta> = {
  growth: {
    label: '成長軌跡',
    icon: TrendingUp,
    description: '你的攀岩旅程',
  },
  psychology: {
    label: '心理層面',
    icon: Brain,
    description: '攀岩中的心理感受',
  },
  community: {
    label: '社群連結',
    icon: Users,
    description: '與岩友的故事',
  },
  practical: {
    label: '實用經驗',
    icon: Wrench,
    description: '裝備、訓練、技巧',
  },
  dreams: {
    label: '願望與目標',
    icon: Compass,
    description: '未來的攀岩計畫',
  },
  life: {
    label: '人生連結',
    icon: Palette,
    description: '攀岩與生活',
  },
}

/**
 * 故事編輯區塊
 *
 * 用於編輯用戶的故事內容
 */
export function StoriesSection({
  questionsByCategory,
  stories,
  onStoryClick,
  onAddCustomQuestion,
  showRandomRecommend = true,
}: StoriesSectionProps) {
  const [randomRecommendVisible, setRandomRecommendVisible] = useState(showRandomRecommend)
  // 預設所有分類都是收合的
  const [expandedCategories, setExpandedCategories] = useState<Set<StoryCategory>>(new Set())

  const toggleCategory = (category: StoryCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  const getStory = (questionId: string): Story | undefined => {
    return stories.find((s) => s.question_id === questionId)
  }

  const totalQuestions = Object.values(questionsByCategory).flat().length
  const filledCount = stories.filter((s) => s.content?.trim()).length

  // 計算未填寫的問題
  const unfilledQuestions = useMemo(() => {
    return Object.values(questionsByCategory)
      .flat()
      .filter((q) => !stories.some((s) => s.question_id === q.id && s.content?.trim()))
  }, [questionsByCategory, stories])

  return (
    <YStack gap="$6">
      {/* Header */}
      <XStack alignItems="center" justifyContent="space-between">
        <XStack alignItems="center" gap="$2">
          <BookOpen size={18} color={SEMANTIC_COLORS.textSubtle} />
          <Text fontSize={16} fontWeight="600" color={SEMANTIC_COLORS.textMain}>
            深度故事
          </Text>
          <XStack
            alignItems="center"
            gap="$1"
            paddingHorizontal="$2"
            paddingVertical="$1"
            backgroundColor={COLORS.background.subtle}
            borderRadius="$6"
          >
            <Clock size={12} color={COLORS.text.muted} />
            <Text fontSize={12} color={COLORS.text.muted}>
              5 分鐘以上
            </Text>
          </XStack>
        </XStack>
        <Text fontSize={14} color={COLORS.text.muted}>
          {filledCount}/{totalQuestions} 已填寫
        </Text>
      </XStack>

      <XStack alignItems="center" justifyContent="space-between">
        <XStack alignItems="center" gap="$1" flex={1}>
          <Lightbulb size={14} color={COLORS.text.muted} />
          <Text fontSize={14} color={COLORS.text.muted} flex={1}>
            挑一兩個有感覺的題目寫就好，這部分可以慢慢補
          </Text>
        </XStack>
        {!randomRecommendVisible && unfilledQuestions.length > 0 && (
          <Pressable
            onPress={() => setRandomRecommendVisible(true)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderWidth: 1,
              borderColor: COLORS.brand.dark,
              borderRadius: 8,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Shuffle size={14} color={COLORS.brand.dark} />
            <Text fontSize={14} color={COLORS.brand.dark}>
              隨機推薦一題
            </Text>
          </Pressable>
        )}
      </XStack>

      {/* Random Recommend */}
      {randomRecommendVisible && unfilledQuestions.length > 0 && (
        <RandomRecommend
          unfilledQuestions={unfilledQuestions}
          onQuestionClick={(questionId) => onStoryClick(questionId)}
          onClose={() => setRandomRecommendVisible(false)}
        />
      )}

      {/* Categories */}
      <YStack gap="$4">
        {(Object.entries(questionsByCategory) as [StoryCategory, StoryQuestion[]][]).map(
          ([category, questions]) => {
            const meta = categoryMeta[category]
            const Icon = meta.icon
            const categoryFilled = questions.filter((q) =>
              stories.some((s) => s.question_id === q.id && s.content?.trim())
            ).length
            const isExpanded = expandedCategories.has(category)

            return (
              <View
                key={category}
                style={{
                  borderWidth: 1,
                  borderColor: COLORS.border.light,
                  borderRadius: 12,
                  overflow: 'hidden',
                }}
              >
                {/* Category Header - 可點擊展開/收合 */}
                <Pressable
                  onPress={() => toggleCategory(category)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 16,
                    backgroundColor: pressed ? COLORS.background.muted : COLORS.background.subtle,
                  })}
                >
                  <XStack alignItems="center" gap="$2">
                    <ChevronDown
                      size={18}
                      color={COLORS.text.muted}
                      style={{
                        transform: [{ rotate: isExpanded ? '0deg' : '-90deg' }],
                      }}
                    />
                    <Icon size={20} color={SEMANTIC_COLORS.textSubtle} />
                    <View>
                      <Text fontSize={14} fontWeight="500" color={SEMANTIC_COLORS.textMain}>
                        {meta.label}
                      </Text>
                      <Text fontSize={12} color={COLORS.text.muted}>
                        {meta.description}
                      </Text>
                    </View>
                  </XStack>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 12,
                      backgroundColor:
                        categoryFilled > 0 ? `${COLORS.brand.accent}33` : COLORS.background.muted,
                    }}
                  >
                    <Text
                      fontSize={13}
                      color={categoryFilled > 0 ? SEMANTIC_COLORS.textMain : COLORS.text.muted}
                    >
                      {categoryFilled}/{questions.length}
                    </Text>
                  </View>
                </Pressable>

                {/* Questions - 只有展開時顯示 */}
                {isExpanded && (
                  <YStack>
                    {questions.map((question, index) => {
                      const story = getStory(question.id)
                      const isFilled = !!story?.content?.trim()

                      return (
                        <Pressable
                          key={question.id}
                          onPress={() => onStoryClick(question.id)}
                          style={({ pressed }) => ({
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 12,
                            padding: 16,
                            backgroundColor: pressed ? COLORS.background.subtle : 'transparent',
                            borderTopWidth: index === 0 ? 0 : 1,
                            borderTopColor: COLORS.background.muted,
                          })}
                        >
                          {/* Status Icon */}
                          <View
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 10,
                              backgroundColor: isFilled ? COLORS.brand.accent : 'transparent',
                              borderWidth: isFilled ? 0 : 2,
                              borderColor: COLORS.border.default,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {isFilled && <Check size={12} color={COLORS.brand.dark} />}
                          </View>

                          {/* Question */}
                          <View style={{ flex: 1 }}>
                            <XStack alignItems="center" gap="$1">
                              {question.source === 'user' && (
                                <Sparkles size={14} color={COLORS.brand.accent} />
                              )}
                              <Text
                                fontSize={14}
                                fontWeight="500"
                                color={
                                  isFilled ? SEMANTIC_COLORS.textMain : SEMANTIC_COLORS.textSubtle
                                }
                                numberOfLines={2}
                              >
                                {question.title}
                              </Text>
                            </XStack>
                            {isFilled && story?.content && (
                              <Text
                                fontSize={13}
                                color={COLORS.text.muted}
                                marginTop="$1"
                                numberOfLines={1}
                              >
                                {story.content}
                              </Text>
                            )}
                          </View>

                          {/* Action */}
                          <XStack alignItems="center" gap="$2">
                            <View
                              style={{
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 12,
                                backgroundColor: isFilled
                                  ? `${COLORS.brand.accent}1A`
                                  : COLORS.background.subtle,
                              }}
                            >
                              <Text
                                fontSize={12}
                                fontWeight="500"
                                color={
                                  isFilled ? SEMANTIC_COLORS.textMain : COLORS.text.muted
                                }
                              >
                                {isFilled ? '編輯' : '開始寫'}
                              </Text>
                            </View>
                            <ChevronRight size={16} color={COLORS.border.default} />
                          </XStack>
                        </Pressable>
                      )
                    })}

                    {/* Add Custom Question */}
                    {onAddCustomQuestion && (
                      <Pressable
                        onPress={() => onAddCustomQuestion(category)}
                        style={({ pressed }) => ({
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                          padding: 16,
                          borderTopWidth: 1,
                          borderTopColor: COLORS.background.muted,
                          backgroundColor: pressed ? COLORS.background.subtle : 'transparent',
                        })}
                      >
                        <Sparkles size={16} color={COLORS.text.muted} />
                        <Text fontSize={14} color={COLORS.text.muted}>
                          自訂問題
                        </Text>
                      </Pressable>
                    )}
                  </YStack>
                )}
              </View>
            )
          }
        )}
      </YStack>
    </YStack>
  )
}

export default StoriesSection
