/**
 * 標籤選擇器
 *
 * 對應 apps/web/src/components/editor/TagSelector.tsx
 */
import React, { useState, useCallback, useMemo } from 'react'
import {
  StyleSheet,
  View,
  TextInput,
  ScrollView,
  Pressable,
  FlatList,
} from 'react-native'
import { X, Search, Plus, Check } from 'lucide-react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'

import { Text, IconButton } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

interface Tag {
  id: string
  name: string
  category?: string
}

interface TagSelectorProps {
  availableTags: Tag[]
  selectedTags: string[]
  onChange: (tags: string[]) => void
  maxTags?: number
  placeholder?: string
  allowCustomTags?: boolean
  onCreateTag?: (name: string) => void
  categories?: string[]
}

interface TagChipProps {
  tag: Tag
  selected: boolean
  onPress: () => void
}

function TagChip({ tag, selected, onPress }: TagChipProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.tagChip,
        selected && styles.tagChipSelected,
        pressed && styles.tagChipPressed,
      ]}
      onPress={onPress}
    >
      {selected && (
        <Check size={14} color="#FFFFFF" />
      )}
      <Text
        variant="small"
        fontWeight={selected ? '600' : '400'}
        style={selected && styles.tagChipTextSelected}
      >
        {tag.name}
      </Text>
    </Pressable>
  )
}

interface SelectedTagChipProps {
  tag: Tag
  onRemove: () => void
}

function SelectedTagChip({ tag, onRemove }: SelectedTagChipProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={styles.selectedTagChip}
    >
      <Text variant="small" fontWeight="500" style={styles.selectedTagText}>
        {tag.name}
      </Text>
      <Pressable onPress={onRemove} style={styles.removeTagButton}>
        <X size={14} color="#FFFFFF" />
      </Pressable>
    </Animated.View>
  )
}

export function TagSelector({
  availableTags,
  selectedTags,
  onChange,
  maxTags = 10,
  placeholder = '搜尋標籤...',
  allowCustomTags = false,
  onCreateTag,
  categories = [],
}: TagSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  // 過濾標籤
  const filteredTags = useMemo(() => {
    let tags = availableTags

    // 按類別過濾
    if (activeCategory) {
      tags = tags.filter((tag) => tag.category === activeCategory)
    }

    // 按搜尋詞過濾
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      tags = tags.filter((tag) => tag.name.toLowerCase().includes(query))
    }

    return tags
  }, [availableTags, searchQuery, activeCategory])

  // 取得已選標籤的完整資料
  const selectedTagsData = useMemo(() => {
    return selectedTags
      .map((id) => availableTags.find((tag) => tag.id === id))
      .filter((tag): tag is Tag => tag !== undefined)
  }, [selectedTags, availableTags])

  // 切換標籤選取
  const handleToggleTag = useCallback(
    (tagId: string) => {
      const isSelected = selectedTags.includes(tagId)

      if (isSelected) {
        onChange(selectedTags.filter((id) => id !== tagId))
      } else {
        if (selectedTags.length >= maxTags) {
          return
        }
        onChange([...selectedTags, tagId])
      }
    },
    [selectedTags, onChange, maxTags]
  )

  // 移除標籤
  const handleRemoveTag = useCallback(
    (tagId: string) => {
      onChange(selectedTags.filter((id) => id !== tagId))
    },
    [selectedTags, onChange]
  )

  // 建立自訂標籤
  const handleCreateCustomTag = useCallback(() => {
    if (allowCustomTags && onCreateTag && searchQuery.trim()) {
      onCreateTag(searchQuery.trim())
      setSearchQuery('')
    }
  }, [allowCustomTags, onCreateTag, searchQuery])

  // 搜尋詞是否可建立為新標籤
  const canCreateCustomTag = useMemo(() => {
    if (!allowCustomTags || !searchQuery.trim()) return false
    const query = searchQuery.toLowerCase()
    return !availableTags.some((tag) => tag.name.toLowerCase() === query)
  }, [allowCustomTags, searchQuery, availableTags])

  const renderTagItem = ({ item }: { item: Tag }) => (
    <TagChip
      tag={item}
      selected={selectedTags.includes(item.id)}
      onPress={() => handleToggleTag(item.id)}
    />
  )

  return (
    <View style={styles.container}>
      {/* 已選標籤 */}
      {selectedTagsData.length > 0 && (
        <View style={styles.selectedTagsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectedTagsList}
          >
            {selectedTagsData.map((tag) => (
              <SelectedTagChip
                key={tag.id}
                tag={tag}
                onRemove={() => handleRemoveTag(tag.id)}
              />
            ))}
          </ScrollView>
          <Text variant="small" color="textMuted" style={styles.tagCount}>
            {selectedTags.length}/{maxTags}
          </Text>
        </View>
      )}

      {/* 搜尋欄 */}
      <View style={styles.searchContainer}>
        <Search size={18} color={SEMANTIC_COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={placeholder}
          placeholderTextColor={SEMANTIC_COLORS.textMuted}
        />
        {searchQuery.length > 0 && (
          <IconButton
            icon={<X size={16} color={SEMANTIC_COLORS.textMuted} />}
            onPress={() => setSearchQuery('')}
            variant="ghost"
          />
        )}
      </View>

      {/* 類別過濾 */}
      {categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
          style={styles.categoriesContainer}
        >
          <Pressable
            style={[
              styles.categoryChip,
              !activeCategory && styles.categoryChipActive,
            ]}
            onPress={() => setActiveCategory(null)}
          >
            <Text
              variant="small"
              fontWeight={!activeCategory ? '600' : '400'}
            >
              全部
            </Text>
          </Pressable>
          {categories.map((category) => (
            <Pressable
              key={category}
              style={[
                styles.categoryChip,
                activeCategory === category && styles.categoryChipActive,
              ]}
              onPress={() => setActiveCategory(category)}
            >
              <Text
                variant="small"
                fontWeight={activeCategory === category ? '600' : '400'}
              >
                {category}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* 標籤列表 */}
      <View style={styles.tagsContainer}>
        <FlatList
          data={filteredTags}
          renderItem={renderTagItem}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.tagsList}
          columnWrapperStyle={styles.tagsRow}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              {canCreateCustomTag ? (
                <Pressable
                  style={styles.createTagButton}
                  onPress={handleCreateCustomTag}
                >
                  <Plus size={16} color={SEMANTIC_COLORS.textMain} />
                  <Text variant="body" fontWeight="500">
                    建立「{searchQuery}」標籤
                  </Text>
                </Pressable>
              ) : (
                <Text variant="body" color="textMuted">
                  找不到符合的標籤
                </Text>
              )}
            </View>
          }
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  selectedTagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    gap: SPACING.sm,
  },
  selectedTagsList: {
    flexDirection: 'row',
    gap: SPACING.xs,
    flex: 1,
  },
  selectedTagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SEMANTIC_COLORS.textMain,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  selectedTagText: {
    color: '#FFFFFF',
  },
  removeTagButton: {
    padding: 2,
  },
  tagCount: {
    marginLeft: 'auto',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    margin: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: SEMANTIC_COLORS.textMain,
  },
  categoriesContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  categoriesList: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  categoryChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    backgroundColor: '#F5F5F5',
  },
  categoryChipActive: {
    backgroundColor: '#FFE70C',
  },
  tagsContainer: {
    maxHeight: 250,
  },
  tagsList: {
    padding: SPACING.md,
  },
  tagsRow: {
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  tagChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    gap: 4,
  },
  tagChipSelected: {
    backgroundColor: SEMANTIC_COLORS.textMain,
  },
  tagChipPressed: {
    opacity: 0.7,
  },
  tagChipTextSelected: {
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  createTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
})
