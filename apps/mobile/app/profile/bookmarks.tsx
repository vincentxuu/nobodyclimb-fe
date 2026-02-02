/**
 * 收藏頁面
 *
 * 對應 apps/web/src/app/profile/bookmarks/page.tsx
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
  Mountain,
  Building2,
  Users,
  ChevronRight,
} from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'

import { Text, IconButton, Tabs, TabsList, TabsTrigger } from '@/components/ui'
import { ProtectedRoute } from '@/components/shared'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

type BookmarkType = 'all' | 'article' | 'crag' | 'gym' | 'biography'

interface BookmarkItem {
  id: string
  type: BookmarkType
  title: string
  subtitle?: string
  image?: string
}

// 模擬資料
const MOCK_BOOKMARKS: BookmarkItem[] = [
  {
    id: '1',
    type: 'article',
    title: '攀岩入門指南',
    subtitle: '攀岩小編',
    image: 'https://picsum.photos/100?random=60',
  },
  {
    id: '2',
    type: 'crag',
    title: '龍洞',
    subtitle: '新北市貢寮區',
  },
  {
    id: '3',
    type: 'gym',
    title: 'RedRock',
    subtitle: '台北市內湖區',
  },
  {
    id: '4',
    type: 'biography',
    title: '攀岩達人',
    subtitle: '攀岩 10 年',
    image: 'https://picsum.photos/100?random=61',
  },
]

const TYPE_ICONS: Record<BookmarkType, React.ComponentType<{ size: number; color: string }>> = {
  all: Bookmark,
  article: FileText,
  crag: Mountain,
  gym: Building2,
  biography: Users,
}

const TYPE_LABELS: Record<BookmarkType, string> = {
  all: '全部',
  article: '文章',
  crag: '岩場',
  gym: '岩館',
  biography: '人物誌',
}

interface BookmarkCardProps {
  item: BookmarkItem
  onPress: () => void
  index: number
}

function BookmarkCard({ item, onPress, index }: BookmarkCardProps) {
  const Icon = TYPE_ICONS[item.type]

  return (
    <Animated.View entering={FadeInDown.duration(300).delay(index * 50)}>
      <Pressable
        style={({ pressed }) => [
          styles.bookmarkItem,
          pressed && styles.bookmarkItemPressed,
        ]}
        onPress={onPress}
      >
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={styles.bookmarkImage}
            contentFit="cover"
          />
        ) : (
          <View style={styles.bookmarkIconContainer}>
            <Icon size={24} color={SEMANTIC_COLORS.textSubtle} />
          </View>
        )}
        <View style={styles.bookmarkContent}>
          <Text variant="body" fontWeight="500">
            {item.title}
          </Text>
          {item.subtitle && (
            <Text variant="small" color="textMuted">
              {item.subtitle}
            </Text>
          )}
        </View>
        <View style={styles.typeBadge}>
          <Text variant="small" color="textMuted">
            {TYPE_LABELS[item.type]}
          </Text>
        </View>
        <ChevronRight size={18} color={SEMANTIC_COLORS.textMuted} />
      </Pressable>
    </Animated.View>
  )
}

export default function BookmarksScreen() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<BookmarkType>('all')
  const [bookmarks] = useState<BookmarkItem[]>(MOCK_BOOKMARKS)
  const [isLoading] = useState(false)

  const handleBack = () => {
    router.back()
  }

  const handleBookmarkPress = useCallback(
    (item: BookmarkItem) => {
      switch (item.type) {
        case 'article':
          router.push(`/blog/${item.id}` as any)
          break
        case 'crag':
          router.push(`/crag/${item.id}` as any)
          break
        case 'gym':
          router.push(`/gym/${item.id}` as any)
          break
        case 'biography':
          router.push(`/biography/${item.id}` as any)
          break
      }
    },
    [router]
  )

  const filteredBookmarks =
    activeTab === 'all'
      ? bookmarks
      : bookmarks.filter((item) => item.type === activeTab)

  const renderItem = ({ item, index }: { item: BookmarkItem; index: number }) => (
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

        {/* 分類標籤 */}
        <View style={styles.tabsContainer}>
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as BookmarkType)}
          >
            <TabsList>
              {Object.entries(TYPE_LABELS).map(([key, label]) => (
                <TabsTrigger key={key} value={key}>
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </View>

        {/* 列表 */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={SEMANTIC_COLORS.textMain} />
          </View>
        ) : filteredBookmarks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Bookmark size={48} color={SEMANTIC_COLORS.textMuted} />
            <Text variant="body" color="textSubtle" style={styles.emptyText}>
              還沒有收藏
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredBookmarks}
            renderItem={renderItem}
            keyExtractor={(item) => `${item.type}-${item.id}`}
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
  tabsContainer: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
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
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
  },
  bookmarkIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
