/**
 * StoryModal 組件
 *
 * 故事詳情彈窗，對應 apps/web/src/components/biography/profile/StoryModal.tsx
 */
import React from 'react'
import { StyleSheet, View, Pressable, Modal, ScrollView } from 'react-native'
import { X } from 'lucide-react-native'
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated'

import { Text } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

// 分類類型
type StoryCategory = 'growth' | 'psychology' | 'community' | 'practical' | 'dreams' | 'life'

interface StoryModalProps {
  story: {
    title: string
    content: string
    category: StoryCategory
  } | null
  open: boolean
  onClose: () => void
}

// 分類顏色映射
const CATEGORY_COLORS: Record<StoryCategory, { bg: string; text: string }> = {
  growth: { bg: 'rgba(251, 191, 36, 0.2)', text: '#B45309' },
  psychology: { bg: 'rgba(168, 85, 247, 0.2)', text: '#7C3AED' },
  community: { bg: 'rgba(59, 130, 246, 0.2)', text: '#2563EB' },
  practical: { bg: 'rgba(34, 197, 94, 0.2)', text: '#16A34A' },
  dreams: { bg: 'rgba(236, 72, 153, 0.2)', text: '#DB2777' },
  life: { bg: 'rgba(20, 184, 166, 0.2)', text: '#0D9488' },
}

// 分類名稱映射
const CATEGORY_NAMES: Record<StoryCategory, string> = {
  growth: '成長故事',
  psychology: '心理挑戰',
  community: '社群故事',
  practical: '實用技巧',
  dreams: '夢想目標',
  life: '生活平衡',
}

/**
 * 故事詳情 Modal
 */
export function StoryModal({ story, open, onClose }: StoryModalProps) {
  if (!story) return null

  const colors = CATEGORY_COLORS[story.category]
  const categoryName = CATEGORY_NAMES[story.category]

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* 背景遮罩 */}
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View entering={FadeIn.duration(200)} style={styles.backdropInner} />
      </Pressable>

      {/* Modal 內容 */}
      <Animated.View
        entering={SlideInUp.duration(300).springify()}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          {/* 關閉按鈕 */}
          <Pressable style={styles.closeButton} onPress={onClose}>
            <X size={20} color={SEMANTIC_COLORS.textMuted} />
          </Pressable>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* 分類標籤 */}
            <View style={[styles.categoryTag, { backgroundColor: colors.bg }]}>
              <Text variant="small" style={{ color: colors.text }}>
                {categoryName}
              </Text>
            </View>

            {/* 標題 */}
            <Text variant="h3" fontWeight="700" style={styles.title}>
              {story.title}
            </Text>

            {/* 內容 */}
            <Text variant="body" color="textSubtle" style={styles.content}>
              {story.content}
            </Text>
          </ScrollView>
        </View>
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropInner: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '80%',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    padding: SPACING.sm,
    zIndex: 10,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.md,
  },
  title: {
    marginBottom: SPACING.lg,
  },
  content: {
    lineHeight: 28,
    paddingBottom: SPACING.xl,
  },
})

export default StoryModal
