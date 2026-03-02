import React, { useState } from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import { TrendingUp, Brain, Users, Wrench, Star, Check, ChevronRight } from 'lucide-react-native'
import type { LucideIcon } from 'lucide-react-native'
import { Text } from '../ui/Text'
import { Icon } from '../ui/Icon'
import CollapsibleSection from './CollapsibleSection'
import { AdvancedStories } from './types'
import { SEMANTIC_COLORS, WB_COLORS } from '@nobodyclimb/constants'

// Icon mapping
const ICON_MAP: Record<string, LucideIcon> = {
  TrendingUp,
  Brain,
  Users,
  Wrench,
  Star,
}

// 故事分類定義
const STORY_CATEGORIES = [
  {
    id: 'growth',
    title: 'A. 成長與突破',
    icon: 'TrendingUp',
    fields: [
      { key: 'memorable_moment', label: '難忘的時刻' },
      { key: 'biggest_challenge', label: '最大挑戰' },
      { key: 'breakthrough_story', label: '突破故事' },
      { key: 'first_outdoor', label: '第一次戶外攀岩' },
      { key: 'first_grade', label: '達成的第一個難度' },
      { key: 'frustrating_climb', label: '令人沮喪的攀登' },
    ],
  },
  {
    id: 'psychology',
    title: 'B. 心理與哲學',
    icon: 'Brain',
    fields: [
      { key: 'fear_management', label: '恐懼管理' },
      { key: 'climbing_lesson', label: '攀岩課程' },
      { key: 'failure_perspective', label: '失敗觀點' },
      { key: 'flow_moment', label: '心流時刻' },
      { key: 'life_balance', label: '生活平衡' },
      { key: 'unexpected_gain', label: '意外收穫' },
    ],
  },
  {
    id: 'community',
    title: 'C. 社群與連結',
    icon: 'Users',
    fields: [
      { key: 'climbing_mentor', label: '攀岩導師' },
      { key: 'climbing_partner', label: '攀岩夥伴' },
      { key: 'funny_moment', label: '有趣時刻' },
      { key: 'favorite_spot', label: '最愛地點' },
      { key: 'advice_to_group', label: '給社群的建議' },
      { key: 'climbing_space', label: '攀岩空間' },
    ],
  },
  {
    id: 'practical',
    title: 'D. 實用分享',
    icon: 'Wrench',
    fields: [
      { key: 'injury_recovery', label: '傷害恢復' },
      { key: 'memorable_route', label: '難忘路線' },
      { key: 'training_method', label: '訓練方法' },
      { key: 'effective_practice', label: '有效練習' },
      { key: 'technique_tip', label: '技術貼士' },
      { key: 'gear_choice', label: '裝備選擇' },
    ],
  },
  {
    id: 'dreams',
    title: 'E. 夢想與探索',
    icon: 'Star',
    fields: [
      { key: 'dream_climb', label: '夢想攀登' },
      { key: 'climbing_trip', label: '攀岩旅行' },
      { key: 'bucket_list_story', label: '人生清單故事' },
      { key: 'climbing_goal', label: '攀岩目標' },
      { key: 'climbing_style', label: '攀岩風格' },
      { key: 'climbing_inspiration', label: '攀岩靈感' },
    ],
  },
  {
    id: 'life',
    title: 'F. 生活整合',
    icon: 'Heart',
    fields: [
      { key: 'life_outside_climbing', label: '攀岩外的生活' },
    ],
  },
] as const

interface AdvancedStoriesSectionProps {
  advancedStories: AdvancedStories
  isEditing: boolean
  isMobile?: boolean
  onFieldPress: (field: string, label: string) => void
}

export default function AdvancedStoriesSection({
  advancedStories,
  isEditing,
  onFieldPress,
}: AdvancedStoriesSectionProps) {
  const getFieldValue = (key: string): string => {
    return advancedStories[key as keyof AdvancedStories] || ''
  }

  const getCategoryProgress = (categoryId: string) => {
    const category = STORY_CATEGORIES.find((c) => c.id === categoryId)
    if (!category) return { current: 0, total: 0 }

    const total = category.fields.length
    const current = category.fields.filter(
      (f) => getFieldValue(f.key).length > 0
    ).length

    return { current, total }
  }

  return (
    <View style={styles.container}>
      <Text variant="bodyBold" style={{ color: SEMANTIC_COLORS.textMain, marginBottom: 16 }}>
        進階故事
      </Text>
      <Text variant="caption" style={{ color: SEMANTIC_COLORS.textMuted, marginBottom: 24 }}>
        分享更多你的攀岩故事，讓其他人更了解你
      </Text>

      {STORY_CATEGORIES.map((category) => {
        const progress = getCategoryProgress(category.id)
        return (
          <View key={category.id} style={styles.categoryContainer}>
            <CollapsibleSection
              title={category.title}
              icon={<Icon icon={ICON_MAP[category.icon]} size="sm" color={SEMANTIC_COLORS.textSubtle} />}
              defaultExpanded={false}
              badge={
                <View style={styles.progressBadge}>
                  <Text variant="caption" style={{ color: SEMANTIC_COLORS.textMuted }}>
                    {progress.current}/{progress.total}
                  </Text>
                </View>
              }
            >
              <View style={styles.fieldList}>
                {category.fields.map((field) => {
                  const value = getFieldValue(field.key)
                  const hasValue = value.length > 0

                  return (
                    <Pressable
                      key={field.key}
                      style={styles.fieldItem}
                      onPress={() => isEditing && onFieldPress(field.key, field.label)}
                      disabled={!isEditing}
                    >
                      <View style={styles.fieldContent}>
                        <View style={styles.fieldHeader}>
                          <Text
                            variant="body"
                            style={{ color: SEMANTIC_COLORS.textMain }}
                          >
                            {field.label}
                          </Text>
                          {hasValue && (
                            <Icon
                              icon={Check}
                              size="xs"
                              color="#10B981"
                            />
                          )}
                        </View>
                        {hasValue && (
                          <Text
                            variant="caption"
                            numberOfLines={2}
                            style={{ color: SEMANTIC_COLORS.textMuted, marginTop: 4 }}
                          >
                            {value}
                          </Text>
                        )}
                      </View>
                      {isEditing && (
                        <Icon
                          icon={ChevronRight}
                          size="sm"
                          color={SEMANTIC_COLORS.textMuted}
                        />
                      )}
                    </Pressable>
                  )
                })}
              </View>
            </CollapsibleSection>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  progressBadge: {
    backgroundColor: WB_COLORS[10],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    marginLeft: 8,
  },
  fieldList: {
    gap: 8,
  },
  fieldItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: WB_COLORS[5],
    borderRadius: 8,
  },
  fieldContent: {
    flex: 1,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
})
