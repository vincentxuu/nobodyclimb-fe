/**
 * BiographyTags 組件
 *
 * 標籤展示，對應 apps/web/src/components/biography/display/BiographyTags.tsx
 */
import React, { useState, useMemo } from 'react'
import { StyleSheet, View, Pressable } from 'react-native'
import { Tag, ChevronDown, ChevronUp, Sparkles } from 'lucide-react-native'

import { Text } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

// 類型定義
interface TagSelection {
  tag_id: string
  source?: string
}

interface TagOption {
  id: string
  label: string
  is_dynamic?: boolean
}

interface BiographyV2 {
  id: string
  tags?: TagSelection[]
  custom_tags?: TagOption[]
  custom_dimensions?: Array<{ options: TagOption[] }>
  [key: string]: any
}

interface BiographyTagsProps {
  biography: BiographyV2
  mobileLimit?: number
}

/**
 * 標籤展示組件
 */
export function BiographyTags({ biography, mobileLimit = 8 }: BiographyTagsProps) {
  const [showAll, setShowAll] = useState(false)

  // 將選中的標籤整理為扁平列表
  const selectedTags = useMemo(() => {
    if (!biography.tags || biography.tags.length === 0) return []

    // 建立自訂標籤查找表
    const customTagsMap = new Map<string, TagOption>()

    // 加入用戶自訂標籤
    if (biography.custom_tags) {
      for (const tag of biography.custom_tags) {
        customTagsMap.set(tag.id, tag)
      }
    }

    // 加入用戶自訂維度中的所有標籤
    if (biography.custom_dimensions) {
      for (const dimension of biography.custom_dimensions) {
        for (const tag of dimension.options) {
          customTagsMap.set(tag.id, tag)
        }
      }
    }

    // 判斷是否為自訂標籤
    const isCustomTag = (tagSelection: TagSelection) => {
      if (tagSelection.source === 'user') return true
      if (customTagsMap.has(tagSelection.tag_id)) return true
      if (tagSelection.tag_id.startsWith('usr_')) return true
      return false
    }

    const customTags: Array<{ id: string; label: string; isCustom: boolean }> = []
    const systemTags: Array<{ id: string; label: string; isCustom: boolean }> = []

    for (const tagSelection of biography.tags) {
      const option = customTagsMap.get(tagSelection.tag_id)
      if (option) {
        const tag = {
          id: tagSelection.tag_id,
          label: option.label,
          isCustom: isCustomTag(tagSelection),
        }
        if (tag.isCustom) {
          customTags.push(tag)
        } else {
          systemTags.push(tag)
        }
      } else {
        // 如果找不到標籤定義，使用 tag_id 作為標籤
        const tag = {
          id: tagSelection.tag_id,
          label: tagSelection.tag_id,
          isCustom: isCustomTag(tagSelection),
        }
        if (tag.isCustom) {
          customTags.push(tag)
        } else {
          systemTags.push(tag)
        }
      }
    }

    // 自訂標籤優先
    return [...customTags, ...systemTags]
  }, [biography])

  if (selectedTags.length === 0) {
    return null
  }

  const visibleTags = showAll ? selectedTags : selectedTags.slice(0, mobileLimit)
  const hiddenCount = selectedTags.length - mobileLimit

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Tag size={18} color={SEMANTIC_COLORS.textSubtle} />
        <Text variant="body" fontWeight="600">
          關鍵字
        </Text>
      </View>

      <View style={styles.tagsContainer}>
        {visibleTags.map((tag) => (
          <View
            key={tag.id}
            style={[styles.tag, tag.isCustom && styles.customTag]}
          >
            {tag.isCustom && <Sparkles size={12} color="#FFE70C" />}
            <Text
              variant="small"
              fontWeight="500"
              style={tag.isCustom ? styles.customTagText : styles.tagText}
            >
              {tag.label}
            </Text>
          </View>
        ))}

        {/* 展開更多按鈕 */}
        {!showAll && hiddenCount > 0 && (
          <Pressable style={styles.expandButton} onPress={() => setShowAll(true)}>
            <Text variant="small" color="textMuted">
              展開更多標籤 (+{hiddenCount})
            </Text>
            <ChevronDown size={16} color={SEMANTIC_COLORS.textMuted} />
          </Pressable>
        )}

        {/* 收合按鈕 */}
        {showAll && hiddenCount > 0 && (
          <Pressable style={styles.expandButton} onPress={() => setShowAll(false)}>
            <Text variant="small" color="textMuted">
              收合
            </Text>
            <ChevronUp size={16} color={SEMANTIC_COLORS.textMuted} />
          </Pressable>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#EBEAEA',
  },
  customTag: {
    backgroundColor: 'rgba(255, 231, 12, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 231, 12, 0.5)',
  },
  tagText: {
    color: SEMANTIC_COLORS.textSubtle,
  },
  customTagText: {
    color: SEMANTIC_COLORS.textMain,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
  },
})

export default BiographyTags
