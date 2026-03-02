/**
 * QuickFactsSection 組件
 *
 * 快速了解區塊，對應 apps/web/src/components/biography/profile/QuickFactsSection.tsx
 */
import React, { useState, useMemo } from 'react'
import { StyleSheet, View, Pressable } from 'react-native'
import { Calendar, MapPin, Activity, ChevronDown, ChevronUp, Sparkles } from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'

import { Text, Card } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

// 類型定義
interface BiographyV2 {
  id: string
  name: string
  climbing_start_year?: number
  frequent_locations?: string[]
  favorite_route_types?: string[]
  tags?: Array<{ tag_id: string; source?: string }>
  custom_tags?: Array<{ id: string; label: string }>
  custom_dimensions?: Array<{ options: Array<{ id: string; label: string }> }>
}

interface QuickFactsSectionProps {
  person: BiographyV2 | null
  /** 標籤最多顯示數量 */
  tagLimit?: number
}

/**
 * Quick Facts - 快速了解
 * 整合基本資訊卡片與關鍵字標籤
 */
export function QuickFactsSection({ person, tagLimit = 8 }: QuickFactsSectionProps) {
  const [showAllTags, setShowAllTags] = useState(false)

  // 計算攀岩年資
  const climbingYears = useMemo(() => {
    if (!person?.climbing_start_year) return null
    const currentYear = new Date().getFullYear()
    return currentYear - person.climbing_start_year
  }, [person?.climbing_start_year])

  // 處理常出沒地點
  const locations = useMemo(() => {
    if (!person?.frequent_locations) return []
    return person.frequent_locations.filter(l => l.trim())
  }, [person?.frequent_locations])

  // 處理標籤（簡化版）
  const selectedTags = useMemo(() => {
    if (!person?.tags || person.tags.length === 0) return []

    const customTagsMap = new Map<string, { id: string; label: string }>()

    if (person.custom_tags) {
      for (const tag of person.custom_tags) {
        customTagsMap.set(tag.id, tag)
      }
    }

    if (person.custom_dimensions) {
      for (const dimension of person.custom_dimensions) {
        for (const tag of dimension.options) {
          customTagsMap.set(tag.id, tag)
        }
      }
    }

    return person.tags.map(tagSelection => {
      const customTag = customTagsMap.get(tagSelection.tag_id)
      return {
        id: tagSelection.tag_id,
        label: customTag?.label || tagSelection.tag_id,
        isCustom: tagSelection.source === 'user' || tagSelection.tag_id.startsWith('usr_'),
      }
    })
  }, [person])

  if (!person) return null

  const quickFacts = [
    {
      icon: <Calendar size={24} color={SEMANTIC_COLORS.textSubtle} />,
      label: '開始攀岩',
      value: person.climbing_start_year
        ? `${person.climbing_start_year}${climbingYears !== null ? ` (${climbingYears} 年)` : ''}`
        : '從入坑那天起算',
      isEmpty: !person.climbing_start_year,
    },
    {
      icon: <MapPin size={24} color={SEMANTIC_COLORS.textSubtle} />,
      label: '常出沒地點',
      value: locations.length > 0 ? locations.join('、') : '哪裡有牆哪裡去',
      isEmpty: locations.length === 0,
    },
    {
      icon: <Activity size={24} color={SEMANTIC_COLORS.textSubtle} />,
      label: '喜歡的類型',
      value: person.favorite_route_types && person.favorite_route_types.length > 0
        ? person.favorite_route_types.join('、')
        : '能爬的都是好路線',
      isEmpty: !person.favorite_route_types || person.favorite_route_types.length === 0,
    },
  ]

  const visibleTags = showAllTags ? selectedTags : selectedTags.slice(0, tagLimit)
  const hiddenTagCount = selectedTags.length - tagLimit

  return (
    <View style={styles.container}>
      <Text variant="h3" fontWeight="600" style={styles.sectionTitle}>
        快速了解 {person.name}
      </Text>

      {/* 基本資訊卡片 */}
      <View style={styles.factsGrid}>
        {quickFacts.map((fact, index) => (
          <Animated.View
            key={fact.label}
            entering={FadeInDown.delay(index * 100).duration(400)}
            style={styles.factCard}
          >
            <View style={styles.factIcon}>{fact.icon}</View>
            <Text variant="small" color="textMuted">
              {fact.label}
            </Text>
            <Text
              variant="body"
              fontWeight="500"
              style={[styles.factValue, fact.isEmpty && styles.factValueEmpty]}
            >
              {fact.value}
            </Text>
          </Animated.View>
        ))}
      </View>

      {/* 關鍵字標籤 */}
      {selectedTags.length > 0 && (
        <View style={styles.tagsSection}>
          <Text variant="body" fontWeight="500" style={styles.tagsTitle}>
            關鍵字
          </Text>
          <View style={styles.tagsContainer}>
            {visibleTags.map(tag => (
              <View
                key={tag.id}
                style={[styles.tag, tag.isCustom && styles.tagCustom]}
              >
                {tag.isCustom && <Sparkles size={12} color="#FFE70C" />}
                <Text variant="small" style={tag.isCustom ? styles.tagTextCustom : undefined}>
                  {tag.label}
                </Text>
              </View>
            ))}

            {!showAllTags && hiddenTagCount > 0 && (
              <Pressable
                style={styles.showMoreButton}
                onPress={() => setShowAllTags(true)}
              >
                <Text variant="small" color="textMuted">
                  展開更多 (+{hiddenTagCount})
                </Text>
                <ChevronDown size={16} color={SEMANTIC_COLORS.textMuted} />
              </Pressable>
            )}

            {showAllTags && hiddenTagCount > 0 && (
              <Pressable
                style={styles.showMoreButton}
                onPress={() => setShowAllTags(false)}
              >
                <Text variant="small" color="textMuted">
                  收合
                </Text>
                <ChevronUp size={16} color={SEMANTIC_COLORS.textMuted} />
              </Pressable>
            )}
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  sectionTitle: {
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  factsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  factCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: '#F5F5F5',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
  },
  factIcon: {
    marginBottom: SPACING.sm,
  },
  factValue: {
    marginTop: 4,
    textAlign: 'center',
  },
  factValueEmpty: {
    color: SEMANTIC_COLORS.textMuted,
  },
  tagsSection: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  tagsTitle: {
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EBEAEA',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagCustom: {
    backgroundColor: 'rgba(255, 231, 12, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 231, 12, 0.5)',
  },
  tagTextCustom: {
    color: '#1B1A1A',
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: 20,
  },
})

export default QuickFactsSection
