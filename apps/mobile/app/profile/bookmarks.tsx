/**
 * 收藏頁面
 *
 * 對應 apps/web/src/app/profile/bookmarks/page.tsx
 * 使用 GET /posts/liked 取得用戶按讚/收藏的文章
 */
import React, { useState, useCallback } from 'react'
import {
  StyleSheet,
  View,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Image } from 'expo-image'
import {
  ChevronLeft,
  Bookmark,
  FileText,
  ChevronRight,
} from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'

import { Text, IconButton } from '@/components/ui'
import { ProtectedRoute } from '@/components/shared'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'
import { useBookmarks, type BookmarkedPost } from '@/lib/hooks'

interface BookmarkCardProps {
  item: BookmarkedPost
  onPress: () => void
  index: number
}

function BookmarkCard({ item, onPress, index }: BookmarkCardProps) {
  return (
    <Animated.View entering={FadeInDown.duration(300).delay(index * 50)}>
      <Pressable
        style={({ pressed }) => [
          styles.bookmarkItem,
          pressed && styles.bookmarkItemPressed,
        ]}
        onPress={onPress}
      >
        {item.cover_image ? (
          <Image
            source={{ uri: item.cover_image }}
            style={styles.bookmarkImage}
            contentFit="cover"
          />
        ) : (
          <View style={styles.bookmarkIconContainer}>
            <FileText size={24} color={SEMANTIC_COLORS.textSubtle} />
          </View>
        )}
        <View style={styles.bookmarkContent}>
          <Text variant="body" fontWeight="500" numberOfLines={2}>
            {item.title}
          </Text>
          {item.display_name && (
            <Text variant="small" color="textMuted">
              {item.display_name}
            </Text>
          )}
        </View>
        {item.category && (
          <View style={styles.typeBadge}>
            <Text variant="small" color="textMuted">
              {item.category}
            </Text>
          </View>
        )}
        <ChevronRight size={18} color={SEMANTIC_COLORS.textMuted} />
      </Pressable>
    </Animated.View>
  )
}

export default function BookmarksScreen() {
  const router = useRouter()
  const { data, isLoading, isError, refetch } = useBookmarks()

  const bookmarks = data?.posts ?? []

  const handleBack = () => {
    router.back()
  }

  const handleBookmarkPress = useCallback(
    (item: BookmarkedPost) => {
      router.push(`/blog/${item.slug || item.id}` as any)
    },
    [router]
  )

  const renderItem = ({ item, index }: { item: BookmarkedPost; index: number }) => (
    <BookmarkCard
      item={item}
      onPress={() => handleBookmarkPress(item)}
      index={index}
    />
  )

  return (
    <ProtectedRoute>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* 導航列 */}
        <View style={styles.header}>
          <IconButton
            icon={<ChevronLeft size={24} color={SEMANTIC_COLORS.textMain} />}
            onPress={handleBack}
            variant="ghost"
          />
          <Text variant="h3" fontWeight="600">
            我的收藏
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* 列表 */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={SEMANTIC_COLORS.textMain} />
          </View>
        ) : isError ? (
          <View style={styles.emptyContainer}>
            <Bookmark size={48} color={SEMANTIC_COLORS.textMuted} />
            <Text variant="body" color="textSubtle" style={styles.emptyText}>
              載入失敗，請重試
            </Text>
            <Pressable onPress={() => refetch()}>
              <Text variant="body" color="textMain" fontWeight="600">
                重試
              </Text>
            </Pressable>
          </View>
        ) : bookmarks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Bookmark size={48} color={SEMANTIC_COLORS.textMuted} />
            <Text variant="body" color="textSubtle" style={styles.emptyText}>
              還沒有收藏
            </Text>
          </View>
        ) : (
          <FlatList
            data={bookmarks}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
          />
        )}
      </SafeAreaView>
    </ProtectedRoute>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SEMANTIC_COLORS.pageBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  placeholder: {
    width: 40,
  },
  listContent: {
    padding: SPACING.md,
  },
  bookmarkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SEMANTIC_COLORS.cardBg,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  bookmarkItemPressed: {
    backgroundColor: '#F5F5F5',
  },
  bookmarkImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  bookmarkIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkContent: {
    flex: 1,
  },
  typeBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  emptyText: {
    marginTop: SPACING.sm,
  },
})
